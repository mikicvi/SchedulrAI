import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import {
	getUserByUsername,
	getUserById,
	getUserByGoogleIdOrEmail,
	createUser,
	updateUser,
} from '../services/dbServices';
import logger from '../utils/logger';
import User from '../models/user.model';

passport.use(
	'local',
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

passport.use(
	'google',
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
			scope: [
				'profile',
				'email',
				'https://www.googleapis.com/auth/calendar',
				'https://www.googleapis.com/auth/calendar.events',
				'https://www.googleapis.com/auth/gmail.send',
				'https://www.googleapis.com/auth/gmail.compose',
				'https://www.googleapis.com/auth/gmail.readonly',
			],
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Try to find user by email
				let user = await getUserByGoogleIdOrEmail(profile.id, profile.emails[0].value);

				if (user) {
					// Update existing user
					const [_, updatedUsers] = await updateUser(user.id, {
						googleId: profile.id,
						googleAccessToken: accessToken,
						googleRefreshToken: refreshToken || user.googleRefreshToken, // keep the old refresh token if a new one is not provided
						firstName: profile.name.givenName,
						lastName: profile.name.familyName,
					});
					logger.debug(`Updated user: ${JSON.stringify(updatedUsers[0])}`);
					return done(null, updatedUsers[0]);
				}

				const constructedUsername = `${profile.name.givenName.toLowerCase()}${profile.name.familyName
					.charAt(0)
					.toLowerCase()}${profile.id.slice(-2)}`;
				// Create new user
				const newUserObj = {
					username: constructedUsername,
					password: '', // password not needed for Google auth
					email: profile.emails[0].value,
					googleId: profile.id,
					googleAccessToken: accessToken,
					googleRefreshToken: refreshToken,
					firstName: profile.name.givenName,
					lastName: profile.name.familyName,
				};
				user = await createUser(newUserObj);
				logger.debug(`Created user: ${JSON.stringify(user)}`);

				if (!user) {
					throw new Error('Failed to create user');
				}

				return done(null, user);
			} catch (error) {
				logger.error(`Google login error: ${error.message}`);
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
