const logger = require('../shared/logger');

class ErrorHandler {
  static handle(error, ctx = null) {
    logger.error('Error:', {
      message: error.message,
      stack: error.stack,
      context: ctx ? {
        from: ctx.from,
        chat: ctx.chat,
        command: ctx.message?.text
      } : null
    });

    // Send error to super admins if critical
    if (this.isCritical(error) && ctx?.config?.SUPER_ADMIN_IDS) {
      this.notifyAdmins(error, ctx);
    }
  }

  static isCritical(error) {
    return error.code === 'ETELEGRAM' || 
           error.message.includes('database') ||
           error.message.includes('connection');
  }

  static async notifyAdmins(error, ctx) {
    const message = `🚨 CRITICAL ERROR\n\nMessage: ${error.message}\nTime: ${new Date().toISOString()}`;
    
    for (const adminId of ctx.config.SUPER_ADMIN_IDS) {
      try {
        await ctx.telegram.sendMessage(adminId, message);
      } catch (e) {
        logger.error('Failed to notify admin:', e);
      }
    }
  }
}

module.exports = { ErrorHandler };
