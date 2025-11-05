// SQLite数据库连接专用测试脚本
// 直接测试SQLite数据库的连接、初始化和基本操作

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  initializeDatabase,
  executeQuery,
  closeDatabase,
  checkConnection,
  getDb
} from './sqlite-database.js';

// 设置ES模块环境
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/../.env` });

// 测试报告对象
const testReport = {
  startTime: new Date(),
  environment: {
    nodeVersion: process.version,
    osType: process.platform,
    databasePath: 'data/manghe.db'
  },
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    status: 'pending'
  }
};

// 记录测试结果函数
function recordTest(testName, success, details = {}) {
  const testResult = {
    name: testName,
    success,
    timestamp: new Date(),
    details
  };
  
  testReport.tests.push(testResult);
  testReport.summary.total++;
  
  if (success) {
    testReport.summary.passed++;
    console.log(`✅ ${testName}: 成功`);
    if (details.message) console.log(`   消息: ${details.message}`);
  } else {
    testReport.summary.failed++;
    console.log(`❌ ${testName}: 失败`);
    if (details.error) console.log(`   错误: ${details.error.message || details.error}`);
    if (details.stack) console.log(`   堆栈: ${details.stack}`);
  }
  
  return testResult;
}

// 生成最终报告
function generateFinalReport() {
  testReport.endTime = new Date();
  testReport.duration = (testReport.endTime - testReport.startTime) / 1000;
  testReport.summary.status = testReport.summary.failed === 0 ? 'success' : 'failed';
  
  console.log('\n=== SQLite数据库连接测试报告 ===');
  console.log(`开始时间: ${testReport.startTime.toLocaleString()}`);
  console.log(`结束时间: ${testReport.endTime.toLocaleString()}`);
  console.log(`总耗时: ${testReport.duration.toFixed(2)} 秒`);
  console.log(`\n环境信息:`);
  console.log(`- Node.js版本: ${testReport.environment.nodeVersion}`);
  console.log(`- 操作系统: ${testReport.environment.osType}`);
  console.log(`- 数据库路径: ${testReport.environment.databasePath}`);
  console.log(`\n测试统计:`);
  console.log(`- 总测试数: ${testReport.summary.total}`);
  console.log(`- 通过数: ${testReport.summary.passed}`);
  console.log(`- 失败数: ${testReport.summary.failed}`);
  console.log(`- 通过率: ${((testReport.summary.passed / testReport.summary.total) * 100).toFixed(2)}%`);
  
  console.log('\n详细测试结果:');
  testReport.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}: ${test.success ? '✅ 通过' : '❌ 失败'}`);
    if (test.details.message) console.log(`   - 消息: ${test.details.message}`);
    if (test.details.error) console.log(`   - 错误: ${test.details.error.message || test.details.error}`);
  });
  
  console.log('\n=== 连接状态评估 ===');
  const isFullyOperational = testReport.tests.every(test => test.success);
  const isPartiallyOperational = testReport.summary.passed > 0;
  
  if (isFullyOperational) {
    console.log('✅ 数据库连接完全正常，所有功能测试通过');
  } else if (isPartiallyOperational) {
    console.log('⚠️  数据库连接部分正常，但存在功能限制');
  } else {
    console.log('❌ 数据库连接失败，无法正常使用');
  }
  
  return testReport;
}

// 主测试函数
async function runSQLiteTests() {
  console.log('=== SQLite数据库连接测试开始 ===');
  
  try {
    // 1. 测试数据库初始化
    console.log('\n1. 测试数据库初始化...');
    const initStartTime = Date.now();
    try {
      const initResult = await initializeDatabase();
      const initDuration = Date.now() - initStartTime;
      recordTest('数据库初始化', initResult, {
        message: `初始化耗时: ${initDuration}ms`
      });
    } catch (error) {
      recordTest('数据库初始化', false, {
        error,
        stack: error.stack
      });
    }
    
    // 2. 测试连接状态检查
    console.log('\n2. 测试连接状态检查...');
    try {
      const connectionStatus = checkConnection();
      recordTest('连接状态检查', true, {
        message: `当前连接状态: ${connectionStatus ? '已连接' : '未连接'}`
      });
    } catch (error) {
      recordTest('连接状态检查', false, { error });
    }
    
    // 3. 测试获取数据库实例
    console.log('\n3. 测试获取数据库实例...');
    try {
      const dbInstance = getDb();
      const hasInstance = dbInstance !== null && dbInstance !== undefined;
      recordTest('获取数据库实例', hasInstance, {
        message: hasInstance ? '成功获取数据库实例' : '未获取到数据库实例'
      });
    } catch (error) {
      recordTest('获取数据库实例', false, { error });
    }
    
    // 4. 测试基本查询功能（如果已连接）
    console.log('\n4. 测试基本查询功能...');
    if (checkConnection()) {
      try {
        const queryStartTime = Date.now();
        const result = await executeQuery('SELECT 1 + 1 as result');
        const queryDuration = Date.now() - queryStartTime;
        
        if (result && result.length > 0 && result[0].result === 2) {
          recordTest('基本查询功能', true, {
            message: `查询耗时: ${queryDuration}ms, 结果: ${result[0].result}`
          });
        } else {
          recordTest('基本查询功能', false, {
            error: new Error('查询结果不符合预期'),
            details: result
          });
        }
      } catch (error) {
        recordTest('基本查询功能', false, { error });
      }
    } else {
      recordTest('基本查询功能', false, {
        error: new Error('跳过查询测试，数据库未连接')
      });
    }
    
    // 5. 测试表结构验证（如果已连接）
    console.log('\n5. 测试表结构验证...');
    if (checkConnection()) {
      try {
        const tables = await executeQuery(
          "SELECT name FROM sqlite_master WHERE type='table'"
        );
        const tableNames = tables.map(t => t.name).filter(n => n !== 'sqlite_sequence');
        
        recordTest('表结构验证', true, {
          message: `发现 ${tableNames.length} 个表: ${tableNames.join(', ')}`
        });
      } catch (error) {
        recordTest('表结构验证', false, { error });
      }
    } else {
      recordTest('表结构验证', false, {
        error: new Error('跳过表结构验证，数据库未连接')
      });
    }
    
    // 6. 测试数据库文件存在性
    console.log('\n6. 测试数据库文件存在性...');
    try {
      const fs = await import('fs');
      const dbPath = `${__dirname}/../data/manghe.db`;
      const fileExists = fs.existsSync(dbPath);
      
      if (fileExists) {
        const stats = fs.statSync(dbPath);
        recordTest('数据库文件存在性', true, {
          message: `文件大小: ${stats.size} 字节, 创建时间: ${new Date(stats.ctime).toLocaleString()}`
        });
      } else {
        recordTest('数据库文件存在性', false, {
          error: new Error(`数据库文件不存在: ${dbPath}`)
        });
      }
    } catch (error) {
      recordTest('数据库文件存在性', false, { error });
    }
    
  } finally {
    // 尝试关闭数据库连接（如果已连接）
    if (checkConnection()) {
      try {
        console.log('\n关闭数据库连接...');
        await closeDatabase();
        console.log('数据库连接已关闭');
      } catch (closeError) {
        console.error('关闭数据库连接时出错:', closeError);
      }
    }
    
    // 生成最终报告
    const finalReport = generateFinalReport();
    
    // 返回适当的退出码
    process.exit(finalReport.summary.status === 'success' ? 0 : 1);
  }
}

// 运行测试
runSQLiteTests().catch(error => {
  console.error('测试过程中发生致命错误:', error);
  process.exit(1);
});