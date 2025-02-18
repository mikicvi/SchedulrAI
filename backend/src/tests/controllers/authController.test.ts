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
		test('should return 400 if username or password is missing', () => {
			login(mockRequest as Request, mockResponse as Response, nextFunction);
			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Username and password are required' });
		});

		test('should authenticate user with valid credentials', () => {
			mockRequest.body = { username: 'testuser', password: 'password' };
			const mockUser = {
				id: 1,
				username: 'testuser',
				email: 'test@test.com',
				password: 'hashedpassword',
				createdAt: new Date(),
			};

			(passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
				return (req: Request, res: Response, next: NextFunction) => {
					callback(null, mockUser, null);
					(req.logIn as jest.Mock).mockImplementation((user, done) => {
						done(null);
						res.json({
							message: 'Logged in successfully',
							user: {
								id: user.id,
								username: user.username,
								email: user.email,
							},
						});
					});
				};
			});

			login(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockRequest.logIn).toHaveBeenCalledWith(mockUser, expect.any(Function));
		});

		test('should handle server error during authentication', () => {
			mockRequest.body = { username: 'testuser', password: 'password' };

			(passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
				callback(new Error('Server error'), false, null);
				return (req: Request, res: Response, next: NextFunction) => {};
			});

			login(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Authentication failed',
			});
		});

		test('should handle login error after successful authentication', () => {
			mockRequest.body = { username: 'testuser', password: 'password' };
			const mockUser = { id: 1, username: 'testuser', email: 'test@test.com' };

			(passport.authenticate as jest.Mock).mockImplementation((strategy, callback) => {
				callback(null, mockUser, null);
				return (req: Request, res: Response, next: NextFunction) => {};
			});

			(mockRequest.logIn as jest.Mock).mockImplementation((user, cb) => cb(new Error('Login failed')));

			login(mockRequest as Request, mockResponse as Response, nextFunction);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Login failed',
			});
		});
	});

	describe('logout', () => {
		test('should logout user successfully', () => {
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

		test('should handle missing required fields', async () => {
			mockRequest.body = { username: 'newuser' }; // Missing required fields

			await register(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(500);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: 'Registration failed',
			});
		});

		test('should handle calendar creation failure', async () => {
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

		test('should handle calendar creation failure', async () => {
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

		test('should register new user successfully', async () => {
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
		test('should return authenticated status when user is logged in', () => {
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
		test('should set csrf token cookie and return token', () => {
			const mockToken = 'test-csrf-token';
			mockRequest.csrfToken = jest.fn().mockReturnValue(mockToken);

			getCsrfToken(mockRequest as Request, mockResponse as Response);
			expect(mockResponse.cookie).toHaveBeenCalled();
			expect(mockResponse.json).toHaveBeenCalledWith({ csrfToken: mockToken });
		});
	});
});
