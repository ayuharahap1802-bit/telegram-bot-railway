const { Roles } = require('../../config/roles.config');
const logger = require('../../shared/logger');

function setupControlCommands(bot, db, config) {
  
  // System status
  bot.command('status', async (ctx) => {
    try {
      if (!ctx.isSuperAdmin()) {
        return ctx.reply('⛔ Hanya super admin yang dapat mengakses command ini.');
      }
      
      const stats = await getSystemStats(db);
      
      const message = `
🔧 SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━
🟢 Bot: Online
👥 Users: ${stats.totalUsers}
📊 Active Today: ${stats.activeToday}
📝 Total Broadcasts: ${stats.totalBroadcasts}
💰 Total Claims: ${stats.totalClaims}
🕐 Uptime: ${process.uptime().toFixed(0)}s
━━━━━━━━━━━━━━━━━━━
      `;
      
      await ctx.reply(message);
      
    } catch (error) {
      logger.error('Status command error:', error);
      await ctx.reply('❌ Terjadi kesalahan.');
    }
  });
  
  // Maintenance mode
  bot.command('maintenance', async (ctx) => {
    try {
      if (!ctx.isSuperAdmin()) {
        return ctx.reply('⛔ Hanya super admin yang dapat mengakses command ini.');
      }
      
      const args = ctx.message.text.split(' ');
      const mode = args[1];
      
      if (mode === 'on') {
        config.MAINTENANCE_MODE = true;
        await ctx.reply('🔧 Maintenance mode: ENABLED');
      } else if (mode === 'off') {
        config.MAINTENANCE_MODE = false;
        await ctx.reply('🔧 Maintenance mode: DISABLED');
      } else {
        await ctx.reply('Usage: /maintenance [on/off]');
      }
      
    } catch (error) {
      logger.error('Maintenance command error:', error);
      await ctx.reply('❌ Terjadi kesalahan.');
    }
  });
  
  // Kill switch
  bot.command('emergency_stop', async (ctx) => {
    try {
      if (!ctx.isSuperAdmin()) {
        return ctx.reply('⛔ Hanya super admin yang dapat mengakses command ini.');
      }
      
      await ctx.reply('⚠️ EMERGENCY STOP ACTIVATED. Bot akan mati dalam 5 detik...');
      
      setTimeout(() => {
        process.exit(0);
      }, 5000);
      
    } catch (error) {
      logger.error('Emergency stop error:', error);
    }
  });
}

async function getSystemStats(db) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE last_active >= datetime('now', '-1 day')) as activeToday,
        (SELECT COUNT(*) FROM broadcasts) as totalBroadcasts,
        (SELECT COUNT(*) FROM promo_claims) as totalClaims
    `, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

module.exports = { setupControlCommands };
