const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const logger = require('../shared/logger');

let db = null;

async function setupDatabase() {
  const dbPath = process.env.DATABASE_URL || './data/bot.db';
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        logger.error('Database connection failed:', err);
        reject(err);
        return;
      }
      
      logger.info('Database connected successfully');
      initializeTables();
      resolve(db);
    });
  });
}

function initializeTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      targets TEXT,
      status TEXT,
      total_sent INTEGER DEFAULT 0,
      total_failed INTEGER DEFAULT 0,
      scheduled_for DATETIME,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS promo_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      amount INTEGER,
      claim_date DATE,
      status TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
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
      user_id INTEGER,
      reason TEXT,
      banned_by INTEGER,
      banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (banned_by) REFERENCES users(id)
    )`
  ];
  
  queries.forEach(query => {
    db.run(query, (err) => {
      if (err) {
        logger.error('Table creation failed:', err);
      }
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
