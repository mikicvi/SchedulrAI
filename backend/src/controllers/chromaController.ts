import { Request, Response } from 'express';
import { getChromaCollection, getChromaStatus } from '../services/chromaServices';
import logger from '../utils/logger';

export const chromaStatus = (req: Request, res: Response): void => {
	getChromaStatus()
		.then((chromaStatus) => {
			res.status(200).json({ status: 'OK', chromaStatus });
			logger.info(`|chromaStatus     |: ${req.method} ${res.statusCode}`);
		})
		.catch((error) => {
			logger.error(error);
			res.sendStatus(500);
		});
};

export const chromaCollections = (req: Request, res: Response): void => {
	getChromaCollection('SchedulrAI-KB')
		.then((collections) => {
			res.status(200).json({ status: 'OK', collections });
			logger.info(`|chromaCollections |: ${req.method} ${res.statusCode}`);
		})
		.catch((error) => {
			logger.error(error);
			res.sendStatus(500);
		});
};
