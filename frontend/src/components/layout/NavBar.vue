<template>
  <nav class="navbar navbar-expand-lg fixed-top navbar-dark brand-gradient" v-if="!shouldHideNav">
    <div class="container">
      <!-- 品牌Logo - 使用图片 -->
      <router-link class="navbar-brand fw-bold d-flex align-items-center" to="/">
        <img
            :src="logoImage"
            alt="芒盒"
            class="navbar-logo"
            @error="handleImageError"
        >
      </router-link>

      <!-- 搜索框 -->
      <div class="search-container mx-3 flex-grow-1" v-if="!isMobile">
        <div class="input-group">
          <input
              type="text"
              class="form-control"
              placeholder="搜索盲盒系列..."
              v-model="searchKeyword"
          >
          <button class="btn btn-light" type="button">
            <i class="bi bi-search"></i>
          </button>
        </div>
      </div>

      <!-- 导航链接 -->
      <div class="navbar-nav align-items-center">
        <router-link class="nav-link" to="/shop">商城</router-link>
        <router-link class="nav-link" to="/collection">收藏馆</router-link>
        <router-link class="nav-link" to="/community">社区</router-link>

        <!-- 用户相关 -->
        <div class="nav-item dropdown" v-if="isLoggedIn">
          <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
            <img :src="avatar" class="user-avatar rounded-circle me-2" alt="头像" @error="handleAvatarError">
            <span>{{ username }}</span>
          </a>
          <ul class="dropdown-menu">
            <li><router-link class="dropdown-item" to="/profile">个人中心</router-link></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" @click="handleLogout">退出登录</a></li>
          </ul>
        </div>

        <div v-else>
          <router-link class="btn btn-outline-light me-2" to="/login">登录</router-link>
          <router-link class="btn btn-light" to="/register">注册</router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

// 直接导入图片
import logoImage from '@/assets/images/Logo.png'

export default {
  name: 'NavBar',
  setup() {
    const searchKeyword = ref('')
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const isMobile = computed(() => window.innerWidth <= 768)
    const isLoggedIn = computed(() => store.getters.isLoggedIn)
    const username = computed(() => store.getters.username || '用户')
    const avatar = computed(() => store.getters.avatar || getDefaultAvatar())

    // 检查是否需要隐藏导航栏
    const shouldHideNav = computed(() => {
      return route.meta.hideNav || false
    })

    const imageError = ref(false)

    const handleImageError = () => {
      console.error('Logo图片加载失败')
      imageError.value = true
    }

    const handleAvatarError = (event) => {
      console.error('头像图片加载失败，使用默认头像')
      event.target.src = getDefaultAvatar()
    }

    // 获取默认头像（使用base64 SVG作为备用）
    const getDefaultAvatar = () => {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTE2IDE3QzE4LjIwOTEgMTcgMjAgMTUuMjA5MSAyMCAxM0MyMCAxMC43OTA5IDE4LjIwOTEgOSAxNiA5QzEzLjc5MDkgOSAxMiAxMC43OTA5IDEyIDEzQzEyIDE1LjIwOTEgMTMuNzkwOSAxNyAxNiAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAxOEMxMS41ODIyIDE4IDggMjAuNjg2MyA4IDI0SDE2SDI0QzI0IDIwLjY4NjMgMjAuNDE3OCAxOCAxNiAxOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
    }

    const handleLogout = () => {
      store.dispatch('logout')
      router.push('/')
    }

    return {
      searchKeyword,
      isMobile,
      isLoggedIn,
      username,
      avatar,
      logoImage,
      imageError,
      shouldHideNav,
      handleImageError,
      handleAvatarError,
      handleLogout
    }
  }
}
</script>

<style scoped>
.navbar {
  box-shadow: 0 2px 20px rgba(0,0,0,0.1);
  padding: 0.8rem 0;
}

.navbar-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.user-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
}

.search-container {
  max-width: 400px;
}

.nav-link {
  font-weight: 500;
  margin: 0 0.5rem;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: rgba(255,255,255,0.8) !important;
}

/* 移动端调整 */
@media (max-width: 768px) {
  .navbar-logo {
    height: 35px;
  }

  .search-container {
    max-width: 200px;
  }
}
</style>