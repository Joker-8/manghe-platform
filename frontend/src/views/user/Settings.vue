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
                  <div class="avatar-upload d-flex flex-column items-center">
                    <img :src="form.avatar" class="avatar-preview rounded-circle mb-3" alt="头像" style="width: 150px; height: 150px; object-fit: cover;">
                    <input type="file" ref="avatarInput" @change="handleAvatarUpload" accept="image/*" class="d-none">
                    <button type="button" class="btn btn-outline-primary btn-sm w-50" @click="$refs.avatarInput.click()">
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
                      <input type="text" class="form-control" v-model="form.nickname" required>
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
            <div class="account-item p-4 bg-light rounded">
              <h6 class="mb-3">账号管理</h6>
              <p class="text-muted">
                账号注销功能已移至个人中心页面，您可以在个人资料卡片中找到申请注销账号的选项。
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



    <!-- 图片编辑模态框 -->
    <div v-if="showImageEditor" class="modal fade show d-block" tabindex="-1" @click.self="closeImageEditor" style="display: flex !important; align-items: center; justify-content: center;">
      <div class="modal-dialog modal-xl" role="document" style="margin: 0 auto; min-width: 800px;">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">编辑头像</h5>
            <button type="button" class="btn-close" @click="closeImageEditor"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-8">
                <div class="image-container" style="position: relative; width: 100%; height: 400px; background-color: #f5f5f5;">
                  <img id="image-to-crop" :src="tempImageSrc" alt="编辑图片" style="max-width: 100%; max-height: 100%;">
                </div>
              </div>
              <div class="col-md-4">
                <div class="mb-3 text-center">
                  <h6>预览</h6>
                  <div style="width: 150px; height: 150px; overflow: hidden; border-radius: 50%; margin: 0 auto; border: 1px solid #ddd;">
                    <img :src="tempImageSrc" alt="预览" ref="previewImage" style="width: 100%; height: 100%; object-fit: cover;">
                  </div>
                </div>
                <div class="d-grid gap-2">
                  <button type="button" class="btn btn-outline-secondary" @click="rotateImage(-90)">
                    <i class="bi bi-arrow-counterclockwise"></i> 左旋
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="rotateImage(90)">
                    <i class="bi bi-arrow-clockwise"></i> 右旋
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="zoomImage(0.1)">
                    <i class="bi bi-zoom-in"></i> 放大
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="zoomImage(-0.1)">
                    <i class="bi bi-zoom-out"></i> 缩小
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="flipImage(true)">
                    <i class="bi bi-arrow-left-right"></i> 水平翻转
                  </button>
                  <button type="button" class="btn btn-outline-secondary" @click="resetCropper">
                    <i class="bi bi-arrow-clockwise"></i> 重置
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeImageEditor">取消</button>
            <button type="button" class="btn btn-primary" @click="cropImage">确认使用</button>
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
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import Cropper from 'cropperjs'

export default {
  name: 'SettingsPage',
  setup() {
    const store = useStore()

    const activeTab = ref('profile')
    const loading = ref(false)
    const showChangePassword = ref(false)
    const showDevices = ref(false)
    const showImageEditor = ref(false)
    const cropper = ref(null)
    const tempImageSrc = ref('')
    const previewImage = ref(null)

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
        // 验证文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
          alert('请上传有效的图片文件 (JPG, PNG, GIF, WebP)')
          // 清空文件输入
          event.target.value = ''
          return
        }
        
        // 验证文件大小 (限制为5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          alert('图片大小不能超过5MB')
          // 清空文件输入
          event.target.value = ''
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          tempImageSrc.value = e.target.result
          showImageEditor.value = true
          nextTick(() => {
            // 等待DOM更新后再初始化cropper
            setTimeout(() => {
              initCropper()
            }, 50)
          })
        }
        reader.onerror = (error) => {
          console.error('读取文件失败:', error)
          alert('读取图片文件失败，请重试')
          // 清空文件输入
          event.target.value = ''
        }
        reader.readAsDataURL(file)
      }
    }

    const initCropper = () => {
      console.log('开始初始化Cropper...')
      try {
        // 确保cropper库已正确加载
        if (typeof Cropper !== 'function') {
          console.error('Cropper库未正确加载')
          // 降级使用简单模式
          useFallbackMode()
          return
        }
        
        const image = document.getElementById('image-to-crop')
        if (!image) {
          console.error('找不到图片元素')
          useFallbackMode()
          return
        }
        
        // 确保之前的cropper实例已经销毁
        if (cropper.value) {
          try {
            cropper.value.destroy()
            console.log('旧的Cropper实例已销毁')
          } catch (destroyError) {
            console.error('销毁旧的Cropper实例失败:', destroyError)
          }
          cropper.value = null
        }
        
        // 确保图片完全加载
        if (!image.complete || !image.naturalWidth) {
          console.log('等待图片加载...')
          // 移除可能存在的事件监听器，防止多次绑定
          image.onload = null
          image.onerror = null
          
          image.onload = () => {
            console.log('图片加载完成，现在创建Cropper实例')
            createCropperInstance(image)
          }
          
          image.onerror = () => {
            console.error('图片加载失败')
            useFallbackMode()
          }
          
          // 如果图片已经有src但未加载完成，尝试重新加载
          if (image.src) {
            image.src = image.src
          }
        } else {
          console.log('图片已加载，立即创建Cropper实例')
          createCropperInstance(image)
        }
      } catch (error) {
        console.error('Cropper初始化失败:', error)
        cropper.value = null
        useFallbackMode()
      }
    }
    
    const createCropperInstance = (image) => {
      try {
        // 准备裁剪配置 - 确保正方形裁剪区域
        const cropperOptions = {
          aspectRatio: 1,
          viewMode: 1,
          zoomable: true,
          rotatable: true,
          scalable: true,
          movable: true,
          cropBoxMovable: true,
          cropBoxResizable: true,
          background: true,
          guides: true,
          highlight: true,
          center: true,
          autoCropArea: 0.8,
          checkCrossOrigin: false,
          toggleDragModeOnDblclick: false,
          minCropBoxWidth: 100,
          minCropBoxHeight: 100,
          ready() {
            console.log('Cropper实例初始化完成并准备就绪')
            // 立即更新预览
            updatePreview()
          }
        }
        
        // 创建新实例
        console.log('正在创建Cropper实例...')
        cropper.value = new Cropper(image, cropperOptions)
        console.log('Cropper实例创建成功:', typeof cropper.value)
        
        // 验证实例是否有效
        if (!cropper.value) {
          console.error('创建的Cropper实例无效')
          useFallbackMode()
        } else {
          console.log('Cropper实例功能检测:', {
            rotate: typeof cropper.value.rotate === 'function',
            zoom: typeof cropper.value.zoom === 'function',
            scaleX: typeof cropper.value.scaleX === 'function',
            reset: typeof cropper.value.reset === 'function',
            getCroppedCanvas: typeof cropper.value.getCroppedCanvas === 'function'
          })
        }
      } catch (error) {
        console.error('创建Cropper实例失败:', error)
        cropper.value = null
        useFallbackMode()
      }
    }
    
    // 降级模式 - 当cropper不可用时使用简单模式
    const useFallbackMode = () => {
      console.log('进入降级模式 - 使用简单图片预览')
      // 确保预览图已更新
      if (previewImage.value && tempImageSrc.value) {
        previewImage.value.src = tempImageSrc.value
      }
    }

    // 所有操作都使用try-catch并提供降级方案
    const rotateImage = (degrees) => {
      console.log('尝试旋转图片:', degrees)
      try {
        if (cropper.value && typeof cropper.value.rotate === 'function') {
          cropper.value.rotate(degrees)
          updatePreview()
        } else {
          console.warn('旋转功能不可用，使用原图')
          // 即使没有cropper，预览图仍然应该存在
          if (previewImage.value && tempImageSrc.value) {
            previewImage.value.src = tempImageSrc.value
          }
        }
      } catch (error) {
        console.error('旋转操作失败:', error)
      }
    }

    const zoomImage = (delta) => {
      console.log('尝试缩放图片:', delta)
      try {
        if (cropper.value && typeof cropper.value.zoom === 'function') {
          cropper.value.zoom(delta)
          updatePreview()
        } else {
          console.warn('缩放功能不可用，使用原图')
        }
      } catch (error) {
        console.error('缩放操作失败:', error)
      }
    }

    const flipImage = (horizontal) => {
      console.log('尝试翻转图片，水平方向:', horizontal)
      try {
        if (cropper.value) {
          if (horizontal) {
            if (typeof cropper.value.scaleX === 'function') {
              cropper.value.scaleX(-1)
            } else if (typeof cropper.value.getData === 'function' && typeof cropper.value.setData === 'function') {
              const data = cropper.value.getData()
              data.scaleX = data.scaleX ? -data.scaleX : -1
              cropper.value.setData(data)
            }
          }
          updatePreview()
        } else {
          console.warn('翻转功能不可用，使用原图')
        }
      } catch (error) {
        console.error('翻转操作失败:', error)
      }
    }

    const resetCropper = () => {
      console.log('尝试重置cropper')
      try {
        if (cropper.value) {
          if (typeof cropper.value.reset === 'function') {
            cropper.value.reset()
            updatePreview()
          } else {
            console.warn('重置功能不可用，重新初始化')
            initCropper()
          }
        } else {
          console.warn('没有cropper实例，重新初始化')
          initCropper()
        }
      } catch (error) {
        console.error('重置操作失败:', error)
      }
    }

    const closeImageEditor = () => {
      console.log('关闭图片编辑器，清理资源')
      try {
        if (cropper.value) {
          try {
            cropper.value.destroy()
          } catch (destroyError) {
            console.error('销毁Cropper实例失败:', destroyError)
          }
        }
      } finally {
        // 确保清理所有引用
        cropper.value = null
        showImageEditor.value = false
        tempImageSrc.value = ''
        // 清空文件输入
        const avatarInput = document.querySelector('input[type="file"]')
        if (avatarInput) {
          avatarInput.value = ''
        }
      }
    }
    
    const updatePreview = () => {
      console.log('更新预览图')
      try {
        if (cropper.value && typeof cropper.value.getCroppedCanvas === 'function' && previewImage.value) {
          const canvas = cropper.value.getCroppedCanvas({
            width: 150,
            height: 150
          })
          previewImage.value.src = canvas.toDataURL('image/jpeg')
        } else if (previewImage.value && tempImageSrc.value) {
          // 降级：直接使用原图作为预览
          console.log('使用原图作为预览')
          previewImage.value.src = tempImageSrc.value
        }
      } catch (error) {
        console.error('更新预览失败:', error)
        // 确保预览图至少显示原图
        if (previewImage.value && tempImageSrc.value) {
          previewImage.value.src = tempImageSrc.value
        }
      }
    }
    
    const cropImage = () => {
      console.log('尝试处理图片')
      try {
        if (cropper.value && typeof cropper.value.getCroppedCanvas === 'function') {
          // 尝试裁剪图片
          try {
            const canvas = cropper.value.getCroppedCanvas({
              width: 300,
              height: 300,
              fillColor: '#fff',
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high'
            })
            form.avatar = canvas.toDataURL('image/jpeg', 0.9)
            console.log('图片裁剪成功')
          } catch (cropError) {
            console.error('裁剪操作失败，使用降级方案:', cropError)
            // 降级：直接使用原图
            if (tempImageSrc.value) {
              form.avatar = tempImageSrc.value
              console.log('使用原图作为头像')
            }
          }
        } else {
          console.log('没有可用的裁剪功能，直接使用原图')
          // 降级：直接使用原图
          if (tempImageSrc.value) {
            form.avatar = tempImageSrc.value
          }
        }
        
        // 无论成功与否，都关闭编辑器
        closeImageEditor()
        alert('头像更新成功')
      } catch (error) {
        console.error('处理图片时发生错误:', error)
        alert('处理图片失败，请重试')
        closeImageEditor()
      }
    }

    const updateProfile = async () => {
      // 数据验证
      if (!form.username.trim()) {
        alert('用户名不能为空')
        return
      }
      
      if (!form.email.trim()) {
        alert('邮箱不能为空')
        return
      }
      
      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email)) {
        alert('请输入有效的邮箱地址')
        return
      }

      loading.value = true
      try {
        // 检查是否包含头像数据(base64格式)
        const hasNewAvatar = form.avatar && form.avatar.startsWith('data:image/')
        let avatarUrl = form.avatar
        
        // 先尝试调用后端API更新数据
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004/api'
        
        // 准备更新数据，添加最后修改时间戳
        const updateData = {
          username: form.username,
          nickname: form.nickname,
          email: form.email,
          bio: form.bio,
          updated_at: new Date().toISOString()
        }
        
        // 如果有新头像，考虑将其作为单独字段处理
        if (hasNewAvatar) {
          updateData.avatar = form.avatar
        }
        
        let response
        try {
          response = await fetch(`${apiBaseUrl}/users/${store.state.user.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${store.state.token}`
            },
            body: JSON.stringify(updateData)
          })
          
          // 检查响应状态
          if (!response.ok) {
            throw new Error(`API错误: ${response.status}`)
          }
          
          // 安全解析响应
          const responseData = await response.json()
          if (responseData.success) {
            console.log('用户资料已成功更新到服务器:', responseData.data)
            // 如果服务器返回了新的头像URL，使用它
            if (responseData.data && responseData.data.avatar) {
              avatarUrl = responseData.data.avatar
            }
          } else {
            throw new Error(responseData.message || '更新失败')
          }
        } catch (apiError) {
          console.warn('API调用失败，将在网络恢复时通过同步机制更新:', apiError)
          // 不抛出错误，继续本地更新
        }
        
        // 更新Vuex store中的用户信息
        const updatedUser = {
          ...store.state.user,
          username: form.username,
          nickname: form.nickname,
          email: form.email,
          bio: form.bio,
          avatar: avatarUrl
        }
        store.commit('SET_USER', updatedUser)
        
        // 更新本地存储，确保离线可用性
        localStorage.setItem('user', JSON.stringify(updatedUser))
        
        // 触发数据同步，确保跨设备一致性
        if (store.state.user) {
          await store.dispatch('syncToServer', store.state.user.id)
        }
        
        alert('资料更新成功！')
      } catch (error) {
        console.error('更新失败:', error)
        alert(`更新失败: ${error.message || '请重试'}`)
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
      // 检查sessionStorage中是否有指定的活动标签页
      const storedTab = sessionStorage.getItem('activeTab')
      if (storedTab && tabs.find(tab => tab.id === storedTab)) {
        activeTab.value = storedTab
        // 清除存储的标签页，避免下次访问时自动切换
        sessionStorage.removeItem('activeTab')
      }
      
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
      showImageEditor,
      tempImageSrc,
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
      // 图片编辑相关方法
      rotateImage,
      zoomImage,
      flipImage,
      resetCropper,
      closeImageEditor,
      cropImage
    }
  }
}
</script>

<style scoped>
/* 头像编辑器相关样式 */
.avatar-preview {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px; /* 设置头像和按钮之间的间距 */
}

.avatar-upload .btn {
  transition: all 0.3s ease;
}

.avatar-upload .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.image-container {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #f5f5f5;
  overflow: hidden;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

/* 确保cropperjs容器样式正确 */
.cropper-container {
  width: 100% !important;
  height: 100% !important;
}

.cropper-view-box,
.cropper-face {
  border-radius: 50%;
}

.cropper-view-box {
  box-shadow: 0 0 0 1px #39f;
  outline: none;
}

.cropper-line {
  background-color: #39f;
}

.cropper-point {
  background-color: #39f;
}

/* 原有样式 */
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

  .avatar-upload .btn {
    width: 60%;
  }

  .security-item, .notification-item, .privacy-item {
    padding: 1rem;
  }
}
</style>