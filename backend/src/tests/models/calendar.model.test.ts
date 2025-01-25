import 'jest';
import { sequelize, initializeDatabase } from '../../middlewares/db';
import User from '../../models/user.model';
import Calendar from '../../models/calendar.model';
import Event from '../../models/event.model';

beforeAll(async () => {
	await initializeDatabase();
	await sequelize.sync({ force: true });
});

afterAll(async () => {
	await sequelize.close();
});

describe('Calendar Model', () => {
	let user;
	beforeAll(async () => {
		user = await User.create({
			username: 'testuser',
			password: 'password123',
			email: 'test@email.com',
		});
	});

	it('should create a calendar', async () => {
		const calendar = await Calendar.create({
			name: 'Test Calendar',
			userId: user.id,
		});
		expect(calendar).toBeDefined();
		expect(calendar.name).toBe('Test Calendar');
	});

	it('should associate a user with a calendar', async () => {
		const calendar = await Calendar.create({
			name: 'Test Calendar',
			userId: user.id,
		});
		expect(calendar.userId).toBe(user.id);
		const calendarWithUser = await Calendar.findByPk(calendar.id, { include: ['user'] });
		expect(calendarWithUser?.userId).toBeDefined();
		expect(calendarWithUser?.user?.username).toBe('testuser');
	});

	it('should associate events with a calendar', async () => {
		const calendar = await Calendar.create({
			name: 'Test Calendar',
			userId: user.id,
		});
		const event = await Event.create({
			title: 'Test Event',
			startTime: new Date(),
			endTime: new Date(),
			calendarId: calendar.id,
		});
		expect(event.calendarId).toBe(calendar.id);
		const calendarWithEvents = await Calendar.findByPk(calendar.id, { include: ['events'] });
		expect(calendarWithEvents?.events).toBeDefined();
		expect(calendarWithEvents?.events.length).toBe(1);
		expect(calendarWithEvents?.events[0].title).toBe('Test Event');
	});

	it('should not create a calendar with an invalid user ID', async () => {
		await expect(
			Calendar.create({
				name: 'Invalid User Calendar',
				userId: 9999,
			})
		).rejects.toThrow();
	});

	it('should not create a calendar without a name', async () => {
		await expect(
			Calendar.create({
				userId: user.id,
			})
		).rejects.toThrow();
	});
});
