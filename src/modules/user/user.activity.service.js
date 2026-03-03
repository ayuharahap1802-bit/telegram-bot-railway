const logger = require('../../shared/logger');

class UserActivityService {
  constructor(db) {
    this.db = db;
  }
  
  async trackActivity(userId, action, metadata = {}) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO user_activity (user_id, action, metadata) 
         VALUES (?, ?, ?)`,
        [userId, action, JSON.stringify(metadata)],
        function(err) {
          if (err) {
            logger.error('Failed to track activity:', err);
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }
  
  async getUserOrCreate(telegramUser) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE telegram_id = ?',
        [telegramUser.id],
        async (err, user) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (user) {
            // Update last active
            this.db.run(
              'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
              [user.id]
            );
            resolve(user);
          } else {
            // Create new user
            this.db.run(
              `INSERT INTO users (telegram_id, username, first_name, last_name, role) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                telegramUser.id,
                telegramUser.username,
                telegramUser.first_name,
                telegramUser.last_name,
                'user'
              ],
              function(err) {
                if (err) {
                  reject(err);
                  return;
                }
                
                resolve({
                  id: this.lastID,
                  telegram_id: telegramUser.id,
                  username: telegramUser.username,
                  first_name: telegramUser.first_name,
                  last_name: telegramUser.last_name,
                  role: 'user'
                });
              }
            );
          }
        }
      );
    });
  }
}

module.exports = { UserActivityService };
