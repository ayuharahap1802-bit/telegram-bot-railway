const { authMiddleware } = require('./auth.middleware');
const { roleMiddleware } = require('./role.middleware');
const { permissionMiddleware } = require('./permission.middleware');
const { rateLimitMiddleware } = require('./rateLimit.middleware');
const { antiSpamMiddleware } = require('./antiSpam.middleware');
const { maintenanceMiddleware } = require('./maintenance.middleware');
const { featureFlagMiddleware } = require('./featureFlag.middleware');
const { auditMiddleware } = require('./audit.middleware');
const { abuseMiddleware } = require('./abuse.middleware');
const { errorMiddleware } = require('./error.middleware');
const logger = require('../../shared/logger');

function setupMiddlewares(bot, db, config) {
  // Order matters - error middleware first
  bot.use(errorMiddleware);
  
  // Core middlewares
  bot.use(authMiddleware(db));
  bot.use(rateLimitMiddleware(config));
  bot.use(maintenanceMiddleware(config));
  
  // Security middlewares
  bot.use(antiSpamMiddleware(db));
  bot.use(abuseMiddleware(db));
  
  // Feature & permission middlewares
  bot.use(featureFlagMiddleware(config));
  bot.use(roleMiddleware);
  bot.use(permissionMiddleware);
  
  // Audit last
  bot.use(auditMiddleware(db));
  
  logger.info('All middlewares registered');
}

module.exports = { setupMiddlewares };
