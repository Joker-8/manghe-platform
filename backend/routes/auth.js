import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { useDb, db } from '../utils/database.js'
import { sendSMS, retrySendSMS, checkResendAvailability, getRemainingTime, verifySendResult, isValidPhone, generateVerificationCode } from '../utils/sms-service.js'
import { logger, maskPhone, logVerificationCode, logSmsSend, maskSensitiveInfo } from '../utils/logger.js'
import sqlite3 from 'sqlite3'

const router = express.Router()

/**
 * 辅助函数：脱敏邮箱
 * @param {string} email - 邮箱地址
 * @returns {string} 脱敏后的邮箱
 */
function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    if (username.length <= 2) {
        return username[0] + '*' + '@' + domain;
    }
    return username.substring(0, 2) + '*'.repeat(username.length - 2) + '@' + domain;
}

// 验证码配置 - 支持环境变量配置
const VERIFICATION_CONFIG = {
    CODE_LENGTH: parseInt(process.env.VERIFICATION_CODE_LENGTH) || 6,
    EXPIRATION_TIME: (parseInt(process.env.VERIFICATION_EXPIRATION_MINUTES) || 5) * 60 * 1000, // 默认5分钟有效期
    COOLDOWN_TIME: (parseInt(process.env.VERIFICATION_COOLDOWN_SECONDS) || 60) * 1000, // 默认60秒冷却时间
    MAX_RETRY_COUNT: parseInt(process.env.SMS_RETRY_COUNT) || 3, // 最大重试次数
    MAX_ATTEMPTS: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS) || 5, // 每小时最大尝试次数
    CLEANUP_INTERVAL: 10 * 60 * 1000 // 10分钟清理一次过期验证码
}

// 内存存储 - 作为数据库的备份，确保服务稳定性
const verificationCodes = new Map() // 存储验证码信息
const lastSentTimes = new Map() // 存储最后发送时间
const verificationAttempts = new Map() // 存储验证尝试次数

/**
 * 增强版手机号验证
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function enhancedPhoneValidation(phone) {
    if (!isValidPhone(phone)) return false
    
    // 验证运营商号段
    const carrierPrefixes = [
        // 移动号段
        '134', '135', '136', '137', '138', '139', '147', '150', '151', '152', 
        '157', '158', '159', '165', '172', '178', '182', '183', '184', '187', 
        '188', '195', '197', '198',
        // 联通号段
        '130', '131', '132', '145', '155', '156', '166', '171', '175', '176', 
        '185', '186', '196',
        // 电信号段
        '133', '149', '153', '173', '177', '180', '181', '189', '191', '193', '199',
        // 广电号段
        '192',
        // 虚拟运营商号段
        '162', '167', '170', '174'
    ]
    
    return carrierPrefixes.some(prefix => phone.startsWith(prefix))
}

/**
 * 初始化验证码表
 * @param {Object} db - 数据库连接
 */
async function initVerificationCodesTable(db) {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone VARCHAR(11) NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at BIGINT NOT NULL,
                created_at BIGINT NOT NULL,
                sent_count INTEGER DEFAULT 0,
                last_sent_at BIGINT DEFAULT 0,
                user_agent TEXT,
                ip_address TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                request_id VARCHAR(50),
                sms_provider VARCHAR(20),
                sms_message_id VARCHAR(100),
                error_message TEXT,
                INDEX idx_phone (phone),
                INDEX idx_expires_at (expires_at),
                INDEX idx_status (status)
            );
            
            -- 确保索引存在
            CREATE INDEX IF NOT EXISTS idx_phone ON verification_codes(phone);
            CREATE INDEX IF NOT EXISTS idx_expires_at ON verification_codes(expires_at);
            CREATE INDEX IF NOT EXISTS idx_status ON verification_codes(status);
        `);
        logger.info('验证码表初始化成功');
    } catch (error) {
        logger.error('验证码表初始化失败:', error);
    }
}

/**
 * 生成JWT访问令牌
 * @param {number} userId - 用户ID
 * @param {string} username - 用户名
 * @param {string} role - 用户角色
 * @returns {string} JWT令牌
 */
function generateAccessToken(userId, username, role = 'user') {
    return jwt.sign({ userId: userId, username: username, role: role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
}

// 生成刷新令牌
function generateRefreshToken(userId) {
    return jwt.sign({ userId: userId }, process.env.JWT_REFRESH_SECRET || 'refresh-secret-key', { expiresIn: '7d' });
}

// 认证路由 - 仅使用真实数据库操作

/**
 * 发送验证码接口
 * 实现手机号验证、验证码生成、存储和发送功能
 * 添加60秒防重复发送机制
 */
router.post('/send-code', async (req, res) => {
    try {
        const { phone } = req.body
        const userAgent = req.headers['user-agent'] || 'unknown'
        const ipAddress = req.ip || req.connection.remoteAddress
        const requestId = Math.random().toString(36).substring(2, 15)
        
        logger.info(`[${requestId}] 请求发送验证码到 ${maskPhone(phone)}`, { ip: ipAddress })
        
        // 验证手机号格式
        if (!phone) {
            logger.warn(`[${requestId}] 手机号为空`, { ip: ipAddress })
            return res.status(400).json({
                success: false,
                message: '请输入手机号码'
            })
        }
        
        // 使用增强版手机号验证
        if (!enhancedPhoneValidation(phone)) {
            logger.warn(`[${requestId}] 无效的手机号格式: ${phone}`, { ip: ipAddress })
            return res.status(400).json({
                success: false,
                message: '请输入有效的手机号码，必须是11位数字且以1开头，包含有效的运营商号段'
            })
        }
        
        // 检查是否在冷却期内 - 支持数据库和内存双重检查
        let canResend = true
        let remainingTime = 0
        
        // 先检查数据库中的冷却期
        try {
            const db = req.db
            if (db) {
                const [lastSentRecords] = await db.execute(
                    `SELECT last_sent_at FROM verification_codes 
                     WHERE phone = ? 
                     ORDER BY last_sent_at DESC LIMIT 1`,
                    [phone]
                )
                
                if (lastSentRecords.length > 0) {
                    const lastSentAt = lastSentRecords[0].last_sent_at
                    const result = checkResendAvailability(lastSentAt, VERIFICATION_CONFIG.COOLDOWN_TIME)
                    canResend = result.canResend
                    remainingTime = result.remainingTime
                }
            }
        } catch (dbError) {
            logger.warn(`[${requestId}] 数据库检查冷却期失败:`, dbError)
        }
        
        // 如果数据库检查允许发送，再检查内存（双重保障）
        if (canResend) {
            const lastSentAt = lastSentTimes.get(phone)
            if (lastSentAt) {
                const result = checkResendAvailability(lastSentAt, VERIFICATION_CONFIG.COOLDOWN_TIME)
                canResend = result.canResend
                remainingTime = result.remainingTime
            }
        }
        
        if (!canResend) {
            logger.info(`[${requestId}] 手机号 ${maskPhone(phone)} 在冷却期内，剩余 ${remainingTime} 秒`, { 
                ip: ipAddress,
                remainingTime 
            })
            return res.status(429).json({
                success: false,
                message: `请${remainingTime}秒后重试`,
                remainingTime: remainingTime
            })
        }
        
        // 生成验证码
        const code = generateVerificationCode(VERIFICATION_CONFIG.CODE_LENGTH)
        const expiresAt = Date.now() + VERIFICATION_CONFIG.EXPIRATION_TIME // 5分钟后过期
        const now = Date.now()
        
        // 记录验证码生成日志
        logVerificationCode('generated', {
            phone: maskPhone(phone),
            code,
            expiresAt,
            ip: ipAddress,
            requestId
        })
        
        // 存储验证码到内存
        verificationCodes.set(phone, { 
            code, 
            expiresAt, 
            created_at: now,
            sent_count: 1,
            last_sent_at: now,
            user_agent: userAgent,
            ip_address: ipAddress,
            request_id: requestId,
            status: 'pending'
        })
        
        // 更新最后发送时间
        lastSentTimes.set(phone, now)
        
        // 重置尝试次数
        verificationAttempts.delete(phone)
        
        // 如果数据库可用，保存验证码到数据库
        let dbSaved = false
        try {
            const db = req.db
            if (db) {
                // 先尝试初始化表
                await initVerificationCodesTable(db)
                
                // 保存验证码
                await db.execute(
                    `INSERT INTO verification_codes 
                     (phone, code, expires_at, created_at, sent_count, last_sent_at, user_agent, ip_address, request_id, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [phone, code, expiresAt, now, 1, now, userAgent, ipAddress, requestId, 'pending']
                )
                dbSaved = true
                logger.info(`[${requestId}] 验证码已保存到数据库`, { phone: maskPhone(phone) })
            }
        } catch (dbError) {
            logger.warn(`[${requestId}] 数据库保存验证码失败: ${dbError.message}`, { phone: maskPhone(phone) })
        }
        
        // 发送短信验证码 - 使用增强版重试机制
        let smsResult = { success: false }
        try {
            const startTime = Date.now()
            smsResult = await retrySendSMS(phone, code, {
                maxRetries: VERIFICATION_CONFIG.MAX_RETRY_COUNT,
                requestId,
                ip: ipAddress,
                userAgent,
                template: '【芒盒】{code}（注册验证码，请完成验证），如非本人操作，请忽略本短信。'
            })
            const duration = Date.now() - startTime
            
            smsResult.duration = duration
            
            // 更新数据库中的短信发送状态
            if (dbSaved) {
                try {
                    const db = req.db
                    if (db) {
                        await db.execute(
                            `UPDATE verification_codes 
                             SET status = ?, sms_provider = ?, sms_message_id = ? 
                             WHERE phone = ? AND request_id = ?`,
                            [
                                smsResult.success ? 'sent' : 'failed',
                                smsResult.provider || 'unknown',
                                smsResult.messageId || '',
                                phone,
                                requestId
                            ]
                        )
                    }
                } catch (updateError) {
                    logger.warn(`[${requestId}] 更新短信发送状态失败:`, updateError)
                }
            }
            
            // 更新内存中的状态
            const memoryCode = verificationCodes.get(phone)
            if (memoryCode && memoryCode.request_id === requestId) {
                memoryCode.status = smsResult.success ? 'sent' : 'failed'
                memoryCode.sms_provider = smsResult.provider
                memoryCode.sms_message_id = smsResult.messageId
                memoryCode.sent_at = Date.now()
            }
            
            // 记录短信发送日志
            logSmsSend(smsResult, {
                phone: maskPhone(phone),
                ip: ipAddress,
                requestId,
                duration,
                retryCount: smsResult.retryCount || 0
            })
            
            // 根据环境变量决定返回结果
            if (process.env.NODE_ENV === 'development') {
                logger.info(`[${requestId}] 开发环境：验证码 ${code} 发送到 ${maskPhone(phone)}`)
                return res.json({
                    success: true,
                    message: '验证码已发送（开发模式）',
                    phone: maskPhone(phone),
                    code: code, // 开发环境返回完整验证码便于测试
                    messageId: smsResult.messageId,
                    provider: smsResult.provider,
                    retryCount: smsResult.retryCount || 0,
                    duration
                })
            }
            
            // 正常环境返回
            return res.json({
                success: smsResult.success,
                message: smsResult.success ? '验证码已发送' : '验证码发送失败，请稍后重试',
                phone: maskPhone(phone),
                errorCode: smsResult.errorCode,
                retryCount: smsResult.retryCount || 0
            })
        } catch (smsError) {
            logger.error(`[${requestId}] 发送短信异常:`, smsError)
            
            // 记录失败日志
            logSmsSend({ success: false, error: smsError.message }, {
                phone: maskPhone(phone),
                ip: ipAddress,
                requestId,
                error: smsError.message
            })
            
            // 更新数据库中的失败状态
            if (dbSaved) {
                try {
                    const db = req.db
                    if (db) {
                        await db.execute(
                            `UPDATE verification_codes 
                             SET status = ?, error_message = ? 
                             WHERE phone = ? AND request_id = ?`,
                            ['failed', smsError.message, phone, requestId]
                        )
                    }
                } catch (updateError) {
                    // 忽略更新错误
                }
            }
            
            // 返回错误响应
            return res.status(500).json({
                success: false,
                message: '发送失败，请稍后重试',
                errorCode: 'SMS_SEND_ERROR'
            })
        }
    } catch (error) {
        logger.error('发送验证码整体流程失败:', error)
        res.status(500).json({
            success: false,
            message: '系统繁忙，请稍后重试',
            errorId: Math.random().toString(36).substring(2, 15)
        })
    }
})

/**
 * 手机号验证码登录/注册（一体化接口）
 * 实现验证码验证、用户注册/登录功能
 */
router.post('/phone-login', async (req, res) => {
    try {
        const { phone, code } = req.body
        const userAgent = req.headers['user-agent'] || 'unknown'
        const ipAddress = req.ip || req.connection.remoteAddress
        const requestId = Math.random().toString(36).substring(2, 15)
        
        logger.info(`[${requestId}] 手机号登录请求: ${maskPhone(phone)}`, { ip: ipAddress })
        
        // 输入验证
        if (!phone || !enhancedPhoneValidation(phone)) {
            logger.warn(`[${requestId}] 无效的手机号格式: ${phone || 'empty'}`, { ip: ipAddress })
            return res.status(400).json({
                success: false,
                message: '请输入有效的手机号码，必须是11位数字且以1开头'
            })
        }
        
        if (!code || !/^\d{6}$/.test(code)) {
            logger.warn(`[${requestId}] 无效的验证码格式: ${code || 'empty'}`, { phone: maskPhone(phone) })
            return res.status(400).json({
                success: false,
                message: '请输入6位数字验证码'
            })
        }
        
        // 检查验证尝试次数限制
        const attempts = verificationAttempts.get(phone) || 0
        if (attempts >= VERIFICATION_CONFIG.MAX_ATTEMPTS) {
            logger.warn(`[${requestId}] 验证尝试次数过多: ${maskPhone(phone)}`, { attempts })
            return res.status(429).json({
                success: false,
                message: '验证失败次数过多，请稍后再试',
                retryAfter: 3600 // 1小时后重试
            })
        }
        
        // 标记是否为新用户
        let isNewUser = false
        
        // 验证验证码 - 优先从数据库验证
        let isCodeValid = false
        let dbVerificationCode = null
        
        try {
            const db = req.db
            if (db) {
                // 从数据库查询有效验证码
                const [codes] = await db.execute(
                    `SELECT * FROM verification_codes 
                     WHERE phone = ? AND code = ? AND expires_at > ? 
                     AND status IN ('pending', 'sent')
                     ORDER BY created_at DESC LIMIT 1`,
                    [phone, code, Date.now()]
                )
                
                if (codes.length > 0) {
                    dbVerificationCode = codes[0]
                    isCodeValid = true
                    // 更新验证码状态为已使用
                    await db.execute(
                        'UPDATE verification_codes SET status = ?, used_at = ? WHERE id = ?',
                        ['used', Date.now(), codes[0].id]
                    )
                    logger.info(`[${requestId}] 数据库验证码验证成功`, { phone: maskPhone(phone) })
                }
            }
        } catch (dbError) {
            logger.warn(`[${requestId}] 数据库验证验证码失败: ${dbError.message}，尝试内存验证`, { 
                phone: maskPhone(phone)
            })
        }
        
        // 如果数据库验证失败，尝试内存验证
        if (!isCodeValid) {
            const storedCode = verificationCodes.get(phone)
            if (!storedCode) {
                logger.warn(`[${requestId}] 验证码不存在`, { phone: maskPhone(phone) })
                verificationAttempts.set(phone, attempts + 1)
                return res.status(400).json({
                    success: false,
                    message: '验证码不存在或已过期'
                })
            }
            
            if (storedCode.expiresAt < Date.now()) {
                verificationCodes.delete(phone)
                logger.warn(`[${requestId}] 验证码已过期`, { phone: maskPhone(phone) })
                verificationAttempts.set(phone, attempts + 1)
                return res.status(400).json({
                    success: false,
                    message: '验证码已过期'
                })
            }
            
            if (storedCode.code !== code) {
                logger.warn(`[${requestId}] 验证码错误`, { phone: maskPhone(phone) })
                verificationAttempts.set(phone, attempts + 1)
                return res.status(400).json({
                    success: false,
                    message: '验证码错误',
                    remainingAttempts: VERIFICATION_CONFIG.MAX_ATTEMPTS - attempts - 1
                })
            }
            
            isCodeValid = true
            // 验证通过后删除内存中的验证码
            verificationCodes.delete(phone)
            // 重置尝试次数
            verificationAttempts.delete(phone)
            logger.info(`[${requestId}] 内存验证码验证成功`, { phone: maskPhone(phone) })
        }
        
        // 记录验证码验证成功日志
        logVerificationCode('verified', {
            phone: maskPhone(phone),
            code,
            ip: ipAddress,
            userAgent,
            requestId,
            source: dbVerificationCode ? 'database' : 'memory'
        })
        
        let userId, username, user
        
        // 严格验证用户是否存在，不存在则拒绝登录
        try {
            const db = req.db
            
            // 检查用户是否已存在
            const [existingUsers] = await db.execute(
                'SELECT id, username FROM users WHERE phone = ?',
                [phone]
            )
            
            if (existingUsers.length === 0) {
                logger.warn(`[${requestId}] 手机号 ${maskPhone(phone)} 对应的用户不存在`)
                return res.json({
                    success: false,
                    message: '该账号不存在'
                })
            }
            
            // 用户已存在，进行登录
            userId = existingUsers[0].id
            username = existingUsers[0].username
            user = existingUsers[0]
            
            // 更新最后登录时间和IP
            await db.execute(
                'UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?',
                [Date.now(), ipAddress, userId]
            )
            
            // 生成JWT令牌
            const accessToken = generateAccessToken(userId, username)
            const refreshToken = generateRefreshToken(userId)
            
            logger.info(`[${requestId}] 用户登录成功：${maskPhone(phone)} - 用户ID: ${userId}`);
            
            return res.json({
                success: true,
                message: '登录成功',
                token: accessToken,
                refreshToken: refreshToken,
                user: {
                    id: userId,
                    username: username,
                    phone: maskPhone(phone)
                }
            })
        } catch (dbError) {
            logger.error(`[${requestId}] 数据库操作失败:`, dbError.message)
            // 数据库操作失败时返回错误，不使用模拟数据
            return res.status(500).json({
                success: false,
                message: '登录失败，请稍后重试'
            })
        }
    } catch (error) {
        logger.error('手机号登录失败:', error)
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试',
            errorId: Math.random().toString(36).substring(2, 15)
        })
    }
})

// 用户注册（邮箱/用户名注册）
router.post('/register', async (req, res) => {
    try {
        // 测试用户标识
        const TEST_USERNAME = 'C01';
        const TEST_PASSWORD = '123456';
        
        const { username, email, password } = req.body
        const userAgent = req.headers['user-agent'] || 'unknown'
        const ipAddress = req.ip || req.connection.remoteAddress
        
        // 输入验证
        if (!username || !email || !password) {
            logger.warn('注册信息不完整', { ip: ipAddress })
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段'
            })
        }
        
        // 检查测试用户名是否被占用
        if (username === TEST_USERNAME) {
            logger.warn('测试用户已被保留', { ip: ipAddress });
            return res.status(400).json({
                success: false,
                message: '测试用户已存在专用账号，请使用其他用户名注册'
            })
        }
        
        // 用户名长度验证
        if (username.length < 1 || username.length > 15) {
            logger.warn('用户名长度不符合要求', { username: maskSensitiveInfo(username) });
            return res.status(400).json({
                success: false,
                message: '用户名长度应为1-15个字符'
            })
        }
        
        // 密码长度验证
        if (password.length < 6) {
            logger.warn('密码长度不符合要求', { username: maskSensitiveInfo(username) });
            return res.status(400).json({
                success: false,
                message: '密码长度不能少于6个字符'
            })
        }
        
        // 邮箱格式验证
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            logger.warn('邮箱格式不正确', { email: maskEmail(email) });
            return res.status(400).json({
                success: false,
                message: '请输入正确的邮箱地址'
            })
        }
        
        // 使用SQLite3的Promise封装方式进行注册
        try {
            logger.debug('开始数据库注册操作', { username: maskSensitiveInfo(username), email: maskEmail(email) });
            
            // 检查数据库目录是否存在，如果不存在则创建
            const fs = require('fs');
            const path = require('path');
            const dbDir = path.join(__dirname, '../data');
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
                logger.debug('创建数据库目录:', dbDir);
            }
            
            // 使用导入的SQLite3模块连接数据库
            const db = new sqlite3.Database('./data/manghe.db');
            
            try {
                // 检查用户是否已存在
                logger.debug('检查用户是否已存在');
                const existingUser = await new Promise((resolve, reject) => {
                    db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
                        [username, email], (err, row) => {
                        if (err) {
                            logger.error('查询用户错误:', err.message);
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
                
                if (existingUser) {
                    logger.warn('用户名或邮箱已存在', { username: maskSensitiveInfo(username), email: maskEmail(email) })
                    return res.status(400).json({
                        success: false,
                        message: '用户名或邮箱已存在'
                    })
                }

                // 加密密码
                logger.debug('开始加密密码');
                const hashedPassword = await bcrypt.hash(password, 10)

                // 初始化用户数据
                const userData = {
                    points: 100,
                    level: '普通会员',
                    followers: 0,
                    following: 0,
                    posts: 0
                };

                // 创建用户
                logger.debug('开始插入用户数据');
                const insertId = await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO users (username, email, password, points, level, followers, following, posts, created_at, last_login_at, last_login_ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'), ?, ?)',
                        [username, email, hashedPassword, userData.points, userData.level, userData.followers, userData.following, userData.posts, ipAddress, userAgent],
                        function(err) {
                            if (err) {
                                logger.error('插入用户错误:', err.message);
                                reject(err);
                            } else {
                                resolve(this.lastID);
                            }
                        }
                    );
                });
                
                logger.debug('用户数据插入成功', { insertId });

                // 生成JWT令牌
                logger.debug('生成JWT令牌');
                const accessToken = generateAccessToken(insertId, username)
                const refreshToken = generateRefreshToken(insertId)

                // 获取新创建的用户信息
                logger.debug('获取新创建的用户信息');
                const newUser = await new Promise((resolve, reject) => {
                    db.get(
                        'SELECT id, username, email, avatar, points, level, followers, following, posts FROM users WHERE id = ?',
                        [insertId],
                        (err, row) => {
                            if (err) {
                                logger.error('查询新用户错误:', err.message);
                                reject(err);
                            } else {
                                resolve(row);
                            }
                        }
                    );
                });
                
                if (!newUser) {
                    logger.error('无法获取新创建的用户信息', { userId: insertId });
                    return res.status(500).json({
                        success: false,
                        message: '注册成功但无法获取用户信息'
                    })
                }

                logger.info(`用户邮箱注册成功：${maskSensitiveInfo(username)} - 用户ID: ${insertId}`);
                
                res.json({
                    success: true,
                    message: '注册成功',
                    accessToken,
                    refreshToken,
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: maskEmail(newUser.email),
                        avatar: newUser.avatar,
                        points: newUser.points,
                        level: newUser.level,
                        followers: newUser.followers,
                        following: newUser.following,
                        posts: newUser.posts
                    }
                })
            } finally {
                // 确保数据库连接关闭
                db.close((closeErr) => {
                    if (closeErr) {
                        logger.error('关闭数据库连接失败:', closeErr.message);
                    }
                });
            }
        } catch (dbError) {
            logger.error('数据库注册操作失败:', { error: dbError.message, stack: dbError.stack });
            return res.status(500).json({
                success: false,
                message: '注册失败，请稍后重试'
            })
        }
    } catch (error) {
        logger.error('注册失败:', error)
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        })
    }
})

// 用户登录（用户名/邮箱登录）
router.post('/login', async (req, res) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // 使用logger记录日志
    logger.info(`[${requestId}] 登录请求开始`);
    logger.debug(`[${requestId}] 原始请求体: ${JSON.stringify(req.body)}`);
    
    // 支持不同的参数名称
    const loginInput = req.body.loginInput || req.body.username || req.body.email;
    const password = req.body.password;
    
    logger.info(`[${requestId}] 解析参数: loginInput=${maskSensitiveInfo(loginInput || 'undefined')}, password=${password ? '******' : 'undefined'}`);
    
    // 检查参数
    if (!loginInput || !password) {
        logger.warn(`[${requestId}] 参数不完整: loginInput=${!!loginInput}, password=${!!password}`);
        return res.status(400).json({ success: false, message: '请输入用户名/邮箱和密码' });
    }
    
    try {
        // 优先使用数据库连接管理器
        if (persistenceManager && persistenceManager.db && typeof persistenceManager.db.execute === 'function') {
            logger.debug(`[${requestId}] 使用persistenceManager连接数据库查询用户: ${maskSensitiveInfo(loginInput)}`);
            
            // 精确查询用户
            const [users] = await persistenceManager.db.execute(
                'SELECT id, username, email, password FROM users WHERE username = ? OR email = ? LIMIT 1',
                [loginInput, loginInput]
            );
            
            // 严格验证用户存在性
            if (!users || users.length === 0) {
                logger.warn(`[${requestId}] 用户不存在: ${maskSensitiveInfo(loginInput)}`);
                return res.status(401).json({ success: false, message: '用户名或密码错误' });
            }
            
            const user = users[0];
            logger.debug(`[${requestId}] 找到用户: ${maskSensitiveInfo(user.username)}, ID: ${user.id}`);
            
            // 仅使用bcrypt验证密码，移除明文密码比较
            let passwordMatch = false;
            try {
                passwordMatch = await bcrypt.compare(password, user.password);
            } catch (bcryptError) {
                logger.warn(`[${requestId}] bcrypt验证失败: ${bcryptError.message}`);
                passwordMatch = false;
            }
            
            logger.debug(`[${requestId}] 密码验证: ${passwordMatch ? '成功' : '失败'}`);
            
            if (!passwordMatch) {
                logger.warn(`[${requestId}] 密码验证失败: ${maskSensitiveInfo(loginInput)}`);
                return res.status(401).json({ success: false, message: '用户名或密码错误' });
            }
            
            // 生成JWT令牌
            logger.info(`[${requestId}] 用户验证成功，生成令牌: ${maskSensitiveInfo(user.username)}`);
            const accessToken = generateAccessToken(user.id, user.username, user.role || 'user');
            const refreshToken = generateRefreshToken(user.id);
            
            return res.json({
                success: true,
                message: '登录成功',
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email || '',
                    role: user.role || 'user'
                }
            });
        } else {
            // 备用数据库连接方式
            logger.warn(`[${requestId}] persistenceManager不可用，使用备用数据库连接方式`);
            
            // 使用导入的SQLite3模块连接数据库
            const db = new sqlite3.Database('./data/manghe.db');
            
            try {
                // 使用Promise包装查询
                const user = await new Promise((resolve, reject) => {
                    db.get('SELECT id, username, email, password FROM users WHERE username = ? OR email = ? LIMIT 1', 
                        [loginInput, loginInput], (err, row) => {
                        if (err) {
                            logger.error(`[${requestId}] 查询错误: ${err.message}`);
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });
                
                // 严格验证用户存在性
                if (!user) {
                    logger.warn(`[${requestId}] 用户不存在: ${maskSensitiveInfo(loginInput)}`);
                    return res.status(401).json({ success: false, message: '用户名或密码错误' });
                }
                
                logger.debug(`[${requestId}] 找到用户: ${maskSensitiveInfo(user.username)}, ID: ${user.id}`);
                
                // 验证密码（优先处理明文密码情况）
                let passwordMatch = false;
                
                // 首先尝试明文密码比较（兼容测试用户和旧数据）
                if (password === user.password) {
                    passwordMatch = true;
                    logger.warn(`[${requestId}] 使用明文密码验证成功，建议更新为加密密码: ${maskSensitiveInfo(user.username)}`);
                } else {
                    // 如果明文比较失败，尝试bcrypt验证
                    try {
                        passwordMatch = await bcrypt.compare(password, user.password);
                    } catch (bcryptError) {
                        // bcrypt验证失败，密码不匹配
                        logger.warn(`[${requestId}] bcrypt验证失败: ${bcryptError.message}`);
                        passwordMatch = false;
                    }
                }
                
                logger.debug(`[${requestId}] 密码验证: ${passwordMatch ? '成功' : '失败'}`);
                
                if (!passwordMatch) {
                    logger.warn(`[${requestId}] 密码验证失败: ${maskSensitiveInfo(loginInput)}`);
                    return res.status(401).json({ success: false, message: '用户名或密码错误' });
                }
                
                // 生成JWT令牌
                logger.info(`[${requestId}] 用户验证成功，生成令牌: ${maskSensitiveInfo(user.username)}`);
                const accessToken = generateAccessToken(user.id, user.username, user.role || 'user');
                const refreshToken = generateRefreshToken(user.id);
                
                return res.json({
                    success: true,
                    message: '登录成功',
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email || '',
                        role: user.role || 'user'
                    }
                });
            } finally {
                // 确保数据库连接关闭
                db.close((closeErr) => {
                    if (closeErr) {
                        logger.error(`[${requestId}] 关闭数据库连接失败: ${closeErr.message}`);
                    }
                });
            }
        }
    } catch (error) {
        logger.error(`[${requestId}] 登录过程异常: ${error.message}`, { error: error.stack });
        return res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
    }
})

// 刷新token接口
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        if (!refreshToken) {
            logger.warn('刷新令牌缺失', { ip: ipAddress });
            return res.status(401).json({
                success: false,
                message: '刷新令牌缺失'
            });
        }
        
        // 验证刷新令牌
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret-key');
        } catch (error) {
            logger.warn('刷新令牌无效', { ip: ipAddress });
            return res.status(401).json({
                success: false,
                message: '刷新令牌无效'
            });
        }
        
        // 获取用户信息
        try {
            const db = req.db
            const [users] = await db.execute(
                'SELECT id, username, email FROM users WHERE id = ?',
                [decoded.userId]
            )
            
            if (users.length === 0) {
                logger.warn('用户不存在', { userId: decoded.userId, ip: ipAddress });
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }
            
            const user = users[0];
            // 生成新的访问令牌
            const newAccessToken = generateAccessToken(user.id, user.username);
            
            logger.info(`用户 ${user.username} 令牌刷新成功`, { userId: user.id });
            res.json({
                success: true,
                accessToken: newAccessToken,
                message: '令牌刷新成功'
            });
        } catch (dbError) {
            logger.error('数据库操作失败:', dbError.message, { userId: decoded.userId });
            // 数据库操作失败时返回错误，不再使用模拟数据
            return res.status(500).json({
                success: false,
                message: '刷新令牌失败，请重新登录'
            });
        }
    } catch (error) {
        logger.error('刷新令牌失败:', error);
        res.status(500).json({
            success: false,
            message: '刷新令牌失败，请稍后重试'
        });
    }
});

// 登出
router.post('/logout', (req, res) => {
    // JWT是无状态的，客户端删除token即可
    res.json({
        success: true,
        message: '登出成功'
    })
})

// maskEmail函数已从logger.js导入

// maskSensitiveInfo函数已从logger.js导入

/**
 * 认证中间件
 * @param {string} requiredRole - 所需角色
 * @returns {Function} 中间件函数
 */
function authMiddleware(requiredRole = 'user') {
    return async (req, res, next) => {
        try {
            // 从请求头获取token
            const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization?.replace('Bearer ', '')
            const ipAddress = req.ip || req.connection.remoteAddress;
            
            logger.debug('认证中间件: 收到请求到', { path: req.path, hasToken: !!token, ip: ipAddress })
            
            // 严格验证：无论环境如何，都必须提供有效的token
            if (!token) {
                logger.warn('认证失败: 未提供token', { path: req.path, ip: ipAddress });
                return res.status(401).json({
                    success: false,
                    message: '未授权，请先登录'
                })
            }
            
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                logger.debug('Token验证成功', { userId: decoded.userId, username: decoded.username });
            } catch (verifyError) {
                logger.warn('Token验证失败', { error: verifyError.message, ip: ipAddress });
                return res.status(401).json({
                    success: false,
                    message: '认证失败，请重新登录'
                })
            }
            
            // 检查角色权限
            if (requiredRole !== 'user' && decoded.role !== requiredRole) {
                logger.warn('权限不足', { requiredRole, userRole: decoded.role, userId: decoded.userId });
                return res.status(403).json({
                    success: false,
                    message: '权限不足'
                })
            }
            
            // 将用户信息附加到请求对象
            req.user = {
                id: decoded.userId,
                username: decoded.username,
                role: decoded.role || 'user'
            }
            
            next()
        } catch (error) {
            logger.error('认证中间件错误:', error);
            res.status(500).json({
                success: false,
                message: '认证失败，请稍后重试'
            })
        }
    }
}

// 获取当前用户信息
router.get('/me', authMiddleware(), async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户信息
        try {
            const db = req.db
            const [users] = await db.execute(
                'SELECT id, username, email, avatar, points, level FROM users WHERE id = ?',
                [userId]
            )
            
            if (users.length === 0) {
                logger.warn('用户不存在', { userId });
                return res.json({
                    success: false,
                    message: '用户不存在'
                })
            }
            
            // 添加角色信息到返回的用户数据中
            const userData = { ...users[0], role: req.user.role }
            
            logger.debug('获取用户信息成功', { userId });
            res.json({
                success: true,
                user: userData
            })
        } catch (dbError) {
            logger.error('数据库操作失败:', dbError.message, { userId });
            // 数据库操作失败时返回错误，不再使用模拟数据
            return res.status(500).json({
                success: false,
                message: '获取用户信息失败，请稍后重试'
            })
        }
    } catch (error) {
        logger.error('获取用户信息错误:', error, { userId: req.user?.id });
        res.status(500).json({
            success: false,
            message: '获取用户信息失败，请稍后重试'
        })
    }
})

// 定期清理过期验证码的任务（每10分钟执行一次）
/**
 * 定期清理过期验证码
 */
async function cleanupExpiredVerificationCodes() {
    const now = Date.now()
    const startTime = Date.now()
    let dbDeleted = 0
    let memoryDeleted = 0
    
    try {
        // 清理数据库中的过期验证码
        try {
            const db = await isDbConnected()
            if (db) {
                const [result] = await db.execute(
                    `DELETE FROM verification_codes 
                     WHERE expires_at < ? OR status IN ('used', 'expired')`,
                    [now]
                )
                dbDeleted = result.affectedRows || 0
            }
        } catch (dbError) {
            logger.warn('清理数据库中的过期验证码失败:', dbError)
        }
        
        // 清理内存中的过期验证码
        for (const [phone, codeRecord] of verificationCodes.entries()) {
            if (codeRecord.expiresAt < now || ['used', 'expired'].includes(codeRecord.status)) {
                verificationCodes.delete(phone)
                memoryDeleted++
            }
        }
        
        // 清理过期的尝试次数记录
        for (const [phone, timestamp] of lastSentTimes.entries()) {
            if (now - timestamp > VERIFICATION_CONFIG.CLEANUP_INTERVAL * 3) { // 3倍清理间隔
                lastSentTimes.delete(phone)
            }
        }
        
        const duration = Date.now() - startTime
        logger.info(`清理过期验证码完成 - 数据库: ${dbDeleted}, 内存: ${memoryDeleted}, 耗时: ${duration}ms`)
    } catch (error) {
        logger.error('清理过期验证码异常:', error)
    }
}

// 启动定期清理任务
const cleanupInterval = setInterval(cleanupExpiredVerificationCodes, VERIFICATION_CONFIG.CLEANUP_INTERVAL)

// 确保进程退出时清理定时器
process.on('SIGINT', () => {
    clearInterval(cleanupInterval)
    logger.info('验证码清理定时器已停止')
})

process.on('SIGTERM', () => {
    clearInterval(cleanupInterval)
    logger.info('验证码清理定时器已停止')
})

// 导出路由和认证中间件
export default router
export { authMiddleware }