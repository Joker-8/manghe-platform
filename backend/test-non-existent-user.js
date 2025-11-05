import axios from 'axios';
import { randomBytes } from 'crypto';

// 生成随机未注册用户名
const randomUsername = `testuser_${randomBytes(4).toString('hex')}`;
const testPassword = 'testpassword123';

async function testNonExistentUserLogin() {
  console.log(`🚀 开始测试未注册用户登录...`);
  console.log(`🔍 测试用户: ${randomUsername}`);
  
  try {
    const response = await axios.post('http://localhost:3004/api/auth/login', {
      username: randomUsername,
      password: testPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`❌ 测试失败：未注册用户居然成功登录了！`);
    console.log(`📊 响应状态码: ${response.status}`);
    console.log(`📊 响应数据:`, response.data);
    return { success: false, status: 'failed', reason: '未注册用户能够登录' };
    
  } catch (error) {
    if (error.response) {
      // 有响应但状态码不是2xx
      console.log(`✅ 测试成功：未注册用户被正确拒绝`);
      console.log(`📊 响应状态码: ${error.response.status}`);
      console.log(`📊 响应消息: ${error.response.data?.message || '未知错误'}`);
      
      // 验证是否返回了401状态码和适当的错误消息
      if (error.response.status === 401 && 
          (error.response.data?.message === '用户名或密码错误' || 
           error.response.data?.message === '该账号不存在')) {
        return { success: true, status: 'passed', message: '未注册用户无法登录' };
      } else {
        return { 
          success: false, 
          status: 'warning', 
          reason: `返回了状态码 ${error.response.status} 而不是 401`,
          message: error.response.data?.message 
        };
      }
    } else if (error.request) {
      // 发送请求但没有收到响应
      console.log(`❌ 测试失败：请求发送失败`);
      console.log(`📊 错误:`, error.message);
      return { success: false, status: 'failed', reason: '请求发送失败', error: error.message };
    } else {
      // 设置请求时发生错误
      console.log(`❌ 测试失败：请求设置失败`);
      console.log(`📊 错误:`, error.message);
      return { success: false, status: 'failed', reason: '请求设置失败', error: error.message };
    }
  }
}

// 执行测试
async function runTest() {
  try {
    const result = await testNonExistentUserLogin();
    
    console.log('\n📋 测试结果摘要:');
    console.log(`- 状态: ${result.status === 'passed' ? '✅ 通过' : result.status === 'warning' ? '⚠️  警告' : '❌ 失败'}`);
    console.log(`- 消息: ${result.message || result.reason}`);
    
    if (!result.success) {
      console.log('\n🔧 建议操作:');
      console.log('- 检查登录接口实现');
      console.log('- 验证用户存在性检查逻辑');
      console.log('- 确保模拟数据模式下的安全验证');
    }
    
    return result;
  } catch (error) {
    console.error('\n❌ 测试执行异常:', error);
    return { success: false, status: 'error', error: error.message };
  }
}

// 运行测试并确保脚本正确退出
runTest().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ 测试异常:', error);
  process.exit(1);
});