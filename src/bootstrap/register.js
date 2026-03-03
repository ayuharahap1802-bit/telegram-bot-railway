const { setupDatabase } = require('../database/connection');
const { loadConfig } = require('../config/env.config');
const { registerModules } = require('./registerModules');
const logger = require('../shared/logger');

async function register(app) {
  try {
    // Load config
    const config = loadConfig();
    app.config = config;
    
    // Setup database
    const db = await setupDatabase();
    app.db = db;
    
    // Register all modules
    await registerModules(app);
    
    logger.info('Application registered successfully');
    return app;
    
  } catch (error) {
    logger.error('Registration failed:', error);
    throw error;
  }
}

module.exports = { register };
