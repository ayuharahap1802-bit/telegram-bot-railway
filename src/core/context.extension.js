const { UserActivityService } = require('../modules/user/user.activity.service');
const { Permissions, RolePermissions } = require('../config/permissions.config');
const { Roles, RoleHierarchy } = require('../config/roles.config');
const { PromoService } = require('../modules/promo/promo.service');

module.exports = (bot, db, config) => {
  
  bot.use(async (ctx, next) => {
    // Extend context with custom methods
    ctx.db = db;
    ctx.config = config;
    
    // Initialize services
    ctx.userActivity = new UserActivityService(db);
    ctx.promoService = new PromoService(db, config);
    
    // User tracking
    if (ctx.from) {
      ctx.user = await ctx.userActivity.getUserOrCreate(ctx.from);
    }
    
    // Role check methods
    ctx.isSuperAdmin = () => {
      return config.SUPER_ADMIN_IDS.includes(ctx.from?.id);
    };
    
    ctx.isAdmin = () => {
      return ctx.isSuperAdmin() || ctx.user?.role === Roles.ADMIN;
    };
    
    ctx.hasRole = (role) => {
      if (ctx.isSuperAdmin()) return true;
      return ctx.user?.role === role;
    };
    
    ctx.hasPermission = async (permission) => {
      if (ctx.isSuperAdmin()) return true;
      
      const userRole = ctx.user?.role || Roles.USER;
      const userPermissions = RolePermissions[userRole] || [];
      
      return userPermissions.includes(permission);
    };
    
    ctx.hasHigherRoleThan = (otherUserId) => {
      // Implementation for role comparison
      return true;
    };
    
    // Activity tracking
    ctx.trackActivity = async (action, metadata = {}) => {
      if (ctx.user) {
        await ctx.userActivity.trackActivity(ctx.user.id, action, metadata);
      }
    };
    
    // Reply with promo
    ctx.replyWithPromo = async () => {
      const message = await ctx.promoService.getPromoMessage(ctx.user?.id);
      return ctx.reply(message, { parse_mode: 'HTML' });
    };
    
    // Check maintenance mode
    if (config.MAINTENANCE_MODE && !ctx.isSuperAdmin()) {
      return ctx.reply('🔧 Bot sedang dalam maintenance. Silakan coba lagi nanti.');
    }
    
    return next();
  });
};
