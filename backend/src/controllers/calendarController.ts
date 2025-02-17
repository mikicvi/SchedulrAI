import { createBaseController } from './baseController';
import { createCalendar, getCalendarById, updateCalendar, deleteCalendar } from '../services/dbServices';
import Calendar from '../models/calendar.model';

export const calendarController = createBaseController<Calendar>(
	{
		create: async ({ name, description, userId }) => {
			const result = await createCalendar(name, description, userId);
			if (!result) throw new Error('Failed to create calendar');
			return result;
		},
		getById: async (id) => {
			const result = await getCalendarById(id);
			return result || null;
		},
		update: async (id, updates) => {
			const result = await updateCalendar(id, updates);
			return result || [0, []];
		},
		delete: async (id) => {
			const result = await deleteCalendar(id);
			return result || 0;
		},
	},
	'Calendar'
);
