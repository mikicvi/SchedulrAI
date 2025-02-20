import { createBaseController } from './baseController';
import { createEvent, getEventById, updateEvent, deleteEvent, getAllEvents } from '../services/dbServices';
import { syncGoogleCalendarEvents } from '../services/googleCalendarServices';
import Event from '../models/event.model';

export const eventController = createBaseController<Event>(
	{
		create: async (data) => {
			const eventObj = {
				...data,
				startTime: new Date(data.startTime),
				endTime: new Date(data.endTime),
			};
			const result = await createEvent(eventObj);
			if (!result) throw new Error('Failed to create event');
			return result;
		},
		getById: async (id) => {
			const result = await getEventById(id);
			return result || null;
		},
		getAll: async (calendarId: number): Promise<Event[]> => {
			const events = await getAllEvents(calendarId);
			if (!events) {
				return [];
			}
			return events || [];
		},
		syncEvents: async (userId: number) => {
			const result = await syncGoogleCalendarEvents(userId);
			return result || false;
		},
		update: async (id, updates) => {
			const result = await updateEvent(id, updates);
			return result || [0, []];
		},
		delete: async (id) => {
			const result = await deleteEvent(id);
			return result || 0;
		},
	},
	'Event'
);
