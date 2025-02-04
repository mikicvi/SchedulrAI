import { Router, Request, Response } from 'express';
import passport from '../middlewares/passport';
import { createUser } from '../services/dbServices';
import logger from '../utils/logger';
import User from '../models/user.model';

const router = Router();

router.post('/login', (req: Request, res: Response, next) => {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({ message: 'Username and password are required' });
	}

	passport.authenticate('local', (err: Error, user: User | false, info: any) => {
		if (err) {
			logger.error(`Login error: ${err.message}`);
			return res.status(500).json({ message: 'Authentication failed' });
		}

		if (!user) {
			return res.status(401).json({ message: info.message || 'Authentication failed' });
		}

		req.logIn(user, (err: Error) => {
			if (err) {
				logger.error(`Login error: ${err.message}`);
				return res.status(500).json({ message: 'Login failed' });
			}
			logger.info(`User logged in: ${user.username}`);
			return res.json({
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

router.post('/logout', (req, res) => {
	req.logout((err) => {
		if (err) {
			return res.status(500).json({ message: 'Logout failed' });
		}
		res.json({ message: 'Logged out successfully' });
	});
});

router.post('/register', async (req: Request, res: Response) => {
	const { username, password, email, firstName, lastName } = req.body;
	try {
		const user = await createUser(username, password, email, firstName, lastName);
		if (!user) {
			return res.status(500).json({ message: 'Registration failed' });
		}
		res.json({ message: 'User registered successfully', user });
	} catch (error) {
		if (error.name === 'SequelizeUniqueConstraintError') {
			res.status(400).json({ message: 'Username already exists' });
		} else {
			res.status(500).json({ message: 'Registration failed', error: error.message });
		}
		logger.error(`Failed to register user: ${error}`);
	}
});

export default router;
