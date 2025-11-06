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
              @keyup.enter="handleSearch"
              @focus="showSearchSuggestions = true"
              @blur="handleSearchBlur"
          >
          <button class="btn btn-light" type="button" @click="handleSearch">
            <i class="bi bi-search"></i>
          </button>
          <!-- 搜索建议 -->
          <div v-if="showSearchSuggestions && searchKeyword && searchSuggestions.length > 0" class="search-suggestions">
            <div 
                v-for="suggestion in searchSuggestions" 
                :key="suggestion"
                class="suggestion-item"
                @mousedown="selectSuggestion(suggestion)"
            >
              {{ suggestion }}
            </div>
          </div>
        </div>
      </div>

      <!-- 导航链接 -->
      <div class="navbar-nav align-items-center">
        <router-link class="nav-link" to="/shop">商城</router-link>
        <router-link class="nav-link" to="/collection">收藏馆</router-link>
        <router-link class="nav-link" to="/community">社区</router-link>

        <!-- 用户相关 -->
        <div class="nav-item position-relative" v-if="isLoggedIn">
          <div class="user-dropdown position-relative">
            <a class="nav-link d-flex align-items-center" href="#" role="button" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
              <img :src="avatar" class="user-avatar rounded-circle" alt="头像" @error="handleAvatarError">
            </a>
            <ul class="dropdown-menu" v-show="showDropdown" @mouseenter="handleMenuMouseEnter" @mouseleave="handleMenuMouseLeave">
              <li class="dropdown-header">{{ userNickname }}</li>
              <li><router-link class="dropdown-item" to="/profile">个人中心</router-link></li>
              <li><router-link class="dropdown-item" to="/edit-profile">编辑资料</router-link></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" @click="handleLogout">退出登录</a></li>
            </ul>
          </div>
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
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

// 直接导入图片
// 使用public目录下的Logo
const logoImage = '/images/Logo.png'

export default {
  name: 'NavBar',
  setup() {
    const searchKeyword = ref('')
    const showSearchSuggestions = ref(false)
    const searchSuggestions = ref([])
    const showDropdown = ref(false)
    const store = useStore()
    const router = useRouter()
    const route = useRoute()
    
    // 模拟搜索建议数据
    const mockSuggestions = [
      '星空幻想盲盒', '城市探险', '海洋奇缘', '童话世界', '未来科技',
      '复古经典', '夏日限定', '限量款式', '新品上市', '热销商品'
    ]

    const isMobile = computed(() => window.innerWidth <= 768)
    const isLoggedIn = computed(() => store.getters.isLoggedIn)
    const username = computed(() => store.getters.username || '用户')
    const userNickname = computed(() => store.getters.nickname || username.value || '用户')
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

    // 监听搜索关键词变化，更新搜索建议
    const updateSearchSuggestions = () => {
      if (searchKeyword.value.trim()) {
        // 过滤搜索建议
        searchSuggestions.value = mockSuggestions.filter(item => 
          item.toLowerCase().includes(searchKeyword.value.toLowerCase())
        )
      } else {
        searchSuggestions.value = []
      }
    }
    
    // 添加搜索关键词的监听器
    watch(searchKeyword, () => {
      updateSearchSuggestions()
    })
    
    // 处理搜索
    const handleSearch = () => {
      const keyword = searchKeyword.value.trim()
      if (keyword) {
        showSearchSuggestions.value = false
        // 跳转到商城页面并带上搜索参数
        router.push({
          path: '/shop',
          query: { search: keyword }
        })
      }
    }

    // 选择搜索建议
    const selectSuggestion = (suggestion) => {
      searchKeyword.value = suggestion
      handleSearch()
    }

    // 处理搜索框失焦
    const handleSearchBlur = () => {
      // 延迟隐藏，以便用户可以点击建议
      setTimeout(() => {
        showSearchSuggestions.value = false
      }, 200)
    }

    // 下拉菜单延迟控制
    let dropdownTimer = null
    
    const handleMouseEnter = () => {
      // 清除可能存在的定时器
      if (dropdownTimer) {
        clearTimeout(dropdownTimer)
      }
      showDropdown.value = true
    }
    
    const handleMouseLeave = () => {
      // 延迟关闭，给用户足够时间移动鼠标
      dropdownTimer = setTimeout(() => {
        showDropdown.value = false
      }, 500) // 500毫秒延迟，足够用户移动鼠标
    }
    
    const handleMenuMouseEnter = () => {
      // 当鼠标进入下拉菜单时，清除定时器
      if (dropdownTimer) {
        clearTimeout(dropdownTimer)
      }
      showDropdown.value = true
    }
    
    const handleMenuMouseLeave = () => {
      // 当下拉菜单失去焦点时，延迟关闭
      dropdownTimer = setTimeout(() => {
        showDropdown.value = false
      }, 200)
    }
    
    const handleLogout = () => {
      if (confirm('确定要退出登录吗？')) {
        store.dispatch('logout')
        router.push('/')
      }
    }

    return {
      searchKeyword,
      showSearchSuggestions,
      searchSuggestions,
      showDropdown,
      isMobile,
      isLoggedIn,
      username,
      userNickname,
      avatar,
      logoImage,
      imageError,
      shouldHideNav,
      handleSearch,
      selectSuggestion,
      handleSearchBlur,
      updateSearchSuggestions,
      handleImageError,
      handleAvatarError,
      handleLogout,
      handleMouseEnter,
      handleMouseLeave,
      handleMenuMouseEnter,
      handleMenuMouseLeave
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
  width: 36px;
  height: 36px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.user-dropdown:hover .user-avatar {
  transform: scale(1.1);
}

.user-dropdown .dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  left: auto;
  margin-top: 8px;
  min-width: 160px;
  display: block;
  z-index: 1000;
  background-color: white;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,.1);
  animation: fadeIn 0.2s ease;
}

.user-dropdown .dropdown-header {
  padding: 12px 16px;
  font-weight: 500;
  color: var(--primary-purple);
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-container {
  max-width: 400px;
  position: relative;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #dee2e6;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #333;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
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