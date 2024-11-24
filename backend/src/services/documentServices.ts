import fs from 'fs';
import path from 'path';
import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';
import { MarkdownTextSplitter, CharacterTextSplitter } from 'langchain/text_splitter';

const documentsPath = path.join(__dirname, '../../documents');

const loadDocuments = async (): Promise<{ name: string; content: string }[]> => {
	const files = fs.readdirSync(documentsPath);
	const documents = files.map((file) => ({
		name: path.parse(file).name,
		content: fs.readFileSync(path.join(documentsPath, file), 'utf-8'),
	}));
	return documents;
};

const splitDocuments = async (
	documents: { name: string; content: string }[]
): Promise<{ name: string; chunks: string[] }[]> => {
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
	return chunks;
};

const storeEmbeddings = async (documents: { name: string; chunks: string[] }[]): Promise<void> => {
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
		console.error('Failed to store embeddings:', error);
	}
};

export const indexDocuments = async (): Promise<void> => {
	try {
		const documents = await loadDocuments();
		const chunks = await splitDocuments(documents);
		await storeEmbeddings(chunks);
	} catch (error) {
		console.error('Indexing failed:', error);
		throw error;
	}
};
