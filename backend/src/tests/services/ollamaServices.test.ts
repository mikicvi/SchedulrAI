import axios from 'axios';
import { Ollama, ChatResponse, EmbedResponse } from 'ollama';
import { getOllamaStatus } from '../../services/ollamaServices';
import logger from '../../utils/logger';
import { ModelType } from '../../types/ollama';

// Mock dependencies
jest.mock('axios');
jest.mock('ollama');
jest.mock('../../utils/logger');

describe('getOllamaStatus', () => {
	const mockAxios = axios as jest.Mocked<typeof axios>;
	const mockOllama = Ollama as jest.MockedClass<typeof Ollama>;

	// Reset mocks before each test
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.PROTOCOL = 'http';
		process.env.OLLAMA_API_BASE = '127.0.0.1';
		process.env.OLLAMA_PORT = '11434';
		process.env.LLM_MODEL = 'llama3.2';
		process.env.LLM_EMBED_MODEL = 'nomic-embed-text';
	});

	describe('Chat Model Status', () => {
		it('should return chat model response when Ollama is running', async () => {
			// Setup mocks
			mockAxios.get.mockResolvedValue({ data: 'Ollama is running' });
			const mockChatResponse = {
				message: { content: 'Ready to chat!' },
			};
			const mockOllamaInstance = {
				chat: jest.fn().mockResolvedValue(mockChatResponse),
			};
			mockOllama.mockImplementation(() => mockOllamaInstance as any);

			// Call function
			const result = await getOllamaStatus('chat');

			// Assertions
			expect(mockAxios.get).toHaveBeenCalledWith('http://127.0.0.1:11434');
			expect(mockOllamaInstance.chat).toHaveBeenCalledWith({
				model: 'llama3.2',
				messages: [{ role: 'user', content: 'Are you ready?' }],
				stream: false,
			});
			expect(result).toBe('Ready to chat!');
		});

		it('should throw error if Ollama is not running', async () => {
			// Setup mocks
			mockAxios.get.mockResolvedValue({ data: 'Not running' });

			// Call and assert
			await expect(getOllamaStatus('chat')).rejects.toThrow('Unexpected response from Ollama');
		});
	});

	describe('Embedding Model Status', () => {
		it('should return embedding vectors when Ollama is running', async () => {
			// Setup mocks
			mockAxios.get.mockResolvedValue({ data: 'Ollama is running' });
			const mockEmbedResponse = {
				embeddings: [
					[0.1, 0.2, 0.3],
					[0.4, 0.5, 0.6],
				],
			};
			const mockOllamaInstance = {
				embed: jest.fn().mockResolvedValue(mockEmbedResponse),
			};
			mockOllama.mockImplementation(() => mockOllamaInstance as any);

			// Call function
			const result = await getOllamaStatus('embedding');

			// Assertions
			expect(mockAxios.get).toHaveBeenCalledWith('http://127.0.0.1:11434');
			expect(mockOllamaInstance.embed).toHaveBeenCalledWith({
				model: 'nomic-embed-text',
				input: 'Status sentence',
			});
			expect(result).toEqual([
				[0.1, 0.2, 0.3],
				[0.4, 0.5, 0.6],
			]);
		});
	});

	describe('Error Handling', () => {
		it('should throw error for invalid model type', async () => {
			// Setup mocks
			mockAxios.get.mockResolvedValue({ data: 'Ollama is running' });

			// Call and assert
			await expect(getOllamaStatus('invalid' as any)).rejects.toThrow('Invalid model type');
		});

		it('should handle and rethrow errors from Ollama calls', async () => {
			// Setup mocks
			mockAxios.get.mockResolvedValue({ data: 'Ollama is running' });
			const mockOllamaInstance = {
				chat: jest.fn().mockRejectedValue(new Error('Ollama connection failed')),
			};
			mockOllama.mockImplementation(() => mockOllamaInstance as any);

			// Call and assert
			await expect(getOllamaStatus('chat')).rejects.toThrow('Ollama connection failed');
		});
	});
});
