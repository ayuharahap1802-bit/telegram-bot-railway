const db = require('../../database/db');

module.exports = {
    // Cek user terblokir dan update aktivitas
    userCheck: async (ctx, next) => {
        if (ctx.from) {
            const isBlocked = await db.isUserBlocked(ctx.from.id);
            if (isBlocked) {
                return ctx.reply('❌ Akun Anda telah diblokir. Hubungi admin.');
            }
            await db.updateUserActivity(ctx.from.id);
        }
        return next();
    },
    
    // Cek admin
    isAdmin: async (ctx, next) => {
        const admin = await db.isAdmin(ctx.from.id);
        if (!admin) {
            return ctx.reply('❌ Anda tidak memiliki akses ke perintah ini.');
        }
        return next();
    },
    
    // Cek super admin
    isSuperAdmin: async (ctx, next) => {
        const isSuper = await db.isSuperAdmin(ctx.from.id);
        if (!isSuper) {
            return ctx.reply('❌ Anda tidak memiliki akses ke perintah ini.');
        }
        return next();
    },
    
    // Cek permission spesifik
    hasPermission: (permission) => {
        return async (ctx, next) => {
            const hasPerm = await db.checkPermission(ctx.from.id, permission);
            if (!hasPerm) {
                return ctx.reply('❌ Anda tidak memiliki izin untuk perintah ini.');
            }
            return next();
        };
    }
};
