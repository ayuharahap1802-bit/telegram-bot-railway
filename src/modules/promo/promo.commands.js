const { Permissions } = require('../../config/permissions.config');
const { PromoConfig } = require('../../config/promo.config');
const { PromoService } = require('./promo.service');
const logger = require('../../shared/logger');

function setupPromoCommands(bot, db, config) {
  const promoService = new PromoService(db, config);
  
  // Promo command - available to all users
  bot.command('promo', async (ctx) => {
    try {
      await ctx.replyWithPromo();
      await ctx.trackActivity('view_promo');
    } catch (error) {
      logger.error('Promo command error:', error);
      await ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.');
    }
  });
  
  // Create promo (admin only)
  bot.command('create_promo', async (ctx) => {
    try {
      if (!await ctx.hasPermission(Permissions.CREATE_PROMO)) {
        return ctx.reply('⛔ Anda tidak memiliki izin untuk membuat promo.');
      }
      
      // Implementation for creating custom promo
      await ctx.reply('Fitur create promo sedang dalam pengembangan');
      
    } catch (error) {
      logger.error('Create promo error:', error);
      await ctx.reply('❌ Terjadi kesalahan.');
    }
  });
  
  // Schedule promo (admin only)
  bot.command('schedule_promo', async (ctx) => {
    try {
      if (!await ctx.hasPermission(Permissions.SCHEDULE_PROMO)) {
        return ctx.reply('⛔ Anda tidak memiliki izin.');
      }
      
      await ctx.reply('📅 Kirimkan jadwal (format: YYYY-MM-DD HH:MM)');
      // Implementation for scheduling
      
    } catch (error) {
      logger.error('Schedule promo error:', error);
      await ctx.reply('❌ Terjadi kesalahan.');
    }
  });
}

module.exports = { setupPromoCommands };
