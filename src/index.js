#!/usr/bin/env node

// Auto-detect Railway environment
const isRailway = !!process.env.RAILWAY_SERVICE_ID;

// Load environment variables (Railway auto-injects them, no need for .env)
const BOT_TOKEN = process.env.BOT_TOKEN || '8793227199:AAEXajy3RDO7SpMSCloj13Z4ubX3DXNvN4M';
const BOT_USERNAME = process.env.BOT_USERNAME || '@Bolapelangi2office_bot';
const CHANNEL_ID = process.env.CHANNEL_ID || '-1003573191693';
const SUPER_ADMIN_1 = process.env.SUPER_ADMIN_1 || '8122523608';
const SUPER_ADMIN_2 = process.env.SUPER_ADMIN_2 || '947482209';
const SUPER_ADMIN_USERNAME_1 = process.env.SUPER_ADMIN_USERNAME_1 || '@bolapelangi_2';
const SUPER_ADMIN_USERNAME_2 = process.env.SUPER_ADMIN_USERNAME_2 || '@Bolapelangi2';

// Railway PostgreSQL URL (auto-provided)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/telegram_bot';

// Links
const WA_CHANNEL = process.env.WA_CHANNEL || 'https://bopel2.vip/Channel-Whatsapp';
const TG_CHANNEL = process.env.TG_CHANNEL || 'https://bopel2.vip/Channel-Telegram';
const PREDIKSI_LINK = process.env.PREDIKSI_LINK || 'https://bopel2.vip/ChannelWA-Jadwal-Prediksi';
const CLAIM_LINK = process.env.CLAIM_LINK || 'https://bopel2.link/wa';

console.log('============================================================');
console.log('🚀 Starting Telegram Bot with Advanced Features');
console.log('============================================================');
console.log(`📡 Platform: ${isRailway ? 'Railway' : 'Local'}`);
console.log(`🤖 Bot Token: ${BOT_TOKEN ? '✅ Loaded' : '❌ Missing'}`);
console.log(`📢 Channel ID: ${CHANNEL_ID}`);
console.log(`👑 Super Admin: ${SUPER_ADMIN_USERNAME_1}, ${SUPER_ADMIN_USERNAME_2}`);
console.log(`🗄️ Database: ${DATABASE_URL ? '✅ Loaded' : '❌ Missing'}`);
console.log('============================================================');

// Cek token
if (!BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN is not set!');
    console.error('📌 Please set BOT_TOKEN in Railway variables');
    process.exit(1);
}

// Export env untuk digunakan di module lain
process.env.BOT_TOKEN = BOT_TOKEN;
process.env.BOT_USERNAME = BOT_USERNAME;
process.env.CHANNEL_ID = CHANNEL_ID;
process.env.SUPER_ADMIN_1 = SUPER_ADMIN_1;
process.env.SUPER_ADMIN_2 = SUPER_ADMIN_2;
process.env.SUPER_ADMIN_USERNAME_1 = SUPER_ADMIN_USERNAME_1;
process.env.SUPER_ADMIN_USERNAME_2 = SUPER_ADMIN_USERNAME_2;
process.env.DATABASE_URL = DATABASE_URL;
process.env.WA_CHANNEL = WA_CHANNEL;
process.env.TG_CHANNEL = TG_CHANNEL;
process.env.PREDIKSI_LINK = PREDIKSI_LINK;
process.env.CLAIM_LINK = CLAIM_LINK;
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.TIMEZONE = process.env.TIMEZONE || 'Asia/Jakarta';

// Import modules setelah env diset
const { Telegraf } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const logger = require('./utils/logger');
const db = require('./database/db');
const scheduler = require('./scheduler/posts');
const backup = require('./backup/backup');
const commands = require('./bot/commands');
const handlers = require('./bot/handlers');
const auth = require('./bot/middleware/auth');

// Inisialisasi Bot
const bot = new Telegraf(BOT_TOKEN);

// Setup session
bot.use(new LocalSession({ database: 'sessions.json' }).middleware());

// Middleware logging
bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger.info(`[${ctx.from?.id}] ${ctx.message?.text} - ${ms}ms`);
});

// Auth middleware
bot.use(auth.userCheck);

// ============== PUBLIC COMMANDS ==============
bot.start(commands.public.start);
bot.help(commands.public.help);
bot.command('info', commands.public.info);
bot.command('promo', commands.public.promo);
bot.command('stats', commands.public.stats);

// ============== ADMIN COMMANDS ==============
bot.command('admin', auth.isAdmin, commands.admin.dashboard);
bot.command('users', auth.isAdmin, auth.hasPermission('manage_users'), commands.admin.listUsers);
bot.command('broadcast', auth.isAdmin, auth.hasPermission('can_broadcast'), handlers.broadcast.start);
bot.command('posts', auth.isAdmin, auth.hasPermission('manage_posts'), commands.admin.posts);

// ============== SUPER ADMIN COMMANDS ==============
bot.command('admins', auth.isSuperAdmin, commands.superadmin.listAdmins);
bot.command('settings', auth.isSuperAdmin, commands.superadmin.settings);
bot.command('backup', auth.isSuperAdmin, commands.superadmin.backup);
bot.command('logs', auth.isSuperAdmin, commands.superadmin.logs);

// ============== CALLBACK HANDLERS ==============
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();
    
    // Public callbacks
    if (data === 'promo') {
        const promoMsg = await db.getPromoMessage();
        await ctx.replyWithMarkdown(promoMsg);
    }
    else if (data === 'stats') {
        const stats = await db.getBotStats();
        await ctx.replyWithMarkdown(`
📊 *STATISTIK BOT*
Total User: ${stats.total_users}
Aktif 7h: ${stats.active_users}
Broadcast: ${stats.total_broadcasts}
        `);
    }
    
    // Admin dashboard menu
    else if (data === 'admin_users') {
        await ctx.reply('👥 Menu Manage Users', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📋 LIHAT SEMUA USER', callback_data: 'list_users_1' }],
                    [{ text: '🔍 CARI USER', callback_data: 'search_user' }],
                    [{ text: '🚫 BLOKIR USER', callback_data: 'block_user' }],
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    else if (data.startsWith('list_users_')) {
        const page = parseInt(data.split('_')[2]) || 1;
        const users = await db.getUsers(10, (page - 1) * 10);
        const total = await db.getTotalUsers();
        const totalPages = Math.ceil(total / 10);
        
        let userList = `👥 *DAFTAR USER (Halaman ${page}/${totalPages})*\n\n`;
        users.forEach((user, idx) => {
            userList += `${idx + 1}. ${user.first_name || '-'} @${user.username || '-'}\n`;
            userList += `   ID: \`${user.id}\` | Status: ${user.is_active ? '✅' : '❌'}\n\n`;
        });
        
        const keyboard = [];
        const row = [];
        if (page > 1) row.push({ text: '⬅️', callback_data: `list_users_${page - 1}` });
        if (page < totalPages) row.push({ text: '➡️', callback_data: `list_users_${page + 1}` });
        if (row.length > 0) keyboard.push(row);
        keyboard.push([{ text: '⬅️ KEMBALI', callback_data: 'admin_users' }]);
        
        await ctx.editMessageText(userList, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
        });
    }
    else if (data === 'admin_broadcast') {
        await ctx.reply('📢 Menu Broadcast', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📨 KIRIM BROADCAST', callback_data: 'send_broadcast' }],
                    [{ text: '📋 TEMPLATE', callback_data: 'manage_templates' }],
                    [{ text: '📊 HISTORY', callback_data: 'broadcast_history' }],
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    else if (data === 'send_broadcast') {
        await ctx.reply('📝 Kirim pesan broadcast yang ingin dikirim:');
        // State untuk menangkap pesan berikutnya
    }
    else if (data.startsWith('confirm_broadcast:')) {
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
        `);
    }
    else if (data === 'cancel_broadcast') {
        await ctx.reply('❌ Broadcast dibatalkan.');
    }
    else if (data === 'admin_posts') {
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
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    else if (data === 'add_post') {
        await ctx.reply('📝 Kirim konten post yang ingin dijadwalkan:');
        // State untuk menangkap konten post
    }
    else if (data === 'admin_settings') {
        const settings = await db.getSettings();
        let settingsMsg = `⚙️ *PENGATURAN BOT*\n\n`;
        for (const [key, value] of Object.entries(settings)) {
            settingsMsg += `• ${key}: ${value}\n`;
        }
        await ctx.replyWithMarkdown(settingsMsg, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    else if (data === 'back_admin') {
        await commands.admin.dashboard(ctx);
    }
    else if (data === 'add_admin') {
        await ctx.reply('👑 Kirim ID user yang akan dijadikan admin:');
    }
});

// ============== NEW MEMBER HANDLER ==============
bot.on('new_chat_members', async (ctx) => {
    const newMembers = ctx.message.new_chat_members;
    const chatId = ctx.chat.id.toString();
    
    if (chatId === CHANNEL_ID) {
        for (const member of newMembers) {
            await db.getOrCreateUser(member);
            
            const welcomeMsg = `
🎉 *SELAMAT DATANG* 🎉

Halo *${member.first_name}*!
Terima kasih telah bergabung dengan channel official kami.

Jangan lupa untuk:
✅ Follow bot: @Bolapelangi2office_bot
✅ Join channel WhatsApp: ${WA_CHANNEL}
✅ Cek promo terbaru dengan /promo

Semoga beruntung! 🍀
            `;
            
            await ctx.replyWithMarkdown(welcomeMsg);
            
            try {
                await ctx.telegram.sendMessage(member.id, `
🎉 *TERIMA KASIH TELAH BERGABUNG* 🎉

Kami telah mencatat kehadiran Anda di channel.
Gunakan /promo untuk melihat promo terbaru!
                `, { parse_mode: 'Markdown' });
            } catch (error) {}
            
            await db.logInteraction(member.id, 'JOIN_CHANNEL');
        }
    }
});

// ============== MESSAGE HANDLER ==============
bot.on('text', async (ctx) => {
    const text = ctx.message.text.toLowerCase();
    
    // Quick replies
    const quickReply = await db.getQuickReply(text);
    if (quickReply) {
        return ctx.reply(quickReply.response, { parse_mode: 'Markdown' });
    }
    
    // Helper responses
    if (text.includes('bantuan') || text.includes('help')) {
        return ctx.reply('Ketik /help untuk melihat daftar perintah.');
    }
    
    if (text.includes('promo') || text.includes('cashback')) {
        return ctx.replyWithMarkdown(`
Ada promo cashback 100% untuk mix parlay!
Ketik /promo untuk detail lengkap.
        `);
    }
    
    // Log pesan
    await db.logInteraction(ctx.from.id, 'MESSAGE', { text: ctx.message.text });
});

// ============== ERROR HANDLER ==============
bot.catch((err, ctx) => {
    logger.error(`Error:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi nanti.').catch(() => {});
});

// ============== START BOT ==============
async function startBot() {
    try {
        // Test database
        await db.testConnection();
        logger.info('✅ Database connected');
        
        // Set commands
        await bot.telegram.setMyCommands([
            { command: 'start', description: '🚀 Mulai bot' },
            { command: 'help', description: '📚 Bantuan' },
            { command: 'info', description: 'ℹ️ Info akun' },
            { command: 'promo', description: '🔥 Promo terbaru' },
            { command: 'stats', description: '📊 Statistik bot' }
        ]);
        
        // Start scheduler
        scheduler.start(bot);
        logger.info('✅ Scheduler started');
        
        // Start backup scheduler
        backup.startSchedule();
        logger.info('✅ Backup scheduler started');
        
        // Launch bot
        await bot.launch();
        
        console.log(`
✅✅✅ BOT BERHASIL JALAN! ✅✅✅

🤖 Bot: @Bolapelangi2office_bot
📢 Channel: ${CHANNEL_ID}
👑 Super Admin: ${SUPER_ADMIN_USERNAME_1}, ${SUPER_ADMIN_USERNAME_2}
📡 Mode: Polling
⏰ Waktu: ${new Date().toLocaleString('id-ID')}
        `);
        
    } catch (error) {
        logger.error('❌ Gagal start bot:', error);
        process.exit(1);
    }
}

// Graceful shutdown
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

startBot();
