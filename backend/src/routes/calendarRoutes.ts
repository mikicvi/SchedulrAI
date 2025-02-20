import express from 'express';
import { calendarController } from '../controllers/calendarController';
import { eventController } from '../controllers/eventController';
import { ensureAuthenticated } from '../middlewares/auth';

const router = express.Router();

// Calendar routes
router.post('/calendars', ensureAuthenticated, calendarController.create);
router.get('/calendars/:id', ensureAuthenticated, calendarController.getById);
router.put('/calendars/:id', ensureAuthenticated, calendarController.update);
router.delete('/calendars/:id', ensureAuthenticated, calendarController.delete);

// Calendar events routes (nested resource)
router.get('/calendars/:id/events', ensureAuthenticated, eventController.getAll);

// Event routes
router.post('/events', ensureAuthenticated, eventController.create);
router.get('/events/:id', ensureAuthenticated, eventController.getById);
router.put('/events/:id', ensureAuthenticated, eventController.update);
router.delete('/events/:id', ensureAuthenticated, eventController.delete);
router.post('/events/sync/:id', ensureAuthenticated, eventController.syncEvents);

export default router;
