import { calendar, calendar_v3 } from '@googleapis/calendar';
import { OAuth2Client } from 'google-auth-library';
import { refreshAccessToken } from './authServices';
import { getUserById, getAllEvents, updateEvent, deleteEvent, createEvent } from './dbServices';
import { Importance } from '../models/event.model';
import logger from '../utils/logger';
import { importanceToGoogleColor, googleColorToImportance } from '../utils/colorMapping';

const googleCalendar = calendar('v3');

// Add sync protection to prevent multiple rapid syncs
const syncProtection = new Map<string, boolean>();
const calendarSyncProtection = new Map<number, boolean>();

/**
 * Retrieves events from a user's Google Calendar within a specified time range.
 *
 * @param userId - The unique identifier of the user whose calendar events are being retrieved
 * @returns Promise that resolves to:
 *  - An array of calendar events if successful
 *  - null if:
 *    - User not found
 *    - User has no Google ID
 *    - Error occurs during fetch
 *
 * @remarks
 * - Fetches events from current date to 2 months in the future
 * - Limited to 250 events maximum
 * - Only retrieves non-deleted events
 * - Expands recurring events into individual instances
 * - Returns specific fields: id, summary, description, location, start, end, updated, recurringEventId, colorId
 *
 * @throws Logs error if Google Calendar API request fails
 */
export async function getGoogleCalendarEvents(userId: number) {
	try {
		const user = await getUserById(userId);
		if (!user || !user.googleId) {
			return null;
		}

		const accessToken = await refreshAccessToken(userId);
		const oauth2Client = new OAuth2Client();
		oauth2Client.setCredentials({ access_token: accessToken });

		// Get current date at start of day
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		// Calculate date 2 months from now
		const twoMonthsFromNow = new Date(now);
		const twoMonthsAgo = new Date(now);
		twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
		twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

		const response = await googleCalendar.events.list({
			auth: oauth2Client,
			calendarId: 'primary',
			timeMin: twoMonthsAgo.toISOString(),
			timeMax: twoMonthsFromNow.toISOString(),
			maxResults: 250,
			singleEvents: true, // This ensures recurring events are expanded
			orderBy: 'startTime',
			showDeleted: false,
			fields: 'items(id,summary,description,location,start,end,updated,recurringEventId, colorId)',
		});

		return response.data.items || [];
	} catch (error) {
		logger.error(`Failed to fetch Google Calendar events: ${error}`);
		return null;
	}
}

/**
 * Synchronizes an event with Google Calendar by either creating a new event or updating an existing one.
 * Includes duplicate detection and sync protection mechanisms.
 *
 * @param userId - The unique identifier of the user
 * @param event - The event object to be synchronized
 * @param event.title - The title of the event
 * @param event.description - Optional description of the event
 * @param event.location - Optional location of the event
 * @param event.start - Start date and time of the event
 * @param event.end - End date and time of the event
 * @param event.importance - Optional importance level of the event
 * @param googleEventId - Optional Google Calendar event ID for updating existing events
 *
 * @returns Promise that resolves to the created/updated Google Calendar event data or null if:
 * - Sync is already in progress
 * - User is not found or has no Google ID
 * - A duplicate event is detected
 * - Sync operation fails
 *
 * @throws Error if event dates are invalid
 */
export async function syncEventToGoogle(
	userId: number,
	event: {
		title: string;
		description?: string;
		location?: string;
		start: Date;
		end: Date;
		importance?: Importance;
	},
	googleEventId?: string
) {
	const syncKey = `${userId}-${event.title}-${event.start.toISOString()}`;

	try {
		// Check if sync is already in progress
		if (syncProtection.get(syncKey)) {
			logger.warn(`Sync already in progress for event: ${syncKey}`);
			return null;
		}

		syncProtection.set(syncKey, true);

		const user = await getUserById(userId);
		if (!user || !user?.googleId) {
			return null;
		}

		// Validate dates
		if (!event.start || !event.end || isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
			throw new Error('Invalid event dates');
		}

		const accessToken = await refreshAccessToken(userId);
		const oauth2Client = new OAuth2Client();
		oauth2Client.setCredentials({ access_token: accessToken });

		// Check for duplicate events if creating new event
		if (!googleEventId) {
			const existingEvents = await googleCalendar.events.list({
				auth: oauth2Client,
				calendarId: 'primary',
				timeMin: new Date(event.start.getTime() - 5 * 60000).toISOString(), // 5 minutes before
				timeMax: new Date(event.start.getTime() + 5 * 60000).toISOString(), // 5 minutes after
				q: event.title, // Search by title
			});

			const isDuplicate = existingEvents.data.items?.some(
				(existing) => existing.summary === event.title && existing.start?.dateTime === event.start.toISOString()
			);

			if (isDuplicate) {
				logger.warn(`Duplicate event detected: ${event.title}`);
				return null;
			}
		}

		const eventResource = {
			summary: event.title,
			description: event.description,
			location: event.location,
			start: { dateTime: event.start.toISOString() },
			end: { dateTime: event.end.toISOString() },
			colorId: event.importance ? importanceToGoogleColor(event.importance) : '8',
		};

		if (googleEventId) {
			// Update existing event
			const response = await googleCalendar.events.update({
				auth: oauth2Client,
				calendarId: 'primary',
				eventId: googleEventId,
				requestBody: eventResource,
			});
			return response.data;
		} else {
			// Create new event
			const response = await googleCalendar.events.insert({
				auth: oauth2Client,
				calendarId: 'primary',
				requestBody: eventResource,
			});
			return response.data;
		}
	} catch (error) {
		logger.error(`Failed to sync event to Google Calendar: ${error}`);
		return null;
	} finally {
		// Clear sync protection
		syncProtection.delete(syncKey);
	}
}

/**
 * Deletes an event from the user's Google Calendar.
 *
 * @param userId - The ID of the user whose calendar event should be deleted
 * @param googleEventId - The Google Calendar event ID to delete
 * @returns Promise<boolean> - Returns true if the event was successfully deleted, false otherwise
 * @throws Will log error and return false if deletion fails
 */
export async function deleteGoogleEvent(userId: number, googleEventId: string) {
	try {
		const user = await getUserById(userId);
		if (!user || !user?.googleId) {
			return false;
		}

		const accessToken = await refreshAccessToken(userId);
		const oauth2Client = new OAuth2Client();
		oauth2Client.setCredentials({ access_token: accessToken });

		await googleCalendar.events.delete({
			auth: oauth2Client,
			calendarId: 'primary',
			eventId: googleEventId,
		});

		return true;
	} catch (error) {
		logger.error(`Failed to delete Google Calendar event: ${error}`);
		return false;
	}
}

/**
 * Processes a Google Calendar event by either creating a new local event or updating an existing one.
 *
 * @param googleEvent - The event object from Google Calendar API
 * @param localEventMap - Map of existing local events indexed by their Google Calendar IDs
 * @param processedEvents - Set to track already processed events and prevent duplicates
 * @param calendarId - The ID of the local calendar where events should be created
 *
 * @returns An object containing counts of created and updated events
 *          - created: number of newly created events (0 or 1)
 *          - updated: number of updated events (0 or 1)
 *
 * @remarks
 * - Skips events without an ID or start dateTime
 * - Prevents duplicate processing using eventKey (combination of ID and start time)
 * - Updates local event if Google event is more recent
 * - Creates new local event if no matching event exists
 * - Maps Google Calendar color IDs to importance levels
 */
async function processGoogleEvent(
	googleEvent: calendar_v3.Schema$Event,
	localEventMap: Map<string, any>,
	processedEvents: Set<string>,
	calendarId: number
) {
	if (!googleEvent.id || !googleEvent.start?.dateTime) return { created: 0, updated: 0 };

	const eventKey = `${googleEvent.id}_${googleEvent.start.dateTime}`;
	if (processedEvents.has(eventKey)) {
		logger.debug(`Skipping duplicate event: ${eventKey}`);
		return { created: 0, updated: 0 };
	}
	processedEvents.add(eventKey);

	const localEvent = localEventMap.get(googleEvent.id);
	const googleLastUpdated = new Date(googleEvent.updated);

	if (localEvent && googleLastUpdated > localEvent.updatedAt) {
		await updateEvent(localEvent.id, {
			title: googleEvent.summary,
			description: googleEvent.description,
			location: googleEvent.location,
			startTime: new Date(googleEvent.start.dateTime),
			endTime: new Date(googleEvent.end?.dateTime || googleEvent.start.dateTime),
			updatedAt: googleLastUpdated,
			importance: googleEvent.colorId ? googleColorToImportance(googleEvent.colorId) : null,
		});
		return { created: 0, updated: 1 };
	}

	if (!localEvent) {
		await createEvent({
			title: googleEvent.summary || 'Untitled Event',
			description: googleEvent.description,
			startTime: new Date(googleEvent.start.dateTime),
			endTime: new Date(googleEvent.end?.dateTime || googleEvent.start.dateTime),
			calendarId: calendarId,
			location: googleEvent.location,
			resourceId: googleEvent.id,
			importance: googleEvent.colorId ? googleColorToImportance(googleEvent.colorId) : null,
		});
		return { created: 1, updated: 0 };
	}

	return { created: 0, updated: 0 };
}

/**
 * Synchronizes events between Google Calendar and local calendar for a specific user.
 *
 * This function performs a two-way sync by:
 * 1. Fetching events from Google Calendar
 * 2. Comparing them with local events
 * 3. Creating/updating/deleting events as needed
 *
 * The function uses a protection mechanism to prevent concurrent syncs for the same user.
 *
 * @param userId - The ID of the user whose calendar needs to be synced
 * @returns Promise<boolean> - Returns true if sync was successful, false otherwise
 *
 * @throws Will throw an error if there are issues accessing Google Calendar or database
 *
 * @remarks
 * The function maintains a sync lock using calendarSyncProtection to prevent concurrent syncs.
 * The lock is always released in the finally block, even if an error occurs.
 *
 */
export async function syncGoogleCalendarEvents(userId: number): Promise<boolean> {
	if (calendarSyncProtection.get(userId)) {
		logger.warn(`Calendar sync already in progress for user: ${userId}`);
		return false;
	}

	try {
		calendarSyncProtection.set(userId, true);
		logger.info(`Starting calendar sync for user: ${userId}`);

		const user = await getUserById(userId);
		if (!user || !user?.googleId || !user?.calendarId) {
			logger.warn(`User ${userId} not found or missing Google/Calendar ID`);
			return false;
		}

		const googleEvents = await getGoogleCalendarEvents(userId);
		if (!googleEvents) {
			logger.warn(`No Google events found for user: ${userId}`);
			return false;
		}

		// Get existing events only once
		const localEvents = await getAllEvents(user.calendarId);
		logger.info(`Found ${localEvents.length} local events for user ${userId}`);

		// Create maps for efficient lookups
		const localEventMap = new Map(localEvents.filter((e) => e.resourceId).map((e) => [e.resourceId, e]));
		const processedEvents = new Set<string>();
		let createdCount = 0;
		let updatedCount = 0;
		let deletedCount = 0;

		// Batch process Google events
		for (const googleEvent of googleEvents) {
			const { created, updated } = await processGoogleEvent(
				googleEvent,
				localEventMap,
				processedEvents,
				user.calendarId
			);
			createdCount += created;
			updatedCount += updated;
		}

		for (const [resourceId, localEvent] of localEventMap) {
			if (!googleEvents.some((ge) => ge.id === resourceId)) {
				await deleteEvent(localEvent.id);
				deletedCount++;
			}
		}

		logger.info(
			`Sync completed for user ${userId}. Created: ${createdCount}, Updated: ${updatedCount}, Deleted: ${deletedCount}`
		);
		return true;
	} catch (error) {
		logger.error(`Failed to sync Google Calendar events: ${error}`);
		return false;
	} finally {
		// Always clean up the sync lock
		calendarSyncProtection.delete(userId);
		logger.info(`Sync lock released for user: ${userId}`);
	}
}
