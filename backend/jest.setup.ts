import { Request, Response, NextFunction } from 'express';

// Extend globalThis to include mockAuthMiddleware
declare global {
	var mockAuthMiddleware: (req: Request, res: Response, next: NextFunction) => void;
}

// Define the authentication middleware
globalThis.mockAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
	(req as any).isAuthenticated = () => true; // Always return authenticated
	(req as any).user = { id: 'test-user', username: 'testuser' }; // Mock user object
	next();
};
