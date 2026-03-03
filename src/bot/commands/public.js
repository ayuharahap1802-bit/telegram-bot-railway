const db = require('../../database/db');

module.exports = {
    start: async (ctx) => {
        const user = await db.getOrCreateUser(ctx.from);
        const welcomeMsg = `
🎉 *SELAMAT DATANG DI BOLA PELANGI OFFICIAL* 🎉

Halo *${ctx.from.first_name}*! 
Terima kasih telah bergabung dengan bot official kami.

🔰 *FITUR YANG TERSEDIA:*
• Info Promo Terbaru
• Statistik Pengguna
• Broadcast Info
• Auto Post Channel

📢 *JANGAN LUPA FOLLOW:*
• Channel: ${process.env.TG_CHANNEL}
• WhatsApp: ${process.env.WA_CHANNEL}
• Prediksi: ${process.env.PREDIKSI_LINK}

Gunakan /help untuk melihat semua perintah.
        `;
        
        await ctx.replyWithMarkdown(welcomeMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔥 PROMO HARI INI', callback_data: 'promo' }],
                    [{ text: '📊 STATISTIK', callback_data: 'stats' }],
                    [{ text: '📢 JOIN CHANNEL', url: process.env.TG_CHANNEL }]
                ]
            }
        });
        
        await db.logInteraction(ctx.from.id, 'START');
    },
    
    help: async (ctx) => {
        const isAdmin = await db.isAdmin(ctx.from.id);
        const adminLevel = await db.getAdminLevel(ctx.from.id);
        
        let helpMsg = `
📚 *DAFTAR PERINTAH BOT*

🔹 *PERINTAH PUBLIK:*
/start - Mulai bot
/help - Bantuan ini
/info - Info akun Anda
/promo - Lihat promo terbaru
/stats - Statistik bot
`;

        if (isAdmin) {
            helpMsg += `
        
🔹 *PERINTAH ADMIN:*
/admin - Dashboard admin
/users - Daftar user
/broadcast - Kirim broadcast
/posts - Kelola auto post
`;
        }

        if (adminLevel === 'SUPER_ADMIN') {
            helpMsg += `
        
🔹 *PERINTAH SUPER ADMIN:*
/admins - Kelola admin
/settings - Pengaturan bot
/backup - Backup database
/logs - Lihat log aktivitas
`;
        }
        
        await ctx.replyWithMarkdown(helpMsg);
    },
    
    info: async (ctx) => {
        const user = await db.getUser(ctx.from.id);
        const stats = await db.getUserStats(ctx.from.id);
        
        const infoMsg = `
📋 *INFORMASI AKUN ANDA*

🆔 ID: \`${ctx.from.id}\`
👤 Nama: ${ctx.from.first_name} ${ctx.from.last_name || ''}
📛 Username: @${ctx.from.username || '-'}
📅 Bergabung: ${new Date(user.joined_at).toLocaleDateString('id-ID')}
🕐 Terakhir Aktif: ${user.last_active ? new Date(user.last_active).toLocaleString('id-ID') : 'Baru saja'}

📊 *STATISTIK:*
• Total Interaksi: ${stats.total_interactions}
• Perintah Digunakan: ${stats.commands_used}
• Bergabung ke Channel: ${stats.joined_channel ? '✅' : '❌'}
        `;
        
        await ctx.replyWithMarkdown(infoMsg);
    },
    
    promo: async (ctx) => {
        const promoMsg = `
⚽ *PROMO GILA! CASHBACK 100% MIX PARLAY* ⚽
*Satu Tim Meleset? Modal Kami Balikin Utuh!*

📋 *SYARAT & KETENTUAN:*
• Bet: Minimal Rp 10.000
• Tim: Minimal 5 tim (TODAY)
• Odds: Minimal 1.80/tim
• Provider: Sport 1/2

💡 *ATURAN:*
• 1 tim Lose Full
• Sisanya Win Full
• Max Rp 300.000/hari

⚠️ *WAJIB FOLLOW:*
🤖 Bot: @Bolapelangi2office_bot
📈 Prediksi: ${process.env.PREDIKSI_LINK}
📢 Channel WA: ${process.env.WA_CHANNEL}
📢 Channel TG: ${process.env.TG_CHANNEL}
🟢 Klaim: ${process.env.CLAIM_LINK}

📌 *Catatan:* 1x/hari, no IP sama, no safety bet
🚀 *GASPOLL TERUS BOSKU!*
        `;
        
        await ctx.replyWithMarkdown(promoMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🎯 KLAIM PROMO', url: process.env.CLAIM_LINK }],
                    [{ text: '📢 JOIN CHANNEL', url: process.env.TG_CHANNEL }]
                ]
            }
        });
        
        await db.logInteraction(ctx.from.id, 'PROMO');
    },
    
    stats: async (ctx) => {
        const stats = await db.getBotStats();
        
        const statsMsg = `
📊 *STATISTIK BOT BOLA PELANGI*

👥 *Total Pengguna:* ${stats.total_users}
✨ *Pengguna Aktif (7h):* ${stats.active_users}
📝 *Total Broadcast:* ${stats.total_broadcasts}
💬 *Interaksi Hari Ini:* ${stats.today_interactions}
🕐 *Uptime:* ${process.uptime() | 0} detik

📅 *Terakhir Update:* ${new Date().toLocaleString('id-ID')}
        `;
        
        await ctx.replyWithMarkdown(statsMsg);
    }
};
