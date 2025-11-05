import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

// 日志功能
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  // 写入日志文件
  fs.appendFileSync('./daemon.log', logMessage, 'utf8');
}

// 配置
const config = {
  maxRestarts: 10,         // 最大重启次数
  restartWindow: 60000,    // 重启窗口（毫秒）
  minUptime: 5000,         // 最小正常运行时间，如果低于此值则认为是崩溃
  appPath: './app.js',     // 应用程序路径
};

// 重启计数器
let restartCount = 0;
let firstRestartTime = null;
let serverProcess = null;
let lastStartTime = null;

// 清理资源函数
function cleanupResources() {
  log('正在清理资源...');
  // 可以在这里添加其他清理逻辑
}

// 启动服务器
function startServer() {
  log('正在启动后端服务...');
  lastStartTime = performance.now();
  
  serverProcess = spawn('node', [config.appPath], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env }
  });

  // 捕获标准输出
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      log(`[SERVER] ${output}`);
    }
  });

  // 捕获标准错误
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      log(`[SERVER-ERROR] ${output}`);
    }
  });

  // 监听进程退出
  serverProcess.on('close', (code, signal) => {
    log(`服务进程退出，退出码: ${code}, 信号: ${signal}`);
    serverProcess = null;
    
    // 检查运行时间，判断是正常退出还是崩溃
    const uptime = performance.now() - lastStartTime;
    
    if (uptime < config.minUptime) {
      log(`警告: 服务运行时间过短(${Math.round(uptime)}ms)，可能是崩溃`);
      handleRestart();
    } else if (code !== 0) {
      // 只有非正常退出时才重启
      log(`服务非正常退出，运行时间: ${Math.round(uptime)}ms，将重启服务`);
      handleRestart();
    } else {
      log(`服务正常退出，运行时间: ${Math.round(uptime)}ms，不会自动重启`);
      // 记录并结束，不再自动重启
    }
  });

  // 监听错误
  serverProcess.on('error', (err) => {
    log(`启动服务失败: ${err.message}`);
    setTimeout(handleRestart, 1000);
  });
}

// 处理重启逻辑
function handleRestart() {
  // 检查重启频率
  const now = Date.now();
  
  if (firstRestartTime === null || now - firstRestartTime > config.restartWindow) {
    // 重置计数器
    firstRestartTime = now;
    restartCount = 1;
  } else {
    restartCount++;
  }

  // 检查是否超过最大重启次数
  if (restartCount > config.maxRestarts) {
    log(`错误: 在 ${config.restartWindow/1000} 秒内重启次数超过 ${config.maxRestarts} 次，停止重启`);
    cleanupResources();
    process.exit(1);
  }

  log(`准备重启服务 (第 ${restartCount}/${config.maxRestarts} 次)，${config.restartWindow/1000} 秒内`);
  
  // 延迟重启，避免频繁重启
  setTimeout(() => {
    startServer();
  }, 1000);
}

// 优雅关闭处理
function gracefulShutdown() {
  log('收到关闭信号，正在优雅关闭...');
  
  if (serverProcess) {
    log('正在关闭子进程...');
    serverProcess.kill('SIGTERM');
    
    // 等待子进程退出
    const killTimeout = setTimeout(() => {
      log('强制终止子进程...');
      serverProcess.kill('SIGKILL');
    }, 5000);

    serverProcess.on('close', () => {
      clearTimeout(killTimeout);
      log('子进程已关闭');
      cleanupResources();
      process.exit(0);
    });
  } else {
    cleanupResources();
    process.exit(0);
  }
}

// 监听系统信号
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// 捕获未处理的错误
process.on('uncaughtException', (err) => {
  log(`守护进程发生未捕获异常: ${err.message}\n${err.stack}`);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason) => {
  log(`守护进程发生未处理的Promise拒绝: ${reason}`);
});

// 主程序启动
log('====================================');
log('后端服务守护进程启动');
log(`最大重启次数: ${config.maxRestarts}`);
log(`重启窗口: ${config.restartWindow/1000}秒`);
log(`最小正常运行时间: ${config.minUptime/1000}秒`);
log('====================================');

// 创建日志目录
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// 启动应用
startServer();

// 定期输出守护进程状态
setInterval(() => {
  const status = serverProcess ? '运行中' : '未运行';
  const uptime = Math.round(process.uptime());
  log(`守护进程状态: ${status}, 运行时间: ${uptime}秒, 重启次数: ${restartCount}`);
}, 60000); // 每分钟输出一次状态