const { setupMiddlewares } = require('../core/middleware');
const { setupCommands } = require('../modules');
const { setupSchedulers } = require('../scheduler/scheduler.manager');
const { setupMonitoring } = require('../monitoring');
const logger = require('../shared/logger');

async function registerModules(app) {
  const { bot, db, config } = app;
  
  try {
    // Setup all middlewares
    setupMiddlewares(bot, db, config);
    
    // Register all commands
    await setupCommands(bot, db, config);
    
    // Start schedulers
    setupSchedulers(app);
    
    // Start monitoring
    setupMonitoring(app);
    
    // Launch bot
    await bot.launch();
    
    logger.info('All modules registered successfully');
    
  } catch (error) {
    logger.error('Module registration failed:', error);
    throw error;
  }
}

module.exports = { registerModules };
