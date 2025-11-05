<template>
  <div class="order-detail-page container mt-4">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">订单详情</h2>
        
        <!-- 返回按钮 -->
        <div class="mb-4">
          <button class="btn btn-outline-secondary" @click="goBack">
            <i class="bi bi-arrow-left me-2"></i>返回订单列表
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">加载中...</span>
          </div>
          <p class="mt-3">正在加载订单信息...</p>
        </div>

        <!-- 错误提示 -->
        <div v-else-if="error" class="alert alert-danger" role="alert">
          {{ error }}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>

        <!-- 订单详情 -->
        <div v-else-if="order" class="order-detail-content">
          <!-- 订单状态卡片 -->
          <div class="card mb-4">
            <div class="card-body bg-light">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="card-title">订单状态</h5>                  
                  <span :class="`badge bg-${getStatusClass(order.status)} mt-2`" style="font-size: 1rem; padding: 0.5rem 1rem;">
                    {{ getStatusText(order.status) }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="card-text text-muted">订单号</p>
                  <p class="card-text font-bold">{{ order.orderNumber || order.id || '暂无订单号' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 收货地址卡片 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">收货信息</h5>
            </div>
            <div class="card-body">
              <div v-if="order.shipping_address" class="address-info">
                <p class="mb-1"><strong>{{ order.shipping_address.name || '收货人' }}</strong> {{ order.shipping_address.phone || '未提供手机号' }}</p>
                <p class="text-muted mb-0">
                  {{ order.shipping_address.province || '' }} {{ order.shipping_address.city || '' }} 
                  {{ order.shipping_address.district || '' }} {{ order.shipping_address.detail || '未提供详细地址' }}
                </p>
              </div>
              <!-- 兼容address字段 -->
              <div v-else-if="order.address" class="address-info">
                <p class="mb-1"><strong>{{ order.address.name || '收货人' }}</strong> {{ order.address.phone || '未提供手机号' }}</p>
                <p class="text-muted mb-0">
                  {{ order.address.province || '' }} {{ order.address.city || '' }} 
                  {{ order.address.district || '' }} {{ order.address.detail || '未提供详细地址' }}
                </p>
              </div>
              <div v-else class="text-muted">
                暂无收货信息
              </div>
            </div>
          </div>

          <!-- 商品信息卡片 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">商品信息</h5>
            </div>
            <div class="card-body">
              <!-- 多商品订单 -->
              <div v-if="order.items && Array.isArray(order.items) && order.items.length > 0">
                <div v-for="item in order.items" :key="item.id || item.product_id || index" class="order-product mb-3 pb-3 border-bottom">
                  <div class="row align-items-center">
                    <div class="col-md-2">
                      <img :src="getProductImage(item)" :alt="item.name || '商品图片'" class="product-image me-3" @error="handleImageError($event)" :data-loaded="false">
                    </div>
                    <div class="col-md-4">
                      <h6 class="mb-1">{{ item.name || item.product_name || '商品名称' }}</h6>
                      <p class="text-muted small mb-0">{{ item.series || '暂无系列信息' }}</p>
                    </div>
                    <div class="col-md-2 text-center">
                      <span class="text-muted small">单价</span>
                      <p class="mb-0">¥{{ (item.price || 0).toFixed(2) }}</p>
                    </div>
                    <div class="col-md-2 text-center">
                      <span class="text-muted small">数量</span>
                      <p class="mb-0">{{ item.quantity || 1 }}</p>
                    </div>
                    <div class="col-md-2 text-center text-primary">
                      <span class="text-muted small">小计</span>
                      <p class="mb-0 font-bold">¥{{ ((item.price || 0) * (item.quantity || 1)).toFixed(2) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 处理单个商品订单 -->
              <div v-else-if="order.product_id || order.product_name" class="order-product mb-3 pb-3">
                <div class="row align-items-center">
                  <div class="col-md-2">
                    <img :src="getProductImage(order)" :alt="order.product_name || '商品图片'" class="product-image" @error="handleImageError($event)" :data-loaded="false">
                  </div>
                  <div class="col-md-4">
                    <h6 class="mb-1">{{ order.product_name || '商品名称' }}</h6>
                    <p class="text-muted small mb-0">{{ order.series || '暂无系列信息' }}</p>
                  </div>
                  <div class="col-md-2 text-center">
                    <span class="text-muted small">单价</span>
                    <p class="mb-0">¥{{ (order.price || 0).toFixed(2) }}</p>
                  </div>
                  <div class="col-md-2 text-center">
                    <span class="text-muted small">数量</span>
                    <p class="mb-0">{{ order.quantity || 1 }}</p>
                  </div>
                  <div class="col-md-2 text-center text-primary">
                    <span class="text-muted small">小计</span>
                    <p class="mb-0 font-bold">¥{{ (order.total_amount || order.totalAmount || 0).toFixed(2) }}</p>
                  </div>
                </div>
              </div>
              <!-- 处理无商品信息情况 -->
              <div v-else class="text-center py-4 text-muted">
                <i class="bi bi-box me-2"></i>暂无商品信息
              </div>
            </div>
          </div>

          <!-- 订单信息卡片 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">订单信息</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p class="mb-2"><strong>创建时间：</strong>{{ formatDate(order.created_at || order.createTime) }}</p>
                  <p class="mb-2"><strong>支付方式：</strong>{{ getPaymentMethodText(order.payment_method || order.paymentMethod) }}</p>
                  <p class="mb-2"><strong>支付时间：</strong>{{ formatDate(order.paid_at || order.paymentTime) }}</p>
                </div>
                <div class="col-md-6">
                  <p class="mb-2"><strong>发货时间：</strong>{{ formatDate(order.shipped_at || order.shipTime) }}</p>
                  <p class="mb-2"><strong>物流单号：</strong>{{ order.tracking_number || order.trackingNumber || '暂无物流信息' }}</p>
                  <p class="mb-2"><strong>收货时间：</strong>{{ formatDate(order.delivered_at || order.receiveTime) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 金额信息卡片 -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="card-title mb-0">金额信息</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span>商品总价：</span>
                <span>¥{{ (order.total_amount || order.totalAmount || 0).toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>运费：</span>
                <span>¥{{ (order.shipping_fee || order.shippingFee || 0).toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>优惠金额：</span>
                <span class="text-danger">-¥{{ (order.discount_amount || order.discountAmount || 0).toFixed(2) }}</span>
              </div>
              <hr>
              <div class="d-flex justify-content-between">
                <span class="font-bold">实付款：</span>
                <span class="font-bold text-primary h5">¥{{ calculateTotal(order) }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="order-actions mt-4">
            <button v-if="order.status === 'pending'" class="btn btn-success me-2" @click="payOrder">
              <i class="bi bi-credit-card me-2"></i>立即付款
            </button>
            <button v-if="order.status === 'pending'" class="btn btn-outline-secondary me-2" @click="cancelOrder">
              <i class="bi bi-x-circle me-2"></i>取消订单
            </button>
            <button v-if="order.status === 'shipped'" class="btn btn-primary me-2" @click="confirmReceipt">
              <i class="bi bi-check-circle me-2"></i>确认收货
            </button>
            <button class="btn btn-outline-primary me-2" @click="contactService">
              <i class="bi bi-headset me-2"></i>联系客服
            </button>
            <button class="btn btn-outline-info" @click="viewProduct">
              <i class="bi bi-eye me-2"></i>查看商品
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'OrderDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    
    const order = ref(null)
    const loading = ref(true)
    const error = ref('')

    // 测试用户标识
    const TEST_USERNAME = 'C01';
    const isTestUser = () => {
      return store.state.user && store.state.user.username === TEST_USERNAME;
    };

    // 模拟订单数据 - 仅用于测试用户
    const getMockOrder = (id) => {
      return {
        id: id,
        orderNumber: `20240115000${id}`,
        createTime: '2024-01-15 14:30:25',
        status: 'pending',
        total_amount: 89,
        items: [
          {
            id: 1,
            name: '星空幻想系列',
            series: '第一弹',
            image: '/images/box1.jpg',
            price: 89,
            quantity: 1
          }
        ],
        shipping_address: {
          name: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          detail: '某某街道某某小区1号楼1单元101室'
        }
      };
    };

    // 处理图片加载错误，避免无限循环
    const handleImageError = (event) => {
      const target = event.target;
      // 如果已经是默认图片或已经尝试过加载，则不再处理
      if (target.src.includes('default-product.jpg') || target.dataset.loaded === 'true') {
        return;
      }
      console.error('图片加载失败:', target.src);
      // 标记已经尝试过加载
      target.dataset.loaded = 'true';
      // 使用默认图片
      target.src = '/images/default-product.jpg';
    };
    
    // 获取正确的商品图片路径
    const getProductImage = (item) => {
      let imagePath = item.image || item.product_image || '';
      
      // 处理不同的数据格式
      if (!imagePath && typeof item === 'object') {
        // 从item对象中提取图片信息
        imagePath = item.productImage || item.img || item.picture || '';
      }
      
      // 如果只有文件名，添加正确的路径前缀
      if (imagePath && !imagePath.startsWith('/images/')) {
        // 只对box1.jpg使用boxes子目录，其他box图片直接放在images根目录
        if (imagePath === 'box1.jpg') {
          imagePath = '/images/boxes/' + imagePath;
        } else {
          imagePath = '/images/' + imagePath;
        }
      }
      
      return imagePath || '/images/default-product.jpg';
    };

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '暂无数据';
      try {
        const date = new Date(dateString);
        // 检查是否是有效日期
        if (isNaN(date.getTime())) return '暂无数据';
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        console.error('日期格式化错误:', error);
        return '暂无数据';
      }
    };

    // 获取状态类名
    const getStatusClass = (status) => {
      const classes = {
        'pending': 'warning',
        'paid': 'info',
        'shipped': 'primary',
        'delivered': 'success',
        'cancelled': 'danger'
      };
      return classes[status] || 'secondary';
    };

    // 获取状态文本
    const getStatusText = (status) => {
      const texts = {
        'pending': '待付款',
        'paid': '已付款',
        'shipped': '已发货',
        'delivered': '已完成',
        'cancelled': '已取消'
      };
      return texts[status] || '未知状态';
    };

    // 获取支付方式文本
    const getPaymentMethodText = (method) => {
      const methods = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'card': '银行卡'
      };
      return methods[method] || method || '暂无支付方式';
    };

    // 计算总金额
    const calculateTotal = (order) => {
      const productTotal = parseFloat(order.total_amount || order.totalAmount || 0);
      const shippingFee = parseFloat(order.shipping_fee || order.shippingFee || 0);
      const discount = parseFloat(order.discount_amount || order.discountAmount || 0);
      
      let total = productTotal + shippingFee - discount;
      // 确保总金额不为负数
      total = Math.max(total, 0);
      return total.toFixed(2);
    };

    // 获取订单详情
    const fetchOrderDetail = async () => {
      const { id } = route.params;
      
      try {
        loading.value = true;
        error.value = '';
        
        // 测试用户使用模拟数据
        if (isTestUser()) {
          await new Promise(resolve => setTimeout(resolve, 500));
          order.value = getMockOrder(id);
        } else {
          // 首先尝试从store中获取订单数据
          let orderData = null;
          const orders = store.state.orders && store.state.orders.orders ? 
                        store.state.orders.orders : 
                        (Array.isArray(store.state.orders) ? store.state.orders : []);
          
          if (orders && orders.length > 0) {
            orderData = orders.find(o => o.id === id || o.orderNumber === id);
          }
          
          if (orderData) {
            order.value = orderData;
          } else {
            // 如果store中没有，则从API获取数据
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${id}`);
            const result = await response.json();
            
            if (result.success && result.data) {
              order.value = result.data;
            } else {
              error.value = result.message || '获取订单详情失败';
              // 即使失败，也提供基础的订单框架数据
              order.value = {
                id: id,
                orderNumber: `订单-${id}`,
                status: 'pending',
                total_amount: 0,
                items: []
              };
            }
          }
        }
        
        // 确保订单对象包含所有必要的字段
        if (order.value) {
          order.value = {
            ...order.value,
            id: order.value.id || id,
            orderNumber: order.value.orderNumber || `订单-${id}`,
            status: order.value.status || 'pending',
            total_amount: order.value.total_amount || order.value.totalAmount || 0,
            shipping_fee: order.value.shipping_fee || order.value.shippingFee || 0,
            discount_amount: order.value.discount_amount || order.value.discountAmount || 0,
            items: order.value.items || [],
            created_at: order.value.created_at || order.value.createTime,
            shipping_address: order.value.shipping_address || order.value.address
          };
        }
      } catch (err) {
        console.error('获取订单详情异常:', err);
        error.value = '网络异常，请稍后重试';
        // 出错时提供一个基础的订单对象
        order.value = {
          id: id,
          orderNumber: `订单-${id}`,
          status: 'pending',
          total_amount: 0,
          items: []
        };
      } finally {
        loading.value = false;
      }
    };

    // 返回上一页
    const goBack = () => {
      router.push('/orders');
    };

    // 支付订单
    const payOrder = () => {
      console.log('支付订单:', order.value);
      alert('跳转到支付页面...');
    };

    // 取消订单
    const cancelOrder = () => {
      if (confirm('确定要取消这个订单吗？')) {
        console.log('取消订单:', order.value);
        alert('订单已取消');
        // 可以调用API更新订单状态
        // 然后刷新页面或返回订单列表
      }
    };

    // 确认收货
    const confirmReceipt = () => {
      if (confirm('确认收到商品了吗？')) {
        console.log('确认收货:', order.value);
        alert('收货确认成功');
        // 可以调用API更新订单状态
        // 然后刷新页面
      }
    };

    // 联系客服
    const contactService = () => {
      console.log('联系客服');
      alert('正在连接客服...');
    };

    // 查看商品
    const viewProduct = () => {
      if (order.value.items && order.value.items.length > 0) {
        const productId = order.value.items[0].product_id || order.value.items[0].id;
        router.push(`/product/${productId}`);
      } else if (order.value.product_id) {
        router.push(`/product/${order.value.product_id}`);
      }
    };

    onMounted(() => {
      fetchOrderDetail();
    });

    return {
      order,
      loading,
      error,
      formatDate,
      getStatusClass,
      getStatusText,
      getPaymentMethodText,
      calculateTotal,
      handleImageError,
      getProductImage,
      goBack,
      payOrder,
      cancelOrder,
      confirmReceipt,
      contactService,
      viewProduct
    };
  }
};
</script>

<style scoped>
.order-detail-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.font-bold {
  font-weight: 600;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.address-info {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-actions {
    flex-direction: column;
  }
  
  .order-actions .btn {
    width: 100%;
  }
  
  .product-image {
    width: 60px;
    height: 60px;
  }
  
  .order-product .row > div {
    margin-bottom: 0.5rem;
  }
  
  .order-product .row > div:last-child {
    margin-bottom: 0;
  }
}
</style>