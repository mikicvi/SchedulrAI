import User, { UserAttributes } from '../models/user.model';
import Calendar, { CalendarAttributes } from '../models/calendar.model';
import Event, { EventAttributes } from '../models/event.model';
import { syncEventToGoogle, deleteGoogleEvent, syncGoogleCalendarEvents } from './googleCalendarServices';
import logger from '../utils/logger';
import sequelize from 'sequelize';
export interface CreateUserParams {
	username: string;
	password: string;
	email: string;
	googleId?: string;
	googleAccessToken?: string;
	googleRefreshToken?: string;
	firstName?: string;
	lastName?: string;
	userSettings?: any;
	calendarId?: number;
}

/**
 * Creates a new user in the database.
 *
 * @param {CreateUserParams} createUserParams - The parameters for creating a new user.
 * @returns {Promise<User | void>} A promise that resolves to the created user or void if an error occurs.
 */
export async function createUser(createUserParams: CreateUserParams): Promise<User | void> {
	const {
		username,
		password,
		email,
		googleId,
		googleAccessToken,
		googleRefreshToken,
		firstName,
		lastName,
		userSettings,
		calendarId,
	} = createUserParams;

	return await User.create({
		username,
		password,
		email,
		googleId,
		googleAccessToken,
		googleRefreshToken,
		firstName,
		lastName,
		userSettings,
		calendarId,
	}).catch((error) => {
		logger.error(`Error creating user: ${error.message}`);
	});
}

/**
 * Retrieves a user by username.
 *
 * @param {string} username - The username of the user to retrieve.
 * @returns {Promise<User>} A promise that resolves to the retrieved user.
 */
export async function getUserByUsername(username: string): Promise<User | null | void> {
	try {
		const user = await User.findOne({ where: { username } });
		if (!user) {
			throw new Error(`User with username ${username} not found`);
		}
		return user;
	} catch (error) {
		logger.error(`Error retrieving user by username: ${error.message}`);
	}
}

/**
 * Retrieves a user by ID.
 *
 * @param {number} id - The ID of the user to retrieve.
 * @returns {Promise<User | null | void>} A promise that resolves to the retrieved user, null if not found, or void if an error occurs.
 */
export async function getUserById(id: number): Promise<User | null | void> {
	try {
		const user = await User.findByPk(id);
		if (!user) {
			throw new Error(`User with the id ${id} not found`);
		}
		return user;
	} catch (error) {
		logger.error(`Error retrieving user by id: ${error.message}`);
	}
}

/**
 * Retrieves a user by Google ID or email.
 *
 * @param {string} googleId - The Google ID of the user to retrieve.
 * @param {string} email - The email of the user to retrieve.
 * @returns {Promise<User | null | void>} A promise that resolves to the retrieved user, null if not found, or void if an error occurs.
 */
export async function getUserByGoogleIdOrEmail(googleId: string, email: string): Promise<User | null | void> {
	try {
		const user = await User.findOne({
			where: {
				[sequelize.Op.or]: [{ googleId }, { email }],
			},
		});
		if (!user) {
			throw new Error(`User with Google ID ${googleId} or email ${email} not found`);
		}
		return user;
	} catch (error) {
		logger.error(`Error retrieving user by Google ID or email: ${error.message}`);
	}
}

/**
 * Updates a user in the database. SQLite does not support "returning: true" option in UPDATE or INSERT queries.
 * This is a limitation of SQLite itself where it does not have native support for returning rows directly.
 *
 * @param {number} id - The ID of the user to update.
 * @param {Partial<UserAttributes>} updates - An object containing the user attributes to update.
 * @returns {Promise<[number, User[]]>} A promise that resolves to the number of affected rows and the affected users.
 * @throws Will throw an error if the update operation fails.
 */
export async function updateUser(id: number, updates: Partial<UserAttributes>): Promise<[number, User[]]> {
	try {
		const affectedRows = await User.update(updates, { where: { id } });
		if (affectedRows[0] > 0) {
			const updatedUser = await User.findAll({ where: { id } });
			return [affectedRows[0], updatedUser];
		}
		throw new Error(`Update ${JSON.stringify(updates)} could not be performed on the user with ${id}`);
	} catch (error) {
		logger.error(`Error updating user: ${error.message}`);
	}
}

/**
 * Deletes a user from the database.
 *
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise<number | void>} A promise that resolves to the number of affected rows or void if an error occurs.
 */
export async function deleteUser(id: number): Promise<number | void> {
	try {
		const deletedUser = await User.destroy({ where: { id } });
		if (!deletedUser) {
			throw new Error(`User with id:${id} could not be deleted.`);
		}
		return deletedUser;
	} catch (error) {
		logger.error(`Error deleting user: ${error.message}`);
	}
}

/**
 * Creates a new calendar in the database.
 *
 * @param {string} name - The name of the new calendar.
 * @param {string} [description] - The description of the new calendar (optional).
 * @param {number} [userId] - The ID of the user associated with the calendar (optional).
 * @returns {Promise<Calendar | void>} A promise that resolves to the created calendar or void if an error occurs.
 */
export async function createCalendar(name: string, description?: string, userId?: number): Promise<Calendar | void> {
	return await Calendar.create({ name, description, userId }).catch((error) => {
		logger.error(`Error creating calendar: ${error.message}`);
	});
}

/**
 * Retrieves a calendar by ID.
 *
 * @param {number} id - The ID of the calendar to retrieve.
 * @returns {Promise<Calendar | null | void>} A promise that resolves to the retrieved calendar, null if not found, or void if an error occurs.
 */
export async function getCalendarById(id: number): Promise<Calendar | null | void> {
	try {
		const calendar = await Calendar.findByPk(id);
		if (!calendar) {
			throw new Error(`Calendar with the id ${id} not found`);
		}
		return calendar;
	} catch (error) {
		logger.error(`Error retrieving calendar by ID: ${error.message}`);
	}
}

/**
 * Updates a calendar in the database.
 *
 * @param {number} id - The ID of the calendar to update.
 * @param {Partial<CalendarAttributes>} updates - An object containing the calendar attributes to update.
 * @returns {Promise<[number, Calendar[]] | void>} A promise that resolves to the number of affected rows and the affected calendars, or void if an error occurs.
 */
export async function updateCalendar(
	id: number,
	updates: Partial<CalendarAttributes>
): Promise<[number, Calendar[]] | void> {
	try {
		// Perform the update
		const affectedRows = await Calendar.update(updates, { where: { id } });

		// If rows were affected, fetch the updated calendar(s)
		if (affectedRows[0] > 0) {
			const updatedCalendars = await Calendar.findAll({ where: { id } });
			return [affectedRows[0], updatedCalendars];
		}
		throw new Error(`Update ${JSON.stringify(updates)} could not be performed on the calendar with ${id}`);
	} catch (error) {
		// Log and handle errors
		logger.error(`Error updating calendar: ${error.message}`);
	}
}

/**
 * Deletes a calendar from the database.
 *
 * @param {number} id - The ID of the calendar to delete.
 * @returns {Promise<number | void>} A promise that resolves to the number of affected rows or void if an error occurs.
 */
export async function deleteCalendar(id: number): Promise<number | void> {
	try {
		const destroyedCalendar = await Calendar.destroy({ where: { id } });
		if (!destroyedCalendar) {
			throw new Error(`Calendar with the id ${id} could not be deleted`);
		}
		return destroyedCalendar;
	} catch (error) {
		logger.error(`Error deleting calendar: ${error.message}`);
	}
}

/**
 * Creates a new event in the database.
 *
 * @param {EventAttributes} createEventParams - Calendar event attributes
 * @returns {Promise<Event | void>} A promise that resolves to the created event or void if an error occurs.
 */
export async function createEvent(createEventParams: EventAttributes): Promise<Event | void> {
	try {
		const { title, description, startTime, endTime, calendarId, location, resourceId, importance } =
			createEventParams;

		// Validate dates before proceeding
		if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
			throw new Error('Invalid event dates');
		}

		const calendar = await getCalendarById(calendarId);
		if (!calendar) throw new Error('Calendar not found');

		const user = await getUserById(calendar.userId);
		if (!user) throw new Error('User not found');

		// Check if event with this resourceId already exists
		if (resourceId) {
			const existingEvent = await Event.findOne({
				where: { resourceId },
			});
			if (existingEvent) {
				logger.debug(`Event with resourceId ${resourceId} already exists, skipping creation`);
				return existingEvent;
			}
		}

		// Create local event first
		const event = await Event.create({
			title,
			description,
			startTime,
			endTime,
			calendarId,
			location,
			resourceId,
			importance,
		});

		// Sync with Google Calendar only if user has Google account and no resourceId exists
		if (user.googleId && !resourceId) {
			const googleEvent = await syncEventToGoogle(calendar.userId, {
				title: event.title,
				description: event.description,
				location: event.location,
				start: event.startTime,
				end: event.endTime,
				importance: event.importance,
			});

			if (googleEvent?.id) {
				await event.update({ resourceId: googleEvent.id });
			}
		}

		// Trigger sync after creating event
		if (user.googleId) {
			await syncGoogleCalendarEvents(user.id);
		}

		return event;
	} catch (error) {
		logger.error(`Error creating event: ${error.message}`);
	}
}

/**
 * Retrieves an event by ID.
 *
 * @param {number} id - The ID of the event to retrieve.
 * @returns {Promise<Event | null | void>} A promise that resolves to the retrieved event, null if not found, or void if an error occurs.
 */
export async function getEventById(id: number): Promise<Event | null | void> {
	try {
		const event = await Event.findByPk(id);
		if (!event) {
			throw new Error(`Event with ${id} not found`);
		}
		return event;
	} catch (error) {
		logger.error(`Error retrieving event by ID: ${error.message}`);
	}
}

/**
 * Updates an event in the database.
 *
 * @param {number} id - The ID of the event to update.
 * @param {Partial<EventAttributes>} updates - An object containing the event attributes to update.
 * @returns {Promise<[number, Event[]] | void>} A promise that resolves to the number of affected rows and the affected events, or void if an error occurs.
 */
export async function updateEvent(id: number, updates: Partial<EventAttributes>): Promise<[number, Event[]] | void> {
	try {
		const event = await Event.findByPk(id);
		if (!event) throw new Error(`Event with id ${id} not found`);

		const calendar = await getCalendarById(event.calendarId);
		if (!calendar) throw new Error('Calendar not found');

		const user = await getUserById(calendar.userId);
		if (!user) throw new Error('User not found');

		const affectedRows = await Event.update(updates, { where: { id } });

		if (affectedRows[0] > 0) {
			const updatedEvents = await Event.findAll({ where: { id } });

			// Sync with Google Calendar only if user has Google account and event has resourceId
			if (user.googleId && event.resourceId) {
				const updatedEvent = updatedEvents[0];
				await syncEventToGoogle(
					calendar.userId,
					{
						title: updatedEvent.title,
						description: updatedEvent.description,
						location: updatedEvent.location,
						start: updatedEvent.startTime,
						end: updatedEvent.endTime,
						importance: updatedEvent.importance,
					},
					event.resourceId
				);
			}

			// Trigger sync after updating event
			if (user.googleId) {
				await syncGoogleCalendarEvents(user.id);
			}

			return [affectedRows[0], updatedEvents];
		}
		throw new Error(`Update could not be performed on the event with ${id}`);
	} catch (error) {
		logger.error(`Error updating event: ${error.message}`);
	}
}

/**
 * Deletes an event from the database.
 *
 * @param {number} id - The ID of the event to delete.
 * @returns {Promise<number | void>} A promise that resolves to the number of affected rows or void if an error occurs.
 */
export async function deleteEvent(id: number): Promise<number | void> {
	try {
		const event = await Event.findByPk(id);
		if (!event) throw new Error(`Event with id ${id} not found`);

		const calendar = await getCalendarById(event.calendarId);
		if (!calendar) throw new Error('Calendar not found');

		const user = await getUserById(calendar.userId);
		if (!user) throw new Error('User not found');

		// Delete from Google Calendar only if user has Google account and event has resourceId
		if (user.googleId && event.resourceId) {
			await deleteGoogleEvent(calendar.userId, event.resourceId);
		}

		const deletedEvent = await Event.destroy({ where: { id } });
		if (!deletedEvent) {
			throw new Error(`Could not delete an event with id: ${id}`);
		}

		// Trigger sync after deleting event
		if (user.googleId) {
			await syncGoogleCalendarEvents(user.id);
		}

		return deletedEvent;
	} catch (error) {
		logger.error(`Error deleting event: ${error.message}`);
	}
}

export async function setupUserCalendar(userId: number): Promise<boolean> {
	try {
		const calendar = await createCalendar('Personal', 'Personal calendar', userId);
		if (!calendar) {
			return false;
		}
		await updateUser(userId, { calendarId: calendar.id });
		const user = await getUserById(userId);
		if (!user) throw new Error('User not found');

		// Only sync if user has Google account
		if (user.googleId) {
			// Use syncGoogleCalendarEvents instead of manual event creation
			await syncGoogleCalendarEvents(userId);
		}
		logger.info(`Calendar setup successfully for user ${userId}`);
		return true;
	} catch (error) {
		logger.error(`Failed to setup calendar for user ${userId}: ${error.message}`);
		return false;
	}
}

export async function getAllEvents(calendarId: number): Promise<Event[]> {
	try {
		const events = await Event.findAll({
			where: { calendarId },
			order: [['startTime', 'ASC']],
		});
		logger.info(`Retrieved ${events.length} events for calendar ${calendarId}`);
		return events;
	} catch (error) {
		logger.error(`Error retrieving events for calendar ${calendarId}: ${error.message}`);
		return [];
	}
}
