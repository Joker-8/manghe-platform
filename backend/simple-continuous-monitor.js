// 简单持续监控脚本
import http from 'http';
import fs from 'fs';

// 配置
const CHECK_INTERVAL = 30000; // 30秒检查一次
const LOG_FILE = './test-reports/continuous-monitor-log.txt';

// 确保目录存在
if (!fs.existsSync('./test-reports')) {
  fs.mkdirSync('./test-reports', { recursive: true });
}

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

// 检查服务器健康状态
function checkServerHealth() {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3004/api/health', {
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => data += chunk);
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            log(`✅ 服务器健康检查成功: 状态码=${res.statusCode}, 响应时间=${responseTime}ms, 消息="${jsonData.message}"`);
            resolve({ success: true, responseTime, statusCode: res.statusCode });
          } catch (parseError) {
            log(`❌ 服务器健康检查失败: 响应解析失败 - ${parseError.message}`);
            resolve({ success: false, error: '响应解析失败' });
          }
        } else {
          log(`❌ 服务器健康检查失败: 状态码错误 ${res.statusCode}`);
          resolve({ success: false, statusCode: res.statusCode, error: '状态码错误' });
        }
      });
    });
    
    req.on('error', (err) => {
      log(`❌ 服务器健康检查失败: HTTP请求错误 - ${err.message}`);
      resolve({ success: false, error: `HTTP请求错误: ${err.message}` });
    });
    
    req.on('timeout', () => {
      req.destroy();
      log('❌ 服务器健康检查失败: 请求超时');
      resolve({ success: false, error: '请求超时' });
    });
  });
}

// 主监控函数
async function startMonitoring() {
  log('========================================');
  log('开始持续服务器监控');
  log('检查间隔: 30秒');
  log('按Ctrl+C停止监控');
  log('========================================');
  
  // 立即执行一次检查
  await checkServerHealth();
  
  // 设置定期检查
  setInterval(checkServerHealth, CHECK_INTERVAL);
}

// 启动监控
startMonitoring().catch(err => {
  console.error('监控启动失败:', err);
});