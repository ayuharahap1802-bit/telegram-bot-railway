const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seed() {
    try {
        // Insert super admins
        await pool.query(`
            INSERT INTO users (id, username, first_name, role, is_active)
            VALUES 
                (8122523608, 'bolapelangi_2', 'Super Admin 1', 'SUPER_ADMIN', true),
                (947482209, 'Bolapelangi2', 'Super Admin 2', 'SUPER_ADMIN', true)
            ON CONFLICT (id) DO NOTHING;
        `);

        // Insert admins
        await pool.query(`
            INSERT INTO admins (id, user_id, role, permissions)
            VALUES 
                (8122523608, 8122523608, 'SUPER_ADMIN', ARRAY['manage_admin', 'manage_users', 'can_broadcast', 'manage_posts', 'view_stats', 'manage_settings', 'backup', 'view_logs']),
                (947482209, 947482209, 'SUPER_ADMIN', ARRAY['manage_admin', 'manage_users', 'can_broadcast', 'manage_posts', 'view_stats', 'manage_settings', 'backup', 'view_logs'])
            ON CONFLICT (id) DO NOTHING;
        `);

        // Insert feature flags
        const flags = [
            ['auto_welcome', true, 'Auto welcome untuk member baru'],
            ['broadcast_enabled', true, 'Fitur broadcast'],
            ['stats_enabled', true, 'Fitur statistik'],
            ['quick_replies', true, 'Balasan cepat untuk kata kunci'],
            ['scheduled_posts', true, 'Posting terjadwal'],
            ['promo_messages', true, 'Pesan promo']
        ];

        for (const [name, enabled, description] of flags) {
            await pool.query(`
                INSERT INTO feature_flags (name, enabled, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (name) DO NOTHING
            `, [name, enabled, description]);
        }

        // Insert promo message
        await pool.query(`
            INSERT INTO promo_messages (title, content, is_active)
            VALUES ('Promo Cashback 100%', $1, true)
            ON CONFLICT DO NOTHING
        `, [`
⚽ PROMO GILA! CASHBACK 100% MIX PARLAY ⚽
Satu Tim Meleset? Modal Kami Balikin Utuh!

📋 SYARAT:
• Bet: Min Rp 10.000
• Tim: Min 5 tim (TODAY)
• Odds: Min 1.80/tim
• Provider: Sport 1/2

💡 ATURAN:
• 1 tim Lose Full
• Sisanya Win Full
• Max Rp 300.000/hari

⚠️ WAJIB FOLLOW:
🤖 Bot: @Bolapelangi2office_bot
📈 Prediksi: https://bopel2.vip/ChannelWA-Jadwal-Prediksi
📢 Channel WA: https://bopel2.vip/Channel-Whatsapp
📢 Channel TG: https://bopel2.vip/Channel-Telegram
🟢 Klaim: https://bopel2.link/wa

📌 Catatan: 1x/hari, no IP sama, no safety bet
🚀 GASPOLL TERUS BOSKU!
`]);

        // Insert quick replies
        const replies = [
            ['promo', 'Ketik /promo untuk melihat promo terbaru!'],
            ['harga', 'Untuk info harga dan betting, silakan hubungi admin.'],
            ['daftar', 'Cara daftar: 1. Follow bot, 2. Klik /start, 3. Ikuti petunjuk.'],
            ['bantuan', 'Ketik /help untuk bantuan.'],
            ['admin', 'Hubungi admin: @bolapelangi_2 atau @Bolapelangi2']
        ];

        for (const [keyword, response] of replies) {
            await pool.query(`
                INSERT INTO quick_replies (keyword, response, is_active)
                VALUES ($1, $2, true)
                ON CONFLICT (keyword) DO NOTHING
            `, [keyword, response]);
        }

        // Insert settings
        const settings = [
            ['bot_name', 'Bola Pelangi Official Bot'],
            ['welcome_message', 'Selamat datang di bot official!'],
            ['max_broadcast_per_day', '10'],
            ['broadcast_rate_limit', '20'],
            ['timezone', 'Asia/Jakarta']
        ];

        for (const [key, value] of settings) {
            await pool.query(`
                INSERT INTO settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING
            `, [key, value]);
        }

        console.log('✅ Seed data inserted successfully');
    } catch (error) {
        console.error('❌ Seed error:', error);
    } finally {
        await pool.end();
    }
}

seed();
