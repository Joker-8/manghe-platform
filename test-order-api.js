// 测试订单详情API连接
const http = require('http');
const https = require('https');

function testOrderDetailAPI() {
  // 使用一个测试订单ID
  const orderId = 1;
  const protocol = http; // 使用HTTP协议
  
  console.log(`=== 订单详情API测试开始 ===`);
console.log(`目标: http://localhost:3020/api/orders/${orderId}`);

const startTime = Date.now();

try {
  const req = protocol.get('http://localhost:3020/api/orders/' + orderId, (res) => {
      const duration = Date.now() - startTime;
      console.log(`✅ 连接成功，耗时: ${duration}ms`);
      console.log(`📊 响应状态码: ${res.statusCode}`);
      console.log(`📊 响应头:`, res.headers);
      
      let data = '';
      
      // 接收响应数据
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // 响应结束
      res.on('end', () => {
        console.log(`📊 响应体大小: ${data.length} 字节`);
        
        if (data.length > 0) {
          try {
            const parsedData = JSON.parse(data);
            console.log('📋 响应数据:', JSON.stringify(parsedData, null, 2));
            
            if (res.statusCode === 200) {
              console.log('🎉 订单详情API测试成功！');
            } else if (res.statusCode === 404) {
              console.log('⚠️  订单不存在（404），这是正常的，如果数据库中没有该订单ID');
            } else {
              console.log('❌ 订单详情API返回错误:', parsedData.message || '未知错误');
            }
          } catch (parseError) {
            console.error('❌ 解析响应数据失败:', parseError.message);
            console.log('🔍 原始响应数据:', data);
          }
        } else {
          console.log('⚠️  响应体为空');
        }
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.error(`❌ 连接失败，耗时: ${duration}ms`);
      console.error(`❌ 错误类型: ${error.code}`);
      console.error(`❌ 错误消息: ${error.message}`);
      console.error(`❌ 错误详情:`, error);
      
      if (error.code === 'ECONNREFUSED') {
        console.error('💡 提示: 连接被拒绝，可能的原因：');
        console.error('   1. 后端服务未运行');
        console.error('   2. 端口号配置错误');
        console.error('   3. 防火墙阻止了连接');
      }
    });

    req.setTimeout(5000, () => {
      console.error('❌ 请求超时（5秒）');
      req.abort();
    });

    req.end();
  } catch (unexpectedError) {
    console.error('❌ 发生未预期的错误:', unexpectedError);
  } finally {
    console.log(`=== 测试结束 ===`);
  }
}

// 运行测试
testOrderDetailAPI();