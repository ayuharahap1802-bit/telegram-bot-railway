const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../shared/logger');

let db = null;

async function setupDatabase() {
  const dbPath = process.env.DATABASE_URL || './data/bot.db';
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Database connection failed:', err);
        reject(err);
        return;
      }
      
      logger.info('Database connected successfully');
      
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON');
      
      // Initialize tables
      initializeTables()
        .then(() => resolve(db))
        .catch(reject);
    });
  });
}

async function initializeTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      role TEXT DEFAULT 'user',
      is_banned BOOLEAN DEFAULT 0,
      ban_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME
    )`,
    
    `CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT,
      metadata TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      targets TEXT,
      status TEXT DEFAULT 'pending',
      total_sent INTEGER DEFAULT 0,
      total_failed INTEGER DEFAULT 0,
      scheduled_for DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS promo_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount INTEGER,
      claim_date DATE,
      status TEXT DEFAULT 'pending',
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT,
      message TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS banned_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      reason TEXT,
      banned_by INTEGER,
      banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL
    )`,
    
    `CREATE TABLE IF NOT EXISTS feature_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      enabled BOOLEAN DEFAULT 0,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS channel_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT UNIQUE,
      channel_name TEXT,
      channel_type TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    `CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_promo_claims_user_date ON promo_claims(user_id, claim_date)`,
    `CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status)`,
    `CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled ON broadcasts(scheduled_for) WHERE status = 'scheduled'`,
    `CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)`,
    `CREATE INDEX IF NOT EXISTS idx_system_logs_created ON system_logs(created_at)`
  ];
  
  return new Promise((resolve, reject) => {
    let remaining = queries.length;
    let hasError = false;
    
    queries.forEach((query, index) => {
      db.run(query, (err) => {
        if (err && !hasError) {
          hasError = true;
          reject(err);
          return;
        }
        
        remaining--;
        if (remaining === 0 && !hasError) {
          logger.info('Database tables initialized');
          resolve();
        }
      });
    });
  });
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { setupDatabase, getDatabase };
