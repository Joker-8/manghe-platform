import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function initTestUser() {
  try {
    console.log('开始初始化测试用户...');
    
    // 打开数据库连接
    const db = await open({
      filename: './data/manghe.db',
      driver: sqlite3.Database
    });
    
    // 检查用户表结构
    console.log('检查用户表结构...');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('数据库中的表:', tables.map(table => table.name));
    
    // 检查users表的列
    const columns = await db.all("PRAGMA table_info(users)");
    console.log('users表的列:', columns.map(col => col.name));
    
    // 尝试删除现有的测试用户
    try {
      await db.run("DELETE FROM users WHERE username = ?", ['testuser']);
      console.log('已删除旧的测试用户（如果存在）');
    } catch (deleteError) {
      console.log('删除测试用户失败（可能不存在）:', deleteError.message);
    }
    
    // 插入测试用户
    console.log('插入测试用户...');
    try {
      await db.run(
        "INSERT INTO users (username, password, email, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        ['testuser', 'password123', 'test@example.com']
      );
      console.log('测试用户插入成功！');
      console.log('用户名: testuser');
      console.log('密码: password123');
    } catch (insertError) {
      console.error('插入测试用户失败:', insertError.message);
    }
    
    // 验证用户是否存在
    const user = await db.get("SELECT * FROM users WHERE username = ?", ['testuser']);
    if (user) {
      console.log('验证成功！测试用户已存在于数据库中');
      console.log('用户信息:', {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      });
    } else {
      console.error('验证失败！测试用户不存在');
    }
    
    await db.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('初始化测试用户时发生错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行初始化函数
initTestUser();