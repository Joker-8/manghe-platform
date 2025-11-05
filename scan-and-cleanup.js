import fs from 'fs';
import path from 'path';

// 配置项
const config = {
  projectRoot: 'e:\\qdxm\\WebStorm\\manghe-platform',
  excludeDirs: ['.git', '.idea', 'node_modules', 'dist', 'build', 'coverage', 'uploads', 'test-reports'],
  filePatterns: {
    backups: /\.(bak|backup|old|orig|copy|backup\.js)$/i,
    temporary: /\.(tmp|temp|swp|swo|~)$/i,
    logs: /\.(log)$/i,
    testScripts: /(test|test-|test_).*\.js$/i,
  },
  // 关键文件扩展名，即使匹配模式也不删除
  criticalExtensions: ['.js', '.json', '.html', '.css', '.vue', '.jsx', '.ts', '.tsx', '.md', '.sql'],
  // 必须保留的文件
  mustKeepFiles: ['.gitignore', 'app.js', 'package.json', 'README.md', 'vite.config.js', 'index.html'],
  // 数据库文件也应保留
  mustKeepExtensions: ['.db'],
  // 必须保留的目录
  mustKeepDirs: ['src', 'routes', 'models', 'middleware', 'utils', 'public', 'data'],
};

// 结果统计
const results = {
  totalSize: 0,
  redundancySize: 0,
  redundancyCount: 0,
  byType: {},
  byDir: {},
  toDelete: [],
};

// 检查是否应该排除目录
function shouldExcludeDir(dir) {
  const relativePath = path.relative(config.projectRoot, dir);
  return config.excludeDirs.some(exclude => {
    const excludePath = path.normalize(exclude);
    return relativePath.includes(excludePath) || 
           path.basename(dir) === exclude;
  });
}

// 检查是否为关键文件
function isCriticalFile(filePath) {
  const fileName = path.basename(filePath);
  const extension = path.extname(filePath);
  
  // 检查是否在必须保留的文件列表中
  if (config.mustKeepFiles.includes(fileName)) {
    return true;
  }
  
  // 检查是否在必须保留的扩展名列表中
  if (config.mustKeepExtensions.includes(extension)) {
    return true;
  }
  
  // 检查是否是关键扩展名的文件，但不在排除模式中
  if (config.criticalExtensions.includes(extension)) {
    // 除非是备份或临时文件模式，否则保留
    if (config.filePatterns.backups.test(fileName) || 
        config.filePatterns.temporary.test(fileName)) {
      return false;
    }
    return true;
  }
  
  return false;
}

// 确定文件类型
function getFileType(fileName) {
  if (config.filePatterns.backups.test(fileName)) return 'backup';
  if (config.filePatterns.temporary.test(fileName)) return 'temporary';
  if (config.filePatterns.logs.test(fileName)) return 'log';
  if (config.filePatterns.testScripts.test(fileName)) return 'test_script';
  if (fileName.endsWith('.js') && !isCriticalFile(fileName)) return 'js_file';
  return 'other';
}

// 检查文件是否被引用
function isReferenced(filePath, rootDir) {
  // 简单实现：检查是否在package.json中被引用或是否为入口文件
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const fileRelativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
      
      // 检查scripts字段
      if (packageJson.scripts) {
        for (const script of Object.values(packageJson.scripts)) {
          if (script.includes(fileRelativePath)) {
            return true;
          }
        }
      }
      
      // 检查main字段
      if (packageJson.main === fileRelativePath) {
        return true;
      }
    } catch (err) {
      console.warn(`Error reading package.json: ${err.message}`);
    }
  }
  
  return false;
}

// 扫描目录
function scanDirectory(dir) {
  if (shouldExcludeDir(dir)) {
    console.log(`Excluding directory: ${dir}`);
    return;
  }
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    // 检查空目录
    if (entries.length === 0) {
      // 确认不是必须保留的目录
      const dirName = path.basename(dir);
      if (!config.mustKeepDirs.includes(dirName)) {
        const dirInfo = {
          path: dir,
          type: 'empty_directory',
          size: 0,
        };
        results.toDelete.push(dirInfo);
        results.redundancyCount++;
        updateStats('empty_directory', 0, dir);
      }
      return;
    }
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        scanFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}: ${err.message}`);
  }
}

// 扫描文件
function scanFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileName = path.basename(filePath);
    
    // 更新总大小
    results.totalSize += fileSize;
    
    // 检查是否为冗余文件
    if (!isCriticalFile(filePath) && !isReferenced(filePath, config.projectRoot)) {
      const fileType = getFileType(fileName);
      
      const fileInfo = {
        path: filePath,
        type: fileType,
        size: fileSize,
        modifiedTime: stats.mtime.toISOString(),
      };
      
      results.toDelete.push(fileInfo);
      results.redundancyCount++;
      results.redundancySize += fileSize;
      
      updateStats(fileType, fileSize, path.dirname(filePath));
    }
  } catch (err) {
    console.error(`Error scanning file ${filePath}: ${err.message}`);
  }
}

// 更新统计信息
function updateStats(type, size, dir) {
  // 按类型统计
  if (!results.byType[type]) {
    results.byType[type] = { count: 0, size: 0 };
  }
  results.byType[type].count++;
  results.byType[type].size += size;
  
  // 按目录统计
  const dirName = path.basename(dir);
  if (!results.byDir[dirName]) {
    results.byDir[dirName] = { count: 0, size: 0 };
  }
  results.byDir[dirName].count++;
  results.byDir[dirName].size += size;
}

// 格式化大小显示
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 生成报告
function generateReport() {
  const report = {
    scanDate: new Date().toISOString(),
    projectRoot: config.projectRoot,
    summary: {
      totalFilesScanned: results.totalSize,
      redundancyFound: results.redundancyCount,
      redundancySize: results.redundancySize,
      redundancyPercentage: ((results.redundancySize / results.totalSize) * 100).toFixed(2) + '%',
    },
    details: {
      byType: Object.entries(results.byType).map(([type, data]) => ({
        type,
        count: data.count,
        size: data.size,
        sizeFormatted: formatSize(data.size),
      })),
      byDirectory: Object.entries(results.byDir).map(([dir, data]) => ({
        directory: dir,
        count: data.count,
        size: data.size,
        sizeFormatted: formatSize(data.size),
      })),
      filesToDelete: results.toDelete.map(item => ({
        path: item.path,
        type: item.type,
        size: item.size,
        sizeFormatted: formatSize(item.size),
        modifiedTime: item.modifiedTime || 'N/A',
      })),
    },
  };
  
  // 保存报告
  const reportPath = path.join(config.projectRoot, 'cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n===== 清理报告 =====');
  console.log(`扫描时间: ${report.scanDate}`);
  console.log(`项目根目录: ${report.projectRoot}`);
  console.log('\n== 摘要 ==');
  console.log(`扫描文件总大小: ${formatSize(results.totalSize)}`);
  console.log(`发现冗余项数量: ${results.redundancyCount}`);
  console.log(`冗余总大小: ${formatSize(results.redundancySize)} (${report.summary.redundancyPercentage})`);
  
  console.log('\n== 按类型分布 ==');
  report.details.byType.forEach(item => {
    console.log(`- ${item.type}: ${item.count} 个文件, ${item.sizeFormatted}`);
  });
  
  console.log('\n== 按目录分布 ==');
  report.details.byDirectory.forEach(item => {
    console.log(`- ${item.directory}: ${item.count} 个文件, ${item.sizeFormatted}`);
  });
  
  console.log(`\n详细报告已保存至: ${reportPath}`);
  console.log('\n要执行删除操作，请运行: node scan-and-cleanup.js --delete');
  
  return report;
}

// 执行删除操作
function executeDelete() {
  console.log('\n开始执行删除操作...');
  let deletedCount = 0;
  let deletedSize = 0;
  let failedCount = 0;
  
  for (const item of results.toDelete) {
    try {
      if (item.type === 'empty_directory') {
        fs.rmdirSync(item.path);
      } else {
        fs.unlinkSync(item.path);
      }
      deletedCount++;
      deletedSize += item.size;
      console.log(`删除成功: ${item.path}`);
    } catch (err) {
      failedCount++;
      console.error(`删除失败 ${item.path}: ${err.message}`);
    }
  }
  
  const deleteReport = {
    deleteDate: new Date().toISOString(),
    deletedCount,
    deletedSize,
    deletedSizeFormatted: formatSize(deletedSize),
    failedCount,
  };
  
  const deleteReportPath = path.join(config.projectRoot, 'cleanup-execution-report.json');
  fs.writeFileSync(deleteReportPath, JSON.stringify(deleteReport, null, 2));
  
  console.log('\n===== 删除执行报告 =====');
  console.log(`删除时间: ${deleteReport.deleteDate}`);
  console.log(`成功删除: ${deletedCount} 个文件/目录 (${deleteReport.deletedSizeFormatted})`);
  console.log(`删除失败: ${failedCount} 个文件/目录`);
  console.log(`详细执行报告已保存至: ${deleteReportPath}`);
  
  return deleteReport;
}

// 主函数
function main() {
  console.log('开始扫描项目文件系统...');
  console.log(`项目根目录: ${config.projectRoot}`);
  
  scanDirectory(config.projectRoot);
  const report = generateReport();
  
  // 检查是否执行删除
  const args = process.argv.slice(2);
  if (args.includes('--delete')) {
    if (report.details.filesToDelete.length > 0) {
      console.log(`\n警告: 将要删除 ${report.details.filesToDelete.length} 个项目，总计 ${formatSize(results.redundancySize)}`);
      console.log('请再次确认是否继续删除操作 (y/n):');
      
      process.stdin.on('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        if (answer === 'y' || answer === 'yes') {
          executeDelete();
        } else {
          console.log('删除操作已取消');
        }
        process.stdin.pause();
      });
    } else {
      console.log('没有需要删除的文件');
    }
  }
}

// 运行主函数
main();