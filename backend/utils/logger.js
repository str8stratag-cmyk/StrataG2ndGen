import winston from 'winston';
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  // If we can't create logs dir, just use console
  console.warn('Could not create logs directory, using console only');
}

const transports = [];

// Always use console in production (Railway needs this for logs)
transports.push(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${service || 'stratag'}] ${level}: ${message} ${metaStr}`;
    })
  )
}));

// Only add file transports if logs dir exists
if (fs.existsSync(logsDir)) {
  transports.push(new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }));
  transports.push(new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: 'stratag2ndgen' },
  transports,
});

export default logger;
