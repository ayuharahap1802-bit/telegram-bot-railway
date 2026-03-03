const { Pool } = require('pg');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        this.init();
    }

    async init() {
        try {
            await this.createTables();
            await this.createSuperAdmins();
            await this.initFeatureFlags();
            logger.info('✅ Database initialized');
        } catch (error) {
            logger.error('Database init error:', error);
        }
    }

    async createTables() {
        const queries = `
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                username VARCHAR(255),
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                phone_number VARCHAR(50),
                role VARCHAR(50) DEFAULT 'USER',
                language VARCHAR(10) DEFAULT 'id',
                is_active BOOLEAN DEFAULT true,
                is_blocked BOOLEAN DEFAULT false,
                last_active TIMESTAMP,
                joined_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Admins table
            CREATE TABLE IF NOT EXISTS admins (
                id BIGINT PRIMARY KEY,
                user_id BIGINT UNIQUE REFERENCES users(id),
                role VARCHAR(50) DEFAULT 'ADMIN',
                permissions TEXT[],
                created_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Interactions table
            CREATE TABLE IF NOT EXISTS interactions (
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                type VARCHAR(50),
                command VARCHAR(255),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Broadcasts table
            CREATE TABLE IF NOT EXISTS broadcasts (
                id SERIAL PRIMARY KEY,
                message TEXT,
                type VARCHAR(50) DEFAULT 'INSTANT',
                status VARCHAR(50) DEFAULT 'PENDING',
                scheduled_at TIMESTAMP,
                executed_at TIMESTAMP,
                created_by BIGINT REFERENCES users(id),
                total_recipients INT DEFAULT 0,
                sent_count INT DEFAULT 0,
                failed_count INT DEFAULT 0,
                filters JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                completed_at TIMESTAMP
            );

            -- Scheduled posts table
            CREATE TABLE IF NOT EXISTS scheduled_posts (
                id SERIAL PRIMARY KEY,
                content TEXT,
                cron VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                last_run TIMESTAMP,
                next_run TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Templates table
            CREATE TABLE IF NOT EXISTS templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE,
                content TEXT,
                category VARCHAR(100),
                created_by BIGINT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Quick replies table
            CREATE TABLE IF NOT EXISTS quick_replies (
                id SERIAL PRIMARY KEY,
                keyword VARCHAR(255) UNIQUE,
                response TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Activity logs table
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                admin_id BIGINT REFERENCES users(id),
                admin_name VARCHAR(255),
                action VARCHAR(255),
                metadata JSONB,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Feature flags table
            CREATE TABLE IF NOT EXISTS feature_flags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE,
                enabled BOOLEAN DEFAULT false,
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Settings table
            CREATE TABLE IF NOT EXISTS settings (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT,
                description TEXT,
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Promo messages table
            CREATE TABLE IF NOT EXISTS promo_messages (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255),
                content TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `;
        
        await this.pool.query(queries);
    }

    async createSuperAdmins() {
        // Super Admin 1: @bolapelangi_2 (8122523608)
        await this.pool.query(`
            INSERT INTO users (id, username, first_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET role = $4
        `, [8122523608, 'bolapelangi_2', 'Super Admin 1', 'SUPER_ADMIN', true]);

        await this.pool.query(`
            INSERT INTO admins (id, user_id, role, permissions)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET role = $3, permissions = $4
        `, [8122523608, 8122523608, 'SUPER_ADMIN', ['manage_admin', 'manage_users', 'can_broadcast', 'manage_posts', 'view_stats', 'manage_settings', 'backup', 'view_logs']]);

        // Super Admin 2: @Bolapelangi2 (947482209)
        await this.pool.query(`
            INSERT INTO users (id, username, first_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET role = $4
        `, [947482209, 'Bolapelangi2', 'Super Admin 2', 'SUPER_ADMIN', true]);

        await this.pool.query(`
            INSERT INTO admins (id, user_id, role, permissions)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO UPDATE SET role = $3, permissions = $4
        `, [947482209, 947482209, 'SUPER_ADMIN', ['manage_admin', 'manage_users', 'can_broadcast', 'manage_posts', 'view_stats', 'manage_settings', 'backup', 'view_logs']]);
    }

    async initFeatureFlags() {
        const flags = [
            ['auto_welcome', true, 'Auto welcome untuk member baru'],
            ['broadcast_enabled', true, 'Fitur broadcast'],
            ['stats_enabled', true, 'Fitur statistik'],
            ['quick_replies', true, 'Balasan cepat untuk kata kunci'],
            ['scheduled_posts', true, 'Posting terjadwal'],
            ['promo_messages', true, 'Pesan promo']
        ];

        for (const [name, enabled, description] of flags) {
            await this.pool.query(`
                INSERT INTO feature_flags (name, enabled, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (name) DO NOTHING
            `, [name, enabled, description]);
        }
    }

    // User methods
    async getOrCreateUser(telegramUser) {
        const result = await this.pool.query(`
            INSERT INTO users (id, username, first_name, last_name, language, last_active)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (id) DO UPDATE SET
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                last_active = NOW(),
                updated_at = NOW()
            RETURNING *
        `, [telegramUser.id, telegramUser.username, telegramUser.first_name, telegramUser.last_name, telegramUser.language_code || 'id']);
        
        return result.rows[0];
    }

    async getUser(userId) {
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        return result.rows[0];
    }

    async updateUserActivity(userId) {
        await this.pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [userId]);
    }

    async isUserBlocked(userId) {
        const result = await this.pool.query('SELECT is_blocked FROM users WHERE id = $1', [userId]);
        return result.rows[0]?.is_blocked || false;
    }

    async getUsers(limit, offset) {
        const result = await this.pool.query(`
            SELECT * FROM users 
            ORDER BY joined_at DESC 
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        return result.rows;
    }

    async getTotalUsers() {
        const result = await this.pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
        return parseInt(result.rows[0].count);
    }

    // Admin methods
    async isAdmin(userId) {
        const result = await this.pool.query(`
            SELECT * FROM admins WHERE user_id = $1
        `, [userId]);
        return result.rows.length > 0;
    }

    async isSuperAdmin(userId) {
        const result = await this.pool.query(`
            SELECT * FROM admins WHERE user_id = $1 AND role = 'SUPER_ADMIN'
        `, [userId]);
        return result.rows.length > 0;
    }

    async getAdminInfo(userId) {
        const result = await this.pool.query(`
            SELECT a.*, u.username, u.first_name 
            FROM admins a
            JOIN users u ON u.id = a.user_id
            WHERE a.user_id = $1
        `, [userId]);
        return result.rows[0];
    }

    async getAllAdmins() {
        const result = await this.pool.query(`
            SELECT u.*, a.role, a.permissions
            FROM admins a
            JOIN users u ON u.id = a.user_id
            ORDER BY a.created_at DESC
        `);
        return result.rows;
    }

    async checkPermission(userId, permission) {
        const result = await this.pool.query(`
            SELECT permissions FROM admins WHERE user_id = $1
        `, [userId]);
        
        const admin = result.rows[0];
        if (!admin) return false;
        
        // Super admin has all permissions
        if (admin.role === 'SUPER_ADMIN') return true;
        
        return admin.permissions?.includes(permission) || false;
    }

    // Interaction methods
    async logInteraction(userId, type, metadata = {}) {
        await this.pool.query(`
            INSERT INTO interactions (user_id, type, metadata)
            VALUES ($1, $2, $3)
        `, [userId, type, JSON.stringify(metadata)]);
    }

    async getUserStats(userId) {
        const result = await this.pool.query(`
            SELECT 
                COUNT(*) as total_interactions,
                COUNT(CASE WHEN type = 'COMMAND' THEN 1 END) as commands_used,
                COUNT(CASE WHEN type = 'JOIN_CHANNEL' THEN 1 END) as joined_channel
            FROM interactions
            WHERE user_id = $1
        `, [userId]);
        return result.rows[0];
    }

    // Broadcast methods
    async processBroadcast(message, adminId) {
        const total = await this.getTotalUsers();
        
        // Simpan broadcast
        await this.pool.query(`
            INSERT INTO broadcasts (message, status, created_by, total_recipients)
            VALUES ($1, 'PROCESSING', $2, $3)
        `, [message, adminId, total]);
        
        // Simulasi proses broadcast (di sini nanti pakai queue)
        // Untuk sementara kita return dummy
        return {
            total,
            sent: Math.floor(total * 0.95),
            failed: Math.floor(total * 0.05),
            time: 5
        };
    }

    async getActiveBroadcasts() {
        const result = await this.pool.query(`
            SELECT COUNT(*) FROM broadcasts WHERE status = 'PROCESSING'
        `);
        return parseInt(result.rows[0].count);
    }

    // Scheduled posts methods
    async getScheduledPosts() {
        const result = await this.pool.query(`
            SELECT * FROM scheduled_posts 
            WHERE is_active = true 
            ORDER BY next_run ASC
        `);
        return result.rows;
    }

    async getNextScheduledPosts() {
        const result = await this.pool.query(`
            SELECT * FROM scheduled_posts 
            WHERE is_active = true 
            AND (next_run <= NOW() OR next_run IS NULL)
            ORDER BY created_at ASC
        `);
        return result.rows;
    }

    async updatePostRunTime(postId, nextRun) {
        await this.pool.query(`
            UPDATE scheduled_posts 
            SET last_run = NOW(), next_run = $2, updated_at = NOW()
            WHERE id = $1
        `, [postId, nextRun]);
    }

    // Quick replies methods
    async getQuickReply(keyword) {
        const result = await this.pool.query(`
            SELECT * FROM quick_replies 
            WHERE keyword ILIKE $1 AND is_active = true
        `, [`%${keyword}%`]);
        return result.rows[0];
    }

    // Templates methods
    async getTemplates() {
        const result = await this.pool.query('SELECT * FROM templates ORDER BY name');
        return result.rows;
    }

    async getTemplate(name) {
        const result = await this.pool.query('SELECT * FROM templates WHERE name = $1', [name]);
        return result.rows[0];
    }

    // Bot stats methods
    async getBotStats() {
        const totalUsers = await this.getTotalUsers();
        
        const activeUsers = await this.pool.query(`
            SELECT COUNT(*) FROM users 
            WHERE last_active > NOW() - INTERVAL '7 days'
        `);
        
        const totalBroadcasts = await this.pool.query(`
            SELECT COUNT(*) FROM broadcasts
        `);
        
        const todayInteractions = await this.pool.query(`
            SELECT COUNT(*) FROM interactions 
            WHERE created_at > NOW() - INTERVAL '1 day'
        `);
        
        return {
            total_users: totalUsers,
            active_users: parseInt(activeUsers.rows[0].count),
            total_broadcasts: parseInt(totalBroadcasts.rows[0].count),
            today_interactions: parseInt(todayInteractions.rows[0].count)
        };
    }

    // Feature flags methods
    async getFeatureFlag(name) {
        const result = await this.pool.query(`
            SELECT enabled FROM feature_flags WHERE name = $1
        `, [name]);
        return result.rows[0]?.enabled || false;
    }

    // Settings methods
    async getSettings() {
        const result = await this.pool.query('SELECT * FROM settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }

    // Promo methods
    async getPromoMessage() {
        const result = await this.pool.query(`
            SELECT content FROM promo_messages 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        return result.rows[0]?.content || process.env.PROMO_MESSAGE || 'Promo sedang tidak tersedia';
    }

    // Activity logs methods
    async getActivityLogs(days = 1) {
        const result = await this.pool.query(`
            SELECT * FROM activity_logs 
            WHERE created_at > NOW() - INTERVAL '${days} days'
            ORDER BY created_at DESC
        `);
        return result.rows;
    }

    async logActivity(adminId, adminName, action, metadata = {}) {
        await this.pool.query(`
            INSERT INTO activity_logs (admin_id, admin_name, action, metadata)
            VALUES ($1, $2, $3, $4)
        `, [adminId, adminName, action, JSON.stringify(metadata)]);
    }

    // Test connection
    async testConnection() {
        await this.pool.query('SELECT 1');
    }
}

module.exports = new Database();
