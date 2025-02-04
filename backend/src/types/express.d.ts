import { UserAttributes } from '../models/user.model';

declare global {
	namespace Express {
		interface User extends UserAttributes {}

		interface Request {
			logIn(user: User, done: (err: any) => void): void;
			logout(done: (err: any) => void): void;
			user?: User;
		}
	}
}
