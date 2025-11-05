import dotenv from 'dotenv';
import { logger } from './logger.js';

// 加载环境变量
dotenv.config();

// 短信发送状态枚举
const SMS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
};

// 导出SMS_STATUS
export { SMS_STATUS };

// 短信模板
const SMS_TEMPLATES = {
  VERIFICATION_CODE: '【芒盒】{code}（注册验证码，请完成验证），如非本人操作，请忽略本短信。'
};

/**
 * 短信服务配置
 */
const SMS_CONFIG = {
  // 短信服务商配置
  PROVIDERS: {
    ALIYUN: {
      ACCESS_KEY_ID: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
      ACCESS_KEY_SECRET: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
      SIGN_NAME: process.env.ALIYUN_SMS_SIGN_NAME || '漫盒平台',
      TEMPLATE_CODE: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_466815407',
    },
    TENCENT: {
      SECRET_ID: process.env.TENCENT_SMS_SECRET_ID || '',
      SECRET_KEY: process.env.TENCENT_SMS_SECRET_KEY || '',
      SdkAppId: process.env.TENCENT_SMS_SDK_APP_ID || '1400613023',
      SignName: process.env.TENCENT_SMS_SIGN_NAME || '漫盒平台',
      TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID || '1000001',
    },
  },
  // 发送限制
  LIMITS: {
    MAX_ATTEMPTS_PER_DAY: 10, // 每手机号每天最大发送次数
    MAX_ATTEMPTS_PER_HOUR: 5,  // 每手机号每小时最大发送次数
    COOLDOWN_PERIOD: 60 * 1000, // 冷却期（毫秒）
  },
  // 默认短信内容
  DEFAULT_MESSAGE: '您的验证码是: {code}，有效期{expireTime}分钟，请勿泄露给他人',
  // 模拟模式（仅开发环境使用）
  MOCK_MODE: process.env.NODE_ENV !== 'production' && process.env.SMS_MOCK_MODE !== 'false',
};

/**
 * 手机号脱敏处理
 * @param {string} phone - 手机号
 * @returns {string} - 脱敏后的手机号
 */
function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string' || phone.length !== 11) {
    return phone || '';
  }
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * 生成请求ID
 * @returns {string} - 请求ID
 */
function generateRequestId() {
  return `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 模拟发送短信（用于开发环境）
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @param {object} options - 选项
 * @returns {Promise<object>} - 发送结果
 */
async function mockSendSms(phone, code, options = {}) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const provider = options.provider || 'mock';
  
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    // 随机模拟成功或失败（90%成功率）
    const isSuccess = Math.random() < 0.9;
    
    if (!isSuccess) {
      throw new Error('模拟短信发送失败: 网络错误');
    }
    
    const duration = Date.now() - startTime;
    
    const returnResult = {
      success: true,
      requestId,
      provider,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      message: `模拟短信已发送至 ${maskPhoneNumber(phone)}，验证码: ${code}`,
      mock: true
    };
    
    // 记录日志
    logger.info(`[SMS] 模拟短信发送成功`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      duration
    });
    
    return returnResult;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`[SMS] 模拟短信发送失败: ${error.message}`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      error: error.message,
      duration
    });
    
    return {
      success: false,
      requestId,
      provider,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      error: error.message,
      mock: true
    };
  }
}

/**
 * 发送短信（阿里云）
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @param {object} options - 选项
 * @returns {Promise<object>} - 发送结果
 */
async function sendSmsWithAliyun(phone, code, options = {}) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const provider = 'aliyun';
  const config = SMS_CONFIG.PROVIDERS.ALIYUN;
  
  try {
    // 检查配置
    if (!config.ACCESS_KEY_ID || !config.ACCESS_KEY_SECRET) {
      throw new Error('阿里云短信配置不完整');
    }
    
    // 在实际项目中，这里会调用阿里云SDK发送短信
    // 为了演示，我们仍然使用模拟方式
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));
    
    const duration = Date.now() - startTime;
    
    const returnResult = {
      success: true,
      requestId,
      provider,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      message: `短信已发送至 ${maskPhoneNumber(phone)}`,
      aliyunRequestId: `ALI${Date.now()}`,
      mock: true // 标记为模拟数据
    };
    
    // 记录发送结果
    logger.info(`[SMS] 阿里云短信发送成功`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      duration
    });
    
    return returnResult;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`[SMS] 阿里云短信发送失败: ${error.message}`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      error: error.message,
      stack: error.stack,
      duration
    });
    
    return {
      success: false,
      requestId,
      provider,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      error: error.message,
      errorCode: error.code || 'SMS_SEND_FAILED',
      mock: true
    };
  }
}

/**
 * 发送短信（腾讯云）
 * @param {string} phone - 手机号
 * @param {string} code - 验证码
 * @param {object} options - 选项
 * @returns {Promise<object>} - 发送结果
 */
async function sendSmsWithTencent(phone, code, options = {}) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const provider = 'tencent';
  const config = SMS_CONFIG.PROVIDERS.TENCENT;
  
  try {
    // 检查配置
    if (!config.SECRET_ID || !config.SECRET_KEY) {
      throw new Error('腾讯云短信配置不完整');
    }
    
    // 在实际项目中，这里会调用腾讯云SDK发送短信
    // 为了演示，我们仍然使用模拟方式
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 600));
    
    const duration = Date.now() - startTime;
    
    const returnResult = {
      success: true,
      requestId,
      provider,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      message: `短信已发送至 ${maskPhoneNumber(phone)}`,
      tencentRequestId: `TENCENT${Date.now()}`,
      mock: true // 标记为模拟数据
    };
    
    // 记录发送结果
    logger.info(`[SMS] 腾讯云短信发送成功`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      duration
    });
    
    return returnResult;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`[SMS] 腾讯云短信发送失败: ${error.message}`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      error: error.message,
      stack: error.stack,
      duration
    });
    
    return {
      success: false,
      requestId,
      provider,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      error: error.message,
      errorCode: error.code || 'SMS_SEND_FAILED',
      mock: true
    };
  }
}

/**
 * 发送短信验证码
 * @param {string} phone - 手机号码
 * @param {string} code - 验证码
 * @param {Object} options - 选项
 * @param {string} options.requestId - 请求ID
 * @param {string} options.ip - IP地址
 * @returns {Promise<Object>} - 返回发送结果
 */
async function sendSMS(phone, code, options = {}) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ip = options.ip || '127.0.0.1';
  
  try {
    // 参数验证
    if (!phone || typeof phone !== 'string' || phone.length !== 11) {
      throw new Error('手机号格式不正确');
    }
    
    if (!code || typeof code !== 'string' || !/^\d{4,6}$/.test(code)) {
      throw new Error('验证码格式不正确');
    }
    
    // 确定使用的提供商
    let provider = options.provider || 'mock';
    
    // 根据配置决定是否使用模拟模式
    if (SMS_CONFIG.MOCK_MODE) {
      provider = 'mock';
    }
    
    logger.info(`[SMS] 开始发送短信`, {
      requestId,
      phone: maskPhoneNumber(phone),
      provider,
      ip
    });
    
    let result;
    
    // 根据提供商选择发送方式
    switch (provider) {
      case 'aliyun':
        result = await sendSmsWithAliyun(phone, code, options);
        break;
      case 'tencent':
        result = await sendSmsWithTencent(phone, code, options);
        break;
      case 'mock':
      default:
        result = await mockSendSms(phone, code, { ...options, provider });
        break;
    }
    
    // 确保结果包含必要信息
  if (!result.requestId) {
    result.requestId = requestId;
  }
  
  // 添加状态字段以保持兼容性
  if (!result.status) {
    result.status = result.success ? SMS_STATUS.SENT : SMS_STATUS.FAILED;
  }
    
    const duration = Date.now() - startTime;
    result.duration = duration;
    
    // 记录发送结果
    logger.info(`[SMS] 短信发送完成`, {
      requestId: result.requestId,
      phone: maskPhoneNumber(phone),
      provider,
      success: result.success,
      duration
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`[SMS] 发送短信失败: ${error.message}`, {
      requestId,
      phone: maskPhoneNumber(phone),
      ip,
      error: error.message,
      stack: error.stack,
      duration
    });
    
    return {
      success: false,
      requestId,
      phone,
      code,
      timestamp: Date.now(),
      duration,
      error: error.message,
      errorCode: 'SMS_SEND_ERROR',
      ip
    };
  }
}

/**
 * 检查短信发送限制
 * @param {string} phone - 手机号
 * @returns {Promise<object>} - 限制检查结果
 */
async function checkSmsLimit(phone) {
  // 实际项目中，这里会查询数据库或缓存来检查发送限制
  // 为了演示，我们直接返回通过
  
  return {
    canSend: true,
    remaining: SMS_CONFIG.LIMITS.MAX_ATTEMPTS_PER_DAY,
    cooldown: 0,
    message: '可以发送短信'
  };
}

/**
 * 更新短信发送记录
 * @param {string} phone - 手机号
 * @param {object} result - 发送结果
 * @returns {Promise<void>}
 */
async function updateSmsRecord(phone, result) {
  // 实际项目中，这里会更新数据库中的发送记录
  // 为了演示，我们只记录日志
  
  logger.info(`[SMS] 更新发送记录`, {
    phone: maskPhoneNumber(phone),
    requestId: result.requestId,
    success: result.success
  });
}

/**
 * 重试发送短信
 * @param {string} phone - 手机号码
 * @param {string} code - 验证码
 * @param {Object} options - 选项
 * @param {number} options.retryCount - 已重试次数
 * @param {number} options.maxRetries - 最大重试次数
 * @param {string} options.requestId - 请求ID
 * @param {string} options.ip - IP地址
 * @returns {Promise<Object>} - 返回发送结果
 */
async function retrySendSMS(phone, code, options = {}) {
  const { retryCount = 0, maxRetries = 3, requestId = generateRequestId(), ip = '127.0.0.1' } = options;
  
  // 如果已达到最大重试次数，返回失败
  if (retryCount >= maxRetries) {
    logger.warn(`[SMS] 短信发送失败，已达到最大重试次数 (${maxRetries})`, {
      phone: maskPhoneNumber(phone),
      retryCount,
      maxRetries,
      requestId,
      ip
    });
    
    return {
      success: false,
      message: `短信发送失败，已达到最大重试次数 (${maxRetries})`,
      status: SMS_STATUS.FAILED,
      retryCount,
      maxRetries,
      timestamp: Date.now(),
      requestId,
      phone
    };
  }
  
  // 计算重试间隔（指数退避算法）
  // 添加随机抖动以避免重试风暴
  const baseDelay = Math.min(1000 * Math.pow(2, retryCount), 30000); // 最多30秒
  const jitter = Math.random() * 1000; // 0-1秒的随机抖动
  const delay = baseDelay + jitter;
  
  logger.info(`[SMS] 第${retryCount + 1}次重试发送短信到${maskPhoneNumber(phone)}，延迟${Math.round(delay)}ms`, {
    phone: maskPhoneNumber(phone),
    retryCount: retryCount + 1,
    maxRetries,
    delay: Math.round(delay),
    requestId,
    ip
  });
  
  try {
    // 等待延迟
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 再次发送，传递相同的请求ID和IP信息
    const result = await sendSMS(phone, code, { requestId, ip });
    
    // 如果发送失败，递归重试
    if (!result.success) {
      return retrySendSMS(phone, code, {
        retryCount: retryCount + 1,
        maxRetries,
        requestId,
        ip
      });
    }
    
    // 返回成功结果
    return {
      ...result,
      retryCount,
      maxRetries,
      success: true
    };
  } catch (error) {
    logger.error(`[SMS] 重试发送短信异常: ${error.message}`, {
      phone: maskPhoneNumber(phone),
      retryCount,
      maxRetries,
      error: error.message,
      stack: error.stack,
      requestId,
      ip
    });
    
    // 即使发生异常，也继续重试
    return retrySendSMS(phone, code, {
      retryCount: retryCount + 1,
      maxRetries,
      requestId,
      ip
    });
  }
}

/**
 * 批量发送短信
 * @param {Array<{phone: string, code: string}>} messages - 短信列表
 * @param {object} options - 选项
 * @returns {Promise<Array<object>>} - 发送结果列表
 */
async function batchSendSms(messages, options = {}) {
  if (!Array.isArray(messages)) {
    throw new Error('messages参数必须是数组');
  }
  
  const results = await Promise.allSettled(
    messages.map(({ phone, code }) => 
      sendVerificationSms(phone, code, options)
    )
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        phone: messages[index].phone,
        code: messages[index].code,
        error: result.reason?.message || '发送失败',
        timestamp: Date.now()
      };
    }
  });
}

/**
 * 获取短信发送状态
 * @param {string} requestId - 请求ID
 * @returns {Promise<object>} - 发送状态
 */
async function getSmsStatus(requestId) {
  // 实际项目中，这里会调用短信服务商API查询状态
  // 为了演示，我们返回模拟状态
  
  return {
    requestId,
    status: 'DELIVERED', // 可能的值: SENDING, DELIVERED, FAILED
    timestamp: Date.now(),
    mock: true
  };
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} - 是否有效
 */
function isValidPhone(phone) {
  // 中国大陆手机号验证
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 生成短信验证码
 * @param {number} length - 验证码长度，默认为6
 * @returns {string} - 验证码
 */
function generateVerificationCode(length = 6) {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 获取短信配置信息
 * @returns {object} - 配置信息
 */
function getSmsConfig() {
  return {
    limits: SMS_CONFIG.LIMITS,
    mockMode: SMS_CONFIG.MOCK_MODE,
    availableProviders: ['mock', 'aliyun', 'tencent'].filter(provider => {
      if (provider === 'mock') return true;
      if (provider === 'aliyun') {
        const config = SMS_CONFIG.PROVIDERS.ALIYUN;
        return config.ACCESS_KEY_ID && config.ACCESS_KEY_SECRET;
      }
      if (provider === 'tencent') {
        const config = SMS_CONFIG.PROVIDERS.TENCENT;
        return config.SECRET_ID && config.SECRET_KEY;
      }
      return false;
    })
  };
}

/**
 * 检查验证码是否可以重新发送
 * @param {number} lastSentAt - 上次发送时间戳
 * @param {number} coolDownTime - 冷却时间（毫秒）
 * @returns {Object} - 返回是否可以发送和剩余时间
 */
function checkResendAvailability(lastSentAt, coolDownTime = 60000) {
  const now = Date.now();
  const elapsedTime = now - lastSentAt;
  const remainingTime = Math.max(0, coolDownTime - elapsedTime);
  
  return {
    canResend: elapsedTime >= coolDownTime,
    remainingTime: Math.ceil(remainingTime / 1000), // 转换为秒
    elapsedTime,
    coolDownTime
  };
}

/**
 * 获取剩余冷却时间
 * @param {number} lastSentAt - 上次发送时间戳
 * @param {number} coolDownTime - 冷却时间（毫秒）
 * @returns {number} - 剩余冷却时间（秒）
 */
function getRemainingTime(lastSentAt, coolDownTime = 60000) {
  const { remainingTime } = checkResendAvailability(lastSentAt, coolDownTime);
  return remainingTime;
}

/**
 * 验证短信发送结果
 * @param {Object} result - 发送结果
 * @returns {boolean} - 是否发送成功
 */
function verifySendResult(result) {
  return result && result.success && 
         [SMS_STATUS.SENT, SMS_STATUS.DELIVERED].includes(result.status);
}

// 导出模块
export {
  sendSMS,
  retrySendSMS,
  checkResendAvailability,
  getRemainingTime,
  verifySendResult,
  isValidPhone,
  generateVerificationCode,
  getSmsConfig,
  maskPhoneNumber,
  SMS_CONFIG,
  SMS_TEMPLATES
};

// 默认导出
export default {
  sendSMS,
  retrySendSMS,
  checkResendAvailability,
  getRemainingTime,
  verifySendResult,
  isValidPhone,
  generateVerificationCode,
  SMS_STATUS
};