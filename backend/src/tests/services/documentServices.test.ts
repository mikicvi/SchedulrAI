import fs from 'fs';
import path from 'path';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import logger from '../../utils/logger';
import { createDocument, deleteDocument, indexDocuments, listDocuments } from '../../services/documentServices';

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

		// Preset mocks for file system and text splitting
		(fs.readdirSync as jest.Mock).mockReturnValue(mockFiles);
		(fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
			const filename = path.basename(filePath as string);
			return mockFileContents[filename];
		});

		(CharacterTextSplitter as unknown as jest.Mock).mockImplementation(() => ({
			splitText: jest.fn().mockImplementation((text) => text.split('---')),
		}));

		(fs.existsSync as jest.Mock).mockReturnValue(true);
		// mock the path to the documents
		//jest.spyOn(path, 'join').mockReturnValue(mockDocumentsPath);

		// ChromaClient mock implementation with proper method structure
		const mockCollection = {
			get: jest.fn().mockResolvedValue({ ids: [] }),
			add: jest.fn().mockResolvedValue(void 0),
			delete: jest.fn().mockResolvedValue(void 0),
		};

		(ChromaClient as jest.Mock).mockImplementation(() => ({
			heartbeat: jest.fn(),
			getCollection: jest.fn().mockResolvedValue(mockCollection),
			createCollection: jest.fn().mockResolvedValue(mockCollection),
			deleteCollection: jest.fn(),
		}));
	});

	it('should complete full document indexing process', async () => {
		const mockCollection = {
			get: jest.fn().mockResolvedValue({ ids: [] }),
			add: jest.fn().mockResolvedValue(void 0),
			delete: jest.fn().mockResolvedValue(void 0),
		};

		(ChromaClient as jest.Mock).mockImplementation(() => ({
			getCollection: jest.fn().mockResolvedValue(mockCollection),
			createCollection: jest.fn().mockResolvedValue(mockCollection),
		}));

		await indexDocuments();

		expect(mockCollection.add).toHaveBeenCalledTimes(mockFiles.length);
		expect(logger.info).toHaveBeenCalledWith('Embeddings stored successfully');
	});

	it('should handle file loading errors', async () => {
		(fs.readdirSync as jest.Mock).mockImplementation(() => {
			throw new Error('Directory read failed');
		});

		const mockCollection = {
			get: jest.fn(),
			add: jest.fn(),
			delete: jest.fn(),
		};

		(ChromaClient as jest.Mock).mockImplementation(() => ({
			createCollection: jest.fn().mockResolvedValue(mockCollection),
		}));

		await expect(indexDocuments()).rejects.toThrow('Directory read failed');
	});

	it('should handle embedding storage errors', async () => {
		const mockCollection = {
			get: jest.fn().mockResolvedValue({ ids: [] }),
			add: jest.fn().mockRejectedValue(new Error('Storage failed')),
			delete: jest.fn(),
		};

		(ChromaClient as jest.Mock).mockImplementation(() => ({
			getCollection: jest.fn().mockResolvedValue(mockCollection),
			createCollection: jest.fn().mockResolvedValue(mockCollection),
		}));

		await expect(indexDocuments()).rejects.toThrow('Storage failed');
		expect(logger.error).toHaveBeenCalledWith('Failed to store embeddings:', expect.any(Error));
	});

	describe('listDocuments', () => {
		it('should return empty array when documents directory does not exist', async () => {
			(fs.existsSync as jest.Mock).mockReturnValue(false);
			const result = await listDocuments();
			expect(result).toEqual([]);
		});

		it('should return list of documents with content', async () => {
			(fs.readdirSync as jest.Mock).mockReturnValue(['doc1.md', 'doc2.md']);
			(fs.readFileSync as jest.Mock).mockImplementation((path) => `content of ${path}`);

			const result = await listDocuments();
			expect(result).toHaveLength(2);
			expect(result[0]).toHaveProperty('name', 'doc1.md');
			expect(result[0]).toHaveProperty('content');
		});

		it('should handle errors when listing documents', async () => {
			(fs.readdirSync as jest.Mock).mockImplementation(() => {
				throw new Error('Failed to read directory');
			});

			await expect(listDocuments()).rejects.toThrow('Failed to read directory');
			expect(logger.error).toHaveBeenCalledWith('Failed to list documents:', expect.any(Error));
		});
	});

	describe('createDocument', () => {
		beforeEach(() => {
			jest.resetModules();
			process.env.DOCUMENTS_PATH = mockDocumentsPath;
		});

		it('should create document directory if it does not exist', async () => {
			(fs.existsSync as jest.Mock).mockReturnValueOnce(false);
			await createDocument('test', 'content');
			expect(fs.mkdirSync).toHaveBeenCalledWith(mockDocumentsPath, { recursive: true });
		});
		it('should write file with sanitized filename', async () => {
			await createDocument('Test Title!', 'test content');
			expect(fs.writeFileSync).toHaveBeenCalledWith(
				expect.stringContaining('test-title.md'),
				'test content',
				'utf-8'
			);
		});

		it('should handle write errors', async () => {
			(fs.writeFileSync as jest.Mock).mockImplementation(() => {
				throw new Error('Write failed');
			});

			await expect(createDocument('test', 'content')).rejects.toThrow('Write failed');
			expect(logger.error).toHaveBeenCalledWith('Failed to create document:', expect.any(Error));
		});
	});

	describe('deleteDocument', () => {
		it('should successfully delete an existing document', async () => {
			const filename = 'test.md';
			await deleteDocument(filename);

			expect(fs.unlinkSync).toHaveBeenCalledWith(path.resolve(mockDocumentsPath, filename));
			expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Document deleted:'));
		});

		it('should throw error for filenames with path traversal attempts', async () => {
			const invalidFilenames = ['../test.md', '../../test.md', '/test.md', '\\test.md', 'subfolder/../test.md'];

			for (const filename of invalidFilenames) {
				await expect(deleteDocument(filename)).rejects.toThrow('Invalid filename');
			}
		});

		it('should throw error when resolved path is outside documents directory', async () => {
			// Mock path.resolve to simulate a path outside documents directory
			jest.spyOn(path, 'resolve').mockImplementationOnce((documentsPath, filename) => {
				return path.join('/some/malicious/path', filename);
			});

			await expect(deleteDocument('test.md')).rejects.toThrow('Invalid file path');
		});

		it('should handle file system errors', async () => {
			(fs.unlinkSync as jest.Mock).mockImplementation(() => {
				throw new Error('File system error');
			});
			const filename = path.join('..', 'outside.md');

			await expect(deleteDocument(filename)).rejects.toThrow('Invalid filename');
		});
	});
});
