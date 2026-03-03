module.exports = {
  // System constants
  SYSTEM: {
    NAME: 'Telegram Promo Bot',
    VERSION: '1.0.0',
    MAX_RETRIES: 3,
    TIMEOUT: 30000
  },

  // User roles
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user',
    BANNED: 'banned',
    INACTIVE: 'inactive'
  },

  // Broadcast status
  BROADCAST_STATUS: {
    PENDING: 'pending',
    SENT: 'sent',
    FAILED: 'failed',
    SCHEDULED: 'scheduled',
    PROCESSING: 'processing'
  },

  // Claim status
  CLAIM_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled'
  },

  // Promo types
  PROMO_TYPES: {
    CASHBACK: 'cashback',
    BONUS: 'bonus',
    DISCOUNT: 'discount',
    SPECIAL: 'special'
  },

  // Rate limits
  RATE_LIMITS: {
    COMMANDS: 10, // per minute
    MESSAGES: 20, // per minute
    BROADCAST: 5  // per hour
  },

  // Error codes
  ERRORS: {
    UNAUTHORIZED: 'ERR_UNAUTHORIZED',
    FORBIDDEN: 'ERR_FORBIDDEN',
    NOT_FOUND: 'ERR_NOT_FOUND',
    VALIDATION: 'ERR_VALIDATION',
    DATABASE: 'ERR_DATABASE',
    TELEGRAM: 'ERR_TELEGRAM',
    RATE_LIMIT: 'ERR_RATE_LIMIT',
    MAINTENANCE: 'ERR_MAINTENANCE'
  }
};
