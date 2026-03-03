const { createBot } = require('../core/bot.factory');
const { setupDatabase, getDatabase } = require('../database/connection');
const { loadConfig } = require('../config/env.config');
const logger = require('../shared/logger');

async function initApp() {
  try {
    logger.info('Initializing application...');
    
    // Load configuration
    const config = loadConfig();
    logger.info('Configuration loaded');
    
    // Setup database
    const db = await setupDatabase();
    logger.info('Database connected');
    
    // Create bot instance
    const bot = createBot(config);
    logger.info('Bot created');
    
    // Setup context extension
    require('../core/context.extension')(bot, db, config);
    logger.info('Context extended');
    
    return { bot, db, config };
    
  } catch (error) {
    logger.error('Init failed:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = { initApp };
