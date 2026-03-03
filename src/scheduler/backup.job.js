const fs = require('fs');
const path = require('path');
const logger = require('../shared/logger');

class BackupJob {
  static async run(db) {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      
      // Create backup directory if not exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
      
      // Backup database
      await new Promise((resolve, reject) => {
        db.backup(backupFile, (err) => {
          if (err) reject(err);
          else {
            logger.info(`Database backup created: ${backupFile}`);
            resolve();
          }
        });
      });
      
      // Delete backups older than 7 days
      const files = fs.readdirSync(backupDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
        
        if (age > 7) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted old backup: ${file}`);
        }
      }
      
    } catch (error) {
      logger.error('Backup job failed:', error);
    }
  }
}

module.exports = { BackupJob };
