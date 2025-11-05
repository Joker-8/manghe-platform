// 测试3004端口的登录安全漏洞
import axios from 'axios';

async function testLoginSecurity() {
    const API_BASE_URL = 'http://localhost:3004/api/auth';
    const RANDOM_USERNAME = `test_security_${Date.now()}`;
    const RANDOM_PASSWORD = 'TestPassword123!';
    
    console.log('🔐 测试未注册用户登录安全...');
    console.log(`测试用户: ${RANDOM_USERNAME}`);
    console.log(`测试密码: ${RANDOM_PASSWORD}`);
    
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            username: RANDOM_USERNAME,
            password: RANDOM_PASSWORD
        });
        
        console.error('❌ 严重安全漏洞: 未注册用户成功登录!');
        console.error('返回数据:', response.data);
        process.exit(1);
    } catch (error) {
        if (error.response) {
            console.log(`✅ 登录被拒绝，状态码: ${error.response.status}`);
            console.log(`响应信息:`, error.response.data);
            if (error.response.status === 401 || error.response.status === 400) {
                console.log('✅ 安全: 未注册用户无法登录');
                process.exit(0);
            } else {
                console.error(`⚠️  意外状态码: ${error.response.status}`);
                process.exit(1);
            }
        } else {
            console.error('❌ 请求失败:', error.message);
            process.exit(1);
        }
    }
}

testLoginSecurity();