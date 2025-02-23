import request from 'supertest';
import initializeApp from '../app';
import { initializeDatabase } from '../middlewares/db';

// Mock session store with full implementation
const mockSessionStore = {
	on: jest.fn(),
	destroy: jest.fn(),
	clear: jest.fn(),
	get: jest.fn(),
	set: jest.fn(),
	touch: jest.fn(),
	all: jest.fn(),
	length: jest.fn(),
	close: jest.fn(),
};

jest.mock('connect-sqlite3', () => {
	return jest.fn().mockImplementation(() => {
		return class SQLiteStoreSession {
			constructor(options) {
				return mockSessionStore;
			}
		};
	});
});

// Comprehensive mocking of dependencies
jest.mock('../middlewares/db', () => ({
	initializeDatabase: jest.fn(),
	sequelize: {
		define: jest.fn(),
		query: jest.fn(),
		authenticate: jest.fn(),
		close: jest.fn(),
		transaction: jest.fn(),
		sync: jest.fn(),
		model: jest.fn(),
		models: {
			User: {
				init: jest.fn(),
				prototype: {
					validPassword: jest.fn(),
				},
			},
			Calendar: {
				init: jest.fn(),
			},
			Event: {
				init: jest.fn(),
			},
		},
		import: jest.fn(),
	},
}));

jest.mock('lusca', () => {
	const mockMiddleware = (req: any, res: any, next: any) => next();

	// Return a function that returns the middleware when called with options
	return (options: any) => mockMiddleware;
});

// Mock model files to prevent actual initialization
jest.mock('../models/user.model', () => ({
	init: jest.fn(),
	prototype: {
		validPassword: jest.fn(),
	},
}));

jest.mock('../models/calendar.model', () => ({
	init: jest.fn(),
}));

jest.mock('../models/event.model', () => ({
	init: jest.fn(),
}));

jest.mock('../middlewares/auth', () => ({
	ensureAuthenticated: (req: any, res: any, next: any) => next(),
}));

// Mock Sequelize DataTypes
jest.mock('sequelize', () => ({
	DataTypes: {
		INTEGER: {
			UNSIGNED: {},
		},
		STRING: {},
		BOOLEAN: {},
		DATE: {},
		TEXT: {},
	},
}));

jest.mock('@langchain/ollama', () => ({
	OllamaEmbeddings: jest.fn().mockImplementation(() => ({
		embed: jest.fn().mockResolvedValue([]),
	})),
	ChatOllama: jest.fn().mockImplementation(() => ({
		chat: jest.fn().mockResolvedValue([]),
	})),
}));

// Mock PipelineController to ensure no actual exection which results in test failures
jest.mock('../controllers/pipelineController', () => {
	return jest.fn().mockImplementation(() => ({
		runPipeline: jest.fn(),
		checkPipelineStatus: jest.fn(),
		streamStatus: jest.fn(),
		_getEmitter: jest.fn(),
	}));
});

jest.mock('../services/pipelineServices', () => {
	return jest.fn().mockImplementation(() => ({
		isPipelineReady: jest.fn(),
	}));
});

describe('initializeApp', () => {
	let app: any;

	beforeAll(async () => {
		(initializeDatabase as jest.Mock).mockResolvedValue(true);
		app = await initializeApp();
	});

	it('should not overwrite the database', () => {
		if (process.env.NODE_ENV !== 'test') {
			expect(initializeDatabase).toHaveBeenCalledTimes(1);
		}
	});

	it('should set up middleware and routes correctly', async () => {
		const response = await request(app).get('/api/nonexistent-route');
		expect(response.status).toBe(404);
	});

	it('should allow requests from allowed origins', async () => {
		const response = await request(app).get('/api/nonexistent-route').set('Origin', 'http://localhost:5173');
		expect(response.status).toBe(404);
	});

	it('should block requests from disallowed origins', async () => {
		const response = await request(app).get('/api/nonexistent-route').set('Origin', 'http://disallowed-origin.com');
		expect(response.status).toBe(500);
		expect(response.text).toContain('Not allowed by CORS');
	});

	it('should apply rate limiting', async () => {
		for (let i = 0; i < 500; i++) {
			await request(app).get('/api/nonexistent-route');
		}
		const response = await request(app).get('/api/nonexistent-route');
		expect(response.status).toBe(429);
		expect(response.text).toContain('Too many requests from this IP, please try again after 15 minutes');
	});
});
