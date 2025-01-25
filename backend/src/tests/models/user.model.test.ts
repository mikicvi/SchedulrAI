import 'jest';

import { initializeDatabase, sequelize } from '../../middlewares/db';
import User from '../../models/user.model';
import Calendar from '../../models/calendar.model';

beforeAll(async () => {
	await initializeDatabase();
	await sequelize.sync({ force: true });
});

afterAll(async () => {
	await sequelize.close();
});

describe('User Model', () => {
	it('should create a user', async () => {
		const user = await User.create({
			username: 'testuser',
			password: 'password123',
			email: 'testuser@example.com',
		});
		expect(user).toBeDefined();
		expect(user.username).toBe('testuser');
		expect(user.email).toBe('testuser@example.com');
	});

	it('should hash the password before saving', async () => {
		const user = await User.create({
			username: 'testuser2',
			password: 'password123',
			email: 'testuser2@example.com',
		});
		expect(user.password).not.toBe('password123');
		expect(await user.validPassword('password123')).toBe(true);
	});

	it('should associate a calendar with a user', async () => {
		const user = await User.create({
			username: 'testuser3',
			password: 'password123',
			email: 'testuser3@example.com',
		});
		const calendar = await Calendar.create({
			name: 'Test Calendar',
			userId: user.id,
		});
		expect(calendar.userId).toBe(user.id);
		const userWithCalendar = await User.findByPk(user.id, { include: ['calendar'] });
		expect(userWithCalendar?.calendarId).toBeDefined();
		expect(userWithCalendar?.calendar?.name).toBe('Test Calendar');
	});

	it('should not create a user with an existing username', async () => {
		await User.create({
			username: 'duplicateuser',
			password: 'password123',
			email: 'duplicateuser@example.com',
		});
		await expect(
			User.create({
				username: 'duplicateuser',
				password: 'password123',
				email: 'anotheremail@example.com',
			})
		).rejects.toThrow();
	});
});
