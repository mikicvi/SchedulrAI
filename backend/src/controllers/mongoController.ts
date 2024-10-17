import { Request, Response } from 'express';
import { getMongoStatus } from '../services/mongoServices';
import logger from '../utils/logger';

export const mongoStatus = (req: Request, res: Response): void => {
	getMongoStatus()
		.then((info) => {
			res.status(200).json({ status: 'OK', info });
			logger.info(`|mongoStatus        |: ${req.method} ${res.statusCode}`);
		})
		.catch((error) => {
			logger.error('Error connecting to MongoDB:', error);
			res.sendStatus(500);
		});
};
