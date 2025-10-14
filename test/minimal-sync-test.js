// 简单的同步API测试脚本
const axios = require('axios');

console.log('===== 简单同步API测试 =====');

const API_URL = 'http://localhost:3000/api/users/1/sync';
const mockToken = 'mock-jwt-token-test';

async function testSyncApi() {
  try {
    console.log('正在发送同步请求...');
    
    // 发送一个简单的POST请求
    const response = await axios.post(API_URL, 
      { favorites: [], cart: [], version: 0 },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`
        },
        timeout: 5000 // 设置5秒超时
      }
    );
    
    console.log('同步成功! 响应:', response.data);
    
    // 尝试获取数据
    const getResponse = await axios.get(API_URL, {
      headers: {
        'Authorization': `Bearer ${mockToken}`
      },
      timeout: 5000
    });
    
    console.log('获取数据成功! 响应:', getResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('服务器返回:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    }
  }
}

testSyncApi().then(() => {
  console.log('\n===== 测试完成 =====');
});