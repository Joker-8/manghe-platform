-- 初始化数据库表结构

-- 1. 用户表（保持现有结构）
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(11) UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar TEXT,
    points INTEGER DEFAULT 0,
    level VARCHAR(20) DEFAULT '普通会员',
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    posts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    user_agent TEXT,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active'
);

-- 创建用户表索引
CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_phone ON users(phone);

-- 2. 验证码表（新增）
CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(11) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    sent_count INTEGER DEFAULT 0,
    last_sent_at BIGINT DEFAULT 0,
    user_agent TEXT,
    ip_address TEXT,
    status VARCHAR(20) DEFAULT 'pending'
);

-- 创建验证码表索引
CREATE INDEX IF NOT EXISTS idx_verification_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_codes(status);

-- 3. 用户收藏表
CREATE TABLE IF NOT EXISTS user_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    item_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建用户收藏表索引
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_item ON user_collections(item_id, item_type);

-- 4. 用户关注关系表
CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_user_id INTEGER NOT NULL,
    followed_user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (followed_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_user_id, followed_user_id)
);

-- 创建用户关注关系表索引
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON user_follows(followed_user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_both ON user_follows(follower_user_id, followed_user_id);

-- 5. 验证码记录清理触发器
CREATE TRIGGER IF NOT EXISTS clean_expired_verification_codes
AFTER INSERT ON verification_codes
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < (strftime('%s', 'now') * 1000 - 24 * 60 * 60 * 1000);
END;

-- 6. 用户更新触发器
CREATE TRIGGER IF NOT EXISTS update_user_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 7. 初始化管理员用户（可选）
INSERT OR IGNORE INTO users (username, email, password, role, points, level)
VALUES ('admin', 'admin@example.com', '$2a$10$e1JzVrUYcKpN8V0Z1f6dM.5E0I9e3y5h7L7m8T9b6x9c8v7f6d5s4', 'admin', 10000, '管理员');