const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../shared/logger');

async function runMigrations() {
  const dbPath = process.env.DATABASE_URL || './data/bot.db';
  
  // Ensure data directory exists
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations.sql'),
      'utf8'
    );
    
    // Run migrations
    await new Promise((resolve, reject) => {
      db.exec(migrationSQL, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    logger.info('Migrations completed successfully');
    
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
