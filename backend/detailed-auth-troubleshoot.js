// 详细的认证问题排查脚本
// 测试完整的注册登录流程，检查数据持久化和验证逻辑

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// 获取当前目录（ES模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const API_BASE_URL = 'http://localhost:3001/api/auth';
const TEST_USERNAME = `test_user_${Date.now()}`;
const TEST_EMAIL = `test_email_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_PHONE = `138${Math.floor(Math.random() * 100000000)}`;

// 数据库文件路径
const USERS_JSON_PATH = path.join(__dirname, 'data', 'users.json');
const SQLITE_DB_PATH = path.join(__dirname, 'data', 'manghe.db');

console.log('🔍 开始详细认证问题排查');
console.log('======================');

// 步骤1: 检查数据库文件是否存在
async function checkDatabaseFiles() {
  console.log('\n📁 检查数据库文件...');
  
  // 检查users.json
  if (fs.existsSync(USERS_JSON_PATH)) {
    const usersJsonSize = fs.statSync(USERS_JSON_PATH).size;
    console.log(`✅ users.json 存在 (大小: ${usersJsonSize} 字节)`);
    
    try {
      const usersData = JSON.parse(fs.readFileSync(USERS_JSON_PATH, 'utf8'));
      console.log(`✅ users.json 内容可读 (用户数量: ${Array.isArray(usersData) ? usersData.length : Object.keys(usersData).length})`);
    } catch (error) {
      console.error(`❌ users.json 内容解析失败: ${error.message}`);
    }
  } else {
    console.error(`❌ users.json 不存在: ${USERS_JSON_PATH}`);
  }
  
  // 检查SQLite数据库
  if (fs.existsSync(SQLITE_DB_PATH)) {
    const sqliteDbSize = fs.statSync(SQLITE_DB_PATH).size;
    console.log(`✅ SQLite数据库存在 (大小: ${sqliteDbSize} 字节)`);
  } else {
    console.error(`❌ SQLite数据库不存在: ${SQLITE_DB_PATH}`);
  }
}

// 步骤2: 检查未注册用户登录
async function testUnregisteredLogin() {
  console.log('\n🔐 测试未注册用户登录...');
  
  const randomUsername = `random_user_${Date.now()}`;
  const randomPassword = 'RandomPassword123!';
  
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      username: randomUsername,
      password: randomPassword
    });
    
    console.error(`❌ 严重漏洞: 未注册用户 ${randomUsername} 成功登录!`);
    console.error(`❌ 返回数据:`, response.data);
    return { success: false, user: null };
  } catch (error) {
    if (error.response) {
      console.log(`✅ 未注册用户登录被拒绝，状态码: ${error.response.status}`);
      console.log(`✅ 响应信息:`, error.response.data);
      return { success: true, user: null };
    } else if (error.request) {
      console.error(`❌ 请求已发送但无响应:`, error.request);
      return { success: false, user: null };
    } else {
      console.error(`❌ 请求配置错误: ${error.message}`);
      return { success: false, user: null };
    }
  }
}

// 步骤3: 测试用户注册
async function testUserRegistration() {
  console.log('\n📝 测试用户注册...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log(`✅ 注册成功，状态码: ${response.status}`);
    console.log(`✅ 返回数据:`, response.data);
    return { success: true, user: response.data };
  } catch (error) {
    if (error.response) {
      console.error(`❌ 注册失败，状态码: ${error.response.status}`);
      console.error(`❌ 响应信息:`, error.response.data);
    } else if (error.request) {
      console.error(`❌ 请求已发送但无响应:`, error.request);
    } else {
      console.error(`❌ 请求配置错误: ${error.message}`);
    }
    return { success: false, user: null };
  }
}

// 步骤4: 检查用户是否成功保存到数据库
async function checkUserInDatabase() {
  console.log('\n🔍 检查用户是否保存到数据库...');
  
  try {
    if (fs.existsSync(USERS_JSON_PATH)) {
      const usersData = JSON.parse(fs.readFileSync(USERS_JSON_PATH, 'utf8'));
      const usersArray = Array.isArray(usersData) ? usersData : Object.values(usersData);
      
      const foundUser = usersArray.find(
        user => user.username === TEST_USERNAME || user.email === TEST_EMAIL
      );
      
      if (foundUser) {
        console.log(`✅ 在users.json中找到用户: ${foundUser.username}`);
        console.log(`✅ 用户ID: ${foundUser.id}`);
        console.log(`✅ 用户邮箱: ${foundUser.email}`);
        console.log(`✅ 密码存储格式: ${typeof foundUser.password} (长度: ${foundUser.password.length})`);
        return true;
      } else {
        console.error(`❌ 在users.json中未找到用户: ${TEST_USERNAME}`);
        console.error('当前数据库中的用户:');
        usersArray.slice(0, 5).forEach(user => {
          console.log(`  - ${user.username || user.email}`);
        });
        if (usersArray.length > 5) {
          console.log(`  ... 等${usersArray.length - 5}个更多用户`);
        }
        return false;
      }
    } else {
      console.error(`❌ 无法检查数据库: users.json不存在`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 数据库检查失败: ${error.message}`);
    return false;
  }
}

// 步骤5: 测试已注册用户登录
async function testRegisteredLogin() {
  console.log('\n🔐 测试已注册用户登录...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    console.log(`✅ 登录成功，状态码: ${response.status}`);
    console.log(`✅ 返回数据:`, response.data);
    return { success: true, user: response.data };
  } catch (error) {
    if (error.response) {
      console.error(`❌ 登录失败，状态码: ${error.response.status}`);
      console.error(`❌ 响应信息:`, error.response.data);
    } else if (error.request) {
      console.error(`❌ 请求已发送但无响应:`, error.request);
    } else {
      console.error(`❌ 请求配置错误: ${error.message}`);
    }
    return { success: false, user: null };
  }
}

// 步骤6: 测试错误密码登录
async function testWrongPasswordLogin() {
  console.log('\n🔐 测试错误密码登录...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      username: TEST_USERNAME,
      password: 'WrongPassword123!'
    });
    
    console.error(`❌ 严重漏洞: 使用错误密码成功登录!`);
    console.error(`❌ 返回数据:`, response.data);
    return { success: false };
  } catch (error) {
    if (error.response) {
      console.log(`✅ 错误密码登录被拒绝，状态码: ${error.response.status}`);
      console.log(`✅ 响应信息:`, error.response.data);
      return { success: true };
    } else if (error.request) {
      console.error(`❌ 请求已发送但无响应:`, error.request);
      return { success: false };
    } else {
      console.error(`❌ 请求配置错误: ${error.message}`);
      return { success: false };
    }
  }
}

// 步骤7: 检查登录逻辑的核心文件
async function inspectLoginLogic() {
  console.log('\n🔍 检查登录逻辑核心文件...');
  
  const authFilePath = path.join(__dirname, 'routes', 'auth.js');
  
  if (fs.existsSync(authFilePath)) {
    console.log(`✅ 找到了auth.js: ${authFilePath}`);
    
    try {
      const authFileContent = fs.readFileSync(authFilePath, 'utf8');
      
      // 检查我们之前的修复是否还在
      const fixPattern = /persistenceManager && persistenceManager.db && typeof persistenceManager.db.execute === 'function'/;
      if (fixPattern.test(authFileContent)) {
        console.log(`✅ 之前的修复仍然存在`);
      } else {
        console.error(`❌ 之前的修复不存在!`);
      }
      
      // 检查登录逻辑
      const loginRoutePattern = /\/login/;
      const passwordCheckPattern = /bcrypt|password|compare/;
      
      if (loginRoutePattern.test(authFileContent) && passwordCheckPattern.test(authFileContent)) {
        console.log(`✅ 检测到登录路由和密码验证逻辑`);
      } else {
        console.error(`❌ 未检测到完整的登录逻辑`);
      }
    } catch (error) {
      console.error(`❌ 读取auth.js失败: ${error.message}`);
    }
  } else {
    console.error(`❌ auth.js不存在: ${authFilePath}`);
  }
}

// 主函数
async function runTroubleshooting() {
  try {
    // 执行所有测试步骤
    await checkDatabaseFiles();
    const unregisteredLoginResult = await testUnregisteredLogin();
    const registrationResult = await testUserRegistration();
    const userInDatabase = await checkUserInDatabase();
    const registeredLoginResult = await testRegisteredLogin();
    const wrongPasswordResult = await testWrongPasswordLogin();
    await inspectLoginLogic();
    
    // 总结报告
    console.log('\n\n📊 认证问题排查报告');
    console.log('====================');
    console.log(`未注册用户登录测试: ${unregisteredLoginResult.success ? '✅ 正常' : '❌ 存在漏洞'}`);
    console.log(`用户注册测试: ${registrationResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`用户数据持久化: ${userInDatabase ? '✅ 正常' : '❌ 存在问题'}`);
    console.log(`已注册用户登录: ${registeredLoginResult.success ? '✅ 正常' : '❌ 失败'}`);
    console.log(`错误密码验证: ${wrongPasswordResult.success ? '✅ 正常' : '❌ 存在漏洞'}`);
    
    // 分析可能的问题原因
    console.log('\n🔍 可能的问题原因分析');
    console.log('-------------------');
    
    if (!unregisteredLoginResult.success) {
      console.log('1. 登录逻辑可能存在短路或默认允许通过的情况');
      console.log('2. 数据库查询可能总是返回成功，无论用户是否存在');
      console.log('3. 密码验证逻辑可能被跳过或总是返回true');
      console.log('4. 可能存在降级模式下的安全漏洞');
    }
    
    if (!userInDatabase) {
      console.log('5. 用户注册后数据可能没有正确持久化到数据库');
      console.log('6. 注册和登录可能使用了不同的数据源');
    }
    
    console.log('\n💡 建议检查:');
    console.log('1. auth.js中的登录逻辑，特别是用户验证部分');
    console.log('2. 数据库连接和查询逻辑');
    console.log('3. 错误处理和降级模式的实现');
    console.log('4. 确保所有认证检查都有适当的条件验证');
    
  } catch (error) {
    console.error('\n❌ 排查过程中发生错误:', error.message);
    console.error(error.stack);
  }
}

// 运行排查
runTroubleshooting();