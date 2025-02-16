import express, { Router, Request, Response, NextFunction } from 'express';
import passport from '../middlewares/passport';
import { createUser } from '../services/dbServices';
import logger from '../utils/logger';
import User from '../models/user.model';

const router: Router = express.Router();

router.post('/login', (req: Request, res: Response, next: NextFunction): void => {
	if (!req.body.username || !req.body.password) {
		res.status(400).json({ message: 'Username and password are required' });
		return;
	}

	passport.authenticate('local', (err: Error | null, user: User | false, info: any) => {
		if (err) {
			logger.error(`Login error: ${err.message}`);
			res.status(500).json({ message: 'Authentication failed' });
			return;
		}

		if (!user) {
			res.status(401).json({ message: info.message || 'Authentication failed' });
			return;
		}

		req.logIn(user, (err: Error | null) => {
			if (err) {
				logger.error(`Login error: ${err.message}`);
				res.status(500).json({ message: 'Login failed' });
				return;
			}

			logger.info(`User logged in: ${user.username}`);
			res.json({
				message: 'Logged in successfully',
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
				},
			});
		});
	})(req, res, next);
});

router.post('/logout', (req: Request, res: Response): void => {
	req.logout((err: Error | null) => {
		if (err) {
			res.status(500).json({ message: 'Logout failed' });
			return;
		}
		res.json({ message: 'Logged out successfully' });
	});
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
	const { username, password, email, firstName, lastName } = req.body;

	try {
		const userToCreate = {
			username,
			password,
			email,
			firstName,
			lastName,
		};
		const user = await createUser(userToCreate);

		if (!user) {
			res.status(500).json({ message: 'Registration failed' });
			return;
		}

		res.json({ message: 'User registered successfully', user });
	} catch (error: any) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			res.status(400).json({ message: 'Username already exists' });
		} else {
			res.status(500).json({ message: 'Registration failed', error: error.message });
		}
	}
});

router.get(
	'/google/callback',
	passport.authenticate('google', {
		failureRedirect: `${process.env.FRONTEND_URL}/login`,
		accessType: 'offline',
		prompt: 'consent',
		scope: [
			'profile',
			'email',
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/calendar.events',
			'https://www.googleapis.com/auth/gmail.send',
			'https://www.googleapis.com/auth/gmail.compose',
			'https://www.googleapis.com/auth/gmail.readonly',
		],
	}),
	(req: Request, res: Response) => {
		res.redirect(`${process.env.FRONTEND_URL}/`);
	}
);

router.get('/checkAuth', (req: Request, res: Response): void => {
	if (req.isAuthenticated()) {
		res.json({ authenticated: true, user: req.user });
	} else {
		res.status(401).json({ authenticated: false, user: null });
	}
});

router.get('/csrfToken', (req, res) => {
	res.cookie('XSRF-TOKEN', req.csrfToken(), {
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
	});
	res.json({ csrfToken: req.csrfToken() });
});

export default router;
