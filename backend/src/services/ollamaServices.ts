import axios from 'axios';
import { Ollama, ChatResponse, EmbedResponse } from 'ollama';
import { ModelType, OllamaConfig } from '../types/ollama';
import logger from '../utils/logger';

/**
 * Retrieves the status of the Ollama service based on the specified model type.
 *
 * @param {ModelType} modelType - The type of model to check the status for. Can be 'chat' or 'embedding'.
 * @returns {Promise<string | number[][]>} - A promise that resolves to a string message if the model type is 'chat',
 *                                           or an array of number arrays if the model type is 'embedding'.
 * @throws {Error} - Throws an error if the Ollama service is not running or if there is an issue with the chat/embed call.
 */
export const getOllamaStatus = async (modelType: ModelType): Promise<string | number[][]> => {
	const config: OllamaConfig = {
		apiBase: process.env.OLLAMA_API_BASE || '127.0.0.1',
		port: process.env.OLLAMA_PORT || '11434',
		chatModel: process.env.LLM_MODEL || 'llama3.2',
		embedModel: process.env.LLM_EMBED_MODEL || 'nomic-embed-text',
	};
	logger.debug(`info  | inference: ${config.chatModel} | embeddings: ${config.embedModel}`);

	const ollamaUrl = `${process.env.PROTOCOL}://${config.apiBase}:${config.port}`;
	const ollama = new Ollama({
		host: ollamaUrl,
	});
	const appStatus = await axios.get(ollamaUrl);

	logger.debug(`info  | ollamaStatus  |: ${appStatus.data}`);

	if (appStatus.data === 'Ollama is running') {
		let modelStatus: EmbedResponse | ChatResponse;
		let returnMessage: string | number[][];
		try {
			if (modelType === 'chat') {
				modelStatus = await ollama.chat({
					model: config.chatModel,
					messages: [{ role: 'user', content: 'Are you ready?' }],
					stream: false,
				});
				logger.debug(`info  | ollamaStatus-modelStatus-${modelType}  |: ${modelStatus.message.content}`);
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
		} catch (error) {
			logger.error(`Error with ollama.chat/embed call: ${error}`);
			throw new Error(error);
		}
		return returnMessage;
	}

	throw new Error('Unexpected response from Ollama');
};
