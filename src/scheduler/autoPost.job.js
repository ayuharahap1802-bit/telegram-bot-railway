const logger = require('../shared/logger');

class AutoPostJob {
  constructor(bot, db, config) {
    this.bot = bot;
    this.db = db;
    this.config = config;
  }

  async run() {
    try {
      // Get scheduled posts that are due
      const posts = await this.getDuePosts();
      
      for (const post of posts) {
        await this.executePost(post);
      }
      
    } catch (error) {
      logger.error('Auto post job failed:', error);
    }
  }

  async getDuePosts() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM broadcasts 
         WHERE status = 'scheduled' 
         AND scheduled_for <= datetime('now') 
         ORDER BY scheduled_for ASC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async executePost(post) {
    try {
      const targets = JSON.parse(post.targets);
      
      // Send to channel
      await this.bot.telegram.sendMessage(targets.channelId, post.message, {
        parse_mode: 'HTML'
      });
      
      // Update status
      await new Promise((resolve, reject) => {
        this.db.run(
          'UPDATE broadcasts SET status = ?, total_sent = 1 WHERE id = ?',
          ['sent', post.id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      logger.info(`Auto post executed: ${post.id}`);
      
    } catch (error) {
      logger.error(`Auto post failed ${post.id}:`, error);
      
      // Mark as failed
      await new Promise((resolve) => {
        this.db.run(
          'UPDATE broadcasts SET status = ? WHERE id = ?',
          ['failed', post.id],
          () => resolve()
        );
      });
    }
  }
}

module.exports = { AutoPostJob };
