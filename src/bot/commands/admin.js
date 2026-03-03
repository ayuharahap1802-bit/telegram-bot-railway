const db = require('../../database/db');

module.exports = {
    dashboard: async (ctx) => {
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
    },
    
    posts: async (ctx) => {
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
    },
    
    usersPagination: async (ctx, db, data) => {
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
};
