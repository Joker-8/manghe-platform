import express from 'express'

const router = express.Router()

// 获取帖子列表
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = 'newest' } = req.query
        
        try {
            const db = req.db
            let orderBy = 'created_at DESC'
            
            if (sort === 'popular') {
                orderBy = 'likes DESC'
            }
            
            // 分页
            const offset = (page - 1) * limit
            
            const [posts] = await db.execute(
                `SELECT p.*, u.username, u.avatar 
                 FROM community_posts p 
                 JOIN users u ON p.user_id = u.id 
                 ORDER BY ${orderBy} 
                 LIMIT ? OFFSET ?`,
                [parseInt(limit), offset]
            )
            
            // 获取总数
            const [countResult] = await db.execute(
                'SELECT COUNT(*) as total FROM community_posts'
            )
            
            // 获取每个帖子的评论数
            const postIds = posts.map(p => p.id)
            let commentsCounts = {}
            
            if (postIds.length > 0) {
                const [commentsResult] = await db.execute(
                    `SELECT post_id, COUNT(*) as count 
                     FROM community_comments 
                     WHERE post_id IN (${postIds.join(',')}) 
                     GROUP BY post_id`,
                    []
                )
                
                commentsResult.forEach(c => {
                    commentsCounts[c.post_id] = c.count
                })
            }
            
            // 添加评论数到帖子数据中
            const postsWithCommentsCount = posts.map(post => ({
                ...post,
                comments: commentsCounts[post.id] || 0,
                comments_list: []
            }))
            
            res.json({
                success: true,
                data: postsWithCommentsCount,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    totalItems: countResult[0].total,
                    totalPages: Math.ceil(countResult[0].total / limit)
                }
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message);
            throw dbError;
        }
    } catch (error) {
        console.error('获取帖子列表失败:', error)
        res.status(500).json({
            success: false,
            message: '获取帖子列表失败，请稍后重试'
        })
    }
})

// 移除了模拟数据的posts端点

// 获取帖子详情
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        
        try {
            const db = req.db
            
            // 获取帖子信息
            const [posts] = await db.execute(
                `SELECT p.*, u.username, u.avatar 
                 FROM community_posts p 
                 JOIN users u ON p.user_id = u.id 
                 WHERE p.id = ?`,
                [id]
            )
            
            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                })
            }
            
            const post = posts[0]
            
            // 获取评论列表
            const [comments] = await db.execute(
                `SELECT c.*, u.username, u.avatar 
                 FROM community_comments c 
                 JOIN users u ON c.user_id = u.id 
                 WHERE c.post_id = ? 
                 ORDER BY c.created_at ASC`,
                [id]
            )
            
            res.json({
                success: true,
                data: {
                    ...post,
                    comments: comments.length,
                    comments_list: comments
                }
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
        }
    } catch (error) {
        console.error('获取帖子详情失败:', error)
        res.status(500).json({
            success: false,
            message: '获取帖子详情失败，请稍后重试'
        })
    }
})

// 发布帖子
router.post('/', async (req, res) => {
    try {
        const { user_id, title, content, images = [] } = req.body
        
        if (!user_id || !title || !content) {
            return res.status(400).json({
                success: false,
                message: '请提供完整的帖子信息'
            })
        }
        
        try {
            const db = req.db
            
            // 检查用户是否存在
            const [users] = await db.execute(
                'SELECT username, avatar FROM users WHERE id = ?',
                [user_id]
            )
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                })
            }
            
            const user = users[0]
            
            // 创建帖子
            const [result] = await db.execute(
                'INSERT INTO community_posts (user_id, title, content, images, likes, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
                [user_id, title, JSON.stringify(images), 0]
            )
            
            res.status(201).json({
                success: true,
                message: '帖子发布成功',
                data: {
                    id: result.insertId,
                    user_id,
                    username: user.username,
                    avatar: user.avatar,
                    title,
                    content,
                    images,
                    likes: 0,
                    comments: 0,
                    created_at: new Date().toISOString(),
                    comments_list: []
                }
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message);
            throw dbError;
        }
    } catch (error) {
        console.error('发布帖子失败:', error)
        res.status(500).json({
            success: false,
            message: '发布帖子失败，请稍后重试'
        })
    }
})

// 发布评论
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params
        const { user_id, content } = req.body
        
        if (!user_id || !content) {
            return res.status(400).json({
                success: false,
                message: '请提供评论内容和用户信息'
            })
        }
        
        try {
            const db = req.db
            
            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id FROM community_posts WHERE id = ?',
                [id]
            )
            
            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                })
            }
            
            // 检查用户是否存在
            const [users] = await db.execute(
                'SELECT username, avatar FROM users WHERE id = ?',
                [user_id]
            )
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                })
            }
            
            const user = users[0]
            
            // 创建评论
            const [result] = await db.execute(
                'INSERT INTO community_comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
                [id, user_id, content]
            )
            
            const newComment = {
                id: result.insertId,
                user_id,
                username: user.username,
                avatar: user.avatar,
                content,
                created_at: new Date().toISOString()
            }
            
            res.status(201).json({
                success: true,
                message: '评论发布成功',
                data: newComment
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
            
            const newComment = {
                id: Date.now(),
                user_id,
                username: `用户${user_id}`,
                avatar: '/images/Logo.png',
                content,
                created_at: new Date().toISOString()
            }
            
            mockPosts[postIndex].comments_list.push(newComment)
            mockPosts[postIndex].comments += 1
            
            res.status(201).json({
                success: true,
                message: '评论发布成功（模拟数据）',
                data: newComment
            })
        }
    } catch (error) {
        console.error('发布评论失败:', error)
        res.status(500).json({
            success: false,
            message: '发布评论失败，请稍后重试'
        })
    }
})

// 点赞帖子
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params
        const { user_id } = req.body
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: '请提供用户信息'
            })
        }
        
        try {
            const db = req.db
            
            // 检查帖子是否存在
            const [posts] = await db.execute(
                'SELECT id FROM community_posts WHERE id = ?',
                [id]
            )
            
            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '帖子不存在'
                })
            }
            
            // 检查是否已经点赞
            const [likes] = await db.execute(
                'SELECT id FROM community_likes WHERE post_id = ? AND user_id = ?',
                [id, user_id]
            )
            
            if (likes.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '已经点赞过了'
                })
            }
            
            // 添加点赞记录
            await db.execute(
                'INSERT INTO community_likes (post_id, user_id, created_at) VALUES (?, ?, NOW())',
                [id, user_id]
            )
            
            // 更新点赞数
            await db.execute(
                'UPDATE community_posts SET likes = likes + 1 WHERE id = ?',
                [id]
            )
            
            res.json({
                success: true,
                message: '点赞成功'
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message);
            throw dbError;
        }
    } catch (error) {
        console.error('点赞失败:', error)
        res.status(500).json({
            success: false,
            message: '点赞失败，请稍后重试'
        })
    }
})

export default router