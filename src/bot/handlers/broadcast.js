const db = require('../../database/db');

module.exports = {
    start: async (ctx) => {
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
    },
    
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
};
