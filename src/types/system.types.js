/**
 * @typedef {Object} SystemConfig
 * @property {string} BOT_TOKEN - Telegram bot token
 * @property {string} NODE_ENV - Environment (development/production)
 * @property {string} DATABASE_URL - Database connection string
 * @property {number[]} SUPER_ADMIN_IDS - Array of super admin IDs
 * @property {boolean} MAINTENANCE_MODE - Maintenance mode status
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {number} telegram_id - Telegram user ID
 * @property {string} username - Username
 * @property {string} role - User role
 * @property {boolean} is_banned - Ban status
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Broadcast
 * @property {number} id - Broadcast ID
 * @property {string} message - Broadcast message
 * @property {Object} targets - Broadcast targets
 * @property {string} status - Broadcast status
 * @property {string} scheduled_for - Scheduled time
 */

module.exports = {};
