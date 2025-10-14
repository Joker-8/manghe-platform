const fs = require('fs');
const path = require('path');

// 结果存储
const results = {
  emptyFolders: [],
  emptyFiles: [],
  suspiciousFiles: []
};

// 扫描函数
function scanDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath);
    
    // 检查空文件夹
    if (files.length === 0) {
      results.emptyFolders.push(dirPath);
      return;
    }
    
    // 遍历文件和子目录
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // 递归扫描子目录
        scanDirectory(fullPath);
      } else if (stats.isFile()) {
        // 检查空文件
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.trim() === '') {
          results.emptyFiles.push(fullPath);
        } else if (content.length < 100) {
          // 检查可能不完整的小文件
          results.suspiciousFiles.push({
            path: fullPath,
            size: content.length,
            content: content.trim()
          });
        }
      }
    });
  } catch (error) {
    console.error(`扫描目录 ${dirPath} 时出错:`, error.message);
  }
}

// 开始扫描
console.log('开始扫描项目文件系统...');
scanDirectory(process.cwd());

// 输出结果
console.log('\n======== 扫描结果 ========');
console.log(`\n1. 空文件夹 (${results.emptyFolders.length}):`);
results.emptyFolders.forEach(folder => {
  console.log(`   - ${folder}`);
});

console.log(`\n2. 空文件 (${results.emptyFiles.length}):`);
results.emptyFiles.forEach(file => {
  console.log(`   - ${file}`);
});

console.log(`\n3. 可能不完整的小文件 (${results.suspiciousFiles.length}):`);
results.suspiciousFiles.forEach(file => {
  console.log(`   - ${file.path} (大小: ${file.size} 字节)`);
  console.log(`     内容: "${file.content}"`);
});

console.log('\n扫描完成！');

// 将结果保存到JSON文件
fs.writeFileSync(
  'scan-results.json', 
  JSON.stringify(results, null, 2), 
  'utf8'
);
console.log('\n扫描结果已保存到 scan-results.json 文件');