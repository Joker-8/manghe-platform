// 日志模块
// 提供统一的日志记录功能，支持不同级别的日志输出和文件记录

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 日志级别
export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info', 
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
};

// 当前日志级别
let currentLevel = LOG_LEVELS.INFO;

// 日志文件路径
const logDir = path.join(__dirname, '..', 'logs');

// 动态获取当天日志文件路径的函数
function getLogFilePath(prefix) {
    const today = new Date().toISOString().split('T')[0];
    return path.join(logDir, `${prefix}-${today}.log`);
}

// 获取主日志文件路径
function getMainLogFile() {
    return getLogFilePath('app');
}

// 获取验证码日志文件路径
function getVerificationLogFile() {
    return getLogFilePath('verification');
}

// 获取短信日志文件路径
function getSmsLogFile() {
    return getLogFilePath('sms');
}

// 获取错误日志文件路径
function getErrorLogFile() {
    return getLogFilePath('error');
}

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 格式化时间戳
 * @returns {string} 格式化的时间字符串
 */
function formatTimestamp() {
    const date = new Date();
    return date.toISOString();
}

/**
 * 格式化详细时间戳（用于调试）
 * @returns {string} 格式化的详细时间字符串
 */
function formatDetailedTimestamp() {
    const date = new Date();
    return date.toISOString().replace('T', ' ').replace('Z', '');
}

/**
 * 写入日志到文件（同步版本，确保日志立即写入）
 * @param {string} logMessage - 日志消息
 * @param {string} filePath - 文件路径
 */
function writeLogToFileSync(logMessage, filePath = getMainLogFile()) {
    try {
        // 确保目录存在
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.appendFileSync(filePath, logMessage + '\n', 'utf8');
    } catch (error) {
        console.error(`无法写入日志文件: ${error.message}`);
    }
}

/**
 * 写入多个日志文件（同步版本，确保日志立即写入）
 * @param {string} logMessage - 日志消息
 * @param {Array<string>} filePaths - 文件路径数组
 */
function writeToMultipleFileSync(logMessage, filePaths) {
    try {
        filePaths.forEach(filePath => writeLogToFileSync(logMessage, filePath));
    } catch (error) {
        console.error(`无法写入多个日志文件: ${error.message}`);
    }
}

/**
 * 记录日志
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} [meta] - 额外信息
 * @param {Array<string>} [extraFiles] - 额外的日志文件路径
 */
async function log(level, message, meta = {}, extraFiles = []) {
    // 检查日志级别
    const levelOrder = [LOG_LEVELS.DEBUG, LOG_LEVELS.INFO, LOG_LEVELS.WARN, LOG_LEVELS.ERROR, LOG_LEVELS.CRITICAL];
    if (levelOrder.indexOf(level) < levelOrder.indexOf(currentLevel)) {
        return;
    }

    // 格式化日志消息
    const timestamp = formatDetailedTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    const logMessage = `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;

    // 输出到控制台
    const consoleLog = (level) => {
        switch (level) {
            case LOG_LEVELS.ERROR:
            case LOG_LEVELS.CRITICAL:
                console.error(logMessage);
                break;
            case LOG_LEVELS.WARN:
                console.warn(logMessage);
                break;
            case LOG_LEVELS.DEBUG:
                console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    };
    
    consoleLog(level);

    // 确定写入的文件
    let filesToWrite = [getMainLogFile()];
    if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.CRITICAL) {
        filesToWrite.push(getErrorLogFile());
    }
    filesToWrite = [...new Set([...filesToWrite, ...extraFiles])];

    // 写入到文件（使用同步方法确保日志立即写入）
    writeToMultipleFileSync(logMessage, filesToWrite);
}

/**
 * 脱敏处理手机号
 * @param {string} phone - 手机号
 * @returns {string} 脱敏后的手机号
 */
export function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * 脱敏处理验证码
 * @param {string} code - 验证码
 * @returns {string} 脱敏后的验证码
 */
export function maskVerificationCode(code) {
    if (!code || code.length !== 6) return code;
    return code.slice(0, 2) + '***' + code.slice(-1);
}

/**
 * 脱敏处理API密钥
 * @param {string} apiKey - API密钥
 * @returns {string} 脱敏后的API密钥
 */
export function maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) return 'API_KEY';
    return apiKey.slice(0, 4) + '****' + apiKey.slice(-4);
}

/**
 * 记录验证码相关日志
 * @param {string} action - 操作类型
 * @param {Object} data - 验证码数据
 */
export async function logVerificationCode(action, data) {
    const { phone, code, expiresAt, ip, userAgent, requestId, source } = data;
    const maskedPhone = maskPhone(phone);
    const maskedCode = code ? maskVerificationCode(code) : null;
    
    const message = `验证码操作 - 动作: ${action}, 手机号: ${maskedPhone}`;
    
    const metaData = {
        action,
        phone: maskedPhone,
        codeMasked: maskedCode,
        expiresAt,
        ip,
        userAgent,
        requestId,
        source,
        timestamp: Date.now()
    };
    
    // 添加验证码专用日志文件
    await log(LOG_LEVELS.INFO, message, metaData, [verificationLogFile]);
}

/**
 * 记录短信发送相关日志
 * @param {Object} smsResult - 短信发送结果
 * @param {Object} context - 上下文信息
 */
export async function logSmsSend(smsResult, context) {
    const { phone, ip, requestId, duration, retryCount, error } = context;
    const maskedPhone = maskPhone(phone);
    
    // 脱敏敏感信息
    const sanitizedResult = { ...smsResult };
    if (sanitizedResult.apiKey) {
        sanitizedResult.apiKey = maskApiKey(sanitizedResult.apiKey);
    }
    if (sanitizedResult.apiSecret) {
        sanitizedResult.apiSecret = 'API_SECRET';
    }
    
    const status = smsResult.success ? 'success' : 'failed';
    const message = `短信发送 - 状态: ${status}, 手机号: ${maskedPhone}`;
    const level = status === 'success' ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    
    await log(level, message, {
        status,
        phone: maskedPhone,
        duration,
        retryCount,
        requestId,
        ip,
        provider: sanitizedResult.provider,
        messageId: sanitizedResult.messageId,
        error: error || sanitizedResult.error,
        errorCode: sanitizedResult.errorCode,
        timestamp: Date.now()
    }, [smsLogFile, verificationLogFile]);
}

/**
 * 记录验证码验证结果日志
 * @param {boolean} success - 是否验证成功
 * @param {string} phone - 手机号
 * @param {Object} [extra] - 额外信息（如错误原因、尝试次数等）
 */
export async function logVerificationResult(success, phone, extra = {}) {
    const maskedPhone = maskPhone(phone);
    const status = success ? 'success' : 'failed';
    const message = `验证码验证 - 状态: ${status}, 手机号: ${maskedPhone}`;
    
    const metaData = {
        status,
        phone: maskedPhone,
        ...extra,
        timestamp: Date.now()
    };
    
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    await log(level, message, metaData, [verificationLogFile]);
}

/**
 * 记录错误详情，包含堆栈信息
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文
 * @param {Object} [extra] - 额外信息
 */
export async function logError(error, context, extra = {}) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const message = `${context} - 错误: ${errorObj.message}`;
    
    await log(LOG_LEVELS.ERROR, message, {
        errorMessage: errorObj.message,
        errorStack: errorObj.stack,
        errorName: errorObj.name,
        errorCode: errorObj.code || 'UNKNOWN',
        ...extra,
        timestamp: Date.now()
    }, [errorLogFile]);
}

/**
 * 记录健康检查日志
 * @param {string} component - 组件名称
 * @param {string} status - 健康状态
 * @param {Object} [extra] - 额外信息
 */
export async function logHealthCheck(component, status, extra = {}) {
    const message = `健康检查 - 组件: ${component}, 状态: ${status}`;
    const level = status === 'healthy' ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;
    
    await log(level, message, {
        component,
        status,
        ...extra,
        timestamp: Date.now()
    });
}

/**
 * 记录API请求日志
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {number} responseTime - 响应时间
 */
export async function logApiRequest(req, res, responseTime) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const method = req.method;
    const path = req.path;
    const statusCode = res.statusCode;
    const userId = req.user?.id || 'unauthenticated';
    
    // 敏感路径隐藏参数
    const sensitivePaths = ['/auth/send-code', '/auth/phone-login', '/auth/login', '/auth/register'];
    const logPath = sensitivePaths.includes(path) ? `${path} (参数已隐藏)` : path;
    
    // 确定日志级别
    let level = LOG_LEVELS.INFO;
    if (statusCode >= 500) {
        level = LOG_LEVELS.ERROR;
    } else if (statusCode >= 400) {
        level = LOG_LEVELS.WARN;
    }
    
    // 为认证相关请求添加额外日志文件
    const extraFiles = [];
    if (path.includes('/auth/')) {
        extraFiles.push(verificationLogFile);
    }
    
    await log(level, `API请求`, {
        method,
        path: logPath,
        statusCode,
        responseTime: `${responseTime}ms`,
        ip,
        userAgent,
        userId,
        requestId: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
    }, extraFiles);
}

/**
 * 设置日志级别
 * @param {string} level - 日志级别
 */
export function setLogLevel(level) {
    if (Object.values(LOG_LEVELS).includes(level)) {
        currentLevel = level;
        log(LOG_LEVELS.INFO, `日志级别已设置为: ${level}`);
    } else {
        log(LOG_LEVELS.ERROR, `无效的日志级别: ${level}`);
    }
}

// 导出日志函数
export const logger = {
    debug: (message, meta) => log(LOG_LEVELS.DEBUG, message, meta),
    info: (message, meta) => log(LOG_LEVELS.INFO, message, meta),
    warn: (message, meta) => log(LOG_LEVELS.WARN, message, meta),
    error: (message, meta) => log(LOG_LEVELS.ERROR, message, meta),
    critical: (message, meta) => log(LOG_LEVELS.CRITICAL, message, meta)
};

// 脱敏敏感信息函数
export function maskSensitiveInfo(info) {
    if (!info) return info;
    if (info.length <= 3) return info[0] + '*'.repeat(info.length - 1);
    return info.substring(0, 3) + '*'.repeat(Math.max(0, info.length - 6)) + info.substring(info.length - 3);
}

// 导出默认对象和工具函数
export default logger;