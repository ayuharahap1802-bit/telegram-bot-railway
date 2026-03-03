const express = require('express');
const { initApp } = require('./bootstrap/initApp');
const { register } = require('./bootstrap/register');
const { registerProcessHandlers } = require('./bootstrap/processHandlers');
const { gracefulShutdown } = require('./bootstrap/gracefulShutdown');
const { setupHealthEndpoint } = require('./monitoring/health.route');
const logger = require('./shared/logger');

async function main() {
  try {
    logger.info('Starting Telegram Promo Bot...');
    
    // Initialize Express app for health checks
    const expressApp = express();
    const port = process.env.PORT || 3000;
    
    // Initialize application
    const app = await initApp();
    app.expressApp = expressApp;
    
    // Setup health endpoint
    const healthRouter = setupHealthEndpoint(app, app.bot);
    expressApp.use('/', healthRouter);
    
    // Start Express server
    expressApp.listen(port, () => {
      logger.info(`Health check server running on port ${port}`);
    });
    
    // Register all modules
    await register(app);
    
    // Register process handlers
    registerProcessHandlers(app, gracefulShutdown);
    
    logger.info('Bot started successfully');
    
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
