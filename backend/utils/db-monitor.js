// 数据库性能监控和健康检查模块
import { pool, isDbConnected } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 为ES模块创建__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseMonitor {
  constructor() {
    this.metrics = {
      queryCount: 0,
      queryErrors: 0,
      queryTimeTotal: 0,
      slowQueries: 0,
      slowQueryThreshold: 1000, // 1秒以上认为是慢查询
      connectionAttempts: 0,
      connectionFailures: 0,
      startTime: Date.now()
    };
    
    this.logDir = path.join(process.cwd(), 'logs');
    this.metricsFile = path.join(this.logDir, 'db-metrics.json');
    
    // 确保日志目录存在
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  
  // 记录查询执行情况
  recordQueryExecution(duration, success = true) {
    this.metrics.queryCount++;
    this.metrics.queryTimeTotal += duration;
    
    if (!success) {
      this.metrics.queryErrors++;
    }
    
    if (duration > this.metrics.slowQueryThreshold) {
      this.metrics.slowQueries++;
      console.warn(`⚠️  慢查询警告: ${duration}ms`);
      this.logSlowQuery(duration);
    }
    
    // 每分钟保存一次指标
    if (this.metrics.queryCount % 100 === 0) {
      this.saveMetrics();
    }
  }
  
  // 记录连接尝试
  recordConnectionAttempt(success = true) {
    this.metrics.connectionAttempts++;
    if (!success) {
      this.metrics.connectionFailures++;
    }
  }
  
  // 记录慢查询
  logSlowQuery(duration) {
    const logFile = path.join(this.logDir, 'slow-queries.log');
    const logEntry = `[${new Date().toISOString()}] 慢查询执行时间: ${duration}ms\n`;
    
    fs.appendFileSync(logFile, logEntry, 'utf8');
  }
  
  // 获取性能统计
  getPerformanceStats() {
    const uptime = Date.now() - this.metrics.startTime;
    const avgQueryTime = this.metrics.queryCount > 0 
      ? this.metrics.queryTimeTotal / this.metrics.queryCount 
      : 0;
    
    return {
      uptime: `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`,
      queryCount: this.metrics.queryCount,
      queryErrors: this.metrics.queryErrors,
      errorRate: this.metrics.queryCount > 0 
        ? ((this.metrics.queryErrors / this.metrics.queryCount) * 100).toFixed(2) + '%' 
        : '0%',
      avgQueryTime: `${avgQueryTime.toFixed(2)}ms`,
      slowQueries: this.metrics.slowQueries,
      slowQueryRate: this.metrics.queryCount > 0 
        ? ((this.metrics.slowQueries / this.metrics.queryCount) * 100).toFixed(2) + '%' 
        : '0%',
      connectionAttempts: this.metrics.connectionAttempts,
      connectionFailures: this.metrics.connectionFailures,
      connectionSuccessRate: this.metrics.connectionAttempts > 0 
        ? (((this.metrics.connectionAttempts - this.metrics.connectionFailures) / this.metrics.connectionAttempts) * 100).toFixed(2) + '%' 
        : 'N/A',
      isDbConnected: isDbConnected(),
      timestamp: new Date().toISOString()
    };
  }
  
  // 保存指标到文件
  saveMetrics() {
    const stats = this.getPerformanceStats();
    const metricsHistory = this.loadMetricsHistory();
    
    // 只保留最近24小时的数据点（每小时一个）
    const now = Date.now();
    const oneHour = 3600000;
    const filteredHistory = metricsHistory.filter(entry => 
      now - new Date(entry.timestamp).getTime() < 24 * oneHour
    );
    
    filteredHistory.push(stats);
    
    try {
      fs.writeFileSync(this.metricsFile, JSON.stringify(filteredHistory, null, 2), 'utf8');
      console.log('📊 数据库性能指标已保存');
    } catch (error) {
      console.error('❌ 保存数据库性能指标失败:', error);
    }
  }
  
  // 加载历史指标
  loadMetricsHistory() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ 加载历史性能指标失败:', error);
    }
    return [];
  }
  
  // 执行健康检查
  async performHealthCheck() {
    console.log('🔍 执行数据库深度健康检查...');
    
    const checkResults = {
      timestamp: new Date().toISOString(),
      connected: isDbConnected(),
      checks: []
    };
    
    if (isDbConnected()) {
      try {
        // 检查连接池状态
        const poolStatus = pool.status();
        checkResults.checks.push({
          name: '连接池状态',
          status: 'ok',
          details: {
            active: poolStatus.active,
            idle: poolStatus.idle,
            waiting: poolStatus.waiting,
            total: poolStatus.active + poolStatus.idle
          }
        });
        
        // 检查数据库响应时间
        const startTime = Date.now();
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        const responseTime = Date.now() - startTime;
        
        checkResults.checks.push({
          name: '响应时间',
          status: responseTime < 100 ? 'good' : responseTime < 500 ? 'warning' : 'critical',
          details: { time: `${responseTime}ms` }
        });
        
        // 检查数据库版本
        const [versionResult] = await pool.query('SELECT VERSION() as version');
        checkResults.checks.push({
          name: '数据库版本',
          status: 'ok',
          details: { version: versionResult[0].version }
        });
        
      } catch (error) {
        checkResults.checks.push({
          name: '数据库操作',
          status: 'error',
          details: { error: error.message }
        });
      }
    } else {
      checkResults.checks.push({
        name: '数据库连接',
        status: 'error',
        details: { message: '数据库未连接，系统运行在降级模式' }
      });
    }
    
    // 保存健康检查结果
    this.saveHealthCheckResults(checkResults);
    
    console.log('✅ 数据库健康检查完成');
    return checkResults;
  }
  
  // 保存健康检查结果
  saveHealthCheckResults(results) {
    const logFile = path.join(this.logDir, 'db-health-checks.log');
    const logEntry = JSON.stringify(results) + '\n';
    
    try {
      fs.appendFileSync(logFile, logEntry, 'utf8');
    } catch (error) {
      console.error('❌ 保存健康检查结果失败:', error);
    }
  }
  
  // 生成性能报告
  generatePerformanceReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: this.getPerformanceStats(),
      recommendations: this.generateRecommendations()
    };
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const reportFile = path.join(this.logDir, `db-performance-report-${year}${month}${day}.json`);
    
    try {
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
      console.log(`📈 性能报告已生成: ${reportFile}`);
    } catch (error) {
      console.error('❌ 生成性能报告失败:', error);
    }
    
    return report;
  }
  
  // 启动定期报告生成
  startPeriodicReporting() {
    // 每小时生成一次性能报告
    setInterval(() => {
      const report = this.generatePerformanceReport();
      
      // 记录报告生成日志
      console.log('📊 已生成数据库性能报告');
    }, 60 * 60 * 1000); // 1小时
  }
  
  // 获取当前指标数据
  getMetrics() {
    const connectionSuccessRate = this.metrics.connectionAttempts > 0 
      ? ((this.metrics.connectionAttempts - this.metrics.connectionFailures) / this.metrics.connectionAttempts) * 100 
      : 0;
      
    const querySuccessRate = this.metrics.queryCount > 0 
      ? (1 - this.metrics.queryErrors / this.metrics.queryCount) * 100 
      : 0;
      
    const avgQueryTime = this.metrics.queryCount > 0 
      ? this.metrics.queryTimeTotal / this.metrics.queryCount 
      : 0;
      
    return {
      connectionAttempts: this.metrics.connectionAttempts,
      connectionFailures: this.metrics.connectionFailures,
      connectionSuccessRate: connectionSuccessRate,
      queryCount: this.metrics.queryCount,
      queryErrors: this.metrics.queryErrors,
      querySuccessRate: querySuccessRate,
      avgQueryTime: avgQueryTime,
      slowQueries: this.metrics.slowQueries,
      uptimeMs: Date.now() - this.metrics.startTime
    };
  }
  
  // 生成优化建议
  generateRecommendations() {
    const recommendations = [];
    const stats = this.getPerformanceStats();
    
    // 根据错误率生成建议
    const errorRate = parseFloat(stats.errorRate);
    if (errorRate > 5) {
      recommendations.push({
        severity: 'high',
        category: '错误率',
        description: `数据库错误率较高 (${errorRate}%)`,
        recommendation: '检查数据库错误日志，排查连接问题和SQL语法错误'
      });
    }
    
    // 根据慢查询生成建议
    const slowQueryRate = parseFloat(stats.slowQueryRate);
    if (slowQueryRate > 10) {
      recommendations.push({
        severity: 'high',
        category: '慢查询',
        description: `慢查询比例较高 (${slowQueryRate}%)`,
        recommendation: '优化慢查询，添加适当的索引，重构复杂查询'
      });
    }
    
    // 根据平均查询时间生成建议
    const avgQueryTime = parseFloat(stats.avgQueryTime);
    if (avgQueryTime > 200) {
      recommendations.push({
        severity: 'medium',
        category: '查询性能',
        description: `平均查询时间较长 (${avgQueryTime}ms)`,
        recommendation: '考虑优化数据库索引，检查服务器资源使用情况'
      });
    }
    
    // 如果没有连接到数据库
    if (!stats.isDbConnected) {
      recommendations.push({
        severity: 'critical',
        category: '数据库连接',
        description: '系统当前运行在降级模式，使用文件存储',
        recommendation: '检查数据库服务器状态，验证连接参数，修复连接问题'
      });
    }
    
    // 连接失败率建议
    const connectionFailureRate = this.metrics.connectionAttempts > 0 
      ? (this.metrics.connectionFailures / this.metrics.connectionAttempts * 100)
      : 0;
    
    if (connectionFailureRate > 10) {
      recommendations.push({
        severity: 'high',
        category: '连接稳定性',
        description: `连接失败率较高 (${connectionFailureRate.toFixed(2)}%)`,
        recommendation: '检查网络稳定性，验证数据库服务器资源，考虑增加连接超时设置'
      });
    }
    
    return recommendations;
  }
  
  // 重置指标
  resetMetrics() {
    this.metrics = {
      queryCount: 0,
      queryErrors: 0,
      queryTimeTotal: 0,
      slowQueries: 0,
      slowQueryThreshold: this.metrics.slowQueryThreshold,
      connectionAttempts: 0,
      connectionFailures: 0,
      startTime: Date.now()
    };
    
    console.log('🔄 数据库性能指标已重置');
  }
}

// 导出单例实例
const dbMonitor = new DatabaseMonitor();

// 设置定期健康检查
setInterval(() => {
  dbMonitor.performHealthCheck().catch(console.error);
}, 600000); // 每10分钟执行一次

// 设置定期性能报告生成
setInterval(() => {
  dbMonitor.generatePerformanceReport();
}, 3600000); // 每小时生成一次报告

// 初始执行一次健康检查
setTimeout(() => {
  dbMonitor.performHealthCheck().catch(console.error);
}, 5000);

export default dbMonitor;
export { DatabaseMonitor };