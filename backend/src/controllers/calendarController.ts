import { Request, Response } from 'express';
import { createCalendar, getCalendarById, updateCalendar, deleteCalendar } from '../services/dbServices';
import logger from '../utils/logger';

export const calendarController = {
	async create(req: Request, res: Response) {
		const { name, description, userId } = req.body;
		try {
			const calendar = await createCalendar(name, description, userId);
			if (!calendar) {
				throw new Error('Failed to create calendar');
			}
			logger.info(`Calendar created: ${JSON.stringify(calendar)}`);
			res.status(201).location(`/calendars/${calendar?.id}`).json({
				status: 'success',
				data: calendar,
			});
		} catch (error) {
			logger.error(`Error creating calendar: ${error.message}`);
			res.status(400).json({
				status: 'error',
				message: error.message,
			});
		}
	},

	async getById(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const calendar = await getCalendarById(Number(id));
			if (calendar) {
				logger.info(`Calendar retrieved: ${JSON.stringify(calendar)}`);
				res.status(200).json({
					status: 'success',
					data: calendar,
				});
			} else {
				logger.warn(`Calendar not found: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: 'Calendar not found',
				});
			}
		} catch (error) {
			logger.error(`Error retrieving calendar: ${error.message}`);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error',
			});
		}
	},

	async update(req: Request, res: Response) {
		const { id } = req.params;
		const updates = req.body;
		try {
			const result = await updateCalendar(Number(id), updates);
			if (result && typeof result[0] === 'number' && result[0] > 0) {
				const [affectedRows, updatedCalendars] = result;
				logger.info(`Calendar updated: ${JSON.stringify(updatedCalendars)}`);
				res.status(200).json({
					status: 'success',
					data: updatedCalendars,
				});
			} else {
				logger.warn(`Calendar not found for update: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: 'Calendar not found',
				});
			}
		} catch (error) {
			logger.error(`Error updating calendar: ${error.message}`);
			res.status(400).json({
				status: 'error',
				message: error.message,
			});
		}
	},

	async delete(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const affectedRows = await deleteCalendar(Number(id));
			if (typeof affectedRows == 'number' && affectedRows > 0) {
				logger.info(`Calendar deleted: ID ${id}`);
				res.status(204).end();
			} else {
				logger.warn(`Calendar not found for deletion: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: 'Calendar not found',
				});
			}
		} catch (error) {
			logger.error(`Error deleting calendar: ${error.message}`);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error',
			});
		}
	},
};
