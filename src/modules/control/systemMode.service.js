const logger = require('../../shared/logger');

class SystemModeService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
    this.modes = {
      NORMAL: 'normal',
      MAINTENANCE: 'maintenance',
      EMERGENCY: 'emergency',
      READ_ONLY: 'read_only'
    };
  }

  async setMode(mode, reason = '') {
    if (!Object.values(this.modes).includes(mode)) {
      throw new Error('Invalid mode');
    }

    this.config.SYSTEM_MODE = mode;
    
    // Log mode change
    await this.logModeChange(mode, reason);
    
    logger.info(`System mode changed to: ${mode}${reason ? ` (${reason})` : ''}`);
    return { success: true, mode };
  }

  getMode() {
    return this.config.SYSTEM_MODE || this.modes.NORMAL;
  }

  isMode(mode) {
    return this.getMode() === mode;
  }

  async logModeChange(mode, reason) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO system_logs (level, message, metadata) VALUES (?, ?, ?)',
        ['info', `System mode changed to ${mode}`, JSON.stringify({ reason, timestamp: new Date() })],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = { SystemModeService };
