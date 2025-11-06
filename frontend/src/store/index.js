import { createStore } from 'vuex'
import { syncApi } from '@/utils/api'

export default createStore({
    state: {
        user: null,
        token: localStorage.getItem('token'),
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        cart: JSON.parse(localStorage.getItem('cart') || '[]'),
        syncVersion: parseInt(localStorage.getItem('syncVersion') || '0'),
        lastSyncTime: localStorage.getItem('lastSyncTime') || null
    },

    getters: {
        isLoggedIn: state => !!state.token,
        username: state => state.user?.username || '',
        avatar: state => state.user?.avatar || getDefaultAvatar()
    },

    mutations: {
        SET_USER(state, user) {
            state.user = user
            // 同时保存到 localStorage
            if (user) {
                localStorage.setItem('user', JSON.stringify(user))
            } else {
                localStorage.removeItem('user')
            }
        },

        SET_TOKEN(state, token) {
            state.token = token
            if (token) {
                localStorage.setItem('token', token)
            } else {
                localStorage.removeItem('token')
            }
        },

        CLEAR_AUTH(state) {
            state.user = null
            state.token = null
            state.favorites = []
            state.cart = []
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            localStorage.removeItem('favorites')
            localStorage.removeItem('cart')
        },

        ADD_FAVORITE(state, boxId) {
            if (!state.favorites.includes(boxId)) {
                state.favorites.push(boxId)
                localStorage.setItem('favorites', JSON.stringify(state.favorites))
                // 增加版本号以标记数据变更
                state.syncVersion += 1
                localStorage.setItem('syncVersion', state.syncVersion.toString())
            }
        },

        REMOVE_FAVORITE(state, boxId) {
            state.favorites = state.favorites.filter(id => id !== boxId)
            localStorage.setItem('favorites', JSON.stringify(state.favorites))
            // 增加版本号以标记数据变更
            state.syncVersion += 1
            localStorage.setItem('syncVersion', state.syncVersion.toString())
        },
        
        ADD_TO_CART(state, product) {
            const existingItem = state.cart.find(item => item.id === product.id)
            if (existingItem) {
                existingItem.quantity += product.quantity || 1
            } else {
                state.cart.push({
                    ...product,
                    quantity: product.quantity || 1
                })
            }
            localStorage.setItem('cart', JSON.stringify(state.cart))
            // 增加版本号以标记数据变更
            state.syncVersion += 1
            localStorage.setItem('syncVersion', state.syncVersion.toString())
        },
        
        REMOVE_FROM_CART(state, productId) {
            state.cart = state.cart.filter(item => item.id !== productId)
            localStorage.setItem('cart', JSON.stringify(state.cart))
            // 增加版本号以标记数据变更
            state.syncVersion += 1
            localStorage.setItem('syncVersion', state.syncVersion.toString())
        },
        
        UPDATE_CART_ITEM_QUANTITY(state, { productId, quantity }) {
            const item = state.cart.find(item => item.id === productId)
            if (item) {
                item.quantity = Math.max(1, quantity) // 确保数量至少为1
                localStorage.setItem('cart', JSON.stringify(state.cart))
                // 增加版本号以标记数据变更
                state.syncVersion += 1
                localStorage.setItem('syncVersion', state.syncVersion.toString())
            }
        },
        
        CLEAR_CART(state) {
            state.cart = []
            localStorage.removeItem('cart')
            // 增加版本号以标记数据变更
            state.syncVersion += 1
            localStorage.setItem('syncVersion', state.syncVersion.toString())
        },

        SET_SYNC_DATA(state, syncData) {
            if (syncData.favorites) {
                state.favorites = syncData.favorites
                localStorage.setItem('favorites', JSON.stringify(state.favorites))
            }
            if (syncData.cart) {
                state.cart = syncData.cart
                localStorage.setItem('cart', JSON.stringify(state.cart))
            }
            if (syncData.version !== undefined) {
                state.syncVersion = syncData.version
                localStorage.setItem('syncVersion', state.syncVersion.toString())
            }
            if (syncData.lastSyncTime) {
                state.lastSyncTime = syncData.lastSyncTime
                localStorage.setItem('lastSyncTime', state.lastSyncTime)
            }
        },

        CLEAR_SYNC_DATA(state) {
            state.syncVersion = 0
            state.lastSyncTime = null
            localStorage.removeItem('syncVersion')
            localStorage.removeItem('lastSyncTime')
        },

        INITIALIZE_STORE(state) {
            // 从 localStorage 加载用户数据
            const savedUser = localStorage.getItem('user')
            if (savedUser) {
                try {
                    state.user = JSON.parse(savedUser)
                } catch (error) {
                    console.error('解析用户数据失败:', error)
                    localStorage.removeItem('user')
                }
            }
        }
    },

    actions: {
        async login({ commit, dispatch }, credentials) {
            try {
                // 模拟登录成功
                const mockToken = 'mock-jwt-token-' + Date.now()
                const mockUser = {
                    id: '1',
                    username: credentials.username || credentials.loginInput || 'test_user',
                    email: 'user@example.com',
                    avatar: getDefaultAvatar(),
                    role: 'user',
                    points: 1280,
                    level: '黄金会员'
                }

                // 保存token和用户信息
                commit('SET_TOKEN', mockToken)
                commit('SET_USER', mockUser)
                
                // 登录成功后自动从服务器同步数据
                await dispatch('syncFromServer', mockUser.id)

                return { success: true, message: '登录成功' }
            } catch (error) {
                console.error('登录失败:', error)
                return { success: false, message: error.message || '登录失败，请重试' }
            }
        },

        // 发送验证码
        async sendVerificationCode(_, phone) {
            try {
                // 尝试调用API
                const response = await syncApi.sendVerificationCode(phone)
                // 确保总是返回一个包含success属性的对象
                return response.data || { success: true, message: '验证码发送成功' }
            } catch (error) {
                console.error('发送验证码失败:', error)
                // 模拟发送成功，方便测试
                return {
                    success: true,
                    message: '验证码已发送（模拟环境）',
                    code: '123456', // 固定验证码，方便测试
                    phone: phone.slice(0, 3) + '****' + phone.slice(-4)
                }
            }
        },

        // 手机号验证码登录/注册
        async phoneLogin({ commit, dispatch }, { phone, code }) {
            try {
                // 尝试调用API
                const response = await syncApi.phoneLogin({ phone, code })
                const { token, user } = response.data
                
                // 保存token和用户信息
                commit('SET_TOKEN', token)
                commit('SET_USER', user)
                
                // 登录成功后自动从服务器同步数据
                await dispatch('syncFromServer', user.id)
                
                return { success: true, message: '登录成功' }
            } catch (error) {
                console.error('手机号登录失败:', error)
                
                // 模拟登录成功，方便测试
                const mockToken = 'mock-jwt-token-' + Date.now()
                const mockUser = {
                    id: phone,
                    username: '用户_' + phone.slice(-6),
                    phone: phone.slice(0, 3) + '****' + phone.slice(-4),
                    avatar: getDefaultAvatar(),
                    role: 'user',
                    points: 100,
                    level: '普通会员'
                }
                
                commit('SET_TOKEN', mockToken)
                commit('SET_USER', mockUser)
                
                await dispatch('syncFromServer', mockUser.id)
                
                return { success: true, message: '登录成功（模拟环境）' }
            }
        },

        async register({ commit, dispatch }, userData) {
            try {
                // 模拟注册成功
                const mockToken = 'mock-jwt-token-' + Date.now()
                const mockUser = {
                    id: Date.now().toString(),
                    username: userData.username,
                    email: userData.email,
                    avatar: getDefaultAvatar(),
                    role: 'user',
                    points: 100,
                    level: '普通会员'
                }

                // 保存token和用户信息
                commit('SET_TOKEN', mockToken)
                commit('SET_USER', mockUser)
                
                // 注册成功后初始化同步数据
                await dispatch('syncToServer', mockUser.id)

                return { success: true, message: '注册成功' }
            } catch (error) {
                console.error('注册失败:', error)
                return { success: false, message: error.message || '注册失败，请重试' }
            }
        },

        logout({ commit }) {
            commit('CLEAR_AUTH')
            commit('CLEAR_SYNC_DATA')
        },

        initializeStore({ commit }) {
            commit('INITIALIZE_STORE')
        },

        addFavorite({ commit, dispatch, state }, boxId) {
            commit('ADD_FAVORITE', boxId)
            // 收藏添加后尝试同步到服务器
            if (state.user) {
                dispatch('syncToServer', state.user.id).catch(err => {
                    console.warn('同步到服务器失败，将在下次连接时重试:', err)
                })
            }
        },

        removeFavorite({ commit, dispatch, state }, boxId) {
            commit('REMOVE_FAVORITE', boxId)
            // 收藏移除后尝试同步到服务器
            if (state.user) {
                dispatch('syncToServer', state.user.id).catch(err => {
                    console.warn('同步到服务器失败，将在下次连接时重试:', err)
                })
            }
        },
        
        addToCart({ commit, dispatch, state }, product) {
            commit('ADD_TO_CART', product)
            // 购物车添加后尝试同步到服务器
            if (state.user) {
                dispatch('syncToServer', state.user.id).catch(err => {
                    console.warn('同步到服务器失败，将在下次连接时重试:', err)
                })
            }
        },
        
        removeFromCart({ commit, dispatch, state }, productId) {
            commit('REMOVE_FROM_CART', productId)
            // 购物车移除后尝试同步到服务器
            if (state.user) {
                dispatch('syncToServer', state.user.id).catch(err => {
                    console.warn('同步到服务器失败，将在下次连接时重试:', err)
                })
            }
        },
        
        updateCartItemQuantity({ commit, dispatch, state }, { productId, quantity }) {
            commit('UPDATE_CART_ITEM_QUANTITY', { productId, quantity })
            // 购物车数量更新后尝试同步到服务器
            if (state.user) {
                dispatch('syncToServer', state.user.id).catch(err => {
                    console.warn('同步到服务器失败，将在下次连接时重试:', err)
                })
            }
        },
        
        clearCart({ commit, dispatch, state }) {
            commit('CLEAR_CART')
            // 清空购物车后尝试同步到服务器
            if (state.user) {
                dispatch('syncToServer', state.user.id).catch(err => {
                    console.warn('同步到服务器失败，将在下次连接时重试:', err)
                })
            }
        },
        
        // 从服务器同步数据到本地
        async syncFromServer({ commit, state }, userId) {
            try {
                // 如果没有提供userId，尝试从state中获取
                const actualUserId = userId || state.user?.id;
                
                if (!actualUserId) {
                    console.warn('无法获取用户ID，跳过同步操作')
                    return false;
                }
                
                const response = await syncApi.getUserSyncData(actualUserId)
                if (response.success) {
                    const serverData = response.data
                    // 只有当服务器数据版本更高时才更新本地数据
                    if (!state.syncVersion || serverData.version > state.syncVersion) {
                        commit('SET_SYNC_DATA', serverData)
                        console.log('数据已从服务器同步')
                    }
                    return true
                }
                return false
            } catch (error) {
                console.error('从服务器同步数据失败:', error.message || error)
                // 发生错误时不影响页面正常显示，返回false表示同步失败但不抛出异常
                return false
            }
        },
        
        // 将本地数据同步到服务器
        async syncToServer({ commit, state }, userId) {
            try {
                // 如果没有提供userId，尝试从state中获取
                const actualUserId = userId || state.user?.id;
                
                if (!actualUserId) {
                    console.warn('无法获取用户ID，跳过同步操作')
                    return false;
                }
                
                const clientData = {
                    favorites: state.favorites,
                    cart: state.cart,
                    version: state.syncVersion,
                    lastSyncTime: state.lastSyncTime
                }
                
                const response = await syncApi.syncClientData(actualUserId, clientData)
                if (response.success) {
                    // 更新本地的同步版本和时间
                    commit('SET_SYNC_DATA', response.data)
                    console.log('本地数据已同步到服务器')
                    return true
                }
                return false
            } catch (error) {
                console.error('同步数据到服务器失败:', error.message || error)
                // 发生异常时更新最后同步时间，避免频繁重试
                commit('SET_SYNC_DATA', {
                    lastSyncTime: new Date().toISOString()
                });
                return false
            }
        },
        
        // 冲突解决 - 强制使用服务器数据
        async forceSyncFromServer({ commit }, userId) {
            try {
                const response = await syncApi.getUserSyncData(userId)
                if (response.success) {
                    commit('SET_SYNC_DATA', response.data)
                    console.log('已强制从服务器同步数据')
                    return true
                }
                return false
            } catch (error) {
                console.error('强制同步失败:', error)
                return false
            }
        },
        
        // 定期同步 - 可以在组件挂载时调用
        startPeriodicSync({ dispatch, state }) {
            // 每分钟尝试同步一次
            const syncInterval = setInterval(() => {
                if (state.user && state.token) {
                    dispatch('syncToServer', state.user.id).catch(err => {
                        console.warn('定期同步失败:', err)
                    })
                }
            }, 60000) // 1分钟
            
            return () => clearInterval(syncInterval)
        }
    }
})

// 获取默认头像（使用base64 SVG）
function getDefaultAvatar() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTE2IDE3QzE4LjIwOTEgMTcgMjAgMTUuMjA5MSAyMCAxM0MyMCAxMC43OTA5IDE4LjIwOTEgOSAxNiA5QzEzLjc5MDkgOSAxMiAxMC43OTA5IDEyIDEzQzEyIDE1LjIwOTEgMTMuNzkwOSAxNyAxNiAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAxOEMxMS41ODIyIDE4IDggMjAuNjg2MyA4IDI0SDE2SDI0QzI0IDIwLjY4NjMgMjAuNDE3OCAxOCAxNiAxOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
}