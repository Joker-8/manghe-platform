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

        <!-- 数据同步设置 -->
        <div v-if="activeTab === 'sync'" class="card">
          <div class="card-header">
            <h5 class="mb-0">数据同步</h5>
          </div>
          <div class="card-body">
            <div class="sync-status mb-4 p-4 bg-light rounded">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h6>同步状态</h6>
                <span class="badge bg-success" v-if="syncStatus.enabled">已启用</span>
                <span class="badge bg-danger" v-else>未启用</span>
              </div>
              <p class="text-muted small mb-1">上次同步时间: {{ syncStatus.lastSyncTime || '从未同步' }}</p>
              <p class="text-muted small">当前数据版本: {{ syncStatus.version || 0 }}</p>
            </div>

            <div class="sync-actions mb-4">
              <button class="btn btn-primary me-2" @click="syncNow" :disabled="syncLoading">
                <span v-if="syncLoading" class="spinner-border spinner-border-sm me-2"></span>
                立即同步
              </button>
              <button class="btn btn-outline-primary me-2" @click="forceSyncFromServer" :disabled="syncLoading">
                从服务器获取最新数据
              </button>
            </div>

            <div class="sync-settings mb-4">
              <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" v-model="syncSettings.autoSync">
                <label class="form-check-label">
                  <strong>自动同步</strong>
                  <p class="text-muted small mb-0">定期自动同步数据到服务器</p>
                </label>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">同步频率</label>
                <select class="form-control" v-model="syncSettings.syncInterval" :disabled="!syncSettings.autoSync">
                  <option value="60000">1分钟</option>
                  <option value="300000">5分钟</option>
                  <option value="600000">10分钟</option>
                </select>
              </div>
            </div>

            <div class="text-end mt-4">
              <button class="btn btn-primary" @click="saveSyncSettings">
                保存设置
              </button>
            </div>
          </div>
        </div>

        <!-- 账号管理 -->
        <div v-if="activeTab === 'account'" class="card">
          <div class="card-header">
            <h5 class="mb-0">账号管理</h5>
          </div>
          <div class="card-body">
            <div class="account-item mb-4 p-4 bg-light rounded">
              <h6 class="text-danger mb-3">账号注销</h6>
              <p class="text-muted mb-4">
                注销账号将导致您的所有数据被删除，包括但不限于：收藏、订单历史、个人信息等。
                注销后，您将无法恢复账号及相关数据。
              </p>
              <button class="btn btn-danger" @click="showDeleteConfirm = true">
                <i class="bi bi-exclamation-triangle me-1"></i>申请注销账号
              </button>
            </div>

            <div v-if="deleteStatus" class="account-status mb-4 p-4 bg-info bg-opacity-10 rounded">
              <h6 class="mb-2">注销申请状态</h6>
              <p class="text-muted mb-2">您的账号已提交注销申请，将在一周后正式注销。</p>
              <p class="text-muted">
                注销时间: {{ formatDate(deleteStatus.scheduledTime) }}<br>
                <span class="text-primary cursor-pointer" @click="cancelDeleteRequest">点击取消注销申请</span>
              </p>
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

    <!-- 账号注销确认模态框 -->
    <div v-if="showDeleteConfirm" class="modal fade show d-block" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title text-danger">确认注销账号</h5>
            <button type="button" class="btn-close" @click="showDeleteConfirm = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger mb-4">
              <h6 class="mb-2">⚠️ 注销警告</h6>
              <ul class="mb-0">
                <li>注销账号后，您的所有数据将被永久删除</li>
                <li>账号注销将设置7天冷静期</li>
                <li>冷静期内您可以取消注销申请</li>
                <li>冷静期结束后账号将被彻底删除</li>
              </ul>
            </div>
            
            <div class="mb-3">
              <label class="form-label">请输入"确认注销"以继续</label>
              <input 
                type="text" 
                class="form-control" 
                v-model="confirmText" 
                placeholder="请输入'确认注销'"
                :class="{ 'is-invalid': confirmText && confirmText !== '确认注销' }"
              >
              <div v-if="confirmText && confirmText !== '确认注销'" class="invalid-feedback">
                请正确输入"确认注销"
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteConfirm = false">取消</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="submitDeleteRequest"
              :disabled="confirmText !== '确认注销' || deletingAccount"
            >
              <span v-if="deletingAccount" class="spinner-border spinner-border-sm me-2"></span>
              确认注销账号
            </button>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
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
      { id: 'privacy', name: '隐私设置', icon: 'bi-eye' },
      { id: 'sync', name: '数据同步', icon: 'bi-cloud-sync' },
      { id: 'account', name: '账号管理', icon: 'bi-gear' }
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

    const syncSettings = reactive({
      autoSync: true,
      syncInterval: 60000 // 1分钟
    })

    const syncStatus = reactive({
      enabled: true,
      lastSyncTime: '',
      version: 0
    })

    const syncLoading = ref(false)
    const showDeleteConfirm = ref(false)
    const confirmText = ref('')
    const deletingAccount = ref(false)
    const deleteStatus = ref(null)

    const syncNow = async () => {
      if (!store.state.user) return
      
      syncLoading.value = true
      try {
        await store.dispatch('syncToServer', store.state.user.id)
        updateSyncStatus()
        alert('数据同步成功！')
      } catch (error) {
        console.error('同步失败:', error)
        alert('同步失败，请检查网络连接后重试')
      } finally {
        syncLoading.value = false
      }
    }

    const forceSyncFromServer = async () => {
      if (!store.state.user) return
      
      syncLoading.value = true
      try {
        await store.dispatch('forceSyncFromServer', store.state.user.id)
        updateSyncStatus()
        alert('已成功从服务器获取最新数据！')
      } catch (error) {
        console.error('同步失败:', error)
        alert('获取服务器数据失败，请检查网络连接后重试')
      } finally {
        syncLoading.value = false
      }
    }

    const saveSyncSettings = () => {
      console.log('保存同步设置:', syncSettings)
      alert('同步设置已保存')
      
      // 重启定期同步
      if (syncSettings.autoSync) {
        startPeriodicSync()
      } else {
        stopPeriodicSync()
      }
    }

    const updateSyncStatus = () => {
      syncStatus.lastSyncTime = store.state.lastSyncTime
      syncStatus.version = store.state.syncVersion
    }

    const submitDeleteRequest = async () => {
      if (confirmText.value !== '确认注销') {
        return
      }

      deletingAccount.value = true
      try {
        // 调用后端API提交注销申请
        const response = await fetch(`/api/users/${store.state.user.id}/delete-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${store.state.token}`
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          deleteStatus.value = result.data
          alert('账号注销申请已提交，将在7天后正式注销。您可以在冷静期内随时取消注销。')
          showDeleteConfirm.value = false
          confirmText.value = ''
        } else {
          throw new Error(result.message || '提交注销申请失败')
        }
      } catch (error) {
        console.error('提交注销申请失败:', error)
        alert('提交注销申请失败，请重试')
      } finally {
        deletingAccount.value = false
      }
    }

    const cancelDeleteRequest = async () => {
      if (!confirm('确定要取消账号注销申请吗？')) {
        return
      }
      
      try {
        // 调用后端API取消注销申请
        const response = await fetch(`/api/users/${store.state.user.id}/delete-request`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${store.state.token}`
          }
        })
        
        const result = await response.json()
        
        if (result.success) {
          deleteStatus.value = null
          alert('账号注销申请已取消')
        } else {
          throw new Error(result.message || '取消注销申请失败')
        }
      } catch (error) {
        console.error('取消注销申请失败:', error)
        alert('取消注销申请失败，请重试')
      }
    }

    const fetchDeleteStatus = async () => {
      try {
        const response = await fetch(`/api/users/${store.state.user.id}/delete-status`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${store.state.token}`
          }
        })
        
        const result = await response.json()
        
        if (result.success && result.hasPendingRequest) {
          deleteStatus.value = result.data
        }
      } catch (error) {
        console.error('获取注销状态失败:', error)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    let syncInterval = null
    const startPeriodicSync = () => {
      if (syncInterval) {
        clearInterval(syncInterval)
      }
      
      syncInterval = setInterval(() => {
        if (store.state.user && syncSettings.autoSync) {
          store.dispatch('syncToServer', store.state.user.id).catch(err => {
            console.warn('定期同步失败:', err)
          })
        }
      }, syncSettings.syncInterval)
    }

    const stopPeriodicSync = () => {
      if (syncInterval) {
        clearInterval(syncInterval)
        syncInterval = null
      }
    }

    // 在组件挂载时初始化同步状态和定期同步
    onMounted(() => {
      // 初始化表单数据
      const user = store.state.user
      if (user) {
        form.username = user.username || ''
        form.nickname = user.nickname || user.username || ''
        form.email = user.email || ''
        form.bio = user.bio || ''
        form.avatar = user.avatar || getDefaultAvatar()
        
        // 初始化同步状态
        updateSyncStatus()
        
        // 启动定期同步
        if (syncSettings.autoSync) {
          startPeriodicSync()
        }
        
        // 获取账号注销状态
        if (store.state.token) {
          fetchDeleteStatus()
        }
      }
    })

    // 组件卸载时清理
    onUnmounted(() => {
      stopPeriodicSync()
    })

    return {
      activeTab,
      loading,
      showChangePassword,
      showDevices,
      showDeleteConfirm,
      confirmText,
      deletingAccount,
      deleteStatus,
      tabs,
      form,
      passwordForm,
      notifications,
      privacy,
      handleAvatarUpload,
      updateProfile,
      changePassword,
      saveNotificationSettings,
      savePrivacySettings,
      syncSettings,
      syncStatus,
      syncLoading,
      syncNow,
      forceSyncFromServer,
      saveSyncSettings,
      submitDeleteRequest,
      cancelDeleteRequest,
      formatDate
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

    .cursor-pointer {
      cursor: pointer;
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