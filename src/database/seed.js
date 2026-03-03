const sqlite3 = require('sqlite3').verbose();
const logger = require('../shared/logger');

async function seedDatabase() {
  const dbPath = process.env.DATABASE_URL || './data/bot.db';
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Insert default feature flags
    const features = [
      { name: 'promo', enabled: 1, description: 'Promo feature' },
      { name: 'broadcast', enabled: 1, description: 'Broadcast feature' },
      { name: 'analytics', enabled: 1, description: 'Analytics feature' },
      { name: 'security', enabled: 1, description: 'Security features' }
    ];
    
    for (const feature of features) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO feature_flags (name, enabled, description) VALUES (?, ?, ?)',
          [feature.name, feature.enabled, feature.description],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    // Insert default channel
    if (process.env.DEFAULT_CHANNEL_ID) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO channel_targets (channel_id, channel_name, channel_type) VALUES (?, ?, ?)',
          [process.env.DEFAULT_CHANNEL_ID, 'Default Channel', 'channel'],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    
    logger.info('Database seeded successfully');
    
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
