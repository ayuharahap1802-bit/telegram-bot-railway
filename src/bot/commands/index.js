// src/bot/commands/index.js
module.exports = {
    public: {
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
        },
        help: async (ctx) => {
            const isAdmin = await db.isAdmin(ctx.from.id);
            
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

            const adminLevel = await db.getAdminLevel(ctx.from.id);
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
    },
    admin: {
        dashboard: async (ctx) => {
            const admin = await db.getAdminInfo(ctx.from.id);
            
            const adminMsg = `
🛠️ *ADMIN DASHBOARD*

👤 *Admin:* ${ctx.from.first_name}
👑 *Level:* ${admin.role}
🔑 *Permissions:* ${admin.permissions ? admin.permissions.length : 0}

📊 *STATISTIK CEPAT:*
• Total User: ${await db.getTotalUsers()}
• Broadcast Aktif: ${await db.getActiveBroadcasts()}
• Post Terjadwal: ${(await db.getScheduledPosts()).length}

Pilih menu di bawah:
            `;
            
            await ctx.replyWithMarkdown(adminMsg, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '👥 MANAGE USERS', callback_data: 'admin_users' }],
                        [{ text: '📢 BROADCAST', callback_data: 'admin_broadcast' }],
                        [{ text: '📅 AUTO POST', callback_data: 'admin_posts' }],
                        [{ text: '⚙️ PENGATURAN', callback_data: 'admin_settings' }]
                    ]
                }
            });
        },
        listUsers: async (ctx) => {
            const args = ctx.message.text.split(' ');
            const page = parseInt(args[1]) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;
            
            const users = await db.getUsers(limit, offset);
            const total = await db.getTotalUsers();
            const totalPages = Math.ceil(total / limit);
            
            let userList = `👥 *DAFTAR USER (Halaman ${page}/${totalPages})*\n\n`;
            
            users.forEach((user, index) => {
                userList += `${offset + index + 1}. ${user.first_name} @${user.username || '-'} (${user.is_active ? '✅' : '❌'})\n`;
                userList += `   ID: \`${user.id}\` | Role: ${user.role}\n\n`;
            });
            
            const keyboard = [];
            if (page > 1) keyboard.push({ text: '⬅️ Sebelumnya', callback_data: `users_page_${page - 1}` });
            if (page < totalPages) keyboard.push({ text: '➡️ Selanjutnya', callback_data: `users_page_${page + 1}` });
            
            await ctx.replyWithMarkdown(userList, {
                reply_markup: {
                    inline_keyboard: [keyboard]
                }
            });
        }
    },
    superadmin: {
        listAdmins: async (ctx) => {
            const admins = await db.getAllAdmins();
            
            let adminsMsg = `👑 *DAFTAR ADMIN*\n\n`;
            
            admins.forEach((admin, index) => {
                adminsMsg += `${index + 1}. ${admin.first_name} @${admin.username || '-'}\n`;
                adminsMsg += `   Role: ${admin.role}\n`;
                adminsMsg += `   Permissions: ${admin.permissions ? admin.permissions.join(', ') : '-'}\n\n`;
            });
            
            await ctx.replyWithMarkdown(adminsMsg, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➕ TAMBAH ADMIN', callback_data: 'add_admin' }],
                        [{ text: '🔧 EDIT PERMISSIONS', callback_data: 'edit_permissions' }]
                    ]
                }
            });
        },
        settings: async (ctx) => {
            const settings = await db.getSettings();
            
            let settingsMsg = `⚙️ *PENGATURAN BOT*\n\n`;
            
            for (const [key, value] of Object.entries(settings)) {
                settingsMsg += `• ${key}: ${value}\n`;
            }
            
            await ctx.replyWithMarkdown(settingsMsg, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✏️ UBAH SETTING', callback_data: 'edit_settings' }]
                    ]
                }
            });
        },
        backup: async (ctx) => {
            await ctx.reply('⏳ Memulai backup database...');
            
            try {
                const backupFile = await backup.createBackup();
                await ctx.replyWithDocument({ source: backupFile });
                await ctx.reply('✅ Backup berhasil dibuat!');
            } catch (error) {
                await ctx.reply('❌ Gagal membuat backup: ' + error.message);
            }
        },
        logs: async (ctx) => {
            const args = ctx.message.text.split(' ');
            const days = parseInt(args[1]) || 1;
            
            const logs = await db.getActivityLogs(days);
            
            let logsMsg = `📋 *AKTIVITAS LOG (${days} hari terakhir)*\n\n`;
            
            logs.slice(0, 10).forEach((log, index) => {
                logsMsg += `${index + 1}. ${new Date(log.created_at).toLocaleString('id-ID')}\n`;
                logsMsg += `   👤 ${log.admin_name}: ${log.action}\n`;
                if (log.metadata) logsMsg += `   📝 ${JSON.stringify(log.metadata)}\n\n`;
            });
            
            if (logs.length > 10) {
                logsMsg += `\n... dan ${logs.length - 10} log lainnya.`;
            }
            
            await ctx.replyWithMarkdown(logsMsg);
        }
    }
};
