// src/bot/handlers/index.js
module.exports = {
    welcome: {
        handleNewMember: async (ctx, db) => {
            const featureEnabled = await db.getFeatureFlag('auto_welcome');
            if (!featureEnabled) return;
            
            const newMembers = ctx.message.new_chat_members;
            const chatId = ctx.chat.id;
            
            if (chatId.toString() === process.env.CHANNEL_ID) {
                for (const member of newMembers) {
                    await db.getOrCreateUser(member);
                    
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
        }
    },
    broadcast: {
        confirm: async (ctx, db) => {
            const data = ctx.callbackQuery.data;
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
    },
    quickreply: {
        handleMessage: async (ctx, db) => {
            const text = ctx.message.text.toLowerCase();
            
            const quickReply = await db.getQuickReply(text);
            if (quickReply) {
                await ctx.reply(quickReply.response, { parse_mode: 'Markdown' });
                await db.logInteraction(ctx.from.id, 'QUICK_REPLY', { keyword: text });
                return true;
            }
            
            if (text.includes('bantuan') || text.includes('help')) {
                await ctx.reply('Ketik /help untuk melihat daftar perintah.');
                return true;
            }
            
            if (text.includes('promo') || text.includes('cashback')) {
                await ctx.replyWithMarkdown(`
Ada promo cashback 100% untuk mix parlay!
Ketik /promo untuk detail lengkap.
                `);
                return true;
            }
            
            return false;
        }
    }
};
