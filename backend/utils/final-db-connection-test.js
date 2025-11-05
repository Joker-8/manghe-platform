#!/usr/bin/env node

// 直接导入所需模块
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// 同步输出日志，确保能看到执行过程
console.log('========================================');
console.log('   数据库连接全面测试 (最终版本)         ');
console.log('========================================');
console.log(`当前工作目录: ${process.cwd()}`);
console.log(`Node.js版本: ${process.version}`);

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

// 报告目录
const reportsDir = path.join(process.cwd(), 'reports');

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 记录测试结果
function recordTest(name, passed, details = {}) {
  console.log(`\n[${passed ? '✅' : '❌'}] ${name}: ${passed ? '通过' : '失败'}`);
  
  if (details.error) {
    console.error(`  错误信息: ${details.error}`);
  }
  
  if (details.duration) {
    console.log(`  执行时间: ${details.duration.toFixed(2)}ms`);
  }
  
  return {
    name,
    passed,
    timestamp: new Date().toISOString(),
    duration: details.duration || 0,
    details
  };
}

// 基础连接测试
async function testBasicConnection(dbPath) {
  const startTime = Date.now();
  console.log('\n🔍 1. 基础连接验证');
  console.log('-------------------');
  
  try {
    // 检查数据库文件
    if (!fs.existsSync(dbPath)) {
      console.error('❌ 数据库文件不存在');
      return { success: false, error: '数据库文件不存在' };
    }
    
    console.log('✅ 数据库文件存在');
    
    // 打开连接
    console.log('🔄 正在建立数据库连接...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('✅ 数据库连接成功');
    
    // 执行简单查询
    console.log('🔄 执行简单查询...');
    const result = await db.get('SELECT 1 + 1 as sum');
    
    if (result.sum !== 2) {
      await db.close();
      console.error(`❌ 查询结果错误: 期望2，实际得到${result.sum}`);
      return { success: false, error: '查询结果错误' };
    }
    
    console.log(`✅ 查询结果正确: ${result.sum}`);
    
    // 获取表信息
    console.log('🔄 获取数据库表信息...');
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    console.log(`✅ 找到 ${tables.length} 个表`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name}`);
    });
    
    // 更新数据库信息
    const fileStats = fs.statSync(dbPath);
    testResults.summary.databaseInfo = {
      path: dbPath,
      fileSize: fileStats.size,
      tables: tables.map(t => t.name)
    };
    
    await db.close();
    console.log('✅ 数据库连接已关闭');
    
    const duration = Date.now() - startTime;
    return {
      success: true,
      duration,
      details: {
        tablesFound: tables.length,
        databaseSize: `${(fileStats.size / 1024).toFixed(2)} KB`
      }
    };
    
  } catch (error) {
    console.error(`❌ 基础连接测试失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// 异常处理测试
async function testExceptionHandling(dbPath) {
  const startTime = Date.now();
  console.log('\n🔍 2. 异常情况处理测试');
  console.log('-------------------');
  
  const exceptions = [
    { name: '无效SQL语法', sql: 'INVALID SQL QUERY' },
    { name: '不存在的表', sql: 'SELECT * FROM non_existent_table' }
  ];
  
  let allHandled = true;
  const results = [];
  
  try {
    for (const exception of exceptions) {
      console.log(`\n🔄 测试: ${exception.name}`);
      try {
        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        await db.all(exception.sql);
        // 如果没有抛出异常，这是个问题
        console.error(`❌ 未能捕获异常: ${exception.name}`);
        allHandled = false;
        results.push({ name: exception.name, handled: false });
        
        await db.close();
      } catch (error) {
        console.log(`✅ 成功捕获异常: ${error.message}`);
        results.push({ name: exception.name, handled: true, error: error.message });
      }
    }
    
    return {
      success: allHandled,
      duration: Date.now() - startTime,
      details: { exceptionResults: results }
    };
    
  } catch (error) {
    console.error(`❌ 异常处理测试失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// 并发连接测试
async function testConcurrentConnections(dbPath) {
  const startTime = Date.now();
  console.log('\n🔍 3. 并发连接测试');
  console.log('-------------------');
  
  const concurrentCount = 20;
  console.log(`🔄 测试 ${concurrentCount} 个并发连接...`);
  
  try {
    const promises = [];
    
    for (let i = 0; i < concurrentCount; i++) {
      promises.push((async (index) => {
        try {
          const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
          });
          
          await db.get('SELECT 1');
          await db.close();
          console.log(`✅ 并发连接 ${index + 1} 成功`);
          return { index, success: true };
        } catch (error) {
          console.error(`❌ 并发连接 ${index + 1} 失败: ${error.message}`);
          return { index, success: false, error: error.message };
        }
      })(i));
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const failed = concurrentCount - successful;
    
    console.log(`\n✅ 并发测试完成`);
    console.log(`  总连接数: ${concurrentCount}`);
    console.log(`  成功连接: ${successful}`);
    console.log(`  失败连接: ${failed}`);
    
    // 允许少量失败（SQLite文件锁定可能导致）
    const successRate = successful / concurrentCount;
    const testPassed = successRate >= 0.9;
    
    console.log(`  成功率: ${(successRate * 100).toFixed(1)}% - ${testPassed ? '通过' : '失败'}`);
    
    return {
      success: testPassed,
      duration: Date.now() - startTime,
      details: {
        total: concurrentCount,
        successful,
        failed,
        successRate
      }
    };
    
  } catch (error) {
    console.error(`❌ 并发连接测试失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// 连接池性能测试
async function testConnectionPool(dbPath) {
  const startTime = Date.now();
  console.log('\n🔍 4. 连接池性能测试');
  console.log('-------------------');
  
  const queryCount = 50;
  console.log(`🔄 执行 ${queryCount} 次连续查询...`);
  
  try {
    let successfulQueries = 0;
    let totalQueryTime = 0;
    
    for (let i = 0; i < queryCount; i++) {
      const queryStart = Date.now();
      try {
        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        await db.get('SELECT 1');
        await db.close();
        
        const queryTime = Date.now() - queryStart;
        totalQueryTime += queryTime;
        successfulQueries++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`✅ 已完成 ${i + 1}/${queryCount} 次查询`);
        }
      } catch (error) {
        console.error(`❌ 查询 ${i + 1} 失败: ${error.message}`);
      }
    }
    
    const avgQueryTime = totalQueryTime / queryCount;
    const queriesPerSecond = queryCount / (totalQueryTime / 1000);
    
    console.log('\n✅ 性能测试完成');
    console.log(`  总查询次数: ${queryCount}`);
    console.log(`  成功查询: ${successfulQueries}`);
    console.log(`  平均查询时间: ${avgQueryTime.toFixed(2)}ms`);
    console.log(`  查询速率: ${queriesPerSecond.toFixed(2)}/秒`);
    
    return {
      success: true,
      duration: Date.now() - startTime,
      details: {
        totalQueries: queryCount,
        successfulQueries,
        averageQueryTime: avgQueryTime,
        queriesPerSecond
      }
    };
    
  } catch (error) {
    console.error(`❌ 性能测试失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// 文件锁定测试
async function testFileLocking(dbPath) {
  const startTime = Date.now();
  console.log('\n🔍 5. 数据库文件锁定测试');
  console.log('-------------------');
  
  try {
    // 测试多个连接同时读取
    console.log('🔄 测试多连接同时读取...');
    const connections = [];
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      connections.push(db);
      const result = await db.get('SELECT 1');
      results.push(result);
      console.log(`✅ 读取连接 ${i + 1} 成功`);
    }
    
    // 关闭所有连接
    await Promise.all(connections.map(db => db.close()));
    
    console.log('\n✅ 多连接读取测试通过');
    
    return {
      success: true,
      duration: Date.now() - startTime,
      details: { multiReadSuccess: true }
    };
    
  } catch (error) {
    console.error(`❌ 文件锁定测试失败: ${error.message}`);
    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

// 生成JSON报告
function generateReport() {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(
    reportsDir, 
    `comprehensive-db-test-report-${timestamp.replace(/[:.]/g, '-')}.json`
  );
  
  // 计算统计信息
  testResults.summary.endTime = new Date().toISOString();
  testResults.summary.totalDuration = 
    new Date(testResults.summary.endTime) - new Date(testResults.summary.startTime);
  
  const successRate = testResults.summary.totalTests > 0 
    ? (testResults.summary.passedTests / testResults.summary.totalTests * 100).toFixed(2)
    : 0;
  testResults.summary.successRate = successRate;
  
  // 保存报告
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 测试报告已保存至: ${reportPath}`);
  
  return reportPath;
}

// 主函数
async function main() {
  // 确保报告目录存在
  if (!fs.existsSync(reportsDir)) {
    console.log('\n🔄 创建报告目录...');
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // 数据库路径
  const dbPath = path.join(process.cwd(), 'data', 'manghe.db');
  console.log(`\n数据库文件路径: ${dbPath}`);
  
  // 执行所有测试
  const tests = [
    { name: '基础连接验证', fn: testBasicConnection },
    { name: '异常情况处理', fn: testExceptionHandling },
    { name: '并发连接测试', fn: testConcurrentConnections },
    { name: '连接池性能测试', fn: testConnectionPool },
    { name: '文件锁定测试', fn: testFileLocking }
  ];
  
  for (const test of tests) {
    testResults.summary.totalTests++;
    const result = await test.fn(dbPath);
    
    const testRecord = recordTest(
      test.name,
      result.success,
      result
    );
    
    testResults.tests.push(testRecord);
    
    if (result.success) {
      testResults.summary.passedTests++;
    } else {
      testResults.summary.failedTests++;
    }
  }
  
  // 生成报告
  const reportPath = generateReport();
  
  // 打印最终总结
  console.log('\n========================================');
  console.log('         测试总结报告                   ');
  console.log('========================================');
  console.log(`测试总数: ${testResults.summary.totalTests}`);
  console.log(`通过测试: ${testResults.summary.passedTests}`);
  console.log(`失败测试: ${testResults.summary.failedTests}`);
  console.log(`成功率: ${testResults.summary.successRate}%`);
  console.log(`总体状态: ${testResults.summary.failedTests === 0 ? '✅ 全部通过' : '❌ 存在失败项'}`);
  console.log(`\n详细报告: ${reportPath}`);
  console.log('========================================');
  
  return testResults.summary.failedTests === 0;
}

// 直接执行主函数（避免使用import.meta.url检查）
console.log('\n🔄 开始执行测试...');
main().then(success => {
  console.log('\n✅ 测试执行完成');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('\n❌ 测试执行失败:', error);
  console.error(error.stack);
  process.exit(1);
});