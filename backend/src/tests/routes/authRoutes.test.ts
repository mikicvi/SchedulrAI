import request from 'supertest';
import express from 'express';
import session from 'express-session';
import passport from '../../middlewares/passport';
import authRoutes from '../../routes/authRoutes';
import {
	createUser,
	getUserByUsername,
	getUserById,
	getUserByGoogleIdOrEmail,
	updateUser,
	createCalendar,
} from '../../services/dbServices';
import User from '../../models/user.model';

// Mock dependencies
jest.mock('../../services/dbServices');
jest.mock('../../utils/logger', () => ({
	info: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use(
	session({
		secret: 'test-secret',
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(global.mockAuthMiddleware); // Apply mock auth before routes
app.use('/auth', authRoutes);

describe('Authentication Routes', () => {
	const mockUser = {
		id: 1,
		username: 'testuser',
		email: 'test@example.com',
		password: 'hashedpassword',
		validPassword: jest.fn().mockResolvedValue(true),
	} as unknown as User;

	const mockCalendar = {
		id: 1,
		name: 'Personal',
		description: 'Personal calendar',
		userId: 1,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('POST /auth/register', () => {
		it('should successfully register a new user', async () => {
			(createUser as jest.Mock).mockResolvedValue(mockUser);
			(createCalendar as jest.Mock).mockResolvedValue(mockCalendar);
			(updateUser as jest.Mock).mockResolvedValue([1, [mockUser]]);

			const response = await request(app).post('/auth/register').send({
				username: 'testuser',
				password: 'password123',
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
			});

			expect(response.status).toBe(200);
			expect(response.body.message).toBe('User registered successfully');
			expect(response.body.user).toBeTruthy();
			expect(createUser).toHaveBeenCalledTimes(1);
			expect(createCalendar).toHaveBeenCalledWith('Personal', 'Personal calendar', mockUser.id);
			expect(updateUser).toHaveBeenCalledWith(mockUser.id, { calendarId: mockCalendar.id });
		});

		it('should handle duplicate username', async () => {
			const error = new Error('Duplicate username');
			error.name = 'SequelizeUniqueConstraintError';
			(createUser as jest.Mock).mockRejectedValue(error);

			const response = await request(app).post('/auth/register').send({
				username: 'testuser',
				password: 'password123',
				email: 'test@example.com',
			});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe('Username already exists');
		});
	});

	describe('POST /auth/login', () => {
		beforeEach(() => {
			(getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
		});

		it('should successfully log in a user', async () => {
			const response = await request(app).post('/auth/login').send({
				username: 'testuser',
				password: 'password123',
			});

			expect(response.status).toBe(200);
			expect(response.body.message).toBe('Logged in successfully');
			expect(response.body.user).toEqual({
				id: mockUser.id,
				username: mockUser.username,
				email: mockUser.email,
			});
		});

		it('should reject login with missing credentials', async () => {
			const response = await request(app).post('/auth/login').send({});

			expect(response.status).toBe(400);
			expect(response.body.message).toBe('Username and password are required');
		});

		it('should reject login with incorrect username', async () => {
			(getUserByUsername as jest.Mock).mockResolvedValue(null);

			const response = await request(app).post('/auth/login').send({
				username: 'nonexistent',
				password: 'password123',
			});

			expect(response.status).toBe(401);
			expect(response.body.message).toBe('Incorrect username.');
		});

		it('should reject login with incorrect password', async () => {
			mockUser.validPassword = jest.fn().mockResolvedValue(false);
			(getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

			const response = await request(app).post('/auth/login').send({
				username: 'testuser',
				password: 'wrongpassword',
			});

			expect(response.status).toBe(401);
			expect(response.body.message).toBe('Incorrect password.');
		});
	});

	describe('GET /auth/logout', () => {
		it('should successfully log out a user', async () => {
			const agent = request.agent(app);

			// Simulate logged-in user
			await agent.post('/auth/login').send({
				username: 'testuser',
				password: 'password123',
			});

			const response = await agent.get('/auth/logout');

			expect(response.status).toBe(200);
			expect(response.body.message).toBe('Logged out successfully');
		});
	});

	describe('GET /auth/checkAuth', () => {
		it('should return user data if authenticated', async () => {
			const agent = request.agent(app);

			// Simulate logged-in user
			await agent.post('/auth/login').send({
				username: 'testuser',
				password: 'password123',
			});

			const response = await agent.get('/auth/checkAuth');

			expect(response.status).toBe(200);
			expect(response.body.authenticated).toBe(true);
			expect(response.body.user).toEqual({
				id: mockUser.id,
				username: mockUser.username,
			});
		});

		it('should return unauthenticated if not logged in', async () => {
			// mock auth middleware to simulate unauthenticated user
			const authMiddleware = (req, res, next) => {
				req.isAuthenticated = jest.fn().mockReturnValue(false);
				next();
			};

			const app2 = express();
			app2.use(express.json());
			app2.use(
				session({
					secret: 'test-secret',
					resave: false,
					saveUninitialized: false,
				})
			);
			app2.use(passport.initialize());
			app2.use(passport.session());
			app2.use(authMiddleware);
			app2.use('/auth', authRoutes);

			const agent = request.agent(app2);

			await agent.post('/auth/logout');

			const response = await request(app2).get('/auth/checkAuth');

			expect(response.status).toBe(401);
			expect(response.body.authenticated).toBe(false);
			expect(response.body.user).toBeNull();
		});
	});

	describe('Passport Serialization', () => {
		it('should serialize user by ID', async () => {
			const done = jest.fn();
			passport.serializeUser(mockUser, done);

			expect(done).toHaveBeenCalledWith(null, mockUser.id);
		});

		it('should deserialize user by ID', async () => {
			(getUserById as jest.Mock).mockResolvedValue(mockUser);
			const done = jest.fn();

			await new Promise<void>((resolve) => {
				passport.deserializeUser(mockUser.id, (err, user) => {
					done(err, user);
					resolve();
				});
			});

			expect(getUserById).toHaveBeenCalledWith(mockUser.id);
			expect(done).toHaveBeenCalledWith(null, mockUser);
		});

		it('should handle deserialization of non-existent user', async () => {
			(getUserById as jest.Mock).mockResolvedValue(null);
			const done = jest.fn();

			await new Promise<void>((resolve) => {
				passport.deserializeUser(999, (err, user) => {
					done(err, user);
					resolve();
				});
			});

			expect(done).toHaveBeenCalledWith(null, false);
		});

		it('should handle serialization of invalid user object', async () => {
			const invalidUser = {} as User;
			const done = jest.fn();

			passport.serializeUser(invalidUser, done);

			expect(done).toHaveBeenCalledWith(new Error('Invalid user object during serialization'), undefined);
		});
	});
	describe('Passport LocalStrategy', () => {
		it('should handle login with incorrect username', async () => {
			(getUserByUsername as jest.Mock).mockResolvedValue(null);

			const done = jest.fn();
			await new Promise<void>((resolve) => {
				(passport as any)._strategies.local._verify({}, 'wrongusername', 'password123', (err, user, info) => {
					done(err, user, info);
					resolve();
				});
			});

			expect(done).toHaveBeenCalledWith(null, false, { message: 'Incorrect username.' });
		});

		it('should handle login with incorrect password', async () => {
			const mockUser = {
				validPassword: jest.fn().mockResolvedValue(false),
			};
			(getUserByUsername as jest.Mock).mockResolvedValue(mockUser);

			const done = jest.fn();
			await new Promise<void>((resolve) => {
				(passport as any)._strategies.local._verify({}, 'testuser', 'wrongpassword', (err, user, info) => {
					done(err, user, info);
					resolve();
				});
			});

			expect(done).toHaveBeenCalledWith(null, false, { message: 'Incorrect password.' });
		});

		it('should handle login error', async () => {
			const error = new Error('Database error');
			(getUserByUsername as jest.Mock).mockRejectedValue(error);

			const done = jest.fn();
			await new Promise<void>((resolve) => {
				(passport as any)._strategies.local._verify({}, 'testuser', 'password123', (err, user, info) => {
					done(err, user, info);
					resolve();
				});
			});

			expect(done).toHaveBeenCalledWith(error, undefined, undefined);
		});
	});

	describe('Google Authentication', () => {
		const mockGoogleProfile = {
			id: 'google123',
			emails: [{ value: 'test@gmail.com' }],
			name: {
				givenName: 'Test',
				familyName: 'User',
			},
		};

		const mockGoogleTokens = {
			accessToken: 'mock-access-token',
			refreshToken: 'mock-refresh-token',
		};

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should handle successful Google authentication for new user', async () => {
			const newUser = {
				...mockUser,
				googleId: mockGoogleProfile.id,
				googleAccessToken: mockGoogleTokens.accessToken,
				googleRefreshToken: mockGoogleTokens.refreshToken,
			};

			(getUserByGoogleIdOrEmail as jest.Mock).mockResolvedValue(null);
			(createUser as jest.Mock).mockResolvedValue(newUser);

			await new Promise<void>((resolve) => {
				(passport as any)._strategies.google._verify(
					mockGoogleTokens.accessToken,
					mockGoogleTokens.refreshToken,
					mockGoogleProfile,
					(err: Error, user: any) => {
						expect(err).toBeNull();
						expect(user).toEqual(newUser);
						resolve();
					}
				);
			});
		});

		it('should handle successful Google authentication for existing user', async () => {
			const existingUser = {
				...mockUser,
				googleId: mockGoogleProfile.id,
			};

			const updatedUser = {
				...existingUser,
				googleAccessToken: mockGoogleTokens.accessToken,
				googleRefreshToken: mockGoogleTokens.refreshToken,
			};

			(getUserByGoogleIdOrEmail as jest.Mock).mockResolvedValue(existingUser);
			(updateUser as jest.Mock).mockResolvedValue([1, [updatedUser]]);

			await new Promise<void>((resolve) => {
				(passport as any)._strategies.google._verify(
					mockGoogleTokens.accessToken,
					mockGoogleTokens.refreshToken,
					mockGoogleProfile,
					(err: Error, user: any) => {
						expect(err).toBeNull();
						expect(user).toEqual(updatedUser);
						resolve();
					}
				);
			});
		});

		it('should handle Google authentication error', async () => {
			const error = new Error('Google API Error');
			(getUserByGoogleIdOrEmail as jest.Mock).mockRejectedValue(error);

			await new Promise<void>((resolve) => {
				(passport as any)._strategies.google._verify(
					mockGoogleTokens.accessToken,
					mockGoogleTokens.refreshToken,
					mockGoogleProfile,
					(err: Error) => {
						expect(err).toEqual(error);
						resolve();
					}
				);
			});
		});

		it('should handle user creation failure', async () => {
			(getUserByGoogleIdOrEmail as jest.Mock).mockResolvedValue(null);
			(createUser as jest.Mock).mockResolvedValue(null);

			await new Promise<void>((resolve) => {
				(passport as any)._strategies.google._verify(
					mockGoogleTokens.accessToken,
					mockGoogleTokens.refreshToken,
					mockGoogleProfile,
					(err: Error) => {
						expect(err.message).toBe('Failed to create user');
						resolve();
					}
				);
			});
		});
	});
});
