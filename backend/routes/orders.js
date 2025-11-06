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
            // 使用useDb中间件来获取数据库连接
            await req.useDb('orders', async (connection) => {
                // 检查商品是否存在
                const [products] = await connection.execute(
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
                
                // 创建订单 - 使用items字段存储商品信息
                const total_price = product.price * quantity
                const items = JSON.stringify({
                    items: [{
                        id: product.id,
                        name: product.name,
                        quantity: quantity,
                        price: product.price
                    }]
                })
                
                const [result] = await connection.execute(
                    'INSERT INTO orders (user_id, items, total_amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                    [user_id, items, total_price, 'pending']
                )
                
                // 更新库存
                await connection.execute(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [quantity, product_id]
                )
                
                // 获取新订单信息
                const [newOrders] = await connection.execute(
                    'SELECT * FROM orders WHERE id = ?',
                    [result.insertId]
                )
                
                if (newOrders.length > 0) {
                    const newOrder = newOrders[0]
                    // 解析items字段
                    if (newOrder.items && typeof newOrder.items === 'string') {
                        try {
                            newOrder.items = JSON.parse(newOrder.items)
                        } catch (e) {
                            console.error('解析items字段失败:', e.message)
                            newOrder.items = { items: [] }
                        }
                    }
                    // 添加total_price字段
                    if (newOrder.total_amount) {
                        newOrder.total_price = newOrder.total_amount
                    }
                }
                
                res.status(201).json({
                    success: true,
                    message: '订单创建成功',
                    data: newOrders[0]
                })
            }, 'createOrder')
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

// 获取用户订单列表 - 增强错误处理版本
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params
        console.log(`[${new Date().toISOString()}] 收到获取订单列表请求，用户ID: ${userId}`)
        
        // 验证参数
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: '无效的用户ID'
            })
        }
        
        // 确保useDb中间件存在
        if (!req.useDb) {
            console.error('useDb中间件不可用')
            return res.status(500).json({
                success: false,
                message: '系统错误: 数据库中间件不可用'
            })
        }
        
        // 使用useDb中间件
        await req.useDb('orders', async (connection) => {
            try {
                // 检查连接是否有效
                if (!connection || typeof connection.execute !== 'function') {
                    throw new Error('数据库连接无效')
                }
                
                // 执行简单查询
                const query = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
                const [orders] = await connection.execute(query, [userId])
                
                console.log(`查询成功，返回 ${orders.length} 条订单记录`)
                
                // 简单处理返回数据
                const responseData = {
                    success: true,
                    data: orders || [],
                    pagination: {
                        currentPage: 1,
                        pageSize: 10,
                        totalItems: orders ? orders.length : 0,
                        totalPages: 1
                    }
                }
                
                res.json(responseData)
            } catch (dbError) {
                console.error('数据库操作失败:', dbError.message || dbError)
                throw dbError
            }
        }, 'getUserOrders')
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 获取订单列表异常:`, error)
        
        // 防止重复发送响应
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: '获取订单列表失败，请稍后重试'
            })
        }
    }
})

// 获取订单详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        console.log('[' + new Date().toISOString() + '] 获取订单详情，订单ID:', id)
        
        try {
            // 使用useDb中间件来获取数据库连接，而不是直接使用req.db
            await req.useDb('orders', async (connection) => {
                console.log('获取数据库连接成功')
                
                // 查询订单信息（不使用JOIN，因为orders表使用items字段存储商品信息）
                const [orders] = await connection.execute(
                    'SELECT * FROM orders WHERE id = ?',
                    [id]
                )
                console.log('订单查询执行成功，返回结果数量:', orders.length)
                
                if (!orders || orders.length === 0) {
                    console.log('未找到订单，订单ID:', id)
                    return res.status(404).json({
                        success: false,
                        message: '订单不存在'
                    })
                }
                
                // 处理订单数据，解析JSON字段
                const order = orders[0]
                
                // 解析items字段（存储商品信息）
                if (order.items && typeof order.items === 'string') {
                    try {
                        order.items = JSON.parse(order.items)
                        console.log('解析items字段成功')
                    } catch (e) {
                        console.error('解析items字段失败:', e.message)
                        order.items = { items: [] }
                    }
                }
                
                // 解析shipping_address字段
                if (order.shipping_address && typeof order.shipping_address === 'string') {
                    try {
                        order.shipping_address = JSON.parse(order.shipping_address)
                    } catch (e) {
                        console.error('解析shipping_address字段失败:', e.message)
                        order.shipping_address = {}
                    }
                }
                
                // 将total_amount重命名为total_price以保持与其他API一致
                if (order.total_amount) {
                    order.total_price = order.total_amount
                }
                
                console.log('订单详情处理成功，准备返回响应')
                res.json({
                    success: true,
                    data: order
                })
                console.log('响应已发送')
            }, 'getOrderById')
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            console.error('错误堆栈:', dbError.stack)
            res.status(500).json({
                success: false,
                message: '数据库操作错误: ' + dbError.message
            })
        }
    } catch (error) {
        console.error('获取订单详情失败:', error.message)
        console.error('完整错误:', error)
        console.error('错误堆栈:', error.stack)
        // 确保响应已经发送
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: '获取订单详情失败，请稍后重试'
            })
        }
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
        
        // 使用英文状态值，与数据库保持一致
        const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: '无效的订单状态'
            })
        }
        
        try {
            // 使用useDb中间件来获取数据库连接
            await req.useDb('orders', async (connection) => {
                const [result] = await connection.execute(
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
                const [orders] = await connection.execute(
                    'SELECT * FROM orders WHERE id = ?',
                    [id]
                )
                
                if (orders.length > 0) {
                    const updatedOrder = orders[0]
                    // 解析items字段
                    if (updatedOrder.items && typeof updatedOrder.items === 'string') {
                        try {
                            updatedOrder.items = JSON.parse(updatedOrder.items)
                        } catch (e) {
                            console.error('解析items字段失败:', e.message)
                            updatedOrder.items = { items: [] }
                        }
                    }
                    // 添加total_price字段
                    if (updatedOrder.total_amount) {
                        updatedOrder.total_price = updatedOrder.total_amount
                    }
                }
                
                res.json({
                    success: true,
                    message: '订单状态更新成功',
                    data: orders[0]
                })
            }, 'updateOrderStatus')
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