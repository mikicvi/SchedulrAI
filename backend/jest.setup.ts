import { Request, Response, NextFunction } from 'express';

// Extend globalThis to include mockAuthMiddleware
declare global {
	var mockAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
}

// Define the authentication middleware
globalThis.mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
	(req as any).isAuthenticated = () => true; // Always return authenticated
	(req as any).user = { id: 1, username: 'testuser' }; // Mock user object
	next();
};

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';
process.env.ALLOWED_ORIGINS =
	'http://localhost,http://localhost:80,http://localhost:3000,http://frontend,http://localhost:5173';
