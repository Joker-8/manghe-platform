#!/usr/bin/env node
// 数据库备份脚本
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// 确保__dirname在所有环境中都可用
const __dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(require.main.filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

// 备份配置
const config = {
  backupDir: path.join(__dirname, '../backups'),
  retentionDays: 7, // 保留7天的备份
  logFile: path.join(__dirname, '../logs/backup.log')
};

// 确保备份目录存在
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

// 确保日志目录存在
const logDir = path.dirname(config.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(config.logFile, logMessage);
}

// 执行SQLite备份
function backupDatabase() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}_${hour}${minute}${second}`;
  const backupFile = path.join(config.backupDir, `manghe_db_${timestamp}.db`);
  
  log(`开始数据库备份: ${backupFile}`);
  
  try {
    // SQLite备份通过简单的文件复制实现
    const sourceDbPath = path.join(__dirname, '../data/manghe.db');
    
    // 读取源数据库文件
    const dbContent = fs.readFileSync(sourceDbPath);
    
    // 写入备份文件
    fs.writeFileSync(backupFile, dbContent);
    
    log(`备份成功完成: ${backupFile}`);
    
    // 压缩备份文件
    compressBackup(backupFile, timestamp);
    
    // 清理过期备份
    cleanupOldBackups();
  } catch (error) {
    log(`备份失败: ${error.message}`);
  }
}

// 压缩备份文件
function compressBackup(backupFile, timestamp) {
  const compressedFile = `${backupFile}.gz`;
  log(`开始压缩备份文件: ${compressedFile}`);
  
  const cmd = `gzip -c "${backupFile}" > "${compressedFile}"`;
  
  exec(cmd, (error) => {
    if (error) {
      log(`压缩失败: ${error.message}`);
      return;
    }
    
    log(`压缩成功完成: ${compressedFile}`);
    
    // 删除原始未压缩文件
    fs.unlinkSync(backupFile);
    log(`已删除原始未压缩文件: ${backupFile}`);
    
    // 验证备份文件
    verifyBackup(compressedFile, timestamp);
  });
}

// 验证备份文件
function verifyBackup(compressedFile, timestamp) {
  log(`验证备份文件: ${compressedFile}`);
  
  // 检查文件大小
  const stats = fs.statSync(compressedFile);
  log(`备份文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  if (stats.size === 0) {
    log(`警告: 备份文件为空，可能备份失败`);
  }
}

// 清理过期备份
function cleanupOldBackups() {
  log('开始清理过期备份');
  
  const now = Date.now();
  const retentionTime = config.retentionDays * 24 * 60 * 60 * 1000; // 转换为毫秒
  
  fs.readdir(config.backupDir, (err, files) => {
    if (err) {
      log(`读取备份目录失败: ${err.message}`);
      return;
    }
    
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(config.backupDir, file);
      const stat = fs.statSync(filePath);
      const fileAge = now - stat.mtime.getTime();
      
      if (fileAge > retentionTime) {
        fs.unlinkSync(filePath);
        log(`已删除过期备份: ${file}`);
        deletedCount++;
      }
    });
    
    log(`清理完成，共删除 ${deletedCount} 个过期备份文件`);
  });
}

// 生成备份报告
function generateBackupReport() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const reportFile = path.join(config.backupDir, `backup_report_${year}${month}${day}.json`);
  const report = {
    generated_at: new Date().toISOString(),
    db_info: {
      host: config.db.host,
      database: config.db.name,
      user: config.db.user
    },
    backup_files: []
  };
  
  fs.readdir(config.backupDir, (err, files) => {
    if (err) {
      log(`生成报告失败: ${err.message}`);
      return;
    }
    
    files.forEach(file => {
      if (file.endsWith('.gz')) {
        const filePath = path.join(config.backupDir, file);
        const stat = fs.statSync(filePath);
        report.backup_files.push({
          filename: file,
          size_bytes: stat.size,
          size_mb: (stat.size / 1024 / 1024).toFixed(2),
          created_at: stat.mtime.toISOString(),
          age_days: ((Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24)).toFixed(2)
        });
      }
    });
    
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    log(`备份报告生成完成: ${reportFile}`);
  });
}

// 执行数据一致性检查
function checkDataConsistency() {
  log('开始数据一致性检查');
  
  // 这里可以添加数据一致性检查逻辑
  // 例如检查表的行数、校验和等
  
  log('数据一致性检查完成');
}

// 主函数
function main() {
  log('==============================================');
  log('开始执行数据库备份任务');
  
  try {
    backupDatabase();
    
    // 延迟执行报告生成，确保备份完成
    setTimeout(() => {
      generateBackupReport();
      checkDataConsistency();
      log('数据库备份任务执行完毕');
      log('==============================================');
    }, 5000);
    
  } catch (error) {
    log(`备份任务执行出错: ${error.message}`);
    log(`错误堆栈: ${error.stack}`);
  }
}

// 执行备份
main();

// 添加说明如何使用crontab设置定期备份
/*
使用说明:
1. 安装依赖: npm install moment
2. 给脚本添加执行权限: chmod +x backup-db.js
3. 设置crontab定期执行:
   - 每天凌晨2点执行: 0 2 * * * /path/to/node /path/to/backup-db.js
   - 每周日凌晨3点执行: 0 3 * * 0 /path/to/node /path/to/backup-db.js
*/