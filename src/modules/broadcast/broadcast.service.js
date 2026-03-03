const logger = require('../../shared/logger');

class BroadcastService {
  constructor(bot, db, config) {
    this.bot = bot;
    this.db = db;
    this.config = config;
    this.queue = [];
    this.isProcessing = false;
  }
  
  async sendToChannel(message, channelId = null) {
    const targetChannel = channelId || this.config.DEFAULT_CHANNEL_ID;
    
    try {
      await this.bot.telegram.sendMessage(targetChannel, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });
      
      await this.logBroadcast(targetChannel, message, 'channel', 'success');
      return { success: true };
      
    } catch (error) {
      logger.error('Channel broadcast failed:', error);
      await this.logBroadcast(targetChannel, message, 'channel', 'failed', error.message);
      return { success: false, error: error.message };
    }
  }
  
  async broadcastToUsers(message, userIds) {
    const results = {
      total: userIds.length,
      sent: 0,
      failed: 0,
      errors: []
    };
    
    for (const userId of userIds) {
      try {
        await this.bot.telegram.sendMessage(userId, message, {
          parse_mode: 'HTML'
        });
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
      }
      
      // Throttle to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    await this.logBroadcast('users', message, 'bulk', 
      results.failed === 0 ? 'success' : 'partial',
      results
    );
    
    return results;
  }
  
  async logBroadcast(target, message, type, status, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO broadcasts (message, targets, status, metadata) 
         VALUES (?, ?, ?, ?)`,
        [message, JSON.stringify({ target, type }), status, JSON.stringify(metadata)],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }
  
  async queueBroadcast(message, targets, scheduleTime = null) {
    const broadcast = {
      id: Date.now(),
      message,
      targets,
      scheduleTime,
      status: scheduleTime ? 'scheduled' : 'queued'
    };
    
    this.queue.push(broadcast);
    
    if (!scheduleTime && !this.isProcessing) {
      this.processQueue();
    }
    
    return broadcast;
  }
  
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const broadcast = this.queue.shift();
      
      if (broadcast.status === 'scheduled' && new Date() < new Date(broadcast.scheduleTime)) {
        // Re-queue for later
        this.queue.push(broadcast);
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        continue;
      }
      
      try {
        await this.sendToChannel(broadcast.message);
        broadcast.status = 'sent';
      } catch (error) {
        logger.error('Queue processing failed:', error);
        broadcast.status = 'failed';
      }
      
      // Delay between broadcasts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    this.isProcessing = false;
  }
}

module.exports = { BroadcastService };
