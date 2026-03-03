const logger = require('../shared/logger');

class MetricsService {
  constructor(db) {
    this.db = db;
    this.metrics = {
      commands: new Map(),
      users: { total: 0, active: 0 },
      messages: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  trackCommand(command) {
    const count = this.metrics.commands.get(command) || 0;
    this.metrics.commands.set(command, count + 1);
  }

  trackMessage() {
    this.metrics.messages++;
  }

  trackError() {
    this.metrics.errors++;
  }

  async updateUserMetrics() {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN last_active >= datetime('now', '-1 day') THEN 1 ELSE 0 END) as active
         FROM users`,
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          this.metrics.users = {
            total: row.total || 0,
            active: row.active || 0
          };
          
          resolve(this.metrics.users);
        }
      );
    });
  }

  getUptime() {
    return Math.floor((Date.now() - this.metrics.startTime) / 1000);
  }

  async getAllMetrics() {
    await this.updateUserMetrics();
    
    return {
      uptime: this.getUptime(),
      users: this.metrics.users,
      commands: Object.fromEntries(this.metrics.commands),
      messages: this.metrics.messages,
      errors: this.metrics.errors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { MetricsService };
