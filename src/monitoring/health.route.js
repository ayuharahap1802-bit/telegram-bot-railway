const express = require('express');
const { getDatabase } = require('../database/connection');
const logger = require('../shared/logger');

function setupHealthEndpoint(app, bot) {
  const router = express.Router();
  
  // Health check endpoint
  router.get('/health', async (req, res) => {
    try {
      const db = getDatabase();
      const startTime = Date.now();
      
      // Check database
      await new Promise((resolve, reject) => {
        db.get('SELECT 1', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      const dbLatency = Date.now() - startTime;
      
      // Check bot
      const botInfo = await bot.telegram.getMe();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: true,
          latency: dbLatency
        },
        bot: {
          username: botInfo.username,
          id: botInfo.id
        },
        memory: process.memoryUsage()
      });
      
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return router;
}

module.exports = { setupHealthEndpoint };
