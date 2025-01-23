import 'jest';
import { initializeDatabase, sequelize } from '../../middlewares/db';
import Calendar from '../../models/calendar.model';
import Event from '../../models/event.model';
import User from '../../models/user.model';

beforeAll(async () => {
	await sequelize.sync({ force: true });
	await initializeDatabase();
});

afterAll(async () => {
	await sequelize.close();
});

describe('Event Model', () => {
	let user, calendar;

	beforeAll(async () => {
		user = await User.create({
			username: 'testuser',
			password: 'password123',
			email: 'test@email.com',
		});
		calendar = await Calendar.create({
			name: 'Test Calendar',
			userId: user.id,
		});
	});
	it('should create an event', async () => {
		const event = await Event.create({
			title: 'Test Event',
			startTime: new Date(),
			endTime: new Date(),
			calendarId: calendar.id,
		});
		expect(event).toBeDefined();
		expect(event.title).toBe('Test Event');
		expect(event.calendarId).toBe(calendar.id);
	});

	it('should associate an event with a calendar', async () => {
		const event = await Event.create({
			title: 'Test Event',
			startTime: new Date(),
			endTime: new Date(),
			calendarId: calendar.id,
		});
		expect(event.calendarId).toBe(calendar.id);
		const eventWithCalendar = await Event.findByPk(event.id, { include: [{ model: Calendar, as: 'calendar' }] });
		expect(eventWithCalendar?.calendarId).toBeDefined();
		expect(eventWithCalendar?.calendar?.name).toBe('Test Calendar');
	});

	it('should not create an event with an invalid calendar ID', async () => {
		await expect(
			Event.create({
				title: 'Invalid Calendar Event',
				startTime: new Date(),
				endTime: new Date(),
				calendarId: 9999,
			})
		).rejects.toThrow();
	});
});
