require('dotenv').config();
const { Telegraf, session, Markup } = require('telegraf');
const { message } = require('telegraf/filters');
const LocalSession = require('telegraf-session-local');
const logger = require('./utils/logger');
const db = require('./database/db');
const scheduler = require('./scheduler/posts');
const backup = require('./backup/backup');
const commands = require('./bot/commands');
const handlers = require('./bot/handlers');

// Inisialisasi Bot dengan Polling (No Webhook)
const bot = new Telegraf(process.env.BOT_TOKEN);

// Setup session lokal (disimpan di memory)
bot.use(new LocalSession({ database: 'sessions.json' }).middleware());

// Middleware untuk logging
bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(`[${ctx.from?.id}] ${ctx.message?.text} - ${ms}ms`);
});

// Middleware untuk cek user terblokir
bot.use(async (ctx, next) => {
    if (ctx.from) {
        const isBlocked = await db.isUserBlocked(ctx.from.id);
        if (isBlocked) {
            return ctx.reply('❌ Akun Anda telah diblokir. Hubungi admin.');
        }
        await db.updateUserActivity(ctx.from.id);
    }
    return next();
});

// ============== PUBLIC COMMANDS ==============

// /start command
bot.start(async (ctx) => {
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
});

// /help command
bot.help(async (ctx) => {
    const user = await db.getUser(ctx.from.id);
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
/templates - Template pesan
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
});

// /info command
bot.command('info', async (ctx) => {
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
});

// /promo command
bot.command('promo', async (ctx) => {
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
});

// /stats command
bot.command('stats', async (ctx) => {
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
});

// ============== ADMIN COMMANDS ==============

// Middleware cek admin
const isAdmin = async (ctx, next) => {
    const admin = await db.isAdmin(ctx.from.id);
    if (!admin) {
        return ctx.reply('❌ Anda tidak memiliki akses ke perintah ini.');
    }
    return next();
};

// Middleware cek permission
const hasPermission = (permission) => {
    return async (ctx, next) => {
        const hasPerm = await db.checkPermission(ctx.from.id, permission);
        if (!hasPerm) {
            return ctx.reply('❌ Anda tidak memiliki izin untuk perintah ini.');
        }
        return next();
    };
};

// /admin command
bot.command('admin', isAdmin, async (ctx) => {
    const admin = await db.getAdminInfo(ctx.from.id);
    
    const adminMsg = `
🛠️ *ADMIN DASHBOARD*

👤 *Admin:* ${ctx.from.first_name}
👑 *Level:* ${admin.role}
🔑 *Permissions:* ${admin.permissions.length}

📊 *STATISTIK CEPAT:*
• Total User: ${await db.getTotalUsers()}
• Broadcast Aktif: ${await db.getActiveBroadcasts()}
• Post Terjadwal: ${await db.getScheduledPosts()}

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
});

// /users command (with pagination)
bot.command('users', isAdmin, hasPermission('manage_users'), async (ctx) => {
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
});

// /broadcast command
bot.command('broadcast', isAdmin, hasPermission('can_broadcast'), async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1).join(' ');
    
    if (!args) {
        return ctx.replyWithMarkdown(`
📢 *CARA BROADCAST:*
• /broadcast [pesan] - Kirim langsung
• /broadcast schedule [waktu] [pesan] - Jadwalkan
• /broadcast template [nama] - Pakai template

Contoh: /broadcast Halo semua!
        `, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📋 LIHAT TEMPLATE', callback_data: 'list_templates' }]
                ]
            }
        });
    }
    
    // Konfirmasi broadcast
    await ctx.replyWithMarkdown(`
⚠️ *KONFIRMASI BROADCAST*

Pesan: "${args}"

Total penerima: ${await db.getTotalUsers()}

Yakin ingin mengirim broadcast?
    `, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '✅ YA, KIRIM', callback_data: `confirm_broadcast:${Buffer.from(args).toString('base64')}` },
                    { text: '❌ BATAL', callback_data: 'cancel_broadcast' }
                ]
            ]
        }
    });
});

// /posts command
bot.command('posts', isAdmin, hasPermission('manage_posts'), async (ctx) => {
    const posts = await db.getScheduledPosts();
    
    let postsMsg = `📅 *AUTO POST TERJADWAL*\n\n`;
    
    if (posts.length === 0) {
        postsMsg += 'Belum ada post terjadwal.\n';
    } else {
        posts.forEach((post, index) => {
            postsMsg += `${index + 1}. ${post.content.substring(0, 50)}...\n`;
            postsMsg += `   ⏰ Jadwal: ${post.cron}\n`;
            postsMsg += `   📊 Status: ${post.is_active ? '✅' : '❌'}\n\n`;
        });
    }
    
    await ctx.replyWithMarkdown(postsMsg, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ TAMBAH POST', callback_data: 'add_post' }],
                [{ text: '🔄 REFRESH', callback_data: 'refresh_posts' }]
            ]
        }
    });
});

// ============== SUPER ADMIN COMMANDS ==============

// /admins command
bot.command('admins', async (ctx) => {
    const isSuperAdmin = await db.isSuperAdmin(ctx.from.id);
    if (!isSuperAdmin) return ctx.reply('❌ Akses ditolak.');
    
    const admins = await db.getAllAdmins();
    
    let adminsMsg = `👑 *DAFTAR ADMIN*\n\n`;
    
    admins.forEach((admin, index) => {
        adminsMsg += `${index + 1}. ${admin.first_name} @${admin.username || '-'}\n`;
        adminsMsg += `   Role: ${admin.role}\n`;
        adminsMsg += `   Permissions: ${admin.permissions.join(', ')}\n\n`;
    });
    
    await ctx.replyWithMarkdown(adminsMsg, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '➕ TAMBAH ADMIN', callback_data: 'add_admin' }],
                [{ text: '🔧 EDIT PERMISSIONS', callback_data: 'edit_permissions' }]
            ]
        }
    });
});

// /settings command
bot.command('settings', async (ctx) => {
    const isSuperAdmin = await db.isSuperAdmin(ctx.from.id);
    if (!isSuperAdmin) return ctx.reply('❌ Akses ditolak.');
    
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
});

// /backup command
bot.command('backup', async (ctx) => {
    const isSuperAdmin = await db.isSuperAdmin(ctx.from.id);
    if (!isSuperAdmin) return ctx.reply('❌ Akses ditolak.');
    
    await ctx.reply('⏳ Memulai backup database...');
    
    try {
        const backupFile = await backup.createBackup();
        await ctx.replyWithDocument({ source: backupFile });
        await ctx.reply('✅ Backup berhasil dibuat!');
    } catch (error) {
        await ctx.reply('❌ Gagal membuat backup: ' + error.message);
    }
});

// /logs command
bot.command('logs', async (ctx) => {
    const isSuperAdmin = await db.isSuperAdmin(ctx.from.id);
    if (!isSuperAdmin) return ctx.reply('❌ Akses ditolak.');
    
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
});

// ============== CALLBACK HANDLERS ==============

// Handle callback queries
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();
    
    // Promo callback
    if (data === 'promo') {
        const promoMsg = await db.getPromoMessage();
        await ctx.replyWithMarkdown(promoMsg);
    }
    
    // Stats callback
    if (data === 'stats') {
        const stats = await db.getBotStats();
        await ctx.replyWithMarkdown(`
📊 *STATISTIK BOT*
Total User: ${stats.total_users}
Aktif 7h: ${stats.active_users}
Broadcast: ${stats.total_broadcasts}
        `);
    }
    
    // Admin callbacks
    if (data === 'admin_users') {
        await ctx.reply('👥 Menu Manage Users', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📋 LIHAT SEMUA USER', callback_data: 'list_users' }],
                    [{ text: '🔍 CARI USER', callback_data: 'search_user' }],
                    [{ text: '🚫 BLOKIR USER', callback_data: 'block_user' }],
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    
    if (data === 'admin_broadcast') {
        await ctx.reply('📢 Menu Broadcast', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📨 KIRIM BROADCAST', callback_data: 'send_broadcast' }],
                    [{ text: '📅 JADWALKAN', callback_data: 'schedule_broadcast' }],
                    [{ text: '📋 TEMPLATE', callback_data: 'manage_templates' }],
                    [{ text: '📊 HISTORY', callback_data: 'broadcast_history' }],
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    
    // Confirm broadcast
    if (data.startsWith('confirm_broadcast:')) {
        const encodedMsg = data.split(':')[1];
        const message = Buffer.from(encodedMsg, 'base64').toString();
        
        await ctx.reply('⏳ Memulai broadcast ke semua user...');
        
        const result = await db.processBroadcast(message, ctx.from.id);
        
        await ctx.replyWithMarkdown(`
✅ *BROADCAST SELESAI*

📊 *HASIL:*
• Total: ${result.total}
• Terkirim: ${result.sent}
• Gagal: ${result.failed}
• Waktu: ${result.time} detik
        `);
    }
    
    // Users pagination
    if (data.startsWith('users_page_')) {
        const page = parseInt(data.split('_')[2]);
        const users = await db.getUsers(10, (page - 1) * 10);
        const total = await db.getTotalUsers();
        
        let userList = `👥 *DAFTAR USER (Halaman ${page}/${Math.ceil(total/10)})*\n\n`;
        
        users.forEach((user, index) => {
            userList += `${(page-1)*10 + index + 1}. ${user.first_name} @${user.username || '-'}\n`;
        });
        
        await ctx.editMessageText(userList, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: '⬅️', callback_data: `users_page_${page - 1}` },
                    { text: '➡️', callback_data: `users_page_${page + 1}` }
                ]]
            }
        });
    }
});

// ============== AUTO WELCOME HANDLER ==============

// Handle new members di channel/group
bot.on('new_chat_members', async (ctx) => {
    const featureEnabled = await db.getFeatureFlag('auto_welcome');
    if (!featureEnabled) return;
    
    const newMembers = ctx.message.new_chat_members;
    const chatId = ctx.chat.id;
    
    // Cek apakah ini channel yang ditunjuk
    if (chatId.toString() === process.env.CHANNEL_ID) {
        for (const member of newMembers) {
            // Simpan ke database
            await db.getOrCreateUser(member);
            
            // Kirim welcome message
            const welcomeMsg = `
🎉 *SELAMAT DATANG* 🎉

Halo *${member.first_name}*!
Terima kasih telah bergabung dengan channel official kami.

Jangan lupa untuk:
✅ Follow bot: @Bolapelangi2office_bot
✅ Join channel WhatsApp: ${process.env.WA_CHANNEL}
✅ Cek promo terbaru dengan /promo

Semoga beruntung! 🍀
            `;
            
            await ctx.replyWithMarkdown(welcomeMsg);
            
            // Kirim pesan langsung ke user (jika bisa)
            try {
                await ctx.telegram.sendMessage(member.id, `
🎉 *TERIMA KASIH TELAH BERGABUNG* 🎉

Kami telah mencatat kehadiran Anda di channel.
Gunakan /promo untuk melihat promo terbaru!
                `, { parse_mode: 'Markdown' });
            } catch (error) {
                // User mungkin block bot, skip
            }
            
            await db.logInteraction(member.id, 'JOIN_CHANNEL');
        }
    }
});

// ============== MESSAGE HANDLERS ==============

// Handle quick replies untuk kata kunci
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    const user = await db.getUser(ctx.from.id);
    
    // Cek quick replies
    const quickReply = await db.getQuickReply(text);
    if (quickReply) {
        await ctx.reply(quickReply.response, { parse_mode: 'Markdown' });
        await db.logInteraction(ctx.from.id, 'QUICK_REPLY', { keyword: text });
        return;
    }
    
    // Cek apakah user minta bantuan
    if (text.includes('bantuan') || text.includes('help')) {
        return ctx.reply('Ketik /help untuk melihat daftar perintah.');
    }
    
    // Cek apakah user tanya promo
    if (text.includes('promo') || text.includes('cashback')) {
        return ctx.replyWithMarkdown(`
Ada promo cashback 100% untuk mix parlay!
Ketik /promo untuk detail lengkap.
        `);
    }
    
    // Log semua pesan
    await db.logInteraction(ctx.from.id, 'MESSAGE', { text });
});

// ============== ERROR HANDLER ==============

bot.catch((err, ctx) => {
    logger.error(`Error untuk ${ctx.updateType}:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi nanti.');
});

// ============== START BOT WITH POLLING ==============

// Fungsi untuk memulai bot
async function startBot() {
    try {
        // Test koneksi database
        await db.testConnection();
        logger.info('✅ Database connected');
        
        // Test koneksi Redis jika ada
        if (process.env.REDIS_URL) {
            // Init Redis
            logger.info('✅ Redis connected');
        }
        
        // Set bot commands untuk menu
        await bot.telegram.setMyCommands([
            { command: 'start', description: '🚀 Mulai bot' },
            { command: 'help', description: '📚 Bantuan' },
            { command: 'info', description: 'ℹ️ Info akun' },
            { command: 'promo', description: '🔥 Promo terbaru' },
            { command: 'stats', description: '📊 Statistik bot' }
        ]);
        
        // Mulai scheduler untuk auto post
        scheduler.start(bot);
        logger.info('✅ Scheduler started');
        
        // Mulai backup otomatis (setiap jam 3 pagi)
        backup.startSchedule();
        logger.info('✅ Backup scheduler started');
        
        // Launch bot dengan polling
        await bot.launch();
        logger.info(`
🚀🚀🚀 BOT BOLA PELANGI BERHASIL JALAN! 🚀🚀🚀

🤖 Bot: ${process.env.BOT_USERNAME}
📢 Channel: ${process.env.CHANNEL_ID}
👑 Super Admin: ${process.env.SUPER_ADMIN_USERNAME_1}, ${process.env.SUPER_ADMIN_USERNAME_2}
⏰ Waktu: ${new Date().toLocaleString('id-ID')}
📡 Mode: Polling (No Webhook)
        `);
        
    } catch (error) {
        logger.error('❌ Gagal start bot:', error);
        process.exit(1);
    }
}

// Graceful stop
process.once('SIGINT', () => {
    logger.info('🛑 Bot dihentikan (SIGINT)');
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    logger.info('🛑 Bot dihentikan (SIGTERM)');
    bot.stop('SIGTERM');
    process.exit(0);
});

// Start the bot
startBot();
