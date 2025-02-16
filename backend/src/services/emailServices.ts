import { gmail } from '@googleapis/gmail';
import { oAuth2Client, refreshAccessToken } from './authServices';
import { getUserById } from './dbServices';
import logger from '../utils/logger';

async function sendEmail(userId: number, to: string, subject: string, body: string) {
	const user = await getUserById(userId);
	if (!user || !user.googleId) {
		throw new Error('This feature is only available for Google-authenticated users');
	}

	const accessToken = await refreshAccessToken(userId);
	oAuth2Client.setCredentials({ access_token: accessToken });

	const gmailClient = gmail({ version: 'v1', auth: oAuth2Client });

	const email = [`To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset=utf-8', '', body].join('\n');

	const base64EncodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

	const res = await gmailClient.users.messages.send({
		userId: 'me',
		requestBody: {
			raw: base64EncodedEmail,
		},
	});

	logger.info(`Email sent to ${to} with response: ${res.status}`);
	return res;
}

async function checkForBouncedEmails(userId: number) {
	const user = await getUserById(userId);
	if (!user || !user.googleId) {
		throw new Error('This feature is only available for Google-authenticated users');
	}

	// Refresh token again before checking bounced emails
	const accessToken = await refreshAccessToken(userId);
	oAuth2Client.setCredentials({ access_token: accessToken });

	const gmailClient = gmail({ version: 'v1', auth: oAuth2Client });

	const res = await gmailClient.users.messages.list({
		userId: 'me',
		q: 'from:mailer-daemon@* OR subject:(Mail Delivery Subsystem) newer_than:30s',
		maxResults: 5,
	});

	if (!res.data.messages) return [];

	const bouncedEmails = await Promise.all(
		res.data.messages.map(async (msg) => {
			const email = await gmailClient.users.messages.get({
				userId: 'me',
				id: msg.id,
			});

			const headers = email.data.payload?.headers || [];
			const subject = headers.find((h) => h.name === 'Subject')?.value;
			const from = headers.find((h) => h.name === 'From')?.value;

			return { id: msg.id, from, subject };
		})
	);
	logger.info('Bounced emails detected', bouncedEmails);
	return bouncedEmails;
}

export { sendEmail, checkForBouncedEmails };
