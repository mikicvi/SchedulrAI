import { getChromaStatus, getChromaCollection, resetChromaCollection } from '../../services/chromaServices';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';

jest.mock('chromadb', () => ({
	ChromaClient: jest.fn().mockImplementation(() => ({
		heartbeat: jest.fn(),
		getOrCreateCollection: jest.fn(),
		deleteCollection: jest.fn(),
	})),
	OllamaEmbeddingFunction: jest.fn(),
}));

describe('chromaServices', () => {
	const mockHeartbeat = jest.fn();
	const mockGetOrCreateCollection = jest.fn();
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
			getOrCreateCollection: mockGetOrCreateCollection,
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
		it('should call ChromaClient.getOrCreateCollection with correct parameters', async () => {
			const collectionName = 'testCollection';
			const mockResponse = { name: collectionName };
			mockGetOrCreateCollection.mockResolvedValue(mockResponse);

			const result = await getChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: 'http://localhost:8000',
				auth: {
					provider: 'basic',
					credentials: 'test-credentials',
				},
			});
			expect(OllamaEmbeddingFunction).toHaveBeenCalledWith({
				url: 'http://localhost:11434/api/embeddings',
				model: 'test-model',
			});
			expect(mockGetOrCreateCollection).toHaveBeenCalledWith({
				name: collectionName,
				embeddingFunction: expect.any(OllamaEmbeddingFunction),
			});
			expect(result).toEqual(mockResponse);
		});

		it('should handle collection creation errors', async () => {
			mockGetOrCreateCollection.mockRejectedValue(new Error('Collection creation failed'));
			await expect(getChromaCollection('test')).rejects.toThrow('Collection creation failed');
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
	});
});
