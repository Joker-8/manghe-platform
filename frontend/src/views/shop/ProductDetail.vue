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
              <span class="text-muted ms-3 purchase-limit">最多购买 {{ maxQuantity }} 件</span>
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

    // 模拟商品数据库
    const mockProducts = [
      {
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
              avatar: '/images/default-avatar.svg'
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
      },
      {
        id: 2,
        name: '森林物语系列 - 精灵守护者',
        series: '森林物语系列 第二弹',
        image: '/images/box2.jpg',
        images: [
          '/images/box2.jpg',
          '/images/box1.jpg',
          '/images/box3.jpg'
        ],
        price: 79,
        originalPrice: 89,
        discount: 9,
        rating: 4.6,
        reviewCount: 89,
        stock: 89,
        soldCount: 321,
        variants: [
          { id: 4, name: '标准版', price: 79, stock: 89 },
          { id: 5, name: '限定版', price: 119, stock: 23 }
        ],
        description: `
          <h4>产品介绍</h4>
          <p>森林物语系列以神秘的森林世界为背景，每个盲盒都藏着独特的森林精灵。</p>

          <h5>产品特点：</h5>
          <ul>
            <li>自然元素设计，色彩清新</li>
            <li>环保材质，安全无害</li>
            <li>隐藏款概率3%，造型独特</li>
            <li>全套10个常规款+1个隐藏款</li>
          </ul>
        `,
        specifications: [
          { name: '系列', value: '森林物语系列 第二弹' },
          { name: '材质', value: '环保PVC' },
          { name: '尺寸', value: '7×7×10cm' },
          { name: '适合年龄', value: '12岁以上' }
        ],
        reviews: []
      },
      {
        id: 3,
        name: '海洋奇缘系列 - 深海探险者',
        series: '海洋奇缘系列 特别版',
        image: '/images/box3.jpg',
        images: [
          '/images/box3.jpg',
          '/images/box4.jpg',
          '/images/box1.jpg'
        ],
        price: 99,
        rating: 4.9,
        reviewCount: 0,
        stock: 45,
        soldCount: 123,
        variants: [
          { id: 6, name: '珍藏版', price: 99, stock: 45 }
        ],
        description: `
          <h4>产品介绍</h4>
          <p>海洋奇缘系列带你探索神秘的海底世界，邂逅各种海洋生物。</p>

          <h5>产品特点：</h5>
          <ul>
            <li>海洋主题设计，色彩丰富</li>
            <li>高细节还原，栩栩如生</li>
            <li>限量发行，收藏价值高</li>
          </ul>
        `,
        specifications: [
          { name: '系列', value: '海洋奇缘系列 特别版' },
          { name: '材质', value: '优质PVC' },
          { name: '尺寸', value: '9×9×11cm' }
        ],
        reviews: []
      },
      {
        id: 4,
        name: '城市探险系列 - 都市漫游者',
        series: '城市探险系列 第二弹',
        image: '/images/box4.jpg',
        images: [
          '/images/box4.jpg',
          '/images/box2.jpg',
          '/images/box3.jpg'
        ],
        price: 85,
        originalPrice: 95,
        discount: 9,
        rating: 4.7,
        reviewCount: 67,
        stock: 120,
        soldCount: 289,
        variants: [
          { id: 7, name: '标准版', price: 85, stock: 120 },
          { id: 8, name: '城市限定', price: 109, stock: 56 }
        ],
        description: `
          <h4>产品介绍</h4>
          <p>城市探险系列展现现代都市生活的多彩面貌，每个角色都有独特的都市风格。</p>
        `,
        specifications: [
          { name: '系列', value: '城市探险系列 第二弹' },
          { name: '材质', value: 'PVC+ABS' },
          { name: '尺寸', value: '7×7×11cm' }
        ],
        reviews: []
      }
    ]

    const relatedProducts = ref([])
    
    // 根据商品ID获取商品数据
    const getProductById = (id) => {
      const parsedId = parseInt(id)
      return mockProducts.find(p => p.id === parsedId) || mockProducts[0]
    }
    
    // 获取相关推荐商品
    const getRelatedProducts = (currentProductId) => {
      return mockProducts
        .filter(p => p.id !== currentProductId)
        .map(p => ({
          id: p.id,
          name: p.name,
          series: p.series,
          image: p.image,
          price: p.price,
          rating: p.rating,
          stock: p.stock,
          isLimited: p.variants?.some(v => v.name.includes('限定') || v.name.includes('收藏')) || false,
          isNew: p.soldCount < 100
        }))
    }

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

      // 创建订单数据
      const orderItem = {
        productId: product.id,
        variantId: selectedVariant.value?.id,
        name: product.name,
        series: product.series,
        image: product.image,
        price: selectedVariant.value?.price || product.price,
        quantity: quantity.value
      }

      // 保存到store
      store.commit('ADD_TO_CART', orderItem)
      // 直接跳转到订单确认页面
      router.push('/order-confirm')
    }

    onMounted(() => {
      // 从路由参数获取商品ID
      const productId = route.params.id
      const currentProduct = getProductById(productId)
      
      // 加载商品数据
      Object.assign(product, currentProduct)
      
      // 设置相关推荐商品
      relatedProducts.value = getRelatedProducts(currentProduct.id)
      
      // 默认选择第一个有库存的变体
      if (product.variants && product.variants.length) {
        const availableVariant = product.variants.find(v => v.stock > 0)
        selectedVariant.value = availableVariant || product.variants[0]
      }
      
      // 检查是否有buyNow参数，如果有且用户已登录，则自动触发购买
      const shouldBuyNow = route.query.buyNow === 'true'
      if (shouldBuyNow && store.getters.isLoggedIn) {
        // 延迟一点时间，确保UI已经渲染完成
        setTimeout(() => {
          if (canBuy.value) {
            buyNow()
          }
        }, 500)
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
  .purchase-limit {
    display: inline-block;
    white-space: nowrap;
  }
</style>