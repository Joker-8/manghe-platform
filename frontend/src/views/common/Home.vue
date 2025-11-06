<template>
  <div class="home-page">
    <!-- 轮播Banner -->
    <section class="banner-section mb-5">
      <div id="mainBanner" class="carousel slide" data-bs-ride="carousel">
        <!-- 轮播指示器 -->
        <div class="carousel-indicators">
          <button
              v-for="(banner, index) in banners"
              :key="banner.id"
              type="button"
              data-bs-target="#mainBanner"
              :data-bs-slide-to="index"
              :class="{ active: index === 0 }"
              :aria-current="index === 0 ? 'true' : 'false'"
              :aria-label="'Slide ' + (index + 1)"
          ></button>
        </div>

        <!-- 轮播内容 -->
        <div class="carousel-inner rounded-3">
          <div
              v-for="(banner, index) in banners"
              :key="banner.id"
              :class="['carousel-item', { active: index === 0 }]"
          >
            <img
                :src="banner.image"
                class="d-block w-100 carousel-image"
                :alt="banner.title"
                @error="handleBannerError"
            >
            <div class="carousel-caption d-none d-md-block">
              <h3 class="carousel-title">{{ banner.title }}</h3>
              <p class="carousel-description">{{ banner.description }}</p>
              <button class="btn btn-light btn-lg carousel-btn" @click="handleBannerClick(banner)">
                {{ banner.buttonText }}
              </button>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <button class="carousel-control-prev" type="button" data-bs-target="#mainBanner" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">上一张</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#mainBanner" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">下一张</span>
        </button>
      </div>
    </section>

    <!-- 快速入口 -->
    <section class="quick-access mb-5">
      <div class="container">
        <h4 class="section-title mb-4 fw-bold">热门分类</h4>
        <div class="row g-3">
          <div v-for="category in categories"
               :key="category.id"
               class="col-6 col-md-3 col-lg">
            <router-link :to="category.path" class="category-card text-decoration-none">
              <div class="card text-center border-0 shadow-sm h-100">
                <div class="card-body py-4">
                  <div class="category-icon mb-3" :style="{ color: category.color }">
                    <i :class="['bi', category.icon]" style="font-size: 2rem;"></i>
                  </div>
                  <h6 class="card-title mb-0">{{ category.name }}</h6>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- 推荐盲盒 -->
    <section class="recommended-boxes">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="section-title mb-0 fw-bold">热门盲盒</h4>
          <router-link to="/shop" class="btn btn-outline-primary">查看全部</router-link>
        </div>

        <div class="row">
          <div v-for="box in recommendedBoxes"
               :key="box.id"
               class="col-xl-3 col-lg-4 col-md-6 col-sm-6 mb-4">
            <div class="box-card cursor-pointer"
                 @click="navigateToDetail(box.id)">
              <div class="card h-100 position-relative">
                <div class="card-img-container position-relative overflow-hidden">
                  <img
                      :src="box.image"
                      :alt="box.name"
                      class="card-img-top"
                      @error="(e) => handleBoxImageError(e, box.id)"
                  >

                  <!-- 标签 -->
                  <div class="position-absolute top-0 start-0 m-2">
                    <span v-if="box.isLimited" class="badge bg-danger">限量</span>
                    <span v-if="box.isNew" class="badge bg-success ms-1">新品</span>
                  </div>
                </div>

                <!-- 卡片内容 -->
                <div class="card-body d-flex flex-column">
                  <h6 class="card-title fw-bold text-truncate">{{ box.name }}</h6>
                  <p class="card-text text-muted small mb-2">{{ box.series }}</p>

                  <!-- 评分 -->
                  <div class="d-flex align-items-center mb-2">
                    <div class="rating-stars">
                      <i v-for="star in 5" :key="star"
                         :class="['bi', star <= Math.floor(box.rating) ? 'bi-star-fill' : 'bi-star']"
                         class="text-warning"></i>
                    </div>
                    <small class="text-muted ms-2">({{ box.rating }})</small>
                  </div>

                  <!-- 价格和库存 -->
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="price fw-bold text-primary">¥{{ box.price }}</span>
                    <small class="text-muted">剩余: {{ box.stock }}</small>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="mt-auto">
                    <button
                        class="btn btn-primary w-100 mb-2"
                        @click.stop="handleBuy(box)"
                        :disabled="box.stock === 0"
                    >
                      {{ box.stock === 0 ? '已售罄' : '立即购买' }}
                    </button>
                    <button
                        class="btn btn-outline-secondary w-100"
                        @click="addToWishlist(box)"
                    >
                      加入心愿单
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

// 导入本地盲盒图片
// 使用public目录下的资源
const box1 = '/images/box1.jpg'
const box2 = '/images/box2.jpg'
const box3 = '/images/box3.jpg'
const box4 = '/images/box4.jpg'

// 轮播图数据
const banner1 = '/images/banners/banner1.jpg'
const banner2 = '/images/banners/banner2.jpg'
const banner3 = '/images/banners/banner3.jpg'
const banner4 = '/images/banners/banner4.jpg'

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter()
    const store = useStore()

    // 轮播图数据
    const banners = ref([
      {
        id: 1,
        image: banner1,
        title: '夏日限定系列',
        description: '全新夏日主题盲盒，清凉上市',
        buttonText: '立即探索',
        link: '/shop?series=summer'
      },
      {
        id: 2,
        image: banner2,
        title: '经典复刻版',
        description: '经典角色重现，限量发售',
        buttonText: '查看详情',
        link: '/shop?series=classic'
      },
      {
        id: 3,
        image: banner3,
        title: '新品首发',
        description: '最新系列盲盒，抢先体验',
        buttonText: '立即购买',
        link: '/shop?filter=new'
      },
      {
        id: 4,
        image: banner4,
        title: '热门收藏',
        description: '大家都在收藏的爆款盲盒',
        buttonText: '发现更多',
        link: '/shop?filter=hot'
      }
    ])

    const categories = ref([
      { id: 1, name: '热门', icon: 'bi-fire', path: '/shop?filter=hot', color: '#EC4899' },
      { id: 2, name: '新品', icon: 'bi-gift', path: '/shop?filter=new', color: '#3B82F6' },
      { id: 3, name: '限量', icon: 'bi-star', path: '/shop?filter=limited', color: '#F59E0B' },
      { id: 4, name: '预售', icon: 'bi-clock', path: '/shop?filter=preorder', color: '#10B981' }
    ])

    const recommendedBoxes = ref([])

    // 处理轮播图点击事件
    const handleBannerClick = (banner) => {
      // 确保精确导航到对应商城分类
      router.push({
        path: '/shop',
        query: parseBannerLink(banner.link)
      })
    }
    
    // 解析轮播图链接，提取查询参数
    const parseBannerLink = (link) => {
      const queryParams = {}
      // 从链接中提取查询参数部分
      const queryString = link.split('?')[1]
      if (queryString) {
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=')
          if (key && value) {
            queryParams[key] = decodeURIComponent(value)
          }
        })
      }
      return queryParams
    }

    // 处理轮播图图片加载错误
    const handleBannerError = (event) => {
      console.error('轮播图图片加载失败:', event)
      // 使用默认图片或占位图
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTlBQUZGIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiPuaTjeS9nOivleWbviDlm77niYc8L3RleHQ+Cjwvc3ZnPgo='
    }

    // 处理盲盒图片加载错误
    const handleBoxImageError = (event, boxId) => {
      console.error(`盲盒 ${boxId} 图片加载失败`)
      // 使用SVG占位图
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTlBQUZGIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPuaTjeS9nOivleWbviDlm77niYc8L3RleHQ+Cjwvc3ZnPgo='
    }
    
    // 导航到商品详情页
    const navigateToDetail = (boxId) => {
      router.push(`/product/${boxId}`)
    }

    // 模拟获取推荐盲盒数据
    const fetchRecommendedBoxes = async () => {
      // 使用本地导入的图片
      recommendedBoxes.value = [
        {
          id: 1,
          name: '星空幻想系列',
          series: '第一弹',
          image: box1,
          price: 89,
          rating: 4.8,
          stock: 156,
          isLimited: true,
          isNew: true
        },
        {
          id: 2,
          name: '森林物语',
          series: '季节限定',
          image: box2,
          price: 79,
          rating: 4.6,
          stock: 89,
          isLimited: false,
          isNew: false
        },
        {
          id: 3,
          name: '海洋奇缘',
          series: '特别版',
          image: box3,
          price: 99,
          rating: 4.9,
          stock: 45,
          isLimited: true,
          isNew: true
        },
        {
          id: 4,
          name: '城市探险',
          series: '第二弹',
          image: box4,
          price: 85,
          rating: 4.7,
          stock: 120,
          isLimited: false,
          isNew: true
        }
      ]
    }

    const handleBuy = (boxData) => {
      if (!store.getters.isLoggedIn) {
        // 未登录，跳转到登录页面
        router.push({
          path: '/login',
          query: { redirect: `/product/${boxData.id}?buyNow=true` }
        })
        return
      }
      
      // 已登录，带buyNow参数跳转到商品详情页
      router.push({
        path: `/product/${boxData.id}`,
        query: { buyNow: 'true' }
      })
    }

    const addToWishlist = (boxData) => {
      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }
      console.log('添加到心愿单:', boxData)
      // 添加到心愿单逻辑
    }

    onMounted(() => {
      fetchRecommendedBoxes()

      // 初始化轮播图
      setTimeout(() => {
        // 确保Bootstrap轮播图正确初始化
        const carousel = document.getElementById('mainBanner')
        if (carousel) {
          // Bootstrap会自动初始化，这里可以添加自定义逻辑
        }
      }, 100)
    })

    return {
      banners,
      categories,
      recommendedBoxes,
      handleBannerClick,
      handleBannerError,
      handleBoxImageError,
      handleBuy,
      addToWishlist,
      navigateToDetail
    }
  }
}
</script>

<style scoped>
/* 保持原有的样式不变 */
.home-page {
  padding-bottom: 2rem;
}

.banner-section {
  margin-top: -1rem;
}

.carousel-item {
  height: 400px;
  background-color: var(--moon-silver);
}

.carousel-image {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.carousel-caption {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 1.5rem;
  bottom: 2rem;
  left: 10%;
  right: 10%;
}

.carousel-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
}

.carousel-description {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
}

.carousel-btn {
  font-weight: 600;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.carousel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.carousel-indicators button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 5px;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
}

.carousel-indicators button.active {
  background-color: white;
}

.carousel-control-prev,
.carousel-control-next {
  width: 5%;
}

.carousel-control-prev-icon,
.carousel-control-next-icon {
  background-size: 100%, 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  width: 3rem;
  height: 3rem;
}

/* 快速入口样式 */
.category-card .card {
  transition: all 0.3s ease;
}

.category-card:hover .card {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
}

.section-title {
  color: var(--dark-night);
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 50px;
  height: 3px;
  background: var(--primary-purple);
  border-radius: 2px;
}

/* 盲盒卡片样式 */
.box-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.box-card:hover {
  transform: translateY(-8px);
}

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

.price {
  color: var(--primary-purple) !important;
  font-size: 1.25rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .carousel-item {
    height: 300px;
  }

  .carousel-caption {
    bottom: 1rem;
    left: 5%;
    right: 5%;
    padding: 1rem;
  }

  .carousel-title {
    font-size: 1.5rem;
  }

  .carousel-description {
    font-size: 1rem;
  }

  .carousel-btn {
    padding: 0.4rem 1.2rem;
    font-size: 0.9rem;
  }

  .carousel-control-prev-icon,
  .carousel-control-next-icon {
    width: 2.5rem;
    height: 2.5rem;
  }
}

@media (max-width: 576px) {
  .carousel-item {
    height: 250px;
  }

  .carousel-caption {
    display: none !important;
  }

  .banner-section {
    margin-top: 0;
  }
}
</style>