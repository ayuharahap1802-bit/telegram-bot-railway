const dotenv = require('dotenv');
const Joi = require('joi');
const logger = require('../shared/logger');

dotenv.config();

const envSchema = Joi.object({
  BOT_TOKEN: Joi.string().required(),
  BOT_USERNAME: Joi.string().required(),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  
  DATABASE_URL: Joi.string().default('./data/bot.db'),
  REDIS_URL: Joi.string().optional(),
  
  SUPER_ADMIN_IDS: Joi.string().required(),
  SUPER_ADMIN_USERNAMES: Joi.string().required(),
  
  DEFAULT_CHANNEL_ID: Joi.string().required(),
  DEFAULT_CHANNEL_LINK: Joi.string().uri().required(),
  
  PROMO_LINK_PREDICTION: Joi.string().uri().required(),
  PROMO_LINK_WHATSAPP: Joi.string().uri().required(),
  PROMO_LINK_TELEGRAM: Joi.string().uri().required(),
  PROMO_LINK_CLAIM: Joi.string().uri().required(),
  
  RATE_LIMIT_WINDOW: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(10),
  
  MAINTENANCE_MODE: Joi.boolean().default(false),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  PORT: Joi.number().default(3000)
});

function loadConfig() {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true
  });
  
  if (error) {
    logger.error('Config validation error:', error.message);
    throw new Error(`Config validation error: ${error.message}`);
  }
  
  // Parse super admin IDs
  value.SUPER_ADMIN_IDS = value.SUPER_ADMIN_IDS.split(',').map(id => parseInt(id.trim()));
  value.SUPER_ADMIN_USERNAMES = value.SUPER_ADMIN_USERNAMES.split(',').map(name => name.trim());
  
  logger.info('Configuration loaded successfully');
  return value;
}

module.exports = { loadConfig };
