// 简单的健康检查测试
const axios = require('axios');

console.log('===== 健康检查测试 =====');

async function test() {
  try {
    const response = await axios.get('http://localhost:3000/api/health', {
      timeout: 3000
    });
    console.log('✅ 健康检查成功! 状态码:', response.status);
    console.log('数据:', response.data);
  } catch (err) {
    console.error('❌ 健康检查失败:', err.message);
  }
}

test().then(() => console.log('\n测试完成'));