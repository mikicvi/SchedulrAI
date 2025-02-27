import { ChromaClient, OllamaEmbeddingFunction } from 'chromadb';

export async function getChromaStatus() {
	const chromaClient = new ChromaClient({
		path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
		auth: {
			provider: 'basic',
			credentials: process.env.CHROMA_SERVER_AUTHN_CREDENTIALS,
		},
	});
	return chromaClient.heartbeat();
}

export async function getChromaCollection(collectionName: string) {
	const chromaClient = new ChromaClient({
		path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
		auth: {
			provider: 'basic',
			credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS,
		},
	});

	const embeddingFunction = new OllamaEmbeddingFunction({
		url: `${process.env.PROTOCOL}://${process.env.OLLAMA_API_BASE}:${process.env.OLLAMA_PORT}/api/embeddings`,
		model: process.env.LLM_EMBED_MODEL,
	});

	return chromaClient.getCollection({ name: collectionName, embeddingFunction: embeddingFunction });
}

export async function resetChromaCollection(collectionName: string) {
	const chromaClient = new ChromaClient({
		path: `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:8000`,
		auth: {
			provider: 'basic',
			credentials: process.env.CHROMA_CLIENT_AUTH_CREDENTIALS,
		},
	});
	return chromaClient.deleteCollection({ name: collectionName });
}
