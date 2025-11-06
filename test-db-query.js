// 简单的数据库和API测试脚本
const fs = require('fs');
const path = require('path');

console.log('开始测试...');

// 检查数据库文件是否存在
function checkDatabaseFile() {
    const dbPath = path.join(__dirname, 'backend', 'data', 'manghe.db');
    console.log('\n检查数据库文件...');
    console.log('数据库路径:', dbPath);
    
    if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log('✅ 数据库文件存在');
        console.log('文件大小:', stats.size, '字节');
    } else {
        console.error('❌ 数据库文件不存在');
    }
    
    // 检查数据目录
    const dataDir = path.dirname(dbPath);
    if (fs.existsSync(dataDir)) {
        console.log('✅ 数据目录存在:', dataDir);
        const files = fs.readdirSync(dataDir);
        console.log('数据目录内容:', files);
    } else {
        console.error('❌ 数据目录不存在:', dataDir);
    }
}

// 分析订单详情API的SQL查询
function analyzeSqlQuery() {
    console.log('\n分析订单详情API的SQL查询...');
    
    // 从orders.js中提取的SQL查询
    const sql = 'SELECT o.*, p.name as product_name, p.image as product_image FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?';
    console.log('SQL查询:', sql);
    
    // 分析SQL查询可能的问题
    console.log('\nSQL查询分析:');
    console.log('- 使用JOIN连接orders和products表');
    console.log('- 条件是订单ID');
    console.log('- 可能的问题:');
    console.log('  1. 表结构不匹配');
    console.log('  2. JOIN条件错误');
    console.log('  3. 列名不存在');
    console.log('  4. 数据库中没有对应的订单');
}

// 运行测试
checkDatabaseFile();
analyzeSqlQuery();

console.log('\n测试完成');