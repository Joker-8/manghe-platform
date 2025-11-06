<template>
  <div class="customer-service-page">
    <div class="container py-8">
      <h1 class="page-title mb-6">帮助中心</h1>
      
      <!-- 帮助中心内容 -->
      <div class="help-center-content">
        <!-- 常见问题分类 -->
        <div class="help-categories mb-8">
          <div class="category-item active" @click="selectCategory('account')">账户相关</div>
          <div class="category-item" @click="selectCategory('orders')">订单问题</div>
          <div class="category-item" @click="selectCategory('products')">商品问题</div>
          <div class="category-item" @click="selectCategory('payment')">支付问题</div>
        </div>
        
        <!-- 问题列表 -->
        <div class="faq-list">
          <!-- 账户相关问题 -->
          <div v-if="selectedCategory === 'account'" class="category-content">
            <div class="faq-item" v-for="faq in accountFaqs" :key="faq.id">
              <div class="faq-question" @click="toggleFaq(faq.id)">
                <span>{{ faq.question }}</span>
                <i class="bi bi-chevron-down" :class="{ 'rotate-180': openFaqs.includes(faq.id) }"></i>
              </div>
              <div class="faq-answer" v-if="openFaqs.includes(faq.id)">
                {{ faq.answer }}
              </div>
            </div>
          </div>
          
          <!-- 订单相关问题 -->
          <div v-else-if="selectedCategory === 'orders'" class="category-content">
            <div class="faq-item" v-for="faq in orderFaqs" :key="faq.id">
              <div class="faq-question" @click="toggleFaq(faq.id)">
                <span>{{ faq.question }}</span>
                <i class="bi bi-chevron-down" :class="{ 'rotate-180': openFaqs.includes(faq.id) }"></i>
              </div>
              <div class="faq-answer" v-if="openFaqs.includes(faq.id)">
                {{ faq.answer }}
              </div>
            </div>
          </div>
          
          <!-- 商品相关问题 -->
          <div v-else-if="selectedCategory === 'products'" class="category-content">
            <div class="faq-item" v-for="faq in productFaqs" :key="faq.id">
              <div class="faq-question" @click="toggleFaq(faq.id)">
                <span>{{ faq.question }}</span>
                <i class="bi bi-chevron-down" :class="{ 'rotate-180': openFaqs.includes(faq.id) }"></i>
              </div>
              <div class="faq-answer" v-if="openFaqs.includes(faq.id)">
                {{ faq.answer }}
              </div>
            </div>
          </div>
          
          <!-- 支付相关问题 -->
          <div v-else-if="selectedCategory === 'payment'" class="category-content">
            <div class="faq-item" v-for="faq in paymentFaqs" :key="faq.id">
              <div class="faq-question" @click="toggleFaq(faq.id)">
                <span>{{ faq.question }}</span>
                <i class="bi bi-chevron-down" :class="{ 'rotate-180': openFaqs.includes(faq.id) }"></i>
              </div>
              <div class="faq-answer" v-if="openFaqs.includes(faq.id)">
                {{ faq.answer }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- 联系客服提示 -->
        <div class="contact-prompt mt-8 text-center">
          <p>没有找到您需要的答案？</p>
          <router-link to="/customer-service/contact" class="btn btn-primary mt-2">联系客服</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'HelpCenter',
  setup() {
    const selectedCategory = ref('account')
    const openFaqs = ref([])
    
    // 切换问题展开状态
    const toggleFaq = (faqId) => {
      const index = openFaqs.value.indexOf(faqId)
      if (index > -1) {
        openFaqs.value.splice(index, 1)
      } else {
        openFaqs.value.push(faqId)
      }
    }
    
    // 选择分类
    const selectCategory = (category) => {
      selectedCategory.value = category
      openFaqs.value = [] // 重置展开状态
    }
    
    // 账户相关FAQ
    const accountFaqs = reactive([
      {
        id: 'account-1',
        question: '如何注册新账号？',
        answer: '您可以在网站首页点击"注册"按钮，按照提示填写手机号、验证码、设置密码等信息完成注册。注册成功后，您可以立即登录并开始使用我们的服务。'
      },
      {
        id: 'account-2',
        question: '忘记密码怎么办？',
        answer: '在登录页面点击"忘记密码"，输入您的注册手机号，获取验证码后设置新密码即可。如果您无法接收验证码，请联系我们的客服人员协助解决。'
      },
      {
        id: 'account-3',
        question: '如何修改个人资料？',
        answer: '登录后，点击页面右上角的头像，选择"个人中心"，然后点击"编辑资料"按钮即可修改您的个人信息，包括头像、昵称、邮箱等。'
      },
      {
        id: 'account-4',
        question: '如何注销账号？',
        answer: '在个人中心页面，点击"注销账号"按钮，按照提示完成注销操作。请注意，账号注销后将无法恢复，您的所有数据将被删除。'
      }
    ])
    
    // 订单相关FAQ
    const orderFaqs = reactive([
      {
        id: 'order-1',
        question: '如何查询我的订单？',
        answer: '登录后，在个人中心页面点击"我的订单"即可查看所有订单记录，包括待付款、待发货、待收货、已完成等状态的订单。'
      },
      {
        id: 'order-2',
        question: '订单提交后可以取消吗？',
        answer: '订单提交后，在未支付状态下可以直接取消；已支付但未发货的订单，您可以联系客服申请取消；已发货的订单需要收到商品后申请退货退款。'
      },
      {
        id: 'order-3',
        question: '如何申请退款？',
        answer: '在订单详情页面，点击"申请退款"按钮，按照提示填写退款原因和上传相关凭证，提交后等待审核。审核通过后，退款将在1-7个工作日内原路返回。'
      }
    ])
    
    // 商品相关FAQ
    const productFaqs = reactive([
      {
        id: 'product-1',
        question: '盲盒商品有什么特殊规则？',
        answer: '盲盒商品具有随机性，购买后无法指定具体款式。每个系列的盲盒都有固定的款式和概率分布，详情请查看商品详情页的说明。'
      },
      {
        id: 'product-2',
        question: '如何查看商品详情？',
        answer: '在商城页面点击任意商品卡片，即可进入商品详情页，查看商品的详细信息、规格参数、用户评价等。'
      },
      {
        id: 'product-3',
        question: '商品支持定制吗？',
        answer: '部分商品支持定制服务，您可以在商品详情页查看是否有定制选项，或联系客服咨询定制事宜。'
      }
    ])
    
    // 支付相关FAQ
    const paymentFaqs = reactive([
      {
        id: 'payment-1',
        question: '支持哪些支付方式？',
        answer: '我们支持微信支付、支付宝等主流在线支付方式，您可以根据自己的偏好选择合适的支付渠道。'
      },
      {
        id: 'payment-2',
        question: '支付成功但订单显示未支付怎么办？',
        answer: '可能是支付系统延迟导致，请耐心等待几分钟后刷新页面。如果长时间显示未支付，请联系客服并提供支付凭证，我们会为您核实处理。'
      },
      {
        id: 'payment-3',
        question: '可以使用优惠券吗？',
        answer: '是的，在提交订单页面可以选择使用已有的优惠券。您可以通过参与活动、完成任务等方式获得优惠券。'
      }
    ])
    
    return {
      selectedCategory,
      openFaqs,
      toggleFaq,
      selectCategory,
      accountFaqs,
      orderFaqs,
      productFaqs,
      paymentFaqs
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

.help-categories {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 2rem;
}

.category-item {
  padding: 0.75rem 1.5rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-item:hover,
.category-item.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  margin-bottom: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.faq-question:hover {
  background-color: #e9ecef;
}

.faq-question i {
  transition: transform 0.3s ease;
}

.faq-answer {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  line-height: 1.6;
  color: #555;
}

.contact-prompt {
  margin-top: 3rem;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .help-categories {
    flex-direction: column;
    align-items: center;
  }
  
  .category-item {
    width: 100%;
    max-width: 300px;
    text-align: center;
  }
}
</style>