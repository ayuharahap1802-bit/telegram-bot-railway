class ControlRepository {
  constructor(db) {
    this.db = db;
  }

  async getSystemSettings() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM system_settings LIMIT 1', (err, row) => {
        if (err) reject(err);
        else resolve(row || {});
      });
    });
  }

  async updateSystemSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [key, value],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getSystemLogs(limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = { ControlRepository };
