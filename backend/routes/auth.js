import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()

// 用户注册
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body
        const db = req.db

        // 检查用户是否已存在
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        )

        if (existingUsers.length > 0) {
            return res.json({
                success: false,
                message: '用户名或邮箱已存在'
            })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建用户
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())',
            [username, email, hashedPassword]
        )

        // 生成JWT token
        const token = jwt.sign(
            { userId: result.insertId, username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        )

        // 获取新创建的用户信息
        const [newUsers] = await db.execute(
            'SELECT id, username, email, avatar, points, level FROM users WHERE id = ?',
            [result.insertId]
        )

        res.json({
            success: true,
            message: '注册成功',
            token,
            user: newUsers[0]
        })

    } catch (error) {
        console.error('注册错误:', error)
        res.status(500).json({
            success: false,
            message: '注册失败'
        })
    }
})

// 用户登录
router.post('/login', async (req, res) => {
    try {
        const { loginInput, password } = req.body
        const db = req.db

        // 查找用户（支持用户名或邮箱登录）
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [loginInput, loginInput]
        )

        if (users.length === 0) {
            return res.json({
                success: false,
                message: '用户不存在'
            })
        }

        const user = users[0]

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.json({
                success: false,
                message: '密码错误'
            })
        }

        // 生成JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        )

        // 返回用户信息（不包含密码）
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            points: user.points,
            level: user.level
        }

        res.json({
            success: true,
            message: '登录成功',
            token,
            user: userInfo
        })

    } catch (error) {
        console.error('登录错误:', error)
        res.status(500).json({
            success: false,
            message: '登录失败'
        })
    }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '')

        if (!token) {
            return res.json({
                success: false,
                message: '未提供认证令牌'
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        const db = req.db

        const [users] = await db.execute(
            'SELECT id, username, email, avatar, points, level FROM users WHERE id = ?',
            [decoded.userId]
        )

        if (users.length === 0) {
            return res.json({
                success: false,
                message: '用户不存在'
            })
        }

        res.json({
            success: true,
            user: users[0]
        })

    } catch (error) {
        console.error('获取用户信息错误:', error)
        res.status(401).json({
            success: false,
            message: '认证失败'
        })
    }
})

export default router