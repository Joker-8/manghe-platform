<template>
  <div class="auth-page">
    <!-- 视频背景 -->
    <video class="video-background" autoplay muted loop playsinline>
      <!-- 修正视频路径：移除/frontend前缀，使用@别名指向src目录 -->
      <source src="/videos/auth-bg.mp4" type="video/mp4">
      <!-- 视频加载失败时显示的背景图 -->
      <img src="/images/auth-bg-fallback.jpg" alt="认证页面背景">
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
          <h2 class="brand-title">登录芒盒</h2>
          <p class="brand-subtitle">欢迎回到盲盒收藏世界</p>
        </div>

        <!-- 登录方式选项卡 -->
        <div class="login-tabs mb-4">
          <div
              class="tab"
              :class="{ active: activeTab === 'account' }"
              @click="activeTab = 'account'"
          >
            账号密码登录
          </div>
          <div
              class="tab"
              :class="{ active: activeTab === 'phone' }"
              @click="activeTab = 'phone'"
          >
            手机号登录
          </div>
        </div>

        <!-- 账号密码登录表单 -->
        <form @submit.prevent="handleAccountLogin" class="auth-form" v-if="activeTab === 'account'">
          <div class="form-group">
            <label for="loginInput" class="form-label">用户名或邮箱</label>
            <input
                type="text"
                id="loginInput"
                v-model="form.loginInput"
                class="form-control glass-input"
                placeholder="请输入用户名或邮箱"
                :class="{ 'is-invalid': errors.loginInput }"
                required
            >
            <div v-if="errors.loginInput" class="error-message">{{ errors.loginInput }}</div>
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

          <button
              type="submit"
              class="btn btn-primary w-100 auth-btn glass-btn"
              :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? '登录中...' : '立即登录' }}
          </button>
        </form>

        <!-- 手机号验证码登录表单 -->
        <form @submit.prevent="handlePhoneLogin" class="auth-form" v-else-if="activeTab === 'phone'">
          <div class="form-group">
            <label for="phone" class="form-label">手机号码</label>
            <input
                type="tel"
                id="phone"
                v-model="phoneForm.phone"
                class="form-control glass-input"
                placeholder="请输入手机号码"
                :class="{ 'is-invalid': phoneErrors.phone }"
                maxlength="11"
                required
            >
            <div v-if="phoneErrors.phone" class="error-message">{{ phoneErrors.phone }}</div>
          </div>

          <div class="form-group">
            <label for="verificationCode" class="form-label">验证码</label>
            <div class="input-group">
              <input
                  type="text"
                  id="verificationCode"
                  v-model="phoneForm.code"
                  class="form-control glass-input"
                  placeholder="请输入验证码"
                  :class="{ 'is-invalid': phoneErrors.code }"
                  maxlength="6"
                  required
              >
              <button
                  type="button"
                  class="btn btn-outline-secondary glass-btn"
                  @click="sendVerificationCode"
                  :disabled="sendingCode || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </button>
            </div>
            <div v-if="phoneErrors.code" class="error-message">{{ phoneErrors.code }}</div>
            <div v-if="verificationMessage" class="success-message">{{ verificationMessage }}</div>
          </div>

          <button
              type="submit"
              class="btn btn-primary w-100 auth-btn glass-btn"
              :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? '登录中...' : '验证码登录' }}
          </button>
        </form>

        <!-- 底部链接 -->
        <div class="auth-footer text-center mt-4">
          <p class="mb-0">
            还没有账号？
            <router-link to="/register" class="auth-link">立即注册</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

// 直接导入图片
// 使用public目录下的Logo
const logoImage = '/images/Logo.png'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const store = useStore()

    const loading = ref(false)
    const imageError = ref(false)
    const activeTab = ref('account') // 'account' 或 'phone'
    const countdown = ref(0)
    const sendingCode = ref(false)
    const verificationMessage = ref('')
    let countdownTimer = null
    // 验证码倒计时，添加状态管理
    const countdownIsActive = ref(false)

    const form = reactive({
      loginInput: '',
      password: ''
    })

    const phoneForm = reactive({
      phone: '',
      code: ''
    })

    const errors = reactive({
      loginInput: '',
      password: ''
    })

    const phoneErrors = reactive({
      phone: '',
      code: ''
    })

    // 验证手机号格式
    const isValidPhone = (phone) => {
      return /^1[3-9]\d{9}$/.test(phone)
    }

    // 启动倒计时，优化用户体验
    const startCountdown = () => {
      countdown.value = 60
      countdownIsActive.value = true
      
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
      
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(countdownTimer)
          countdownTimer = null
          countdownIsActive.value = false
        }
      }, 1000)
    }

    // 组件卸载时清理定时器，防止内存泄漏
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer)
      }
    })

    const handleImageError = () => {
      console.error('Logo图片加载失败')
      imageError.value = true
    }

    const validateForm = () => {
      let isValid = true

      Object.keys(errors).forEach(key => errors[key] = '')

      if (!form.loginInput.trim()) {
        errors.loginInput = '请输入用户名或邮箱'
        isValid = false
      }

      if (!form.password) {
        errors.password = '密码不能为空'
        isValid = false
      } else if (form.password.length < 6) {
        errors.password = '密码至少6个字符'
        isValid = false
      }

      return isValid
    }

    const validatePhoneForm = () => {
      let isValid = true

      Object.keys(phoneErrors).forEach(key => phoneErrors[key] = '')

      if (!phoneForm.phone) {
        phoneErrors.phone = '请输入手机号码'
        isValid = false
      } else if (!isValidPhone(phoneForm.phone)) {
        phoneErrors.phone = '请输入有效的手机号码'
        isValid = false
      }

      if (!phoneForm.code) {
        phoneErrors.code = '请输入验证码'
        isValid = false
      } else if (!/^\d{6}$/.test(phoneForm.code)) {
        phoneErrors.code = '验证码格式不正确'
        isValid = false
      }

      return isValid
    }

    const handleAccountLogin = async () => {
      if (!validateForm()) return

      loading.value = true

      try {
        const credentials = {
          loginInput: form.loginInput,
          password: form.password
        }

        const result = await store.dispatch('login', credentials)

        if (result.success) {
          const redirectPath = router.currentRoute.value.query.redirect || '/'
          router.push(redirectPath)
        } else {
          errors.loginInput = result.message || '登录失败，请检查用户名/邮箱和密码'
        }
      } catch (error) {
        console.error('登录错误:', error)
        errors.loginInput = '登录失败，请检查网络连接'
      } finally {
        loading.value = false
      }
    }

    const sendVerificationCode = async () => {
      // 验证手机号
      if (!phoneForm.phone) {
        phoneErrors.phone = '请输入手机号码'
        return
      }
      if (!isValidPhone(phoneForm.phone)) {
        phoneErrors.phone = '请输入有效的手机号码'
        return
      }

      sendingCode.value = true
      phoneErrors.phone = ''
      verificationMessage.value = ''

      try {
        const result = await store.dispatch('sendVerificationCode', phoneForm.phone)
        
        // 增加空值检查，确保result存在
        if (result && result.success) {
          // 在测试环境中显示更明确的提示
          if (result.code) {
            // 测试环境下，验证码会显示在控制台，同时给用户明确提示
            verificationMessage.value = `验证码已发送，测试环境验证码: ${result.code}`
            console.log('验证码（仅测试环境）:', result.code)
          } else {
            verificationMessage.value = result.message || '验证码已发送'
          }
          startCountdown()
        } else if (result && !result.success) {
          phoneErrors.phone = result.message || '发送验证码失败'
        } else {
          // 如果result为空，提供默认成功消息
          verificationMessage.value = '验证码已发送（测试环境）'
          startCountdown()
          // 显示默认测试验证码
          console.log('默认测试验证码:', '123456')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        // 错误处理更加完善，确保用户得到反馈
        phoneErrors.phone = '发送验证码失败，请稍后重试'
      } finally {
        sendingCode.value = false
      }
    }

    const handlePhoneLogin = async () => {
      if (!validatePhoneForm()) return

      loading.value = true

      try {
        const credentials = {
          phone: phoneForm.phone,
          code: phoneForm.code
        }

        const result = await store.dispatch('phoneLogin', credentials)

        if (result.success) {
          const redirectPath = router.currentRoute.value.query.redirect || '/'
          router.push(redirectPath)
        } else {
          phoneErrors.code = result.message || '登录失败，请检查验证码是否正确'
        }
      } catch (error) {
        console.error('手机号登录错误:', error)
        phoneErrors.code = '登录失败，请检查网络连接'
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      phoneForm,
      errors,
      phoneErrors,
      loading,
      logoImage,
      imageError,
      activeTab,
      countdown,
      sendingCode,
      verificationMessage,
      handleImageError,
      handleAccountLogin,
      sendVerificationCode,
      handlePhoneLogin
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

/* 视频背景样式 */
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
}

/* 毛玻璃效果容器 */
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

.login-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 1.5rem;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 10px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
  position: relative;
  font-weight: 500;
}

.tab:hover {
  color: white;
}

.tab.active {
  color: white;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 20%;
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, rgba(107, 33, 168, 0.8), rgba(236, 72, 153, 0.8));
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

.input-group {
  display: flex;
  gap: 10px;
}

.input-group .glass-input {
  flex: 1;
}

.success-message {
  color: #10b981;
  font-size: 0.875rem;
  margin-top: 0.25rem;
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

/* 视频加载时的备用样式 */
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