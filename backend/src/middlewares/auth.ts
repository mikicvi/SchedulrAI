// backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
	isAuthenticated: () => boolean;
}

export function ensureAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.status(401).json({ message: 'Unauthorized' });
}
