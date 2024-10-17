import axios from 'axios';
import ollama from 'ollama';

export const getOllamaStatus = async () => {
	const ollamaApiBase = process.env.OLLAMA_API_BASE || '127.0.0.1';
	const ollamaPort = process.env.OLLAMA_PORT || '11434';
	const ollamaUrl = `http://${ollamaApiBase}:${ollamaPort}`;
	const appStatus = await axios.get(ollamaUrl);
	if (appStatus.data === 'Ollama is running') {
		const modelStatus = await ollama.chat({
			model: process.env.LLM_MODEL || 'llama3.2',
			messages: [{ role: 'user', content: 'Are you ready?' }],
			stream: false,
		});
		return modelStatus.message.content;
	}
	throw new Error('Unexpected response from Ollama');
};
