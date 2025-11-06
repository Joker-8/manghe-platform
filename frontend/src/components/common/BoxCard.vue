<template>
  <div class="box-card mb-4">
    <div class="card h-100 position-relative cursor-pointer" @click="navigateToDetail">
      <!-- 商品图片 -->
      <div class="card-img-container position-relative overflow-hidden">
        <img
            :src="boxData.image"
            :alt="boxData.name"
            class="card-img-top"
            @load="imageLoaded = true"
        >
        <div v-if="!imageLoaded" class="skeleton-placeholder position-absolute top-0 start-0 w-100 h-100"></div>

        <!-- 标签 -->
        <div class="position-absolute top-0 start-0 m-2">
          <span v-if="boxData.isLimited" class="badge bg-danger">限量</span>
          <span v-if="boxData.isNew" class="badge bg-success ms-1">新品</span>
        </div>

        <!-- 收藏按钮 -->
        <button
            class="btn btn-like position-absolute top-0 end-0 m-2"
            @click.stop="toggleFavorite"
        >
          <i :class="['bi', isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart']"></i>
        </button>
      </div>

      <!-- 卡片内容 -->
      <div class="card-body d-flex flex-column">
        <h6 class="card-title fw-bold text-truncate">{{ boxData.name }}</h6>
        <p class="card-text text-muted small mb-2">{{ boxData.series }}</p>

        <!-- 评分 -->
        <div class="d-flex align-items-center mb-2">
          <div class="rating-stars">
            <i v-for="star in 5" :key="star"
               :class="['bi', star <= Math.floor(boxData.rating) ? 'bi-star-fill' : 'bi-star']"
               class="text-warning"></i>
          </div>
          <small class="text-muted ms-2">({{ boxData.rating }})</small>
        </div>

        <!-- 价格和库存 -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="price fw-bold text-primary">¥{{ boxData.price }}</span>
          <small class="text-muted">剩余: {{ boxData.stock }}</small>
        </div>

        <!-- 操作按钮 -->
        <div class="mt-auto">
          <button
              class="btn btn-primary w-100 mb-2"
              @click.stop="handleBuy"
              :disabled="boxData.stock === 0"
          >
            {{ boxData.stock === 0 ? '已售罄' : '立即购买' }}
          </button>
          <button
              class="btn btn-outline-secondary w-100"
              @click.stop="addToWishlist"
              :class="{ 'active': isFavorited }"
          >
            <i v-if="isFavorited" class="bi bi-heart-fill text-danger mr-1"></i>
            <i v-else class="bi bi-heart mr-1"></i>
            {{ isFavorited ? '已在心愿单' : '加入心愿单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'BoxCard',
  props: {
    boxData: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const imageLoaded = ref(false)
    const store = useStore()
    const router = useRouter()

    const isFavorited = computed(() => {
      return store.state.favorites.includes(props.boxData.id)
    })

    const toggleFavorite = () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      if (isFavorited.value) {
        store.commit('REMOVE_FAVORITE', props.boxData.id)
      } else {
        store.commit('ADD_FAVORITE', props.boxData.id)
      }
    }

    const navigateToDetail = () => {
      // 确保boxData.id存在
      if (props.boxData && props.boxData.id) {
        router.push(`/product/${props.boxData.id}`)
      }
    }

    const handleBuy = () => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }
      // 立即购买直接跳转到订单确认页面
      if (props.boxData && props.boxData.id) {
        // 创建临时订单数据
        const orderItem = {
          id: props.boxData.id,
          name: props.boxData.name,
          series: props.boxData.series,
          image: props.boxData.image,
          price: props.boxData.price,
          quantity: 1
        }
        // 保存到store
        store.commit('ADD_TO_CART', orderItem)
        // 跳转到订单确认页面
        router.push('/order-confirm')
      }
    }

    const addToWishlist = () => {
      if (!store.getters.isLoggedIn) {
        router.push({
          path: '/login',
          query: { redirect: `/product/${props.boxData.id}` }
        })
        return
      }
      
      // 检查是否已经在心愿单中
      if (isFavorited.value) {
        // 已在心愿单中，移除
        store.commit('REMOVE_FAVORITE', props.boxData.id)
        // 可以添加提示
        showToast('已从心愿单移除')
      } else {
        // 不在心愿单中，添加
        store.commit('ADD_FAVORITE', props.boxData.id)
        // 存储完整的商品信息（在实际应用中可能会单独保存到Vuex模块）
        if (store.commit && typeof store.commit === 'function') {
          try {
            store.commit('ADD_FAVORITE_ITEM', props.boxData)
          } catch (e) {
            // 如果ADD_FAVORITE_ITEM mutation不存在，静默忽略
          }
        }
        // 可以添加提示
        showToast('已添加到心愿单')
      }
    }
    
    // 简单的提示函数
    const showToast = (message) => {
      // 在实际项目中，这里可以使用更完善的Toast组件
      const toast = document.createElement('div')
      toast.className = 'toast-message position-fixed top-20 left-50 transform -translate-x-50 bg-dark text-white px-4 py-2 rounded shadow-lg z-50'
      toast.textContent = message
      document.body.appendChild(toast)
      
      setTimeout(() => {
        toast.style.opacity = '0'
        toast.style.transition = 'opacity 0.3s ease'
        setTimeout(() => {
          document.body.removeChild(toast)
        }, 300)
      }, 2000)
    }

    return {
      imageLoaded,
      isFavorited,
      toggleFavorite,
      navigateToDetail,
      handleBuy,
      addToWishlist
    }
  }
}
</script>

<style scoped>
.card-img-container {
  height: 250px;
  background: var(--moon-silver);
}

.card-img-top {
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.box-card:hover .card-img-top {
  transform: scale(1.05);
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(107, 33, 168, 0.15);
  transition: all 0.3s ease;
}

.btn-like {
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-like:hover {
  background: white;
  transform: scale(1.1);
}

.price {
  color: var(--primary-purple) !important;
  font-size: 1.25rem;
}
</style>