// 最简单的GET同步数据测试
const axios = require('axios');

console.log('===== GET同步数据测试 =====');

async function test() {
  try {
    const response = await axios.get('http://localhost:3000/api/users/1/sync', {
      headers: {
        'Authorization': 'Bearer mock-jwt-token-test'
      },
      timeout: 3000
    });
    console.log('✅ 成功! 状态码:', response.status);
    console.log('数据:', response.data);
  } catch (err) {
    console.error('❌ 失败:', err.message);
    if (err.response) {
      console.error('响应状态:', err.response.status);
      console.error('响应数据:', err.response.data);
    }
  }
}

test().then(() => console.log('\n测试完成'));