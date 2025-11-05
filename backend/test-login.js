import http from 'http';
import { Buffer } from 'buffer';

const data = JSON.stringify({
  loginInput: 'testuser',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3004,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:', responseData);
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

req.write(data);
req.end();