import express from 'express';
import { createServer } from 'http';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

let server = null;

export const startWebServer = async (client) => {
  const app = express();
  const port = config.web.port;
  const host = config.web.host;

  // Health check endpoint for Railway
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      client: client.isReady ? 'connected' : 'disconnected',
      shards: client.shard ? client.shard.count : 0,
      memory: process.memoryUsage(),
    });
  });

  // Readiness probe
  app.get('/ready', (req, res) => {
    if (client.isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  });

  // Metrics endpoint (for monitoring)
  app.get('/metrics', (req, res) => {
    const metrics = {
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      commands: client.commands.size,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
    res.json(metrics);
  });

  // Error handling
  app.use((err, req, res, next) => {
    logger.error('Web server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // Create HTTP server
  server = createServer(app);
  
  server.listen(port, host, () => {
    logger.info(`Web server listening on ${host}:${port}`);
  });

  // Handle server errors
  server.on('error', (error) => {
    logger.error('Web server error:', error);
  });

  return server;
};

export const stopWebServer = async () => {
  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        logger.info('Web server stopped');
        resolve();
      });
    });
  }
};

export default { startWebServer, stopWebServer };
