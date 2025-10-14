<template>
  <div class="product-detail-page container mt-4">
    <div class="row">
      <!-- 商品图片 -->
      <div class="col-lg-6 mb-4">
        <div class="product-gallery">
          <div class="main-image mb-3">
        <img :src="getProductImage(product.image)" :alt="product.name" class="img-fluid rounded" @error="handleImageError($event)" :data-loaded="false">
      </div>
          <div class="image-thumbnails">
            <img
                v-for="(img, index) in product.images"
                :key="index"
                :src="getProductImage(img)"
                :alt="product.name"
                class="thumbnail"
                :class="{ active: currentImage === index }"
                @click="currentImage = index"
                @error="handleImageError($event)"
                :data-loaded="false"
            >
          </div>
        </div>
      </div>

      <!-- 商品信息 -->
      <div class="col-lg-6">
        <div class="product-info">
          <!-- 商品标题 -->
          <div class="product-header mb-3">
            <div class="d-flex justify-content-between align-items-start">
              <h1 class="product-title">{{ product.name }}</h1>
              <button class="btn btn-like" @click="toggleFavorite" :title="isFavorited ? '从心愿单移除' : '加入心愿单'">
                <i :class="['bi', isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart']"></i>
                <span class="favorite-count ms-1" v-if="favoritesCount > 0">{{ favoritesCount }}</span>
              </button>
            </div>
            <p class="product-series text-muted">{{ product.series }}</p>
            <div v-if="showFavoriteMessage" class="favorite-message" :class="favoriteMessageType">
              {{ favoriteMessage }}
            </div>
          </div>

          <!-- 商品评分 -->
          <div class="product-rating mb-3">
            <div class="d-flex align-items-center">
              <div class="rating-stars me-2">
                <i v-for="star in 5" :key="star"
                   :class="['bi', star <= Math.floor(product.rating) ? 'bi-star-fill' : 'bi-star']"
                   class="text-warning"></i>
              </div>
              <span class="rating-value me-2">{{ product.rating }}</span>
              <span class="review-count text-muted">({{ product.reviewCount }} 条评价)</span>
            </div>
          </div>

          <!-- 商品价格 -->
          <div class="product-price mb-4">
            <span class="current-price h3 text-primary">¥{{ product.price }}</span>
            <span v-if="product.originalPrice" class="original-price text-muted text-decoration-line-through ms-2">
              ¥{{ product.originalPrice }}
            </span>
            <span v-if="product.discount" class="discount-badge badge bg-danger ms-2">
              {{ product.discount }}折
            </span>
          </div>

          <!-- 商品库存 -->
          <div class="product-stock mb-4">
            <span class="badge" :class="stockClass">{{ stockText }}</span>
            <span class="text-muted ms-2">已售 {{ product.soldCount }} 件</span>
          </div>

          <!-- 商品规格 -->
          <div class="product-variants mb-4" v-if="product.variants && product.variants.length">
            <h6 class="variant-label mb-2">选择规格：</h6>
            <div class="variant-options">
              <button
                  v-for="variant in product.variants"
                  :key="variant.id"
                  class="btn btn-outline-secondary me-2 mb-2"
                  :class="{ active: selectedVariant?.id === variant.id }"
                  @click="selectVariant(variant)"
                  :disabled="variant.stock === 0"
              >
                {{ variant.name }}
                <span v-if="variant.stock === 0" class="text-muted">(缺货)</span>
              </button>
            </div>
          </div>

          <!-- 购买数量 -->
          <div class="product-quantity mb-4">
            <h6 class="quantity-label mb-2">购买数量：</h6>
            <div class="quantity-controls d-flex align-items-center">
              <button class="btn btn-outline-secondary" @click="decreaseQuantity" :disabled="quantity <= 1">
                <i class="bi bi-dash"></i>
              </button>
              <input type="number" class="form-control text-center mx-2" v-model.number="quantity" min="1" :max="maxQuantity">
              <button class="btn btn-outline-secondary" @click="increaseQuantity" :disabled="quantity >= maxQuantity">
                <i class="bi bi-plus"></i>
              </button>
              <span class="text-muted ms-3">最多购买 {{ maxQuantity }} 件</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="product-actions mb-4">
            <div class="row g-2">
              <div class="col-md-6">
                <button class="btn btn-outline-primary w-100" @click="addToCart" :disabled="!canAddToCart">
                  <i class="bi bi-cart me-2"></i>加入购物车
                </button>
              </div>
              <div class="col-md-6">
                <button class="btn btn-primary w-100" @click="showBuyConfirmDialog = true" :disabled="!canBuy">
                  <i class="bi bi-lightning me-2"></i>立即购买
                </button>
              </div>
            </div>
          </div>

          <!-- 商品服务 -->
          <div class="product-services">
            <div class="service-item d-flex align-items-center mb-2">
              <i class="bi bi-truck text-primary me-2"></i>
              <span class="small">全场满¥99包邮</span>
            </div>
            <div class="service-item d-flex align-items-center mb-2">
              <i class="bi bi-arrow-clockwise text-primary me-2"></i>
              <span class="small">7天无理由退货</span>
            </div>
            <div class="service-item d-flex align-items-center">
              <i class="bi bi-shield-check text-primary me-2"></i>
              <span class="small">正品保证</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品详情 -->
    <div class="row mt-5">
      <div class="col-12">
        <div class="product-detail-tabs">
          <ul class="nav nav-tabs" id="productTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="detail-tab" data-bs-toggle="tab" data-bs-target="#detail" type="button">
                商品详情
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="specs-tab" data-bs-toggle="tab" data-bs-target="#specs" type="button">
                规格参数
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="reviews-tab" data-bs-toggle="tab" data-bs-target="#reviews" type="button">
                用户评价
              </button>
            </li>
          </ul>
          <div class="tab-content p-3 border border-top-0 rounded-bottom">
            <!-- 商品详情 -->
            <div class="tab-pane fade show active" id="detail" role="tabpanel">
              <div v-html="product.description"></div>
            </div>

            <!-- 规格参数 -->
            <div class="tab-pane fade" id="specs" role="tabpanel">
              <table class="table table-striped">
                <tbody>
                  <tr v-for="spec in product.specifications" :key="spec.name">
                    <td style="width: 120px;"><strong>{{ spec.name }}</strong></td>
                    <td>{{ spec.value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 用户评价 -->
            <div class="tab-pane fade" id="reviews" role="tabpanel">
              <div v-if="product.reviews && product.reviews.length">
                <div v-for="review in product.reviews" :key="review.id" class="review-item mb-4">
                  <div class="d-flex align-items-start">
                    <img :src="review.user.avatar" class="user-avatar me-3" alt="用户头像">
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 class="mb-1">{{ review.user.name }}</h6>
                          <div class="rating-stars small">
                            <i v-for="star in 5" :key="star"
                               :class="['bi', star <= review.rating ? 'bi-star-fill' : 'bi-star']"
                               class="text-warning"></i>
                          </div>
                        </div>
                        <small class="text-muted">{{ review.date }}</small>
                      </div>
                      <p class="mb-2">{{ review.content }}</p>
                      <div v-if="review.images && review.images.length" class="review-images">
                        <img v-for="(img, index) in review.images" :key="index" :src="img" class="review-image me-2 mb-2">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <i class="bi bi-chat-quote display-1 text-muted"></i>
                <p class="text-muted mt-2">暂无评价</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐 -->
    <div class="row mt-5">
      <div class="col-12">
        <h4 class="mb-4">相关推荐</h4>
        <div class="row">
          <div v-for="related in relatedProducts" :key="related.id" class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <BoxCard :box-data="related" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 购买确认弹窗 -->
  <div v-if="showBuyConfirmDialog" class="dialog-overlay" @click.self="closeBuyDialog">
    <div class="dialog-content">
      <div class="dialog-header">
        <h5 class="dialog-title">确认购买</h5>
        <button class="dialog-close" @click="closeBuyDialog">&times;</button>
      </div>
      
      <div class="buy-info">
        <div class="buy-product-name">{{ product.name }}</div>
        <div v-if="selectedVariant" class="buy-variant mb-1">{{ selectedVariant.name }}</div>
        <div class="buy-product-price">¥{{ selectedVariant?.price || product.price }}</div>
        
        <div class="buy-error" v-if="buyError">{{ buyError }}</div>
        
        <div class="quantity-selector">
          <span class="quantity-label">购买数量：</span>
          <div class="quantity-control">
            <button class="quantity-btn" @click="decreaseBuyQuantity" :disabled="buyQuantity <= 1">&minus;</button>
            <input type="number" class="quantity-input" v-model.number="buyQuantity" min="1" :max="maxQuantity">
            <button class="quantity-btn" @click="increaseBuyQuantity" :disabled="buyQuantity >= maxQuantity">&plus;</button>
          </div>
        </div>
        
        <div class="buy-total">
          <span>合计：</span>
          <span class="text-primary">¥{{ (selectedVariant?.price || product.price) * buyQuantity }}</span>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-cancel" @click="closeBuyDialog">取消</button>
        <button class="btn btn-primary btn-confirm" @click="confirmBuy" :disabled="buyLoading || !canBuy">
          <span v-if="buyLoading"><i class="bi bi-spinner bi-spin"></i> 处理中...</span>
          <span v-else>确认购买</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BoxCard from '@/components/common/BoxCard.vue'

export default {
  name: 'ProductDetailPage',
  components: {
    BoxCard
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()

    const product = reactive({})
    const currentImage = ref(0)
    const selectedVariant = ref(null)
    const quantity = ref(1)

    // 模拟商品数据
    const mockProduct = {
      id: 1,
      name: '星空幻想系列 - 银河守护者',
      series: '星空幻想系列 第一弹',
      image: '/images/box1.jpg',
      images: [
        '/images/box1.jpg',
        '/images/box2.jpg',
        '/images/box3.jpg',
        '/images/box4.jpg'
      ],
      price: 89,
      originalPrice: 99,
      discount: 9,
      rating: 4.8,
      reviewCount: 128,
      stock: 156,
      soldCount: 542,
      variants: [
        { id: 1, name: '标准版', price: 89, stock: 156 },
        { id: 2, name: '豪华版', price: 129, stock: 45 },
        { id: 3, name: '典藏版', price: 199, stock: 0 }
      ],
      description: `
        <h4>产品介绍</h4>
        <p>星空幻想系列是芒盒平台推出的首款原创盲盒系列，以浩瀚宇宙和神秘星空为主题，带你探索未知的星际世界。</p>

        <h5>产品特点：</h5>
        <ul>
          <li>精美造型设计，每个角色都有独特的星空元素</li>
          <li>高品质PVC材质，手感细腻</li>
          <li>隐藏款概率2.5%，极具收藏价值</li>
          <li>全套12个常规款+1个隐藏款</li>
        </ul>

        <h5>尺寸规格：</h5>
        <p>单个盲盒尺寸：8cm × 8cm × 12cm</p>
        <p>单个玩偶高度：7-8cm</p>
      `,
      specifications: [
        { name: '系列', value: '星空幻想系列 第一弹' },
        { name: '材质', value: 'PVC' },
        { name: '尺寸', value: '8×8×12cm' },
        { name: '重量', value: '约150g' },
        { name: '全套数量', value: '12常规 + 1隐藏' },
        { name: '适合年龄', value: '14岁以上' }
      ],
      reviews: [
        {
          id: 1,
          user: {
            name: '盲盒爱好者',
            avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTIwIDIxQzIyLjIwOTEgMjEgMjQgMTkuMjA5MSAyNCAxN0MyNCAxNC43OTA5IDIyLjIwOTEgMTMgMjAgMTNDMTcuNzkwOSAxMyAxNiAxNC43OTA5IDE2IDE3QzE2IDE5LjIwOTEgMTcuNzkwOSAyMSAyMCAyMVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAyMkMxNS41ODIyIDIyIDEyIDI0LjY4NjMgMTIgMjhIMjBIMjhDMjggMjQuNjg2MyAyNC40MTc4IDIyIDIwIDIyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='
          },
          rating: 5,
          content: '质量很好，开到了喜欢的款式！包装也很精美，还会继续购买这个系列。',
          date: '2024-01-15',
          images: [
            '/images/box1.jpg',
        '/images/box2.jpg'
          ]
        }
      ]
    }

    const relatedProducts = ref([
      {
        id: 2,
        name: '森林物语系列',
        series: '季节限定',
        image: '/images/box2.jpg',
        price: 79,
        rating: 4.6,
        stock: 89,
        isLimited: false,
        isNew: false
      },
      {
        id: 3,
        name: '海洋奇缘系列',
        series: '特别版',
        image: '/images/box3.jpg',
        price: 99,
        rating: 4.9,
        stock: 45,
        isLimited: true,
        isNew: true
      }
    ])

    // 计算属性
    const isFavorited = computed(() => {
      return store.state.favorites.includes(product.id)
    })
    
    const favoritesCount = computed(() => {
      return store.state.favorites.length
    })
    
    const showFavoriteMessage = ref(false)
    const favoriteMessage = ref('')
    const favoriteMessageType = ref('success')
    
    // 购买确认弹窗相关状态
    const showBuyConfirmDialog = ref(false)
    const buyQuantity = ref(1)
    const buyLoading = ref(false)
    const buyError = ref('')

    const stockClass = computed(() => {
      const currentStock = selectedVariant.value?.stock || product.stock
      if (currentStock === 0) return 'stock-out'
      if (currentStock <= 5) return 'stock-low'
      if (currentStock <= 20) return 'stock-medium'
      return 'stock-high'
    })

    const stockText = computed(() => {
      const currentStock = selectedVariant.value?.stock || product.stock
      if (currentStock === 0) return '已售罄'
      if (currentStock <= 5) return `库存紧张: 仅剩${currentStock}个`
      if (currentStock <= 20) return `库存适中: ${currentStock}个`
      return `库存充足: ${currentStock}个`
    })

    const maxQuantity = computed(() => {
      return selectedVariant.value ? selectedVariant.value.stock : product.stock
    })

    const canAddToCart = computed(() => {
      return maxQuantity.value > 0
    })

    const canBuy = computed(() => {
      return maxQuantity.value > 0
    })

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
    }
    
    // 获取正确的商品图片路径
    const getProductImage = (imagePath) => {
      if (!imagePath) {
        return '/images/default-product.jpg';
      }
      
      // 如果只有文件名，添加正确的路径前缀
      if (typeof imagePath === 'string' && !imagePath.startsWith('/images/')) {
        // 只对box1.jpg使用boxes子目录，其他box图片直接放在images根目录
        if (imagePath === 'box1.jpg') {
          imagePath = '/images/boxes/' + imagePath;
        } else {
          imagePath = '/images/' + imagePath;
        }
      }
      
      return imagePath;
    }
    
    // 方法
    const selectVariant = (variant) => {
      selectedVariant.value = variant
      // 重置数量为1
      quantity.value = 1
    }

    const increaseQuantity = () => {
      if (quantity.value < maxQuantity.value) {
        quantity.value++
      }
    }

    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }

    const toggleFavorite = async () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      try {
        if (isFavorited.value) {
          await store.dispatch('removeFavorite', product.id)
          favoriteMessage.value = '已从心愿单移除'
          favoriteMessageType.value = 'warning'
        } else {
          await store.dispatch('addFavorite', product.id)
          favoriteMessage.value = '已添加到心愿单'
          favoriteMessageType.value = 'success'
        }
        
        // 显示提示信息
        showFavoriteMessage.value = true
        setTimeout(() => {
          showFavoriteMessage.value = false
        }, 2000)
      } catch (error) {
        console.error('心愿单操作失败:', error)
        favoriteMessage.value = '操作失败，请稍后重试'
        favoriteMessageType.value = 'error'
        showFavoriteMessage.value = true
        setTimeout(() => {
          showFavoriteMessage.value = false
        }, 2000)
      }
    }

    const addToCart = async () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      if (!canAddToCart.value) {
        alert('商品已售罄')
        return
      }

      try {
        const cartItem = {
          productId: product.id,
          variantId: selectedVariant.value?.id,
          name: product.name,
          image: product.image,
          price: selectedVariant.value?.price || product.price,
          quantity: quantity.value,
          stock: maxQuantity.value
        }

        // 检查库存是否足够
        if (cartItem.quantity > cartItem.stock) {
          alert('库存不足，当前库存：' + cartItem.stock)
          return
        }

        await store.dispatch('addToCart', cartItem)
        alert('已添加到购物车！')
      } catch (error) {
        console.error('添加购物车失败:', error)
        alert('添加购物车失败，请稍后重试')
      }
    }

    const increaseBuyQuantity = () => {
      if (buyQuantity.value < maxQuantity.value) {
        buyQuantity.value++
        buyError.value = ''
      }
    }

    const decreaseBuyQuantity = () => {
      if (buyQuantity.value > 1) {
        buyQuantity.value--
        buyError.value = ''
      }
    }

    const closeBuyDialog = () => {
      showBuyConfirmDialog.value = false
      buyQuantity.value = 1
      buyError.value = ''
    }

    const confirmBuy = async () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      // 检查库存
      if (buyQuantity.value > maxQuantity.value) {
        buyError.value = '库存不足'
        return
      }

      buyLoading.value = true
      try {
        // 调用store中的createOrder action
        const result = await store.dispatch('createOrder', {
          productId: product.id,
          quantity: buyQuantity.value
        })
        
        if (result.success) {
          // 订单创建成功后关闭弹窗
          closeBuyDialog()
          
          // 跳转到订单详情页面
          router.push({
            name: 'orderDetail',
            params: { id: result.data.id }
          })
          
          // 可选：更新本地商品库存状态
          if (selectedVariant.value) {
            selectedVariant.value.stock -= buyQuantity.value
          } else {
            product.stock -= buyQuantity.value
          }
        } else {
          // 处理错误消息
          if (result.message.includes('登录')) {
            router.push('/login')
          } else if (result.message.includes('库存')) {
            buyError.value = result.message
          } else {
            buyError.value = result.message || '订单创建失败，请稍后重试'
          }
        }
      } catch (error) {
        console.error('购买失败:', error)
        // 网络异常处理
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          buyError.value = '网络连接异常，请检查网络设置'
        } else if (error.name === 'AbortError') {
          buyError.value = '请求已取消'
        } else {
          buyError.value = '系统错误，请稍后重试'
        }
        
        // 显示具体错误信息（开发环境下）
        if (process.env.NODE_ENV === 'development') {
          console.error('详细错误:', error)
        }
      } finally {
        buyLoading.value = false
      }
    }

    onMounted(() => {
      // 模拟加载商品数据
      Object.assign(product, mockProduct)
      // 默认选择第一个有库存的变体
        if (product.variants && product.variants.length) {
          const availableVariant = product.variants.find(v => v.stock > 0)
          selectedVariant.value = availableVariant || product.variants[0]
        }
        
        // 监听网络状态变化
        window.addEventListener('online', () => {
          // 网络恢复时可以添加提示
        })
        
        window.addEventListener('offline', () => {
          // 网络断开时显示提示
          if (process.env.NODE_ENV === 'development') {
            console.log('网络连接已断开')
          }
        })
    })

    return {
      product,
      currentImage,
      selectedVariant,
      quantity,
      relatedProducts,
      handleImageError,
      getProductImage,
      isFavorited,
      favoritesCount,
      showFavoriteMessage,
      favoriteMessage,
      favoriteMessageType,
      showBuyConfirmDialog,
      buyQuantity,
      buyLoading,
      buyError,
      stockClass,
      stockText,
      maxQuantity,
      canAddToCart,
      canBuy,
      selectVariant,
      increaseQuantity,
      decreaseQuantity,
      increaseBuyQuantity,
      decreaseBuyQuantity,
      toggleFavorite,
      addToCart,
      closeBuyDialog,
      confirmBuy
    }
  }
}
</script>

<style scoped>
.product-gallery .main-image img {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

.image-thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.thumbnail.active {
  border-color: var(--primary-purple);
}

.thumbnail:hover {
  transform: scale(1.05);
}

.product-title {
  font-weight: 700;
  color: var(--dark-night);
  margin-bottom: 0.5rem;
}

.product-series {
  font-size: 1.1rem;
}

.btn-like {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.btn-like:hover {
  color: var(--neon-pink);
  transform: scale(1.1);
}

.favorite-count {
  background-color: var(--primary-purple);
  color: white;
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.favorite-message {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  color: white;
  font-size: 0.9rem;
  z-index: 10;
  animation: fadeInOut 2s ease-in-out;
}

.favorite-message.success {
  background-color: var(--success-color, #198754);
}

.favorite-message.warning {
  background-color: var(--warning-color, #ffc107);
  color: #212529;
}

.favorite-message.error {
  background-color: var(--danger-color, #dc3545);
  color: white;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translate(-50%, -10px); }
  20% { opacity: 1; transform: translate(-50%, 0); }
  80% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, 10px); }
}

.current-price {
  color: var(--primary-purple);
  font-weight: 700;
}

.original-price {
  font-size: 1.1rem;
}

.discount-badge {
  font-size: 0.875rem;
}

/* 库存状态样式 */
.stock-high {
  color: var(--success-color, #198754);
}

.stock-medium {
  color: var(--warning-color, #ffc107);
}

.stock-low {
  color: var(--danger-color, #dc3545);
  font-weight: bold;
}

.stock-out {
  color: #6c757d;
  text-decoration: line-through;
}

.variant-options .btn.active {
  background-color: var(--primary-purple);
  border-color: var(--primary-purple);
  color: white;
}

.quantity-controls {
  max-width: 200px;
}

.quantity-controls .form-control {
  width: 80px;
}

.quantity-controls .btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-services {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.review-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.nav-tabs .nav-link {
  color: #6c757d;
  font-weight: 500;
}

.nav-tabs .nav-link.active {
  color: var(--primary-purple);
  border-bottom: 3px solid var(--primary-purple);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-gallery .main-image img {
    height: 300px;
  }

  .thumbnail {
    width: 60px;
    height: 60px;
  }

  .product-actions .btn {
    margin-bottom: 0.5rem;
    flex: 1;
  }
  
  .favorite-message {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
    width: 100%;
    left: 0;
    transform: none;
    text-align: center;
  }
  
  .quantity-controls {
    max-width: 100%;
    margin-bottom: 1rem;
  }
  
  .quantity-controls .form-control {
    width: 60px;
  }
}

/* 购买确认弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: dialogSlideIn 0.3s ease-out;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  transition: color 0.3s ease;
}

.dialog-close:hover {
  color: #333;
}

.buy-info {
  margin-bottom: 1.5rem;
}

.buy-product-name {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.buy-variant {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.buy-product-price {
  color: var(--primary-purple);
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.buy-error,
.error-message {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  padding: 0.75rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.quantity-selector {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.quantity-label {
  margin-right: 1rem;
  font-weight: 500;
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.quantity-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6c757d;
  transition: all 0.3s ease;
}

.quantity-btn:hover:not(:disabled) {
  background-color: #f8f9fa;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 60px;
  text-align: center;
  border: none;
  font-size: 1rem;
}

.quantity-input:focus {
  outline: none;
}

.buy-total {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.btn-cancel:hover {
  background-color: #e9ecef;
}

.btn-confirm:disabled,
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: all;
}

/* 加载状态样式 */
.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin-top: -8px;
  margin-left: -8px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-confirm.btn-loading::after {
  border-top-color: white;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 576px) {
  .dialog-content {
    padding: 1.5rem;
    margin: 1rem;
    width: calc(100% - 2rem);
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .dialog-actions .btn {
    width: 100%;
    padding: 0.75rem;
  }
  
  .quantity-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quantity-label {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
  
  .quantity-control {
    justify-content: center;
  }
  
  .quantity-input {
    width: 80px;
  }
  
  .buy-total {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>