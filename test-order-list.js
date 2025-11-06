const http = require('http');

// 简单测试订单列表API
const options = {
  hostname: 'localhost',
  port: 3020,
  path: '/api/orders/user/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('开始测试订单列表API...');
const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('响应状态码:', res.statusCode);
    console.log('响应头:', JSON.stringify(res.headers, null, 2));
    try {
      const jsonData = JSON.parse(data);
      console.log('响应数据 (JSON):', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('响应数据 (原始):', data);
      console.log('解析JSON失败:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
});

req.end();