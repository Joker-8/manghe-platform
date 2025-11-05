// 基础稳定性测试脚本 - 简化版但更可靠
import http from 'http';
import fs from 'fs';

// 配置
const TEST_DURATION = 30 * 60 * 1000; // 30分钟
const CHECK_INTERVAL = 30000; // 30秒检查一次
const LOG_FILE = './test-reports/basic-stability-log.txt';

// 确保测试报告目录存在
if (!fs.existsSync('./test-reports')) {
  fs.mkdirSync('./test-reports', { recursive: true });
}

// 测试结果
const results = {
  startTime: new Date().toISOString(),
  serverChecks: {
    total: 0,
    successful: 0,
    failed: 0,
    lastResponseTime: null
  },
  serviceStatus: 'running',
  errors: [],
  checkHistory: []
};

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  try {
    fs.appendFileSync(LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error('写入日志失败:', err);
  }
}

// 保存测试结果
function saveResults() {
  try {
    const reportFile = './test-reports/basic-test-results.json';
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    log(`测试结果已保存到: ${reportFile}`);
  } catch (err) {
    console.error('保存测试结果失败:', err);
  }
}

// 检查服务器健康状态
function checkServerHealth() {
  const startTime = Date.now();
  results.serverChecks.total++;
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3004/api/health', {
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        results.serverChecks.lastResponseTime = responseTime;
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            results.serverChecks.successful++;
            
            const checkResult = {
              time: new Date().toISOString(),
              status: 'success',
              statusCode: res.statusCode,
              responseTime: responseTime,
              message: jsonData.message
            };
            results.checkHistory.push(checkResult);
            
            log(`✅ 服务器健康检查成功: 状态码=${res.statusCode}, 响应时间=${responseTime}ms, 消息="${jsonData.message}"`);
            resolve(true);
          } catch (parseError) {
            handleError('响应解析失败', parseError, resolve);
          }
        } else {
          handleError(`状态码错误: ${res.statusCode}`, null, resolve);
        }
      });
    });
    
    req.on('error', (err) => {
      handleError('HTTP请求错误', err, resolve);
    });
    
    req.on('timeout', () => {
      req.destroy();
      handleError('请求超时', new Error('Connection timeout'), resolve);
    });
  });
}

// 处理错误
function handleError(message, error, resolve) {
  results.serverChecks.failed++;
  const errorObj = {
    time: new Date().toISOString(),
    message: message,
    error: error ? error.message : null
  };
  results.errors.push(errorObj);
  results.checkHistory.push({
    time: new Date().toISOString(),
    status: 'failed',
    error: message
  });
  
  log(`❌ 服务器健康检查失败: ${message}${error ? ' - ' + error.message : ''}`);
  resolve(false);
}

// 执行测试周期
async function runTestCycle() {
  await checkServerHealth();
  saveResults();
  
  // 记录统计信息
  if (results.serverChecks.total % 10 === 0) {
    const successRate = (results.serverChecks.successful / results.serverChecks.total * 100).toFixed(1);
    log(`📊 测试统计: 总检查=${results.serverChecks.total}, 成功=${results.serverChecks.successful}, 失败=${results.serverChecks.failed}, 成功率=${successRate}%`);
  }
}

// 主函数
function startTest() {
  log('========================================');
  log('开始基础稳定性测试');
  log('测试时长: 30分钟');
  log('检查间隔: 30秒');
  log('========================================');
  
  // 立即执行一次检查
  runTestCycle();
  
  // 设置定期检查
  const interval = setInterval(runTestCycle, CHECK_INTERVAL);
  
  // 设置测试结束
  setTimeout(() => {
    clearInterval(interval);
    results.serviceStatus = 'completed';
    
    const successRate = (results.serverChecks.successful / results.serverChecks.total * 100).toFixed(1);
    const uptime = ((Date.now() - new Date(results.startTime).getTime()) / 60000).toFixed(1);
    
    log('========================================');
    log('测试完成！');
    log(`测试时长: ${uptime}分钟`);
    log(`总检查次数: ${results.serverChecks.total}`);
    log(`成功次数: ${results.serverChecks.successful}`);
    log(`失败次数: ${results.serverChecks.failed}`);
    log(`成功率: ${successRate}%`);
    log(`错误数量: ${results.errors.length}`);
    
    if (results.errors.length === 0 && results.serverChecks.failed === 0) {
      log('🎉 测试通过！服务器稳定性良好');
      results.overallStatus = 'success';
    } else if (results.serverChecks.failed < results.serverChecks.total * 0.1) {
      log('⚠️  测试通过，但有少量失败，建议进一步检查');
      results.overallStatus = 'stable';
    } else {
      log('❌ 测试未通过，服务器稳定性存在问题');
      results.overallStatus = 'unstable';
    }
    
    log('========================================');
    saveResults();
    
  }, TEST_DURATION);
  
  // 处理退出信号
  process.on('SIGINT', () => {
    clearInterval(interval);
    log('收到退出信号，正在保存测试结果...');
    saveResults();
    process.exit(0);
  });
}

// 启动测试
startTest();