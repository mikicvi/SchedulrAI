import { createLogger, format, transports } from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const logger = createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: format.combine(
		format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
		format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`),
		format.colorize({ all: true })
	),
	transports: [new transports.Console(), new transports.File({ filename: 'logs.log' })],
});

export default logger;
