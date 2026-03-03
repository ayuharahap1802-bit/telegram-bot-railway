require('dotenv').config();
const { Telegraf } = require('telegraf');
const LocalSession = require('telegraf-session-local');
const logger = require('./utils/logger');
const db = require('./database/db');
const scheduler = require('./scheduler/posts');
const backup = require('./backup/backup');
const commands = require('./bot/commands');
const handlers = require('./bot/handlers');
const auth = require('./bot/middleware/auth');

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

// Auth middleware (cek user terblokir dan update aktivitas)
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
    if (data === 'promo' || data === 'stats') {
        await handlers.public.handleCallback(ctx, db, data);
    }
    
    // Admin dashboard menu callbacks
    else if (data === 'admin_users') {
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
    else if (data === 'admin_broadcast') {
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
                    [{ text: '🔄 REFRESH', callback_data: 'refresh_posts' }],
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    else if (data === 'admin_settings') {
        await ctx.reply('⚙️ Menu Pengaturan', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔧 UMUM', callback_data: 'settings_general' }],
                    [{ text: '📢 AUTO POST', callback_data: 'settings_autopost' }],
                    [{ text: '🔔 NOTIFIKASI', callback_data: 'settings_notifications' }],
                    [{ text: '⬅️ KEMBALI', callback_data: 'back_admin' }]
                ]
            }
        });
    }
    
    // Broadcast confirmation
    else if (data.startsWith('confirm_broadcast:')) {
        await handlers.broadcast.confirm(ctx, db);
    }
    
    // Cancel broadcast
    else if (data === 'cancel_broadcast') {
        await ctx.reply('❌ Broadcast dibatalkan.');
    }
    
    // Users pagination
    else if (data.startsWith('users_page_')) {
        await handlers.admin.usersPagination(ctx, db, data);
    }
    
    // Templates
    else if (data === 'list_templates') {
        await handlers.templates.list(ctx, db);
    }
    else if (data === 'manage_templates') {
        await handlers.templates.manage(ctx, db);
    }
    
    // Back to admin dashboard
    else if (data === 'back_admin') {
        await commands.admin.dashboard(ctx);
    }
    
    // Posts management
    else if (data === 'add_post' || data === 'refresh_posts') {
        await handlers.posts.handleCallback(ctx, db, data);
    }
    
    // Super admin callbacks
    else if (data === 'add_admin' || data === 'edit_permissions' || data === 'edit_settings') {
        await handlers.superadmin.handleCallback(ctx, db, data);
    }
});

// ============== NEW MEMBER HANDLER ==============
bot.on('new_chat_members', async (ctx) => {
    await handlers.welcome.handleNewMember(ctx, db);
});

// ============== MESSAGE HANDLER ==============
bot.on('text', async (ctx) => {
    // Cek quick replies terlebih dahulu
    const handled = await handlers.quickreply.handleMessage(ctx, db);
    
    if (!handled) {
        const text = ctx.message.text.toLowerCase();
        
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
        
        // Log semua pesan yang tidak terhandle
        await db.logInteraction(ctx.from.id, 'MESSAGE', { text: ctx.message.text });
    }
});

// ============== ERROR HANDLER ==============
bot.catch((err, ctx) => {
    logger.error(`Error untuk ${ctx.updateType}:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi nanti.').catch(() => {});
});

// ============== START BOT WITH POLLING ==============
async function startBot() {
    try {
        // Test koneksi database
        await db.testConnection();
        logger.info('✅ Database connected');
        
        // Test koneksi Redis jika ada
        if (process.env.REDIS_URL) {
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

🤖 Bot: ${process.env.BOT_USERNAME || 'Unknown'}
📢 Channel: ${process.env.CHANNEL_ID || 'Not set'}
👑 Super Admin: ${process.env.SUPER_ADMIN_USERNAME_1 || ''} ${process.env.SUPER_ADMIN_USERNAME_2 || ''}
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
