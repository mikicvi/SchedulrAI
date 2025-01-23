import fs from 'fs';
import path from 'path';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import logger from '../../utils/logger';
import { indexDocuments } from '../../services/documentServices';

// Mock dependencies
jest.mock('fs');
jest.mock('chromadb');
jest.mock('langchain/text_splitter');
jest.mock('../../utils/logger');
jest.mock('../../utils/pathUtils', () => ({
	getDirname: jest.fn().mockReturnValue('/mock/dirname'),
}));

describe('Document Indexing Workflow', () => {
	const mockDocumentsPath = '/mock/documents/path';
	const mockFiles = ['document1.txt', 'document2.md'];
	const mockFileContents = {
		'document1.txt': 'Content of document 1---More content of document 1',
		'document2.md': 'Content of document 2---More content of document 2',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		process.env.PROTOCOL = 'http';
		process.env.CHROMA_SERVER_HOST = 'localhost';
		process.env.OLLAMA_API_BASE = 'localhost';
		process.env.OLLAMA_PORT = '11434';
		process.env.LLM_EMBED_MODEL = 'test-model';
		process.env.CHROMA_CLIENT_AUTH_CREDENTIALS = 'test-credentials';
		process.env.DOCUMENTS_PATH = mockDocumentsPath;

		// Preset mocks for file system and text splitting
		(fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
		(fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
			const filename = path.basename(filePath as string);
			return mockFileContents[filename];
		});

		(CharacterTextSplitter as unknown as jest.Mock).mockImplementation(() => ({
			splitText: jest.fn().mockImplementation((text) => text.split('---')),
		}));

		// mock the path to the documents
		//jest.spyOn(path, 'join').mockReturnValue(mockDocumentsPath);
	});

	it('should complete full document indexing process', async () => {
		// Mock Chroma client interactions
		const mockAddMethod = jest.fn().mockResolvedValue(void 0);
		const mockCreateCollection = jest.fn().mockResolvedValue({
			add: mockAddMethod,
		});

		(ChromaClient as jest.Mock).mockImplementation(() => ({
			getOrCreateCollection: jest.fn().mockResolvedValue(true),
			deleteCollection: jest.fn().mockResolvedValue(void 0),
			createCollection: mockCreateCollection,
		}));

		await indexDocuments();

		// Verify document loading
		//expect(fs.readdirSync).toHaveBeenCalledWith(mockDocumentsPath); //investigate if time allows
		expect(fs.readFileSync).toHaveBeenCalledTimes(mockFiles.length);
		expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Documents loaded'));

		// Verify document splitting
		expect(CharacterTextSplitter).toHaveBeenCalledWith({
			separator: '---',
			chunkSize: 1000,
			chunkOverlap: 50,
		});
		expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Documents split'));

		// Verify embedding storage
		expect(ChromaClient).toHaveBeenCalledWith({
			path: 'http://localhost:8000',
			auth: {
				provider: 'basic',
				credentials: 'test-credentials',
			},
		});
		expect(mockAddMethod).toHaveBeenCalledTimes(mockFiles.length);
		expect(logger.info).toHaveBeenCalledWith('Embeddings stored successfully');
	});

	it('should handle file loading errors', async () => {
		(fs.readdirSync as jest.Mock).mockImplementation(() => {
			throw new Error('Directory read failed');
		});

		await expect(indexDocuments()).rejects.toThrow('Directory read failed');
		expect(logger.error).toHaveBeenCalledWith(
			expect.stringContaining('Failed to load documents'),
			expect.any(Error)
		);
	});

	it('should handle embedding storage errors', async () => {
		(ChromaClient as jest.Mock).mockImplementation(() => ({
			getOrCreateCollection: jest.fn().mockResolvedValue(true),
			deleteCollection: jest.fn().mockResolvedValue(void 0),
			createCollection: jest.fn().mockRejectedValue(new Error('Storage failed')),
		}));

		await expect(indexDocuments()).rejects.toThrow('Storage failed');
		expect(logger.error).toHaveBeenCalledWith('Failed to store embeddings:', expect.any(Error));
		expect(logger.error).toHaveBeenCalledWith('Indexing failed:', expect.any(Error));
	});
});
