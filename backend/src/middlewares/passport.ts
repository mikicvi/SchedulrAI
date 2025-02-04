import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { getUserByUsername, getUserById } from '../services/dbServices';
import logger from '../utils/logger';
import User from '../models/user.model';

passport.use(
	new LocalStrategy(
		{
			usernameField: 'username',
			passwordField: 'password',
			passReqToCallback: true,
		},
		async (req, username, password, done) => {
			try {
				logger.debug(`Attempting login for username: ${username}`);
				const user = await getUserByUsername(username);
				if (!user) {
					logger.debug('User not found');
					return done(null, false, { message: 'Incorrect username.' });
				}

				const isValid = await user.validPassword(password);
				if (!isValid) {
					logger.debug('Invalid password');
					return done(null, false, { message: 'Incorrect password.' });
				}

				logger.debug('Login successful');
				return done(null, user);
			} catch (error) {
				logger.error(`Login error: ${error.message}`);
				return done(error);
			}
		}
	)
);

passport.serializeUser((user: User, done) => {
	if (!user?.id) {
		return done(new Error('Invalid user object during serialization'));
	}
	done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
	try {
		const user = await getUserById(id);
		if (!user) {
			return done(null, false);
		}
		done(null, user);
	} catch (error) {
		done(error);
	}
});

export default passport;
