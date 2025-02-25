import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/auth';
import { getAllEvents, getCalendarById, getUserById, updateUser } from '../services/dbServices';
import { sequelize } from '../middlewares/db';
import Event from '../models/event.model';

const router = Router();

// Update user profile
router.put('/profile', ensureAuthenticated, async (req, res) => {
	try {
		const { username, email, firstName, lastName, userSettings } = req.body;

		const [_, updatedUser] = await updateUser(req.user.id, {
			username,
			email,
			firstName,
			lastName,
			userSettings,
		});

		res.json({
			success: true,
			user: updatedUser[0],
		});
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
});

// Get user profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found',
			});
		} else {
			const filteredUser = {
				id: user.id,
				username: user.username,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				userSettings: user.userSettings,
			};
			res.json({
				success: true,
				user: filteredUser,
			});
		}
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
});

// Get user stats
router.get('/profile/stats', ensureAuthenticated, async (req, res) => {
	try {
		const user = await getUserById(req.user.id);
		if (!user) {
			res.status(404).json({
				success: false,
				message: 'User not found',
			});
		} else {
			const calendar = await getCalendarById(user.calendarId);
			if (!calendar) {
				res.status(404).json({
					success: false,
					message: 'Calendar not found',
				});
			} else {
				const events = await getAllEvents(calendar.id);

				// Calculate events per month using strftime for SQLite
				const eventsPerMonth = await Event.findAll({
					attributes: [
						[sequelize.fn('strftime', '%Y-%m', sequelize.col('startTime')), 'month'],
						[sequelize.fn('COUNT', sequelize.col('id')), 'count'],
					],
					where: { calendarId: calendar.id },
					group: [sequelize.fn('strftime', '%Y-%m', sequelize.col('startTime'))],
					order: [[sequelize.fn('strftime', '%Y-%m', sequelize.col('startTime')), 'ASC']],
				});

				res.json({
					success: true,
					stats: {
						totalEvents: events.length,
						totalCalendars: 1, // Only one calendar per user
						joinedDate: user.createdAt,
						eventsPerMonth: eventsPerMonth.map((event) => ({
							month: event.get('month'),
							count: event.get('count'),
						})),
					},
				});
			}
		}
	} catch (error) {
		res.status(400).json({
			success: false,
			message: error.message,
		});
	}
});

export default router;
