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

      <!-- 高级搜索框 -->
      <div class="search-container mx-3 flex-grow-1" v-if="!isMobile">
        <AdvancedSearch 
          placeholder="搜索盲盒名称或系列..."
          :items="searchItems"
          @search="handleSearch"
        />
      </div>

      <!-- 导航链接 -->
      <div class="navbar-nav align-items-center">
        <router-link class="nav-link" to="/shop">商城</router-link>
        <router-link class="nav-link" to="/collection">收藏馆</router-link>
        <router-link class="nav-link" to="/community">社区</router-link>

        <!-- 用户相关 -->
        <div class="nav-item dropdown" v-if="isLoggedIn">
          <a class="nav-link d-flex align-items-center position-relative" href="#" role="button">
            <img :src="avatar" class="user-avatar rounded-circle" alt="头像" @error="handleAvatarError">
          </a>
          <ul class="dropdown-menu">
            <li class="dropdown-item disabled">{{ nickname }}</li>
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
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import AdvancedSearch from '@/components/common/AdvancedSearch.vue'

// 直接导入图片
// 使用public目录下的Logo
const logoImage = '/images/Logo.png'

// 模拟商品数据，用于搜索建议
const mockBoxes = [
  {
    id: 1,
    name: '星空幻想盲盒',
    series: '星空幻想系列'
  },
  {
    id: 2,
    name: '森林精灵盲盒',
    series: '森林物语系列'
  },
  {
    id: 3,
    name: '海洋探险盲盒',
    series: '海洋探险系列'
  },
  {
    id: 4,
    name: '城市霓虹盲盒',
    series: '城市霓虹系列'
  },
  {
    id: 5,
    name: '童话梦境盲盒',
    series: '童话梦境系列'
  },
  {
    id: 6,
    name: '复古经典盲盒',
    series: '复古经典系列'
  },
  {
    id: 7,
    name: '夏日限定盲盒',
    series: '夏日限定系列'
  }
]

export default {
  name: 'NavBar',
  components: {
    AdvancedSearch
  },
  setup() {
    const searchItems = ref([])
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    const isMobile = computed(() => window.innerWidth <= 768)
    const isLoggedIn = computed(() => store.getters.isLoggedIn)
    const username = computed(() => store.getters.username || '用户')
    const nickname = computed(() => store.getters.nickname)
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
    
    const handleSearch = (keyword) => {
      console.log('搜索关键词:', keyword)
      // 搜索逻辑已在组件内部处理
    }
    
    // 加载搜索数据
    const loadSearchData = () => {
      // 实际项目中这里应该从API获取商品数据
      // 现在使用模拟数据
      searchItems.value = [...mockBoxes]
    }
    
    onMounted(() => {
      loadSearchData()
    })

    return {
      searchItems,
      isMobile,
      isLoggedIn,
      username,
      nickname,
      avatar,
      logoImage,
      imageError,
      shouldHideNav,
      handleImageError,
      handleAvatarError,
      handleLogout,
      handleSearch
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
  cursor: pointer;
}

/* 默认情况下（桌面端）实现鼠标悬停显示下拉菜单 */
.dropdown:hover .dropdown-menu {
  display: block;
  margin-top: 0;
}

/* 确保下拉菜单正常显示 */
.dropdown-menu {
  margin-top: 0.5rem;
}

/* 桌面端强制使用悬停显示 */
@media (min-width: 769px) {
  .dropdown-menu {
    display: none;
  }
  
  .dropdown:hover .dropdown-menu {
    display: block;
  }
}

/* 昵称显示样式 */
.dropdown-item:disabled {
  color: #6c757d;
  background-color: transparent;
  font-weight: 500;
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
  
  /* 移动端移除悬停效果，保持点击交互 */
  .dropdown:hover .dropdown-menu {
    display: none;
  }
}
</style>