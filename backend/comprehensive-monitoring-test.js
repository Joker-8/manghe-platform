import http from 'http';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';

// 配置
const TEST_DURATION = 30 * 60 * 1000; // 30分钟测试
const DB_CHECK_INTERVAL = 30000; // 30秒检查一次数据库
const HEALTH_CHECK_INTERVAL = 10000; // 10秒检查一次健康状态
const LOG_FILE = path.join(process.cwd(), 'test-reports', 'stability-test-report.txt');
const REPORT_FILE = path.join(process.cwd(), 'test-reports', 'final-test-report.json');

// 测试结果数据结构
const testResults = {
  startTime: new Date().toISOString(),
  databaseInitialization: {
    status: 'pending',
    tables: [],
    indexes: [],
    constraints: [],
    initialData: {},
    error: null
  },
  connectionStability: {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    failureTimes: [],
    connectionPoolStats: [],
    errors: []
  },
  processStability: {
    running: true,
    memoryUsage: [],
    cpuUsage: [],
    crashes: [],
    restarts: [],
    uptime: null
  },
  serviceHealth: {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    responseTimes: [],
    errors: []
  },
  endTime: null,
  overallStatus: 'running'
};

// 确保测试报告目录存在
function ensureTestDir() {
  const testDir = path.join(process.cwd(), 'test-reports');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    log('测试报告目录已创建');
  }
}

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// 保存测试报告
function saveReport() {
  try {
    testResults.endTime = new Date().toISOString();
    testResults.overallStatus = calculateOverallStatus();
    
    fs.writeFileSync(REPORT_FILE, JSON.stringify(testResults, null, 2));
    log(`测试报告已保存: ${REPORT_FILE}`);
  } catch (error) {
    console.error('保存测试报告失败:', error);
  }
}

// 计算总体状态
function calculateOverallStatus() {
  if (testResults.databaseInitialization.status === 'failed') return 'failed';
  if (testResults.connectionStability.failedChecks > 3) return 'degraded';
  if (testResults.serviceHealth.failedChecks > 5) return 'degraded';
  if (testResults.processStability.crashes.length > 0) return 'failed';
  return 'success';
}

// 数据库初始化测试
async function testDatabaseInitialization() {
  log('开始数据库初始化测试...');
  try {
    // 连接到数据库
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'manghe.db'),
      driver: sqlite3.Database
    });
    
    // 检查表结构
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    testResults.databaseInitialization.tables = tables.map(table => table.name);
    log(`发现 ${tables.length} 个表: ${tables.map(t => t.name).join(', ')}`);
    
    // 检查索引
    const indexes = await db.all("SELECT name, tbl_name FROM sqlite_master WHERE type='index';");
    testResults.databaseInitialization.indexes = indexes;
    log(`发现 ${indexes.length} 个索引`);
    
    // 检查现有表的数据
    const keyTables = ['users', 'verification_codes', 'user_collections', 'user_follows'];
    for (const table of keyTables) {
      try {
        const count = await db.get(`SELECT COUNT(*) as count FROM ${table}`);
        testResults.databaseInitialization.initialData[table] = count.count;
        log(`${table} 表中有 ${count.count} 条记录`);
      } catch (err) {
        log(`检查 ${table} 表失败: ${err.message}`);
      }
    }
    
    await db.close();
    testResults.databaseInitialization.status = 'success';
    log('数据库初始化测试通过');
  } catch (error) {
    log(`数据库初始化测试失败: ${error.message}`);
    testResults.databaseInitialization.status = 'failed';
    testResults.databaseInitialization.error = error.message;
  }
}

// 数据库连接稳定性测试
async function testDatabaseConnection() {
  const checkTime = new Date();
  testResults.connectionStability.totalChecks++;
  
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'manghe.db'),
      driver: sqlite3.Database
    });
    
    // 执行简单查询测试连接
    await db.get('SELECT 1');
    await db.close();
    
    testResults.connectionStability.successfulChecks++;
    log('数据库连接检查成功');
    
    // 记录内存使用情况
    const memoryUsage = process.memoryUsage();
    testResults.processStability.memoryUsage.push({
      timestamp: checkTime.toISOString(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal
    });
  } catch (error) {
    testResults.connectionStability.failedChecks++;
    testResults.connectionStability.failureTimes.push(checkTime.toISOString());
    testResults.connectionStability.errors.push(error.message);
    log(`数据库连接检查失败: ${error.message}`);
  }
}

// 服务健康检查
function testServiceHealth() {
  const startTime = Date.now();
  testResults.serviceHealth.totalChecks++;
  
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/health', (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      testResults.serviceHealth.responseTimes.push(responseTime);
      
      if (res.statusCode === 200) {
        testResults.serviceHealth.successfulChecks++;
        log(`服务健康检查成功，响应时间: ${responseTime}ms`);
      } else {
        testResults.serviceHealth.failedChecks++;
        testResults.serviceHealth.errors.push(`状态码 ${res.statusCode}`);
        log(`服务健康检查失败，状态码: ${res.statusCode}`);
      }
      
      res.resume(); // 消耗响应流
      resolve();
    }).on('error', (error) => {
      testResults.serviceHealth.failedChecks++;
      testResults.serviceHealth.errors.push(error.message);
      log(`服务健康检查错误: ${error.message}`);
      resolve();
    });
  });
}

// 模拟数据库操作负载
async function simulateDatabaseLoad() {
  log('开始模拟数据库操作负载...');
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'manghe.db'),
      driver: sqlite3.Database
    });
    
    // 执行一些读取操作
    await Promise.all([
      db.all('SELECT * FROM users LIMIT 10'),
      db.all('SELECT * FROM verification_codes LIMIT 10'),
      db.get('SELECT COUNT(*) as count FROM user_collections'),
      db.get('SELECT datetime() as current_time')
    ]);
    
    await db.close();
    log('数据库负载测试完成');
  } catch (error) {
    log(`数据库负载测试失败: ${error.message}`);
  }
}

// 主测试函数
async function runTests() {
  ensureTestDir();
  log('========================================');
  log('开始系统性稳定性测试');
  log('测试时长: 30分钟');
  log('========================================');
  
  // 1. 首先测试数据库初始化
  await testDatabaseInitialization();
  
  // 2. 设置定期检查
  const dbCheckInterval = setInterval(testDatabaseConnection, DB_CHECK_INTERVAL);
  const healthCheckInterval = setInterval(testServiceHealth, HEALTH_CHECK_INTERVAL);
  const loadInterval = setInterval(simulateDatabaseLoad, 60000); // 每分钟模拟一次负载
  
  // 3. 初始检查
  await testDatabaseConnection();
  await testServiceHealth();
  await simulateDatabaseLoad();
  
  // 4. 测试超时
  setTimeout(() => {
    clearInterval(dbCheckInterval);
    clearInterval(healthCheckInterval);
    clearInterval(loadInterval);
    
    testResults.processStability.uptime = (Date.now() - new Date(testResults.startTime).getTime()) / 1000; // 秒
    log('========================================');
    log(`测试完成，持续时间: ${testResults.processStability.uptime.toFixed(2)}秒`);
    log(`数据库初始化状态: ${testResults.databaseInitialization.status}`);
    log(`数据库连接检查: ${testResults.connectionStability.successfulChecks}成功, ${testResults.connectionStability.failedChecks}失败`);
    log(`服务健康检查: ${testResults.serviceHealth.successfulChecks}成功, ${testResults.serviceHealth.failedChecks}失败`);
    log(`进程崩溃: ${testResults.processStability.crashes.length}次`);
    log(`总体状态: ${calculateOverallStatus()}`);
    log('========================================');
    
    saveReport();
    
    // 如果测试全部通过，可以退出
    if (calculateOverallStatus() === 'success') {
      log('测试全部通过！');
    } else {
      log('测试发现问题，请查看详细报告');
    }
  }, TEST_DURATION);
  
  // 5. 处理进程信号
  process.on('SIGINT', () => {
    log('收到中断信号，正在保存测试报告...');
    saveReport();
    process.exit(0);
  });
  
  // 6. 监控进程状态
  process.on('uncaughtException', (error) => {
    const crashTime = new Date().toISOString();
    testResults.processStability.crashes.push({
      time: crashTime,
      error: error.message,
      stack: error.stack
    });
    log(`未捕获异常: ${error.message}`);
    saveReport();
  });
}

// 启动测试
runTests().catch(error => {
  log(`测试启动失败: ${error.message}`);
});