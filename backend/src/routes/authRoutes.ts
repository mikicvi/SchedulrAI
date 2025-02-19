import express, { Router } from 'express';
import passport from '../middlewares/passport';
import { login, logout, register, googleCallback, checkAuth, getCsrfToken } from '../controllers/authController';
import { googleScopes } from '../config/googleScopes';
const router: Router = express.Router();

// Local authentication routes
router.post('/login', login);
router.get('/logout', logout);
router.post('/register', register);
router.get('/checkAuth', checkAuth);
router.get('/csrfToken', getCsrfToken);

// Google OAuth routes

// register - Prompt for consent every time - in case we need to capture the refresh token
router.get(
	'/google',
	passport.authenticate('google', {
		failureRedirect: `${process.env.FRONTEND_URL}/login`,
		accessType: 'offline',
		prompt: 'consent',
		scope: googleScopes,
	})
);

// login - Prompt only once for consent - we need to capture the refresh token
router.get(
	'/google/callback',
	passport.authenticate('google', {
		accessType: 'offline',
		scope: googleScopes,
		failureRedirect: `${process.env.FRONTEND_URL}/login`,
		successRedirect: `${process.env.FRONTEND_URL}/`,
	}),
	googleCallback
);
export default router;
