// 详细测试订单API
const http = require('http');

console.log('=== 详细测试订单API ===');
console.log('时间:', new Date().toISOString());

// 测试多个端点以诊断问题
testEndpoints([
    { name: '订单详情API (ID: 1)', url: 'http://localhost:3020/api/orders/1' },
    { name: '订单列表API', url: 'http://localhost:3020/api/orders/user/1' },
    { name: '根路径测试', url: 'http://localhost:3020/' },
    { name: '健康检查', url: 'http://localhost:3020/health' }
]);

function testEndpoints(endpoints) {
    let currentIndex = 0;
    
    function testNextEndpoint() {
        if (currentIndex >= endpoints.length) {
            console.log('\n=== 所有测试完成 ===');
            return;
        }
        
        const endpoint = endpoints[currentIndex];
        currentIndex++;
        
        console.log(`\n=== 测试: ${endpoint.name} ===`);
        console.log(`URL: ${endpoint.url}`);
        
        const startTime = Date.now();
        
        const req = http.get(endpoint.url, (res) => {
            const duration = Date.now() - startTime;
            console.log(`✅ 连接成功，耗时: ${duration}ms`);
            console.log(`📊 响应状态码: ${res.statusCode}`);
            console.log(`📊 状态文本: ${res.statusMessage}`);
            console.log(`📊 响应头:`);
            console.log(JSON.stringify(res.headers, null, 2));
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📊 响应体大小: ${data.length} 字节`);
                
                if (data.length > 0) {
                    try {
                        const parsedData = JSON.parse(data);
                        console.log('📋 响应数据 (已解析):');
                        console.log(JSON.stringify(parsedData, null, 2));
                    } catch (parseError) {
                        console.log('📋 响应数据 (原始文本):');
                        console.log(data);
                        console.log('❌ 解析JSON失败:', parseError.message);
                    }
                } else {
                    console.log('📋 响应体为空');
                }
                
                // 延迟测试下一个端点
                setTimeout(testNextEndpoint, 500);
            });
        });
        
        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            console.error(`❌ 请求失败，耗时: ${duration}ms`);
            console.error(`错误类型: ${error.name}`);
            console.error(`错误信息: ${error.message}`);
            console.error(`错误代码: ${error.code || 'N/A'}`);
            console.error(`地址: ${error.address || 'N/A'}`);
            console.error(`端口: ${error.port || 'N/A'}`);
            
            // 延迟测试下一个端点
            setTimeout(testNextEndpoint, 500);
        });
        
        req.setTimeout(5000, () => {
            console.error('❌ 请求超时 (5000ms)');
            req.destroy();
            
            // 延迟测试下一个端点
            setTimeout(testNextEndpoint, 500);
        });
    }
    
    // 开始测试第一个端点
    testNextEndpoint();
}