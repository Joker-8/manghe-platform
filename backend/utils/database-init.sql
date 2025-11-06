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

-- 8. 商品表
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    original_price REAL DEFAULT 0,
    category TEXT DEFAULT '',
    series TEXT DEFAULT '',
    brand TEXT DEFAULT '',
    stock INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    images TEXT DEFAULT '[]',
    is_hot INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    is_limited INTEGER DEFAULT 0,
    probability TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建商品表索引
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_series ON products(series);
CREATE INDEX IF NOT EXISTS idx_products_is_hot ON products(is_hot);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);

-- 9. 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    items TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT '',
    payment_id TEXT DEFAULT '',
    shipping_address TEXT DEFAULT '{}',
    tracking_number TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    paid_at TEXT,
    shipped_at TEXT,
    delivered_at TEXT,
    cancelled_at TEXT,
    cancellation_reason TEXT DEFAULT '',
    -- 在创建表时直接添加外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建订单表索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 10. 初始化测试数据
-- 插入测试商品
INSERT OR IGNORE INTO products (name, description, price, stock, category, series)
VALUES 
('星空幻想系列', '限量版星空主题盲盒', 89, 100, '主题盲盒', '星空系列'),
('森林物语系列', '季节限定森林主题', 79, 50, '主题盲盒', '森林系列'),
('海洋奇缘系列', '特别版海洋主题', 99, 30, '主题盲盒', '海洋系列');

-- 插入测试订单
INSERT OR IGNORE INTO orders (user_id, items, total_amount, status)
VALUES 
(1, '{"items": [{"id": 1, "name": "星空幻想系列", "quantity": 1, "price": 89}]}', 89, 'pending'),
(1, '{"items": [{"id": 2, "name": "森林物语系列", "quantity": 2, "price": 158}]}', 158, 'paid');