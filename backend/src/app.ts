// backend/src/app.ts
import express from 'express';
import session from 'express-session';
import passport from './middlewares/passport';
import dotenv from 'dotenv';
import cors from 'cors';
import chromaRoutes from './routes/chromaRoutes';
import ollamaRoutes from './routes/ollamaRoutes';
import documentIndexRoutes from './routes/documentIndexRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import authRoutes from './routes/authRoutes';
import { initializeDatabase } from './middlewares/db';
import SQLiteStore from 'connect-sqlite3';
import rateLimit from 'express-rate-limit';

// Load environment variables from .env file
dotenv.config();

const initializeApp = async () => {
	await initializeDatabase();

	const app = express();

	// allow requests from multiple origins specified in the .env file
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
	const corsOptions = {
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
		optionsSuccessStatus: 200,
	};

	const baseApiRoute = '/api';

	// Rate limiting middleware
	const rateLimiter = rateLimit({
		windowMs: 10 * 60 * 1000, // 10 minutes
		max: 100,
		message: 'Too many requests from this IP, please try again after 15 minutes',
	});

	// Create SQLite session store for express-session
	const SQLiteStoreSession = SQLiteStore(session);

	// Config middleware
	app.use(cors(corsOptions));
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));

	app.use(
		session({
			secret: process.env.AUTH_SECRET || 'default_secret',
			resave: false,
			saveUninitialized: false,
			store: new SQLiteStoreSession({
				db: process.env.DB_PATH || 'app/data/db.sqlite3',
				dir: '/',
				table: 'sessions',
			}),
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(rateLimiter);

	// Routes
	app.use(baseApiRoute, chromaRoutes);
	app.use(baseApiRoute, ollamaRoutes);
	app.use(baseApiRoute, documentIndexRoutes);
	app.use(baseApiRoute, pipelineRoutes);
	app.use(baseApiRoute, authRoutes);

	return app;
};

export default initializeApp;
