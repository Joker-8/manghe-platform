import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/common/Home.vue'
import Login from '@/views/auth/Login.vue'
import Register from '@/views/auth/Register.vue'
import Shop from '@/views/shop/Shop.vue'
import ProductDetail from '@/views/shop/ProductDetail.vue'
import Collection from '@/views/collection/Collection.vue'
import Community from '@/views/community/Community.vue'
import Profile from '@/views/user/Profile.vue'
import Orders from '@/views/user/Orders.vue'
import Settings from '@/views/user/Settings.vue'
import About from '@/views/common/About.vue'
import OpenBox from '@/views/open/OpenBox.vue'
import NotFound from '@/views/common/NotFound.vue'

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
        path: '/product/:id',
        name: 'product',
        component: ProductDetail,
        props: true
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
    // 404 页面处理
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFound
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
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