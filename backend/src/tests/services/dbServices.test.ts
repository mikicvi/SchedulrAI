import 'jest';

import { initializeDatabase, sequelize } from '../../middlewares/db';
import {
	createUser,
	getUserByUsername,
	getUserById,
	getUserByGoogleIdOrEmail,
	updateUser,
	deleteUser,
	createCalendar,
	getCalendarById,
	updateCalendar,
	deleteCalendar,
	setupUserCalendar,
	createEvent,
	getEventById,
	updateEvent,
	deleteEvent,
	getAllEvents,
} from '../../services/dbServices';
import logger from '../../utils/logger';
import { syncEventToGoogle, deleteGoogleEvent, syncGoogleCalendarEvents } from '../../services/googleCalendarServices';
import { getChromaCollection } from '../../services/chromaServices';
import { indexDocuments } from '../../services/documentServices';

import * as dbServices from '../../services/dbServices';
import Event from '../../models/event.model';

// Mock the logger
jest.mock('../../utils/logger');

// Mock the googleCalendarServices
jest.mock('../../services/googleCalendarServices', () => ({
	syncEventToGoogle: jest.fn(),
	deleteGoogleEvent: jest.fn(),
	syncGoogleCalendarEvents: jest.fn(),
}));

// Mock chromaServices
jest.mock('../../services/chromaServices', () => ({
	getChromaCollection: jest.fn(),
}));

// Mock documentServices
jest.mock('../../services/documentServices', () => ({
	indexDocuments: jest.fn(),
}));

const mockUserObj = {
	username: 'testuser',
	password: 'password123',
	email: 'test@email.com',
};

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

		beforeEach(() => {
			// Reset mocks before each test
			jest.clearAllMocks();
		});

		beforeAll(async () => {
			user = await createUser(mockUserObj);
		});
		it('should create a user', async () => {
			expect(user).toBeDefined();
			expect(user.username).toBe('testuser');
		});

		it('should create a user successfully with vector collection available', async () => {
			// Mock successful vector collection retrieval
			(getChromaCollection as jest.Mock).mockResolvedValueOnce({ name: 'test-collection' });

			const newUser = await createUser({
				username: 'vectoruser',
				password: 'password123',
				email: 'vector@email.com',
			});

			expect(newUser).toBeDefined();
			expect(getChromaCollection).toHaveBeenCalled();
			expect(indexDocuments).not.toHaveBeenCalled();
			expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Vector collection:'));
		});

		it('should create a user and handle missing vector collection', async () => {
			// Mock failed vector collection retrieval
			(getChromaCollection as jest.Mock).mockRejectedValueOnce(new Error('Collection not found'));

			const newUser = await createUser({
				username: 'novectoruser',
				password: 'password123',
				email: 'novector@email.com',
			});

			expect(newUser).toBeDefined();
			expect(getChromaCollection).toHaveBeenCalled();
			expect(indexDocuments).toHaveBeenCalled();
			expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error getting vector collection'));
			expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('indexing in background'));
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

		it('should retrieve a user by email or Google ID', async () => {
			const retrievedUser = await getUserByGoogleIdOrEmail('123456789', 'test@email.com');
			expect(retrievedUser).toBeDefined();
			expect(retrievedUser && retrievedUser.username).toBe('testuser');
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
			const dupeMockUserObj = {
				username: 'dupeuser',
				password: 'dupepswrd',
				email: 'test@email.com',
			};
			await createUser(dupeMockUserObj);
			await createUser(dupeMockUserObj);
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
		it('should log an error when fails to get user by Google ID or email', async () => {
			const user = await getUserByGoogleIdOrEmail('123456789', 'non-existing-email');
			expect(user).toBeUndefined();
			expect(logger.error).toHaveBeenCalled();
		});
	});

	describe('Calendar Services', () => {
		let user;
		let calendar;

		beforeAll(async () => {
			user = await createUser(mockUserObj);
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

		it('should setup a user calendar', async () => {
			const result = await setupUserCalendar(user.id);
			expect(result).toBe(true);
		});

		it('should set up a user calendar and sync events to Google', async () => {
			const googleUser = await createUser({
				username: 'googleUser',
				password: '123',
				email: 'sample@email.com',
				googleId: 'fakeGoogleId',
			});
			expect(googleUser).toBeTruthy();
			if (!googleUser) return;
			const result = await setupUserCalendar(googleUser.id);
			expect(result).toBe(true);
			expect(syncGoogleCalendarEvents).toHaveBeenCalled();
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

		it('should log an error when failing to setup a user calendar for non existing user', async () => {
			const result = await setupUserCalendar(9999);
			expect(logger.error).toHaveBeenCalled();
			expect(result).toBe(false);
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
				user = await createUser(mockUserObj);
				calendar = await createCalendar('Test Calendar', 'Description', user.id);
				let eventObject = {
					title: 'Test Event',
					startTime: new Date(),
					endTime: new Date(),
					calendarId: calendar.id,
				};
				event = await createEvent(eventObject);
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

		it('should retrieve all events for a calendar', async () => {
			const events = await getAllEvents(calendar.id);
			expect(events).toBeDefined();
			expect(events.length).toBe(1);
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
			const testEventObject = {
				title: 'Test Event',
				startTime: new Date(),
				endTime: new Date(),
				calendarId: 9999,
			};
			await createEvent(testEventObject);
			expect(logger.error).toHaveBeenCalled();
		});

		it('should log an error when failing to get all events for a calendar', async () => {
			const events = await getAllEvents(99999);
			expect(events).toStrictEqual([]);
			expect(logger.error).toHaveBeenCalled();
		});

		describe('Google Event Sync', () => {
			it('should call syncEventToGoogle and syncGoogleCalendarEvents on event creation for a user with googleId', async () => {
				const googleUser = await createUser({
					username: 'googleUser',
					password: '123',
					email: 'google@example.com',
					googleId: 'fakeGoogleId',
				});
				expect(googleUser).toBeTruthy();
				if (!googleUser) return;
				const cal = await createCalendar('My Google Calendar', '', googleUser.id);
				if (!cal) return;
				expect(cal).toBeTruthy();
				await createEvent({
					title: 'Google Synced',
					startTime: new Date(),
					endTime: new Date(),
					calendarId: cal?.id || 0,
				});
				expect(syncEventToGoogle).toHaveBeenCalled();
				expect(syncGoogleCalendarEvents).toHaveBeenCalled();
			});
		});
	});

	describe('Google Calendar Integration', () => {
		let googleUser;
		let googleCalendar;

		// Add mock event data
		const mockEventData = {
			title: 'Test Google Event',
			startTime: new Date('2024-01-01T10:00:00Z'),
			endTime: new Date('2024-01-01T11:00:00Z'),
			description: 'Test Description',
			location: 'Test Location',
		};

		const mockGoogleEventResponse = {
			id: 'google-event-id-123',
			summary: mockEventData.title,
			description: mockEventData.description,
			location: mockEventData.location,
			start: { dateTime: mockEventData.startTime.toISOString() },
			end: { dateTime: mockEventData.endTime.toISOString() },
		};

		beforeEach(async () => {
			// Reset mocks before each test
			(syncEventToGoogle as jest.Mock).mockReset();
			(deleteGoogleEvent as jest.Mock).mockReset();
			(syncGoogleCalendarEvents as jest.Mock).mockReset();

			// Set up default mock responses
			(syncEventToGoogle as jest.Mock).mockResolvedValue(mockGoogleEventResponse);
			(deleteGoogleEvent as jest.Mock).mockResolvedValue(true);
			(syncGoogleCalendarEvents as jest.Mock).mockResolvedValue(true);

			try {
				// Create a user with Google account
				googleUser = await createUser({
					username: 'googleuser',
					password: 'password123',
					email: 'google@test.com',
					googleId: 'google123',
					googleAccessToken: 'fake-access-token',
					googleRefreshToken: 'fake-refresh-token',
				});

				if (!googleUser) {
					throw new Error('Failed to create Google user');
				}

				googleCalendar = await createCalendar('Google Calendar', 'Test Calendar', googleUser.id);
				if (!googleCalendar) {
					throw new Error('Failed to create Google Calendar');
				}
			} catch (error) {
				console.error('Setup failed:', error);
				throw error;
			}
		});

		// Cleanup after each test
		afterEach(async () => {
			if (googleCalendar?.id) {
				await deleteCalendar(googleCalendar.id);
			}
			if (googleUser?.id) {
				await deleteUser(googleUser.id);
			}
		});

		describe('Event Creation with Google Calendar', () => {
			it('should sync new event to Google Calendar with correct data', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
				});

				expect(event).toBeDefined();
				if (!event) return; // Type guard for void

				expect(syncEventToGoogle).toHaveBeenCalledWith(
					googleUser.id,
					expect.objectContaining({
						title: mockEventData.title,
						description: mockEventData.description,
						location: mockEventData.location,
						start: mockEventData.startTime,
						end: mockEventData.endTime,
					})
				);
				expect(event.resourceId).toBe(mockGoogleEventResponse.id);
			});

			it('should handle Google sync failure gracefully', async () => {
				(syncEventToGoogle as jest.Mock).mockRejectedValueOnce(new Error('Google API Error'));

				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
				});

				expect(event).toBeUndefined();
				expect(logger.error).toHaveBeenCalled();
			});

			it('should handle invalid event dates', async () => {
				const event = await createEvent({
					...mockEventData,
					startTime: new Date('invalid'),
					endTime: new Date('invalid'),
					calendarId: googleCalendar.id,
				});

				expect(event).toBeUndefined();
				expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Invalid event dates'));
				expect(syncEventToGoogle).not.toHaveBeenCalled();
			});

			it('should handle non-existent calendar', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: 99999,
				});

				expect(event).toBeUndefined();
				expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Calendar not found'));
				expect(syncEventToGoogle).not.toHaveBeenCalled();
			});

			it('should handle duplicate resourceId', async () => {
				// Create first event
				await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
					resourceId: 'existing-id',
				});

				// Reset mocks
				(logger.debug as jest.Mock).mockClear();

				// Try to create duplicate
				const duplicateEvent = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
					resourceId: 'existing-id',
				});

				expect(logger.debug).toHaveBeenCalledWith(
					expect.stringContaining('Event with resourceId existing-id already exists')
				);
			});
		});

		describe('Event Updates with Google Calendar', () => {
			it('should sync event updates to Google Calendar with correct data', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
					resourceId: 'existing-google-id',
				});

				expect(event).toBeDefined();
				if (!event) return; // Type guard for void

				const updateData = {
					title: 'Updated Title',
					description: 'Updated Description',
				};

				const updateResult = await updateEvent(event.id, updateData);
				expect(updateResult).toBeDefined();
				if (!updateResult) return; // Type guard for void

				expect(syncEventToGoogle).toHaveBeenCalledWith(
					googleUser.id,
					expect.objectContaining(updateData),
					'existing-google-id'
				);
			});

			it('should handle non-existent event during update', async () => {
				const updateResult = await updateEvent(99999, { title: 'Updated Title' });

				expect(updateResult).toBeUndefined();
				expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Event with id 99999 not found'));
				expect(syncEventToGoogle).not.toHaveBeenCalled();
			});

			it('should handle Google sync failure during update', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
					resourceId: 'existing-google-id',
				});
				expect(event).toBeDefined();
				if (!event) return;

				(syncEventToGoogle as jest.Mock).mockRejectedValueOnce(new Error('Google API Error'));

				const updateResult = await updateEvent(event.id, { title: 'Updated Title' });
				expect(updateResult).toBeUndefined();
				expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error updating event'));
			});
		});

		describe('Event Deletion with Google Calendar', () => {
			it('should handle Google deletion failure gracefully', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
					resourceId: 'google-event-id-456',
				});

				expect(event).toBeDefined();
				if (!event) return; // Type guard for void

				await deleteEvent(event.id);

				expect(deleteGoogleEvent).toHaveBeenCalledWith(googleUser.id, 'google-event-id-456');
				expect(logger.error).toHaveBeenCalled();
			});

			it('should handle non-existent event during deletion', async () => {
				const deleteResult = await deleteEvent(99999);

				expect(deleteResult).toBeUndefined();
				expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Event with id 99999 not found'));
				expect(deleteGoogleEvent).not.toHaveBeenCalled();
			});

			it('should handle Google sync failure during deletion', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
					resourceId: 'google-event-id-456',
				});
				expect(event).toBeDefined();
				if (!event) return;

				(deleteGoogleEvent as jest.Mock).mockRejectedValueOnce(new Error('Google API Error'));

				const deleteResult = await deleteEvent(event.id);
				expect(deleteResult).toBeUndefined();
				expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error deleting event'));
			});

			it('should handle event without resourceId gracefully', async () => {
				const event = await createEvent({
					...mockEventData,
					calendarId: googleCalendar.id,
				});
				expect(event).toBeDefined();
				if (!event) return;

				await deleteEvent(event.id);
				expect(deleteGoogleEvent).toHaveBeenCalled();
				expect(syncGoogleCalendarEvents).toHaveBeenCalled();
			});
		});
	});
});
