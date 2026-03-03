const logger = require('../shared/logger');

class CleanupJob {
  static async run(db) {
    try {
      // Delete old activity logs (older than 30 days)
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM user_activity WHERE created_at < datetime("now", "-30 days")',
          function(err) {
            if (err) reject(err);
            else {
              logger.info(`Cleaned up ${this.changes} old activity logs`);
              resolve();
            }
          }
        );
      });
      
      // Delete old system logs (older than 60 days)
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM system_logs WHERE created_at < datetime("now", "-60 days")',
          function(err) {
            if (err) reject(err);
            else {
              logger.info(`Cleaned up ${this.changes} old system logs`);
              resolve();
            }
          }
        );
      });
      
      // Update inactive users
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET role = "inactive" WHERE last_active < datetime("now", "-90 days") AND role = "user"',
          function(err) {
            if (err) reject(err);
            else {
              logger.info(`Updated ${this.changes} inactive users`);
              resolve();
            }
          }
        );
      });
      
    } catch (error) {
      logger.error('Cleanup job failed:', error);
    }
  }
}

module.exports = { CleanupJob };
