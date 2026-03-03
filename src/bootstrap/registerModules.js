const { setupMiddlewares } = require('../core/middleware');
const { setupCommands } = require('../modules');
const { setupSchedulers } = require('../scheduler/scheduler.manager');
const { setupMonitoring } = require('../monitoring');
const logger = require('../shared/logger');

async function registerModules(app) {
  const { bot, db, config } = app;
  
  try {
    logger.info('Registering modules...');
    
    // Setup all middlewares
    await setupMiddlewares(bot, db, config);
    logger.info('Middlewares registered');
    
    // Register all commands
    await setupCommands(bot, db, config);
    logger.info('Commands registered');
    
    // Start schedulers
    setupSchedulers(app);
    logger.info('Schedulers started');
    
    // Start monitoring
    setupMonitoring(app);
    logger.info('Monitoring started');
    
    // Launch bot
    await bot.launch();
    logger.info('Bot launched');
    
    logger.info('All modules registered successfully');
    
  } catch (error) {
    logger.error('Module registration failed:', error);
    throw error;
  }
}

module.exports = { registerModules };
