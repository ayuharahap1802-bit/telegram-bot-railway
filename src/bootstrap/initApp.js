const { createBot } = require('../core/bot.factory');
const { setupDatabase } = require('../database/connection');
const { loadConfig } = require('../config/env.config');
const logger = require('../shared/logger');

async function initApp() {
  try {
    // Load configuration
    const config = loadConfig();
    
    // Setup database
    const db = await setupDatabase();
    
    // Create bot instance
    const bot = createBot(config);
    
    // Setup context extension
    require('../core/context.extension')(bot, db, config);
    
    return { bot, db, config };
    
  } catch (error) {
    logger.error('Init failed:', error);
    throw error;
  }
}

module.exports = { initApp };
