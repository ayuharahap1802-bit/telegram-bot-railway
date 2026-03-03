function superAdminGuard(ctx, next) {
  if (!ctx.isSuperAdmin()) {
    return ctx.reply('⛔ Hanya Super Admin yang dapat mengakses command ini.');
  }
  return next();
}

module.exports = { superAdminGuard };
