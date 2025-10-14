-- 盲盒销售与收藏平台数据库初始化脚本

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS manghe_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE manghe_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    points INT DEFAULT 0,
    level VARCHAR(20) DEFAULT '普通会员',
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    posts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 商品表（盲盒）
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    series VARCHAR(50) NOT NULL,
    image VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    stock INT DEFAULT 0,
    is_limited BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    rarity VARCHAR(20) DEFAULT '普通',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT '待付款',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_collections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_collection (user_id, product_id)
);

-- 社区动态表
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image VARCHAR(255) DEFAULT NULL,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 插入测试数据
-- 插入用户数据
INSERT INTO users (username, email, password, points, level) VALUES 
('testuser1', 'test1@example.com', '$2a$10$eFm7Z6lqF5yBc5vY5tX6hu5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 1000, '普通会员'),
('testuser2', 'test2@example.com', '$2a$10$eFm7Z6lqF5yBc5vY5tX6hu5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 2000, '黄金会员');

-- 插入盲盒数据
INSERT INTO products (name, series, image, price, rating, stock, is_limited, is_new, rarity) VALUES 
('星空幻想 - 银河守护者', '星空幻想系列', 'https://via.placeholder.com/300x300/6B21A8/FFFFFF?text=星空幻想', 89.00, 4.8, 156, TRUE, TRUE, '稀有'),
('森林物语 - 精灵使者', '森林物语系列', 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=森林物语', 79.00, 4.6, 200, FALSE, TRUE, '普通'),
('海洋奇缘 - 深海勇士', '海洋奇缘系列', 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=海洋奇缘', 99.00, 4.9, 100, TRUE, FALSE, '史诗'),
('城市探险 - 都市达人', '城市探险系列', 'https://via.placeholder.com/300x300/6366F1/FFFFFF?text=城市探险', 69.00, 4.5, 300, FALSE, FALSE, '普通');