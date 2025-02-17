import { Request, Response } from 'express';
import { createEvent, getEventById, updateEvent, deleteEvent } from '../services/dbServices';
import logger from '../utils/logger';

export const eventController = {
	async create(req: Request, res: Response) {
		const { title, startTime, endTime, calendarId, description, location, resourceId, importance } = req.body;
		try {
			const eventObj = {
				title,
				startTime: new Date(startTime),
				endTime: new Date(endTime),
				calendarId,
				description,
				location,
				resourceId,
				importance,
			};
			const event = await createEvent(eventObj);
			if (!event) {
				throw new Error('Failed to create event');
			}
			logger.info(`Event created: ${JSON.stringify(event)}`);
			res.status(201).location(`/events/${event.id}`).json({
				status: 'success',
				data: event,
			});
		} catch (error) {
			logger.error(`Error creating event: ${error.message}`);
			res.status(400).json({
				status: 'error',
				message: error.message,
			});
		}
	},

	async getById(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const event = await getEventById(Number(id));
			if (event) {
				logger.info(`Event retrieved: ${JSON.stringify(event)}`);
				res.status(200).json({
					status: 'success',
					data: event,
				});
			} else {
				logger.warn(`Event not found: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: 'Event not found',
				});
			}
		} catch (error) {
			logger.error(`Error retrieving event: ${error.message}`);
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
			const result = await updateEvent(Number(id), updates);
			if (result && typeof result[0] === 'number' && result[0] > 0) {
				const [affectedRows, updatedEvents] = result;
				logger.info(`Event updated: ${JSON.stringify(updatedEvents)}`);
				res.status(200).json({
					status: 'success',
					data: updatedEvents,
				});
			} else {
				logger.warn(`Event not found for update: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: 'Event not found',
				});
			}
		} catch (error) {
			logger.error(`Error updating event: ${error.message}`);
			res.status(400).json({
				status: 'error',
				message: error.message,
			});
		}
	},

	async delete(req: Request, res: Response) {
		const { id } = req.params;
		try {
			const affectedRows = await deleteEvent(Number(id));
			if (typeof affectedRows === 'number' && affectedRows > 0) {
				logger.info(`Event deleted: ID ${id}`);
				res.status(204).end();
			} else {
				logger.warn(`Event not found for deletion: ID ${id}`);
				res.status(404).json({
					status: 'error',
					message: 'Event not found',
				});
			}
		} catch (error) {
			logger.error(`Error deleting event: ${error.message}`);
			res.status(500).json({
				status: 'error',
				message: 'Internal server error',
			});
		}
	},
};
