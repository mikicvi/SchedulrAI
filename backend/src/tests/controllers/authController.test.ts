import { Request, Response, NextFunction } from 'express';
import { login, logout, register, checkAuth, getCsrfToken } from '../../controllers/authController';
import { createUser, createCalendar, setupUserCalendar } from '../../services/dbServices';
import passport from '../../middlewares/passport';

// Define User interface
interface User {
	id: number;
	username: string;
	password: string;
	email?: string;
	createdAt: Date;
}

// Define authenticated request interface
interface AuthenticatedRequest extends Request {
	user: User;
}

jest.mock('../../services/dbServices');
jest.mock('../../middlewares/passport');

describe('Auth Controller', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction = jest.fn();

	beforeEach(() => {
		mockRequest = {
			body: {},
			logIn: jest.fn(),
			logout: jest.fn(),
			isAuthenticated: jest.fn(() => true) as unknown as () => this is AuthenticatedRequest,
			csrfToken: jest.fn(),
		};
		mockResponse = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
			cookie: jest.fn(),
		};
	});

	describe('login', () => {
		it('should return 400 if username or password is missing', () => {
			login(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Username and password are required' });
		});

		it('should authenticate user with valid credentials', () => {
			// Setup
			mockRequest.body = { username: 'testuser', password: 'password' };
			const mockUser = {
				id: 1,
				username: 'testuser',
				email: 'test@test.com',
				password: 'hashedpassword',
				createdAt: new Date(),
			};

			// Mock passport.authenticate to simulate the authentication flow
			(passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
				return (req: Request, res: Response, next: NextFunction) => {
					// Simulate passport authentication
					callback(null, mockUser, null);
					return next();
				};
			});

			// Mock req.logIn to simulate successful login
			(mockRequest.logIn as jest.Mock).mockImplementation((user, callback) => {
				callback(null);
			});

			// Execute
			login(mockRequest as Request, mockResponse as Response, nextFunction);

			// Verify the authentication flow
			expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
			expect(mockRequest.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
			expect(mockResponse.status).not.toHaveBeenCalled();
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Logged in successfully',
				user: {
					id: mockUser.id,
					username: mockUser.username,
					email: mockUser.email,
				},
			});
		});

		it('should handle authentication failure', () => {
			// Setup
			mockRequest.body = { username: 'testuser', password: 'wrongpassword' };

			// Mock passport.authenticate to simulate authentication failure
			(passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
				return (req: Request, res: Response, next: NextFunction) => {
					callback(null, false, { message: 'Invalid credentials' });
					return next();
				};
			});

			// Execute
			login(mockRequest as Request, mockResponse as Response, nextFunction);

			// Verify
			expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
			expect(mockRequest.logIn).not.toHaveBeenCalled();
			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Invalid credentials',
			});
		});

		it('should handle login session error', () => {
			// Setup
			mockRequest.body = { username: 'testuser', password: 'password' };
			const mockUser = {
				id: 1,
				username: 'testuser',
				email: 'test@test.com',
			};

			// Mock passport.authenticate for successful auth
			(passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
				return (req: Request, res: Response, next: NextFunction) => {
					callback(null, mockUser, null);
					return next();
				};
			});

			// Mock req.logIn to simulate session error
			(mockRequest.logIn as jest.Mock).mockImplementation((user, callback) => {
				callback(new Error('Session error'));
			});

			// Execute
			login(mockRequest as Request, mockResponse as Response, nextFunction);

			// Verify
			expect(passport.authenticate).toHaveBeenCalledWith('local', expect.any(Function));
			expect(mockRequest.logIn).toHaveBeenCalled();
			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Login failed',
			});
		});
	});

	describe('logout', () => {
		it('should logout user successfully', () => {
			(mockRequest.logout as jest.Mock).mockImplementation((cb) => cb(null));
			logout(mockRequest as Request, mockResponse as Response);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
		});
	});

	describe('register', () => {
		const validUserData = {
			username: 'newuser',
			password: 'password',
			email: 'new@test.com',
			firstName: 'New',
			lastName: 'User',
		};

		it('should handle missing required fields', async () => {
			mockRequest.body = { username: 'newuser' }; // Missing required fields

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Failed to create the user',
			});
		});

		it('should handle calendar creation failure', async () => {
			mockRequest.body = validUserData;
			const mockUser = { id: 1, ...validUserData };

			(createUser as jest.Mock).mockResolvedValue(mockUser);
			(createCalendar as jest.Mock).mockResolvedValue(null);

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Failed to create calendar',
			});
		});

		it('should handle calendar creation failure', async () => {
			mockRequest.body = validUserData;
			const mockUser = { id: 1, ...validUserData };

			(createUser as jest.Mock).mockResolvedValue(mockUser);
			(createCalendar as jest.Mock).mockResolvedValue(new Error('Update failed'));
			(setupUserCalendar as jest.Mock).mockResolvedValue(null);

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Failed to create calendar',
			});
		});

		it('should register new user successfully', async () => {
			mockRequest.body = {
				username: 'newuser',
				password: 'password',
				email: 'new@test.com',
				firstName: 'New',
				lastName: 'User',
			};

			const mockUser = { id: 1, ...mockRequest.body };
			const mockCalendar = { id: 1, name: 'Personal', description: 'Personal calendar' };

			(createUser as jest.Mock).mockResolvedValue(mockUser);
			(createCalendar as jest.Mock).mockResolvedValue(mockCalendar);
			(setupUserCalendar as jest.Mock).mockResolvedValue(true);

			await register(mockRequest as Request, mockResponse as Response);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'User registered successfully',
				user: mockUser,
			});
		});
	});

	describe('checkAuth', () => {
		it('should return authenticated status when user is logged in', () => {
			(mockRequest.isAuthenticated as unknown as jest.Mock).mockReturnValue(true);
			mockRequest.user = {
				id: 1,
				username: 'testuser',
				password: 'hashedpassword',
				createdAt: new Date(),
				email: 'test@example.com',
			};

			checkAuth(mockRequest as Request, mockResponse as Response);
			expect(mockResponse.json).toHaveBeenCalledWith({
				authenticated: true,
				user: mockRequest.user,
			});
		});
	});

	describe('getCsrfToken', () => {
		it('should set csrf token cookie and return token', () => {
			const mockToken = 'test-csrf-token';
			mockRequest.csrfToken = jest.fn().mockReturnValue(mockToken);

			getCsrfToken(mockRequest as Request, mockResponse as Response);
			expect(mockResponse.cookie).toHaveBeenCalled();
			expect(mockResponse.json).toHaveBeenCalledWith({ csrfToken: mockToken });
		});
	});
});
