import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config.js';
import { initializeDatabase } from './database.js';
import { initializeWebSocket } from './websocket.js';
import logger from './utils/logger.js';

import incidentsRoutes from './routes/incidents.js';
import driversRoutes from './routes/drivers.js';
import radioCallsRoutes from './routes/radio-calls.js';
import vonageRoutes from './routes/vonage.js';
import transcriptionRoutes from './routes/transcription.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = await initializeDatabase();
    const client = await db.connect();
    await client.query('SELECT NOW()');
    client.release();
    res.json({ success: true, status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ success: false, status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// API routes
app.use('/api/incidents', incidentsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/radio-calls', radioCallsRoutes);
app.use('/api/vonage', vonageRoutes);
app.use('/api/transcription', transcriptionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static frontend in production
if (config.nodeEnv === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Initialize WebSocket
initializeWebSocket(io, logger);

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed', { error: error.message });
    logger.warn('⚠️ Server starting without database — some features will not work');
  }

  const PORT = config.port || 4000;
  httpServer.listen(PORT, () => {
    logger.info(`🚀 StrataG2ndGen server running on port ${PORT}`);
    logger.info(`📡 Environment: ${config.nodeEnv}`);
    logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
  });
}

startServer();

export default app;
