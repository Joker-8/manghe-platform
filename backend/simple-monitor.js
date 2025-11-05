// 简单监控脚本 - 专注于记录服务和数据库状态
import fs from 'fs';
import { execSync } from 'child_process';

// 配置
const LOG_FILE = 'simple-monitor-logs.txt';
const CHECK_INTERVAL = 10000; // 10秒检查一次

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry);
  fs.appendFileSync(LOG_FILE, logEntry);
}

// 检查服务状态
function checkService() {
  try {
    // 检查端口3004是否在监听
    const netstatOutput = execSync('netstat -ano | findstr ":3004 LISTENING"').toString();
    const isListening = netstatOutput.includes(':3004');
    
    if (isListening) {
      // 提取PID
      const parts = netstatOutput.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      
      // 检查进程是否存在
      const tasklistOutput = execSync(`tasklist | findstr "${pid}"`).toString();
      const isRunning = tasklistOutput.includes('node.exe');
      
      if (isRunning) {
        // 获取内存使用情况
        const memoryInfo = execSync(`wmic process where ProcessId=${pid} get WorkingSetSize`).toString();
        const memoryMatch = memoryInfo.match(/\d+/);
        const memoryMB = memoryMatch ? (parseInt(memoryMatch[0]) / 1024 / 1024).toFixed(2) : 'Unknown';
        
        log(`✅ 服务运行正常 | PID: ${pid} | 内存: ${memoryMB} MB`);
        return { running: true, pid, memoryMB };
      } else {
        log('❌ 端口在监听但进程不存在');
      }
    } else {
      log('❌ 服务未运行 - 端口3004未监听');
    }
  } catch (error) {
    log(`❌ 检查服务状态失败: ${error.message}`);
  }
  
  return { running: false, pid: null, memoryMB: null };
}

// 检查数据库文件
function checkDatabase() {
  try {
    // 检查数据库文件是否存在
    if (fs.existsSync('data/manghe.db')) {
      const stats = fs.statSync('data/manghe.db');
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
      const lastModified = new Date(stats.mtime).toISOString();
      log(`📊 数据库文件存在 | 大小: ${fileSizeMB} MB | 最后修改: ${lastModified}`);
      return true;
    } else {
      log('❌ 数据库文件不存在');
    }
  } catch (error) {
    log(`❌ 检查数据库失败: ${error.message}`);
  }
  return false;
}

// 主监控函数
function monitor() {
  log('====================================');
  log('开始监控检查');
  
  const serviceStatus = checkService();
  const dbExists = checkDatabase();
  
  if (!serviceStatus.running) {
    log('🚨 警告: 服务未运行! 尝试重启...');
    try {
      // 尝试重启服务
      execSync('start /B node app.js', { shell: true });
      log('✅ 已尝试重启服务');
    } catch (e) {
      log(`❌ 重启服务失败: ${e.message}`);
    }
  }
  
  log('监控检查完成');
  log('====================================');
}

// 初始化
log('开始简单监控脚本');
log(`检查间隔: ${CHECK_INTERVAL/1000}秒`);

// 立即执行一次检查
monitor();

// 设置定期检查
setInterval(monitor, CHECK_INTERVAL);

// 确保脚本不会退出
process.stdin.resume();

// 捕获信号
process.on('SIGINT', () => {
  log('监控脚本已停止');
  process.exit(0);
});