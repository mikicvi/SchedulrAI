import { refreshAccessToken } from '../../services/authServices';
import { getUserById, updateUser } from '../../services/dbServices';
import { OAuth2Client } from 'google-auth-library';
import logger from '../../utils/logger';

jest.mock('google-auth-library');
jest.mock('../../services/dbServices');
jest.mock('../../utils/logger');

describe('refreshAccessToken', () => {
	const mockUser = {
		id: 1,
		googleId: 'google-id',
		googleRefreshToken: 'refresh-token',
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should refresh access token and update user', async () => {
		const mockAccessToken = 'new-access-token';
		const mockRefreshToken = 'new-refresh-token';

		(getUserById as jest.Mock).mockResolvedValue(mockUser);
		(OAuth2Client.prototype.setCredentials as jest.Mock).mockImplementation();
		(OAuth2Client.prototype.refreshAccessToken as jest.Mock).mockResolvedValue({
			credentials: {
				access_token: mockAccessToken,
				refresh_token: mockRefreshToken,
			},
		});

		const result = await refreshAccessToken(mockUser.id);

		expect(getUserById).toHaveBeenCalledWith(mockUser.id);
		expect(OAuth2Client.prototype.setCredentials).toHaveBeenCalledWith({
			refresh_token: mockUser.googleRefreshToken,
		});
		expect(OAuth2Client.prototype.refreshAccessToken).toHaveBeenCalled();
		expect(updateUser).toHaveBeenCalledWith(mockUser.id, { googleAccessToken: mockAccessToken });
		expect(updateUser).toHaveBeenCalledWith(mockUser.id, { googleRefreshToken: mockRefreshToken });
		expect(logger.info).toHaveBeenCalledWith(`Access token refreshed for user ${mockUser.id}`);
		expect(logger.info).toHaveBeenCalledWith(`Refresh token refreshed for user ${mockUser.id}`);
		expect(result).toBe(mockAccessToken);
	});

	it('should throw an error if user is not found', async () => {
		(getUserById as jest.Mock).mockResolvedValue(null);

		await expect(refreshAccessToken(mockUser.id)).rejects.toThrow(
			'User not found or not authenticated with Google'
		);

		expect(getUserById).toHaveBeenCalledWith(mockUser.id);
		expect(OAuth2Client.prototype.setCredentials).not.toHaveBeenCalled();
		expect(OAuth2Client.prototype.refreshAccessToken).not.toHaveBeenCalled();
		expect(updateUser).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
	});

	it('should throw an error if user is not authenticated with Google', async () => {
		const mockUserWithoutGoogleAuth = { ...mockUser, googleId: null, googleRefreshToken: null };
		(getUserById as jest.Mock).mockResolvedValue(mockUserWithoutGoogleAuth);

		await expect(refreshAccessToken(mockUser.id)).rejects.toThrow(
			'User not found or not authenticated with Google'
		);

		expect(getUserById).toHaveBeenCalledWith(mockUser.id);
		expect(OAuth2Client.prototype.setCredentials).not.toHaveBeenCalled();
		expect(OAuth2Client.prototype.refreshAccessToken).not.toHaveBeenCalled();
		expect(updateUser).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
	});
});
