import express from 'express';
import dotenv from 'dotenv';
import chromaRoutes from './routes/chromaRoutes';
import mongoRoutes from './routes/mongoRoutes';
import ollamaRoutes from './routes/ollamaRoutes';
import documentIndexRoutes from './routes/documentIndexRoutes';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Use routes
app.use(chromaRoutes);
app.use(mongoRoutes);
app.use(ollamaRoutes);
app.use(documentIndexRoutes);

export default app;
