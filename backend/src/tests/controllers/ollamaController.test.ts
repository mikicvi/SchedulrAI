import { Request, Response } from 'express';
import { ollamaStatus, ollamaEmbeddingStatus } from '../../controllers/ollamaController';
import { getOllamaStatus } from '../../services/ollamaServices';
import logger from '../../utils/logger';

jest.mock('../../services/ollamaServices');
jest.mock('../../utils/logger');

describe('handleOllamaStatus', () => {
	let req: Partial<Request>;
	let res: Partial<Response>;
	let statusMock: jest.Mock;
	let jsonMock: jest.Mock;
	let sendStatusMock: jest.Mock;

	beforeEach(() => {
		req = {};
		statusMock = jest.fn().mockReturnThis();
		jsonMock = jest.fn();
		sendStatusMock = jest.fn();
		res = {
			status: statusMock,
			json: jsonMock,
			sendStatus: sendStatusMock,
		};
	});

	it('should return status 200 and content on successful getOllamaStatus call', async () => {
		const mockContent = { data: 'test' };
		(getOllamaStatus as jest.Mock).mockResolvedValue(mockContent);

		const handler = ollamaStatus;
		await handler(req as Request, res as Response);

		expect(getOllamaStatus).toHaveBeenCalledWith('chat');
		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({ status: 'OK', content: mockContent });
		expect(logger.info).toHaveBeenCalled();
	});
	// OllamaEmbeddingStatus test and ollamasStatus test are similar, so we can use it.each to test both
	it.each([
		{ handler: ollamaEmbeddingStatus, arg: 'embedding' },
		{ handler: ollamaStatus, arg: 'chat' },
	])('should return status 200 and content on successful getOllamaStatus call', async ({ handler, arg }) => {
		const mockContent = { data: 'test' };
		(getOllamaStatus as jest.Mock).mockResolvedValue(mockContent);

		await handler(req as Request, res as Response);

		expect(getOllamaStatus).toHaveBeenCalledWith(arg);
		expect(statusMock).toHaveBeenCalledWith(200);
		expect(jsonMock).toHaveBeenCalledWith({ status: 'OK', content: mockContent });
		expect(logger.info).toHaveBeenCalled();
	});

	it('should return status 500 on getOllamaStatus error', async () => {
		const mockError = new Error('test error');
		(getOllamaStatus as jest.Mock).mockRejectedValue(mockError);

		const handler = ollamaEmbeddingStatus;
		await handler(req as Request, res as Response);

		expect(getOllamaStatus).toHaveBeenCalledWith('embedding');
		expect(sendStatusMock).toHaveBeenCalledWith(500);
		expect(logger.error).toHaveBeenCalledWith(`Error connecting to Ollama instance: ${mockError}`);
		expect(logger.info).toHaveBeenCalled();
	});
});
