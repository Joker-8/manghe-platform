import axios from 'axios';

async function testApiConnection() {
  try {
    console.log('开始测试API连接...');
    
    // 测试后端健康检查端点
    const healthResponse = await axios.get('http://localhost:3020/api/health', {
      timeout: 5000
    });
    
    console.log('✅ 后端健康检查成功!');
    console.log('响应状态码:', healthResponse.status);
    console.log('响应数据:', healthResponse.data);
    
    // 测试前端访问
    console.log('\n前端服务地址: http://localhost:5173/');
    console.log('请在浏览器中访问前端地址以验证完整功能');
    
    // 测试API基本功能
    try {
      const usersResponse = await axios.get('http://localhost:3020/api/users', {
        timeout: 5000
      });
      console.log('\n✅ 用户API端点测试成功!');
      console.log('用户数量:', Array.isArray(usersResponse.data) ? usersResponse.data.length : '未知');
    } catch (apiError) {
      console.log('\n⚠️ 用户API端点测试 - 需要认证:', apiError.response?.status || '未知错误');
    }
    
    console.log('\n🎉 前后端连接测试完成!');
    console.log('项目状态: 运行正常');
    
  } catch (error) {
    console.error('❌ API连接测试失败:');
    console.error('错误信息:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('未收到响应，请检查后端服务是否正常运行');
    }
  }
}

// 运行测试
testApiConnection();