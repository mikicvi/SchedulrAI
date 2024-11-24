import { Request, Response } from 'express';
import { getOllamaStatus } from '../services/ollamaServices';
import logger from '../utils/logger';

import { ModelType } from '../types/ollama';

const handleOllamaStatus = (modelType: ModelType) => {
	return (req: Request, res: Response): void => {
		getOllamaStatus(modelType)
			.then((content) => {
				res.status(200).json({ status: 'OK', content });
			})
			.catch((error) => {
				logger.error(`Error connecting to Ollama instance: ${error}`);
				res.sendStatus(500);
			});
		logger.info(`|ollamaControllerStatus-${modelType}  |: ${req.method} ${res.statusCode}`);
	};
};

export const ollamaStatus = handleOllamaStatus('chat');
export const ollamaEmbeddingStatus = handleOllamaStatus('embedding');
