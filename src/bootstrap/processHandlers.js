const logger = require('../shared/logger');

function registerProcessHandlers(app, shutdownHandler) {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdownHandler(app, 'uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle termination signals
  process.on('SIGTERM', () => shutdownHandler(app, 'SIGTERM'));
  process.on('SIGINT', () => shutdownHandler(app, 'SIGINT'));

  logger.info('Process handlers registered');
}

module.exports = { registerProcessHandlers };
