import { createStore } from 'vuex'

export default createStore({
    state: {
        user: null,
        token: localStorage.getItem('token'),
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
        cart: JSON.parse(localStorage.getItem('cart') || '[]')
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
            }
        },

        REMOVE_FAVORITE(state, boxId) {
            state.favorites = state.favorites.filter(id => id !== boxId)
            localStorage.setItem('favorites', JSON.stringify(state.favorites))
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
        async login({ commit }, credentials) {
            try {
                // 模拟登录成功
                const mockUser = {
                    id: 1,
                    username: credentials.loginInput,
                    email: 'user@example.com',
                    avatar: getDefaultAvatar(),
                    points: 1280,
                    level: '黄金会员'
                }

                const mockToken = 'mock-jwt-token-' + Date.now()

                commit('SET_TOKEN', mockToken)
                commit('SET_USER', mockUser)

                return { success: true }
            } catch (error) {
                return { success: false, message: '登录失败' }
            }
        },

        async register({ commit }, userData) {
            try {
                // 模拟注册成功
                const mockUser = {
                    id: Date.now(),
                    username: userData.username,
                    email: userData.email,
                    avatar: getDefaultAvatar(),
                    points: 100,
                    level: '普通会员'
                }

                const mockToken = 'mock-jwt-token-' + Date.now()

                commit('SET_TOKEN', mockToken)
                commit('SET_USER', mockUser)

                return { success: true }
            } catch (error) {
                return { success: false, message: '注册失败' }
            }
        },

        logout({ commit }) {
            commit('CLEAR_AUTH')
        },

        initializeStore({ commit }) {
            commit('INITIALIZE_STORE')
        },

        addFavorite({ commit }, boxId) {
            commit('ADD_FAVORITE', boxId)
        },

        removeFavorite({ commit }, boxId) {
            commit('REMOVE_FAVORITE', boxId)
        }
    }
})

// 获取默认头像（使用base64 SVG）
function getDefaultAvatar() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTE2IDE3QzE4LjIwOTEgMTcgMjAgMTUuMjA5MSAyMCAxM0MyMCAxMC43OTA5IDE4LjIwOTEgOSAxNiA5QzEzLjc5MDkgOSAxMiAxMC43OTA5IDEyIDEzQzEyIDE1LjIwOTEgMTMuNzkwOSAxNyAxNiAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAxOEMxMS41ODIyIDE4IDggMjAuNjg2MyA4IDI0SDE2SDI0QzI0IDIwLjY4NjMgMjAuNDE3OCAxOCAxNiAxOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
}