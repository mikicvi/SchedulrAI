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
// @todo: Add log rotation, log file size limit, and log file count limit. Maybe log to mongo?

export default logger;
