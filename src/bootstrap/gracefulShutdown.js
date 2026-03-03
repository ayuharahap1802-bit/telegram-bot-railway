const logger = require('../shared/logger');

async function gracefulShutdown(app, signal) {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  try {
    // Stop bot
    if (app.bot) {
      await app.bot.stop();
      logger.info('Bot stopped');
    }
    
    // Close database
    if (app.db) {
      await new Promise((resolve) => {
        app.db.close((err) => {
          if (err) logger.error('Error closing database:', err);
          else logger.info('Database connection closed');
          resolve();
        });
      });
    }
    
    // Clear any intervals/timeouts
    if (app.intervals) {
      app.intervals.forEach(clearInterval);
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

module.exports = { gracefulShutdown };
