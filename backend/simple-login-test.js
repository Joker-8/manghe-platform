// 简单登录测试脚本
// 直接使用http模块测试登录API，避免axios配置问题

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试配置
const testConfigs = [
  { port: 3001, path: '/api/auth/login' },
  { port: 3004, path: '/api/auth/login' },
  { port: 3001, path: '/login' },
  { port: 3004, path: '/login' },
  { port: 3001, path: '/api/auth/phone-login' },
  { port: 3004, path: '/api/auth/phone-login' },
  { port: 3001, path: '/phone-login' },
  { port: 3004, path: '/phone-login' }
];

const testCredentials = [
  { username: 'nonexistent_user_123', password: 'any_password_123' },
  { username: 'admin', password: 'admin123' },
  { phone: '13800138000', code: '123456' },
  { phone: '13900139000', code: '654321' }
];

// 检查users.json中的用户
function checkUsersJson() {
  console.log('\n🔍 检查users.json文件中的用户...');
  const usersJsonPath = path.join(__dirname, 'data', 'users.json');
  
  if (fs.existsSync(usersJsonPath)) {
    try {
      const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
      const usersArray = Array.isArray(usersData) ? usersData : Object.values(usersData);
      
      console.log(`✅ users.json包含 ${usersArray.length} 个用户:`);
      usersArray.forEach((user, index) => {
        console.log(`  ${index + 1}. 用户名: ${user.username || 'N/A'}`);
        console.log(`     邮箱: ${user.email || 'N/A'}`);
        console.log(`     密码类型: ${typeof user.password}, 密码长度: ${user.password?.length}`);
        console.log(`     ID: ${user.id || 'N/A'}`);
      });
    } catch (error) {
      console.error(`❌ 读取users.json失败: ${error.message}`);
    }
  } else {
    console.error(`❌ users.json不存在`);
  }
}

// 测试单个登录端点
function testLoginEndpoint(config, credentials) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: config.port,
      path: config.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          config,
          credentials,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        config,
        credentials,
        error: error.message
      });
    });

    req.write(JSON.stringify(credentials));
    req.end();
  });
}

// 运行所有测试
async function runTests() {
  console.log('🚀 开始简单登录测试');
  console.log('====================');
  
  // 检查用户数据
  checkUsersJson();
  
  // 测试所有端点和凭证组合
  const allTests = [];
  
  for (const config of testConfigs) {
    for (const credentials of testCredentials) {
      allTests.push(testLoginEndpoint(config, credentials));
    }
  }
  
  const results = await Promise.all(allTests);
  
  // 显示结果
  console.log('\n📊 测试结果');
  console.log('====================');
  
  for (const result of results) {
    const endpoint = `http://localhost:${result.config.port}${result.config.path}`;
    const userInfo = `用户名: ${result.credentials.username}`;
    
    if (result.error) {
      console.log(`❌ 连接失败: ${endpoint}`);
      console.log(`   ${userInfo}`);
      console.log(`   错误: ${result.error}`);
    } else {
      console.log(`📡 ${endpoint}`);
      console.log(`   ${userInfo}`);
      console.log(`   状态码: ${result.statusCode}`);
      try {
        const parsedBody = JSON.parse(result.body);
        console.log(`   响应:`, parsedBody);
        
        // 检查是否存在安全漏洞
        if (result.statusCode === 200 && parsedBody.success === true) {
          console.log(`   ⚠️  安全警告: 登录成功，但这可能是漏洞`);
        } else {
          console.log(`   ✅ 安全: 登录被正确处理`);
        }
      } catch (e) {
        console.log(`   响应体: ${result.body}`);
      }
    }
    console.log();
  }
  
  // 提供建议
  console.log('💡 分析和建议');
  console.log('====================');
  console.log('1. 检查哪些端口和路径实际响应了请求');
  console.log('2. 查看响应状态码和内容来判断认证逻辑');
  console.log('3. 如有成功登录的未注册用户，说明存在严重安全漏洞');
  console.log('4. 检查系统中是否有多个服务实例在运行');
}

// 运行测试
runTests().catch(err => {
  console.error('测试过程中发生错误:', err);
});