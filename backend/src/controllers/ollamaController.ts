import { Request, Response } from 'express';
import { getOllamaStatus } from '../services/ollamaServices';
import logger from '../utils/logger';

export const ollamaStatus = (req: Request, res: Response): void => {
	getOllamaStatus()
		.then((content) => {
			res.status(200).json({ status: 'OK', content });
			logger.info(`|ollamaStatus      |: ${req.method} ${res.statusCode}`);
		})
		.catch((error) => {
			logger.error('Error connecting to Ollama instance:', error);
			res.sendStatus(500);
		});
};
