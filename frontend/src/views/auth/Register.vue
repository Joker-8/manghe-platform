<template>
  <div class="auth-page">
    <!-- 视频背景 -->
    <video class="video-background" autoplay muted loop playsinline>
      <!-- 修正视频路径：移除/frontend前缀，使用@别名指向src目录 -->
      <source src="@/assets/videos/auth-bg.mp4" type="video/mp4">
      <!-- 若视频加载失败，显示备用图片 -->
      <img src="@/assets/images/auth-bg-fallback.jpg" alt="认证页面背景">
    </video>

    <div class="auth-container">
      <div class="auth-card glass-effect">
        <!-- 品牌标识 -->
        <div class="brand-header text-center mb-4">
          <img
              :src="logoImage"
              alt="芒盒"
              class="brand-logo"
              @error="handleImageError"
          >
          <h2 class="brand-title">注册芒盒</h2>
          <p class="brand-subtitle">开启你的盲盒收藏之旅</p>
        </div>

        <!-- 注册表单 -->
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="username" class="form-label">用户名</label>
            <input
                type="text"
                id="username"
                v-model="form.username"
                class="form-control glass-input"
                placeholder="请输入用户名"
                :class="{ 'is-invalid': errors.username }"
                required
            >
            <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <input
                type="email"
                id="email"
                v-model="form.email"
                class="form-control glass-input"
                placeholder="请输入邮箱地址"
                :class="{ 'is-invalid': errors.email }"
                required
            >
            <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">密码</label>
            <input
                type="password"
                id="password"
                v-model="form.password"
                class="form-control glass-input"
                placeholder="请输入密码"
                :class="{ 'is-invalid': errors.password }"
                required
            >
            <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">确认密码</label>
            <input
                type="password"
                id="confirmPassword"
                v-model="form.confirmPassword"
                class="form-control glass-input"
                placeholder="请再次输入密码"
                :class="{ 'is-invalid': errors.confirmPassword }"
                required
            >
            <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
          </div>

          <button
              type="submit"
              class="btn btn-primary w-100 auth-btn glass-btn"
              :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? '注册中...' : '立即注册' }}
          </button>
        </form>

        <!-- 底部链接 -->
        <div class="auth-footer text-center mt-4">
          <p class="mb-0">
            已有账号？
            <router-link to="/login" class="auth-link">立即登录</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

// 直接导入图片
import logoImage from '@/assets/images/Logo.png'

export default {
  name: 'RegisterPage',
  setup() {
    const router = useRouter()
    const store = useStore()

    const loading = ref(false)
    const imageError = ref(false)

    const form = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const errors = reactive({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const handleImageError = () => {
      console.error('Logo图片加载失败')
      imageError.value = true
    }

    const validateForm = () => {
      let isValid = true

      Object.keys(errors).forEach(key => errors[key] = '')

      if (!form.username.trim()) {
        errors.username = '用户名不能为空'
        isValid = false
      } else if (form.username.length < 3) {
        errors.username = '用户名至少3个字符'
        isValid = false
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!form.email.trim()) {
        errors.email = '邮箱不能为空'
        isValid = false
      } else if (!emailRegex.test(form.email)) {
        errors.email = '请输入有效的邮箱地址'
        isValid = false
      }

      if (!form.password) {
        errors.password = '密码不能为空'
        isValid = false
      } else if (form.password.length < 6) {
        errors.password = '密码至少6个字符'
        isValid = false
      }

      if (!form.confirmPassword) {
        errors.confirmPassword = '请确认密码'
        isValid = false
      } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }

      return isValid
    }

    const handleRegister = async () => {
      if (!validateForm()) return

      loading.value = true

      try {
        const userData = {
          username: form.username,
          email: form.email,
          password: form.password
        }

        const result = await store.dispatch('register', userData)

        if (result.success) {
          alert('注册成功！')
          router.push('/')
        } else {
          alert(result.message || '注册失败，请重试')
        }
      } catch (error) {
        console.error('注册错误:', error)
        alert('注册失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      errors,
      loading,
      logoImage,
      imageError,
      handleImageError,
      handleRegister
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.auth-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  z-index: 1;
  padding: 0 20px;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.auth-card {
  padding: 40px;
  border-radius: 20px;
  width: 100%;
}

.brand-header {
  margin-bottom: 2rem;
}

.brand-logo {
  height: 60px;
  width: auto;
  object-fit: contain;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.brand-title {
  color: white;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.glass-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  color: white;
  backdrop-filter: blur(10px);
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow:
      0 0 0 3px rgba(255, 255, 255, 0.1),
      inset 0 1px 2px rgba(255, 255, 255, 0.1);
  outline: none;
  color: white;
}

.glass-input.is-invalid {
  border-color: rgba(220, 53, 69, 0.7);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.error-message {
  color: #ff6b6b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.glass-btn {
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg,
  rgba(107, 33, 168, 0.8),
  rgba(236, 72, 153, 0.8));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  color: white;
  position: relative;
  overflow: hidden;
}

.glass-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
  transparent,
  rgba(255, 255, 255, 0.2),
  transparent);
  transition: left 0.5s;
}

.glass-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
      0 8px 25px rgba(107, 33, 168, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.glass-btn:hover::before {
  left: 100%;
}

.glass-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.auth-footer {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.auth-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.auth-link:hover {
  color: white;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 576px) {
  .auth-card {
    padding: 30px 20px;
  }

  .auth-container {
    padding: 0 15px;
  }

  .brand-logo {
    height: 50px;
  }
}

.video-background img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}
</style>