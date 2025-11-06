<template>
  <div class="cart-page container py-8">
    <h1 class="page-title mb-6">我的购物车</h1>
    
    <div v-if="cartItems.length === 0" class="empty-cart">
      <div class="empty-cart-content text-center py-10">
        <i class="bi bi-cart2 display-1 text-muted mb-4"></i>
        <h3 class="mb-2">购物车还是空的</h3>
        <p class="text-muted mb-4">快去选购心仪的盲盒吧！</p>
        <router-link to="/shop" class="btn btn-primary">去商城逛逛</router-link>
      </div>
    </div>
    
    <div v-else class="cart-content">
      <!-- 购物车商品列表 -->
      <div class="card mb-6">
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th class="w-1">选择</th>
                  <th class="w-20">商品图片</th>
                  <th>商品信息</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>小计</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in cartItems" :key="index" class="cart-item">
                  <td>
                    <div class="form-check">
                      <input 
                        type="checkbox" 
                        class="form-check-input" 
                        v-model="item.selected"
                        @change="updateSelected"
                      >
                    </div>
                  </td>
                  <td>
                    <img :src="item.image" class="cart-item-image" alt="商品图片">
                  </td>
                  <td class="item-info">
                    <h5 class="item-name mb-1">{{ item.name }}</h5>
                    <p class="item-series text-muted small" v-if="item.series">{{ item.series }}</p>
                    <p class="item-variant text-muted small" v-if="item.variant">{{ item.variant }}</p>
                  </td>
                  <td class="item-price">¥{{ item.price.toFixed(2) }}</td>
                  <td>
                    <div class="quantity-control">
                      <button 
                        class="btn btn-sm btn-outline-secondary quantity-btn" 
                        @click="decreaseQuantity(index)"
                        :disabled="item.quantity <= 1"
                      >-</button>
                      <input 
                        type="number" 
                        class="form-control quantity-input" 
                        v-model.number="item.quantity"
                        min="1"
                        @change="updateQuantity(index)"
                      >
                      <button 
                        class="btn btn-sm btn-outline-secondary quantity-btn" 
                        @click="increaseQuantity(index)"
                        :disabled="item.quantity >= item.stock"
                      >+</button>
                    </div>
                  </td>
                  <td class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</td>
                  <td>
                    <button class="btn btn-sm text-danger" @click="removeItem(index)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- 结算信息 -->
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-4">收货地址</h5>
              <div class="address-section">
                <div v-if="selectedAddress" class="selected-address">
                  <div class="address-info">
                    <p class="address-name mb-1">{{ selectedAddress.name }}</p>
                    <p class="address-phone mb-1">{{ selectedAddress.phone }}</p>
                    <p class="address-detail">{{ selectedAddress.province }}{{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.detail }}</p>
                  </div>
                  <button class="btn btn-sm btn-outline-secondary">管理地址</button>
                </div>
                <div v-else class="no-address">
                  <p class="text-muted mb-3">请添加收货地址</p>
                  <button class="btn btn-sm btn-outline-secondary">添加地址</button>
                </div>
              </div>
              
              <h5 class="card-title mt-6 mb-4">配送方式</h5>
              <div class="delivery-options">
                <div class="form-check mb-2">
                  <input type="radio" id="delivery-standard" name="delivery" class="form-check-input" checked>
                  <label for="delivery-standard" class="form-check-label">标准配送（满99元免运费）</label>
                </div>
                <div class="form-check">
                  <input type="radio" id="delivery-express" name="delivery" class="form-check-input">
                  <label for="delivery-express" class="form-check-label">加急配送（+¥15）</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-4">订单摘要</h5>
              
              <div class="order-summary">
                <div class="summary-row d-flex justify-content-between mb-2">
                  <span>商品总价</span>
                  <span>¥{{ subtotal.toFixed(2) }}</span>
                </div>
                <div class="summary-row d-flex justify-content-between mb-2">
                  <span>运费</span>
                  <span>{{ shippingFee > 0 ? '¥' + shippingFee.toFixed(2) : '免运费' }}</span>
                </div>
                <div class="summary-row d-flex justify-content-between mb-2">
                  <span>优惠券</span>
                  <span class="text-danger">-¥0.00</span>
                </div>
                <hr class="my-3">
                <div class="summary-row d-flex justify-content-between font-weight-bold">
                  <span>应付总额</span>
                  <span class="text-primary">{{ totalAmount.toFixed(2) }}</span>
                </div>
              </div>
              
              <div class="checkout-actions mt-6">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <div class="form-check">
                    <input type="checkbox" id="select-all" class="form-check-input" v-model="selectAll" @change="toggleSelectAll">
                    <label for="select-all" class="form-check-label">全选</label>
                  </div>
                  <button class="btn btn-sm text-danger" @click="clearSelected">删除所选</button>
                </div>
                <button class="btn btn-primary w-100 py-3" :disabled="!hasSelectedItems">
                  结算 ({{ selectedCount }})
                </button>
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
  name: 'CartPage',
  setup() {
    const store = useStore()
    const router = useRouter()
    const selectAll = ref(false)
    
    // 模拟购物车数据
    const cartItems = ref([])
    const selectedAddress = ref(null)
    
    // 初始化购物车数据
    const initCartData = () => {
      // 从store获取购物车数据，如果没有则使用模拟数据
      const storeCart = store.state.cart || []
      
      if (storeCart.length > 0) {
        cartItems.value = storeCart.map(item => ({
          ...item,
          selected: true
        }))
      } else {
        // 使用模拟数据
        cartItems.value = [
          {
            productId: 1,
            name: '星空幻想盲盒',
            series: '星空幻想系列',
            image: '/images/box1.jpg',
            price: 89,
            quantity: 2,
            stock: 100,
            selected: true
          },
          {
            productId: 2,
            name: '森林物语盲盒',
            series: '森林物语系列',
            image: '/images/box2.jpg',
            price: 79,
            quantity: 1,
            stock: 50,
            selected: true
          }
        ]
      }
      
      // 模拟地址数据
      selectedAddress.value = {
        name: '张三',
        phone: '138****1234',
        province: '上海市',
        city: '上海市',
        district: '浦东新区',
        detail: '张江高科技园区博云路2号'
      }
    }
    
    // 计算已选中的商品数量
    const selectedCount = computed(() => {
      return cartItems.value.filter(item => item.selected).length
    })
    
    // 判断是否有选中的商品
    const hasSelectedItems = computed(() => {
      return selectedCount.value > 0
    })
    
    // 计算商品总价
    const subtotal = computed(() => {
      return cartItems.value
        .filter(item => item.selected)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    })
    
    // 计算运费
    const shippingFee = computed(() => {
      return subtotal.value >= 99 ? 0 : 15
    })
    
    // 计算总金额
    const totalAmount = computed(() => {
      return subtotal.value + shippingFee.value
    })
    
    // 增加数量
    const increaseQuantity = (index) => {
      if (cartItems.value[index].quantity < cartItems.value[index].stock) {
        cartItems.value[index].quantity++
        updateCartStore()
      }
    }
    
    // 减少数量
    const decreaseQuantity = (index) => {
      if (cartItems.value[index].quantity > 1) {
        cartItems.value[index].quantity--
        updateCartStore()
      }
    }
    
    // 更新数量
    const updateQuantity = (index) => {
      const item = cartItems.value[index]
      if (item.quantity < 1) {
        item.quantity = 1
      } else if (item.quantity > item.stock) {
        item.quantity = item.stock
      }
      updateCartStore()
    }
    
    // 移除商品
    const removeItem = (index) => {
      if (confirm('确定要从购物车中移除该商品吗？')) {
        cartItems.value.splice(index, 1)
        updateCartStore()
        updateSelectAllStatus()
      }
    }
    
    // 全选/取消全选
    const toggleSelectAll = () => {
      cartItems.value.forEach(item => {
        item.selected = selectAll.value
      })
    }
    
    // 更新选中状态
    const updateSelected = () => {
      updateSelectAllStatus()
    }
    
    // 更新全选框状态
    const updateSelectAllStatus = () => {
      if (cartItems.value.length === 0) {
        selectAll.value = false
      } else {
        selectAll.value = cartItems.value.every(item => item.selected)
      }
    }
    
    // 删除选中的商品
    const clearSelected = () => {
      if (hasSelectedItems.value && confirm('确定要删除选中的商品吗？')) {
        cartItems.value = cartItems.value.filter(item => !item.selected)
        updateCartStore()
        selectAll.value = false
      }
    }
    
    // 更新store中的购物车数据
    const updateCartStore = () => {
      // 从cartItems中移除selected属性后保存到store
      const itemsToSave = cartItems.value.map(({ selected, ...item }) => item)
      store.commit('UPDATE_CART', itemsToSave)
    }
    
    // 页面加载时初始化数据
    onMounted(() => {
      initCartData()
      updateSelectAllStatus()
    })
    
    return {
      cartItems,
      selectedAddress,
      selectAll,
      selectedCount,
      hasSelectedItems,
      subtotal,
      shippingFee,
      totalAmount,
      increaseQuantity,
      decreaseQuantity,
      updateQuantity,
      removeItem,
      toggleSelectAll,
      updateSelected,
      clearSelected
    }
  }
}
</script>

<style scoped>
.cart-page {
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

.empty-cart-content {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 4rem 2rem;
}

.cart-content {
  max-width: 1200px;
  margin: 0 auto;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.item-info {
  vertical-align: middle;
}

.item-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  width: 120px;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-input {
  width: 50px;
  text-align: center;
  margin: 0 5px;
  border-radius: 0;
}

.address-section, .delivery-options {
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.selected-address {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.address-info p {
  margin-bottom: 0.25rem;
}

.order-summary {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.summary-row {
  font-size: 0.9rem;
}

.checkout-actions {
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .row {
    flex-direction: column;
  }
  
  .col-md-6 {
    margin-bottom: 2rem;
  }
  
  .table-responsive {
    font-size: 0.9rem;
  }
  
  .cart-item-image {
    width: 60px;
    height: 60px;
  }
  
  .quantity-control {
    width: 100px;
  }
  
  .quantity-input {
    width: 40px;
  }
  
  .selected-address {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>