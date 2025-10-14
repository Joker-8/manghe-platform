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
          <h2 class="brand-title">注册芒盒</h2>
          <p class="brand-subtitle">加入盲盒收藏世界</p>
        </div>

        <!-- 注册方式选项卡 -->
        <div class="login-tabs mb-4">
          <div
              class="tab"
              :class="{ active: activeTab === 'email' }"
              @click="activeTab = 'email'"
          >
            邮箱注册
          </div>
          <div
              class="tab"
              :class="{ active: activeTab === 'phone' }"
              @click="activeTab = 'phone'"
          >
            手机号注册
          </div>
        </div>

        <!-- 邮箱注册表单 -->
        <form @submit.prevent="handleEmailRegister" class="auth-form" v-if="activeTab === 'email'">
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
            <label for="nickname" class="form-label">昵称</label>
            <input
                type="text"
                id="nickname"
                v-model="form.nickname"
                class="form-control glass-input"
                placeholder="请输入昵称"
                :class="{ 'is-invalid': errors.nickname }"
                required
            >
            <div v-if="errors.nickname" class="error-message">{{ errors.nickname }}</div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">邮箱</label>
            <input
                type="email"
                id="email"
                v-model="form.email"
                class="form-control glass-input"
                placeholder="请输入邮箱"
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

        <!-- 手机号注册表单 -->
        <form @submit.prevent="handlePhoneRegister" class="auth-form" v-else-if="activeTab === 'phone'">
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
            <label for="phoneCode" class="form-label">验证码</label>
            <div class="input-group">
              <input
                  type="text"
                  id="phoneCode"
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
                  @click="sendPhoneVerificationCode"
                  :disabled="sendingCode || countdown > 0"
              >
                {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
              </button>
            </div>
            <div v-if="phoneErrors.code" class="error-message">{{ phoneErrors.code }}</div>
            <div v-if="verificationMessage" class="success-message">{{ verificationMessage }}</div>
          </div>

          <div class="form-group">
            <label for="phoneUsername" class="form-label">用户名</label>
            <input
                type="text"
                id="phoneUsername"
                v-model="phoneForm.username"
                class="form-control glass-input"
                placeholder="请设置用户名"
                :class="{ 'is-invalid': phoneErrors.username }"
                required
            >
            <div v-if="phoneErrors.username" class="error-message">{{ phoneErrors.username }}</div>
          </div>
          
          <div class="form-group">
            <label for="phoneNickname" class="form-label">昵称</label>
            <input
                type="text"
                id="phoneNickname"
                v-model="phoneForm.nickname"
                class="form-control glass-input"
                placeholder="请设置昵称"
                :class="{ 'is-invalid': phoneErrors.nickname }"
                required
            >
            <div v-if="phoneErrors.nickname" class="error-message">{{ phoneErrors.nickname }}</div>
          </div>

          <button
              type="submit"
              class="btn btn-primary w-100 auth-btn glass-btn"
              :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ loading ? '注册中...' : '验证码注册' }}
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
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

// 直接导入图片
// 使用public目录下的Logo
const logoImage = '/images/Logo.png'

export default {
  name: 'RegisterPage',
  setup() {
    const router = useRouter()
    const store = useStore()

    const loading = ref(false)
    const imageError = ref(false)
    const activeTab = ref('email') // 'email' 或 'phone'
    const countdown = ref(0)
    const sendingCode = ref(false)
    const verificationMessage = ref('')
    const countdownIsActive = ref(false)
    let countdownTimer = null

    const form = reactive({
      username: '',
      nickname: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const phoneForm = reactive({
      phone: '',
      code: '',
      username: '',
      nickname: ''
    })

    const errors = reactive({
      username: '',
      nickname: '',
      email: '',
      password: '',
      confirmPassword: ''
    })

    const phoneErrors = reactive({
      phone: '',
      code: '',
      username: '',
      nickname: ''
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

    // 清理定时器，防止内存泄漏
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

      // 验证用户名
      if (!form.username.trim()) {
        errors.username = '用户名不能为空'
        isValid = false
      } else if (form.username.length < 1) {
        errors.username = '用户名至少1个字符'
        isValid = false
      } else if (form.username.length > 15) {
        errors.username = '用户名最多15个字符'
        isValid = false
      }
      
      // 验证昵称
      if (!form.nickname.trim()) {
        errors.nickname = '昵称不能为空'
        isValid = false
      } else if (form.nickname.length < 2) {
        errors.nickname = '昵称至少2个字符'
        isValid = false
      } else if (form.nickname.length > 30) {
        errors.nickname = '昵称最多30个字符'
        isValid = false
      }

      // 验证邮箱
      if (!form.email.trim()) {
        errors.email = '邮箱不能为空'
        isValid = false
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.email)) {
          errors.email = '请输入有效的邮箱地址'
          isValid = false
        }
      }

      // 验证密码
      if (!form.password) {
        errors.password = '密码不能为空'
        isValid = false
      } else if (form.password.length < 6) {
        errors.password = '密码至少6个字符'
        isValid = false
      }

      // 验证确认密码
      if (!form.confirmPassword) {
        errors.confirmPassword = '请确认密码'
        isValid = false
      } else if (form.confirmPassword !== form.password) {
        errors.confirmPassword = '两次输入的密码不一致'
        isValid = false
      }

      return isValid
    }

    const validatePhoneForm = () => {
      let isValid = true

      Object.keys(phoneErrors).forEach(key => phoneErrors[key] = '')

      // 验证手机号
      if (!phoneForm.phone) {
        phoneErrors.phone = '请输入手机号码'
        isValid = false
      } else if (!isValidPhone(phoneForm.phone)) {
        phoneErrors.phone = '请输入有效的手机号码'
        isValid = false
      }

      // 验证验证码
      if (!phoneForm.code) {
        phoneErrors.code = '请输入验证码'
        isValid = false
      } else if (!/^\d{6}$/.test(phoneForm.code)) {
        phoneErrors.code = '验证码格式不正确'
        isValid = false
      }

      // 验证用户名
      if (!phoneForm.username.trim()) {
        phoneErrors.username = '用户名不能为空'
        isValid = false
      } else if (phoneForm.username.length < 1) {
        phoneErrors.username = '用户名至少1个字符'
        isValid = false
      } else if (phoneForm.username.length > 15) {
        phoneErrors.username = '用户名最多15个字符'
        isValid = false
      }
      
      // 验证昵称
      if (!phoneForm.nickname.trim()) {
        phoneErrors.nickname = '昵称不能为空'
        isValid = false
      } else if (phoneForm.nickname.length < 2) {
        phoneErrors.nickname = '昵称至少2个字符'
        isValid = false
      } else if (phoneForm.nickname.length > 30) {
        phoneErrors.nickname = '昵称最多30个字符'
        isValid = false
      }

      return isValid
    }

    const handleEmailRegister = async () => {
      // 先清空之前的错误
      errors.username = ''
      
      if (!validateForm()) return

      loading.value = true

      try {
        const userData = {
          username: form.username,
          nickname: form.nickname,
          email: form.email,
          password: form.password
        }

        const result = await store.dispatch('register', userData)

        if (result.success) {
          alert('注册成功！')
          router.push('/')
        } else {
          // 检查是否是用户名相关的错误
          if (result.message && result.message.includes('用户名')) {
            errors.username = result.message
          } else {
            alert(result.message || '注册失败，请重试')
          }
        }
      } catch (error) {
        console.error('注册错误:', error)
        // 显示后端返回的具体错误信息
        if (error.message && error.message.includes('用户名')) {
          errors.username = error.message
        } else {
          // 显示更详细的错误信息
          alert(`注册失败: ${error.message || '请稍后重试'}`)
        }
      } finally {
        loading.value = false
      }
    }

    const sendPhoneVerificationCode = async () => {
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

    const handlePhoneRegister = async () => {
      // 先清空之前的错误
      phoneErrors.username = ''
      
      if (!validatePhoneForm()) return

      loading.value = true

      try {
        // 使用手机号验证码登录接口（自动注册功能）
        const result = await store.dispatch('phoneLogin', {
          phone: phoneForm.phone,
          code: phoneForm.code,
          username: phoneForm.username,
          nickname: phoneForm.nickname
        })

        if (result.success) {
          alert('注册成功！')
          router.push('/')
        } else {
          // 检查是否是用户名相关的错误
          if (result.message && result.message.includes('用户名')) {
            phoneErrors.username = result.message
          } else {
            alert(result.message || '注册失败，请重试')
          }
        }
      } catch (error) {
        console.error('手机号注册错误:', error)
        // 显示后端返回的具体错误信息
        if (error.message && error.message.includes('用户名')) {
          phoneErrors.username = error.message
        } else {
          // 显示更详细的错误信息
          alert(`注册失败: ${error.message || '请稍后重试'}`)
        }
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
      countdownIsActive,
      sendingCode,
      verificationMessage,
      handleImageError,
      handleEmailRegister,
      sendPhoneVerificationCode,
      handlePhoneRegister
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

/* 选项卡样式 */
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

/* 输入组样式 */
.input-group {
  display: flex;
  gap: 10px;
}

.input-group .glass-input {
  flex: 1;
}

/* 成功消息样式 */
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