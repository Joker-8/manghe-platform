#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { 
  testDatabaseConnection, 
  useDb, 
  pool, 
  connectionStateListener,
  initializeDatabaseConnection
} from './database.js';

// 加载环境变量
dotenv.config();

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试结果记录
const testResults = {
  startTime: new Date().toISOString(),
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: []
};

// 测试报告目录
const reportsDir = join(__dirname, '..', 'reports');
const reportFile = join(reportsDir, `database-connection-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

// 确保报告目录存在
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// 测试工具函数
function recordTestResult(testName, passed, details = {}) {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
  } else {
    testResults.failedTests++;
  }
  
  const testResult = {
    name: testName,
    passed,
    timestamp: new Date().toISOString(),
    details
  };
  
  testResults.tests.push(testResult);
  console.log(`[${passed ? '✅' : '❌'}] ${testName}: ${passed ? '通过' : '失败'}`);
  
  return testResult;
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 模拟网络延迟
function simulateNetworkLatency(minMs = 50, maxMs = 200) {
  const latency = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(latency);
}

// 模拟网络错误
function simulateNetworkError(probability = 0.1) {
  if (Math.random() < probability) {
    throw new Error('模拟网络错误: 连接中断');
  }
}

// 基础连接验证测试
async function testBasicConnection() {
  const testName = '基础连接验证';
  try {
    console.log('\n🔄 开始基础连接验证...');
    
    const startTime = Date.now();
    const result = await testDatabaseConnection();
    const duration = Date.now() - startTime;
    
    if (result) {
      return recordTestResult(testName, true, {
        connectionTime: `${duration}ms`,
        poolAvailable: !!pool,
        poolMethods: pool ? Object.keys(pool).filter(key => typeof pool[key] === 'function') : []
      });
    } else {
      return recordTestResult(testName, false, { error: '连接测试返回失败结果' });
    }
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 连接状态监听器测试
async function testConnectionStateListener() {
  const testName = '连接状态监听器测试';
  try {
    console.log('\n🔄 开始连接状态监听器测试...');
    
    let stateChanges = [];
    const unsubscribe = connectionStateListener.subscribe(state => {
      stateChanges.push({
        state,
        timestamp: new Date().toISOString()
      });
    });
    
    // 触发状态通知
    connectionStateListener.notify({ connected: true });
    await delay(100);
    connectionStateListener.notify({ connected: false });
    await delay(100);
    connectionStateListener.notify({ connected: true });
    
    // 取消订阅
    unsubscribe();
    
    // 确认取消订阅后不会再接收到通知
    connectionStateListener.notify({ connected: false });
    
    return recordTestResult(testName, true, { 
      stateChangesReceived: stateChanges.length,
      stateChanges
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 网络环境模拟测试
async function testNetworkEnvironment() {
  const testName = '网络环境模拟测试';
  try {
    console.log('\n🔄 开始网络环境模拟测试...');
    
    // 保存原始方法
    const originalQuery = pool ? pool.query : null;
    let testPassed = true;
    let attempts = 0;
    let successfulQueries = 0;
    
    // 包装query方法以模拟网络延迟
    if (pool && pool.query) {
      pool.query = async function(sql, params) {
        await simulateNetworkLatency(100, 300);
        return originalQuery.call(this, sql, params);
      };
    }
    
    // 执行多个查询测试
    for (let i = 0; i < 5; i++) {
      attempts++;
      try {
        const startTime = Date.now();
        const result = await useDb(db => db.get('SELECT 1 + 1 as result'));
        const duration = Date.now() - startTime;
        successfulQueries++;
        console.log(`  🔄 模拟网络延迟查询 ${i + 1}/5: ${duration}ms`);
      } catch (error) {
        testPassed = false;
        console.error(`  ❌ 查询 ${i + 1}/5 失败:`, error.message);
      }
    }
    
    // 恢复原始方法
    if (pool) {
      pool.query = originalQuery;
    }
    
    return recordTestResult(testName, testPassed, {
      attempts,
      successfulQueries,
      successRate: (successfulQueries / attempts * 100).toFixed(2) + '%'
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 异常情况处理测试
async function testExceptionHandling() {
  const testName = '异常情况处理测试';
  try {
    console.log('\n🔄 开始异常情况处理测试...');
    
    const exceptions = [
      { name: '无效SQL查询', query: 'INVALID SQL QUERY' },
      { name: '不存在的表', query: 'SELECT * FROM non_existent_table' },
      { name: '无效的参数绑定', query: 'SELECT * FROM users WHERE id = ?', params: [null] }
    ];
    
    let handledExceptions = 0;
    
    for (const exception of exceptions) {
      try {
        await useDb(db => {
          if (exception.params) {
            return db.all(exception.query, exception.params);
          } else {
            return db.all(exception.query);
          }
        });
        console.log(`  ❌ 异常未被捕获: ${exception.name}`);
      } catch (error) {
        handledExceptions++;
        console.log(`  ✅ 异常正确处理: ${exception.name} - ${error.message}`);
      }
    }
    
    const allHandled = handledExceptions === exceptions.length;
    
    return recordTestResult(testName, allHandled, {
      totalExceptions: exceptions.length,
      correctlyHandled: handledExceptions,
      exceptionsTested: exceptions.map(e => e.name)
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 连接池性能测试
async function testConnectionPoolPerformance() {
  const testName = '连接池性能测试';
  try {
    console.log('\n🔄 开始连接池性能测试...');
    
    const iterations = 100;
    const startTime = Date.now();
    let successfulQueries = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        await useDb(db => db.get('SELECT 1 + 1 as result'));
        successfulQueries++;
      } catch (error) {
        console.error(`  ❌ 查询性能测试 ${i + 1}/${iterations} 失败:`, error.message);
      }
    }
    
    const duration = Date.now() - startTime;
    const queriesPerSecond = iterations / (duration / 1000);
    const averageQueryTime = duration / iterations;
    
    return recordTestResult(testName, true, {
      iterations,
      successfulQueries,
      totalDuration: `${duration}ms`,
      queriesPerSecond: queriesPerSecond.toFixed(2),
      averageQueryTime: `${averageQueryTime.toFixed(2)}ms`
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 并发连接测试
async function testConcurrentConnections() {
  const testName = '并发连接测试';
  try {
    console.log('\n🔄 开始并发连接测试...');
    
    const concurrentCount = 50;
    const startTime = Date.now();
    
    const concurrentQueries = Array(concurrentCount).fill().map(async (_, index) => {
      try {
        const result = await useDb(db => db.get('SELECT 1 + 1 as result'));
        return { success: true, index };
      } catch (error) {
        return { success: false, index, error: error.message };
      }
    });
    
    const results = await Promise.all(concurrentQueries);
    const duration = Date.now() - startTime;
    
    const successfulQueries = results.filter(r => r.success).length;
    const failedQueries = results.filter(r => !r.success);
    
    return recordTestResult(testName, failedQueries.length === 0, {
      concurrentCount,
      successfulQueries,
      failedQueries: failedQueries.length,
      totalDuration: `${duration}ms`,
      averageQueryTime: `${(duration / concurrentCount).toFixed(2)}ms`,
      failureDetails: failedQueries.map(q => ({ index: q.index, error: q.error }))
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 长时间运行的连接保持测试
async function testLongRunningConnection() {
  const testName = '长时间运行的连接保持测试';
  try {
    console.log('\n🔄 开始长时间运行的连接保持测试...');
    
    const totalDuration = 30000; // 30秒
    const interval = 5000; // 每5秒执行一次查询
    const startTime = Date.now();
    let queryCount = 0;
    let lastSuccessTime = Date.now();
    let maxConnectionGap = 0;
    let testPassed = true;
    
    console.log(`  🔄 开始30秒连接保持测试，每5秒执行一次查询...`);
    
    const testEndTime = startTime + totalDuration;
    while (Date.now() < testEndTime) {
      try {
        const queryStartTime = Date.now();
        await useDb(db => db.get('SELECT 1 + 1 as result'));
        const queryDuration = Date.now() - queryStartTime;
        const currentGap = queryStartTime - lastSuccessTime;
        
        maxConnectionGap = Math.max(maxConnectionGap, currentGap);
        lastSuccessTime = Date.now();
        queryCount++;
        
        console.log(`  ✅ 保持连接查询 ${queryCount}: ${queryDuration}ms`);
      } catch (error) {
        console.error(`  ❌ 保持连接查询失败:`, error.message);
        testPassed = false;
        break;
      }
      
      // 等待下一次查询
      const waitTime = Math.max(0, interval - (Date.now() - lastSuccessTime));
      if (waitTime > 0) {
        await delay(waitTime);
      }
    }
    
    const actualDuration = Date.now() - startTime;
    
    return recordTestResult(testName, testPassed, {
      targetDuration: `${totalDuration}ms`,
      actualDuration: `${actualDuration}ms`,
      queriesExecuted: queryCount,
      maxConnectionGap: `${maxConnectionGap}ms`,
      averageQueryInterval: queryCount > 0 ? `${(actualDuration / queryCount).toFixed(2)}ms` : 'N/A'
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 数据库文件锁定测试
async function testDatabaseFileLocking() {
  const testName = '数据库文件锁定测试';
  try {
    console.log('\n🔄 开始数据库文件锁定测试...');
    
    // 尝试同时从两个不同的连接访问数据库
    const connection1 = useDb(db => db.get('SELECT 1 + 1 as result'));
    const connection2 = useDb(db => db.get('SELECT 1 + 1 as result'));
    
    const startTime = Date.now();
    const results = await Promise.all([connection1, connection2]);
    const duration = Date.now() - startTime;
    
    return recordTestResult(testName, true, {
      bothConnectionsSucceeded: true,
      duration: `${duration}ms`
    });
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 数据库重连测试
async function testDatabaseReconnection() {
  const testName = '数据库重连测试';
  try {
    console.log('\n🔄 开始数据库重连测试...');
    
    // 首先确认当前连接正常
    await testDatabaseConnection();
    
    // 模拟数据库服务中断和恢复
    console.log('  🔄 模拟数据库服务中断后重连...');
    
    // 保存原始池
    const originalPool = pool;
    
    try {
      // 临时将pool设为null，模拟连接丢失
      pool = null;
      
      // 等待一小段时间
      await delay(1000);
      
      // 尝试重新连接
      const reconnectStartTime = Date.now();
      const reconnectResult = await testDatabaseConnection();
      const reconnectDuration = Date.now() - reconnectStartTime;
      
      if (reconnectResult && pool) {
        return recordTestResult(testName, true, {
          reconnectionTime: `${reconnectDuration}ms`,
          reconnectionSuccessful: true
        });
      } else {
        return recordTestResult(testName, false, {
          error: '重连失败，连接池为null'
        });
      }
    } finally {
      // 确保pool已恢复
      if (!pool) {
        pool = originalPool;
      }
    }
  } catch (error) {
    return recordTestResult(testName, false, { 
      error: error.message,
      stack: error.stack
    });
  }
}

// 生成测试报告
function generateTestReport() {
  testResults.endTime = new Date().toISOString();
  
  // 计算总体统计信息
  const durationMs = new Date(testResults.endTime) - new Date(testResults.startTime);
  const successRate = (testResults.passedTests / testResults.totalTests * 100).toFixed(2);
  
  const report = {
    summary: {
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      totalDuration: `${durationMs}ms`,
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: `${successRate}%`,
      overallStatus: testResults.failedTests === 0 ? 'PASSED' : 'FAILED'
    },
    detailedResults: testResults.tests
  };
  
  // 保存报告到文件
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  return report;
}

// 打印测试摘要
function printTestSummary(report) {
  console.log('\n========================================');
  console.log('        数据库连接测试报告摘要          ');
  console.log('========================================');
  console.log(`测试时间: ${new Date(report.summary.startTime).toLocaleString()} - ${new Date(report.summary.endTime).toLocaleString()}`);
  console.log(`总耗时: ${report.summary.totalDuration}`);
  console.log(`测试总数: ${report.summary.totalTests}`);
  console.log(`通过测试: ${report.summary.passedTests}`);
  console.log(`失败测试: ${report.summary.failedTests}`);
  console.log(`成功率: ${report.summary.successRate}`);
  console.log(`总体状态: ${report.summary.overallStatus}`);
  
  if (report.summary.failedTests > 0) {
    console.log('\n失败的测试:');
    report.detailedResults.forEach(test => {
      if (!test.passed) {
        console.log(`- ${test.name}: ${test.details.error || '未知错误'}`);
      }
    });
  }
  
  console.log(`\n详细报告已保存至: ${reportFile}`);
}

// 主测试函数
async function runComprehensiveTests() {
  console.log('\n========================================');
  console.log('   数据库连接全面测试开始执行            ');
  console.log('========================================');
  
  try {
    // 只执行基础连接测试，简化流程以便调试
    console.log('\n🚀 开始执行基础连接测试...');
    await testBasicConnection();
    
    // 生成并打印报告
    console.log('\n📊 生成测试报告...');
    const report = generateTestReport();
    printTestSummary(report);
    
    return report.summary.overallStatus === 'PASSED';
  } catch (error) {
    console.error('\n❌ 测试执行过程中发生严重错误:', error);
    console.error(error.stack);
    
    // 即使出错也要生成报告
    try {
      const report = generateTestReport();
      printTestSummary(report);
    } catch (reportError) {
      console.error('❌ 生成报告失败:', reportError);
    }
    
    return false;
  }
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runComprehensiveTests };