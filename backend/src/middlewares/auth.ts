import type { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';

interface AuthenticatedRequest extends Request {
	user: User;
	isAuthenticated(): this is AuthenticatedRequest;
}

export function ensureAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.status(401).json({ message: 'Unauthorized' });
}
