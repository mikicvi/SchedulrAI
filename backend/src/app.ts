import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import chromaRoutes from './routes/chromaRoutes';
import mongoRoutes from './routes/mongoRoutes';
import ollamaRoutes from './routes/ollamaRoutes';
import documentIndexRoutes from './routes/documentIndexRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import { initializeDatabase } from './middlewares/db';

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

	app.use(cors(corsOptions));
	app.use(express.json());
	app.use(cors());

	// Define the base API route for all routes
	const baseApiRoute = '/api';
	app.use(baseApiRoute, chromaRoutes);
	app.use(baseApiRoute, mongoRoutes);
	app.use(baseApiRoute, ollamaRoutes);
	app.use(baseApiRoute, documentIndexRoutes);
	app.use(baseApiRoute, pipelineRoutes);

	return app;
};

export default initializeApp;
