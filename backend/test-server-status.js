import http from 'http';
import fs from 'fs';

// 测试服务器状态的函数
async function testServerStatus() {
    console.log('开始测试服务器状态...');
    
    // 尝试连接到主端口
    const testUrl = 'http://localhost:3004/api/health';
    
    try {
        console.log(`尝试连接到: ${testUrl}`);
        
        // 使用http.get测试连接
        const response = await new Promise((resolve, reject) => {
            const req = http.get(testUrl, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, data });
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            // 设置超时
            req.setTimeout(5000, () => {
                req.destroy(new Error('请求超时'));
            });
        });
        
        console.log(`✅ 服务器响应状态码: ${response.statusCode}`);
        console.log(`✅ 响应内容: ${response.data}`);
        return true;
        
    } catch (error) {
        console.error(`❌ 服务器连接失败: ${error.message}`);
        
        // 检查是否有任何端口被使用
        console.log('\n检查所有监听的端口...');
        console.log('请在另一个终端运行: netstat -ano | findstr LISTENING');
        
        return false;
    }
}

// 检查进程状态
function checkNodeProcesses() {
    console.log('\n检查Node.js进程...');
    console.log('请在另一个终端运行: tasklist | findstr node');
}

// 检查数据库文件状态
function checkDatabaseFile() {
    console.log('\n检查数据库文件状态...');
    const dbPath = './data/manghe.db';
    
    try {
        const stats = fs.statSync(dbPath);
        console.log(`✅ 数据库文件存在: ${dbPath}`);
        console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   最后修改: ${stats.mtime.toISOString()}`);
    } catch (error) {
        console.error(`❌ 数据库文件不存在或无法访问: ${error.message}`);
    }
}

// 运行测试
(async () => {
    await testServerStatus();
    checkNodeProcesses();
    checkDatabaseFile();
    console.log('\n测试完成。如果服务器未响应，请检查端口占用或查看服务器日志。');
})();