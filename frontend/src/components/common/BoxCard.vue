<template>
  <div class="box-card mb-4">
    <div class="card h-100 position-relative" @click="navigateToDetail">
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
          >
            加入心愿单
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

    // 商品卡片点击跳转详情页
    const navigateToDetail = () => {
      router.push(`/product/${props.boxData.id}`)
    }

    const toggleFavorite = () => {
      if (!store.getters.isLoggedIn) {
        // 跳转到登录页面
        router.push('/login')
        return
      }

      if (isFavorited.value) {
        store.commit('REMOVE_FAVORITE', props.boxData.id)
      } else {
        store.commit('ADD_FAVORITE', props.boxData.id)
      }
    }

    const handleBuy = async () => {
      if (!store.getters.isLoggedIn) {
        // 跳转到登录页面
        router.push('/login')
        return
      }
      
      try {
        // 调用createOrder action创建订单
        const result = await store.dispatch('createOrder', {
          productId: props.boxData.id,
          quantity: 1
        })
        
        if (result.success) {
          console.log('购买成功:', result.data)
          // 可以添加购买成功后的提示和页面跳转
          router.push('/orders')
        } else {
          console.error('购买失败:', result.message)
          alert(`购买失败: ${result.message}`)
        }
      } catch (error) {
        console.error('购买过程中发生错误:', error)
        alert('购买过程中发生错误，请重试')
      }
    }

    const addToWishlist = () => {
      if (!store.getters.isLoggedIn) {
        // 跳转到登录页面
        router.push('/login')
        return
      }
      
      // 添加到心愿单
      if (!isFavorited.value) {
        store.commit('ADD_FAVORITE', props.boxData.id)
        console.log('已添加到心愿单:', props.boxData)
      } else {
        console.log('商品已在心愿单中:', props.boxData)
      }
    }

    return {
      imageLoaded,
      isFavorited,
      navigateToDetail,
      toggleFavorite,
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