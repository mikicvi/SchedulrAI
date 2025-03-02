import { Request, Response } from 'express';
import { EventEmitter } from 'events';
import logger from '../utils/logger';
import RAGPipeline from '../services/pipelineServices';

const pipelineEmitter = new EventEmitter();

class PipelineController {
	private readonly pipelineService: RAGPipeline;
	private readonly baseUrl = `${process.env.PROTOCOL}://${process.env.OLLAMA_API_BASE}:${process.env.OLLAMA_PORT}`;
	private readonly chromaUrl = `${process.env.PROTOCOL}://${process.env.CHROMA_SERVER_HOST}:${process.env.CHROMA_SERVER_PORT}`;
	private readonly model = process.env.LLM_MODEL;
	private readonly embeddingLLM = process.env.LLM_EMBED_MODEL;
	private readonly collectionName = 'SchedulrAI-KB';
	private readonly vectorStoreProvider = 'basic';
	private readonly vectorStoreCredentials = process.env.CHROMA_CLIENT_AUTH_CREDENTIALS;

	constructor() {
		this.pipelineService = new RAGPipeline(
			{
				baseUrl: this.baseUrl,
				model: this.model,
				embeddingModel: this.embeddingLLM,
				temperature: 0.5,
				topP: 0.9,
			},
			{
				collectionName: this.collectionName,
				url: this.chromaUrl,
				clientParams: {
					auth: {
						provider: this.vectorStoreProvider,
						credentials: this.vectorStoreCredentials,
					},
				},
			}
		);
	}

	/**
	 * Gets the pipeline emitter
	 * @internal
	 */
	public _getEmitter(): EventEmitter {
		return pipelineEmitter;
	}

	/**
	 * Handles the execution of a pipeline based on user input.
	 *
	 * @param req - The HTTP request object, containing the user input in the body.
	 * @param res - The HTTP response object used to send back the result or an error message.
	 * @returns A promise that resolves to void.
	 *
	 * @throws Will return a 500 status code and an error message if the pipeline execution fails.
	 */
	public async runPipeline(req: Request, res: Response): Promise<void> {
		try {
			const userInput = req.body.userInput;
			const requestId = Date.now().toString();

			// Emit more detailed status updates
			pipelineEmitter.emit('status', {
				requestId,
				status: 'Initializing pipeline...',
				timestamp: new Date().toISOString(),
			});

			const result = await this.pipelineService.runPipeline(userInput, (status: string) => {
				pipelineEmitter.emit('status', {
					requestId,
					status,
					timestamp: new Date().toISOString(),
				});
			});

			res.status(200).json(result);
			logger.debug(`|runPipeline  |: in:${userInput} out:${JSON.stringify(result)}`);
		} catch (error) {
			logger.error('Error running pipeline:', error);
			res.status(500).json({ error: error.message });
		}
		logger.info(`|runPipeline  |: ${req.method} ${res.statusCode}`);
	}

	/**
	 * Checks the status of the pipeline and returns whether it is ready.
	 *
	 * @param req - The request object.
	 * @param res - The response object.
	 * @returns A promise that resolves to void.
	 */
	public async checkPipelineStatus(req: Request, res: Response): Promise<void> {
		try {
			const status = await this.pipelineService.isPipelineReady();
			res.status(200).json({ ready: status });
		} catch (error) {
			logger.error(`Error during pipeline status check: ${error}`);
			res.status(500).json({ error: error.message });
		}
		logger.info(`|checkPipelineStatus  |: ${req.method} ${res.statusCode}`);
	}

	/**
	 * Streams status updates to the client using Server-Sent Events (SSE).
	 *
	 * @param req - The HTTP request object.
	 * @param res - The HTTP response object.
	 */
	public async streamStatus(req: Request, res: Response): Promise<void> {
		res.setHeader('Content-Type', 'text/event-stream');

		// Send initial connection message
		res.write(`data: ${JSON.stringify({ status: 'Connected to status stream' })}\n\n`);

		const listener = (data: any) => {
			try {
				res.write(`data: ${JSON.stringify(data)}\n\n`);
			} catch (error) {
				logger.error('Error sending SSE update:', error);
			}
		};

		pipelineEmitter.on('status', listener);

		// Keep connection alive
		const keepAlive = setInterval(() => {
			res.write(`: keepalive\n\n`);
		}, 30000);

		req.on('close', () => {
			clearInterval(keepAlive);
			pipelineEmitter.off('status', listener);
			res.end();
		});
	}

	/**
	 * Streams chat responses using Server-Sent Events (SSE).
	 * This method handles the streaming of chat responses to the client using SSE protocol,
	 * allowing real-time updates of chat messages.
	 *
	 * @param req - Express Request object containing the chat message in the body
	 * @param res - Express Response object used to send the streaming response
	 * @returns Promise<void>
	 *
	 * @throws Will throw and handle errors that occur during the streaming process
	 */
	public async streamChat(req: Request, res: Response): Promise<void> {
		try {
			const userInput = req.body.message;

			if (userInput === undefined || userInput === null) {
				res.write(`data: ${JSON.stringify({ type: 'error', content: 'No message provided' })}\n\n`);
				res.end();
				return;
			}

			// Set headers for SSE
			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');

			// Stream the response
			for await (const chunk of this.pipelineService.streamChatResponse(userInput, (status: string) => {
				res.write(`data: ${JSON.stringify({ type: 'status', content: status })}\n\n`);
			})) {
				res.write(`data: ${JSON.stringify({ type: 'content', content: chunk.content })}\n\n`);
			}

			res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
		} catch (error) {
			logger.error('Stream chat error:', error);
			res.write(`data: ${JSON.stringify({ type: 'error', content: error.message })}\n\n`);
		} finally {
			res.end();
		}
	}
}

export default PipelineController;
