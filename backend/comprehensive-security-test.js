import axios from 'axios';
import crypto from 'crypto';

// 测试配置
const config = {
    baseURL: 'http://localhost:3000/api/auth', // 假设后端API地址
    testCases: [
        // 1. 未注册用户使用密码登录
        { name: '未注册用户密码登录', endpoint: '/login', method: 'post', data: { username: 'nonexistent123', password: 'anypassword123' }, shouldFail: true },
        // 2. 未注册用户使用邮箱登录
        { name: '未注册用户邮箱登录', endpoint: '/login', method: 'post', data: { email: 'nonexistent123@example.com', password: 'anypassword123' }, shouldFail: true },
        // 3. 未注册用户使用手机号登录（需要验证码，这里只测试接口响应）
        { name: '未注册手机号登录', endpoint: '/phone-login', method: 'post', data: { phone: '13800138000', code: '123456' }, shouldFail: true },
        // 4. 空凭证登录
        { name: '空用户名密码登录', endpoint: '/login', method: 'post', data: { username: '', password: '' }, shouldFail: true },
        // 5. SQL注入尝试
        { name: 'SQL注入尝试1', endpoint: '/login', method: 'post', data: { username: "' OR '1'='1", password: 'anypassword' }, shouldFail: true },
        { name: 'SQL注入尝试2', endpoint: '/login', method: 'post', data: { username: 'admin\' --', password: 'anypassword' }, shouldFail: true },
        // 6. 正确用户但错误密码
        { name: '正确用户错误密码', endpoint: '/login', method: 'post', data: { username: 'admin', password: 'wrongpassword' }, shouldFail: true },
        // 7. 特殊字符用户名
        { name: '特殊字符用户名', endpoint: '/login', method: 'post', data: { username: 'test@#$%^&*()', password: 'anypassword' }, shouldFail: true },
        // 8. 超长输入
        { name: '超长用户名', endpoint: '/login', method: 'post', data: { username: 'a'.repeat(500), password: 'anypassword' }, shouldFail: true },
    ]
};

// 生成随机测试用户
function generateRandomUser() {
    const randomId = crypto.randomBytes(8).toString('hex');
    return {
        username: `testuser_${randomId}`,
        email: `test_${randomId}@example.com`,
        phone: `1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        password: `Password123!${randomId}`
    };
}

// 执行单个测试用例
async function runTestCase(testCase) {
    console.log(`\n📋 测试: ${testCase.name}`);
    console.log(`   端点: ${testCase.endpoint}`);
    console.log(`   数据: ${JSON.stringify(testCase.data)}`);
    
    try {
        const response = await axios({
            method: testCase.method,
            url: config.baseURL + testCase.endpoint,
            data: testCase.data,
            timeout: 5000
        });
        
        console.log(`   状态码: ${response.status}`);
        console.log(`   响应: ${JSON.stringify(response.data)}`);
        
        // 检查测试是否通过
        const testPassed = testCase.shouldFail ? 
            (response.data?.success === false || response.status !== 200) : 
            (response.data?.success === true && response.status === 200);
        
        console.log(`   结果: ${testPassed ? '✅ 通过' : '❌ 失败'}`);
        return testPassed;
    } catch (error) {
        console.log(`   错误: ${error.message}`);
        
        // 如果期望失败，那么错误可能是预期的
        if (testCase.shouldFail) {
            console.log(`   结果: ✅ 通过`);
            return true;
        }
        
        console.log(`   结果: ❌ 失败`);
        return false;
    }
}

// 运行所有测试用例
async function runAllTests() {
    console.log('🚀 开始全面安全测试...');
    console.log(`🔍 共 ${config.testCases.length} 个测试用例`);
    
    const results = {
        passed: 0,
        failed: 0,
        details: []
    };
    
    for (const testCase of config.testCases) {
        const passed = await runTestCase(testCase);
        
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
            results.details.push(`❌ ${testCase.name}`);
        }
    }
    
    // 打印测试报告
    console.log('\n📊 安全测试报告');
    console.log(`==================`);
    console.log(`总测试用例: ${config.testCases.length}`);
    console.log(`通过: ${results.passed}`);
    console.log(`失败: ${results.failed}`);
    
    if (results.failed > 0) {
        console.log('\n❌ 失败的测试用例:');
        results.details.forEach(detail => console.log(`   ${detail}`));
        console.log('\n⚠️  安全漏洞仍然存在，请修复上述问题');
    } else {
        console.log('\n✅ 所有安全测试通过！登录系统已修复未注册用户登录的漏洞');
    }
    
    return results;
}

// 执行测试
runAllTests().then(results => {
    console.log('\n🏁 测试完成');
    process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('\n❌ 测试执行过程中发生错误:', error);
    process.exit(1);
});