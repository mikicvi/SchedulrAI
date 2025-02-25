import request from 'supertest';
import express from 'express';
import User from '../../models/user.model';

// Mock all models before importing dbServices
jest.mock('../../models/user.model', () => ({
	__esModule: true,
	default: {
		init: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
	},
}));

jest.mock('../../models/calendar.model', () => ({
	__esModule: true,
	default: {
		init: jest.fn(),
		findOne: jest.fn(),
		findByPk: jest.fn(),
		create: jest.fn(),
	},
}));

jest.mock('../../models/event.model', () => ({
	__esModule: true,
	default: {
		findAll: jest.fn(),
	},
}));

jest.mock('../../middlewares/db', () => ({
	sequelize: {
		fn: jest.fn().mockReturnValue('mocked_fn'),
		col: jest.fn().mockReturnValue('mocked_col'),
		define: jest.fn(),
	},
}));

// Import after mocks
import * as dbServices from '../../services/dbServices';
import Event from '../../models/event.model';
import profileRoutes from '../../routes/profileRoutes';

const app = express();
app.use(express.json());
app.use(global.mockAuthMiddleware); // Apply mock auth before routes
app.use(profileRoutes);

describe('GET /profile', () => {
	it('should return user profile', async () => {
		const mockUser = {
			id: 1,
			username: 'testuser',
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
			userSettings: { theme: 'dark' },
		} as any;

		jest.spyOn(dbServices, 'getUserById').mockResolvedValueOnce(mockUser);

		const response = await request(app).get('/profile').set('Authorization', 'Bearer valid-token');

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.user).toEqual({
			id: 1,
			username: 'testuser',
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
			userSettings: { theme: 'dark' },
		});
	});

	it('should return 404 if user not found', async () => {
		jest.spyOn(dbServices, 'getUserById').mockResolvedValueOnce(null);

		const response = await request(app).get('/profile').set('Authorization', 'Bearer valid-token');

		expect(response.status).toBe(404);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toBe('User not found');
	});
});

describe('PUT /profile', () => {
	it('should update user profile', async () => {
		const updateData = {
			username: 'newusername',
			email: 'new@example.com',
			firstName: 'New',
			lastName: 'Name',
			userSettings: { theme: 'light' },
		};

		const updatedUser = {
			id: 1,
			...updateData,
		} as any;

		jest.spyOn(dbServices, 'updateUser').mockResolvedValueOnce([1, [updatedUser]]);

		const response = await request(app).put('/profile').set('Authorization', 'Bearer valid-token').send(updateData);

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.user).toEqual(updatedUser);
	});

	it('should return 400 if update fails', async () => {
		jest.spyOn(dbServices, 'updateUser').mockRejectedValueOnce(new Error('Update failed'));

		const response = await request(app).put('/profile').set('Authorization', 'Bearer valid-token').send({});

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toBe('Update failed');
	});
});

describe('GET /profile/stats', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return events per month statistics', async () => {
		// Mock user and calendar data
		const mockUser = {
			id: 1,
			calendarId: 1,
			createdAt: new Date(),
		} as any;

		const mockCalendar = {
			id: 1,
		} as any;

		// Mock event data with different months
		const mockEvents = [
			{ startTime: '2023-01-01', calendarId: 1 },
			{ startTime: '2023-01-15', calendarId: 1 },
			{ startTime: '2023-02-01', calendarId: 1 },
			{ startTime: '2023-03-01', calendarId: 1 },
		] as any;

		const mockEventResults = [
			{
				get: (key) => {
					if (key === 'month') return '2023-01';
					if (key === 'count') return 2;
					return null;
				},
			},
			{
				get: (key) => {
					if (key === 'month') return '2023-02';
					if (key === 'count') return 1;
					return null;
				},
			},
			{
				get: (key) => {
					if (key === 'month') return '2023-03';
					if (key === 'count') return 1;
					return null;
				},
			},
		];

		// Mock database responses
		jest.spyOn(dbServices, 'getUserById').mockResolvedValueOnce(mockUser);
		jest.spyOn(dbServices, 'getCalendarById').mockResolvedValueOnce(mockCalendar);
		jest.spyOn(dbServices, 'getAllEvents').mockResolvedValueOnce(mockEvents);
		(Event.findAll as jest.Mock).mockResolvedValueOnce(mockEventResults);

		const response = await request(app).get('/profile/stats').set('Authorization', 'Bearer valid-token'); // Mock authentication token

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.stats.eventsPerMonth).toHaveLength(3);
		expect(response.body.stats.eventsPerMonth[0]).toEqual({
			month: '2023-01',
			count: 2,
		});
		expect(response.body.stats.eventsPerMonth[1]).toEqual({
			month: '2023-02',
			count: 1,
		});
	});

	it('should handle empty events list', async () => {
		const mockUser = {
			id: 1,
			calendarId: 1,
			createdAt: new Date(),
		} as any;

		const mockCalendar = {
			id: 1,
		} as any;

		jest.spyOn(dbServices, 'getUserById').mockResolvedValue(mockUser);
		jest.spyOn(dbServices, 'getCalendarById').mockResolvedValue(mockCalendar);
		jest.spyOn(dbServices, 'getAllEvents').mockResolvedValue([]);
		(Event.findAll as jest.Mock).mockResolvedValue([]);

		const response = await request(app).get('/profile/stats').set('Authorization', 'Bearer valid-token'); // Mock authentication token

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.stats.eventsPerMonth).toHaveLength(0);
	});

	it('should return 404 if user not found', async () => {
		jest.spyOn(dbServices, 'getUserById').mockResolvedValue(null);

		const response = await request(app).get('/profile/stats').set('Authorization', 'Bearer valid-token'); // Mock authentication token

		expect(response.status).toBe(404);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toBe('User not found');
	});

	it('should return 404 if calendar not found', async () => {
		const mockUser = {
			id: 1,
			calendarId: 1,
			createdAt: new Date(),
		} as any;

		jest.spyOn(dbServices, 'getUserById').mockResolvedValue(mockUser);
		jest.spyOn(dbServices, 'getCalendarById').mockResolvedValue(null);

		const response = await request(app).get('/profile/stats').set('Authorization', 'Bearer valid-token'); // Mock authentication token

		expect(response.status).toBe(404);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toBe('Calendar not found');
	});
});
