// 简化的同步测试，不需要认证令牌
const axios = require('axios');

console.log('===== 简化同步测试（无需认证） =====');

async function testSyncAPI() {
  try {
    console.log('发送同步请求...');
    const response = await axios.post('http://localhost:3000/api/users/1/sync', {
      favorites: [{ id: 1, name: '测试收藏' }],
      cart: [{ id: 2, quantity: 1 }],
      version: 1
    }, {
      headers: {
        'Content-Type': 'application/json'
        // 不发送Authorization头
      },
      timeout: 5000
    });
    
    console.log('✅ 同步成功! 状态码:', response.status);
    console.log('数据:', response.data);
  } catch (err) {
    console.error('❌ 同步失败:', err.message);
    if (err.response) {
      console.log('响应状态:', err.response.status);
      console.log('响应数据:', err.response.data);
    }
  }
}

testSyncAPI().then(() => console.log('\n测试完成'));