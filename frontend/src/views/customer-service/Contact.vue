<template>
  <div class="customer-service-page">
    <div class="container py-8">
      <h1 class="page-title mb-6">联系客服</h1>
      
      <div class="contact-content">
        <!-- 联系方式卡片 -->
        <div class="contact-methods mb-8">
          <div class="method-card">
            <div class="method-icon"><i class="bi bi-headset"></i></div>
            <h3>在线客服</h3>
            <p class="service-time">服务时间：9:00-21:00</p>
            <button class="btn btn-primary mt-2" @click="openOnlineService">立即咨询</button>
          </div>
          
          <div class="method-card">
            <div class="method-icon"><i class="bi bi-telephone"></i></div>
            <h3>电话客服</h3>
            <p class="phone-number">400-123-4567</p>
            <p class="service-time">服务时间：9:00-18:00</p>
          </div>
          
          <div class="method-card">
            <div class="method-icon"><i class="bi bi-envelope"></i></div>
            <h3>邮箱咨询</h3>
            <p class="email-address">support@manghe.com</p>
            <p class="service-time">24小时内回复</p>
          </div>
        </div>
        
        <!-- 问题反馈表单 -->
        <div class="feedback-form">
          <h2 class="form-title">问题反馈</h2>
          <form @submit.prevent="submitFeedback">
            <div class="form-group">
              <label for="feedback-type">反馈类型*</label>
              <select id="feedback-type" v-model="feedbackForm.type" class="form-control">
                <option value="">请选择反馈类型</option>
                <option value="account">账户问题</option>
                <option value="order">订单问题</option>
                <option value="payment">支付问题</option>
                <option value="product">商品问题</option>
                <option value="suggestion">建议与反馈</option>
                <option value="other">其他问题</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="feedback-title">问题标题*</label>
              <input type="text" id="feedback-title" v-model="feedbackForm.title" class="form-control" placeholder="请简要描述您的问题">
            </div>
            
            <div class="form-group">
              <label for="feedback-content">详细描述*</label>
              <textarea id="feedback-content" v-model="feedbackForm.content" class="form-control" rows="6" placeholder="请详细描述您遇到的问题，以便我们更好地为您解决"></textarea>
            </div>
            
            <div class="form-group">
              <label for="contact-info">联系方式*</label>
              <input type="text" id="contact-info" v-model="feedbackForm.contactInfo" class="form-control" placeholder="请留下您的手机号或邮箱">
            </div>
            
            <div class="form-group">
              <label for="attachment">上传附件（可选）</label>
              <input type="file" id="attachment" class="form-control" @change="handleFileUpload">
              <p class="form-text text-muted">支持 JPG、PNG、PDF 格式，大小不超过 5MB</p>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">{{ isSubmitting ? '提交中...' : '提交反馈' }}</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 常见问题快捷入口 -->
      <div class="quick-faq mt-12">
        <h3 class="quick-faq-title">常见问题</h3>
        <div class="quick-faq-list">
          <router-link to="/customer-service/help" class="quick-faq-item">
            <span class="faq-text">如何查询订单状态？</span>
            <i class="bi bi-arrow-right"></i>
          </router-link>
          <router-link to="/customer-service/help" class="quick-faq-item">
            <span class="faq-text">如何申请退款？</span>
            <i class="bi bi-arrow-right"></i>
          </router-link>
          <router-link to="/customer-service/help" class="quick-faq-item">
            <span class="faq-text">忘记密码怎么办？</span>
            <i class="bi bi-arrow-right"></i>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Contact',
  setup() {
    const router = useRouter()
    const isSubmitting = ref(false)
    const attachmentFile = ref(null)
    
    const feedbackForm = reactive({
      type: '',
      title: '',
      content: '',
      contactInfo: ''
    })
    
    // 打开在线客服
    const openOnlineService = () => {
      alert('正在连接在线客服，请稍候...')
      // 实际项目中这里可以打开客服聊天窗口
    }
    
    // 处理文件上传
    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('只支持 JPG、PNG 或 PDF 格式的文件')
        return
      }
      
      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('文件大小不能超过 5MB')
        return
      }
      
      attachmentFile.value = file
      alert('文件上传成功')
    }
    
    // 提交反馈
    const submitFeedback = async () => {
      // 表单验证
      if (!feedbackForm.type || !feedbackForm.title || !feedbackForm.content || !feedbackForm.contactInfo) {
        alert('请填写所有必填字段')
        return
      }
      
      isSubmitting.value = true
      
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 构建表单数据
        const formData = new FormData()
        formData.append('type', feedbackForm.type)
        formData.append('title', feedbackForm.title)
        formData.append('content', feedbackForm.content)
        formData.append('contactInfo', feedbackForm.contactInfo)
        
        if (attachmentFile.value) {
          formData.append('attachment', attachmentFile.value)
        }
        
        // 模拟成功响应
        console.log('表单数据:', Object.fromEntries(formData.entries()))
        
        alert('反馈提交成功！我们将尽快与您联系。')
        
        // 重置表单
        feedbackForm.type = ''
        feedbackForm.title = ''
        feedbackForm.content = ''
        feedbackForm.contactInfo = ''
        attachmentFile.value = null
        document.getElementById('attachment').value = ''
        
      } catch (error) {
        console.error('提交反馈失败:', error)
        alert('提交失败，请稍后重试')
      } finally {
        isSubmitting.value = false
      }
    }
    
    return {
      feedbackForm,
      isSubmitting,
      openOnlineService,
      handleFileUpload,
      submitFeedback
    }
  }
}
</script>

<style scoped>
.customer-service-page {
  min-height: 70vh;
  padding-top: 80px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.contact-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.method-card {
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.method-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.method-icon {
  width: 80px;
  height: 80px;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 2rem;
}

.method-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.service-time,
.phone-number,
.email-address {
  color: #666;
  margin-bottom: 0.25rem;
}

.feedback-form {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
}

.form-text {
  font-size: 0.875rem;
}

.form-actions {
  margin-top: 2rem;
  text-align: center;
}

.quick-faq {
  max-width: 800px;
  margin: 3rem auto 0;
}

.quick-faq-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

.quick-faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-faq-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  color: #007bff;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.quick-faq-item:hover {
  background-color: #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .contact-methods {
    grid-template-columns: 1fr;
  }
  
  .feedback-form {
    padding: 1.5rem;
  }
  
  .method-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}
</style>