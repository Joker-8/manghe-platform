import express from 'express'

const router = express.Router()

// 订单路由 - 仅使用真实数据库操作

// 创建订单
router.post('/', async (req, res) => {
    try {
        const { user_id, product_id, quantity = 1 } = req.body
        
        if (!user_id || !product_id) {
            return res.status(400).json({
                success: false,
                message: '缺少必要的订单信息'
            })
        }
        
        try {
            const db = req.db
            
            // 检查商品是否存在
            const [products] = await db.execute(
                'SELECT * FROM products WHERE id = ?',
                [product_id]
            )
            
            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '商品不存在'
                })
            }
            
            const product = products[0]
            
            // 检查库存
            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: '库存不足'
                })
            }
            
            // 创建订单
            const total_price = product.price * quantity
            const [result] = await db.execute(
                'INSERT INTO orders (user_id, product_id, quantity, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [user_id, product_id, quantity, total_price, '待付款']
            )
            
            // 更新库存
            await db.execute(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [quantity, product_id]
            )
            
            // 获取新订单信息
            const [newOrders] = await db.execute(
                'SELECT o.*, p.name as product_name, p.image as product_image FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?',
                [result.insertId]
            )
            
            res.status(201).json({
                success: true,
                message: '订单创建成功',
                data: newOrders[0]
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
        }
    } catch (error) {
        console.error('创建订单失败:', error)
        res.status(500).json({
            success: false,
            message: '创建订单失败，请稍后重试'
        })
    }
})

// 获取用户订单列表
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        const { status, page = 1, limit = 10 } = req.query
        
        try {
            const db = req.db
            let query = 'SELECT o.*, p.name as product_name, p.image as product_image FROM orders o JOIN products p ON o.product_id = p.id WHERE o.user_id = ?'
            const params = [userId]
            
            if (status) {
                query += ' AND o.status = ?'
                params.push(status)
            }
            
            query += ' ORDER BY o.created_at DESC'
            
            // 分页
            const offset = (page - 1) * limit
            query += ' LIMIT ? OFFSET ?'
            params.push(parseInt(limit), offset)
            
            const [orders] = await db.execute(query, params)
            
            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM orders WHERE user_id = ?' + (status ? ' AND status = ?' : ''),
                status ? [userId, status] : [userId]
            )
            
            res.json({
                success: true,
                data: orders,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    totalItems: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
        }
    } catch (error) {
        console.error('获取订单列表失败:', error)
        res.status(500).json({
            success: false,
            message: '获取订单列表失败，请稍后重试'
        })
    }
})

// 获取订单详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        
        try {
            const db = req.db
            const [orders] = await db.execute(
                'SELECT o.*, p.name as product_name, p.image as product_image FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?',
                [id]
            )
            
            if (orders.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                })
            }
            
            res.json({
                success: true,
                data: orders[0]
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
        }
    } catch (error) {
        console.error('获取订单详情失败:', error)
        res.status(500).json({
            success: false,
            message: '获取订单详情失败，请稍后重试'
        })
    }
})

// 更新订单状态
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: '请提供订单状态'
            })
        }
        
        const validStatuses = ['待付款', '已付款', '已发货', '已完成', '已取消']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的订单状态'
            })
        }
        
        try {
            const db = req.db
            
            const [result] = await db.execute(
                'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
                [status, id]
            )
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: '订单不存在'
                })
            }
            
            // 获取更新后的订单
            const [orders] = await db.execute(
                'SELECT o.*, p.name as product_name, p.image as product_image FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ?',
                [id]
            )
            
            res.json({
                success: true,
                message: '订单状态更新成功',
                data: orders[0]
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
        }
    } catch (error) {
        console.error('更新订单状态失败:', error)
        res.status(500).json({
            success: false,
            message: '更新订单状态失败，请稍后重试'
        })
    }
})

export default router