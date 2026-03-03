const logger = require('../../shared/logger');

class KillSwitchService {
  constructor(bot, db, config) {
    this.bot = bot;
    this.db = db;
    this.config = config;
    this.isActive = false;
  }

  async activate(reason = 'Emergency shutdown') {
    this.isActive = true;
    
    logger.warn(`KILL SWITCH ACTIVATED: ${reason}`);
    
    // Notify all admins
    await this.notifyAdmins(reason);
    
    // Stop accepting new commands
    this.config.KILL_SWITCH_ACTIVE = true;
    
    // Schedule shutdown
    setTimeout(() => {
      this.executeShutdown();
    }, 10000); // 10 seconds grace period
    
    return { success: true, message: 'Kill switch activated' };
  }

  async notifyAdmins(reason) {
    const message = `🚨 KILL SWITCH ACTIVATED 🚨\n\nReason: ${reason}\nBot will shutdown in 10 seconds...`;
    
    for (const adminId of this.config.SUPER_ADMIN_IDS) {
      try {
        await this.bot.telegram.sendMessage(adminId, message);
      } catch (error) {
        logger.error('Failed to notify admin:', error);
      }
    }
  }

  executeShutdown() {
    logger.info('Executing emergency shutdown...');
    process.exit(1);
  }
}

module.exports = { KillSwitchService };
