<template>
  <nav class="mobile-tab-bar">
    <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.path"
        class="tab-item"
        :class="{ active: $route.path === tab.path }"
    >
      <img
          v-if="tab.iconType === 'image'"
          :src="getTabImage(tab.name)"
          :alt="tab.label"
          class="tab-image"
          :class="{ 'active': $route.path === tab.path }"
      >
      <i v-else :class="['tab-icon', tab.icon]"></i>
      <span class="tab-label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 导入底部导航栏图标图片
// 使用public目录下的图标资源
const homeIcon = '/images/tab-icons/home.png'
const homeActiveIcon = '/images/tab-icons/home-active.png'
const shopIcon = '/images/tab-icons/shop.png'
const shopActiveIcon = '/images/tab-icons/shop-active.png'
const openIcon = '/images/tab-icons/open.png'
const openActiveIcon = '/images/tab-icons/open-active.png'
const communityIcon = '/images/tab-icons/community.png'
const communityActiveIcon = '/images/tab-icons/community-active.png'
const profileIcon = '/images/tab-icons/profile.png'
const profileActiveIcon = '/images/tab-icons/profile-active.png'

export default {
  name: 'MobileTabBar',
  setup() {
    const route = useRoute()

    const tabs = [
      {
        name: 'home',
        path: '/',
        icon: 'bi-house',
        label: '首页',
        iconType: 'image'
      },
      {
        name: 'shop',
        path: '/shop',
        icon: 'bi-grid',
        label: '商城',
        iconType: 'image'
      },
      {
        name: 'open',
        path: '/open',
        icon: 'bi-gift',
        label: '开盒',
        iconType: 'image'
      },
      {
        name: 'community',
        path: '/community',
        icon: 'bi-people',
        label: '社区',
        iconType: 'image'
      },
      {
        name: 'profile',
        path: '/profile',
        icon: 'bi-person',
        label: '我的',
        iconType: 'image'
      }
    ]

    // 获取标签图标图片
    const getTabImage = (tabName) => {
      const isActive = route.path === tabs.find(tab => tab.name === tabName)?.path

      const iconMap = {
        home: isActive ? homeActiveIcon : homeIcon,
        shop: isActive ? shopActiveIcon : shopIcon,
        open: isActive ? openActiveIcon : openIcon,
        community: isActive ? communityActiveIcon : communityIcon,
        profile: isActive ? profileActiveIcon : profileIcon
      }

      return iconMap[tabName] || homeIcon
    }

    const activeTab = computed(() => {
      return tabs.find(tab => tab.path === route.path)?.name || 'home'
    })

    return {
      tabs,
      activeTab,
      getTabImage
    }
  }
}
</script>

<style scoped>
.mobile-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0;
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  border-top: 1px solid #e9ecef;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  padding: 0.5rem;
  flex: 1;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin: 0 0.25rem;
}

.tab-item:hover {
  background: rgba(107, 33, 168, 0.05);
}

.tab-item.active {
  color: var(--primary-purple);
}

.tab-item.active .tab-icon {
  transform: translateY(-2px);
}

.tab-icon {
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;
}

.tab-image {
  width: 24px;
  height: 24px;
  margin-bottom: 0.25rem;
  transition: all 0.3s ease;
  filter: grayscale(100%) opacity(0.6);
}

.tab-item.active .tab-image {
  filter: none;
  transform: translateY(-2px);
}

.tab-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6c757d;
  transition: color 0.3s ease;
}

.tab-item.active .tab-label {
  color: var(--primary-purple);
  font-weight: 600;
}

/* 非活跃状态的颜色 */
.tab-item:not(.active) .tab-icon {
  color: #6c757d;
}

/* 响应式设计 - 只在移动端显示 */
@media (min-width: 769px) {
  .mobile-tab-bar {
    display: none;
  }
}

/* 安全区域适配（针对有刘海屏的手机） */
@supports (padding: max(0px)) {
  .mobile-tab-bar {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}
</style>