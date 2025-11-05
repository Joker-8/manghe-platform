import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 为ES模块创建__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite数据库文件路径
const dbPath = path.join(__dirname, '../data/manghe.db');

// 确保data目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 数据库连接实例
let dbInstance = null;
let isConnected = false;

// 初始化数据库
async function initializeDatabase() {
  try {
    console.log('🔄 开始初始化SQLite数据库...');
    
    // 打开数据库连接
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log(`✅ SQLite数据库连接成功: ${dbPath}`);
    isConnected = true;
    
    // 创建必要的表
    await createTables();
    
    return true;
  } catch (error) {
    console.error('❌ SQLite数据库初始化失败:', error.message);
    isConnected = false;
    return false;
  }
}

// 创建数据库表
async function createTables() {
  try {
    // 用户表
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        points INTEGER DEFAULT 0,
        level TEXT DEFAULT '普通会员',
        followers INTEGER DEFAULT 0,
        following INTEGER DEFAULT 0,
        posts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 商品表（盲盒）
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        series TEXT NOT NULL,
        image TEXT DEFAULT NULL,
        price REAL NOT NULL,
        rating REAL DEFAULT 0.0,
        stock INTEGER DEFAULT 0,
        is_limited INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 0,
        rarity TEXT DEFAULT '普通',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // 订单表
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        total_price REAL NOT NULL,
        status TEXT DEFAULT '待付款',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
    
    // 收藏表
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        UNIQUE(user_id, product_id)
      );
    `);
    
    // 社区帖子表
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT DEFAULT NULL,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    
    console.log('✅ 数据库表创建完成');
  } catch (error) {
    console.error('❌ 创建数据库表失败:', error.message);
    throw error;
  }
}

// 数据库操作函数
async function executeQuery(sql, params = []) {
  if (!isConnected || !dbInstance) {
    throw new Error('数据库未连接');
  }
  
  try {
    const result = await dbInstance.all(sql, params);
    return result;
  } catch (error) {
    console.error('❌ SQLite查询执行失败:', error.message);
    throw error;
  }
}

// 执行插入操作
async function executeInsert(sql, params = []) {
  if (!isConnected || !dbInstance) {
    throw new Error('数据库未连接');
  }
  
  try {
    const result = await dbInstance.run(sql, params);
    return { insertId: result.lastID };
  } catch (error) {
    console.error('❌ SQLite插入操作失败:', error.message);
    throw error;
  }
}

// 执行更新操作
async function executeUpdate(sql, params = []) {
  if (!isConnected || !dbInstance) {
    throw new Error('数据库未连接');
  }
  
  try {
    const result = await dbInstance.run(sql, params);
    return { changedRows: result.changes };
  } catch (error) {
    console.error('❌ SQLite更新操作失败:', error.message);
    throw error;
  }
}

// 执行删除操作
async function executeDelete(sql, params = []) {
  if (!isConnected || !dbInstance) {
    throw new Error('数据库未连接');
  }
  
  try {
    const result = await dbInstance.run(sql, params);
    return { affectedRows: result.changes };
  } catch (error) {
    console.error('❌ SQLite删除操作失败:', error.message);
    throw error;
  }
}

// 关闭数据库连接
async function closeDatabase() {
  if (dbInstance) {
    try {
      await dbInstance.close();
      console.log('✅ SQLite数据库连接已关闭');
      isConnected = false;
      dbInstance = null;
    } catch (error) {
      console.error('❌ 关闭SQLite数据库连接失败:', error.message);
    }
  }
}

// 导出API
// 导出函数
export {
  initializeDatabase,
  executeQuery,
  executeInsert,
  executeUpdate,
  executeDelete,
  closeDatabase
};

// 导出变量和状态检查函数
export const getDb = () => dbInstance;
export const checkConnection = () => isConnected;