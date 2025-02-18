import { Request, Response } from 'express';
import { calendarController } from '../../controllers/calendarController';
import * as dbServices from '../../services/dbServices';
import logger from '../../utils/logger';

jest.mock('../../services/dbServices');
jest.mock('../../utils/logger');

describe('calendarController', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;

	beforeEach(() => {
		req = {};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			location: jest.fn().mockReturnThis(),
			end: jest.fn(),
		};
	});

	describe('create', () => {
		it('should create a new calendar and return 201 status', async () => {
			const mockCalendar = {
				id: 1,
				name: 'Test Calendar',
				description: 'Test Description',
				userId: 1,
			};
			req.body = {
				name: 'Test Calendar',
				description: 'Test Description',
				userId: 1,
			};

			(dbServices.createCalendar as jest.Mock).mockResolvedValue(mockCalendar);

			await calendarController.create(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.location).toHaveBeenCalledWith('/calendars/1');
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: mockCalendar,
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 400 if there is an error', async () => {
			const error = new Error('Database error');
			req.body = {
				name: 'Test Calendar',
				description: 'Test Description',
				userId: 1,
			};

			(dbServices.createCalendar as jest.Mock).mockRejectedValue(error);

			await calendarController.create(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: error.message,
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getById', () => {
		it('should return a calendar by id', async () => {
			const mockCalendar = {
				id: 1,
				name: 'Test Calendar',
				description: 'Test Description',
				userId: 1,
			};
			req.params = { id: '1' };

			(dbServices.getCalendarById as jest.Mock).mockResolvedValue(mockCalendar);

			await calendarController.getById(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: mockCalendar,
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 404 if calendar not found', async () => {
			req.params = { id: '1' };

			(dbServices.getCalendarById as jest.Mock).mockResolvedValue(null);

			await calendarController.getById(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Calendar not found',
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 500 if there is an error', async () => {
			const error = new Error('Internal server error');
			req.params = { id: '1' };

			(dbServices.getCalendarById as jest.Mock).mockRejectedValue(error);

			await calendarController.getById(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: error.message,
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a calendar and return the updated calendar', async () => {
			const mockUpdatedCalendar = [
				{ id: 1, name: 'Updated Calendar', description: 'Updated Description', userId: 1 },
			];
			req.params = { id: '1' };
			req.body = { name: 'Updated Calendar', description: 'Updated Description' };

			(dbServices.updateCalendar as jest.Mock).mockResolvedValue([1, mockUpdatedCalendar]);

			await calendarController.update(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: mockUpdatedCalendar,
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 404 if calendar not found', async () => {
			req.params = { id: '1' };
			req.body = { name: 'Updated Calendar' };

			(dbServices.updateCalendar as jest.Mock).mockResolvedValue([0]);

			await calendarController.update(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Calendar not found',
			});
			expect(logger.warn).toHaveBeenCalled();
		});

		it('should return 400 if there is an error', async () => {
			const error = new Error('Database error');
			req.params = { id: '1' };
			req.body = { name: 'Updated Calendar' };

			(dbServices.updateCalendar as jest.Mock).mockRejectedValue(error);

			await calendarController.update(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: error.message,
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete a calendar and return 204 status', async () => {
			req.params = { id: '1' };

			(dbServices.deleteCalendar as jest.Mock).mockResolvedValue(1);

			await calendarController.delete(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(204);
			expect(res.end).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 404 if calendar not found', async () => {
			req.params = { id: '1' };

			(dbServices.deleteCalendar as jest.Mock).mockResolvedValue(0);

			await calendarController.delete(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Calendar not found',
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 500 if there is an error', async () => {
			const error = new Error('Database error');
			req.params = { id: '1' };

			(dbServices.deleteCalendar as jest.Mock).mockRejectedValue(error);

			await calendarController.delete(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Internal server error',
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
