function permissionGuard(requiredPermission) {
  return async (ctx, next) => {
    const hasPermission = await ctx.hasPermission(requiredPermission);
    if (!hasPermission) {
      return ctx.reply('⛔ Anda tidak memiliki izin untuk command ini.');
    }
    return next();
  };
}

module.exports = { permissionGuard };
