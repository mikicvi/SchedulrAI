import 'jest';

import { initializeDatabase, sequelize } from '../../middlewares/db';
import {
	createUser,
	getUserByUsername,
	getUserById,
	updateUser,
	deleteUser,
	createCalendar,
	getCalendarById,
	updateCalendar,
	deleteCalendar,
	createEvent,
	getEventById,
	updateEvent,
	deleteEvent,
} from '../../services/dbServices';
import logger from '../../utils/logger';

jest.mock('../../utils/logger'); // Mock the logger

beforeAll(async () => {
	await initializeDatabase();
	await sequelize.sync({ force: true });
});

afterAll(async () => {
	await sequelize.close();
});

describe('Database Services', () => {
	describe('User Services', () => {
		let user;

		beforeAll(async () => {
			user = await createUser('testuser', 'password123', 'test@email.com');
		});
		it('should create a user', async () => {
			expect(user).toBeDefined();
			expect(user.username).toBe('testuser');
		});

		it('should retrieve a user by username', async () => {
			const retrievedUser = await getUserByUsername('testuser');
			expect(retrievedUser).toBeDefined();
			expect(retrievedUser && retrievedUser.username).toBe('testuser');
		});

		it('should retrieve a user by ID', async () => {
			const retrievedUser = await getUserById(user.id);
			expect(retrievedUser).toBeDefined();
			expect(retrievedUser && retrievedUser?.id).toBe(user.id);
		});

		it('should update a user', async () => {
			const result = await updateUser(user.id, { firstName: 'Updated' });
			console.log(`user: ${user}`);
			console.log(`result from update: ${result}`);
			expect(result).toBeDefined();
			if (result) {
				const [affectedRows, updatedUsers] = result;
				expect(affectedRows).toBe(1);
				expect(updatedUsers[0].firstName).toBe('Updated');
			}
		});

		it('should delete a user', async () => {
			const affectedRows = await deleteUser(user.id);
			expect(affectedRows).toBe(1);
		});
		it('should not retrieve a non-existent user by ID', async () => {
			const retrievedUser = await getUserById(9999);
			expect(retrievedUser).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should not update a non-existent user and log an error', async () => {
			await updateUser(9999, { firstName: 'Not-updated' });
			expect(logger.error).toHaveBeenCalled();
		});

		it('should log an error when failing to create a user - duplicate users', async () => {
			await createUser('dupeuser', 'dupepswrd', 'test@email.com');
			await createUser('dupeuser', 'dupepswrd', 'test@email.com');
			expect(logger.error).toHaveBeenCalled();
		});

		it('should log an error when fails to get user by username', async () => {
			const user = await getUserByUsername('non-existing-user');
			expect(user).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});
		it('should log an error when fails to delete the user', async () => {
			const deletedUser = await deleteUser(1234);
			expect(deletedUser).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('Calendar Services', () => {
		let user;
		let calendar;

		beforeAll(async () => {
			user = await createUser('testuser', 'password123', 'test@email.com');
			calendar = await createCalendar('Test Calendar', 'Description', user.id);
		});

		it('should create a calendar', async () => {
			expect(calendar).toBeDefined();
			expect(calendar.name).toBe('Test Calendar');
		});

		it('should retrieve a calendar by ID', async () => {
			const retrievedCalendar = await getCalendarById(calendar.id);
			expect(retrievedCalendar).toBeDefined();
			if (retrievedCalendar) {
				expect(retrievedCalendar.id).toBe(calendar.id);
			}
		});

		it('should update a calendar', async () => {
			const result = await updateCalendar(calendar.id, { name: 'Updated Calendar' });
			expect(result).toBeDefined();
			if (result) {
				const [affectedRows, updatedCalendars] = result;
				expect(affectedRows).toBe(1);
				expect(updatedCalendars[0].name).toBe('Updated Calendar');
			}
		});

		it('should delete a calendar', async () => {
			const affectedRows = await deleteCalendar(calendar.id);
			expect(affectedRows).toBe(1);
		});

		it('should not retrieve a non-existent calendar by ID and log an error', async () => {
			const retrievedCalendar = await getCalendarById(9999);
			expect(retrievedCalendar).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should not update a non-existent calendar and log an error', async () => {
			const result = await updateCalendar(9999, { name: 'Updated Calendar' });
			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should not delete a non-existent calendar and log an error', async () => {
			const result = await deleteCalendar(9999);
			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should log an error when failing to create a calendar', async () => {
			await createCalendar('', '', 9999);
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('Event Services', () => {
		let user;
		let calendar;
		let event;

		beforeAll(async () => {
			await initializeDatabase();
			await sequelize.sync({ force: true });
			try {
				user = await createUser('testuser', 'password123', 'test@email.com');
				calendar = await createCalendar('Test Calendar', 'Description', user.id);
				event = await createEvent('Test Event', new Date(), new Date(), calendar.id);
			} catch (error) {
				console.error('Error during setup:', error);
			}
		});

		it('should create an event', async () => {
			expect(event).toBeDefined();
			expect(event.title).toBe('Test Event');
		});

		it('should retrieve an event by ID', async () => {
			const retrievedEvent = await getEventById(event.id);
			expect(retrievedEvent).toBeDefined();
			if (retrievedEvent) {
				expect(retrievedEvent?.id).toBe(event.id);
			}
		});

		it('should update an event', async () => {
			const result = await updateEvent(event.id, { title: 'Updated Event' });
			expect(result).toBeDefined();
			if (result) {
				const [affectedRows, updatedEvents] = result;
				expect(affectedRows).toBe(1);
				expect(updatedEvents[0].title).toBe('Updated Event');
			}
		});

		it('should delete an event', async () => {
			const affectedRows = await deleteEvent(event.id);
			expect(affectedRows).toBe(1);
		});

		it('should not retrieve a non-existent event by ID', async () => {
			const retrievedEvent = await getEventById(9999);
			expect(retrievedEvent).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should not update a non-existent event', async () => {
			const result = await updateEvent(9999, { title: 'Updated Event' });
			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should not delete a non-existent event', async () => {
			const affectedRows = await deleteEvent(9999);
			expect(affectedRows).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});

		it('should log an error when failing to create an event', async () => {
			await createEvent('Test Event', new Date(), new Date(), 9999);
			expect(logger.error).toHaveBeenCalled();
		});
	});
});
