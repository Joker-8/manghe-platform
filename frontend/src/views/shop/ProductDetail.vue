<template>
  <div class="product-detail-page container mt-4">
    <div class="row">
      <!-- 商品图片 -->
      <div class="col-lg-6 mb-4">
        <div class="product-gallery">
          <div class="main-image mb-3">
            <img :src="product.image" :alt="product.name" class="img-fluid rounded">
          </div>
          <div class="image-thumbnails">
            <img
                v-for="(img, index) in product.images"
                :key="index"
                :src="img"
                :alt="product.name"
                class="thumbnail"
                :class="{ active: currentImage === index }"
                @click="currentImage = index"
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
              <button class="btn btn-like" @click="toggleFavorite">
                <i :class="['bi', isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart']"></i>
              </button>
            </div>
            <p class="product-series text-muted">{{ product.series }}</p>
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
                <button class="btn btn-primary w-100" @click="buyNow" :disabled="!canBuy">
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
      image: 'https://via.placeholder.com/600x600/6B21A8/FFFFFF?text=星空幻想',
      images: [
        'https://via.placeholder.com/600x600/6B21A8/FFFFFF?text=星空幻想',
        'https://via.placeholder.com/600x600/3B82F6/FFFFFF?text=侧面',
        'https://via.placeholder.com/600x600/8B5CF6/FFFFFF?text=背面',
        'https://via.placeholder.com/600x600/EC4899/FFFFFF?text=细节'
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
            'https://via.placeholder.com/100x100/6B21A8/FFFFFF?text=评价图1',
            'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=评价图2'
          ]
        }
      ]
    }

    const relatedProducts = ref([
      {
        id: 2,
        name: '森林物语系列',
        series: '季节限定',
        image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=森林物语',
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
        image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=海洋奇缘',
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

    const stockClass = computed(() => {
      if (product.stock === 0) return 'bg-danger'
      if (product.stock < 10) return 'bg-warning'
      return 'bg-success'
    })

    const stockText = computed(() => {
      if (product.stock === 0) return '缺货'
      if (product.stock < 10) return `仅剩 ${product.stock} 件`
      return '有货'
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

    const toggleFavorite = () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      if (isFavorited.value) {
        store.commit('REMOVE_FAVORITE', product.id)
      } else {
        store.commit('ADD_FAVORITE', product.id)
      }
    }

    const addToCart = () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      if (!canAddToCart.value) {
        alert('商品已售罄')
        return
      }

      const cartItem = {
        productId: product.id,
        variantId: selectedVariant.value?.id,
        name: product.name,
        image: product.image,
        price: selectedVariant.value?.price || product.price,
        quantity: quantity.value,
        stock: maxQuantity.value
      }

      store.dispatch('addToCart', cartItem)
      alert('已添加到购物车！')
    }

    const buyNow = () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      if (!canBuy.value) {
        alert('商品已售罄')
        return
      }

      // 直接跳转到订单确认页面
      const orderItems = [{
        productId: product.id,
        variantId: selectedVariant.value?.id,
        name: product.name,
        image: product.image,
        price: selectedVariant.value?.price || product.price,
        quantity: quantity.value
      }]

      console.log('立即购买:', orderItems)
      alert('跳转到订单确认页面...')
    }

    onMounted(() => {
      // 模拟加载商品数据
      Object.assign(product, mockProduct)
      // 默认选择第一个有库存的变体
      if (product.variants && product.variants.length) {
        const availableVariant = product.variants.find(v => v.stock > 0)
        selectedVariant.value = availableVariant || product.variants[0]
      }
    })

    return {
      product,
      currentImage,
      selectedVariant,
      quantity,
      relatedProducts,
      isFavorited,
      stockClass,
      stockText,
      maxQuantity,
      canAddToCart,
      canBuy,
      selectVariant,
      increaseQuantity,
      decreaseQuantity,
      toggleFavorite,
      addToCart,
      buyNow
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
}

.btn-like:hover {
  color: var(--neon-pink);
  transform: scale(1.1);
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
  }
}
</style>