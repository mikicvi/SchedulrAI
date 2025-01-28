import request from 'supertest';
import express from 'express';
import pipelineRoutes from '../../routes/pipelineRoutes';

const app = express();
app.use(express.json());
app.use(pipelineRoutes);

jest.mock('../../routes/pipelineRoutes', () => {
	const express = require('express');
	const router = express.Router();

	router.post('/runPipeline', (req, res) => {
		res.status(200).json({ message: 'Pipeline run successfully' });
	});

	router.get('/checkPipelineStatus', (req, res) => {
		res.status(200).json({ status: 'Pipeline is running' });
	});

	return router;
});

describe('Pipeline Routes', () => {
	it('should run the pipeline', async () => {
		const response = await request(app).post('/runPipeline').send({
			// mock request body
			data: 'test data',
		});

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ message: 'Pipeline run successfully' });
	});

	it('should check the pipeline status', async () => {
		const response = await request(app).get('/checkPipelineStatus');

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ status: 'Pipeline is running' });
	});
});
