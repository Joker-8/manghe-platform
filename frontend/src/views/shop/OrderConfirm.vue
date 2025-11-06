<template>
  <div class="order-confirm-page">
    <div class="container py-5">
      <div class="row mb-4">
        <div class="col">
          <h1 class="page-title">确认订单</h1>
          <div class="breadcrumb">
            <router-link to="/">首页</router-link>
            <span class="mx-2">/</span>
            <span>确认订单</span>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- 订单表单 -->
        <div class="col-md-8 mb-4">
          <!-- 收货地址 -->
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">收货地址</h5>
              <button class="btn btn-outline-secondary btn-sm" @click="showAddressModal = true">
                管理地址
              </button>
            </div>
            <div class="card-body">
              <div v-if="selectedAddress" class="selected-address p-3 border rounded">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <div class="d-flex items-center mb-1">
                      <strong>{{ selectedAddress.name }}</strong>
                      <span class="mx-3 text-muted">|</span>
                      <span>{{ selectedAddress.phone }}</span>
                    </div>
                    <p class="text-muted mb-0">
                      {{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}
                    </p>
                  </div>
                  <div class="form-check">
                    <input type="radio" class="form-check-input" checked>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4 text-muted">
                <p>请添加收货地址</p>
                <button class="btn btn-primary mt-2" @click="showAddressModal = true">添加地址</button>
              </div>
            </div>
          </div>

          <!-- 配送方式 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">配送方式</h5>
            </div>
            <div class="card-body">
              <div class="form-check mb-2">
                <input type="radio" id="delivery-standard" name="delivery" class="form-check-input" v-model="selectedDelivery" value="standard">
                <label for="delivery-standard" class="form-check-label d-flex justify-content-between w-100">
                  <span>标准配送（3-5天送达）</span>
                  <span>¥0.00</span>
                </label>
              </div>
              <div class="form-check">
                <input type="radio" id="delivery-express" name="delivery" class="form-check-input" v-model="selectedDelivery" value="express">
                <label for="delivery-express" class="form-check-label d-flex justify-content-between w-100">
                  <span>加急配送（1-2天送达）</span>
                  <span>¥15.00</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 支付方式 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">支付方式</h5>
            </div>
            <div class="card-body">
              <div class="form-check mb-2">
                <input type="radio" id="payment-wechat" name="payment" class="form-check-input" v-model="selectedPayment" value="wechat">
                <label for="payment-wechat" class="form-check-label">微信支付</label>
              </div>
              <div class="form-check mb-2">
                <input type="radio" id="payment-alipay" name="payment" class="form-check-input" v-model="selectedPayment" value="alipay">
                <label for="payment-alipay" class="form-check-label">支付宝</label>
              </div>
              <div class="form-check">
                <input type="radio" id="payment-card" name="payment" class="form-check-input" v-model="selectedPayment" value="card">
                <label for="payment-card" class="form-check-label">银行卡</label>
              </div>
            </div>
          </div>

          <!-- 订单备注 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">订单备注</h5>
            </div>
            <div class="card-body">
              <textarea class="form-control" v-model="orderRemark" rows="3" placeholder="选填，请填写与订单相关的备注信息"></textarea>
            </div>
          </div>
        </div>

        <!-- 订单摘要 -->
        <div class="col-md-4">
          <div class="card sticky-top">
            <div class="card-header">
              <h5 class="mb-0">订单摘要</h5>
            </div>
            <div class="card-body">
              <!-- 商品列表 -->
              <div class="order-items">
                <div v-for="item in orderItems" :key="item.id" class="order-item mb-3 pb-3 border-bottom">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="font-medium">{{ item.name }}</span>
                    <span>¥{{ item.price }}</span>
                  </div>
                  <div class="d-flex justify-content-between text-muted small">
                    <span>{{ item.series }}</span>
                    <span>x{{ item.quantity }}</span>
                  </div>
                </div>
              </div>

              <!-- 价格明细 -->
              <div class="price-details mt-4">
                <div class="d-flex justify-content-between mb-2">
                  <span>商品总价</span>
                  <span>¥{{ subtotal.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>运费</span>
                  <span>¥{{ shippingFee.toFixed(2) }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 text-danger">
                  <span>优惠</span>
                  <span>-¥0.00</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between font-bold h5">
                  <span>实付款</span>
                  <span class="text-primary">¥{{ totalAmount.toFixed(2) }}</span>
                </div>
              </div>

              <!-- 提交订单按钮 -->
              <button class="btn btn-primary w-100 mt-4" @click="submitOrder">
                提交订单
              </button>

              <!-- 安全提示 -->
              <div class="security-tips mt-4 text-center text-muted small">
                <i class="bi bi-shield-check mr-1"></i>
                支付安全由平台保障
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'OrderConfirm',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    // 订单相关状态
    const orderItems = ref([])
    const selectedAddress = ref(null)
    const selectedDelivery = ref('standard')
    const selectedPayment = ref('wechat')
    const orderRemark = ref('')
    const showAddressModal = ref(false)
    
    // 计算属性
    const subtotal = computed(() => {
      return orderItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    })
    
    const shippingFee = computed(() => {
      return selectedDelivery.value === 'express' ? 15 : 0
    })
    
    const totalAmount = computed(() => {
      return subtotal.value + shippingFee.value
    })
    
    // 加载购物车数据
    const loadOrderItems = () => {
      // 从store获取购物车数据或直接使用临时存储的数据
      const cartItems = store.state.cart || []
      
      if (cartItems.length === 0) {
        // 如果没有商品，返回购物车页面
        router.push('/cart')
        return
      }
      
      orderItems.value = cartItems
    }
    
    // 模拟加载用户地址
    const loadUserAddresses = () => {
      // 模拟数据
      selectedAddress.value = {
        id: 1,
        name: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detail: '某某街道100号'
      }
    }
    
    // 提交订单
    const submitOrder = async () => {
      if (!selectedAddress.value) {
        alert('请选择收货地址')
        return
      }
      
      // 准备订单数据
      const orderData = {
        user_id: store.state.user?.id || 1, // 实际应从store获取用户ID
        product_id: orderItems.value[0].id,
        quantity: orderItems.value[0].quantity || 1,
        status: '待付款',
        total_price: totalAmount.value,
        shipping_address: JSON.stringify(selectedAddress.value),
        payment_method: selectedPayment.value,
        remark: orderRemark.value
      }
      
      try {
        // 调用后端创建订单API
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(orderData)
        })
        
        const result = await response.json()
        
        if (result.success) {
          // 清空购物车
          store.commit('CLEAR_CART')
          
          // 跳转到订单详情页
          router.push(`/order/${result.data.id}`)
        } else {
          alert(result.message || '创建订单失败')
        }
      } catch (error) {
        console.error('创建订单失败:', error)
        alert('网络异常，请稍后重试')
      }
    }
    
    onMounted(() => {
      loadOrderItems()
      loadUserAddresses()
    })
    
    return {
      orderItems,
      selectedAddress,
      selectedDelivery,
      selectedPayment,
      orderRemark,
      showAddressModal,
      subtotal,
      shippingFee,
      totalAmount,
      submitOrder
    }
  }
}
</script>

<style scoped>
.order-confirm-page {
  min-height: calc(100vh - 200px);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.breadcrumb {
  color: #6c757d;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #6c757d;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--primary-purple);
}

.selected-address {
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.selected-address:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-items .order-item:last-child {
  border-bottom: none;
}

.price-details {
  font-size: 0.95rem;
}

.sticky-top {
  top: 2rem;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>