// 简化版跨设备数据持久化功能测试脚本
// 使用axios库

const axios = require('axios');

console.log('========== 简化版跨设备数据持久化功能测试 ==========');

const API_BASE_URL = 'http://localhost:3000/api';
const userId = 1;
const mockToken = 'mock-jwt-token-test'; // 模拟token用于认证

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mockToken}`
  }
});

// 基本同步测试
async function testBasicSync() {
  console.log('\n=== 测试1: 基本同步功能测试 ===');
  try {
    const testData = {
      favorites: [101, 102, 103],
      cart: [{ id: 201, quantity: 1 }],
      version: 1,
      lastSyncTime: new Date().toISOString()
    };

    console.log('上传测试数据到服务器...');
    const response = await apiClient.post(`/users/${userId}/sync`, testData);
    
    const result = response.data;
    console.log('同步响应:', result);
    
    if (result.success) {
      console.log('✓ 数据同步到服务器成功');
      
      // 尝试获取数据
      const getResponse = await apiClient.get(`/users/${userId}/sync`);
      const getResult = getResponse.data;
      console.log('获取数据响应:', getResult);
      
      if (getResult.success) {
        console.log('✓ 成功从服务器获取数据');
      }
    }
  } catch (error) {
    console.error('✗ 测试失败:', error.response?.data?.message || error.message);
  }
}

// 获取同步数据测试
async function testGetSyncData() {
  console.log('\n=== 测试2: 获取同步数据测试 ===');
  try {
    const response = await apiClient.get(`/users/${userId}/sync`);
    const data = response.data;
    console.log('获取数据响应:', data);
    
    if (data.success) {
      console.log('✓ 获取同步数据测试通过');
      console.log('收藏数据:', data.data?.favorites || []);
      console.log('购物车数据:', data.data?.cart || []);
    }
  } catch (error) {
    console.error('✗ 获取同步数据失败:', error.response?.data?.message || error.message);
  }
}

// 测试执行
(async () => {
  await testBasicSync();
  await testGetSyncData();
  console.log('\n========== 测试完成 ==========');
})();