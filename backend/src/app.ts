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
		optionsSuccessStatus: 200,
	};

	// Config middleware
	app.use(cors(corsOptions));
	app.use(express.json());
	app.use(cors());
	app.use(express.urlencoded({ extended: true }));

	const SQLiteStoreSession = SQLiteStore(session);

	app.use(
		session({
			secret: process.env.AUTH_SECRET || 'default_secret',
			resave: false,
			saveUninitialized: false,
			store: new SQLiteStoreSession({
				db: 'db.sqlite3',
				dir: '../',
			}),
		})
	);
	app.use(passport.initialize());
	app.use(passport.session());

	// Routes
	const baseApiRoute = '/api';
	app.use(baseApiRoute, chromaRoutes);
	app.use(baseApiRoute, ollamaRoutes);
	app.use(baseApiRoute, documentIndexRoutes);
	app.use(baseApiRoute, pipelineRoutes);
	app.use(baseApiRoute, authRoutes);

	return app;
};

export default initializeApp;
