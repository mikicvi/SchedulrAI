import { Sequelize } from 'sequelize';
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import logger from '../utils/logger';
import('../models/associations'); // Relationships for the models
const dbPath = resolve('db.sqlite3');

// Check if db.sqlite exists, and create it if it doesn't
if (!existsSync(dbPath)) {
	writeFileSync(dbPath, '');
	logger.info('db.sqlite created');
} else {
	logger.info('db.sqlite already exists');
}

// Initialize Sequelize
export const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: dbPath,
	logging: false,
});

export async function initializeDatabase(): Promise<void> {
	await sequelize.sync();
	logger.info('Database initialized and synced, relationships created');
}
