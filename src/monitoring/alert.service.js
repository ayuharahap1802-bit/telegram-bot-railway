const logger = require('../shared/logger');

class AlertService {
  constructor(bot, config) {
    this.bot = bot;
    this.config = config;
    this.thresholds = {
      errors: 10, // errors per minute
      cpu: 80,    // CPU percentage
      memory: 200 // MB
    };
  }

  async sendAlert(message, level = 'warning') {
    const emoji = level === 'critical' ? '🚨' : '⚠️';
    const alertMessage = `${emoji} ALERT [${level.toUpperCase()}]\n\n${message}\n\nTime: ${new Date().toISOString()}`;
    
    for (const adminId of this.config.SUPER_ADMIN_IDS) {
      try {
        await this.bot.telegram.sendMessage(adminId, alertMessage);
        logger.info(`Alert sent to admin ${adminId}`);
      } catch (error) {
        logger.error('Failed to send alert:', error);
      }
    }
  }

  async checkSystemHealth() {
    const metrics = global.metrics || {};
    
    // Check error rate
    if (metrics.errors && metrics.errors > this.thresholds.errors) {
      await this.sendAlert(`High error rate: ${metrics.errors} errors in last minute`, 'critical');
    }
    
    // Check memory usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memoryUsage > this.thresholds.memory) {
      await this.sendAlert(`High memory usage: ${memoryUsage.toFixed(2)} MB`, 'warning');
    }
  }
}

module.exports = { AlertService };
