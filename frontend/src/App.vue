<template>
  <div id="app">
    <NavBar v-if="!shouldHideNav" />
    <main class="main-content">
      <router-view />
    </main>
    <Footer v-if="showFooter" />
    <MobileTabBar v-if="showMobileTabBar" />
  </div>
</template>

<script>
import NavBar from '@/components/layout/NavBar.vue'
import Footer from '@/components/layout/Footer.vue'
import MobileTabBar from '@/components/layout/MobileTabBar.vue'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

export default {
  name: 'App',
  components: {
    NavBar,
    Footer,
    MobileTabBar
  },
  setup() {
    const route = useRoute()
    const store = useStore()

    const isMobile = computed(() => window.innerWidth <= 768)

    // 需要隐藏导航的路由
    const hideNavRoutes = ['login', 'register']

    // 需要显示底部导航的路由
    const footerRoutes = ['home', 'shop', 'collection', 'community', 'about', 'product', 'privacy-policy', 'terms-of-service', 'legal-notice']

    // 需要显示移动端标签栏的路由
    const mobileTabRoutes = ['home', 'shop', 'open', 'community', 'profile']

    const shouldHideNav = computed(() => {
      return hideNavRoutes.includes(route.name)
    })

    const showFooter = computed(() => {
      return footerRoutes.includes(route.name) && !isMobile.value
    })

    const showMobileTabBar = computed(() => {
      return isMobile.value && mobileTabRoutes.includes(route.name)
    })

    // 应用启动时初始化
    onMounted(() => {
      store.dispatch('initializeStore')

      // 监听窗口大小变化
      window.addEventListener('resize', handleResize)
    })

    const handleResize = () => {
      // 重新计算响应式状态
    }

    return {
      shouldHideNav,
      showFooter,
      showMobileTabBar
    }
  }
}
</script>

<style scoped>
.main-content {
  min-height: calc(100vh - 120px);
  padding-top: 76px;
  padding-bottom: 60px;
}

/* 移动端调整 */
@media (max-width: 768px) {
  .main-content {
    padding-bottom: 70px;
  }
}
</style>