class FeatureToggleService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
    this.features = new Map();
  }

  async init() {
    // Load features from database
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM feature_flags', (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        rows.forEach(row => {
          this.features.set(row.name, row.enabled === 1);
        });
        
        resolve();
      });
    });
  }

  isEnabled(featureName) {
    return this.features.get(featureName) ?? false;
  }

  async setFeature(featureName, enabled) {
    this.features.set(featureName, enabled);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO feature_flags (name, enabled, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [featureName, enabled ? 1 : 0],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getAllFeatures() {
    return Array.from(this.features.entries()).map(([name, enabled]) => ({
      name,
      enabled
    }));
  }
}

module.exports = { FeatureToggleService };
