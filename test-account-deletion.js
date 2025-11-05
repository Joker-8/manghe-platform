// 账号注销功能系统性测试脚本
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const API_BASE_URL = 'http://localhost:3004/api';
const TEST_USER = {
  username: 'testuser_deletion',
  password: 'Test@123456',
  email: 'testuser_deletion@example.com'
};

// 测试结果记录
const testResults = {
  startTime: new Date().toISOString(),
  tests: [],
  summary: {}
};

// 辅助函数：记录测试结果
function recordTestResult(testName, success, details = {}) {
  const result = {
    testName,
    success,
    timestamp: new Date().toISOString(),
    details
  };
  testResults.tests.push(result);
  console.log(`${success ? '✅' : '❌'} ${testName}: ${success ? '通过' : '失败'}`);
  if (details.message) {
    console.log(`  详情: ${details.message}`);
  }
  return result;
}

// 辅助函数：等待指定时间
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 创建测试用户
async function createTestUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
    if (response.data.success) {
      return {
        success: true,
        userId: response.data.user?.id,
        username: response.data.user?.username
      };
    }
    return { success: false, message: response.data.message || '创建用户失败' };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || '创建用户时发生错误'
    };
  }
}

// 用户登录
async function loginUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password
    });
    if (response.data.success) {
      return {
        success: true,
        token: response.data.token,
        user: response.data.user
      };
    }
    return { success: false, message: response.data.message || '登录失败' };
  } catch (error) {
    return { 
      success: false, 
      message: error.response?.data?.message || error.message || '登录时发生错误'
    };
  }
}

// 测试1: 验证登出功能（与注销对比）
async function testLogoutFunctionality(token) {
  try {
    // 先获取用户信息验证登录状态
    const getUserResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!getUserResponse.data.success) {
      return recordTestResult('验证登出功能', false, {
        message: '获取用户信息失败，无法验证登录状态'
      });
    }
    
    // 执行登出
    const logoutResponse = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 检查登出响应
    if (logoutResponse.data.success) {
      // 尝试使用相同token再次获取用户信息（应该失败）
      try {
        await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return recordTestResult('验证登出功能', false, {
          message: '登出后token仍然有效，登出功能未正确实现'
        });
      } catch (error) {
        // 预期token失效，所以捕获到错误是正确的
        return recordTestResult('验证登出功能', true, {
          message: '登出功能正常工作，token在登出后失效',
          logoutResponse: logoutResponse.data
        });
      }
    }
    
    return recordTestResult('验证登出功能', false, {
      message: '登出请求失败',
      response: logoutResponse.data
    });
  } catch (error) {
    return recordTestResult('验证登出功能', false, {
      message: '登出测试过程中发生错误',
      error: error.message
    });
  }
}

// 测试2: 提交账号注销申请
async function testSubmitDeletionRequest(token, userId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${userId}/delete-request`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      return recordTestResult('提交账号注销申请', true, {
        message: '账号注销申请提交成功',
        scheduledTime: response.data.data?.scheduledTime,
        response: response.data
      });
    }
    
    return recordTestResult('提交账号注销申请', false, {
      message: '账号注销申请提交失败',
      response: response.data
    });
  } catch (error) {
    return recordTestResult('提交账号注销申请', false, {
      message: '提交注销申请过程中发生错误',
      error: error.response?.data?.message || error.message
    });
  }
}

// 测试3: 获取账号注销状态
async function testGetDeletionStatus(token, userId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/delete-status`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      if (response.data.hasPendingRequest) {
        return recordTestResult('获取账号注销状态', true, {
          message: '成功获取待处理的注销申请状态',
          scheduledTime: response.data.data?.scheduledTime,
          status: response.data.data?.status,
          response: response.data
        });
      } else {
        return recordTestResult('获取账号注销状态', false, {
          message: '未找到待处理的注销申请，但应该存在',
          response: response.data
        });
      }
    }
    
    return recordTestResult('获取账号注销状态', false, {
      message: '获取注销状态失败',
      response: response.data
    });
  } catch (error) {
    return recordTestResult('获取账号注销状态', false, {
      message: '获取注销状态过程中发生错误',
      error: error.response?.data?.message || error.message
    });
  }
}

// 测试4: 取消账号注销申请
async function testCancelDeletionRequest(token, userId) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}/delete-request`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      // 验证注销申请已取消
      const statusResponse = await axios.get(`${API_BASE_URL}/users/${userId}/delete-status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statusResponse.data.success && !statusResponse.data.hasPendingRequest) {
        return recordTestResult('取消账号注销申请', true, {
          message: '账号注销申请取消成功',
          response: response.data
        });
      } else {
        return recordTestResult('取消账号注销申请', false, {
          message: '注销申请未成功取消',
          statusResponse: statusResponse.data
        });
      }
    }
    
    return recordTestResult('取消账号注销申请', false, {
      message: '取消注销申请失败',
      response: response.data
    });
  } catch (error) {
    return recordTestResult('取消账号注销申请', false, {
      message: '取消注销申请过程中发生错误',
      error: error.response?.data?.message || error.message
    });
  }
}

// 测试5: 验证权限控制（尝试注销其他用户账号）
async function testPermissionControl(token, userId) {
  try {
    // 尝试注销一个不存在或非当前用户的账号（使用userId+1）
    const otherUserId = parseInt(userId) + 1;
    
    await axios.post(`${API_BASE_URL}/users/${otherUserId}/delete-request`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // 如果没有抛出错误，说明权限控制有问题
    return recordTestResult('验证权限控制', false, {
      message: '能够尝试注销其他用户账号，权限控制失效'
    });
  } catch (error) {
    // 预期会抛出错误，检查是否是403权限错误
    if (error.response?.status === 403) {
      return recordTestResult('验证权限控制', true, {
        message: '权限控制有效，无法注销其他用户账号',
        status: error.response.status,
        message: error.response.data?.message
      });
    } else {
      return recordTestResult('验证权限控制', false, {
        message: '权限控制测试结果不符合预期',
        status: error.response?.status,
        error: error.response?.data?.message || error.message
      });
    }
  }
}

// 生成测试报告
function generateTestReport() {
  const passedTests = testResults.tests.filter(t => t.success);
  const failedTests = testResults.tests.filter(t => !t.success);
  
  testResults.summary = {
    totalTests: testResults.tests.length,
    passed: passedTests.length,
    failed: failedTests.length,
    passRate: (passedTests.length / testResults.tests.length * 100).toFixed(2) + '%',
    endTime: new Date().toISOString()
  };
  
  const reportPath = path.join(__dirname, 'account-deletion-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
  
  console.log('\n=== 测试报告 ===');
  console.log(`总测试数: ${testResults.summary.totalTests}`);
  console.log(`通过: ${testResults.summary.passed}`);
  console.log(`失败: ${testResults.summary.failed}`);
  console.log(`通过率: ${testResults.summary.passRate}`);
  console.log(`\n详细报告已保存至: ${reportPath}`);
  
  // 打印功能差异总结
  console.log('\n=== 账号注销与登出功能差异总结 ===');
  console.log('1. 登出功能:');
  console.log('   - 仅结束当前会话');
  console.log('   - 不删除用户数据');
  console.log('   - 用户可以使用原凭证重新登录');
  console.log('   - 操作即时生效');
  console.log('\n2. 账号注销功能:');
  console.log('   - 7天冷静期机制');
  console.log('   - 冷静期内可取消注销申请');
  console.log('   - 彻底删除用户数据（理论上）');
  console.log('   - 注销后无法使用原凭证登录');
  console.log('   - 包含多重身份验证和确认步骤');
  
  // 系统实现评估
  console.log('\n=== 系统实现评估 ===');
  console.log('发现问题:');
  console.log('1. 后端注销申请存储在内存中（accountDeletionRequests对象），非持久化存储');
  console.log('2. 未发现实际执行账号删除的定时任务或逻辑');
  console.log('3. 未发现用户相关数据（订单、收藏等）删除或匿名化的实现');
  console.log('4. 注销流程缺少密码验证的额外安全步骤');
  
  console.log('\n建议改进:');
  console.log('1. 将注销申请存储到数据库中以确保持久化');
  console.log('2. 实现定期检查并执行到期注销申请的定时任务');
  console.log('3. 添加完整的用户数据清理逻辑，包括关联数据');
  console.log('4. 在注销确认时增加密码验证步骤');
  console.log('5. 实现数据匿名化选项，允许用户选择部分数据保留但匿名化');
}

// 主测试函数
async function runTests() {
  console.log('开始账号注销功能系统性测试...');
  console.log(`测试API基础URL: ${API_BASE_URL}`);
  console.log(`测试用户: ${TEST_USER.username}\n`);
  
  try {
    // 1. 创建测试用户
    console.log('步骤1: 创建测试用户...');
    const createResult = await createTestUser();
    if (!createResult.success) {
      console.error('创建测试用户失败:', createResult.message);
      return;
    }
    console.log(`成功创建测试用户，ID: ${createResult.userId}`);
    
    // 2. 用户登录
    console.log('\n步骤2: 用户登录...');
    const loginResult = await loginUser();
    if (!loginResult.success) {
      console.error('用户登录失败:', loginResult.message);
      return;
    }
    const { token, user } = loginResult;
    console.log(`成功登录，用户ID: ${user.id}`);
    
    // 3. 运行各个测试用例
    console.log('\n步骤3: 执行功能测试...');
    
    // 测试登出功能
    await testLogoutFunctionality(token);
    
    // 重新登录以继续测试
    const reloginResult = await loginUser();
    if (!reloginResult.success) {
      console.error('重新登录失败:', reloginResult.message);
      return;
    }
    
    // 测试注销功能流程
    await testSubmitDeletionRequest(reloginResult.token, user.id);
    await testGetDeletionStatus(reloginResult.token, user.id);
    await testCancelDeletionRequest(reloginResult.token, user.id);
    
    // 再次提交注销申请以测试权限控制
    await testSubmitDeletionRequest(reloginResult.token, user.id);
    await testPermissionControl(reloginResult.token, user.id);
    
    // 最后清理：取消注销申请
    await testCancelDeletionRequest(reloginResult.token, user.id);
    
    // 生成测试报告
    generateTestReport();
    
  } catch (error) {
    console.error('测试过程中发生未预期的错误:', error);
    generateTestReport();
  }
}

// 运行测试
runTests();