import User, { UserAttributes } from '../models/user.model';
import Calendar, { CalendarAttributes } from '../models/calendar.model';
import Event, { EventAttributes } from '../models/event.model';
import logger from '../utils/logger'; // Assuming you have a logger utility
import sequelize from 'sequelize';

/**
 * Creates a new user in the database.
 *
 * @param {string} username - The username of the new user.
 * @param {string} password - The password for the new user.
 * @param {string} email - The email address of the new user.
 * @param {string} googleId - The Google ID of the new user.
 * @param {string} googleAccessToken - The Google access token of the new user.
 * @param {string} googleRefreshToken - The Google refresh token of the new user.
 * @param {string} [firstName] - The first name of the new user (optional).
 * @param {string} [lastName] - The last name of the new user (optional).
 * @param {any} [userSettings] - Additional settings for the user (optional).
 * @param {number} [calendarId] - The ID of the user's calendar (optional).
 * @returns {Promise<User | void>} A promise that resolves to the created user or void if an error occurs.
 */
export async function createUser(
	username: string,
	password: string,
	email: string,
	googleId?: string,
	googleAccessToken?: string,
	googleRefreshToken?: string,
	firstName?: string,
	lastName?: string,
	userSettings?: any,
	calendarId?: number
): Promise<User | void> {
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
 * @param {string} title - The title of the new event.
 * @param {Date} startTime - The start time of the new event.
 * @param {Date} endTime - The end time of the new event.
 * @param {number} calendarId - The ID of the calendar associated with the event.
 * @param {string} [description] - The description of the new event (optional).
 * @returns {Promise<Event | void>} A promise that resolves to the created event or void if an error occurs.
 */
export async function createEvent(
	title: string,
	startTime: Date,
	endTime: Date,
	calendarId: number,
	description?: string
): Promise<Event | void> {
	return await Event.create({ title, startTime, endTime, calendarId, description }).catch((error) => {
		logger.error(`Error creating event: ${error.message}`);
	});
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
		// Perform updates
		const affectedRows = await Event.update(updates, { where: { id } });
		// Fetch affected events
		if (affectedRows[0] > 0) {
			const updatedEvents = await Event.findAll({ where: { id } });
			return [affectedRows[0], updatedEvents];
		}
		throw new Error(`Update ${JSON.stringify(updates)} could not be performed on the event with ${id}`);
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
		const deletedEvent = await Event.destroy({ where: { id } });
		if (!deletedEvent) {
			throw new Error(`Could not delete an event with id: ${id}`);
		}
		return deletedEvent;
	} catch (error) {
		logger.error(`Error deleting event: ${error.message}`);
	}
}
