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

	it('should create a Google user without password', async () => {
		const user = await User.create({
			username: 'googleuser',
			email: 'googleuser@example.com',
			googleId: '123456789',
			googleAccessToken: 'access_token',
			googleRefreshToken: 'refresh_token',
		});
		expect(user).toBeDefined();
		expect(user.password).toBeUndefined();
		expect(user.googleId).toBe('123456789');
	});

	it('should store and retrieve user settings', async () => {
		const userSettings = {
			theme: 'dark',
			notifications: true,
			timezone: 'UTC+1',
		};
		const user = await User.create({
			username: 'settingsuser',
			password: 'password123',
			email: 'settings@example.com',
			userSettings,
		});
		const retrievedUser = await User.findByPk(user.id);
		expect(retrievedUser?.userSettings).toEqual(userSettings);
	});

	it('should store first and last name', async () => {
		const user = await User.create({
			username: 'fullnameuser',
			password: 'password123',
			email: 'fullname@example.com',
			firstName: 'John',
			lastName: 'Doe',
		});
		const retrievedUser = await User.findByPk(user.id);
		expect(retrievedUser?.firstName).toBe('John');
		expect(retrievedUser?.lastName).toBe('Doe');
	});

	it('should require password for non-Google users', async () => {
		await expect(
			User.create({
				username: 'nopassword',
				email: 'nopassword@example.com',
			})
		).rejects.toThrow('Password is required for non-Google users');
	});

	it('should hash password when updating', async () => {
		const user = await User.create({
			username: 'updateuser',
			password: 'originalpassword',
			email: 'update@example.com',
		});

		const originalHash = user.password;
		await user.update({ password: 'newpassword123' });

		expect(user.password).not.toBe(originalHash);
		expect(user.password).not.toBe('newpassword123');
		expect(await user.validPassword('newpassword123')).toBe(true);
	});
});
