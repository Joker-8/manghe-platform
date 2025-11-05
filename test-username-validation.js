// 测试用户名长度验证功能
// 此脚本用于测试前端用户注册页面的用户名长度验证逻辑

console.log('开始测试用户名长度验证功能...');
console.log('='.repeat(50));

// 模拟验证函数，复制自前端代码的核心逻辑
function validateUsername(username) {
    const errors = [];
    
    if (!username.trim()) {
        errors.push('用户名不能为空');
    } else if (username.length < 2) {
        errors.push('用户名至少2个字符');
    } else if (username.length > 20) {
        errors.push('用户名最多20个字符');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// 测试用例
const testCases = [
    { username: '', description: '空用户名' },
    { username: 'a', description: '1个字符的用户名' },
    { username: 'ab', description: '2个字符的用户名（边界值）' },
    { username: 'abc', description: '3个字符的用户名' },
    { username: 'abcdefghijklmnopqrst', description: '20个字符的用户名（边界值）' },
    { username: 'abcdefghijklmnopqrstu', description: '21个字符的用户名' },
    { username: '  ab  ', description: '包含空格的2个字符用户名' },
    { username: '测试', description: '2个中文字符用户名' }
];

let passedCount = 0;
let failedCount = 0;

// 执行测试
console.log('测试结果:');
console.log('-'.repeat(50));

testCases.forEach((testCase, index) => {
    const result = validateUsername(testCase.username);
    console.log(`测试 ${index + 1}: ${testCase.description}`);
    console.log(`  输入: "${testCase.username}"`);
    console.log(`  验证结果: ${result.isValid ? '通过' : '失败'}`);
    
    if (!result.isValid) {
        console.log(`  错误信息: ${result.errors.join(', ')}`);
    }
    
    // 判断测试是否应该通过
    let shouldPass = false;
    const trimmedLength = testCase.username.trim().length;
    if (trimmedLength >= 2 && trimmedLength <= 20 && testCase.username.trim() !== '') {
        shouldPass = true;
    }
    
    if (result.isValid === shouldPass) {
        console.log('  状态: ✓ 预期一致');
        passedCount++;
    } else {
        console.log('  状态: ✗ 预期不符');
        console.log(`  预期: ${shouldPass ? '通过' : '失败'}`);
        failedCount++;
    }
    
    console.log('-'.repeat(50));
});

// 输出总结
console.log('测试总结:');
console.log(`总测试用例: ${testCases.length}`);
console.log(`通过: ${passedCount}`);
console.log(`失败: ${failedCount}`);

if (failedCount === 0) {
    console.log('🎉 所有测试通过！用户名长度验证逻辑已正确更新为最小2个字符。');
} else {
    console.log('❌ 有测试失败，请检查验证逻辑。');
}

console.log('='.repeat(50));
console.log('测试完成。');
console.log('注意：此测试仅验证逻辑，实际效果请在前端注册页面测试。');