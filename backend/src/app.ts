import chromaRoutes from './routes/chromaRoutes';
import ollamaRoutes from './routes/ollamaRoutes';
import knowledgeRoutes from './routes/knowledgeRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import calendarRoutes from './routes/calendarRoutes';
import profileRoutes from './routes/profileRoutes';
import express from 'express';
import session from 'express-session';
import passport from './middlewares/passport';
import dotenv from 'dotenv';
import cors from 'cors';
import lusca from 'lusca';
import { existsSync } from 'fs';
import { initializeDatabase } from './middlewares/db';
import SQLiteStore from 'connect-sqlite3';
import rateLimit from 'express-rate-limit';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config();

const initializeApp = async () => {
	const dbPath = process.env.DB_PATH || resolve('data/db.sqlite3');
	if (!existsSync(dbPath)) {
		await initializeDatabase();
	}

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
		max: 500,
		skipSuccessfulRequests: true,
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
				db: process.env.DB_PATH || resolve('data/db.sqlite3'),
				dir: '.',
				table: 'sessions',
			}),
		})
	);

	app.use(
		lusca({
			csrf: {
				cookie: {
					name: 'XSRF-TOKEN',
				},
				header: 'X-CSRF-Token',
				key: '_csrf',
			},
			hsts: { maxAge: 24 * 60 * 60 * 1000, includeSubDomains: true, preload: true },
			xssProtection: true,
			nosniff: true,
			referrerPolicy: 'same-origin',
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(rateLimiter);

	// Routes
	app.use(baseApiRoute, chromaRoutes);
	app.use(baseApiRoute, ollamaRoutes);
	app.use(baseApiRoute, knowledgeRoutes);
	app.use(baseApiRoute, pipelineRoutes);
	app.use(baseApiRoute, authRoutes);
	app.use(baseApiRoute, emailRoutes);
	app.use(baseApiRoute, calendarRoutes);
	app.use(baseApiRoute, profileRoutes);

	return app;
};

export default initializeApp;
