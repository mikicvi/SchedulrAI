import {
	getChromaStatus,
	getChromaCollection,
	resetChromaCollection,
	createChromaCollection,
} from '../../services/chromaServices';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';

jest.mock('chromadb', () => ({
	ChromaClient: jest.fn().mockImplementation(() => ({
		heartbeat: jest.fn(),
		getCollection: jest.fn(),
		createCollection: jest.fn(),
		deleteCollection: jest.fn(),
	})),
	OllamaEmbeddingFunction: jest.fn(),
}));

describe('chromaServices', () => {
	const mockHeartbeat = jest.fn();
	const mockGetCollection = jest.fn();
	const mockCreateCollection = jest.fn();
	const mockDeleteCollection = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.PROTOCOL = 'http';
		process.env.CHROMA_SERVER_HOST = 'localhost';
		process.env.CHROMA_CLIENT_AUTH_CREDENTIALS = 'test-credentials';
		process.env.OLLAMA_API_BASE = 'localhost';
		process.env.OLLAMA_PORT = '11434';
		process.env.LLM_EMBED_MODEL = 'test-model';

		(ChromaClient as jest.Mock).mockReturnValue({
			heartbeat: mockHeartbeat,
			getCollection: mockGetCollection,
			createCollection: mockCreateCollection,
			deleteCollection: mockDeleteCollection,
		});
	});

	describe('getChromaStatus', () => {
		it('should call ChromaClient.heartbeat and return the result', async () => {
			const mockResponse = { status: 'ok' };
			mockHeartbeat.mockResolvedValue(mockResponse);

			const result = await getChromaStatus();

			expect(ChromaClient).toHaveBeenCalledWith({
				path: 'http://localhost:8000',
				auth: {
					provider: 'basic',
					credentials: 'test-credentials',
				},
			});
			expect(mockHeartbeat).toHaveBeenCalled();
			expect(result).toEqual(mockResponse);
		});

		it('should handle heartbeat errors', async () => {
			mockHeartbeat.mockRejectedValue(new Error('Connection failed'));
			await expect(getChromaStatus()).rejects.toThrow('Connection failed');
		});
	});

	describe('getChromaCollection', () => {
		it('should get existing collection', async () => {
			const collectionName = 'testCollection';
			const mockResponse = { name: collectionName };
			mockGetCollection.mockResolvedValue(mockResponse);

			const result = await getChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: 'http://localhost:8000',
				auth: {
					provider: 'basic',
					credentials: 'test-credentials',
				},
			});
			expect(mockGetCollection).toHaveBeenCalledWith({
				name: collectionName,
				embeddingFunction: expect.any(OllamaEmbeddingFunction),
			});
			expect(result).toEqual(mockResponse);
		});

		it('should handle collection errors', async () => {
			mockGetCollection.mockRejectedValue(new Error('Collection error'));
			await expect(getChromaCollection('test')).rejects.toThrow('Collection error');
		});
	});

	describe('createChromaCollection', () => {
		it('should create a new collection', async () => {
			const collectionName = 'testCollection';
			const mockResponse = { name: collectionName };
			mockCreateCollection.mockResolvedValue(mockResponse);

			const result = await createChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: 'http://localhost:8000',
				auth: {
					provider: 'basic',
					credentials: 'test-credentials',
				},
			});
			expect(mockCreateCollection).toHaveBeenCalledWith({
				name: collectionName,
				embeddingFunction: expect.any(OllamaEmbeddingFunction),
			});
			expect(result).toEqual(mockResponse);
		});

		it('should handle creation errors', async () => {
			mockCreateCollection.mockRejectedValue(new Error('Creation failed'));
			await expect(createChromaCollection('test')).rejects.toThrow('Creation failed');
		});
	});

	describe('resetChromaCollection', () => {
		it('should call ChromaClient.deleteCollection with correct parameters', async () => {
			const collectionName = 'testCollection';
			mockDeleteCollection.mockResolvedValue({ success: true });

			await resetChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: 'http://localhost:8000',
				auth: {
					provider: 'basic',
					credentials: 'test-credentials',
				},
			});
			expect(mockDeleteCollection).toHaveBeenCalledWith({ name: collectionName });
		});

		it('should handle deletion errors', async () => {
			mockDeleteCollection.mockRejectedValue(new Error('Deletion failed'));
			await expect(resetChromaCollection('test')).rejects.toThrow('Deletion failed');
		});

		it('should handle non-existent collection gracefully', async () => {
			const collectionName = 'nonExistentCollection';
			const nonExistentError = new Error('Collection nonExistentCollection does not exist');
			mockDeleteCollection.mockRejectedValue(nonExistentError);

			const result = await resetChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: 'http://localhost:8000',
				auth: {
					provider: 'basic',
					credentials: 'test-credentials',
				},
			});
			expect(mockDeleteCollection).toHaveBeenCalledWith({ name: collectionName });
			expect(result).toEqual({ success: true });
		});
	});
});
