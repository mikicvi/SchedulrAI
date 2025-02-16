import request from 'supertest';
import express from 'express';
import emailRoutes from '../../routes/emailRoutes';
import { sendEmail, checkForBouncedEmails } from '../../services/emailServices';

jest.mock('../../services/emailServices');

const app = express();
app.use(express.json());
app.use(global.mockAuthMiddleware); // Apply mock auth before routes
app.use(emailRoutes);

describe('POST /email/send', () => {
	it('should return 200 and success message when email is sent successfully', async () => {
		// Mock the sendEmail function to return a successful response
		(sendEmail as jest.Mock).mockResolvedValue({ status: 200 });
		(checkForBouncedEmails as jest.Mock).mockResolvedValue([]);

		const response = await request(app)
			.post('/email/send')
			.set('Authorization', 'Bearer valid-token') // Mock authentication token
			.send({
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			});

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Email sent successfully');
	});

	it('should return 500 when an unknown error occurs', async () => {
		// Mock the sendEmail function to throw an unknown error
		(sendEmail as jest.Mock).mockImplementation(() => {
			throw new Error('Unknown error');
		});

		const response = await request(app)
			.post('/email/send')
			.set('Authorization', 'Bearer valid-token') // Mock authentication token
			.send({
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			});

		expect(response.status).toBe(500);
		expect(response.body.message).toBe('Failed to send email');
		expect(response.body.error).toBe('Unknown error');
	});

	it('should return 400 when bounced emails are detected', async () => {
		// Mock the sendEmail function to return a successful response
		(sendEmail as jest.Mock).mockResolvedValue({ status: 200 });
		(checkForBouncedEmails as jest.Mock).mockResolvedValue(['bounced@example.com']);

		const response = await request(app)
			.post('/email/send')
			.set('Authorization', 'Bearer valid-token') // Mock authentication token
			.send({
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			});

		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			'Email not sent - please check recipient email address for typos. You can check your inbox for detailed error messages.'
		);
		expect(response.body.bouncedEmails).toEqual(['bounced@example.com']);
	});

	it('should return 500 when an error occurs while checking for bounced emails', async () => {
		// Mock the sendEmail function to return a successful response
		(sendEmail as jest.Mock).mockResolvedValue({ status: 200 });
		(checkForBouncedEmails as jest.Mock).mockRejectedValue(new Error('Error checking for bounced emails'));

		const response = await request(app)
			.post('/email/send')
			.set('Authorization', 'Bearer valid-token') // Mock authentication token
			.send({
				to: 'test@example.com',
				subject: 'Test Subject',
				body: 'Test Body',
			});

		expect(response.status).toBe(500);
		expect(response.body.message).toBe('Error checking for bounced emails');
		expect(response.body.error).toBe('Error checking for bounced emails');
	});
});
