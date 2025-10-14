<template>
  <div class="orders-page container mt-4">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">我的订单</h2>

        <!-- 订单筛选 -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3 align-items-center">
              <div class="col-md-3">
                <label class="form-label">订单状态</label>
                <select class="form-select" v-model="statusFilter">
                  <option value="">全部状态</option>
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                  <option value="shipped">已发货</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">时间范围</label>
                <select class="form-select" v-model="timeFilter">
                  <option value="all">全部时间</option>
                  <option value="week">最近一周</option>
                  <option value="month">最近一月</option>
                  <option value="quarter">最近三月</option>
                </select>
              </div>
              <div class="col-md-6 d-flex align-items-end">
                <button class="btn btn-outline-secondary me-2" @click="resetFilters">
                  <i class="bi bi-arrow-clockwise me-1"></i>重置
                </button>
                <button class="btn btn-primary" @click="applyFilters">
                  <i class="bi bi-search me-1"></i>筛选
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 订单列表 -->
        <div class="card">
          <div class="card-body">
            <div v-if="filteredOrders.length === 0" class="text-center py-5">
              <i class="bi bi-receipt display-1 text-muted"></i>
              <h5 class="mt-3 text-muted">暂无订单</h5>
              <p class="text-muted">快去商城选购喜欢的盲盒吧！</p>
              <router-link to="/shop" class="btn btn-primary">去商城逛逛</router-link>
            </div>

            <div v-else>
              <div v-for="order in filteredOrders" :key="order.id" class="order-item mb-4">
                <!-- 订单头部 -->
                <div class="order-header d-flex justify-content-between align-items-center p-3 bg-light rounded-top">
                  <div class="order-info">
                    <span class="fw-bold">订单号: {{ order.orderNumber }}</span>
                    <span class="text-muted ms-3">{{ order.createTime }}</span>
                  </div>
                  <div class="order-status">
                    <span :class="`badge bg-${getStatusClass(order.status)}`">
                      {{ getStatusText(order.status) }}
                    </span>
                  </div>
                </div>

                <!-- 订单内容 -->
                <div class="order-content p-3 border border-top-0 rounded-bottom">
                  <div v-if="order.items && Array.isArray(order.items)">
                    <div v-for="item in order.items" :key="item.id" class="order-product mb-3">
                      <div class="row align-items-center">
                        <div class="col-md-6">
                          <div class="d-flex align-items-center">
                            <img :src="item.image || '/images/default-product.jpg'" :alt="item.name || '商品图片'" class="product-image me-3">
                            <div>
                              <h6 class="mb-1">{{ item.name || '商品名称' }}</h6>
                              <p class="text-muted small mb-0">{{ item.series || '暂无系列信息' }}</p>
                              <span class="badge bg-light text-dark">{{ item.quantity || 1 }}个</span>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-2 text-center">
                          <span class="text-muted">单价</span>
                          <div class="fw-bold">¥{{ item.price || 0 }}</div>
                        </div>
                        <div class="col-md-2 text-center">
                          <span class="text-muted">小计</span>
                          <div class="fw-bold">¥{{ ((item.price || 0) * (item.quantity || 1)).toFixed(2) }}</div>
                        </div>
                        <div class="col-md-2 text-end">
                          <button class="btn btn-outline-primary btn-sm me-1" @click="viewProduct(item)">
                            查看商品
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 处理无商品信息情况 -->
                  <div v-else class="text-center py-3 text-muted">
                    暂无商品信息
                  </div>

                  <!-- 订单总计 -->
                  <div class="order-total d-flex justify-content-between align-items-center pt-3 border-top">
                    <div class="order-actions">
                      <button v-if="order.status === 'pending'" class="btn btn-success btn-sm me-2" @click="payOrder(order)">
                        立即付款
                      </button>
                      <button v-if="order.status === 'pending'" class="btn btn-outline-secondary btn-sm me-2" @click="cancelOrder(order)">
                        取消订单
                      </button>
                      <button v-if="order.status === 'shipped'" class="btn btn-outline-primary btn-sm me-2" @click="confirmReceipt(order)">
                        确认收货
                      </button>
                      <button class="btn btn-outline-info btn-sm" @click="viewOrderDetail(order)">
                        订单详情
                      </button>
                    </div>
                    <div class="total-amount">
                      <span class="text-muted me-2">合计:</span>
                      <span class="h5 text-primary mb-0">¥{{ (order.totalAmount || order.total_amount || 0).toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <nav aria-label="Order pagination" class="mt-4">
                <ul class="pagination justify-content-center">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">上一页</a>
                  </li>
                  <li v-for="page in totalPages" :key="page" class="page-item" :class="{ active: page === currentPage }">
                    <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">下一页</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'OrdersPage',
  setup() {
    const router = useRouter()
    const store = useStore()

    const orders = ref([])
    const statusFilter = ref('')
    const timeFilter = ref('all')
    const currentPage = ref(1)
    const pageSize = 5

    // 测试用户标识
    const TEST_USERNAME = 'C01';
    const isTestUser = () => {
      return store.state.user && store.state.user.username === TEST_USERNAME;
    };

    // 模拟订单数据 - 仅用于测试用户
    const mockOrders = [
      {
        id: 1,
        orderNumber: '202401150001',
        createTime: '2024-01-15 14:30:25',
        status: 'completed',
        totalAmount: 267,
        items: [
          {
            id: 1,
            name: '星空幻想系列',
            series: '第一弹',
            image: '/images/box1.jpg',
            price: 89,
            quantity: 3
          }
        ]
      },
      {
        id: 2,
        orderNumber: '202401140002',
        createTime: '2024-01-14 10:15:33',
        status: 'shipped',
        totalAmount: 79,
        items: [
          {
            id: 2,
            name: '森林物语系列',
            series: '季节限定',
            image: '/images/box2.jpg',
            price: 79,
            quantity: 1
          }
        ]
      },
      {
        id: 3,
        orderNumber: '202401130003',
        createTime: '2024-01-13 16:45:12',
        status: 'pending',
        totalAmount: 99,
        items: [
          {
            id: 3,
            name: '海洋奇缘系列',
            series: '特别版',
            image: '/images/box3.jpg',
            price: 99,
            quantity: 1
          }
        ]
      },
      {
        id: 4,
        orderNumber: '202401120004',
        createTime: '2024-01-12 09:20:47',
        status: 'paid',
        totalAmount: 168,
        items: [
          {
            id: 1,
            name: '星空幻想系列',
            series: '第一弹',
            image: '/images/box1.jpg',
            price: 89,
            quantity: 2
          }
        ]
      },
      {
        id: 5,
        orderNumber: '202401110005',
        createTime: '2024-01-11 18:05:19',
        status: 'cancelled',
        totalAmount: 85,
        items: [
          {
            id: 4,
            name: '城市探险系列',
            series: '第二弹',
            image: '/images/box4.jpg',
            price: 85,
            quantity: 1
          }
        ]
      }
    ]

    // 计算属性
    const filteredOrders = computed(() => {
      let filtered = [...orders.value]

      // 状态筛选
      if (statusFilter.value) {
        filtered = filtered.filter(order => order.status === statusFilter.value)
      }

      // 时间筛选
      if (timeFilter.value !== 'all') {
        const now = new Date()
        let startDate = new Date()

        switch (timeFilter.value) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3)
            break
        }

        filtered = filtered.filter(order => {
          const orderDate = new Date(order.createTime)
          return orderDate >= startDate
        })
      }

      // 分页
      const start = (currentPage.value - 1) * pageSize
      const end = start + pageSize
      return filtered.slice(start, end)
    })

    const totalPages = computed(() => {
      return Math.ceil(orders.value.length / pageSize)
    })

    // 方法
    const getStatusClass = (status) => {
      const classes = {
        'pending': 'warning',
        'paid': 'info',
        'shipped': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return classes[status] || 'secondary'
    }

    const getStatusText = (status) => {
      const texts = {
        'pending': '待付款',
        'paid': '已付款',
        'shipped': '已发货',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return texts[status] || '未知状态'
    }

    const applyFilters = () => {
      currentPage.value = 1
      // 筛选逻辑已经在计算属性中处理
    }

    const resetFilters = () => {
      statusFilter.value = ''
      timeFilter.value = 'all'
      currentPage.value = 1
    }

    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }

    const payOrder = (order) => {
      console.log('支付订单:', order)
      alert('跳转到支付页面...')
    }

    const cancelOrder = (order) => {
      if (confirm('确定要取消这个订单吗？')) {
        console.log('取消订单:', order)
        // 更新订单状态
        order.status = 'cancelled'
        alert('订单已取消')
      }
    }

    const confirmReceipt = (order) => {
      if (confirm('确认收到商品了吗？')) {
        console.log('确认收货:', order)
        // 更新订单状态
        order.status = 'completed'
        alert('收货确认成功')
      }
    }

    const viewOrderDetail = (order) => {
      console.log('查看订单详情:', order)
      router.push(`/orders/${order.id}`)
    }

    const viewProduct = (product) => {
      console.log('查看商品:', product)
      router.push('/shop')
    }

    // 获取订单商品总数
    const getTotalItems = (order) => {
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
      } else if (order.quantity) {
        return order.quantity;
      }
      return 0;
    };
    
    // 获取订单数据
    const fetchOrders = async () => {
      try {
        // 先调用store action获取最新订单数据
        await store.dispatch('fetchOrders');
        
        // 从store获取订单数据
        let ordersData = [];
        // 处理不同的store结构可能性
        if (store.state.orders && Array.isArray(store.state.orders)) {
          ordersData = store.state.orders;
        } else if (store.state.orders && store.state.orders.orders) {
          ordersData = store.state.orders.orders;
        }
        
        // 只有测试用户才使用模拟数据
        if (isTestUser()) {
          orders.value = [...mockOrders, ...ordersData];
        } else {
          // 非测试用户从store获取最新数据
          orders.value = ordersData;
          
          // 如果store中没有数据，且用户已登录，提供友好提示
          if (orders.value.length === 0 && store.state.user) {
            console.log('暂无订单数据');
          }
        }
        
        // 确保每个订单都有必要的字段
        orders.value = orders.value.map(order => ({
          ...order,
          id: order.id || Math.floor(Math.random() * 10000),
          orderNumber: order.orderNumber || `订单-${order.id || Math.floor(Math.random() * 10000)}`,
          totalAmount: order.totalAmount || order.total_amount || 0,
          shipping_fee: order.shipping_fee || 0,
          status: order.status || 'pending',
          createTime: order.createTime || order.created_at || new Date().toISOString(),
          items: order.items || []
        }));
      } catch (error) {
        console.error('获取订单失败:', error)
        // 出错时尝试使用store中的已有数据，避免显示空列表
        let ordersData = [];
        if (store.state.orders && Array.isArray(store.state.orders)) {
          ordersData = store.state.orders;
        } else if (store.state.orders && store.state.orders.orders) {
          ordersData = store.state.orders.orders;
        }
        
        orders.value = ordersData;
        
        // 确保数据完整性
        orders.value = orders.value.map(order => ({
          ...order,
          id: order.id || Math.floor(Math.random() * 10000),
          orderNumber: order.orderNumber || `订单-${order.id || Math.floor(Math.random() * 10000)}`,
          totalAmount: order.totalAmount || order.total_amount || 0,
          shipping_fee: order.shipping_fee || 0,
          status: order.status || 'pending',
          createTime: order.createTime || order.created_at || new Date().toISOString(),
          items: order.items || []
        }));
      }
    }

    onMounted(() => {
      // 加载订单数据
      fetchOrders()
    })

    return {
      orders,
      statusFilter,
      timeFilter,
      currentPage,
      filteredOrders,
      totalPages,
      getStatusClass,
      getStatusText,
      applyFilters,
      resetFilters,
      changePage,
      payOrder,
      cancelOrder,
      confirmReceipt,
      viewOrderDetail,
      viewProduct
    }
  }
}
</script>

<style scoped>
.order-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.order-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.order-total {
  background: #f8f9fa;
  margin: 0 -1rem -1rem;
  padding: 1rem;
}

.pagination .page-item .page-link {
  color: var(--primary-purple);
  border: 1px solid #dee2e6;
}

.pagination .page-item.active .page-link {
  background-color: var(--primary-purple);
  border-color: var(--primary-purple);
  color: white;
}

.pagination .page-item .page-link:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-product .row > div {
    margin-bottom: 1rem;
  }

  .order-total {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .order-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
  }

  .order-actions .btn {
    margin: 0.25rem;
  }
}
</style>