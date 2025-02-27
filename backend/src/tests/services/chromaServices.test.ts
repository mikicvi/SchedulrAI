import { getChromaStatus, getChromaCollection, resetChromaCollection } from '../../services/chromaServices';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';

jest.mock('chromadb', () => ({
	ChromaClient: jest.fn().mockImplementation(() => ({
		heartbeat: jest.fn(),
		getCollection: jest.fn(),
	})),
	OllamaEmbeddingFunction: jest.fn(),
}));

describe('chromaServices', () => {
	const mockHeartbeat = jest.fn();
	const mockGetCollection = jest.fn();

	beforeEach(() => {
		(ChromaClient as jest.Mock).mockReturnValue({
			heartbeat: mockHeartbeat,
			getCollection: mockGetCollection,
		});
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getChromaStatus', () => {
		it('should call ChromaClient.heartbeat and return the result', async () => {
			const mockResponse = { status: 'ok' };
			mockHeartbeat.mockResolvedValue(mockResponse);

			const result = await getChromaStatus();

			expect(ChromaClient).toHaveBeenCalledWith({
				path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
				auth: {
					provider: 'basic',
					credentials: process.env.CHROMA_SERVER_AUTHN_CREDENTIALS,
				},
			});
			expect(mockHeartbeat).toHaveBeenCalled();
			expect(result).toEqual(mockResponse);
		});
	});

	describe('getChromaCollection', () => {
		it('should call ChromaClient.getCollection with the correct parameters and return the result', async () => {
			const collectionName = 'testCollection';
			const mockResponse = { name: collectionName };
			mockGetCollection.mockResolvedValue(mockResponse);

			const result = await getChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
				auth: {
					provider: 'basic',
					credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS,
				},
			});
			expect(OllamaEmbeddingFunction).toHaveBeenCalledWith({
				url: `${process.env.PROTOCOL}://${process.env.OLLAMA_API_BASE}:${process.env.OLLAMA_PORT}/api/embeddings`,
				model: process.env.LLM_EMBED_MODEL,
			});
			expect(mockGetCollection).toHaveBeenCalledWith({
				name: collectionName,
				embeddingFunction: expect.any(OllamaEmbeddingFunction),
			});
			expect(result).toEqual(mockResponse);
		});
	});
	describe('resetChromaCollection', () => {
		it('should call ChromaClient.deleteCollection with the correct parameters', async () => {
			const mockDeleteCollection = jest.fn();
			(ChromaClient as jest.Mock).mockReturnValue({
				deleteCollection: mockDeleteCollection,
			});

			const collectionName = 'testCollection';
			const mockResponse = { success: true };
			mockDeleteCollection.mockResolvedValue(mockResponse);

			const result = await resetChromaCollection(collectionName);

			expect(ChromaClient).toHaveBeenCalledWith({
				path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
				auth: {
					provider: 'basic',
					credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS,
				},
			});
			expect(mockDeleteCollection).toHaveBeenCalledWith({
				name: collectionName,
			});
			expect(result).toEqual(mockResponse);
		});
	});
});
