import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';
import logger from '../utils/logger';

// Create a singleton ChromaClient
const getChromaClient = () =>
	new ChromaClient({
		path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
		auth: {
			provider: 'basic',
			credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS,
		},
	});

// Get embedding function
const getEmbeddingFunction = () =>
	new OllamaEmbeddingFunction({
		url: `${process.env.PROTOCOL}://${process.env.OLLAMA_API_BASE}:${process.env.OLLAMA_PORT}/api/embeddings`,
		model: process.env.LLM_EMBED_MODEL,
	});

export async function getChromaStatus() {
	const chromaClient = getChromaClient();
	return chromaClient.heartbeat();
}

export async function getChromaCollection(collectionName: string) {
	const chromaClient = getChromaClient();
	const embeddingFunction = getEmbeddingFunction();

	try {
		return await chromaClient.getCollection({
			name: collectionName,
			embeddingFunction: embeddingFunction,
		});
	} catch (error) {
		logger.error('Error getting Chroma collection:', error);
		throw error;
	}
}

export async function createChromaCollection(collectionName: string) {
	try {
		const chromaClient = getChromaClient();
		const embeddingFunction = getEmbeddingFunction();

		return await chromaClient.createCollection({
			name: collectionName,
			embeddingFunction: embeddingFunction,
		});
	} catch (error) {
		logger.error('Error creating Chroma collection:', error);
		throw error;
	}
}

export async function resetChromaCollection(collectionName: string) {
	const chromaClient = getChromaClient();
	try {
		await chromaClient.deleteCollection({ name: collectionName });
		logger.info(`Collection ${collectionName} deleted successfully`);
		return { success: true };
	} catch (error) {
		logger.error('Error resetting Chroma collection:', error);
		throw error;
	}
}
