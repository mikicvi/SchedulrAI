import { sendEmail, checkForBouncedEmails } from '../../services/emailServices';
import { getUserById, updateUser } from '../../services/dbServices';
import { OAuth2Client } from 'google-auth-library';
import { gmail } from '@googleapis/gmail';

jest.mock('../../services/dbServices');
jest.mock('google-auth-library');
jest.mock('@googleapis/gmail');

describe('sendEmail', () => {
	const mockUser = {
		id: 1,
		googleId: 'google-id',
		googleRefreshToken: 'refresh-token',
		googleAccessToken: 'access-token',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should send an email successfully', async () => {
		(getUserById as jest.Mock).mockResolvedValue(mockUser);
		(OAuth2Client.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
			credentials: { access_token: 'new-access-token' },
		});
		(gmail as jest.Mock).mockReturnValue({
			users: {
				messages: {
					send: jest.fn().mockResolvedValue({ status: 200 }),
				},
			},
		});

		const response = await sendEmail(mockUser.id, 'test@example.com', 'Test Subject', 'Test Body');

		expect(getUserById).toHaveBeenCalledWith(mockUser.id);
		expect(OAuth2Client.prototype.setCredentials).toHaveBeenCalledWith({
			refresh_token: mockUser.googleRefreshToken,
		});
		expect(OAuth2Client.prototype.refreshAccessToken).toHaveBeenCalled();
		expect(updateUser).toHaveBeenCalledWith(mockUser.id, { googleAccessToken: 'new-access-token' });
		expect(gmail('v1').users.messages.send).toHaveBeenCalledWith({
			userId: 'me',
			requestBody: {
				raw: expect.any(String),
			},
		});
		expect(response.status).toBe(200);
	});

	it('should throw an error if user is not authenticated with Google', async () => {
		(getUserById as jest.Mock).mockResolvedValue(null);

		await expect(sendEmail(mockUser.id, 'test@example.com', 'Test Subject', 'Test Body')).rejects.toThrow(
			'This feature is only available for Google-authenticated users'
		);
	});

	it('should throw an error if refreshAccessToken fails', async () => {
		(getUserById as jest.Mock).mockResolvedValue(mockUser);
		(OAuth2Client.prototype.refreshAccessToken as jest.Mock).mockRejectedValue(
			new Error('Failed to refresh token')
		);

		await expect(sendEmail(mockUser.id, 'test@example.com', 'Test Subject', 'Test Body')).rejects.toThrow(
			'Failed to refresh token'
		);
	});
});
describe('checkForBouncedEmails', () => {
	const mockUser = {
		id: 1,
		googleId: 'google-id',
		googleRefreshToken: 'refresh-token',
		googleAccessToken: 'access-token',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return a list of bounced emails', async () => {
		(getUserById as jest.Mock).mockResolvedValue(mockUser);
		(OAuth2Client.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
			credentials: { access_token: 'new-access-token' },
		});
		(gmail as jest.Mock).mockReturnValue({
			users: {
				messages: {
					list: jest.fn().mockResolvedValue({
						data: {
							messages: [{ id: 'message-id-1' }, { id: 'message-id-2' }],
						},
					}),
					get: jest.fn().mockResolvedValue({
						data: {
							payload: {
								headers: [
									{ name: 'Subject', value: 'Mail Delivery Subsystem' },
									{ name: 'From', value: 'mailer-daemon@example.com' },
								],
							},
						},
					}),
				},
			},
		});

		const bouncedEmails = await checkForBouncedEmails(mockUser.id);

		expect(getUserById).toHaveBeenCalledWith(mockUser.id);
		expect(OAuth2Client.prototype.setCredentials).toHaveBeenCalledWith({
			access_token: 'new-access-token',
		});
		expect(OAuth2Client.prototype.refreshAccessToken).toHaveBeenCalled();
		expect(gmail('v1').users.messages.list).toHaveBeenCalledWith({
			userId: 'me',
			q: 'from:mailer-daemon@* OR subject:(Mail Delivery Subsystem) newer_than:1h is:unread',
			maxResults: 5,
		});
		expect(gmail('v1').users.messages.get).toHaveBeenCalledTimes(2);
		expect(bouncedEmails).toEqual([
			{ id: 'message-id-1', from: 'mailer-daemon@example.com', subject: 'Mail Delivery Subsystem' },
			{ id: 'message-id-2', from: 'mailer-daemon@example.com', subject: 'Mail Delivery Subsystem' },
		]);
	});

	it('should return an empty list if no bounced emails are found', async () => {
		(getUserById as jest.Mock).mockResolvedValue(mockUser);
		(OAuth2Client.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
			credentials: { access_token: 'new-access-token' },
		});
		(gmail as jest.Mock).mockReturnValue({
			users: {
				messages: {
					list: jest.fn().mockResolvedValue({
						data: {
							messages: [],
						},
					}),
				},
			},
		});

		const bouncedEmails = await checkForBouncedEmails(mockUser.id);

		expect(getUserById).toHaveBeenCalledWith(mockUser.id);
		expect(OAuth2Client.prototype.setCredentials).toHaveBeenCalledWith({
			access_token: 'new-access-token',
		});
		expect(OAuth2Client.prototype.refreshAccessToken).toHaveBeenCalled();
		expect(gmail('v1').users.messages.list).toHaveBeenCalledWith({
			userId: 'me',
			q: 'from:mailer-daemon@* OR subject:(Mail Delivery Subsystem) newer_than:1h is:unread',
			maxResults: 5,
		});
		expect(bouncedEmails).toEqual([]);
	});

	it('should throw an error if user is not authenticated with Google', async () => {
		(getUserById as jest.Mock).mockResolvedValue(null);

		await expect(checkForBouncedEmails(mockUser.id)).rejects.toThrow(
			'This feature is only available for Google-authenticated users'
		);
	});

	it('should throw an error if refreshAccessToken fails', async () => {
		(getUserById as jest.Mock).mockResolvedValue(mockUser);
		(OAuth2Client.prototype.refreshAccessToken as jest.Mock).mockRejectedValue(
			new Error('Failed to refresh token')
		);

		await expect(checkForBouncedEmails(mockUser.id)).rejects.toThrow('Failed to refresh token');
	});
});
