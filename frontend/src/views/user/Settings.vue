<template>
  <div class="settings-page container mt-4">
    <div class="row">
      <div class="col-lg-3 mb-4">
        <!-- 设置导航 -->
        <div class="card">
          <div class="card-body">
            <h6 class="card-title mb-3">账户设置</h6>
            <div class="nav flex-column">
              <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="nav-link text-start"
                  :class="{ active: activeTab === tab.id }"
                  @click="activeTab = tab.id"
              >
                <i :class="['bi', tab.icon, 'me-2']"></i>
                {{ tab.name }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-9">
        <!-- 基本信息 -->
        <div v-if="activeTab === 'profile'" class="card">
          <div class="card-header">
            <h5 class="mb-0">基本信息</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="updateProfile">
              <div class="row">
                <div class="col-md-4 text-center mb-4">
                  <div class="avatar-upload">
                    <img :src="form.avatar" class="avatar-preview rounded-circle mb-3" alt="头像">
                    <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" class="d-none">
                    <button type="button" class="btn btn-outline-primary btn-sm" @click="$refs.avatarInput.click()">
                      <i class="bi bi-camera me-1"></i>更换头像
                    </button>
                  </div>
                </div>
                <div class="col-md-8">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">用户名</label>
                      <input type="text" class="form-control" v-model="form.username" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">昵称</label>
                      <input type="text" class="form-control" v-model="form.nickname">
                    </div>
                    <div class="col-12">
                      <label class="form-label">邮箱</label>
                      <input type="email" class="form-control" v-model="form.email" required>
                    </div>
                    <div class="col-12">
                      <label class="form-label">个性签名</label>
                      <textarea class="form-control" v-model="form.bio" rows="3" placeholder="介绍一下自己..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-end mt-4">
                <button type="submit" class="btn btn-primary" :disabled="loading">
                  <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                  保存更改
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- 安全设置 -->
        <div v-if="activeTab === 'security'" class="card">
          <div class="card-header">
            <h5 class="mb-0">安全设置</h5>
          </div>
          <div class="card-body">
            <div class="security-item mb-4">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">修改密码</h6>
                  <p class="text-muted small mb-0">定期修改密码可以提高账户安全性</p>
                </div>
                <button class="btn btn-outline-primary" @click="showChangePassword = true">
                  修改
                </button>
              </div>
            </div>

            <div class="security-item">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h6 class="mb-1">登录设备</h6>
                  <p class="text-muted small mb-0">管理已登录的设备</p>
                </div>
                <button class="btn btn-outline-primary" @click="showDevices = true">
                  查看
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-if="activeTab === 'notifications'" class="card">
          <div class="card-header">
            <h5 class="mb-0">通知设置</h5>
          </div>
          <div class="card-body">
            <div class="notification-item mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="notifications.email">
                <label class="form-check-label">
                  <strong>邮件通知</strong>
                  <p class="text-muted small mb-0">接收订单状态、活动推广等邮件通知</p>
                </label>
              </div>
            </div>

            <div class="notification-item mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="notifications.push">
                <label class="form-check-label">
                  <strong>推送通知</strong>
                  <p class="text-muted small mb-0">接收新消息、社区互动等推送通知</p>
                </label>
              </div>
            </div>

            <div class="notification-item mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="notifications.sms">
                <label class="form-check-label">
                  <strong>短信通知</strong>
                  <p class="text-muted small mb-0">接收重要订单和账户安全短信</p>
                </label>
              </div>
            </div>

            <div class="text-end mt-4">
              <button class="btn btn-primary" @click="saveNotificationSettings">
                保存设置
              </button>
            </div>
          </div>
        </div>

        <!-- 隐私设置 -->
        <div v-if="activeTab === 'privacy'" class="card">
          <div class="card-header">
            <h5 class="mb-0">隐私设置</h5>
          </div>
          <div class="card-body">
            <div class="privacy-item mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="privacy.showProfile">
                <label class="form-check-label">
                  <strong>公开个人资料</strong>
                  <p class="text-muted small mb-0">允许其他用户查看我的个人资料和收藏</p>
                </label>
              </div>
            </div>

            <div class="privacy-item mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="privacy.showCollections">
                <label class="form-check-label">
                  <strong>公开收藏</strong>
                  <p class="text-muted small mb-0">允许其他用户查看我的收藏馆</p>
                </label>
              </div>
            </div>

            <div class="privacy-item mb-3">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" v-model="privacy.allowMessages">
                <label class="form-check-label">
                  <strong>接收私信</strong>
                  <p class="text-muted small mb-0">允许其他用户给我发送私信</p>
                </label>
              </div>
            </div>

            <div class="text-end mt-4">
              <button class="btn btn-primary" @click="savePrivacySettings">
                保存设置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码模态框 -->
    <div v-if="showChangePassword" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">修改密码</h5>
            <button type="button" class="btn-close" @click="showChangePassword = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="changePassword">
              <div class="mb-3">
                <label class="form-label">当前密码</label>
                <input type="password" class="form-control" v-model="passwordForm.currentPassword" required>
              </div>
              <div class="mb-3">
                <label class="form-label">新密码</label>
                <input type="password" class="form-control" v-model="passwordForm.newPassword" required>
              </div>
              <div class="mb-3">
                <label class="form-label">确认新密码</label>
                <input type="password" class="form-control" v-model="passwordForm.confirmPassword" required>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showChangePassword = false">取消</button>
            <button type="button" class="btn btn-primary" @click="changePassword">确认修改</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SettingsPage',
  setup() {
    const store = useStore()

    const activeTab = ref('profile')
    const loading = ref(false)
    const showChangePassword = ref(false)
    const showDevices = ref(false)

    const tabs = [
      { id: 'profile', name: '基本信息', icon: 'bi-person' },
      { id: 'security', name: '安全设置', icon: 'bi-shield-lock' },
      { id: 'notifications', name: '通知设置', icon: 'bi-bell' },
      { id: 'privacy', name: '隐私设置', icon: 'bi-eye' }
    ]

    const form = reactive({
      username: '',
      nickname: '',
      email: '',
      bio: '',
      avatar: ''
    })

    const passwordForm = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const notifications = reactive({
      email: true,
      push: true,
      sms: false
    })

    const privacy = reactive({
      showProfile: true,
      showCollections: true,
      allowMessages: true
    })

    // 获取默认头像
    const getDefaultAvatar = () => {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTE2IDE3QzE4LjIwOTEgMTcgMjAgMTUuMjA5MSAyMCAxM0MyMCAxMC43OTA5IDE4LjIwOTEgOSAxNiA5QzEzLjc5MDkgOSAxMiAxMC43OTA5IDEyIDEzQzEyIDE1LjIwOTEgMTMuNzkwOSAxNyAxNiAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAxOEMxMS41ODIyIDE4IDggMjAuNjg2MyA4IDI0SDE2SDI0QzI0IDIwLjY4NjMgMjAuNDE3OCAxOCAxNiAxOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
    }

    const handleAvatarUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          form.avatar = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const updateProfile = async () => {
      loading.value = true
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('更新资料:', form)
        alert('资料更新成功！')
      } catch (error) {
        console.error('更新失败:', error)
        alert('更新失败，请重试')
      } finally {
        loading.value = false
      }
    }

    const changePassword = async () => {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        alert('两次输入的密码不一致')
        return
      }

      if (passwordForm.newPassword.length < 6) {
        alert('密码至少6位')
        return
      }

      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('修改密码:', passwordForm)
        showChangePassword.value = false
        alert('密码修改成功！')

        // 清空表单
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } catch (error) {
        console.error('修改密码失败:', error)
        alert('修改失败，请重试')
      }
    }

    const saveNotificationSettings = () => {
      console.log('保存通知设置:', notifications)
      alert('通知设置已保存')
    }

    const savePrivacySettings = () => {
      console.log('保存隐私设置:', privacy)
      alert('隐私设置已保存')
    }

    onMounted(() => {
      // 初始化表单数据
      const user = store.state.user
      if (user) {
        form.username = user.username || ''
        form.nickname = user.nickname || user.username || ''
        form.email = user.email || ''
        form.bio = user.bio || ''
        form.avatar = user.avatar || getDefaultAvatar()
      }
    })

    return {
      activeTab,
      loading,
      showChangePassword,
      showDevices,
      tabs,
      form,
      passwordForm,
      notifications,
      privacy,
      handleAvatarUpload,
      updateProfile,
      changePassword,
      saveNotificationSettings,
      savePrivacySettings
    }
  }
}
</script>

<style scoped>
.settings-page .nav-link {
  color: #6c757d;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.settings-page .nav-link.active {
  background: var(--primary-purple);
  color: white;
}

.settings-page .nav-link:hover:not(.active) {
  background: #f8f9fa;
  color: var(--primary-purple);
}

.avatar-upload {
  position: relative;
}

.avatar-preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border: 3px solid var(--primary-purple);
}

.security-item, .notification-item, .privacy-item {
  padding: 1.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.security-item:hover, .notification-item:hover, .privacy-item:hover {
  border-color: var(--primary-purple);
  box-shadow: 0 2px 8px rgba(107, 33, 168, 0.1);
}

.form-check-input:checked {
  background-color: var(--primary-purple);
  border-color: var(--primary-purple);
}

.modal {
  background: rgba(0, 0, 0, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .avatar-preview {
    width: 100px;
    height: 100px;
  }

  .security-item, .notification-item, .privacy-item {
    padding: 1rem;
  }
}
</style>