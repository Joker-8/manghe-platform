#!/usr/bin/env node
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

// 加载环境变量
dotenv.config();

// 测试结果结构
const testResults = {
  summary: {
    startTime: new Date().toISOString(),
    endTime: null,
    totalDuration: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0,
    databaseInfo: {
      path: '',
      fileSize: 0,
      tables: []
    }
  },
  tests: []
};

// 测试报告目录
const reportsDir = path.join(process.cwd(), 'reports');

// 记录单个测试结果
function recordTestResult(testName, passed, details = {}) {
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passedTests++;
  } else {
    testResults.summary.failedTests++;
  }
  
  const testResult = {
    name: testName,
    passed,
    timestamp: new Date().toISOString(),
    duration: details.duration || 0,
    details
  };
  
  testResults.tests.push(testResult);
  console.log(`[${passed ? '✅' : '❌'}] ${testName}: ${passed ? '通过' : '失败'} (${details.duration || 0}ms)`);
  
  return testResult;
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 基础连接测试
async function testBasicConnection(dbPath) {
  const testName = '1. 基础连接验证';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始基础连接验证...');
    
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      return recordTestResult(testName, false, {
        error: '数据库文件不存在',
        duration: performance.now() - startTime
      });
    }
    
    // 打开连接
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 执行简单查询
    const result = await db.get('SELECT 1 + 1 as result');
    
    // 检查结果
    if (result.result !== 2) {
      await db.close();
      return recordTestResult(testName, false, {
        error: `查询结果不正确: 期望2，实际得到${result.result}`,
        duration: performance.now() - startTime
      });
    }
    
    // 获取数据库信息
    const fileStats = fs.statSync(dbPath);
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    // 更新全局数据库信息
    testResults.summary.databaseInfo = {
      path: dbPath,
      fileSize: fileStats.size,
      tables: tables.map(t => t.name)
    };
    
    await db.close();
    
    return recordTestResult(testName, true, {
      connectionTime: performance.now() - startTime,
      databaseSize: `${(fileStats.size / 1024).toFixed(2)} KB`,
      tablesFound: tables.length
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 网络环境模拟测试（针对SQLite主要测试文件访问）
async function testNetworkEnvironment(dbPath) {
  const testName = '2. 不同网络环境下的连接稳定性测试';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始模拟不同网络环境...');
    
    // 测试场景：延迟和高负载模拟
    const scenarios = [
      { name: '正常环境', delay: 0, queries: 10 },
      { name: '高延迟环境', delay: 50, queries: 5 },
      { name: '并发访问', delay: 0, queries: 20, concurrent: true }
    ];
    
    const scenarioResults = [];
    
    for (const scenario of scenarios) {
      const scenarioStart = performance.now();
      let successfulQueries = 0;
      let totalQueryTime = 0;
      
      try {
        if (scenario.concurrent) {
          // 并发查询
          const promises = Array(scenario.queries).fill().map(async () => {
            const db = await open({
              filename: dbPath,
              driver: sqlite3.Database
            });
            await delay(scenario.delay);
            const queryStart = performance.now();
            await db.get('SELECT 1 as test');
            totalQueryTime += performance.now() - queryStart;
            await db.close();
            successfulQueries++;
          });
          
          await Promise.all(promises);
        } else {
          // 串行查询
          for (let i = 0; i < scenario.queries; i++) {
            const db = await open({
              filename: dbPath,
              driver: sqlite3.Database
            });
            await delay(scenario.delay);
            const queryStart = performance.now();
            await db.get('SELECT 1 as test');
            totalQueryTime += performance.now() - queryStart;
            await db.close();
            successfulQueries++;
          }
        }
        
        scenarioResults.push({
          name: scenario.name,
          success: true,
          successfulQueries,
          totalQueries: scenario.queries,
          avgQueryTime: totalQueryTime / scenario.queries,
          duration: performance.now() - scenarioStart
        });
        
      } catch (error) {
        scenarioResults.push({
          name: scenario.name,
          success: false,
          error: error.message,
          successfulQueries,
          totalQueries: scenario.queries,
          duration: performance.now() - scenarioStart
        });
      }
    }
    
    const allSuccessful = scenarioResults.every(s => s.success);
    
    return recordTestResult(testName, allSuccessful, {
      duration: performance.now() - startTime,
      scenarios: scenarioResults
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 异常情况处理测试
async function testExceptionHandling(dbPath) {
  const testName = '3. 异常情况处理测试';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始异常情况处理测试...');
    
    // 测试不同的异常情况
    const exceptionTests = [
      {
        name: '无效SQL语法',
        test: async (db) => {
          await db.all('INVALID SQL QUERY');
        }
      },
      {
        name: '不存在的表',
        test: async (db) => {
          await db.all('SELECT * FROM non_existent_table');
        }
      },
      {
        name: '参数绑定错误',
        test: async (db) => {
          await db.all('SELECT * FROM users WHERE id = ?', []); // 缺少参数
        }
      },
      {
        name: '数据库关闭后操作',
        test: async () => {
          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          });
          await db.close();
          await db.get('SELECT 1'); // 在关闭后尝试操作
        }
      }
    ];
    
    const exceptionResults = [];
    
    for (const test of exceptionTests) {
      const testStart = performance.now();
      let handled = false;
      let errorMessage = '';
      
      try {
        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        await test.test(db);
        
        // 如果没有抛出异常，测试失败
        exceptionResults.push({
          name: test.name,
          handled: false,
          error: '异常未被抛出',
          duration: performance.now() - testStart
        });
        
        await db.close();
      } catch (error) {
        handled = true;
        errorMessage = error.message;
        
        exceptionResults.push({
          name: test.name,
          handled: true,
          errorMessage: error.message,
          duration: performance.now() - testStart
        });
      }
    }
    
    // 所有异常都应该被正确处理
    const allHandled = exceptionResults.every(r => r.handled);
    
    return recordTestResult(testName, allHandled, {
      duration: performance.now() - startTime,
      exceptionTests: exceptionResults
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 连接池性能测试（模拟）
async function testConnectionPoolPerformance(dbPath) {
  const testName = '4. 连接池性能测试';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始连接池性能测试...');
    
    const testConfig = {
      warmupQueries: 10,
      testQueries: 100,
      batchSize: 10
    };
    
    // 预热
    console.log(`  🔄 预热查询: ${testConfig.warmupQueries}次`);
    const warmupDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    for (let i = 0; i < testConfig.warmupQueries; i++) {
      await warmupDb.get('SELECT 1');
    }
    await warmupDb.close();
    
    // 性能测试
    console.log(`  🔄 性能测试: ${testConfig.testQueries}次查询`);
    let totalQueryTime = 0;
    let successfulQueries = 0;
    const batchTimes = [];
    
    // 分批次执行以模拟连接池行为
    for (let batch = 0; batch < testConfig.testQueries / testConfig.batchSize; batch++) {
      const batchStart = performance.now();
      
      // 每批次创建多个连接
      const connections = await Promise.all(
        Array(testConfig.batchSize).fill().map(() => 
          open({
            filename: dbPath,
            driver: sqlite3.Database
          })
        )
      );
      
      // 执行查询
      await Promise.all(
        connections.map(db => db.get('SELECT 1'))
      );
      
      // 关闭连接
      await Promise.all(
        connections.map(db => db.close())
      );
      
      const batchTime = performance.now() - batchStart;
      batchTimes.push(batchTime);
      successfulQueries += testConfig.batchSize;
    }
    
    totalQueryTime = batchTimes.reduce((sum, time) => sum + time, 0);
    const avgQueryTime = totalQueryTime / testConfig.testQueries;
    const queriesPerSecond = testConfig.testQueries / (totalQueryTime / 1000);
    
    return recordTestResult(testName, true, {
      duration: performance.now() - startTime,
      totalQueries: testConfig.testQueries,
      successfulQueries,
      totalQueryTime,
      averageQueryTime: avgQueryTime.toFixed(2),
      queriesPerSecond: queriesPerSecond.toFixed(2),
      batchStatistics: {
        avgBatchTime: (batchTimes.reduce((sum, time) => sum + time, 0) / batchTimes.length).toFixed(2),
        minBatchTime: Math.min(...batchTimes).toFixed(2),
        maxBatchTime: Math.max(...batchTimes).toFixed(2)
      }
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 并发连接测试
async function testConcurrentConnections(dbPath) {
  const testName = '5. 并发连接测试';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始并发连接测试...');
    
    // 不同级别的并发测试
    const concurrentLevels = [10, 50, 100];
    const concurrencyResults = [];
    
    for (const level of concurrentLevels) {
      const levelStart = performance.now();
      let successfulConnections = 0;
      const errors = [];
      
      console.log(`  🔄 测试 ${level} 个并发连接`);
      
      // 创建并发连接
      const connectionPromises = Array(level).fill().map(async (_, index) => {
        try {
          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          });
          
          // 执行简单查询
          await db.get('SELECT 1 as test');
          
          // 执行不同类型的查询以增加负载
          if (index % 3 === 0) {
            await db.all('SELECT name FROM sqlite_master WHERE type="table"');
          }
          
          await db.close();
          successfulConnections++;
          return { success: true, index };
        } catch (error) {
          errors.push({
            index,
            error: error.message
          });
          return { success: false, index, error: error.message };
        }
      });
      
      await Promise.all(connectionPromises);
      
      concurrencyResults.push({
        level,
        successfulConnections,
        failedConnections: level - successfulConnections,
        duration: performance.now() - levelStart,
        errors
      });
    }
    
    // 所有级别都应该有高成功率（SQLite文件锁定可能导致少量失败）
    const allSuccessful = concurrencyResults.every(r => 
      r.successfulConnections / r.level >= 0.95 // 95%成功率
    );
    
    return recordTestResult(testName, allSuccessful, {
      duration: performance.now() - startTime,
      concurrencyLevels: concurrencyResults
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 长时间运行的连接保持测试
async function testLongRunningConnection(dbPath) {
  const testName = '6. 长时间运行的连接保持测试';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始长时间运行的连接保持测试...');
    
    // 测试配置
    const testDuration = 10000; // 10秒
    const queryInterval = 1000; // 每秒查询一次
    
    let db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    let queryCount = 0;
    let successfulQueries = 0;
    const queryTimes = [];
    let testFailed = false;
    
    console.log(`  🔄 开始 ${testDuration/1000} 秒连接保持测试，每 ${queryInterval/1000} 秒查询一次`);
    
    const endTime = Date.now() + testDuration;
    
    while (Date.now() < endTime && !testFailed) {
      try {
        const queryStart = performance.now();
        await db.get('SELECT 1 as result');
        const queryTime = performance.now() - queryStart;
        
        queryCount++;
        successfulQueries++;
        queryTimes.push(queryTime);
        
        // 每3次查询后执行一次更复杂的查询
        if (queryCount % 3 === 0) {
          await db.all('SELECT name FROM sqlite_master WHERE type="table"');
        }
        
        console.log(`  ✅ 查询 ${queryCount}: ${queryTime.toFixed(2)}ms`);
      } catch (error) {
        console.error(`  ❌ 查询 ${queryCount + 1} 失败:`, error.message);
        testFailed = true;
        break;
      }
      
      // 等待下一次查询
      await delay(queryInterval);
    }
    
    await db.close();
    
    const totalQueryTime = queryTimes.reduce((sum, time) => sum + time, 0);
    const avgQueryTime = queryTimes.length > 0 ? totalQueryTime / queryTimes.length : 0;
    
    return recordTestResult(testName, !testFailed, {
      duration: performance.now() - startTime,
      testDuration,
      queriesExecuted: queryCount,
      successfulQueries,
      averageQueryTime: avgQueryTime.toFixed(2),
      maxQueryTime: queryTimes.length > 0 ? Math.max(...queryTimes).toFixed(2) : 0,
      minQueryTime: queryTimes.length > 0 ? Math.min(...queryTimes).toFixed(2) : 0
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 数据库文件锁定测试
async function testFileLocking(dbPath) {
  const testName = '7. 数据库文件锁定测试';
  const startTime = performance.now();
  
  try {
    console.log('\n🔄 开始数据库文件锁定测试...');
    
    // 测试场景1：多个连接同时读取
    console.log('  🔄 测试多连接同时读取');
    const connections = await Promise.all(
      Array(3).fill().map(() => 
        open({
          filename: dbPath,
          driver: sqlite3.Database
        })
      )
    );
    
    const readResults = await Promise.all(
      connections.map(db => db.get('SELECT 1'))
    );
    
    await Promise.all(
      connections.map(db => db.close())
    );
    
    // 测试场景2：读写冲突模拟
    console.log('  🔄 测试读写冲突');
    const writerDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // 开始事务（模拟写锁定）
    await writerDb.run('BEGIN TRANSACTION');
    
    // 尝试在事务期间从其他连接读取
    let readerSuccess = false;
    try {
      const readerDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      await readerDb.get('SELECT 1');
      await readerDb.close();
      readerSuccess = true;
    } catch (error) {
      console.log(`  ℹ️  读取尝试结果: ${error.message}`);
    }
    
    // 提交事务
    await writerDb.run('COMMIT');
    await writerDb.close();
    
    return recordTestResult(testName, true, {
      duration: performance.now() - startTime,
      multiReadSuccess: readResults.every(r => r && r["1"] === 1),
      readDuringTransaction: readerSuccess,
      readResults: readResults.map(r => r && r["1"])
    });
    
  } catch (error) {
    return recordTestResult(testName, false, {
      error: error.message,
      stack: error.stack,
      duration: performance.now() - startTime
    });
  }
}

// 生成详细的HTML测试报告
function generateHtmlReport() {
  const reportTimestamp = new Date().toISOString();
  const htmlReportPath = path.join(
    reportsDir, 
    `database-connection-test-report-${reportTimestamp.replace(/[:.]/g, '-')}.html`
  );
  
  // 计算成功率
  const successRate = testResults.summary.totalTests > 0 
    ? (testResults.summary.passedTests / testResults.summary.totalTests * 100).toFixed(2)
    : 0;
  
  testResults.summary.successRate = successRate;
  
  // HTML报告内容
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据库连接全面测试报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .summary {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #667eea;
            font-size: 1.1em;
        }
        .summary-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        .success {
            color: #28a745;
        }
        .failure {
            color: #dc3545;
        }
        .tests {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .test-item {
            margin-bottom: 25px;
            padding-bottom: 25px;
            border-bottom: 1px solid #eee;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .test-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
        }
        .test-status {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
        }
        .status-passed {
            background: #d4edda;
            color: #155724;
        }
        .status-failed {
            background: #f8d7da;
            color: #721c24;
        }
        .test-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
        }
        pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .database-info {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #667eea;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 40px;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>数据库连接全面测试报告</h1>
        <p>测试时间: ${new Date(testResults.summary.startTime).toLocaleString()} - ${new Date(testResults.summary.endTime).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <h2>测试摘要</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>测试总数</h3>
                <div class="value">${testResults.summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>通过测试</h3>
                <div class="value success">${testResults.summary.passedTests}</div>
            </div>
            <div class="summary-card">
                <h3>失败测试</h3>
                <div class="value failure">${testResults.summary.failedTests}</div>
            </div>
            <div class="summary-card">
                <h3>成功率</h3>
                <div class="value ${successRate >= 90 ? 'success' : 'failure'}">${successRate}%</div>
            </div>
        </div>
    </div>
    
    <div class="database-info">
        <h2>数据库信息</h2>
        <table>
            <tr>
                <th>项目</th>
                <th>值</th>
            </tr>
            <tr>
                <td>数据库路径</td>
                <td>${testResults.summary.databaseInfo.path}</td>
            </tr>
            <tr>
                <td>数据库大小</td>
                <td>${(testResults.summary.databaseInfo.fileSize / 1024).toFixed(2)} KB</td>
            </tr>
            <tr>
                <td>表数量</td>
                <td>${testResults.summary.databaseInfo.tables.length}</td>
            </tr>
            <tr>
                <td>表列表</td>
                <td>${testResults.summary.databaseInfo.tables.join(', ')}</td>
            </tr>
        </table>
    </div>
    
    <div class="tests">
        <h2>详细测试结果</h2>
        ${testResults.tests.map(test => `
        <div class="test-item">
            <div class="test-header">
                <div class="test-name">${test.name}</div>
                <div class="test-status status-${test.passed ? 'passed' : 'failed'}">
                    ${test.passed ? '通过' : '失败'} (${test.duration.toFixed(2)}ms)
                </div>
            </div>
            <div class="test-details">
                <pre>${JSON.stringify(test.details, null, 2)}</pre>
            </div>
        </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p>报告生成时间: ${new Date().toLocaleString()}</p>
        <p>系统环境: Node.js ${process.version}</p>
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  return htmlReportPath;
}

// 主测试函数
async function runComprehensiveTests() {
  console.log('\n========================================');
  console.log('   数据库连接全面测试开始执行            ');
  console.log('========================================');
  
  // 打印当前工作目录和环境信息
  console.log(`当前工作目录: ${process.cwd()}`);
  console.log(`Node.js版本: ${process.version}`);
  
  const dbPath = path.join(process.cwd(), 'data', 'manghe.db');
  console.log(`数据库文件路径: ${dbPath}`);
  console.log(`数据库文件是否存在: ${fs.existsSync(dbPath)}`);
  console.log(`报告目录路径: ${reportsDir}`);
  console.log(`报告目录是否存在: ${fs.existsSync(reportsDir)}`);
  
  try {
    // 确保报告目录存在
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // 按顺序执行所有测试
    console.log('\n🔍 开始执行基础连接测试...');
    await testBasicConnection(dbPath);
    console.log('\n🔍 开始执行网络环境测试...');
    await testNetworkEnvironment(dbPath);
    console.log('\n🔍 开始执行异常处理测试...');
    await testExceptionHandling(dbPath);
    console.log('\n🔍 开始执行连接池性能测试...');
    await testConnectionPoolPerformance(dbPath);
    console.log('\n🔍 开始执行并发连接测试...');
    await testConcurrentConnections(dbPath);
    console.log('\n🔍 开始执行文件锁定测试...');
    await testFileLocking(dbPath);
    // 可选：执行长时间测试
    // console.log('\n🔍 开始执行长时间运行测试...');
    // await testLongRunningConnection(dbPath);
    
    // 更新测试总结信息
    testResults.summary.endTime = new Date().toISOString();
    testResults.summary.totalDuration = 
      new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
    
    // 保存JSON报告
    const jsonReportPath = path.join(
      reportsDir, 
      `database-connection-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    
    console.log(`\n💾 正在保存JSON报告: ${jsonReportPath}`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(testResults, null, 2));
    console.log(`✅ JSON报告已保存`);
    
    // 生成HTML报告
    console.log(`💾 正在生成HTML报告...`);
    const htmlReportPath = generateHtmlReport();
    console.log(`✅ HTML报告已生成: ${htmlReportPath}`);
    
    // 打印测试摘要
    console.log('\n========================================');
    console.log('        数据库连接测试报告摘要          ');
    console.log('========================================');
    console.log(`测试时间: ${new Date(testResults.summary.startTime).toLocaleString()} - ${new Date(testResults.summary.endTime).toLocaleString()}`);
    console.log(`总耗时: ${testResults.summary.totalDuration}ms`);
    console.log(`测试总数: ${testResults.summary.totalTests}`);
    console.log(`通过测试: ${testResults.summary.passedTests}`);
    console.log(`失败测试: ${testResults.summary.failedTests}`);
    console.log(`成功率: ${testResults.summary.successRate}%`);
    console.log(`总体状态: ${testResults.summary.failedTests === 0 ? '✅ 通过' : '❌ 失败'}`);
    
    if (testResults.summary.failedTests > 0) {
      console.log('\n失败的测试:');
      testResults.tests.forEach(test => {
        if (!test.passed) {
          console.log(`- ${test.name}: ${test.details.error || '未知错误'}`);
        }
      });
    }
    
    console.log(`\nJSON报告已保存至: ${jsonReportPath}`);
    console.log(`HTML报告已保存至: ${htmlReportPath}`);
    
    return testResults.summary.failedTests === 0;
    
  } catch (error) {
    console.error('\n❌ 测试执行过程中发生严重错误:', error);
    console.error(error.stack);
    
    // 即使出错也要生成报告
    try {
      testResults.summary.endTime = new Date().toISOString();
      const jsonReportPath = path.join(
        reportsDir, 
        `database-connection-test-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      );
      
      console.log(`\n💾 正在保存错误报告: ${jsonReportPath}`);
      fs.writeFileSync(jsonReportPath, JSON.stringify(testResults, null, 2));
      console.log(`✅ 错误报告已保存`);
    } catch (reportError) {
      console.error('❌ 生成报告失败:', reportError);
      console.error(reportError.stack);
    }
    
    return false;
  }
}

// 执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  // 使用IIFE立即执行异步函数，确保同步执行流程
  (async function() {
    console.log('\n🔄 开始执行数据库连接全面测试...');
    try {
      const success = await runComprehensiveTests();
      console.log('\n========================================');
      console.log(`测试结果: ${success ? '✅ 通过' : '❌ 失败'}`);
      console.log('========================================');
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('\n❌ 测试脚本执行失败:', error);
      console.error(error.stack);
      process.exit(1);
    }
  })();
}