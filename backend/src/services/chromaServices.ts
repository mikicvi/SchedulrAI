import { ChromaClient } from 'chromadb';

export async function getChromaStatus() {
	const chromaClient = new ChromaClient({
		path: `http://${process.env.CHROMA_SERVER_HOST}:8000`,
		auth: {
			provider: 'basic',
			credentials: process.env.CHROMA_SERVER_AUTHN_CREDENTIALS,
		},
	});
	return chromaClient.heartbeat();
}
