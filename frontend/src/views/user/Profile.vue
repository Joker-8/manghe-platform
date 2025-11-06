<template>
  <div class="profile-page container mt-4">
    <div class="row">
      <div class="col-md-4 mb-4">
        <!-- 用户信息卡片 -->
        <div class="card">
          <div class="card-body text-center">
            <img
                :src="userAvatar"
                class="rounded-circle mb-3 user-profile-avatar"
                alt="用户头像"
                @error="handleAvatarError"
            >
            <h4>{{ userInfo.nickname || userInfo.name }}</h4>
            <p class="text-muted">@{{ userInfo.username }}</p>
            <p v-if="userInfo.email" class="text-sm text-muted">{{ userInfo.email }}</p>

            <!-- 会员等级 -->
            <div class="membership-level mb-3">
              <span class="badge bg-warning">{{ userInfo.level }}</span>
            </div>

            <div class="d-flex justify-content-around mb-3">
              <div class="text-center">
                <div class="h5 mb-0">{{ userInfo.followers }}</div>
                <small class="text-muted">粉丝</small>
              </div>
              <div class="text-center">
                <div class="h5 mb-0">{{ userInfo.following }}</div>
                <small class="text-muted">关注</small>
              </div>
              <div class="text-center">
                <div class="h5 mb-0">{{ userInfo.posts }}</div>
                <small class="text-muted">动态</small>
              </div>
            </div>
            <div class="d-grid gap-2">
              <router-link to="/edit-profile" class="btn btn-outline-primary w-100">编辑资料</router-link>
              <button class="btn btn-outline-danger w-100" @click="confirmDeleteAccount">注销账号</button>
            </div>
          </div>
        </div>

        <!-- 积分信息 -->
        <div class="card mt-3">
          <div class="card-body">
            <h6 class="card-title">积分信息</h6>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span>当前积分</span>
              <strong class="text-warning">{{ userInfo.points }} 分</strong>
            </div>
            <div class="progress mb-3" style="height: 8px;">
              <div class="progress-bar bg-warning" :style="{ width: progressWidth }"></div>
            </div>
            <div class="d-flex justify-content-between align-items-center">
              <span>下一等级</span>
              <span class="badge bg-primary">{{ userInfo.nextLevel }}</span>
            </div>
          </div>
        </div>

        <!-- 成就系统 -->
        <div class="card mt-3">
          <div class="card-body">
            <h6 class="card-title">我的成就</h6>
            <div class="achievements-grid">
              <div v-for="achievement in achievements" :key="achievement.id" class="achievement-item text-center">
                <div class="achievement-icon mb-2">
                  <i :class="['bi', achievement.icon]"></i>
                </div>
                <small class="d-block">{{ achievement.name }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <!-- 统计卡片 -->
        <div class="row mb-4">
          <div class="col-md-4 mb-3">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-primary">
                  <i class="bi bi-box-seam"></i>
                </div>
                <h4 class="text-primary">{{ stats.totalBoxes }}</h4>
                <p class="text-muted mb-0">购买盲盒</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-success">
                  <i class="bi bi-collection"></i>
                </div>
                <h4 class="text-success">{{ stats.collections }}</h4>
                <p class="text-muted mb-0">收藏数量</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-info">
                  <i class="bi bi-chat-dots"></i>
                </div>
                <h4 class="text-info">{{ stats.communityPosts }}</h4>
                <p class="text-muted mb-0">社区发帖</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <router-link to="/cart" class="stat-card card text-center text-decoration-none">
              <div class="card-body">
                <div class="stat-icon text-warning">
                  <i class="bi bi-cart"></i>
                </div>
                <h4 class="text-warning">{{ cartItemCount }}</h4>
                <p class="text-muted mb-0">购物车</p>
              </div>
            </router-link>
          </div>
        </div>

        <!-- 我的订单 -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">最近订单</h5>
            <router-link to="/orders" class="btn btn-sm btn-outline-primary">查看全部</router-link>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>商品</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="order in recentOrders" :key="order.id">
                    <td>#{{ order.id }}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <img :src="order.productImage" :alt="order.product" class="order-product-image me-2">
                        <span>{{ order.product }}</span>
                      </div>
                    </td>
                    <td>¥{{ order.amount }}</td>
                    <td>
                      <span :class="`badge bg-${getStatusClass(order.status)}`">
                        {{ order.status }}
                      </span>
                    </td>
                    <td>
                      <router-link :to="{ name: 'order-detail', params: { id: order.id } }" class="btn btn-sm btn-outline-primary me-1">查看</router-link>
                      <button v-if="order.status === '待付款'" class="btn btn-sm btn-success">付款</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 我的心愿单 -->
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">我的心愿单</h5>
            <span class="text-muted">{{ wishlist.length }} 件商品</span>
          </div>
          <div class="card-body">
            <div v-if="isLoadingWishlist" class="text-center py-4">
              <div class="spinner-border" role="status"></div>
              <span class="visually-hidden">加载中...</span>
            </div>
            <div v-else-if="wishlist.length === 0" class="text-center py-6">
              <i class="bi bi-heart display-1 text-muted"></i>
              <p class="text-muted mt-2">心愿单还是空的</p>
              <router-link to="/shop" class="btn btn-primary mt-2">去逛逛</router-link>
            </div>
            <div v-else class="row">
              <div v-for="item in wishlist" :key="item.id" class="col-md-4 mb-3">
                <div class="wishlist-item border rounded p-2 d-flex flex-column h-100">
                  <div class="relative">
                    <img :src="item.image" :alt="item.name" class="wishlist-image w-100 rounded mb-2">
                    <button class="btn btn-sm btn-danger absolute top-1 right-1" @click="removeFromWishlist(item.id)">
                      <i class="bi bi-heart-fill"></i>
                    </button>
                  </div>
                  <h6 class="text-truncate">{{ item.name }}</h6>
                  <p class="text-muted small mb-2">{{ item.series }}</p>
                  <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="price fw-bold text-primary">¥{{ item.price }}</span>
                      <small class="text-muted">{{ item.addedDate }}</small>
                    </div>
                    <router-link :to="`/product/${item.id}`" class="btn btn-sm btn-outline-primary w-100 mt-2">查看详情</router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近动态 -->
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">最近动态</h5>
          </div>
          <div class="card-body">
            <div v-for="activity in activities" :key="activity.id" class="activity-item mb-3">
              <div class="d-flex">
                <div class="activity-icon me-3" :class="`bg-${activity.type}`">
                  <i :class="['bi', activity.icon]"></i>
                </div>
                <div class="flex-grow-1">
                  <p class="mb-1">{{ activity.message }}</p>
                  <small class="text-muted">{{ activity.time }}</small>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="activities.length === 0" class="text-center py-4">
              <i class="bi bi-activity display-1 text-muted"></i>
              <p class="text-muted mt-2">暂无动态</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'ProfilePage',
  setup() {
    const store = useStore()
    const router = useRouter()
    const showEditModal = ref(false)
    
    // 计算购物车商品数量
    const cartItemCount = computed(() => {
      return store.state.cart ? store.state.cart.length : 0
    })

    const userInfo = ref({})
    const recentOrders = ref([])
    const activities = ref([])
    const stats = ref({})
    const achievements = ref([])

    // 获取默认头像
    const getDefaultAvatar = () => {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTE2IDE3QzE4LjIwOTEgMTcgMjAgMTUuMjA5MSAyMCAxM0MyMCAxMC43OTA5IDE4LjIwOTEgOSAxNiA5QzEzLjc5MDkgOSAxMiAxMC43OTA5IDEyIDEzQzEyIDE1LjIwOTEgMTMuNzkwOSAxNyAxNiAxN1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNiAxOEMxMS41ODIyIDE4IDggMjAuNjg2MyA4IDI0SDE2SDI0QzI0IDIwLjY4NjMgMjAuNDE3OCAxOCAxNiAxOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
    }

    // 计算用户头像
    const userAvatar = computed(() => {
      return store.getters.avatar || getDefaultAvatar()
    })

    // 计算进度条宽度
    const progressWidth = computed(() => {
      const current = userInfo.value.points || 0
      const nextLevelPoints = 2000 // 假设下一等级需要2000积分
      return Math.min((current / nextLevelPoints) * 100, 100) + '%'
    })

    // 模拟心愿单数据
    const mockWishlist = [
      {
        id: 1,
        name: '星空幻想系列',
        series: '第一弹',
        image: '/images/box1.jpg',
        price: 89,
        addedDate: '2024-01-14'
      },
      {
        id: 3,
        name: '海洋奇缘',
        series: '特别版',
        image: '/images/box3.jpg',
        price: 99,
        addedDate: '2024-01-12'
      },
      {
        id: 5,
        name: '童话世界',
        series: '限定款',
        image: '/images/box4.jpg',
        price: 129,
        addedDate: '2024-01-10'
      }
    ]
    
    // 模拟数据
    const mockUserInfo = {
      name: '盲盒爱好者',
      nickname: '盲盒收藏家',
      username: 'boxlover',
      followers: 128,
      following: 56,
      posts: 34,
      points: 1280,
      level: '黄金会员',
      nextLevel: '钻石会员'
    }
    
    // 编辑表单相关功能已迁移到独立的EditProfile页面
    
    // 心愿单相关
    const wishlist = ref([])
    const isLoadingWishlist = ref(false)

    const mockOrders = [
      {
        id: '20240115001',
        product: '星空幻想系列',
        productImage: '/images/box1.jpg',
        amount: 89,
        status: '已完成'
      },
      {
        id: '20240114002',
        product: '森林物语系列',
        productImage: '/images/box2.jpg',
        amount: 79,
        status: '已发货'
      },
      {
        id: '20240113003',
        product: '海洋奇缘系列',
        productImage: '/images/box3.jpg',
        amount: 99,
        status: '待付款'
      }
    ]

    const mockActivities = [
      { id: 1, icon: 'bi-gift', message: '购买了星空幻想系列盲盒', time: '2小时前', type: 'primary' },
      { id: 2, icon: 'bi-heart', message: '收藏了森林物语系列', time: '1天前', type: 'success' },
      { id: 3, icon: 'bi-chat', message: '在社区发布了开盒分享', time: '2天前', type: 'info' },
      { id: 4, icon: 'bi-star', message: '获得了"收藏达人"成就', time: '3天前', type: 'warning' }
    ]

    const mockStats = {
      totalBoxes: 24,
      collections: 18,
      communityPosts: 12
    }

    const mockAchievements = [
      { id: 1, name: '初来乍到', icon: 'bi-emoji-smile', unlocked: true },
      { id: 2, name: '收藏达人', icon: 'bi-collection', unlocked: true },
      { id: 3, name: '开盒高手', icon: 'bi-gift', unlocked: false },
      { id: 4, name: '社区明星', icon: 'bi-star', unlocked: true }
    ]

    const getStatusClass = (status) => {
      const classes = {
        '已完成': 'success',
        '已发货': 'info',
        '待付款': 'warning',
        '已取消': 'danger'
      }
      return classes[status] || 'secondary'
    }
    
    // 获取心愿单
    const fetchWishlist = () => {
      isLoadingWishlist.value = true
      // 模拟API请求
      setTimeout(() => {
        // 从store获取收藏的商品ID
        const favoriteIds = store.state.favorites || []
        // 如果有收藏的商品ID，过滤模拟数据
        if (favoriteIds.length > 0) {
          wishlist.value = mockWishlist.filter(item => favoriteIds.includes(item.id))
        } else {
          // 否则使用模拟数据
          wishlist.value = mockWishlist
        }
        isLoadingWishlist.value = false
      }, 500)
    }
    
    // 从心愿单中移除
    const removeFromWishlist = (productId) => {
      if (!store.getters.isLoggedIn) {
        return
      }
      
      // 从本地状态中移除
      wishlist.value = wishlist.value.filter(item => item.id !== productId)
      
      // 从store中移除
      if (store.commit) {
        store.commit('REMOVE_FAVORITE', productId)
      }
    }

    const handleAvatarError = (event) => {
      console.error('头像图片加载失败，使用默认头像')
      event.target.src = getDefaultAvatar()
    }

    // 注销账号确认
    const confirmDeleteAccount = () => {
      if (!confirm('注销账号将删除您的所有数据，此操作不可恢复。确定要继续吗？')) {
        return
      }

      if (confirm('再次确认：您确定要永久注销账号吗？')) {
        deleteAccount()
      }
    }

    // 注销账号
    const deleteAccount = async () => {
      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // 清除用户数据并退出登录
        if (store.commit) {
          store.commit('LOGOUT')
        }
        
        // 重定向到首页
        router.push('/')
        
        // 显示注销成功提示
        setTimeout(() => {
          alert('账号已成功注销')
        }, 500)
      } catch (error) {
        console.error('注销账号失败:', error)
        alert('注销失败，请重试')
      }
    }

    onMounted(() => {
      // 如果store中有用户信息，使用store中的数据
      if (store.state.user) {
        userInfo.value = {
          ...mockUserInfo,
          name: store.state.user.username || mockUserInfo.name,
          nickname: store.state.user.nickname || mockUserInfo.nickname,
          username: store.state.user.username || mockUserInfo.username,
          points: store.state.user.points || mockUserInfo.points,
          level: store.state.user.level || mockUserInfo.level
        }
      } else {
        userInfo.value = mockUserInfo
      }

      recentOrders.value = mockOrders
      activities.value = mockActivities
      stats.value = mockStats
      achievements.value = mockAchievements
      
      // 获取心愿单数据
      fetchWishlist()
    })

    return {
      userInfo,
      recentOrders,
      activities,
      stats,
      achievements,
      wishlist,
      isLoadingWishlist,
      userAvatar,
      progressWidth,
      getStatusClass,
      handleAvatarError,
      removeFromWishlist,
      confirmDeleteAccount,
      cartItemCount
    }
  }
}
</script>

<style scoped>
.user-profile-avatar {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border: 3px solid var(--primary-purple);
}

/* 个人中心样式 */
.profile-page {
  padding-top: 70px; /* 为固定导航栏留出空间 */
}

.profile-page .btn {
  transition: all 0.3s ease;
}

.profile-page .btn:hover {
  transform: translateY(-2px);
}


.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.edit-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.upload-btn {
  min-width: 120px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon { font-size: 2rem; margin-bottom: 0.5rem; }

.wishlist-image {
  height: 150px;
  object-fit: cover;
}

.wishlist-item {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.wishlist-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-product-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.activity-icon.bg-primary { background: var(--primary-purple); }
.activity-icon.bg-success { background: var(--bs-success); }
.activity-icon.bg-info { background: var(--bs-info); }
.activity-icon.bg-warning { background: var(--bs-warning); }

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.achievement-item {
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.achievement-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.achievement-icon {
  font-size: 1.5rem;
  color: var(--primary-purple);
}
</style>