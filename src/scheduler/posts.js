const cron = require('node-cron');
const db = require('../database/db');
const logger = require('../utils/logger');

class PostScheduler {
    constructor() {
        this.bot = null;
        this.jobs = [];
    }

    start(bot) {
        this.bot = bot;
        
        // Cek setiap menit untuk post yang harus dijalankan
        cron.schedule('* * * * *', async () => {
            try {
                await this.checkScheduledPosts();
            } catch (error) {
                logger.error('Scheduler error:', error);
            }
        });
        
        // Post promo setiap jam 9 pagi
        cron.schedule('0 9 * * *', async () => {
            await this.sendPromoMessage();
        }, {
            timezone: process.env.TIMEZONE || 'Asia/Jakarta'
        });
        
        // Post update statistik setiap jam 12 siang
        cron.schedule('0 12 * * *', async () => {
            await this.sendStatsUpdate();
        }, {
            timezone: process.env.TIMEZONE || 'Asia/Jakarta'
        });
        
        logger.info('✅ Scheduler jobs registered');
    }

    async checkScheduledPosts() {
        const posts = await db.getNextScheduledPosts();
        
        for (const post of posts) {
            try {
                // Kirim ke channel
                await this.bot.telegram.sendMessage(
                    process.env.CHANNEL_ID,
                    post.content,
                    { parse_mode: 'Markdown' }
                );
                
                // Hitung next run berdasarkan cron
                const nextRun = this.calculateNextRun(post.cron);
                
                // Update post
                await db.updatePostRunTime(post.id, nextRun);
                
                logger.info(`✅ Scheduled post ${post.id} sent to channel`);
                
                // Log activity
                await db.logActivity(0, 'System', 'SCHEDULED_POST_SENT', {
                    post_id: post.id,
                    content_preview: post.content.substring(0, 50)
                });
                
            } catch (error) {
                logger.error(`Failed to send scheduled post ${post.id}:`, error);
            }
        }
    }

    async sendPromoMessage() {
        try {
            const promoMsg = `
⚽ *PROMO HARI INI* ⚽

${await db.getPromoMessage()}

💡 *Cara Klaim:*
1. Follow channel @Bolapelangi2office_bot
2. Klik /promo untuk detail
3. Klaim via link di bawah

🚀 *GASPOLL TERUS!*
            `;
            
            await this.bot.telegram.sendMessage(
                process.env.CHANNEL_ID,
                promoMsg,
                { 
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '🔥 KLAIM PROMO', url: process.env.CLAIM_LINK }]
                        ]
                    }
                }
            );
            
            logger.info('✅ Daily promo sent');
            
        } catch (error) {
            logger.error('Failed to send daily promo:', error);
        }
    }

    async sendStatsUpdate() {
        try {
            const stats = await db.getBotStats();
            
            const statsMsg = `
📊 *UPDATE STATISTIK BOT*

👥 Total Pengguna: ${stats.total_users}
✨ Aktif 7 Hari: ${stats.active_users}
📨 Total Broadcast: ${stats.total_broadcasts}
💬 Interaksi Hari Ini: ${stats.today_interactions}

Terima kasih telah menggunakan bot kami! 🎉
            `;
            
            await this.bot.telegram.sendMessage(
                process.env.CHANNEL_ID,
                statsMsg,
                { parse_mode: 'Markdown' }
            );
            
        } catch (error) {
            logger.error('Failed to send stats update:', error);
        }
    }

    calculateNextRun(cronExpression) {
        // Simple implementation - untuk production pakai library cron-parser
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }
}

module.exports = new PostScheduler();
