import { Request, Response } from 'express';
import { getOllamaStatus } from '../services/ollamaServices';
import logger from '../utils/logger';

import { ModelType } from '../types';

const handleOllamaStatus = (modelType: ModelType) => {
	return (req: Request, res: Response): void => {
		getOllamaStatus(modelType)
			.then((content) => {
				res.status(200).json({ status: 'OK', content });
				logger.info(`|ollamaStatus-${modelType}  |: ${req.method} ${res.statusCode}`);
			})
			.catch((error) => {
				logger.error('Error connecting to Ollama instance:', error);
				res.sendStatus(500);
			});
	};
};

export const ollamaStatus = handleOllamaStatus('chat');
export const ollamaEmbeddingStatus = handleOllamaStatus('embedding');
