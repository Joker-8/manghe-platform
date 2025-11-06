// API接口工具函数
import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
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
    // 返回一个统一的错误对象，方便上层处理
    return Promise.reject({
      message: error.message || '网络请求失败',
      status: error.response?.status || 0,
      originalError: error
    })
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
      const response = await api.get(`/sync/user/${userId}`)
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
      const response = await api.post(`/sync/user/${userId}`, data)
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
  async phoneLogin({ phone, code }) {
    try {
      const response = await api.post('/auth/phone-login', { phone, code })
      return response
    } catch (error) {
      console.error('手机号登录失败:', error)
      throw error
    }
  }
}

export default api