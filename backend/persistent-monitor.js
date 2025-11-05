// 持久化服务监控脚本 - 用于诊断后端服务自动退出问题
import fs from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录路径（用于ES模块）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置
const CONFIG = {
  logFile: path.join(__dirname, 'persistent-monitor-logs.txt'),
  checkInterval: 15000, // 15秒检查一次
  longTermCheckInterval: 300000, // 5分钟详细检查一次
  serviceCheckTimeout: 5000, // 服务检查超时时间
  maxLogSize: 10 * 1024 * 1024, // 10MB日志大小限制
  dbCheckScript: path.join(__dirname, 'db-check.js')
};

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(logEntry);
  
  // 检查日志文件大小
  try {
    const stats = fs.statSync(CONFIG.logFile);
    if (stats.size > CONFIG.maxLogSize) {
      // 备份旧日志
      fs.renameSync(CONFIG.logFile, CONFIG.logFile + '.old');
    }
  } catch (e) {
    // 文件可能不存在，忽略错误
  }
  
  fs.appendFileSync(CONFIG.logFile, logEntry);
}

// 获取服务信息函数
function getServiceInfo() {
  try {
    // 查找正在监听指定端口的进程
    const output = execSync('netstat -ano | findstr "LISTENING"').toString();
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes(':3004')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        try {
          const processInfo = execSync(`tasklist /fi "PID eq ${pid}"`).toString();
          if (processInfo.includes('node.exe')) {
            return { pid: parseInt(pid), port: 3004, running: true };
          }
        } catch (e) {
          log(`❌ 获取进程信息失败: ${e.message}`);
        }
      }
    }
    
    return { pid: null, port: null, running: false };
  } catch (error) {
    log(`❌ 获取服务信息失败: ${error.message}`);
    return { pid: null, port: null, running: false };
  }
}

// 检查服务是否正在运行
function checkServiceRunning() {
  try {
    const serviceInfo = getServiceInfo();
    
    if (serviceInfo.running) {
      log(`服务运行状态: ✅ 运行中 | PID: ${serviceInfo.pid} | 端口: ${serviceInfo.port}`);
      
      // 获取内存使用情况
      try {
        const memoryInfo = execSync(`wmic process where ProcessId=${serviceInfo.pid} get WorkingSetSize`).toString();
        const memoryMatch = memoryInfo.match(/\d+/);
        if (memoryMatch) {
          const memoryMB = (parseInt(memoryMatch[0]) / 1024 / 1024).toFixed(2);
          log(`服务内存使用: ${memoryMB} MB`);
        }
      } catch (e) {
        log(`❌ 无法获取内存使用情况: ${e.message}`);
      }
    } else {
      log(`服务运行状态: ❌ 已停止`);
      
      // 尝试重启服务
      restartService();
    }
    
    return serviceInfo;
  } catch (error) {
    log(`❌ 检查服务状态失败: ${error.message}`);
    return { pid: null, port: null, running: false };
  }
}

// 检查数据库连接状态
async function checkDatabaseConnection() {
  try {
    // 创建临时数据库检查脚本
    const dbCheckScriptContent = `
      import { open } from 'sqlite';
      import sqlite3 from 'sqlite3';
      
      async function testConnection() {
        try {
          const startTime = Date.now();
          const db = await open({
            filename: 'data/manghe.db',
            driver: sqlite3.Database
          });
          
          const result = await db.get(
            'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"'
          );
          
          // 测试数据库操作性能
          const queryTime = Date.now();
          await db.run('PRAGMA integrity_check');
          const checkTime = Date.now();
          
          await db.close();
          const endTime = Date.now();
          
          console.log(JSON.stringify({
            connected: true, 
            tableCount: result.count,
            connectTime: queryTime - startTime,
            queryTime: checkTime - queryTime,
            closeTime: endTime - checkTime,
            totalTime: endTime - startTime
          }));
        } catch (err) {
          console.log(JSON.stringify({connected: false, error: err.message}));
        }
      }
      
      testConnection();
    `;
    
    fs.writeFileSync(CONFIG.dbCheckScript, dbCheckScriptContent);
    
    // 执行数据库检查脚本
    const result = execSync(`node ${CONFIG.dbCheckScript}`, { timeout: 10000 }).toString().trim();
    fs.unlinkSync(CONFIG.dbCheckScript); // 删除临时文件
    
    const dbStatus = JSON.parse(result);
    
    if (dbStatus.connected) {
      log(`数据库连接状态: ✅ 已连接 | 表数量: ${dbStatus.tableCount}`);
      log(`数据库性能: 连接: ${dbStatus.connectTime}ms | 查询: ${dbStatus.queryTime}ms | 关闭: ${dbStatus.closeTime}ms | 总计: ${dbStatus.totalTime}ms`);
      
      // 检查数据库文件大小和修改时间
      try {
        const stats = fs.statSync(path.join(__dirname, 'data/manghe.db'));
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const lastModified = new Date(stats.mtime).toISOString();
        log(`数据库文件信息: 大小: ${fileSizeMB} MB | 最后修改: ${lastModified}`);
      } catch (e) {
        log(`❌ 获取数据库文件信息失败: ${e.message}`);
      }
    } else {
      log(`数据库连接状态: ❌ 连接失败`);
      log(`数据库错误: ${dbStatus.error}`);
    }
    
    return dbStatus.connected;
  } catch (error) {
    log(`❌ 数据库连接测试失败: ${error.message}`);
    return false;
  }
}

// 重启服务函数
function restartService() {
  try {
    log('🚨 尝试重启后端服务...');
    
    // 使用spawn而不是execSync，避免阻塞
    const { spawn } = require('child_process');
    const serverProcess = spawn('node', ['app.js'], {
      cwd: __dirname,
      detached: true,
      stdio: 'ignore'
    });
    
    serverProcess.unref();
    log('✅ 服务重启命令已发送');
    
    // 等待5秒后检查服务是否重启成功
    setTimeout(() => {
      const serviceInfo = getServiceInfo();
      if (serviceInfo.running) {
        log(`✅ 服务重启成功 | PID: ${serviceInfo.pid}`);
      } else {
        log('❌ 服务重启失败，5秒后再次尝试...');
        setTimeout(restartService, 5000);
      }
    }, 5000);
  } catch (error) {
    log(`❌ 重启服务失败: ${error.message}`);
  }
}

// 执行详细系统检查
async function performDetailedCheck() {
  log('🔍 执行详细系统检查...');
  
  // 检查系统资源
  try {
    const cpuInfo = execSync('wmic cpu get LoadPercentage').toString();
    const cpuMatch = cpuInfo.match(/\d+/);
    if (cpuMatch) {
      log(`系统CPU使用率: ${cpuMatch[0]}%`);
    }
  } catch (e) {
    log(`❌ 获取CPU使用率失败: ${e.message}`);
  }
  
  // 检查磁盘空间
  try {
    const diskInfo = execSync('wmic logicaldisk get FreeSpace,Size,DeviceID').toString();
    log('磁盘空间信息:');
    log(diskInfo.substring(0, 500) + '...'); // 只记录前500个字符
  } catch (e) {
    log(`❌ 获取磁盘空间信息失败: ${e.message}`);
  }
  
  // 检查网络连接
  try {
    const netInfo = execSync('netstat -an | findstr "ESTABLISHED" | findstr "3004"').toString();
    const connectionCount = netInfo.split('\n').filter(line => line.trim()).length;
    log(`服务当前连接数: ${connectionCount}`);
  } catch (e) {
    log(`❌ 获取网络连接信息失败: ${e.message}`);
  }
  
  log('详细系统检查完成');
}

// 主监控函数
async function monitor() {
  log('========================================');
  log('开始新的监控周期');
  
  const serviceInfo = checkServiceRunning();
  const dbConnected = await checkDatabaseConnection();
  
  // 检查是否有异常情况
  if (!serviceInfo.running || !dbConnected) {
    log('🚨 警告: 检测到异常情况！');
    
    // 执行详细检查
    await performDetailedCheck();
  }
  
  log('监控周期结束');
  log('========================================');
}

// 初始化日志文件
fs.writeFileSync(CONFIG.logFile, `持久化监控开始 - ${new Date().toISOString()}\n`);
log('🔍 启动持久化服务监控脚本...');

// 立即执行一次监控
monitor();

// 设置定期监控
setInterval(monitor, CONFIG.checkInterval);

// 设置定期详细检查
setInterval(performDetailedCheck, CONFIG.longTermCheckInterval);

// 监听进程退出信号，确保记录最终状态
process.on('SIGINT', () => {
  log('监控脚本已手动停止');
  process.exit(0);
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
  log(`❌ 监控脚本捕获到未处理异常: ${err.message}`);
  log(`❌ 异常堆栈: ${err.stack}`);
  // 继续运行，不退出
});

// 捕获Promise拒绝
process.on('unhandledRejection', (reason) => {
  log(`❌ 监控脚本捕获到Promise拒绝: ${reason}`);
  // 继续运行，不退出
});