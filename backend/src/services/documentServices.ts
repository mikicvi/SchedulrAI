import fs from 'fs';
import path from 'path';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';
import { MarkdownTextSplitter, CharacterTextSplitter } from 'langchain/text_splitter';
import logger from '../utils/logger';

const documentsPath = process.env.DOCUMENTS_PATH || path.join(__dirname, '../../documents');

async function loadDocuments(docsPath: string): Promise<{ name: string; content: string }[]> {
	try {
		const files = fs.readdirSync(docsPath);
		const documents = files.map((file) => ({
			name: path.parse(file).name,
			content: fs.readFileSync(path.join(docsPath, file), 'utf-8'),
		}));
		logger.info(`Documents loaded from ${docsPath}`);
		return documents;
	} catch (error) {
		logger.error(`Failed to load documents from ${docsPath}:`, error);
		throw error;
	}
}

async function splitDocuments(
	documents: { name: string; content: string }[]
): Promise<{ name: string; chunks: string[] }[]> {
	//const splitter = new MarkdownTextSplitter({ chunkSize: 250, chunkOverlap: 40 });
	const splitter = new CharacterTextSplitter({
		separator: '---',
		chunkSize: 1000,
		chunkOverlap: 50,
	});
	const chunks = await Promise.all(
		documents.map(async (document) => ({
			name: document.name,
			chunks: await splitter.splitText(document.content),
		}))
	);
	logger.info(`Documents split into chunks, ${chunks.length} documents`);
	return chunks;
}

async function storeEmbeddings(documents: { name: string; chunks: string[] }[]): Promise<void> {
	const chromaClient = new ChromaClient({
		path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
		auth: {
			provider: 'basic',
			credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS,
		},
	});

	const embedder = new OllamaEmbeddingFunction({
		url: `${process.env.PROTOCOL}://${process.env.OLLAMA_API_BASE}:${process.env.OLLAMA_PORT}/api/embeddings`,
		model: process.env.LLM_EMBED_MODEL,
	});

	try {
		// delete existing collection
		if (await chromaClient.getOrCreateCollection({ name: 'SchedulrAI-KB' })) {
			await chromaClient.deleteCollection({ name: 'SchedulrAI-KB' });
		}

		const collection = await chromaClient.createCollection({
			name: 'SchedulrAI-KB',
			embeddingFunction: embedder,
		});

		for (const document of documents) {
			await collection.add({
				documents: document.chunks,
				ids: document.chunks.map((_, index) => `${document.name}-${index}`),
			});
		}
	} catch (error) {
		logger.error('Failed to store embeddings:', error);
		throw error;
	}
	logger.info('Embeddings stored successfully');
}

export async function indexDocuments(): Promise<void> {
	try {
		const documents = await loadDocuments(documentsPath);
		const chunks = await splitDocuments(documents);
		await storeEmbeddings(chunks);
	} catch (error) {
		logger.error('Indexing failed:', error);
		throw error;
	}
}
