import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { logger, maskSensitiveInfo } from './utils/logger.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import communityRoutes from './routes/community.js'
import adminRoutes from './routes/admin.js'
import { initializeDatabase, setupDatabaseHealthCheck } from './utils/database.js'

// 配置文件上传存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads')
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const fileExt = path.extname(file.originalname)
        const fileName = file.fieldname + '-' + uniqueSuffix + fileExt
        cb(null, fileName)
    }
})

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        // 允许的图片类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('只允许上传图片文件（JPEG、PNG、GIF、WebP）'), false)
        }
    }
})

dotenv.config()

// 端口配置
const PORT = process.env.PORT || 3004
const ALTERNATIVE_PORT = 3017

const app = express()

// 中间件配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // 限制请求体大小
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全中间件
app.use((req, res, next) => {
  // 设置安全头
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// 增强的请求日志中间件
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  const ip = req.ip || req.connection.remoteAddress;
  
  // 敏感路径过滤
  const isSensitivePath = ['/login', '/register', '/send-code', '/phone-login'].some(path => 
    req.path.includes(path)
  );
  
  // 记录请求开始
  logger.info(`📡 [${requestId}] 收到请求: ${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    ip: maskSensitiveInfo(ip)
  });
  
  // 只记录非敏感信息
  let logBody;
  if (isSensitivePath) {
    logBody = {};
    // 对于敏感路径，只记录必要的非敏感字段
    if (req.body.phone) logBody.phone = maskSensitiveInfo(req.body.phone);
    if (req.body.email) logBody.email = maskSensitiveInfo(req.body.email);
  } else {
    logBody = { ...req.body };
    // 隐藏敏感字段
    Object.keys(logBody).forEach(key => {
      if (['password', 'cardNumber', 'token', 'secret'].some(sensitive => 
        key.toLowerCase().includes(sensitive)
      )) {
        logBody[key] = '***';
      }
    });
  }
  
  logger.debug(`📝 [${requestId}] 请求体摘要:`, {
    requestId,
    body: JSON.stringify(logBody).substring(0, 500) + 
          (JSON.stringify(logBody).length > 500 ? '...' : '')
  });
  
  // 捕获响应完成事件
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - startTime;
    
    // 根据状态码设置日志级别
    const logData = {
      requestId,
      statusCode: res.statusCode,
      path: req.path,
      duration: duration,
      ip: maskSensitiveInfo(ip)
    };
    
    if (res.statusCode >= 500) {
      logger.error(`❌ [${requestId}] 发送响应: ${res.statusCode} ${req.path} (耗时: ${duration}ms)`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`⚠️ [${requestId}] 发送响应: ${res.statusCode} ${req.path} (耗时: ${duration}ms)`, logData);
    } else {
      logger.info(`📤 [${requestId}] 发送响应: ${res.statusCode} ${req.path} (耗时: ${duration}ms)`, logData);
    }
    
    return originalSend.call(this, body);
  };
  
  next();
});

// 请求限流中间件
const rateLimit = {};
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!rateLimit[ip]) {
    rateLimit[ip] = { count: 0, lastReset: now };
  }
  
  // 每60秒重置计数
  if (now - rateLimit[ip].lastReset > 60000) {
    rateLimit[ip] = { count: 1, lastReset: now };
  } else {
    rateLimit[ip].count++;
    
    // 限制每分钟100个请求
    if (rateLimit[ip].count > 100) {
      logger.warn('请求过于频繁', {
        ip: maskSensitiveInfo(ip),
        path: req.path,
        count: rateLimit[ip].count
      });
      return res.status(429).json({ error: '请求过于频繁，请稍后再试' });
    }
  }
  
  next();
});

app.use(express.static('public'))
// 静态文件服务，用于访问上传的文件
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// 直接解构导入数据库工具函数
import { isDbConnected, getConnection, enhancedUseDb } from './utils/database.js';

// 使数据库操作和连接状态检查在路由中可用
app.use((req, res, next) => {
  req.useDb = enhancedUseDb
  req.isDbConnected = isDbConnected
  req.db = getConnection() // 提供直接的数据库连接
  next()
})

// 将multer实例挂载到app上，供路由使用
app.locals.upload = upload

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/community', communityRoutes)
app.use('/api/admin', adminRoutes)

// 全局错误处理中间件
app.use((err, req, res, next) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  const ip = req.ip || req.connection.remoteAddress;
  
  // 记录错误
  logger.error(`❌ [${requestId}] 发生错误: ${err.message}`, {
    requestId,
    path: req.path,
    method: req.method,
    ip: maskSensitiveInfo(ip),
    error: err.stack || err.message
  });
  
  // 根据错误类型返回适当的响应
  if (err.name === 'MulterError') {
    // 文件上传错误
    return res.status(400).json({
      success: false,
      message: `文件上传错误: ${err.message}`
    });
  }
  
  // 默认500错误响应
  res.status(500).json({
    success: false,
    message: '服务器内部错误，请稍后重试',
    errorId: requestId // 提供错误ID，便于后续排查
  });
});

// 基础路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '芒盒后端服务运行正常' })
})

// 简单的进程监控 - 避免过度复杂的进程保护
function startSimpleMonitor() {
  // 定期检查服务器状态
  setInterval(() => {
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    logger.info(`🖥️  服务器状态 | 内存: ${memoryUsage}MB | PID: ${process.pid}`);
  }, 60000); // 每分钟检查一次
  
  logger.info('✅ 简单进程监控已启动');
}

// 启动服务器
async function startServer() {
  try {
    logger.info(`🚀 正在启动服务器，监听端口 ${PORT}...`);
    
    // 首先尝试初始化数据库
    try {
      logger.info('🔄 正在初始化数据库连接...');
      await initializeDatabase();
      logger.info('✅ 数据库初始化成功');
      await setupDatabaseHealthCheck();
      logger.info('✅ 数据库健康检查已设置');
    } catch (dbError) {
      logger.error('❌ 数据库初始化失败，但服务器将继续启动:', dbError.message);
    }
    
    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      logger.info(`✅ 芒盒后端服务成功运行在端口 ${PORT}`);
      startSimpleMonitor(); // 启动简单监控
    });
    
    // 处理服务器错误
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ 端口 ${PORT} 已被占用`);
        
        // 尝试使用备用端口
        logger.info(`🔄 尝试使用备用端口 ${ALTERNATIVE_PORT}...`);
        
        try {
          const altServer = app.listen(ALTERNATIVE_PORT, () => {
            logger.info(`✅ 芒盒后端服务成功运行在备用端口 ${ALTERNATIVE_PORT}`);
            startSimpleMonitor();
          });
          
          altServer.on('error', (altError) => {
            logger.error(`❌ 备用端口 ${ALTERNATIVE_PORT} 也不可用:`, altError);
            logger.error('❌ 服务器无法启动，将退出进程');
            process.exit(1); // 允许进程退出，便于外部监控重启
          });
        } catch (altError) {
          logger.error(`❌ 备用端口 ${ALTERNATIVE_PORT} 启动失败:`, altError);
          logger.error('❌ 服务器无法启动，将退出进程');
          process.exit(1);
        }
      } else {
        logger.error('❌ 服务器启动错误:', error);
      }
    });
    
    // 优雅关闭
    process.on('SIGINT', () => {
      logger.info('📤 收到关闭信号，正在优雅关闭服务器...');
      server.close(() => {
        logger.info('✅ 服务器已关闭');
        process.exit(0);
      });
    });
    
  } catch (startupError) {
    logger.error('❌ 服务器启动失败:', startupError);
    logger.info('⚠️  启动备用服务模式...');
    
    // 在主服务失败时启动备用HTTP服务器
    const http = require('http');
    const fallbackServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'running_in_fallback_mode',
        message: '芒盒后端服务以备用模式运行',
        timestamp: new Date().toISOString()
      }));
    });
    
    fallbackServer.listen(3008, () => {
      // 修复端口号日志
      logger.info(`🟢 备用服务已启动在端口 3008`);
    });
  }
}

// 启动服务器
startServer().catch(error => {
  logger.error('❌ 服务器启动过程中发生未捕获错误:', error);
  process.exit(1);
});