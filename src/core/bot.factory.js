const { Telegraf } = require('telegraf');
const logger = require('../shared/logger');

function createBot(config) {
  const bot = new Telegraf(config.BOT_TOKEN);
  
  // Setup bot info
  bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
    logger.info(`Bot initialized: @${botInfo.username}`);
  });

  // Error handling
  bot.catch((err, ctx) => {
    logger.error('Bot error:', err);
  });

  return bot;
}

module.exports = { createBot };
