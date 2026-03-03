-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    is_banned BOOLEAN DEFAULT 0,
    ban_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME
);

-- User activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    metadata TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    targets TEXT,
    status TEXT,
    total_sent INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    scheduled_for DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Promo claims table
CREATE TABLE IF NOT EXISTS promo_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER,
    claim_date DATE,
    status TEXT DEFAULT 'pending',
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    message TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Banned users table
CREATE TABLE IF NOT EXISTS banned_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    reason TEXT,
    banned_by INTEGER,
    banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (banned_by) REFERENCES users(id)
);

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    enabled BOOLEAN DEFAULT 0,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Channel targets table
CREATE TABLE IF NOT EXISTS channel_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT UNIQUE,
    channel_name TEXT,
    channel_type TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_claims_user_date ON promo_claims(user_id, claim_date);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
