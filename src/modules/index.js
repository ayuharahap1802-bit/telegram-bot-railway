const { setupControlCommands } = require('./control/control.commands');
const { setupPromoCommands } = require('./promo/promo.commands');
const { setupBroadcastCommands } = require('./broadcast/broadcast.commands');
const { setupUserCommands } = require('./user/user.commands');
const { setupAdminCommands } = require('./admin/admin.commands');
const { setupSecurityCommands } = require('./security/security.commands');
const { setupAnalyticsCommands } = require('./analytics/stats.commands');
const logger = require('../shared/logger');

async function setupCommands(bot, db, config) {
  try {
    // Register all command modules
    setupControlCommands(bot, db, config);
    setupPromoCommands(bot, db, config);
    setupBroadcastCommands(bot, db, config);
    setupUserCommands(bot, db, config);
    setupAdminCommands(bot, db, config);
    setupSecurityCommands(bot, db, config);
    setupAnalyticsCommands(bot, db, config);
    
    // Setup start command (always available)
    bot.start(async (ctx) => {
      await ctx.replyWithPromo();
      await ctx.trackActivity('start');
    });
    
    logger.info('All commands registered successfully');
    
  } catch (error) {
    logger.error('Command registration failed:', error);
    throw error;
  }
}

module.exports = { setupCommands };
