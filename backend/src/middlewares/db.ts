import { Sequelize } from 'sequelize';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import logger from '../utils/logger';
import('../models/associations'); // Relationships for the models

const dbPath =
	process.env.NODE_ENV === 'test'
		? process.env.TEST_DB_PATH || resolve('data/test/db.sqlite3')
		: process.env.DB_PATH || resolve('data/db.sqlite3');

// Ensure data directory exists

// Initialize Sequelize
export const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: dbPath,
	logging: false,
});

export async function initializeDatabase(): Promise<void> {
	mkdirSync(dirname(dbPath), { recursive: true });

	// Check if db.sqlite exists, and create it if it doesn't
	if (!existsSync(dbPath)) {
		writeFileSync(dbPath, '');
		logger.info(`Database created at ${dbPath}`);
		await sequelize.sync();
		logger.info('Database initialized and synced, relationships created');
	} else {
		logger.info(`Using existing database at ${dbPath}`);
	}
}
