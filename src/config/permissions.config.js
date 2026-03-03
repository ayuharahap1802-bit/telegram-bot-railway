const Permissions = {
  // System permissions
  MANAGE_SYSTEM: 'manage_system',
  VIEW_LOGS: 'view_logs',
  
  // Admin permissions
  MANAGE_ADMINS: 'manage_admins',
  VIEW_STATS: 'view_stats',
  
  // Promo permissions
  CREATE_PROMO: 'create_promo',
  SEND_BROADCAST: 'send_broadcast',
  SCHEDULE_PROMO: 'schedule_promo',
  
  // User permissions
  VIEW_PROMO: 'view_promo',
  CLAIM_BONUS: 'claim_bonus',
  
  // Security permissions
  BAN_USER: 'ban_user',
  VIEW_ABUSE: 'view_abuse'
};

const RolePermissions = {
  [Roles.SUPER_ADMIN]: Object.values(Permissions),
  [Roles.ADMIN]: [
    Permissions.VIEW_STATS,
    Permissions.CREATE_PROMO,
    Permissions.SEND_BROADCAST,
    Permissions.VIEW_PROMO,
    Permissions.CLAIM_BONUS
  ],
  [Roles.USER]: [
    Permissions.VIEW_PROMO,
    Permissions.CLAIM_BONUS
  ],
  [Roles.BANNED]: []
};

module.exports = { Permissions, RolePermissions };
