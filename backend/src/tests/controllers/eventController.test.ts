import { Request, Response } from 'express';
import { eventController } from '../../controllers/eventController';
import * as dbServices from '../../services/dbServices';
import * as googleCalendarServices from '../../services/googleCalendarServices';
import logger from '../../utils/logger';

jest.mock('../../services/dbServices');
jest.mock('../../services/googleCalendarServices');
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

		it('should throw an error if there is not result from createEvent', async () => {
			req.body = mockEvent;
			(dbServices.createEvent as jest.Mock).mockResolvedValue(null);
			await eventController.create(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Failed to create event',
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

		it('should return 500 if there is an error', async () => {
			const error = new Error('Database error');
			req.params = { id: '1' };
			(dbServices.getEventById as jest.Mock).mockRejectedValue(error);

			await eventController.getById(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Internal server error',
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('getAll', () => {
		it('should return all events for a calendar', async () => {
			req.params = { id: '1' };
			const mockEvents = [mockEvent];
			(dbServices.getAllEvents as jest.Mock).mockResolvedValue(mockEvents);

			await eventController.getAll(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: mockEvents,
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 200 and empty array if no events found for a calendar', async () => {
			req.params = { id: '999' };
			(dbServices.getAllEvents as jest.Mock).mockResolvedValue([]);

			await eventController.getAll(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: [],
			});
			expect(logger.warn).toHaveBeenCalled();
		});

		it('should return 200 and empty array if getAllEvents returns null', async () => {
			req.params = { id: '1' };
			(dbServices.getAllEvents as jest.Mock).mockResolvedValue(null);

			await eventController.getAll(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				status: 'success',
				data: [],
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 400 if calendar id is missing', async () => {
			req.params = {};
			await eventController.getAll(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Calendar ID is required',
			});
			expect(logger.warn).toHaveBeenCalled();
		});

		it('should return 500 if there is an error', async () => {
			const error = new Error('Database error');
			req.params = { id: '1' };
			(dbServices.getAllEvents as jest.Mock).mockRejectedValue(error);

			await eventController.getAll(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Internal server error',
			});
			expect(logger.error).toHaveBeenCalled();
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

		it('should return 400 if there is an error', async () => {
			const error = new Error('Validation error');
			req.params = { id: '1' };
			req.body = { title: 'Updated Event' };
			(dbServices.updateEvent as jest.Mock).mockRejectedValue(error);

			await eventController.update(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: error.message,
			});
			expect(logger.error).toHaveBeenCalled();
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

		it('should return 500 if there is an error', async () => {
			const error = new Error('Database error');
			req.params = { id: '1' };
			(dbServices.deleteEvent as jest.Mock).mockRejectedValue(error);

			await eventController.delete(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				status: 'error',
				message: 'Internal server error',
			});
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('syncEvents', () => {
		beforeEach(() => {
			req = {
				params: { id: '1' }, // Calendar ID
				user: { id: 1 } as unknown as any, // User ID
			};
			res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};
		});

		it('should successfully sync events and return 200', async () => {
			(googleCalendarServices.syncGoogleCalendarEvents as jest.Mock).mockResolvedValue(true);

			await eventController.syncEvents(req as Request, res as Response);

			expect(googleCalendarServices.syncGoogleCalendarEvents).toHaveBeenCalledWith(1);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Calendar synced successfully',
			});
			expect(logger.info).toHaveBeenCalled();
		});

		it('should return 500 if user is not authenticated', async () => {
			req.user = undefined;

			await eventController.syncEvents(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: 'Failed to sync calendar',
				message: "Cannot read properties of undefined (reading 'id')",
			});
			expect(logger.warn).toHaveBeenCalled();
		});

		it('should handle sync errors gracefully', async () => {
			const error = new Error('Sync failed');
			(googleCalendarServices.syncGoogleCalendarEvents as jest.Mock).mockRejectedValue(error);

			await eventController.syncEvents(req as Request, res as Response);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: 'Failed to sync calendar',
				message: 'Sync failed',
			});
			expect(logger.error).toHaveBeenCalledWith('Sync failed:', error);
		});
	});
});
