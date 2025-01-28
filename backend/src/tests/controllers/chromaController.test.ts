import { Request, Response } from 'express';
import { chromaStatus, chromaCollections } from '../../controllers/chromaController';
import { getChromaCollection, getChromaStatus } from '../../services/chromaServices';
import logger from '../../utils/logger';

jest.mock('../../services/chromaServices');
jest.mock('../../utils/logger');

describe('chromaController', () => {
	describe('chromaStatus', () => {
		it('should return status 200 and chromaStatus on success', async () => {
			const req = {} as Request;
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;

			(getChromaStatus as jest.Mock).mockResolvedValue('mockChromaStatus');

			await chromaStatus(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ status: 'OK', chromaStatus: 'mockChromaStatus' });
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return status 500 on error', async () => {
			const req = {} as Request;
			const res = {
				sendStatus: jest.fn(),
			} as unknown as Response;

			(getChromaStatus as jest.Mock).mockRejectedValue(new Error('mockError'));

			await chromaStatus(req, res);

			expect(res.sendStatus).toHaveBeenCalledWith(500);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('chromaCollections', () => {
		it('should return status 200 and collections on success', async () => {
			const req = {} as Request;
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			} as unknown as Response;

			(getChromaCollection as jest.Mock).mockResolvedValue('mockCollections');

			await chromaCollections(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({ status: 'OK', collections: 'mockCollections' });
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return status 500 on error', async () => {
			const req = {} as Request;
			const res = {
				sendStatus: jest.fn(),
			} as unknown as Response;

			(getChromaCollection as jest.Mock).mockRejectedValue(new Error('mockError'));

			await chromaCollections(req, res);

			expect(res.sendStatus).toHaveBeenCalledWith(500);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
