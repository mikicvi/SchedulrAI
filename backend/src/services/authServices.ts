import { OAuth2Client } from 'google-auth-library';
import { getUserById, updateUser } from './dbServices';
import logger from '../utils/logger';

const oAuth2Client = new OAuth2Client(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI
);

async function refreshAccessToken(userId: number) {
	const user = await getUserById(userId);
	if (!user || !user.googleId || !user.googleRefreshToken) {
		throw new Error('User not found or not authenticated with Google');
	}

	oAuth2Client.setCredentials({ refresh_token: user.googleRefreshToken });

	const { credentials } = await oAuth2Client.refreshAccessToken();
	const { access_token, refresh_token } = credentials;

	if (access_token) {
		await updateUser(userId, { googleAccessToken: access_token });
		logger.info(`Access token refreshed for user ${userId}`);
	}

	if (refresh_token) {
		await updateUser(userId, { googleRefreshToken: refresh_token });
		logger.info(`Refresh token refreshed for user ${userId}`);
	}

	return access_token;
}

export { oAuth2Client, refreshAccessToken };
