import express from 'express'

const router = express.Router()



// 获取商品列表
router.get('/', async (req, res) => {
    try {
        // 获取查询参数
        const { series, priceRange, rarity, sortBy, page = 1, limit = 10 } = req.query
        
        const db = req.db
        let query = 'SELECT * FROM products WHERE 1=1'
        const params = []
            
            // 构建筛选条件
            if (series) {
                query += ' AND series = ?'
                params.push(series)
            }
            
            if (rarity) {
                query += ' AND rarity = ?'
                params.push(rarity)
            }
            
            // 价格范围筛选
            if (priceRange) {
                switch (priceRange) {
                    case '0-50':
                        query += ' AND price BETWEEN 0 AND 50'
                        break
                    case '50-100':
                        query += ' AND price BETWEEN 50 AND 100'
                        break
                    case '100-200':
                        query += ' AND price BETWEEN 100 AND 200'
                        break
                    case '200+':
                        query += ' AND price > 200'
                        break
                }
            }
            
            // 排序
            switch (sortBy) {
                case 'price-low':
                    query += ' ORDER BY price ASC'
                    break
                case 'price-high':
                    query += ' ORDER BY price DESC'
                    break
                case 'rating':
                    query += ' ORDER BY rating DESC'
                    break
                case 'newest':
                default:
                    query += ' ORDER BY created_at DESC'
            }
            
            // 分页
            const offset = (page - 1) * limit
            query += ' LIMIT ? OFFSET ?'
            params.push(parseInt(limit), offset)
            
            const [products] = await db.execute(query, params)
            
            // 获取总数
            const [countResult] = await db.execute('SELECT COUNT(*) as total FROM products WHERE 1=1' + 
                (series ? ' AND series = ?' : '') + 
                (rarity ? ' AND rarity = ?' : '') +
                (priceRange ? getPriceRangeCondition(priceRange) : ''),
                params.slice(0, -2))
            
            res.json({
                success: true,
                data: products,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    totalItems: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            })
    } catch (error) {
        console.error('获取商品列表失败:', error)
        res.status(500).json({
            success: false,
            message: '获取商品列表失败，请稍后重试'
        })
    }
})

// 获取商品详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        
        try {
            const db = req.db
            const [products] = await db.execute(
                'SELECT * FROM products WHERE id = ?',
                [id]
            )
            
            if (products.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '商品不存在'
                })
            }
            
            res.json({
                success: true,
                data: products[0]
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError)
            return res.status(500).json({
                success: false,
                message: '获取商品详情失败，请稍后重试'
            })
        }
    } catch (error) {
        console.error('获取商品详情失败:', error)
        res.status(500).json({
            success: false,
            message: '获取商品详情失败，请稍后重试'
        })
    }
})

// 获取商品系列列表
router.get('/series/list', async (req, res) => {
    try {
        const db = req.db
        const [seriesList] = await db.execute(
            'SELECT DISTINCT series FROM products ORDER BY series'
        )
        
        res.json({
            success: true,
            data: seriesList.map(item => item.series)
        })
    } catch (error) {
        console.error('获取商品系列失败:', error)
        res.status(500).json({
            success: false,
            message: '获取商品系列失败，请稍后重试'
        })
    }
})

// 辅助函数：获取价格范围条件
function getPriceRangeCondition(priceRange) {
    switch (priceRange) {
        case '0-50': return ' AND price BETWEEN 0 AND 50'
        case '50-100': return ' AND price BETWEEN 50 AND 100'
        case '100-200': return ' AND price BETWEEN 100 AND 200'
        case '200+': return ' AND price > 200'
        default: return ''
    }
}

export default router