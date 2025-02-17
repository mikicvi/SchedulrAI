import { Request, Response } from 'express';
import { eventController } from '../../controllers/eventController';
import * as dbServices from '../../services/dbServices';
import logger from '../../utils/logger';

jest.mock('../../services/dbServices');
jest.mock('../../utils/logger');

describe('eventController', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	const mockEvent = {
		id: 1,
		title: 'Test Event',
		startTime: new Date('2024-01-01T10:00:00Z'),
		endTime: new Date('2024-01-01T11:00:00Z'),
		calendarId: 1,
		description: 'Test Description',
		location: 'Test Location',
		resourceId: 1,
		importance: 'high',
	};

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
		it('should create a new event and return 201 status', async () => {
			req.body = mockEvent;
			(dbServices.createEvent as jest.Mock).mockResolvedValue(mockEvent);

			await eventController.create(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.location).toHaveBeenCalledWith('/events/1');
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: mockEvent,
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 400 if there is an error', async () => {
			const error = new Error('Validation error');
			req.body = mockEvent;
			(dbServices.createEvent as jest.Mock).mockRejectedValue(error);

			await eventController.create(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: error.message,
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getById', () => {
		it('should return an event by id', async () => {
			req.params = { id: '1' };
			(dbServices.getEventById as jest.Mock).mockResolvedValue(mockEvent);

			await eventController.getById(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: mockEvent,
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 404 if event not found', async () => {
			req.params = { id: '999' };
			(dbServices.getEventById as jest.Mock).mockResolvedValue(null);

			await eventController.getById(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Event not found',
			});
			expect(logger.warn).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update an event and return the updated event', async () => {
			const updatedEvent = { ...mockEvent, title: 'Updated Event' };
			req.params = { id: '1' };
			req.body = { title: 'Updated Event' };
			(dbServices.updateEvent as jest.Mock).mockResolvedValue([1, [updatedEvent]]);

			await eventController.update(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: [updatedEvent],
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 404 if event not found for update', async () => {
			req.params = { id: '999' };
			req.body = { title: 'Updated Event' };
			(dbServices.updateEvent as jest.Mock).mockResolvedValue([0]);

			await eventController.update(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Event not found',
			});
			expect(logger.warn).toHaveBeenCalled();
		});
	});

	describe('delete', () => {
		it('should delete an event and return 204 status', async () => {
			req.params = { id: '1' };
			(dbServices.deleteEvent as jest.Mock).mockResolvedValue(1);

			await eventController.delete(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(204);
			expect(res.end).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 404 if event not found for deletion', async () => {
			req.params = { id: '999' };
			(dbServices.deleteEvent as jest.Mock).mockResolvedValue(0);

			await eventController.delete(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Event not found',
			});
			expect(logger.warn).toHaveBeenCalled();
		});
	});
});
