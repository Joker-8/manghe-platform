// 服务监控脚本 - 用于诊断后端服务自动退出问题
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录路径（用于ES模块）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const CONFIG = {
  logFile: path.join(__dirname, 'monitor-logs.txt'),
  checkInterval: 30000, // 30秒检查一次
  servicePID: 7204, // 从netstat获取的PID
  port: 3004
};

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry);
  fs.appendFileSync(CONFIG.logFile, logEntry);
}

// 检查服务是否正在运行
function checkServiceRunning() {
  try {
    // 检查进程是否存在
    const output = execSync(`tasklist | findstr "${CONFIG.servicePID}"`).toString();
    const isRunning = output.includes('node.exe');
    
    log(`服务运行状态: ${isRunning ? '✅ 运行中' : '❌ 已停止'}`);
    return isRunning;
  } catch (error) {
    log(`❌ 检查服务状态失败: ${error.message}`);
    return false;
  }
}

// 检查端口是否在监听
function checkPortListening() {
  try {
    const output = execSync(`netstat -ano | findstr ":${CONFIG.port} LISTENING"`).toString();
    const isListening = output.includes(`:${CONFIG.port}`);
    
    log(`端口监听状态: ${isListening ? '✅ 正在监听' : '❌ 未监听'}`);
    return isListening;
  } catch (error) {
    log(`❌ 检查端口状态失败: ${error.message}`);
    return false;
  }
}

// 检查数据库连接状态的函数
async function checkDatabaseConnection() {
  try {
    // 创建一个简单的数据库连接测试脚本（使用ES模块）
    const testDbScript = `
      import { open } from 'sqlite';
      import sqlite3 from 'sqlite3';
      
      async function testConnection() {
        try {
          const db = await open({
            filename: 'data/manghe.db',
            driver: sqlite3.Database
          });
          
          const result = await db.get(
            'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"'
          );
          
          await db.close();
          console.log(JSON.stringify({connected: true, tableCount: result.count}));
        } catch (err) {
          console.log(JSON.stringify({connected: false, error: err.message}));
        }
      }
      
      testConnection();
    `;
    
    const tempScriptPath = path.join(__dirname, 'temp-db-check.js');
    fs.writeFileSync(tempScriptPath, testDbScript);
    
    const result = execSync(`node ${tempScriptPath}`).toString().trim();
    fs.unlinkSync(tempScriptPath); // 删除临时文件
    
    const dbStatus = JSON.parse(result);
    log(`数据库连接状态: ${dbStatus.connected ? '✅ 已连接' : '❌ 连接失败'}`);
    if (dbStatus.connected) {
      log(`数据库表数量: ${dbStatus.tableCount}`);
    } else {
      log(`数据库错误: ${dbStatus.error}`);
    }
    
    return dbStatus.connected;
  } catch (error) {
    log(`❌ 数据库连接测试失败: ${error.message}`);
    return false;
  }
}

// 主监控函数
async function monitor() {
  log('========================================');
  log('开始新的监控周期');
  
  const serviceRunning = checkServiceRunning();
  const portListening = checkPortListening();
  const dbConnected = await checkDatabaseConnection();
  
  // 记录内存使用情况
  try {
    const memoryInfo = execSync(`wmic process where ProcessId=${CONFIG.servicePID} get WorkingSetSize`).toString();
    const memoryMatch = memoryInfo.match(/\d+/);
    if (memoryMatch) {
      const memoryMB = (parseInt(memoryMatch[0]) / 1024 / 1024).toFixed(2);
      log(`服务内存使用: ${memoryMB} MB`);
    }
  } catch (e) {
    log(`❌ 无法获取内存使用情况: ${e.message}`);
  }
  
  // 检查是否有异常退出的迹象
  if (!serviceRunning || !portListening) {
    log('🚨 警告: 服务可能已异常退出或端口监听失败');
    
    // 尝试获取更多错误信息
    try {
      const eventLogs = execSync('wevtutil qe Application /q:"*[System[(EventID=1000 or EventID=1001)]]" /c:5 /f:text').toString();
      log('最近的应用程序错误日志:');
      log(eventLogs.substring(0, 1000) + '...'); // 只记录前1000个字符
    } catch (e) {
      log(`❌ 无法获取事件日志: ${e.message}`);
    }
  }
  
  log('监控周期结束');
  log('========================================');
}

// 初始化日志文件
fs.writeFileSync(CONFIG.logFile, `监控开始 - ${new Date().toISOString()}\n`);
log(`开始监控服务 PID: ${CONFIG.servicePID}, 端口: ${CONFIG.port}`);

// 立即执行一次监控
monitor();

// 设置定期监控
setInterval(monitor, CONFIG.checkInterval);

// 监听进程退出信号，确保记录最终状态
process.on('SIGINT', () => {
  log('监控脚本已停止');
  process.exit(0);
});