import { Request, Response } from 'express';
import { getChromaCollection, getChromaStatus } from '../services/chromaServices';
import logger from '../utils/logger';

export const chromaStatus = async (req: Request, res: Response): Promise<void> => {
	try {
		const chromaStatus = await getChromaStatus();
		res.status(200).json({ status: 'OK', chromaStatus });
		logger.info(`|chromaStatus     |: ${req.method} ${res.statusCode}`);
	} catch (error) {
		logger.error(error);
		res.sendStatus(500);
	}
};

export const chromaCollections = async (req: Request, res: Response): Promise<void> => {
	try {
		const collections = await getChromaCollection('SchedulrAI-KB');
		res.status(200).json({ status: 'OK', collections });
		logger.info(`|chromaCollections |: ${req.method} ${res.statusCode}`);
	} catch (error) {

		logger.error(error);
		res.sendStatus(500);
	}
};
