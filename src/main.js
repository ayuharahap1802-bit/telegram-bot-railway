const { initApp } = require('./bootstrap/initApp');
const { registerModules } = require('./bootstrap/registerModules');
const { registerProcessHandlers } = require('./bootstrap/processHandlers');
const { gracefulShutdown } = require('./bootstrap/gracefulShutdown');
const logger = require('./shared/logger');

async function main() {
  try {
    logger.info('Starting Telegram Promo Bot...');
    
    // Initialize application
    const app = await initApp();
    
    // Register all modules
    await registerModules(app);
    
    // Register process handlers
    registerProcessHandlers(app, gracefulShutdown);
    
    logger.info('Bot started successfully');
    
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
