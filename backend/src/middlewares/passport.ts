import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getUserByUsername, getUserById } from '../services/dbServices';
import logger from '../utils/logger';
import User from '../models/user.model';
import sequelize from 'sequelize';

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
			],
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				logger.debug(`Google profile: ${JSON.stringify(profile)}`);
				logger.debug(`Access Token: ${accessToken}`);
				logger.debug(`Refresh Token: ${refreshToken || 'Not received'}`);

				let user = await User.findOne({
					where: {
						[sequelize.Op.or]: [{ googleId: profile.id }, { email: profile.emails[0].value }],
					},
				});

				if (user) {
					await user.update({
						googleId: profile.id,
						googleAccessToken: accessToken,
						googleRefreshToken: refreshToken || user.googleRefreshToken, // Keep the old refresh token if not received
						firstName: profile.name.givenName,
						lastName: profile.name.familyName,
					});
					return done(null, user);
				}

				user = await User.create({
					username: `${profile.name.givenName.toLowerCase()}${Math.floor(Math.random() * 1000)}`,
					email: profile.emails[0].value,
					googleId: profile.id,
					googleAccessToken: accessToken,
					googleRefreshToken: refreshToken,
					firstName: profile.name.givenName,
					lastName: profile.name.familyName,
				});

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
