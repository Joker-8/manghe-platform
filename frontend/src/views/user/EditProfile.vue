<template>
  <div class="edit-profile-page container mt-6 mb-10">
    <div class="card">
      <div class="card-header bg-white border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 font-weight-semibold">编辑个人资料</h5>
          <button class="btn btn-sm btn-outline-secondary" @click="goBack">取消</button>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveProfile">
          <!-- 头像上传部分 -->
          <div class="text-center mb-6">
            <div class="avatar-uploader position-relative mx-auto" style="width: 150px; height: 150px;">
              <img :src="editForm.avatar" class="edit-avatar rounded-circle w-100 h-100 object-cover cursor-pointer" alt="头像预览" @click="triggerAvatarUpload">
              <div class="avatar-upload-overlay position-absolute inset-0 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded-circle opacity-0 hover:opacity-100 transition-opacity cursor-pointer" @click="triggerAvatarUpload">
                <span class="text-white"><i class="bi bi-camera me-1"></i>更换头像</span>
              </div>
              <input 
                type="file" 
                class="d-none" 
                accept="image/*" 
                @change="handleAvatarUpload"
                ref="avatarInput"
              >
            </div>
            <p class="text-muted mt-2">支持 JPG、PNG 格式，建议大小不超过 2MB</p>
          </div>
          
          <!-- 头像裁剪模态框 -->
          <div v-if="showCropModal" class="modal fade show d-block" tabindex="-1" aria-labelledby="cropModalLabel">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="cropModalLabel">裁剪头像</h5>
                  <button type="button" class="btn-close" @click="cancelCrop"></button>
                </div>
                <div class="modal-body">
                  <div class="crop-container" ref="cropContainer">
                    <div class="crop-box" ref="cropBox" @mousedown="startDragging">
                      <img ref="cropImage" :src="cropperImageSrc" @mousedown.stop>
                    </div>
                  </div>
                  <div class="mt-3 text-center">
                    <p class="text-muted">拖动图片调整位置，推荐使用正方形区域</p>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="cancelCrop">取消</button>
                  <button type="button" class="btn btn-primary" @click="confirmCrop">确认裁剪</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 个人信息表单 -->
          <div class="form-container mx-auto" style="max-width: 600px;">
            <!-- 昵称 -->
            <div class="mb-4">
              <label for="nickname" class="form-label font-weight-medium">昵称</label>
              <input 
                type="text" 
                class="form-control" 
                id="nickname" 
                v-model="editForm.nickname"
                placeholder="请输入昵称" 
                maxlength="20"
                required
              >
              <small class="text-muted">2-20个字符，可使用中英文、数字</small>
            </div>

            <!-- 邮箱 -->
            <div class="mb-4">
              <label for="email" class="form-label font-weight-medium">邮箱地址</label>
              <input 
                type="email" 
                class="form-control" 
                id="email" 
                v-model="editForm.email"
                placeholder="请输入邮箱地址"
                required
              >
              <small class="text-muted">用于账户安全和通知</small>
            </div>

            <!-- 个人简介 -->
            <div class="mb-4">
              <label for="bio" class="form-label font-weight-medium">个人简介</label>
              <textarea 
                class="form-control" 
                id="bio" 
                v-model="editForm.bio"
                placeholder="介绍一下自己吧"
                rows="4"
                maxlength="100"
              ></textarea>
              <small class="text-muted">最多100个字符</small>
            </div>

            <hr class="my-5">

            <!-- 密码修改部分 -->
            <div class="password-section">
              <h6 class="font-weight-semibold mb-3">修改密码</h6>
              <p class="text-muted mb-4">如需修改密码，请填写以下信息</p>
              
              <!-- 旧密码 -->
              <div class="mb-4">
                <label for="currentPassword" class="form-label">当前密码</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="currentPassword" 
                  v-model="editForm.currentPassword"
                  placeholder="请输入当前密码"
                >
              </div>
              
              <!-- 新密码 -->
              <div class="mb-4">
                <label for="newPassword" class="form-label">新密码</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="newPassword" 
                  v-model="editForm.newPassword"
                  placeholder="请输入新密码"
                >
                <small class="text-muted">密码长度至少8位，包含字母和数字</small>
              </div>
              
              <!-- 确认新密码 -->
              <div class="mb-4">
                <label for="confirmPassword" class="form-label">确认新密码</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="confirmPassword" 
                  v-model="editForm.confirmPassword"
                  placeholder="请再次输入新密码"
                >
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="mt-5 d-flex justify-content-between">
              <button type="button" class="btn btn-outline-secondary" @click="goBack">取消</button>
              <div>
                <button type="button" class="btn btn-outline-danger me-3" @click="confirmDeleteAccount">注销账号</button>
                <button type="button" class="btn btn-primary" @click="saveProfile" :disabled="isSubmitting">
                  {{ isSubmitting ? '保存中...' : '保存更改' }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'EditProfilePage',
  setup() {
    const store = useStore()
    const router = useRouter()
    const avatarInput = ref(null)
    const isSubmitting = ref(false)
    const showCropModal = ref(false)
    const cropperImageSrc = ref('')
    const cropImage = ref(null)
    const originalFile = ref(null)

    // 编辑表单数据
    const editForm = ref({
      nickname: '',
      email: '',
      bio: '',
      avatar: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // 获取默认头像
    const getDefaultAvatar = () => {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTE2IDE3QzE4LjIwOTEgMTcgMjAgMTUuMjA5MSAyMCAxM0MyMCAxMC43OTA5IDE4LjIwOTEgOSAxNiA5QzEzLjc5MDkgOSAxMiAxMC43OTA5IDEyIDEzQzEyIDE1LjIwOTEgMTMuNzkwOSAxNyAxNiAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAxOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
    }

    // 初始化表单数据
    const initForm = () => {
      // 获取当前用户信息
      const user = store.state.user || {}
      
      editForm.value = {
        nickname: user.nickname || user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || getDefaultAvatar(),
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }

    // 触发头像上传
    const triggerAvatarUpload = () => {
      avatarInput.value.click()
    }

    // 处理头像上传
    const handleAvatarUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return

      // 简单校验文件类型
      if (!file.type.match('image.*')) {
        alert('请上传图片文件')
        return
      }

      // 校验文件大小（2MB）
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB')
        return
      }

      // 保存原始文件
      originalFile.value = file

      // 清理之前的状态
      imagePosition.value = { x: 0, y: 0 }
      scale.value = 1

      // 创建预览 URL 并打开裁剪模态框
      const reader = new FileReader()
      reader.onload = (e) => {
        cropperImageSrc.value = e.target.result
        showCropModal.value = true
        // 延迟一下，确保图片已经加载
        setTimeout(() => {
          handleImageLoad()
        }, 100)
      }
      reader.readAsDataURL(file)

      // 重置 input，允许重新选择同一个文件
      event.target.value = ''
    }
    
    const cropContainer = ref(null)
    const cropBox = ref(null)
    const isDragging = ref(false)
    const dragStart = ref({ x: 0, y: 0 })
    const imagePosition = ref({ x: 0, y: 0 })
    const scale = ref(1)

    // 图片加载完成后调整尺寸和位置
    const handleImageLoad = () => {
      const image = cropImage.value
      const container = cropContainer.value
      
      // 添加空值检查
      if (!image || !container) {
        console.warn('图片或容器元素未正确初始化')
        return
      }

      // 确保图片居中显示
      const containerWidth = container.offsetWidth - 40 // 减去padding
      const containerHeight = 400
      
      // 计算合适的缩放比例，确保图片填满裁剪区域
      const containerRatio = containerWidth / containerHeight
      const imageRatio = image.naturalWidth / image.naturalHeight
      
      if (imageRatio > containerRatio) {
        scale.value = containerWidth / image.naturalWidth
      } else {
        scale.value = containerHeight / image.naturalHeight
      }
      
      // 重置位置
      imagePosition.value = { x: 0, y: 0 }
      updateImageStyle()
    }

    // 更新图片样式
    const updateImageStyle = () => {
      const image = cropImage.value
      if (!image) return
      
      image.style.transform = `translate(${imagePosition.value.x}px, ${imagePosition.value.y}px) scale(${scale.value})`
      image.style.transition = isDragging.value ? 'none' : 'transform 0.1s ease'
    }

    // 开始拖动
    const startDragging = (e) => {
      isDragging.value = true
      dragStart.value = { x: e.clientX, y: e.clientY }
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', stopDragging)
    }

    // 拖动中
    const onMouseMove = (e) => {
      if (!isDragging.value) return
      
      const deltaX = e.clientX - dragStart.value.x
      const deltaY = e.clientY - dragStart.value.y
      
      imagePosition.value = {
        x: imagePosition.value.x + deltaX,
        y: imagePosition.value.y + deltaY
      }
      
      updateImageStyle()
      dragStart.value = { x: e.clientX, y: e.clientY }
    }

    // 停止拖动
    const stopDragging = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', stopDragging)
    }

    // 确认裁剪
    const confirmCrop = () => {
      const image = cropImage.value
      const box = cropBox.value
      
      // 添加空值检查
      if (!image || !box) {
        console.warn('图片或裁剪框元素未正确初始化')
        showCropModal.value = false
        return
      }
      
      try {
        // 创建canvas进行裁剪
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          console.error('无法创建canvas上下文')
          showCropModal.value = false
          return
        }
        
        // 设置canvas尺寸为200x200像素的正方形头像
        const avatarSize = 200
        canvas.width = avatarSize
        canvas.height = avatarSize
        
        // 计算裁剪区域
        const cropBoxWidth = box.offsetWidth
        const cropBoxHeight = box.offsetHeight
        
        // 获取图片的实际尺寸（考虑缩放）
        const imageWidth = image.naturalWidth * scale.value
        const imageHeight = image.naturalHeight * scale.value
        
        // 计算居中裁剪的位置
        const startX = Math.max(0, (imageWidth - cropBoxWidth) / 2 - imagePosition.value.x)
        const startY = Math.max(0, (imageHeight - cropBoxHeight) / 2 - imagePosition.value.y)
        
        // 绘制裁剪后的图像到canvas
        ctx.drawImage(
          image,
          startX / scale.value, // 原图起始X坐标
          startY / scale.value, // 原图起始Y坐标
          cropBoxWidth / scale.value, // 原图裁剪宽度
          cropBoxHeight / scale.value, // 原图裁剪高度
          0, // canvas起始X坐标
          0, // canvas起始Y坐标
          avatarSize, // canvas绘制宽度
          avatarSize // canvas绘制高度
        )
        
        // 将canvas转换为base64图片
        const croppedImageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
        
        // 立即更新editForm中的头像，确保界面实时更新
        editForm.value.avatar = croppedImageDataUrl
        
        // 如果store已经初始化且用户已登录，立即更新store中的头像预览
        if (store.state.user) {
          const tempUser = { ...store.state.user }
          tempUser.avatar = croppedImageDataUrl
          if (store.commit) {
            store.commit('SET_USER', tempUser)
          }
        }
        
        // 将base64转换为Blob以便后续上传
        const base64ToBlob = (base64, type = 'image/jpeg') => {
          const byteString = atob(base64.split(',')[1]);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const uint8Array = new Uint8Array(arrayBuffer);
          
          for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
          }
          
          return new Blob([uint8Array], { type });
        };
        
        // 保存裁剪后的Blob对象供后续上传
        originalFile.value = base64ToBlob(croppedImageDataUrl);
        
        showCropModal.value = false
        console.log('头像裁剪成功并已更新预览')
      } catch (error) {
        console.error('头像裁剪过程中出错:', error)
        alert('头像裁剪失败，请重试')
      } finally {
        // 清理事件监听器
        stopDragging()
      }
    }
    
    // 取消裁剪
    const cancelCrop = () => {
      showCropModal.value = false
      cropperImageSrc.value = ''
      originalFile.value = null
      // 清理事件监听器
      stopDragging()
    }

    // 表单验证
    const validateForm = () => {
      // 验证昵称
      if (!editForm.value.nickname.trim()) {
        alert('昵称不能为空')
        return false
      }

      // 验证邮箱
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editForm.value.email)) {
        alert('请输入有效的邮箱地址')
        return false
      }

      // 如果要修改密码，验证密码
      if (editForm.value.currentPassword || editForm.value.newPassword || editForm.value.confirmPassword) {
        // 必须填写所有密码字段
        if (!editForm.value.currentPassword) {
          alert('请输入当前密码')
          return false
        }
        if (!editForm.value.newPassword) {
          alert('请输入新密码')
          return false
        }
        if (!editForm.value.confirmPassword) {
          alert('请确认新密码')
          return false
        }

        // 验证新密码长度
        if (editForm.value.newPassword.length < 8) {
          alert('新密码长度至少8位')
          return false
        }

        // 验证新密码强度（包含字母和数字）
        const hasLetter = /[a-zA-Z]/.test(editForm.value.newPassword)
        const hasNumber = /\d/.test(editForm.value.newPassword)
        if (!hasLetter || !hasNumber) {
          alert('新密码必须包含字母和数字')
          return false
        }

        // 验证两次输入的新密码是否一致
        if (editForm.value.newPassword !== editForm.value.confirmPassword) {
          alert('两次输入的新密码不一致')
          return false
        }
      }

      return true
    }

    // 保存资料
    const saveProfile = async () => {
      // 验证表单
      if (!validateForm()) {
        return
      }

      isSubmitting.value = true

      try {
        let avatarUrl = editForm.value.avatar
        
        // 如果用户更换了头像（originalFile有值），则上传头像到服务器
        if (originalFile.value) {
          console.log('开始上传新头像...')
          
          // 创建FormData用于文件上传
          const formData = new FormData()
          formData.append('avatar', originalFile.value, 'avatar.jpg')
          
          // 调用头像上传API
          const uploadResponse = await fetch('/api/users/avatar', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          })
          
          const uploadData = await uploadResponse.json()
          
          if (!uploadResponse.ok || !uploadData.success) {
            throw new Error(uploadData.message || '头像上传失败')
          }
          
          avatarUrl = uploadData.avatarUrl
          console.log('头像上传成功，URL:', avatarUrl)
        }

        // 构建保存数据
        const saveData = {
          nickname: editForm.value.nickname,
          email: editForm.value.email,
          bio: editForm.value.bio,
          avatar: avatarUrl
        }

        // 如果要修改密码，添加密码字段
        if (editForm.value.currentPassword) {
          saveData.currentPassword = editForm.value.currentPassword
          saveData.newPassword = editForm.value.newPassword
        }

        console.log('开始保存用户资料:', saveData)

        // 调用用户资料更新API
        const updateResponse = await fetch('/api/users/' + store.state.user.id, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(saveData)
        })
        
        const updateData = await updateResponse.json()
        
        if (!updateResponse.ok || !updateData.success) {
          throw new Error(updateData.message || '资料更新失败')
        }

        // 更新本地用户信息
        const updatedUser = {
          ...store.state.user,
          ...saveData
        }

        // 移除密码相关字段
        delete updatedUser.currentPassword
        delete updatedUser.newPassword
        delete updatedUser.confirmPassword

        // 确保store.commit存在且是函数
        if (typeof store.commit === 'function') {
          // 先清除旧的用户信息，避免缓存问题
          store.commit('SET_USER', null)
          // 然后设置新的用户信息
          store.commit('SET_USER', updatedUser)
          console.log('用户资料已成功更新到store')
        } else {
          console.warn('store.commit不可用，无法更新用户信息')
        }

        // 刷新本地存储，确保头像在整个应用中可见
        localStorage.setItem('user', JSON.stringify(updatedUser))

        alert('资料更新成功！')
        router.push('/profile')
      } catch (error) {
        console.error('保存资料失败:', error)
        alert('保存失败，请重试：' + error.message)
      } finally {
        isSubmitting.value = false
      }
    }

    // 注销账号确认
    const confirmDeleteAccount = () => {
      if (!confirm('注销账号将删除您的所有数据，此操作不可恢复。确定要继续吗？')) {
        return
      }

      if (confirm('再次确认：您确定要永久注销账号吗？')) {
        deleteAccount()
      }
    }

    // 注销账号
    const deleteAccount = async () => {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 清除用户数据并退出登录
        if (typeof store.commit === 'function') {
          // 使用CLEAR_AUTH而不是LOGOUT，因为store中定义的是CLEAR_AUTH mutation
          store.commit('CLEAR_AUTH')
          console.log('用户数据已成功清除')
        } else {
          console.warn('store.commit不可用，无法清除用户数据')
          // 手动清除本地存储作为备用方案
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('favorites')
          localStorage.removeItem('cart')
        }
        
        // 重定向到首页
        router.push('/')
        
        // 显示注销成功提示
        setTimeout(() => {
          alert('账号已成功注销')
        }, 500)
      } catch (error) {
        console.error('注销账号失败:', error)
        alert('注销失败，请重试')
      }
    }

    // 返回上一页
    const goBack = () => {
      router.go(-1)
    }

    onMounted(() => {
      initForm()
    })

    return {
      editForm,
      avatarInput,
      isSubmitting,
      showCropModal,
      cropperImageSrc,
      cropImage,
      handleAvatarUpload,
      triggerAvatarUpload,
      saveProfile,
      confirmDeleteAccount,
      goBack,
      confirmCrop,
      cancelCrop
    }
  }
}
</script>

<style scoped>
.edit-profile-page {
  padding-top: 70px; /* 为固定导航栏留出空间 */
}

.edit-avatar {
  border: 3px solid #e9ecef;
  transition: all 0.3s ease;
}

.avatar-upload-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader:hover .edit-avatar {
  opacity: 0.8;
}

.form-label {
  color: #495057;
}

.password-section {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .edit-profile-page {
    padding-top: 60px;
  }
  
  .form-container {
    padding: 0 15px;
  }
  
  .avatar-uploader {
    width: 120px !important;
    height: 120px !important;
  }
}

/* 模态框背景 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  opacity: 0.5;
}

/* 裁剪容器样式 */
.crop-container {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 裁剪框样式 */
.crop-box {
  width: 300px;
  height: 300px;
  position: relative;
  border: 2px dashed #6c757d;
  overflow: hidden;
  cursor: move;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 裁剪框内的图片样式 */
.crop-box img {
  position: relative;
  cursor: move;
  min-width: 100%;
  min-height: 100%;
  object-fit: contain;
}

/* 遮罩层效果 */
.crop-container::before {
  content: '';
  position: absolute;
  top: 50px;
  left: calc(50% - 150px);
  width: 300px;
  height: 300px;
  box-shadow: inset 0 0 0 2000px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

/* 按钮间距样式 */
.mt-5 {
  margin-top: 2rem !important;
}
</style>