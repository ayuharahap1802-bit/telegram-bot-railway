const cron = require('node-cron');
const { PromoScheduler } = require('../modules/promo/promo.scheduler');
const { CleanupJob } = require('./cleanup.job');
const { BroadcastService } = require('../modules/broadcast/broadcast.service');
const logger = require('../shared/logger');

function setupSchedulers(app) {
  const { bot, db, config } = app;
  
  // Daily cleanup at 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running daily cleanup job');
    await CleanupJob.run(db);
  });
  
  // Hourly promo check
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly promo check');
    await PromoScheduler.checkScheduledPromos(db, bot);
  });
  
  // Broadcast every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running scheduled broadcast');
    const broadcastService = new BroadcastService(bot, db, config);
    await broadcastService.sendToChannel('⏰ Promo update setiap 6 jam!');
  });
  
  // Backup at 4 AM
  cron.schedule('0 4 * * *', async () => {
    logger.info('Running database backup');
    // Backup implementation
  });
  
  logger.info('Schedulers started successfully');
}

module.exports = { setupSchedulers };
