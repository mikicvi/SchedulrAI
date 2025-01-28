import { Request, Response } from 'express';
import { getOllamaStatus } from '../services/ollamaServices';
import logger from '../utils/logger';

import { ModelType } from '../types/ollama';

const handleOllamaStatus = (modelType: ModelType) => {
	return async (req: Request, res: Response): Promise<void> => {
		try {
			const content = await getOllamaStatus(modelType);
			res.status(200).json({ status: 'OK', content });
		} catch (error) {
			res.sendStatus(500);
			logger.error(`Error connecting to Ollama instance: ${error}`);
		}
		logger.info(`|ollamaControllerStatus-${modelType}  |: ${req.method} ${res.statusCode}`);
	};
};

export const ollamaStatus = handleOllamaStatus('chat');
export const ollamaEmbeddingStatus = handleOllamaStatus('embedding');
