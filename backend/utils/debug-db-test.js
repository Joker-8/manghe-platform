#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// 立即输出一些日志，确保脚本正在执行
console.log('========================================');
console.log('开始调试数据库测试脚本');
console.log('========================================');
console.log(`当前工作目录: ${process.cwd()}`);
console.log(`Node.js版本: ${process.version}`);

// 检查数据库文件路径
const dbPath = path.join(process.cwd(), 'data', 'manghe.db');
console.log(`\n数据库路径检查:`);
console.log(`数据库文件路径: ${dbPath}`);

// 检查data目录是否存在
const dataDir = path.join(process.cwd(), 'data');
console.log(`数据目录是否存在: ${fs.existsSync(dataDir)}`);

// 如果data目录不存在，创建它
if (!fs.existsSync(dataDir)) {
  console.log('创建数据目录...');
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('数据目录创建成功');
}

// 检查数据库文件是否存在
console.log(`数据库文件是否存在: ${fs.existsSync(dbPath)}`);

// 如果数据库文件不存在，创建一个空的数据库
if (!fs.existsSync(dbPath)) {
  console.log('创建空数据库文件...');
  const db = new sqlite3.Database(dbPath);
  db.close();
  console.log('数据库文件创建成功');
}

// 测试简单的数据库连接
console.log('\n开始数据库连接测试...');

try {
  // 测试连接
  (async () => {
    try {
      console.log('尝试打开数据库连接...');
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      console.log('数据库连接成功!');
      
      // 执行简单查询
      console.log('执行简单查询...');
      const result = await db.get('SELECT 1 + 1 as sum');
      console.log(`查询结果: ${result.sum}`);
      
      // 获取表信息
      console.log('\n获取数据库表信息...');
      const tables = await db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      console.log(`找到 ${tables.length} 个表:`);
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name}`);
      });
      
      // 关闭连接
      await db.close();
      console.log('\n数据库连接已关闭');
      
      // 检查报告目录
      const reportsDir = path.join(process.cwd(), 'reports');
      console.log('\n检查报告目录:');
      console.log(`报告目录路径: ${reportsDir}`);
      console.log(`报告目录是否存在: ${fs.existsSync(reportsDir)}`);
      
      // 如果报告目录不存在，创建它
      if (!fs.existsSync(reportsDir)) {
        console.log('创建报告目录...');
        fs.mkdirSync(reportsDir, { recursive: true });
        console.log('报告目录创建成功');
      }
      
      // 创建一个测试报告文件
      const reportPath = path.join(
        reportsDir, 
        `debug-test-report-${Date.now()}.json`
      );
      
      const testReport = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          cwd: process.cwd()
        },
        testResults: {
          connection: 'success',
          queryResult: result.sum,
          tablesFound: tables.length
        }
      };
      
      console.log(`\n保存测试报告到: ${reportPath}`);
      fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
      console.log('测试报告保存成功!');
      
      // 验证文件已保存
      console.log(`报告文件是否存在: ${fs.existsSync(reportPath)}`);
      
    } catch (error) {
      console.error('\n❌ 数据库操作失败:', error.message);
      console.error(error.stack);
    }
  })();
} catch (error) {
  console.error('\n❌ 脚本执行出错:', error.message);
  console.error(error.stack);
}

console.log('\n脚本执行结束，等待异步操作完成...');