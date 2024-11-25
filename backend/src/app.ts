import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import chromaRoutes from './routes/chromaRoutes';
import mongoRoutes from './routes/mongoRoutes';
import ollamaRoutes from './routes/ollamaRoutes';
import documentIndexRoutes from './routes/documentIndexRoutes';
import pipelineRoutes from './routes/pipelineRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();
// allow requests from localhost
const corsOptions = {
	origin: 'http://localhost:5173',
	optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cors());

// Define the base API route for all routes
const baseApiRoute = '/api';
app.use(baseApiRoute, chromaRoutes);
app.use(baseApiRoute, chromaRoutes);
app.use(baseApiRoute, mongoRoutes);
app.use(baseApiRoute, ollamaRoutes);
app.use(baseApiRoute, documentIndexRoutes);
app.use(baseApiRoute, pipelineRoutes);

export default app;
