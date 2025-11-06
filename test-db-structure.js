// 简单的数据库结构检查脚本
const fs = require('fs');
const path = require('path');

console.log('开始检查数据库结构...');

// 检查数据库文件
const dbPath = path.join(__dirname, 'backend', 'data', 'manghe.db');
console.log('数据库文件:', dbPath);
console.log('文件是否存在:', fs.existsSync(dbPath));

// 检查数据库初始化脚本
const initSqlPath = path.join(__dirname, 'backend', 'utils', 'database-init.sql');
console.log('\n数据库初始化脚本:', initSqlPath);
console.log('初始化脚本是否存在:', fs.existsSync(initSqlPath));

// 从关键技术文档中提取的表结构信息
console.log('\n从文档中提取的表结构信息:');
console.log('1. orders表应包含的字段:');
console.log('   - id (INTEGER PRIMARY KEY AUTOINCREMENT)');
console.log('   - user_id (INTEGER NOT NULL)');
console.log('   - items (TEXT NOT NULL) - JSON格式存储商品信息');
console.log('   - total_amount (REAL NOT NULL)');
console.log('   - status (TEXT DEFAULT \'pending\')');
console.log('   - 其他字段...');

console.log('\n2. 注意事项:');
console.log('   - orders表使用items字段(JSON)存储商品，而不是product_id字段');
console.log('   - 数据库初始化脚本可能没有创建orders表');
console.log('   - 可能需要手动创建缺失的表');

// 建议的解决方案
console.log('\n建议解决方案:');
console.log('1. 创建orders表');
console.log('2. 修改API以正确处理JSON格式的items字段');

console.log('\n检查完成');