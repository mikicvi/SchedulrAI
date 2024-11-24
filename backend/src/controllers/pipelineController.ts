import { Request, Response } from 'express';
import logger from '../utils/logger';
import RAGPipeline from '../services/pipelineServices';

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
			const result = await this.pipelineService.runPipeline(userInput);
			res.status(200).json({ result });
			logger.debug(`|runPipeline  |: in:${JSON.stringify(req.body.userInput)} out:${JSON.stringify(result)}`);
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
}

export default PipelineController;
