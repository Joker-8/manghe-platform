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
            <h4>{{ userInfo.name }}</h4>
            <p class="text-muted">@{{ userInfo.username }}</p>

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
            <button class="btn btn-outline-primary w-100" @click="editProfile">编辑资料</button>
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
                      <button class="btn btn-sm btn-outline-primary me-1">查看</button>
                      <button v-if="order.status === '待付款'" class="btn btn-sm btn-success">付款</button>
                    </td>
                  </tr>
                </tbody>
              </table>
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

export default {
  name: 'ProfilePage',
  setup() {
    const store = useStore()

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

    // 模拟数据
    const mockUserInfo = {
      name: '盲盒爱好者',
      username: 'boxlover',
      followers: 128,
      following: 56,
      posts: 34,
      points: 1280,
      level: '黄金会员',
      nextLevel: '钻石会员'
    }

    const mockOrders = [
      {
        id: '20240115001',
        product: '星空幻想系列',
        productImage: 'https://via.placeholder.com/40x40/6B21A8/FFFFFF?text=盒',
        amount: 89,
        status: '已完成'
      },
      {
        id: '20240114002',
        product: '森林物语系列',
        productImage: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=盒',
        amount: 79,
        status: '已发货'
      },
      {
        id: '20240113003',
        product: '海洋奇缘系列',
        productImage: 'https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=盒',
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

    const handleAvatarError = (event) => {
      console.error('头像图片加载失败，使用默认头像')
      event.target.src = getDefaultAvatar()
    }

    const editProfile = () => {
      // 编辑资料逻辑
      console.log('编辑资料')
    }

    onMounted(() => {
      // 如果store中有用户信息，使用store中的数据
      if (store.state.user) {
        userInfo.value = {
          ...mockUserInfo,
          name: store.state.user.username || mockUserInfo.name,
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
    })

    return {
      userInfo,
      recentOrders,
      activities,
      stats,
      achievements,
      userAvatar,
      progressWidth,
      getStatusClass,
      handleAvatarError,
      editProfile
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

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
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