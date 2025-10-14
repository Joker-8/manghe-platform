import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'manghe_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// 使数据库连接在路由中可用
app.use((req, res, next) => {
  req.db = pool
  next()
})

// 路由
app.use('/api/auth', authRoutes)

// 基础路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '芒盒后端服务运行正常' })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 芒盒后端服务运行在端口 ${PORT}`)
})