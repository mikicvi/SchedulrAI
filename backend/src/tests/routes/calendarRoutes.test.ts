import request from 'supertest';
import express, { Request, Response } from 'express';
import calendarRoutes from '../../routes/calendarRoutes';
import { calendarController } from '../../controllers/calendarController';
import { eventController } from '../../controllers/eventController';

// Mock the controllers
jest.mock('../../controllers/calendarController');
jest.mock('../../controllers/eventController');

// Type the mocked functions
const mockedCalendarController = calendarController as jest.Mocked<typeof calendarController>;
const mockedEventController = eventController as jest.Mocked<typeof eventController>;

// Create Express app and use the router
const app = express();
app.use(express.json());
app.use(global.mockAuthMiddleware); // Apply mock auth before routes
app.use(calendarRoutes);

describe('Calendar Routes', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Calendar endpoints', () => {
		describe('POST /calendars', () => {
			it('should create a new calendar', async () => {
				const mockCalendar = {
					id: 1,
					name: 'Test Calendar',
					description: 'Test Description',
				};

				mockedCalendarController.create.mockImplementation((req: Request, res: Response) => {
					res.status(201).location('/calendars/1').json({
						status: 'success',
						data: mockCalendar,
					});
					return Promise.resolve();
				});

				const response = await request(app).post('/calendars').send(mockCalendar).expect(201);

				expect(mockedCalendarController.create).toHaveBeenCalled();
				expect(response.body).toEqual({
					status: 'success',
					data: mockCalendar,
				});
				expect(response.headers.location).toBe('/calendars/1');
			});
		});

		describe('GET /calendars/:id', () => {
			it('should return a calendar by id', async () => {
				const mockCalendar = {
					id: 1,
					name: 'Test Calendar',
					description: 'Test Description',
				};

				mockedCalendarController.getById.mockImplementation((req: Request, res: Response) => {
					res.status(200).json({
						status: 'success',
						data: mockCalendar,
					});
					return Promise.resolve();
				});

				const response = await request(app).get('/calendars/1').expect(200);

				expect(mockedCalendarController.getById).toHaveBeenCalled();
				expect(response.body).toEqual({
					status: 'success',
					data: mockCalendar,
				});
			});

			it('should return 404 for non-existent calendar', async () => {
				mockedCalendarController.getById.mockImplementation((req: Request, res: Response) => {
					res.status(404).json({
						status: 'error',
						message: 'Calendar not found',
					});
					return Promise.resolve();
				});

				const response = await request(app).get('/calendars/999').expect(404);

				expect(response.body).toEqual({
					status: 'error',
					message: 'Calendar not found',
				});
			});
		});
	});

	describe('Event endpoints', () => {
		describe('POST /events', () => {
			it('should create a new event', async () => {
				const mockEvent = {
					id: 1,
					title: 'Test Event',
					startTime: '2024-01-01T10:00:00Z',
					endTime: '2024-01-01T11:00:00Z',
					calendarId: 1,
				};

				mockedEventController.create.mockImplementation((req: Request, res: Response) => {
					res.status(201).location('/events/1').json({
						status: 'success',
						data: mockEvent,
					});
					return Promise.resolve();
				});

				const response = await request(app).post('/events').send(mockEvent).expect(201);

				expect(mockedEventController.create).toHaveBeenCalled();
				expect(response.body).toEqual({
					status: 'success',
					data: mockEvent,
				});
				expect(response.headers.location).toBe('/events/1');
			});
		});

		describe('GET /events/:id', () => {
			it('should return an event by id', async () => {
				const mockEvent = {
					id: 1,
					title: 'Test Event',
					startTime: '2024-01-01T10:00:00Z',
					endTime: '2024-01-01T11:00:00Z',
					calendarId: 1,
				};

				mockedEventController.getById.mockImplementation((req: Request, res: Response) => {
					res.status(200).json({
						status: 'success',
						data: mockEvent,
					});
					return Promise.resolve();
				});

				const response = await request(app).get('/events/1').expect(200);

				expect(mockedEventController.getById).toHaveBeenCalled();
				expect(response.body).toEqual({
					status: 'success',
					data: mockEvent,
				});
			});
		});
	});
});
