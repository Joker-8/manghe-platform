import express from 'express'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import database from '../utils/database.js'
import { authMiddleware } from '../middleware/auth.js'

const { pool, useDb, persistenceManager, isDbConnected } = database

// 用户权限检查中间件
function userPermissionMiddleware(req, res, next) {
  const userId = req.params.id;
  const currentUserId = req.user?.id || req.query.currentUserId;
  
  if (userId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: '无权访问其他用户的数据'
    });
  }
  
  next();
}

// 确保persistenceManager可用
const pm = persistenceManager || {
  getUserSyncData: async () => ({ favorites: [], cart: [], version: 0 }),
  syncClientData: async () => ({ success: false, message: 'persistenceManager不可用' })
}

// 数据库API封装
const dbAPI = {
    getUserById: async (userId) => {
        const db = pool;
        const [users] = await db.execute(
            'SELECT id, username, email, avatar, level, points, followers, following, posts, created_at FROM users WHERE id = ?',
            [userId]
        );
        return users[0] || null;
    },
    isUserFollowing: async (followerId, followedId) => {
        const db = pool;
        const [follows] = await db.execute(
            'SELECT id FROM user_follows WHERE follower_user_id = ? AND followed_user_id = ?',
            [followerId, followedId]
        );
        return follows.length > 0;
    },
    updateUser: async (userId, updates) => {
        const db = pool;
        const fields = [];
        const values = [];
        
        if (updates.username) {
            fields.push('username = ?');
            values.push(updates.username);
            
            // 检查用户名是否已被使用
            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [updates.username, userId]
            );
            
            if (existingUsers.length > 0) {
                throw new Error('用户名已被使用');
            }
        }
        
        if (updates.avatar) {
            fields.push('avatar = ?');
            values.push(updates.avatar);
        }
        
        if (fields.length === 0) {
            throw new Error('没有要更新的字段');
        }
        
        values.push(userId);
        
        const [result] = await db.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        if (result.affectedRows === 0) {
            throw new Error('用户不存在');
        }
        
        return await dbAPI.getUserById(userId);
    }
};

const router = express.Router()

// 获取用户同步数据 - 添加权限控制
router.get('/:id/sync', authMiddleware, userPermissionMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db || pool;
    
    // 从数据库获取用户同步数据
    const [syncDataResult] = await db.execute(
      'SELECT * FROM user_sync_data WHERE user_id = ?',
      [parseInt(id)]
    );
    
    if (syncDataResult.length === 0) {
      // 如果没有同步数据，返回空数据
      return res.json({
        success: true,
        data: {
          userId: parseInt(id),
          version: 1,
          favorites: [],
          cart: [],
          lastSyncTime: new Date().toISOString()
        }
      });
    }
    
    const syncData = syncDataResult[0];
    res.json({
      success: true,
      data: {
        userId: parseInt(id),
        version: syncData.version || 1,
        favorites: syncData.favorites ? JSON.parse(syncData.favorites) : [],
        cart: syncData.cart ? JSON.parse(syncData.cart) : [],
        lastSyncTime: syncData.updated_at || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取同步数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取同步数据失败，请稍后重试'
    });
  }
});

// 同步客户端数据 - 添加权限控制
router.post('/:id/sync', authMiddleware, userPermissionMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const clientData = req.body;
    const db = req.db || pool;
    
    // 检查数据库中是否已有同步数据
    const [existingData] = await db.execute(
      'SELECT version FROM user_sync_data WHERE user_id = ?',
      [parseInt(id)]
    );
    
    const newVersion = existingData.length > 0 ? (existingData[0].version || 0) + 1 : 1;
    const now = new Date().toISOString();
    
    if (existingData.length > 0) {
      // 更新现有数据
      await db.execute(
        'UPDATE user_sync_data SET favorites = ?, cart = ?, version = ?, updated_at = ? WHERE user_id = ?',
        [
          JSON.stringify(clientData.favorites || []),
          JSON.stringify(clientData.cart || []),
          newVersion,
          now,
          parseInt(id)
        ]
      );
    } else {
      // 创建新数据
      await db.execute(
        'INSERT INTO user_sync_data (user_id, favorites, cart, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          parseInt(id),
          JSON.stringify(clientData.favorites || []),
          JSON.stringify(clientData.cart || []),
          newVersion,
          now,
          now
        ]
      );
    }
    
    res.json({
      success: true,
      message: '数据同步成功',
      data: {
        userId: parseInt(id),
        version: newVersion,
        favorites: clientData.favorites || [],
        cart: clientData.cart || [],
        lastSyncTime: now
      }
    });
  } catch (error) {
    console.error('同步数据失败:', error);
    res.status(500).json({
      success: false,
      message: '同步数据失败，请稍后重试'
    });
  }
});

// 用户路由 - 已移除模拟数据，全部使用真实数据库操作

// 获取用户信息
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUserId = req.user?.id || req.query.currentUserId;
        
        // 使用封装的getUserById方法查询用户信息
        const user = await dbAPI.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        // 如果当前用户已登录，检查是否关注了该用户
        if (currentUserId && currentUserId !== userId) {
            const isFollowing = await dbAPI.isUserFollowing(currentUserId, userId);
            user.isFollowing = isFollowing;
        }
        
        // 返回用户信息
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        // 检查是否是数据库错误，返回适当的状态码
        if (error.code && ['SQLITE_BUSY', 'SQLITE_LOCKED', 'ECONNRESET'].includes(error.code)) {
            res.status(503).json({
                success: false,
                message: '数据库服务暂时不可用，请稍后重试',
                errorCode: error.code
            });
        } else {
            res.status(500).json({
                success: false,
                message: '获取用户信息失败，请稍后重试'
            });
        }
    }
})

// 更新用户资料
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, avatar } = req.body;
        
        // 参数验证
        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        // 检查用户是否有权限更新
        if (req.user?.id && req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: '没有权限更新其他用户的资料'
            });
        }
        
        // 使用封装的updateUser方法更新用户信息
        const updatedUser = await dbAPI.updateUser(userId, { username, avatar });
        
        res.json({
            success: true,
            message: '用户资料更新成功',
            data: updatedUser
        });
    } catch (error) {
        console.error('更新用户资料失败:', error);
        
        // 根据错误类型返回适当的状态码
        if (error.code && ['SQLITE_BUSY', 'SQLITE_LOCKED', 'ECONNRESET'].includes(error.code)) {
            res.status(503).json({
                success: false,
                message: '数据库服务暂时不可用，请稍后重试',
                errorCode: error.code
            });
        } else if (error.message === '用户不存在') {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        } else if (error.message === '用户名已被使用') {
            res.status(400).json({
                success: false,
                message: '用户名已被使用'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '更新用户资料失败，请稍后重试'
            });
        }
    }
})

// 修改密码
router.put('/:id/password', async (req, res) => {
    try {
        const { id } = req.params
        const { oldPassword, newPassword } = req.body
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '请提供旧密码和新密码'
            })
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: '新密码长度至少为6位'
            })
        }
        
            const db = req.db
            
            // 获取用户信息
            const [users] = await db.execute(
                'SELECT id, password FROM users WHERE id = ?',
                [id]
            )
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                })
            }
            
            const user = users[0]
            
            // 验证旧密码
            const isMatch = await bcrypt.compare(oldPassword, user.password)
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: '旧密码不正确'
                })
            }
            
            // 加密新密码
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(newPassword, salt)
            
            // 更新密码
            await db.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, id]
            )
            
            res.json({
                success: true,
                message: '密码修改成功'
            })
    } catch (error) {
        console.error('修改密码失败:', error)
        res.status(500).json({
            success: false,
            message: '修改密码失败，请稍后重试'
        })
    }
})

// 关注用户
router.post('/:id/follow', async (req, res) => {
    try {
        const { id } = req.params
        const { followerUserId } = req.body
        
        if (!followerUserId) {
            return res.status(400).json({
                success: false,
                message: '请提供关注者ID'
            })
        }
        
        if (parseInt(id) === parseInt(followerUserId)) {
            return res.status(400).json({
                success: false,
                message: '不能关注自己'
            })
        }
        
        try {
            const db = req.db
            
            // 检查被关注用户是否存在
            const [users] = await db.execute(
                'SELECT id FROM users WHERE id = ?',
                [id]
            )
            
            if (users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: '被关注用户不存在'
                })
            }
            
            // 检查是否已经关注
            const [follows] = await db.execute(
                'SELECT id FROM user_follows WHERE follower_user_id = ? AND followed_user_id = ?',
                [followerUserId, id]
            )
            
            if (follows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '已经关注了该用户'
                })
            }
            
            // 创建关注关系
            await db.execute(
                'INSERT INTO user_follows (follower_user_id, followed_user_id, created_at) VALUES (?, ?, NOW())',
                [followerUserId, id]
            )
            
            res.json({
                success: true,
                message: '关注成功'
            })
        } catch (dbError) {
            console.error('数据库操作失败:', dbError.message)
            throw dbError
        }
    } catch (error) {
        console.error('关注用户失败:', error)
        res.status(500).json({
            success: false,
            message: '关注用户失败，请稍后重试'
        })
    }
})

// 取消关注用户
router.delete('/:id/follow', async (req, res) => {
    try {
        const { id } = req.params
        const { followerUserId } = req.body
        
        if (!followerUserId) {
            return res.status(400).json({
                success: false,
                message: '请提供关注者ID'
            })
        }
        
        const db = req.db
        
        // 删除关注关系
        const [result] = await db.execute(
            'DELETE FROM user_follows WHERE follower_user_id = ? AND followed_user_id = ?',
            [followerUserId, id]
        )
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到关注关系'
            })
        }
        
        res.json({
            success: true,
            message: '取消关注成功'
        })
    } catch (error) {
        console.error('取消关注失败:', error)
        res.status(500).json({
            success: false,
            message: '取消关注失败，请稍后重试'
        })
    }
})

// 获取用户收藏列表
router.get('/:id/collections', async (req, res) => {
    try {
        const { id } = req.params
        const { page = 1, limit = 10 } = req.query
        
        const db = req.db
        
        // 分页查询用户收藏
        const offset = (page - 1) * limit
        const [collections] = await db.execute(
            `SELECT c.*, p.name, p.image, p.price, p.series, p.rarity 
             FROM user_collections c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = ? 
             ORDER BY c.created_at DESC 
             LIMIT ? OFFSET ?`,
            [id, parseInt(limit), offset]
        )
        
        // 获取总数
        const [countResult] = await db.execute(
            'SELECT COUNT(*) as total FROM user_collections WHERE user_id = ?',
            [id]
        )
        
        res.json({
            success: true,
            data: collections,
            pagination: {
                currentPage: parseInt(page),
                pageSize: parseInt(limit),
                totalItems: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        })
    } catch (error) {
        console.error('获取用户收藏列表失败:', error)
        res.status(500).json({
            success: false,
            message: '获取用户收藏列表失败，请稍后重试'
        })
    }
})

// 添加收藏接口
router.post('/collections/:productId', async (req, res) => {
    try {
        const userId = req.user?.id || 1; // 从JWT中获取用户ID，默认1用于测试
        const productId = parseInt(req.params.productId);
        
        if (!productId || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: '无效的商品ID'
            });
        }
        
        // 数据库模式
        if (isDbConnected()) {
            try {
                // 检查商品是否存在
                const [productResult] = await pool.query(
                    'SELECT id FROM products WHERE id = ?',
                    [productId]
                );
                
                if (productResult.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: '商品不存在'
                    });
                }
                
                // 检查是否已经收藏
                const [existingCollection] = await pool.query(
                    'SELECT id FROM user_collections WHERE user_id = ? AND product_id = ?',
                    [userId, productId]
                );
                
                if (existingCollection.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: '已经收藏过该商品'
                    });
                }
                
                // 添加收藏
                const [result] = await pool.query(
                    `INSERT INTO user_collections (user_id, product_id, created_at) 
                     VALUES (?, ?, NOW())`,
                    [userId, productId]
                );
                
                // 获取插入的收藏记录
                const [insertedCollection] = await pool.query(
                    'SELECT * FROM user_collections WHERE id = ?',
                    [result.insertId]
                );
                
                // 同时保存到持久化存储作为备份
                await persistenceManager.saveCollection(userId, productId);
                
                res.status(201).json({
                    success: true,
                    message: '收藏成功',
                    data: insertedCollection[0]
                });
            } catch (dbError) {
                console.error('数据库收藏失败，使用持久化存储:', dbError);
                // 降级到持久化存储
                const saved = await persistenceManager.saveCollection(userId, productId);
                if (saved) {
                    res.status(201).json({
                        success: true,
                        message: '收藏成功（持久化存储）',
                        data: {
                            id: Date.now(),
                            userId,
                            productId,
                            created_at: new Date().toISOString()
                        }
                    });
                } else {
                    throw new Error('持久化存储也失败');
                }
            }
        } else {
            // 使用持久化存储
            const saved = await persistenceManager.saveCollection(userId, productId);
            if (saved) {
                res.status(201).json({
                    success: true,
                    message: '收藏成功（持久化存储）',
                    data: {
                        id: Date.now(),
                        userId,
                        productId,
                        created_at: new Date().toISOString()
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: '已经收藏过该商品'
                });
            }
        }
    } catch (error) {
        console.error('添加收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '添加收藏失败，请稍后重试'
        });
    }
});

// 检查商品是否已收藏接口
router.get('/collections/:productId/check', async (req, res) => {
    try {
        const userId = req.user?.id || 1; // 从JWT中获取用户ID，默认1用于测试
        const productId = parseInt(req.params.productId);
        
        if (!productId || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: '无效的商品ID'
            });
        }
        
        let isCollected = false;
        let source = 'database';
        
        // 数据库模式
        if (isDbConnected()) {
            try {
                const [result] = await pool.query(
                    'SELECT id FROM user_collections WHERE user_id = ? AND product_id = ?',
                    [userId, productId]
                );
                isCollected = result.length > 0;
            } catch (dbError) {
                console.error('数据库检查失败，使用持久化存储:', dbError);
                // 降级到持久化存储
                isCollected = await persistenceManager.checkCollection(userId, productId);
                source = 'persistence';
            }
        } else {
            // 使用持久化存储
            isCollected = await persistenceManager.checkCollection(userId, productId);
            source = 'persistence';
        }
        
        res.json({
            success: true,
            isCollected,
            message: isCollected ? '已收藏该商品' : '未收藏该商品',
            source
        });
    } catch (error) {
        console.error('检查收藏状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查收藏状态失败，请稍后重试'
        });
    }
});

// 取消收藏接口
router.delete('/collections/:productId', async (req, res) => {
    try {
        const userId = req.user?.id || 1; // 从JWT中获取用户ID，默认1用于测试
        const productId = parseInt(req.params.productId);
        
        if (!productId || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: '无效的商品ID'
            });
        }
        
        // 数据库模式
        if (isDbConnected()) {
            try {
                // 检查收藏是否存在并删除
                const [result] = await pool.execute(
                    'DELETE FROM user_collections WHERE user_id = ? AND product_id = ?',
                    [userId, productId]
                );
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: '收藏记录不存在'
                    });
                }
                
                res.json({
                    success: true,
                    message: '取消收藏成功'
                });
            } catch (dbError) {
                console.error('数据库取消收藏失败，使用持久化存储:', dbError);
                // 降级到持久化存储
                const collections = await persistenceManager.loadData('collections');
                const filteredCollections = collections.filter(
                    c => !(c.userId === userId && c.productId === productId)
                );
                
                if (collections.length === filteredCollections.length) {
                    return res.status(404).json({
                        success: false,
                        message: '收藏记录不存在'
                    });
                }
                
                await persistenceManager.saveData('collections', filteredCollections);
                await persistenceManager.updateUserSyncData(userId);
                
                res.json({
                    success: true,
                    message: '取消收藏成功（持久化存储）'
                });
            }
        } else {
            // 使用持久化存储
            const collections = await persistenceManager.loadData('collections');
            const filteredCollections = collections.filter(
                c => !(c.userId === userId && c.productId === productId)
            );
            
            if (collections.length === filteredCollections.length) {
                return res.status(404).json({
                    success: false,
                    message: '收藏记录不存在'
                });
            }
            
            await persistenceManager.saveData('collections', filteredCollections);
            await persistenceManager.updateUserSyncData(userId);
            
            res.json({
                success: true,
                message: '取消收藏成功（持久化存储）'
            });
        }
    } catch (error) {
        console.error('取消收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '取消收藏失败，请稍后重试'
        });
    }
});

// 上传用户头像接口
router.post('/avatar', authMiddleware, (req, res) => {
    try {
        const upload = req.app.locals.upload
        
        upload.single('avatar')(req, res, async (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        success: false,
                        message: '文件大小不能超过10MB'
                    })
                }
                return res.status(400).json({
                    success: false,
                    message: err.message || '文件上传失败'
                })
            }
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的头像文件'
                })
            }
            
            const userId = req.user.id
            const avatarUrl = '/uploads/' + req.file.filename
            
            // 数据库模式
            if (useDb) {
                try {
                    // 获取旧头像路径以便删除
                    const [oldAvatars] = await db.execute(
                        'SELECT avatar FROM users WHERE id = ?',
                        [userId]
                    )
                    
                    const oldAvatar = oldAvatars[0]?.avatar
                    
                    // 更新用户头像
                    await db.execute(
                        'UPDATE users SET avatar = ? WHERE id = ?',
                        [avatarUrl, userId]
                    )
                    
                    // 删除旧头像文件
                    if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
                        const oldAvatarPath = path.join(process.cwd(), oldAvatar)
                        if (fs.existsSync(oldAvatarPath)) {
                            fs.unlinkSync(oldAvatarPath)
                        }
                    }
                    
                    res.json({
                        success: true,
                        message: '头像上传成功',
                        avatarUrl: avatarUrl
                    })
                } catch (dbError) {
                        console.error('数据库操作失败:', dbError.message);
                        throw dbError;
                    }
                }
                // 移除了模拟数据模式
        })
    } catch (error) {
        console.error('上传头像失败:', error)
        res.status(500).json({
            success: false,
            message: '上传头像失败，请稍后重试'
        })
    }
})

// 上传帖子图片接口（用于社区功能）
router.post('/post-image', authMiddleware, (req, res) => {
    try {
        const upload = req.app.locals.upload
        
        upload.single('image')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        success: false,
                        message: '文件大小不能超过10MB'
                    })
                }
                return res.status(400).json({
                    success: false,
                    message: err.message || '文件上传失败'
                })
            }
            
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: '请选择要上传的图片文件'
                })
            }
            
            const imageUrl = '/uploads/' + req.file.filename
            
            res.json({
                success: true,
                message: '图片上传成功',
                imageUrl: imageUrl
            })
        })
    } catch (error) {
        console.error('上传图片失败:', error)
        res.status(500).json({
            success: false,
            message: '上传图片失败，请稍后重试'
        })
    }
})

// 模拟存储账号注销申请的内存数据
let accountDeletionRequests = {};

// 提交账号注销申请
router.post('/:id/delete-request', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 确保用户只能操作自己的账号
        if (parseInt(id) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权操作其他用户的账号'
            });
        }
        
        // 计算7天后的时间作为注销时间
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + 7);
        
        // 存储注销申请（在实际应用中应存储在数据库中）
        accountDeletionRequests[id] = {
            userId: parseInt(id),
            scheduledTime: scheduledTime.toISOString(),
            status: 'pending',
            requestedAt: new Date().toISOString()
        };
        
        console.log(`用户 ${id} 提交了账号注销申请，计划在 ${scheduledTime.toISOString()} 注销`);
        
        res.json({
            success: true,
            message: '账号注销申请已提交，将在7天后正式注销',
            data: {
                scheduledTime: scheduledTime.toISOString(),
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('提交账号注销申请失败:', error);
        res.status(500).json({
            success: false,
            message: '提交账号注销申请失败，请稍后重试'
        });
    }
});

// 取消账号注销申请
router.delete('/:id/delete-request', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 确保用户只能操作自己的账号
        if (parseInt(id) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权操作其他用户的账号'
            });
        }
        
        // 检查是否存在注销申请
        if (!accountDeletionRequests[id]) {
            return res.status(404).json({
                success: false,
                message: '未找到账号注销申请'
            });
        }
        
        // 删除注销申请
        delete accountDeletionRequests[id];
        
        console.log(`用户 ${id} 取消了账号注销申请`);
        
        res.json({
            success: true,
            message: '账号注销申请已取消'
        });
    } catch (error) {
        console.error('取消账号注销申请失败:', error);
        res.status(500).json({
            success: false,
            message: '取消账号注销申请失败，请稍后重试'
        });
    }
});

// 获取账号注销状态
router.get('/:id/delete-status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // 确保用户只能查看自己的账号状态
        if (parseInt(id) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: '无权查看其他用户的账号状态'
            });
        }
        
        // 检查是否存在注销申请
        const deletionRequest = accountDeletionRequests[id];
        
        if (!deletionRequest) {
            return res.json({
                success: true,
                hasPendingRequest: false,
                message: '当前没有待处理的注销申请'
            });
        }
        
        res.json({
            success: true,
            hasPendingRequest: true,
            data: {
                scheduledTime: deletionRequest.scheduledTime,
                status: deletionRequest.status,
                requestedAt: deletionRequest.requestedAt
            }
        });
    } catch (error) {
        console.error('获取账号注销状态失败:', error);
        res.status(500).json({
            success: false,
            message: '获取账号注销状态失败，请稍后重试'
        });
    }
});

export default router