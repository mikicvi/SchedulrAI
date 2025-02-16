import express from 'express';
import { sendEmail, checkForBouncedEmails } from '../services/emailServices';
import { ensureAuthenticated } from '../middlewares/auth';
import logger from '../utils/logger';

const router = express.Router();

router.post('/email/send', ensureAuthenticated, async (req, res) => {
	const { to, subject, body } = req.body;
	const userId = req.user.id;

	try {
		const emailResponse = await sendEmail(userId, to, subject, body);
		// Give some time for the email to be processed and bounced back if it's invalid
		await new Promise((resolve) => setTimeout(resolve, 2500));

		try {
			const bouncedEmails = await checkForBouncedEmails(userId);

			if (bouncedEmails.length > 0) {
				logger.error('Email not sent - bounced emails detected', bouncedEmails);
				res.status(400).json({
					message:
						'Email not sent - please check recipient email address for typos. You can check your inbox for detailed error messages.',
					bouncedEmails,
				});
				return;
			}
		} catch (bounceError) {
			res.status(500).json({
				message: 'Error checking for bounced emails',
				error: bounceError.message,
			});
			return;
		}

		res.json({
			message: 'Email sent successfully',
			emailResponse,
		});
	} catch (error) {
		res.status(500).json({
			message: 'Failed to send email',
			error: error.message,
		});
	}
});
export default router;
