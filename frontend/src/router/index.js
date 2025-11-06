import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/common/Home.vue'
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import Shop from '@/views/shop/Shop.vue'
import ProductDetail from '@/views/shop/ProductDetail.vue'
import Cart from '@/views/shop/Cart.vue'
import OrderConfirm from '@/views/shop/OrderConfirm.vue'
import OrderDetail from '@/views/user/OrderDetail.vue'
import Collection from '@/views/collection/Collection.vue'
import Community from '@/views/community/Community.vue'
import Profile from '@/views/user/Profile.vue'
import Orders from '@/views/user/Orders.vue'
import Settings from '@/views/user/Settings.vue'
import EditProfile from '@/views/user/EditProfile.vue'
import About from '@/views/common/About.vue'
import OpenBox from '@/views/open/OpenBox.vue'
import NotFound from '@/views/common/NotFound.vue'
// 客户服务页面
import HelpCenter from '@/views/customer-service/HelpCenter.vue'
import Contact from '@/views/customer-service/Contact.vue'
import ReturnPolicy from '@/views/customer-service/ReturnPolicy.vue'
import ShippingInfo from '@/views/customer-service/ShippingInfo.vue'
// 法律相关页面
import PrivacyPolicy from '@/views/legal/PrivacyPolicy.vue'
import TermsOfService from '@/views/legal/TermsOfService.vue'
import LegalNotice from '@/views/legal/LegalNotice.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { hideNav: true, requiresGuest: true }
    },
    {
        path: '/register',
        name: 'register',
        component: Register,
        meta: { hideNav: true, requiresGuest: true }
    },
    {
        path: '/shop',
        name: 'shop',
        component: Shop
    },
    {
        path: '/cart',
        name: 'cart',
        component: Cart,
        meta: { requiresAuth: true }
    },
    {
        path: '/product/:id',
        name: 'product',
        component: ProductDetail,
        props: true
    },
    {
        path: '/order-confirm',
        name: 'order-confirm',
        component: OrderConfirm,
        meta: { requiresAuth: true }
    },
    {
        path: '/order/:id',
        name: 'order-detail',
        component: OrderDetail,
        props: true,
        meta: { requiresAuth: true }
    },
    {
        path: '/collection',
        name: 'collection',
        component: Collection,
        meta: { requiresAuth: true }
    },
    {
        path: '/community',
        name: 'community',
        component: Community
    },
    {
        path: '/profile',
        name: 'profile',
        component: Profile,
        meta: { requiresAuth: true }
    },
    {
        path: '/orders',
        name: 'orders',
        component: Orders,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'settings',
        component: Settings,
        meta: { requiresAuth: true }
    },
    {
        path: '/edit-profile',
        name: 'edit-profile',
        component: EditProfile,
        meta: { requiresAuth: true }
    },
    {
        path: '/about',
        name: 'about',
        component: About
    },
    {
        path: '/open',
        name: 'open',
        component: OpenBox,
        meta: { requiresAuth: true }
    },
    // 客户服务相关页面
    {
        path: '/customer-service/help',
        name: 'help-center',
        component: HelpCenter
    },
    {
        path: '/customer-service/contact',
        name: 'contact',
        component: Contact
    },
    {
        path: '/customer-service/return-policy',
        name: 'return-policy',
        component: ReturnPolicy
    },
    {
        path: '/customer-service/shipping-info',
        name: 'shipping-info',
        component: ShippingInfo
    },
    
    // 法律相关页面
    {
        path: '/privacy-policy',
        name: 'privacy-policy',
        component: PrivacyPolicy
    },
    {
        path: '/terms-of-service',
        name: 'terms-of-service',
        component: TermsOfService
    },
    {
        path: '/legal-notice',
        name: 'legal-notice',
        component: LegalNotice
    },
    // 404 页面处理
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFound
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    // 页面跳转时自动滚动到顶部
    scrollBehavior(to, from, savedPosition) {
        // 如果是页面内导航或有保存的滚动位置，则使用保存的位置
        if (savedPosition || (to.name === from.name && Object.keys(to.params).length === Object.keys(from.params).length)) {
            return savedPosition || undefined
        }
        // 否则滚动到顶部
        return { top: 0 }
    }
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const isLoggedIn = localStorage.getItem('token') // 或者从store获取

    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login')
    } else if (to.meta.requiresGuest && isLoggedIn) {
        next('/')
    } else {
        next()
    }
})

export default router