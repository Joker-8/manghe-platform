// API接口工具函数
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API请求错误:', error.message || error)
    
    // 构建更详细的错误对象，包含后端返回的错误信息
    const errorObj = {
      status: error.response?.status || 0,
      originalError: error,
      // 优先使用后端返回的错误信息
      message: error.response?.data?.message || 
               error.response?.data?.error ||
               error.message ||
               (error.code === 'ECONNREFUSED' ? '服务器连接失败，请检查服务器是否运行' : '网络请求失败')
    }
    
    return Promise.reject(errorObj)
  }
)

// 同步相关API
export const syncApi = {
  // 获取用户同步数据
  async getUserSyncData(userId) {
    try {
      // 添加空值检查
      if (!userId) {
        throw new Error('用户ID不能为空')
      }
      const response = await api.get(`/users/${userId}/sync`)
      return response
    } catch (error) {
      console.error('获取用户同步数据失败:', error.message || error)
      throw error
    }
  },
  
  // 同步客户端数据到服务器
  async syncClientData(userId, data) {
    try {
      // 添加空值检查
      if (!userId) {
        throw new Error('用户ID不能为空')
      }
      const response = await api.post(`/users/${userId}/sync`, data)
      return response
    } catch (error) {
      console.error('同步客户端数据失败:', error.message || error)
      throw error
    }
  },
  
  // 发送验证码
  async sendVerificationCode(phone) {
    try {
      const response = await api.post('/auth/send-code', { phone })
      return response
    } catch (error) {
      console.error('发送验证码失败:', error)
      throw error
    }
  },
  
  // 手机号验证码登录/注册
  async phoneLogin({ phone, code, username, nickname }) {
    try {
      const response = await api.post('/auth/phone-login', { 
        phone, 
        code,
        username, // 传递用户名
        nickname  // 传递昵称
      })
      return response
    } catch (error) {
      console.error('手机号登录失败:', error)
      throw error
    }
  }
}

export default api