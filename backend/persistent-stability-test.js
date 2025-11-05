import http from 'http';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// 配置
const TEST_DURATION = 30 * 60 * 1000; // 30分钟测试
const DB_CHECK_INTERVAL = 30000; // 30秒检查一次数据库
const HEALTH_CHECK_INTERVAL = 10000; // 10秒检查一次健康状态
const LOG_FILE = path.join(process.cwd(), 'test-reports', 'persistent-stability-report.txt');
const REPORT_FILE = path.join(process.cwd(), 'test-reports', 'persistent-test-results.json');

// 确保测试报告目录存在
function ensureTestDir() {
  const testDir = path.join(process.cwd(), 'test-reports');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
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

// 保存测试报告
function saveReport(results) {
  try {
    fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    log(`测试报告已保存: ${REPORT_FILE}`);
  } catch (error) {
    console.error('保存测试报告失败:', error);
  }
}

// 数据库初始化测试
async function testDatabaseInitialization(results) {
  log('开始数据库初始化测试...');
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'manghe.db'),
      driver: sqlite3.Database
    });
    
    // 检查表结构
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    results.database.tables = tables.map(table => table.name);
    log(`发现 ${tables.length} 个表: ${tables.map(t => t.name).join(', ')}`);
    
    // 检查索引
    const indexes = await db.all("SELECT name, tbl_name FROM sqlite_master WHERE type='index';");
    results.database.indexes = indexes.map(idx => `${idx.name} (${idx.tbl_name})`);
    log(`发现 ${indexes.length} 个索引`);
    
    // 检查所有表的数据
    const allTableStats = {};
    for (const table of tables) {
      try {
        const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
        allTableStats[table.name] = count.count;
        log(`${table.name} 表中有 ${count.count} 条记录`);
      } catch (err) {
        log(`检查 ${table.name} 表失败: ${err.message}`);
      }
    }
    results.database.tableStats = allTableStats;
    
    // 检查触发器
    const triggers = await db.all("SELECT name, tbl_name FROM sqlite_master WHERE type='trigger';");
    results.database.triggers = triggers.map(trig => `${trig.name} (${trig.tbl_name})`);
    log(`发现 ${triggers.length} 个触发器`);
    
    await db.close();
    results.database.initializationStatus = 'success';
    log('数据库初始化测试通过');
    
    // 验证表结构完整性
    const requiredTables = ['users', 'verification_codes', 'user_collections', 'user_follows'];
    const missingTables = requiredTables.filter(table => !tables.some(t => t.name === table));
    
    if (missingTables.length === 0) {
      results.database.structureValid = true;
      log('数据库结构完整性验证通过');
    } else {
      results.database.structureValid = false;
      results.database.missingTables = missingTables;
      log(`数据库结构验证失败，缺少表: ${missingTables.join(', ')}`);
    }
    
  } catch (error) {
    log(`数据库初始化测试失败: ${error.message}`);
    results.database.initializationStatus = 'failed';
    results.database.initializationError = error.message;
  }
}

// 数据库连接稳定性测试
async function testDatabaseConnection(results) {
  const checkTime = new Date();
  results.database.checks.total++;
  
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'manghe.db'),
      driver: sqlite3.Database
    });
    
    // 执行多个查询测试连接稳定性
    const testQueries = [
      'SELECT 1',
      'SELECT datetime() as current_time',
      'SELECT COUNT(*) as count FROM users'
    ];
    
    for (const query of testQueries) {
      await db.get(query);
    }
    
    // 测试事务处理
    await db.run('BEGIN TRANSACTION');
    await db.run('COMMIT');
    
    await db.close();
    
    results.database.checks.successful++;
    results.database.lastSuccessfulCheck = checkTime.toISOString();
    log('✅ 数据库连接检查成功');
    
    // 记录连接统计
    results.database.connectionHistory.push({
      time: checkTime.toISOString(),
      status: 'success',
      latency: Date.now() - checkTime.getTime()
    });
    
    return true;
  } catch (error) {
    results.database.checks.failed++;
    results.database.lastFailedCheck = checkTime.toISOString();
    results.database.errors.push({
      time: checkTime.toISOString(),
      message: error.message
    });
    log(`❌ 数据库连接检查失败: ${error.message}`);
    
    results.database.connectionHistory.push({
      time: checkTime.toISOString(),
      status: 'failed',
      error: error.message
    });
    
    return false;
  }
}

// 服务健康检查
async function testServiceHealth(results) {
  const startTime = Date.now();
  results.service.checks.total++;
  
  return new Promise((resolve) => {
    http.get('http://localhost:3004/api/health', {
      timeout: 5000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        results.service.responseTimes.push(responseTime);
        
        if (res.statusCode === 200) {
          try {
            const jsonResponse = JSON.parse(data);
            results.service.checks.successful++;
            results.service.lastSuccessfulCheck = new Date().toISOString();
            log(`✅ 服务健康检查成功，响应时间: ${responseTime}ms, 状态: ${jsonResponse.status}`);
            
            results.service.healthHistory.push({
              time: new Date().toISOString(),
              status: 'success',
              statusCode: res.statusCode,
              responseTime: responseTime,
              response: jsonResponse
            });
            
            resolve(true);
          } catch (parseError) {
            results.service.checks.failed++;
            log(`❌ 服务健康检查失败，响应解析错误: ${parseError.message}`);
            resolve(false);
          }
        } else {
          results.service.checks.failed++;
          results.service.lastFailedCheck = new Date().toISOString();
          log(`❌ 服务健康检查失败，状态码: ${res.statusCode}`);
          
          results.service.healthHistory.push({
            time: new Date().toISOString(),
            status: 'failed',
            statusCode: res.statusCode
          });
          
          resolve(false);
        }
      });
    }).on('error', (error) => {
      results.service.checks.failed++;
      results.service.lastFailedCheck = new Date().toISOString();
      results.service.errors.push({
        time: new Date().toISOString(),
        message: error.message
      });
      log(`❌ 服务健康检查错误: ${error.message}`);
      
      results.service.healthHistory.push({
        time: new Date().toISOString(),
        status: 'error',
        error: error.message
      });
      
      resolve(false);
    }).on('timeout', () => {
      results.service.checks.failed++;
      log(`❌ 服务健康检查超时`);
      resolve(false);
    });
  });
}

// 模拟数据库操作负载
async function simulateDatabaseLoad(results) {
  log('开始模拟数据库操作负载...');
  try {
    const db = await open({
      filename: path.join(process.cwd(), 'data', 'manghe.db'),
      driver: sqlite3.Database
    });
    
    // 执行一系列读取操作
    const operations = [];
    
    // 读取数据
    operations.push(db.all('SELECT * FROM users LIMIT 5'));
    operations.push(db.all('SELECT * FROM verification_codes LIMIT 5'));
    operations.push(db.get('SELECT COUNT(*) as count FROM user_collections'));
    operations.push(db.get('SELECT COUNT(*) as count FROM user_follows'));
    
    // 执行简单的统计查询
    operations.push(db.get('SELECT datetime() as current_time'));
    
    // 并行执行所有操作
    await Promise.all(operations);
    
    await db.close();
    
    results.service.loadTests.completed++;
    log('✅ 数据库负载测试完成');
    
    return true;
  } catch (error) {
    results.service.loadTests.failed++;
    results.service.loadTests.errors.push({
      time: new Date().toISOString(),
      message: error.message
    });
    log(`❌ 数据库负载测试失败: ${error.message}`);
    return false;
  }
}

// 监控进程状态
function monitorProcess(results) {
  const memoryUsage = process.memoryUsage();
  results.process.memoryHistory.push({
    time: new Date().toISOString(),
    heapUsed: memoryUsage.heapUsed / 1024 / 1024,
    heapTotal: memoryUsage.heapTotal / 1024 / 1024,
    rss: memoryUsage.rss / 1024 / 1024
  });
  
  // 记录内存使用
  if (results.process.memoryHistory.length % 6 === 0) { // 每60秒记录一次详细日志
    log(`📊 进程内存使用: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
  }
}

// 生成中期报告
function generateMidReport(results) {
  const midReport = {
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - new Date(results.startTime).getTime()) / 1000,
    database: {
      initializationStatus: results.database.initializationStatus,
      checks: { ...results.database.checks },
      lastSuccessfulCheck: results.database.lastSuccessfulCheck
    },
    service: {
      checks: { ...results.service.checks },
      avgResponseTime: results.service.responseTimes.length > 0 ? 
        results.service.responseTimes.reduce((a, b) => a + b, 0) / results.service.responseTimes.length : 0
    },
    process: {
      memoryUsage: results.process.memoryHistory[results.process.memoryHistory.length - 1] || null
    }
  };
  
  log(`📋 中期报告: 运行时间 ${midReport.uptime.toFixed(0)}秒, 数据库检查 ${midReport.database.checks.successful}/${midReport.database.checks.total}, 服务检查 ${midReport.service.checks.successful}/${midReport.service.checks.total}`);
  
  return midReport;
}

// 主测试函数
async function runTests() {
  ensureTestDir();
  
  // 初始化测试结果
  const results = {
    startTime: new Date().toISOString(),
    database: {
      tables: [],
      indexes: [],
      triggers: [],
      tableStats: {},
      initializationStatus: 'pending',
      initializationError: null,
      structureValid: false,
      missingTables: [],
      checks: {
        total: 0,
        successful: 0,
        failed: 0
      },
      lastSuccessfulCheck: null,
      lastFailedCheck: null,
      errors: [],
      connectionHistory: []
    },
    service: {
      checks: {
        total: 0,
        successful: 0,
        failed: 0
      },
      lastSuccessfulCheck: null,
      lastFailedCheck: null,
      responseTimes: [],
      errors: [],
      healthHistory: [],
      loadTests: {
        completed: 0,
        failed: 0,
        errors: []
      }
    },
    process: {
      memoryHistory: [],
      crashes: [],
      midReports: []
    },
    endTime: null,
    overallStatus: 'running'
  };
  
  log('========================================');
  log('开始持久性稳定性测试');
  log('测试时长: 30分钟');
  log('========================================');
  
  try {
    // 1. 首先测试数据库初始化
    await testDatabaseInitialization(results);
    
    // 2. 设置定期检查
    const dbCheckInterval = setInterval(() => testDatabaseConnection(results), DB_CHECK_INTERVAL);
    const healthCheckInterval = setInterval(() => testServiceHealth(results), HEALTH_CHECK_INTERVAL);
    const loadInterval = setInterval(() => simulateDatabaseLoad(results), 60000); // 每分钟一次
    const processInterval = setInterval(() => monitorProcess(results), 10000); // 每10秒监控进程
    const reportInterval = setInterval(() => {
      results.process.midReports.push(generateMidReport(results));
      saveReport(results); // 定期保存报告
    }, 5 * 60 * 1000); // 每5分钟生成一次中期报告
    
    // 3. 立即执行一次检查
    await testDatabaseConnection(results);
    await testServiceHealth(results);
    await simulateDatabaseLoad(results);
    monitorProcess(results);
    
    // 4. 设置测试结束
    const testTimeout = setTimeout(() => {
      clearInterval(dbCheckInterval);
      clearInterval(healthCheckInterval);
      clearInterval(loadInterval);
      clearInterval(processInterval);
      clearInterval(reportInterval);
      
      results.endTime = new Date().toISOString();
      results.overallStatus = calculateOverallStatus(results);
      
      log('========================================');
      log(`测试完成，持续时间: ${((Date.now() - new Date(results.startTime).getTime()) / 60000).toFixed(1)}分钟`);
      log(`数据库初始化状态: ${results.database.initializationStatus}`);
      log(`数据库连接检查: ${results.database.checks.successful}成功, ${results.database.checks.failed}失败`);
      log(`服务健康检查: ${results.service.checks.successful}成功, ${results.service.checks.failed}失败`);
      log(`数据库负载测试: ${results.service.loadTests.completed}完成, ${results.service.loadTests.failed}失败`);
      log(`进程崩溃: ${results.process.crashes.length}次`);
      log(`总体状态: ${results.overallStatus}`);
      log('========================================');
      
      saveReport(results);
      process.exit(0);
    }, TEST_DURATION);
    
    // 5. 处理进程信号
    process.on('SIGINT', () => {
      log('收到中断信号，正在保存测试报告...');
      clearTimeout(testTimeout);
      saveReport(results);
      process.exit(0);
    });
    
    // 6. 监控未捕获异常
    process.on('uncaughtException', (error) => {
      const crashTime = new Date().toISOString();
      results.process.crashes.push({
        time: crashTime,
        error: error.message,
        stack: error.stack
      });
      log(`❌ 未捕获异常: ${error.message}`);
      saveReport(results);
      process.exit(1);
    });
    
  } catch (error) {
    log(`测试启动失败: ${error.message}`);
    results.overallStatus = 'failed';
    results.endTime = new Date().toISOString();
    saveReport(results);
  }
}

// 计算总体状态
function calculateOverallStatus(results) {
  if (results.database.initializationStatus === 'failed') return 'failed';
  if (!results.database.structureValid) return 'degraded';
  if (results.database.checks.failed > 3) return 'degraded';
  if (results.service.checks.failed > 10) return 'degraded';
  if (results.process.crashes.length > 0) return 'failed';
  
  // 计算成功率
  const dbSuccessRate = results.database.checks.total > 0 ? 
    results.database.checks.successful / results.database.checks.total : 1;
  const serviceSuccessRate = results.service.checks.total > 0 ? 
    results.service.checks.successful / results.service.checks.total : 1;
  
  if (dbSuccessRate >= 0.95 && serviceSuccessRate >= 0.95) return 'success';
  if (dbSuccessRate >= 0.8 && serviceSuccessRate >= 0.8) return 'stable';
  
  return 'degraded';
}

// 启动测试
log('测试脚本启动...');
runTests();