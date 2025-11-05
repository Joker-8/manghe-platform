// 测试收藏馆同步功能修复
const axios = require('axios');

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3004/api', // 后端服务地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const userId = 1; // 测试用户ID

console.log('===== 测试收藏馆同步API修复 =====');

// 测试获取用户同步数据
async function testGetSyncData() {
  try {
    console.log(`测试获取用户 ${userId} 的同步数据...`);
    const response = await apiClient.get(`/users/${userId}/sync`);
    
    console.log('✅ 获取同步数据成功! 状态码:', response.status);
    console.log('数据:', response.data);
    return true;
  } catch (err) {
    console.error('❌ 获取同步数据失败:', err.message);
    if (err.response) {
      console.log('响应状态:', err.response.status);
      console.log('响应数据:', err.response.data);
    }
    return false;
  }
}

// 测试同步客户端数据
async function testSyncClientData() {
  try {
    const testData = {
      favorites: [101, 102, 103],
      cart: [{ id: 201, quantity: 1 }],
      version: 1,
      lastSyncTime: new Date().toISOString()
    };
    
    console.log(`测试同步客户端数据到用户 ${userId}...`);
    const response = await apiClient.post(`/users/${userId}/sync`, testData);
    
    console.log('✅ 同步客户端数据成功! 状态码:', response.status);
    console.log('数据:', response.data);
    return true;
  } catch (err) {
    console.error('❌ 同步客户端数据失败:', err.message);
    if (err.response) {
      console.log('响应状态:', err.response.status);
      console.log('响应数据:', err.response.data);
    }
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('\n开始测试...');
  
  const testGetResult = await testGetSyncData();
  console.log('\n---\n');
  const testSyncResult = await testSyncClientData();
  
  console.log('\n===== 测试结果总结 =====');
  console.log(`获取同步数据: ${testGetResult ? '✅ 通过' : '❌ 失败'}`);
  console.log(`同步客户端数据: ${testSyncResult ? '✅ 通过' : '❌ 失败'}`);
  
  if (testGetResult && testSyncResult) {
    console.log('\n🎉 所有测试通过! API修复成功!');
  } else {
    console.log('\n❌ 部分测试失败，请检查修复。');
  }
}

runTests().catch(err => {
  console.error('测试过程中发生错误:', err);
});