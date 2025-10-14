import jwt from 'jsonwebtoken';

/**
 * 认证中间件
 * 验证用户的JWT令牌
 */
export const authMiddleware = (req, res, next) => {
  try {
    // 使用真实的token验证逻辑，移除模拟用户设置
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌格式'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: '无效或过期的认证令牌'
      });
    }
    
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    if (res && res.status) {
      return res.status(500).json({
        success: false,
        message: '认证过程中发生错误'
      });
    }
    // 如果res不可用，尝试调用next并传递错误
    if (next) {
      next(error);
    }
  }
};

/**
 * 管理员权限中间件
 * 验证用户是否为管理员
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  }
  next();
};

/**
 * 可选认证中间件
 * 尝试验证令牌，但不强制要求
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          req.user = {
            id: decoded.userId,
            username: decoded.username,
            role: decoded.role
          };
        } catch (jwtError) {
          // 无效token时不返回错误，只是不设置用户信息
          console.warn('无效的可选认证令牌');
        }
      }
    }
    next();
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    // 即使出错也继续执行
    next();
  }
};

export default authMiddleware;