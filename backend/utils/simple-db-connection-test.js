#!/usr/bin/env node
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

// 加载环境变量
dotenv.config();

// 测试数据库连接
async function testDatabaseConnection() {
  console.log('\n========================================');
  console.log('   简单数据库连接测试开始                ');
  console.log('========================================');
  
  const dbPath = path.join(process.cwd(), 'data', 'manghe.db');
  console.log(`数据库文件路径: ${dbPath}`);
  
  let db = null;
  
  try {
    // 检查数据库文件是否存在
    if (!fs.existsSync(dbPath)) {
      console.error('❌ 错误: 数据库文件不存在!');
      return false;
    }
    
    console.log('🔄 尝试打开数据库连接...');
    const startTime = Date.now();
    
    // 打开数据库连接
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    const connectionTime = Date.now() - startTime;
    console.log(`✅ 数据库连接成功! (耗时: ${connectionTime}ms)`);
    
    // 执行简单查询测试
    console.log('🔄 执行测试查询...');
    const queryStartTime = Date.now();
    const result = await db.get('SELECT 1 + 1 as result');
    const queryTime = Date.now() - queryStartTime;
    
    console.log(`✅ 查询执行成功! 结果: 1 + 1 = ${result.result} (耗时: ${queryTime}ms)`);
    
    // 检查表结构
    console.log('\n🔄 检查数据库表结构...');
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    console.log(`✅ 找到 ${tables.length} 个表:`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name}`);
    });
    
    // 测试并发连接
    console.log('\n🔄 测试并发连接...');
    const concurrentTests = 5;
    const concurrentPromises = Array(concurrentTests).fill().map(async (_, index) => {
      try {
        const testDb = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        await testDb.get('SELECT 1 as test');
        await testDb.close();
        return { success: true, index };
      } catch (error) {
        return { success: false, index, error: error.message };
      }
    });
    
    const concurrentResults = await Promise.all(concurrentPromises);
    const successfulConcurrent = concurrentResults.filter(r => r.success).length;
    
    console.log(`✅ 并发连接测试完成: ${successfulConcurrent}/${concurrentTests} 成功`);
    
    // 测试异常处理
    console.log('\n🔄 测试异常处理...');
    try {
      await db.all('INVALID SQL QUERY');
      console.error('❌ 异常处理失败: 无效的SQL没有抛出异常');
    } catch (error) {
      console.log(`✅ 异常处理成功: ${error.message}`);
    }
    
    // 生成简单报告
    const report = {
      timestamp: new Date().toISOString(),
      success: true,
      connectionTime,
      queryTime,
      tablesFound: tables.map(t => t.name),
      concurrentTestResult: {
        total: concurrentTests,
        successful: successfulConcurrent,
        failure: concurrentTests - successfulConcurrent
      }
    };
    
    // 保存报告
    const reportDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(
      reportDir, 
      `simple-db-test-report-${Date.now()}.json`
    );
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n✅ 测试报告已保存至: ${reportFile}`);
    
    return true;
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    if (db) {
      console.log('\n🔄 关闭数据库连接...');
      await db.close();
      console.log('✅ 数据库连接已关闭');
    }
  }
}

// 执行测试
testDatabaseConnection().then(success => {
  console.log('\n========================================');
  console.log(`测试结果: ${success ? '✅ 通过' : '❌ 失败'}`);
  console.log('========================================');
  process.exit(success ? 0 : 1);
});