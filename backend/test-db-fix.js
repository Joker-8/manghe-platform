// 详细测试脚本，用于验证database.js中的应急连接池修复是否有效
console.log('开始详细测试应急连接池修复...');

// 使用ES模块导入
import { testDatabaseConnection } from './utils/database.js';

// 测试testDatabaseConnection函数
console.log('\n1️⃣ 测试testDatabaseConnection函数...');
testDatabaseConnection().then(result => {
  console.log('✅ testDatabaseConnection调用成功，返回:', result);
  console.log('\n✅ 测试通过！应急连接池修复有效。');
}).catch(error => {
  console.error('❌ 测试失败:', error);
});

// 创建一个简单的HTTP测试服务器
import http from 'http';
import { once } from 'events';

console.log('\n2️⃣ 启动测试HTTP服务器...');
const server = http.createServer(async (req, res) => {
  if (req.url === '/test-db') {
    console.log('收到数据库测试请求');
    try {
      const result = await testDatabaseConnection();
      console.log('数据库测试结果:', result);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: '数据库连接测试通过' }));
    } catch (error) {
      console.error('数据库测试失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: '数据库连接测试失败' }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, message: 'Not found' }));
  }
});

server.listen(3010, () => {
  console.log('✅ 测试服务器运行在 http://localhost:3010');
  console.log('✅ 访问 http://localhost:3010/test-db 进行数据库连接测试');
});

// 优雅关闭
process.on('SIGINT', () => {
  server.close();
  console.log('\n测试服务器已关闭');
  process.exit(0);
});