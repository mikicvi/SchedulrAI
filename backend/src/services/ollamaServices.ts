import axios from 'axios';
import ollama, { ChatResponse, EmbedResponse } from 'ollama';
import { ModelType, OllamaConfig } from '../types/ollama';

export const getOllamaStatus = async (modelType: ModelType): Promise<string | number[][]> => {
	const config: OllamaConfig = {
		apiBase: process.env.OLLAMA_API_BASE || '127.0.0.1',
		port: process.env.OLLAMA_PORT || '11434',
		chatModel: process.env.LLM_MODEL || 'llama3.2',
		embedModel: process.env.LLM_EMBED_MODEL || 'nomic-embed-text',
	};

	const ollamaUrl = `http://${config.apiBase}:${config.port}`;
	const appStatus = await axios.get(ollamaUrl);

	if (appStatus.data === 'Ollama is running') {
		let modelStatus: EmbedResponse | ChatResponse;
		let returnMessage: string | number[][];

		if (modelType === 'chat') {
			modelStatus = await ollama.chat({
				model: config.chatModel,
				messages: [{ role: 'user', content: 'Are you ready?' }],
				stream: false,
			});
			returnMessage = modelStatus.message.content;
		} else if (modelType === 'embedding') {
			modelStatus = await ollama.embed({
				model: config.embedModel,
				input: 'Status sentence',
			});
			returnMessage = modelStatus.embeddings;
		} else {
			throw new Error('Invalid model type');
		}

		return returnMessage;
	}

	throw new Error('Unexpected response from Ollama');
};
