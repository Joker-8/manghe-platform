<template>
  <div class="shop-container">
    <div class="container">
      
      <!-- 主内容区域 - 侧边栏和商品列表 -->
      <div class="shop-main">
        <!-- 左侧分类侧边栏 -->
        <div class="sidebar-container" ref="sidebarElement" @mounted="handleSidebarMounted">
          <CategorySidebar 
            @filters-changed="handleFiltersChange"
          />
        </div>
        
        <!-- 右侧商品内容区域 -->
        <div class="content-container">
          <!-- 搜索栏 -->
          <div class="search-bar">
            <div class="input-group">
              <input 
                type="text" 
                class="form-control search-input" 
                placeholder="搜索盲盒名称或系列..." 
                v-model="searchQuery"
              >
              <button class="btn btn-primary search-btn" type="button">搜索</button>
            </div>
          </div>
          
          <!-- 已选筛选条件 -->
          <div class="active-filters">
            <div 
              v-for="(filter, index) in activeFilters" 
              :key="index" 
              class="filter-tag"
            >
              {{ filter }}
              <button class="close" @click="handleRemoveFilter(filter)">&times;</button>
            </div>
            <a href="#" class="reset-filters" @click.prevent="resetAllFilters">重置所有筛选条件</a>
          </div>
          
          <!-- 排序控件 -->
          <div class="sort-controls">
            <div class="result-count">共 {{ filteredBoxes.length }} 件商品</div>
            <select v-model="sortBy" class="form-select" style="width: auto;">
              <option value="newest">最新上架</option>
              <option value="price-low">价格: 从低到高</option>
              <option value="price-high">价格: 从高到低</option>
              <option value="rating">评分优先</option>
              <option value="popular">人气优先</option>
            </select>
          </div>
          
          <!-- 商品网格 -->
          <div class="boxes-grid">
            <BoxCard 
              v-for="box in paginatedBoxes" 
              :key="box.id" 
              :box-data="box" 
            />
          </div>
          
          <!-- 分页 -->
          <div class="pagination">
            <nav aria-label="Page navigation example">
              <ul class="pagination">
                <li class="page-item" :class="{ disabled: currentPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="currentPage = currentPage - 1">上一页</a>
                </li>
                <li 
                  v-for="page in totalPages" 
                  :key="page" 
                  class="page-item" 
                  :class="{ active: currentPage === page }"
                >
                  <a class="page-link" href="#" @click.prevent="currentPage = page">{{ page }}</a>
                </li>
                <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                  <a class="page-link" href="#" @click.prevent="currentPage = currentPage + 1">下一页</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import BoxCard from '@/components/common/BoxCard.vue'
import CategorySidebar from '@/components/common/CategorySidebar.vue'

export default {
  name: 'ShopPage',
  components: {
    BoxCard,
    CategorySidebar
  },
  setup() {
    const route = useRoute()
    
    // 响应式数据
    const boxes = ref([])
    const searchQuery = ref('')
    const sortBy = ref('newest')
    const currentPage = ref(1)
    const itemsPerPage = ref(12)
    const sidebarFilters = ref({
      category: '',
      subcategory: '',
      rarities: [],
      priceRange: ''
    })
    
    // 侧边栏动态定位相关数据
    const sidebarElement = ref(null)

    // 模拟数据
    const mockBoxes = [
      {
        id: 1,
        name: '星空幻想盲盒',
        series: '星空幻想系列',
        price: 89,
        image: '/images/box1.jpg',
        rating: 4.8,
        reviewCount: 128,
        rarity: '稀有',
        isNew: true,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 2,
        name: '森林精灵盲盒',
        series: '森林物语系列',
        price: 79,
        image: '/images/box2.jpg',
        rating: 4.6,
        reviewCount: 95,
        rarity: '普通',
        isNew: false,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 3,
        name: '海洋奇遇盲盒',
        series: '海洋奇缘系列',
        price: 99,
        image: '/images/box3.jpg',
        rating: 4.9,
        reviewCount: 156,
        rarity: '史诗',
        isNew: true,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 4,
        name: '城市探险家盲盒',
        series: '城市探险系列',
        price: 85,
        image: '/images/box4.jpg',
        rating: 4.7,
        reviewCount: 102,
        rarity: '稀有',
        isNew: false,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 5,
        name: '复古记忆盲盒',
        series: '复古经典系列',
        price: 109,
        image: '/images/box5.jpg',
        rating: 4.5,
        reviewCount: 87,
        rarity: '普通',
        isNew: false,
        isLimited: true,
        isPreorder: false
      },
      {
        id: 6,
        name: '夏日沙滩盲盒',
        series: '夏日限定系列',
        price: 119,
        image: '/images/box6.jpg',
        rating: 4.8,
        reviewCount: 143,
        rarity: '传说',
        isNew: true,
        isLimited: true,
        isPreorder: false
      },
      {
        id: 7,
        name: '星际旅人盲盒',
        series: '星空幻想系列',
        price: 99,
        image: '/images/box7.jpg',
        rating: 4.7,
        reviewCount: 112,
        rarity: '稀有',
        isNew: true,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 8,
        name: '神秘森林盲盒',
        series: '森林物语系列',
        price: 105,
        image: '/images/box1.jpg',
        rating: 4.6,
        reviewCount: 98,
        rarity: '隐藏',
        isNew: false,
        isLimited: true,
        isPreorder: false
      },
      {
        id: 9,
        name: '海底城堡盲盒',
        series: '海洋奇缘系列',
        price: 119,
        image: '/images/box2.jpg',
        rating: 4.9,
        reviewCount: 135,
        rarity: '传说',
        isNew: true,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 10,
        name: '城市夜景盲盒',
        series: '城市探险系列',
        price: 89,
        image: '/images/box3.jpg',
        rating: 4.5,
        reviewCount: 78,
        rarity: '普通',
        isNew: false,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 11,
        name: '复古留声机盲盒',
        series: '复古经典系列',
        price: 129,
        image: '/images/box4.jpg',
        rating: 4.8,
        reviewCount: 109,
        rarity: '史诗',
        isNew: false,
        isLimited: true,
        isPreorder: false
      },
      {
        id: 12,
        name: '夏日冰淇淋盲盒',
        series: '夏日限定系列',
        price: 95,
        image: '/images/box5.jpg',
        rating: 4.7,
        reviewCount: 124,
        rarity: '稀有',
        isNew: true,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 13,
        name: '月球漫步盲盒',
        series: '星空幻想系列',
        price: 119,
        image: '/images/box6.jpg',
        rating: 4.9,
        reviewCount: 146,
        rarity: '传说',
        isNew: true,
        isLimited: true,
        isPreorder: false
      },
      {
        id: 14,
        name: '森林守护者盲盒',
        series: '森林物语系列',
        price: 109,
        image: '/images/box7.jpg',
        rating: 4.7,
        reviewCount: 111,
        rarity: '史诗',
        isNew: false,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 15,
        name: '深海美人鱼盲盒',
        series: '海洋奇缘系列',
        price: 129,
        image: '/images/box1.jpg',
        rating: 4.8,
        reviewCount: 131,
        rarity: '隐藏',
        isNew: true,
        isLimited: true,
        isPreorder: false
      },
      {
        id: 16,
        name: '都市白领盲盒',
        series: '城市探险系列',
        price: 89,
        image: '/images/box2.jpg',
        rating: 4.6,
        reviewCount: 89,
        rarity: '普通',
        isNew: false,
        isLimited: false,
        isPreorder: false
      },
      {
        id: 17,
        name: '未来科技盲盒',
        series: '未来世界系列',
        price: 139,
        image: '/images/box3.jpg',
        rating: 4.9,
        reviewCount: 0,
        rarity: '传说',
        isNew: true,
        isLimited: true,
        isPreorder: true
      },
      {
        id: 18,
        name: '童话梦境盲盒',
        series: '梦幻童话系列',
        price: 109,
        image: '/images/box4.jpg',
        rating: 0,
        reviewCount: 0,
        rarity: '史诗',
        isNew: true,
        isLimited: false,
        isPreorder: true
      },
      {
        id: 19,
        name: '魔法学院盲盒',
        series: '奇幻魔法系列',
        price: 119,
        image: '/images/box5.jpg',
        rating: 0,
        reviewCount: 0,
        rarity: '稀有',
        isNew: true,
        isLimited: false,
        isPreorder: true
      }
    ]
    
    // 分类数据
    const mockCategories = [
      {
        id: 'series',
        name: '盲盒系列',
        subcategories: [
          { id: 'series-1', name: '星空幻想系列', icon: 'bi-globe' },
          { id: 'series-2', name: '森林物语系列', icon: 'bi-tree' },
          { id: 'series-3', name: '海洋奇缘系列', icon: 'bi-droplet' },
          { id: 'series-4', name: '城市探险系列', icon: 'bi-building' },
          { id: 'series-5', name: '复古经典系列', icon: 'bi-clock' },
          { id: 'series-6', name: '夏日限定系列', icon: 'bi-umbrella' }
        ]
      },
      {
        id: 'new-arrivals',
        name: '新品上市'
      },
      {
        id: 'limited',
        name: '限量款式'
      },
      {
        id: 'hot',
        name: '热销商品'
      },
      {
        id: 'preorder',
        name: '预售商品'
      }
    ]
    
    // 监听筛选条件变化
    const handleFiltersChange = (filters) => {
      sidebarFilters.value = { ...filters }
      currentPage.value = 1 // 重置到第一页
    }
    
    // 更新侧边栏位置，确保它在页尾出现时能正确贴合
    const updateSidebarPosition = () => {
      if (!sidebarElement.value) return
      
      const sidebar = sidebarElement.value
      // 获取页尾元素
      const footer = document.querySelector('footer.main-footer')
      
      if (!footer) {
        // 没有页尾时，重置位置
        document.documentElement.style.setProperty('--sidebar-transform', 'none')
        document.documentElement.style.setProperty('--sidebar-margin-bottom', '0px')
        return
      }
      
      // 获取视口高度和滚动位置
      const viewportHeight = window.innerHeight
      const scrollTop = window.scrollY
      
      // 获取页尾元素的位置信息
      const footerOffsetTop = footer.offsetTop
      const footerHeight = footer.offsetHeight
      
      // 获取侧边栏容器的位置信息
      const sidebarOffsetTop = sidebar.offsetTop
      const sidebarHeight = sidebar.offsetHeight
      
      // 获取header高度
      const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '60px')
      
      // 计算理想的侧边栏底部位置
      const sidebarBottomTarget = footerOffsetTop - 1 // -1px确保完全贴紧
      
      // 计算当前滚动位置下侧边栏的底部位置
      const sidebarBottomCurrent = scrollTop + headerHeight + sidebarHeight
      
      // 计算需要的偏移量
      let translateY = 0
      
      // 如果侧边栏底部超过页尾顶部，向上移动侧边栏
      if (sidebarBottomCurrent > sidebarBottomTarget) {
        translateY = sidebarBottomTarget - sidebarBottomCurrent
      }
      
      // 应用变换
      document.documentElement.style.setProperty('--sidebar-transform', `translateY(${translateY}px)`)
      
      // 确保侧边栏不会因为变换而被截断
      document.documentElement.style.setProperty('--sidebar-margin-bottom', '0px')
      
      // 同时调整max-height，提供双重保障
      const availableHeight = Math.min(
        viewportHeight - headerHeight,
        footerOffsetTop - sidebarOffsetTop
      )
      document.documentElement.style.setProperty('--max-sidebar-height', `${availableHeight}px`)
    }
    
    // 重置所有筛选条件
    const resetAllFilters = () => {
      searchQuery.value = ''
      sidebarFilters.value = {
        category: '',
        subcategory: '',
        rarities: [],
        priceRange: ''
      }
      currentPage.value = 1 // 重置到第一页
    }
    
    // 移除单个筛选条件
    const handleRemoveFilter = (filter) => {
      if (filter.startsWith('搜索: ')) {
        searchQuery.value = ''
      } else if (filter.startsWith('价格: ')) {
        sidebarFilters.value.priceRange = ''
      } else if (filter.includes('个稀有度')) {
        sidebarFilters.value.rarities = []
      } else {
        const category = mockCategories.find(cat => cat.name === filter)
        if (category) {
          sidebarFilters.value.category = ''
          sidebarFilters.value.subcategory = ''
        } else {
          for (const cat of mockCategories) {
            if (cat.subcategories) {
              const subcategory = cat.subcategories.find(sub => sub.name === filter)
              if (subcategory) {
                sidebarFilters.value.subcategory = ''
                break
              }
            }
          }
        }
      }
      currentPage.value = 1 // 重置到第一页
    }
    
    // 获取当前激活的筛选条件标签
    const activeFilters = computed(() => {
      const filters = []
      
      if (sidebarFilters.value.category) {
        const category = getCategoryNameById(sidebarFilters.value.category)
        if (category) filters.push(category)
      }
      
      if (sidebarFilters.value.subcategory) {
        const subcategory = getSubcategoryNameById(
          sidebarFilters.value.category,
          sidebarFilters.value.subcategory
        )
        if (subcategory) filters.push(subcategory)
      }
      
      if (sidebarFilters.value.rarities.length > 0) {
        filters.push(`${sidebarFilters.value.rarities.length}个稀有度`)
      }
      
      if (sidebarFilters.value.priceRange) {
        filters.push(`价格: ${sidebarFilters.value.priceRange}`)
      }
      
      if (searchQuery.value) {
        filters.push(`搜索: ${searchQuery.value}`)
      }
      
      return filters
    })
    
    // 根据ID获取分类名称
    const getCategoryNameById = (categoryId) => {
      const category = mockCategories.find(cat => cat.id === categoryId)
      return category ? category.name : null
    }
    
    // 根据ID获取子分类名称
    const getSubcategoryNameById = (categoryId, subcategoryId) => {
      const category = mockCategories.find(cat => cat.id === categoryId)
      if (!category || !category.subcategories) return null
      
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId)
      return subcategory ? subcategory.name : null
    }

    // 计算属性 - 筛选和排序
    const filteredBoxes = computed(() => {
      let filtered = [...boxes.value]

      // 搜索过滤
      if (searchQuery.value) {
        filtered = filtered.filter(box =>
            box.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            box.series.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      }

      // 侧边栏分类过滤
      if (sidebarFilters.value.category) {
        switch (sidebarFilters.value.category) {
          case 'series':
            if (sidebarFilters.value.subcategory) {
              // 根据子分类过滤特定系列
              const subcategory = getSubcategoryNameById(
                sidebarFilters.value.category,
                sidebarFilters.value.subcategory
              )
              if (subcategory) {
                filtered = filtered.filter(box => box.series === subcategory)
              }
            }
            break
          case 'new-arrivals':
            filtered = filtered.filter(box => box.isNew)
            break
          case 'limited':
            filtered = filtered.filter(box => box.isLimited)
            break
          case 'hot':
            // 热销商品（评分高的）
            filtered = filtered.filter(box => box.rating >= 4.7)
            break
          case 'preorder':
            // 预售商品
            filtered = filtered.filter(box => box.isPreorder)
            break
        }
      }

      // 价格范围过滤
      if (sidebarFilters.value.priceRange) {
        filtered = filtered.filter(box => {
          const [min, max] = sidebarFilters.value.priceRange.split('-').map(Number)
          if (max) {
            return box.price >= min && box.price <= max
          } else {
            return box.price >= min
          }
        })
      }

      // 稀有度过滤（多个稀有度）
      if (sidebarFilters.value.rarities.length > 0) {
        // 稀有度映射
        const rarityMap = {
          'common': '普通',
          'rare': '稀有',
          'epic': '史诗',
          'legendary': '传说',
          'secret': '隐藏'
        }
        
        const displayRarities = sidebarFilters.value.rarities.map(key => rarityMap[key] || key)
        filtered = filtered.filter(box => displayRarities.includes(box.rarity))
      }

      // 排序
      switch (sortBy.value) {
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price)
          break
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price)
          break
        case 'popular':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'newest':
        default:
          filtered.sort((a, b) => b.id - a.id)
          break
      }

      return filtered
    })

    // 分页相关计算属性
    const totalPages = computed(() => {
      return Math.ceil(filteredBoxes.value.length / itemsPerPage.value)
    })

    const paginatedBoxes = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredBoxes.value.slice(start, end)
    })

    // 获取数据
    const fetchBoxes = async () => {
      try {
        // 这里应该是实际的API调用
        // const response = await api.get('/boxes')
        // boxes.value = response.data
        
        // 使用模拟数据
        boxes.value = [...mockBoxes]
      } catch (error) {
        console.error('Failed to fetch boxes:', error)
        // 使用模拟数据作为回退
        boxes.value = [...mockBoxes]
      }
    }

    // 处理URL参数，实现精准导航
    const handleUrlParams = () => {
      const filter = route.query.filter
      const series = route.query.series
      const search = route.query.search
      
      // 只重置非搜索相关的筛选条件
      if (!search) {
        sidebarFilters.value = {
          category: '',
          subcategory: '',
          rarities: [],
          priceRange: ''
        }
        currentPage.value = 1 // 重置到第一页
      }
      
      // 根据URL参数设置筛选条件
      if (filter && !search) {
        switch (filter) {
          case 'hot':
            sidebarFilters.value.category = 'hot'
            break
          case 'new':
            sidebarFilters.value.category = 'new-arrivals'
            break
          case 'limited':
            sidebarFilters.value.category = 'limited'
            break
          case 'preorder':
            sidebarFilters.value.category = 'preorder'
            break
        }
      } else if (series && !search) {
        // 处理系列筛选
        sidebarFilters.value.category = 'series'
        const subcategoryId = `series-${mockCategories[0].subcategories.findIndex(s => 
          s.name.toLowerCase().includes(series.toLowerCase())
        ) + 1}`
        sidebarFilters.value.subcategory = subcategoryId
      }
      
      // 如果有搜索参数，不重置页码，保持当前页码
    }
    
    // 监听URL参数变化
    watch(() => route.query, () => {
      handleUrlParams()
    }, { immediate: true })
    
    // 监听搜索参数变化
    watch(() => route.query.search, (newSearch) => {
      if (newSearch) {
        searchQuery.value = newSearch
      }
    }, { immediate: true })
    
    // 组件挂载时获取数据
    onMounted(() => {
      fetchBoxes()
      handleUrlParams() // 初始加载时处理URL参数
      
      // 添加滚动监听
      updateSidebarPosition() // 初始检查
      window.addEventListener('scroll', updateSidebarPosition, { passive: true })
      window.addEventListener('resize', updateSidebarPosition)
    })
    
    // 组件卸载时清理监听器
    onUnmounted(() => {
      window.removeEventListener('scroll', updateSidebarPosition)
      window.removeEventListener('resize', updateSidebarPosition)
      // 清理CSS变量
      document.documentElement.style.removeProperty('--is-footer-visible')
      document.documentElement.style.removeProperty('--sidebar-translate-y')
      document.documentElement.style.removeProperty('--visible-footer-height')
      document.documentElement.style.removeProperty('--footer-distance')
    })
    
    // 确保侧边栏元素引用正确设置
    const handleSidebarMounted = () => {
      updateSidebarPosition()
    }

    return {
      boxes,
      searchQuery,
      sortBy,
      currentPage,
      itemsPerPage,
      paginatedBoxes,
      totalPages,
      fetchBoxes,
      sidebarFilters,
      handleFiltersChange,
      resetAllFilters,
      handleRemoveFilter,
      activeFilters,
      mockCategories,
      filteredBoxes
    }
  }
}
</script>

<style scoped>
/* 主布局样式 */
.shop-container {
  width: 100%;
  padding: 0;
  margin: 0;
  min-height: calc(100vh - var(--header-height, 60px) - var(--footer-height, 100px));
}

.container {
  max-width: 100%;
  padding: 0;
  margin: 0;
}

/* 主内容区域布局 */
.shop-main {
  display: flex;
  min-height: calc(100vh - var(--header-height, 60px) - var(--footer-height, 100px));
  margin-bottom: 0;
}

/* 侧边栏样式 - 实现精确尺寸和位置控制 */
  .sidebar-container {
    /* 侧边栏宽度调整为内容区域的约25% */
    width: 25%;
    max-width: 300px;
    min-width: 240px;
    flex-shrink: 0;
    margin-right: 2rem;
    margin-left: 0;
    margin-top: 0;
    margin-bottom: 0;
    padding: 0;
    box-sizing: border-box;
    
    /* 实现与导航栏底边精确对齐 */
    position: sticky;
    top: var(--header-height, 60px);
    
    /* 精确计算侧边栏高度，确保与页尾对齐 */
    height: 100%;
    max-height: calc(var(--max-sidebar-height, 100vh - var(--header-height, 60px)));
    min-height: 0;
    
    /* 添加平滑过渡效果 */
    transition: transform 0.2s ease-out;
    transform: translateY(var(--sidebar-translate-y, 0px));
    overflow-y: auto;
    
    /* 确保滚动条样式统一 */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f1f5f9;
    
    /* 移除任何可能导致间隙的边框 */
    border: none;
    outline: none;
  }

/* 自定义滚动条样式 */
.sidebar-container::-webkit-scrollbar {
  width: 6px;
}

.sidebar-container::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.sidebar-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.sidebar-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 内容区域 */
.content-container {
  flex: 1;
  padding: 0 1.5rem;
}

/* 搜索栏 - 优化样式和尺寸 */
.search-bar {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.search-bar .input-group {
  width: auto;
  max-width: 350px;
  min-width: 280px;
}

.search-input {
  height: 2.5rem;
  font-size: 0.9rem;
  border-radius: 0.375rem 0 0 0.375rem;
  transition: all 0.2s ease;
}

.search-btn {
  height: 2.5rem;
  font-size: 0.9rem;
  border-radius: 0 0.375rem 0.375rem 0;
  min-width: 80px;
  transition: all 0.2s ease;
}

/* 筛选条件显示区域 */
.active-filters {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background-color: #e9ecef;
  border-radius: 1.25rem;
  font-size: 0.875rem;
  color: #495057;
  transition: all 0.2s ease;
}

.filter-tag .close {
  margin-left: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  color: #6c757d;
  background: none;
  border: none;
  padding: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.filter-tag .close:hover {
  background-color: #dee2e6;
  color: #495057;
}

.reset-filters {
  color: #6c757d;
  text-decoration: none;
  font-size: 0.875rem;
  margin-left: auto;
  transition: color 0.2s ease;
}

.reset-filters:hover {
  color: #495057;
  text-decoration: underline;
}

/* 排序控件 */
.sort-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.result-count {
  color: #6c757d;
  font-size: 0.875rem;
}

/* 商品网格 */
.boxes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-bottom: 2rem;
}

/* 响应式设计 - 大屏幕 */
@media (min-width: 1400px) {
  .sidebar-container {
    max-width: 320px;
  }
  
  .boxes-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

/* 响应式设计 - 中等屏幕 */
@media (max-width: 1200px) {
  .sidebar-container {
    width: 28%;
    max-width: 280px;
  }
  
  .search-bar .input-group {
    max-width: 300px;
  }
}

/* 响应式设计 - 平板屏幕 */
@media (max-width: 992px) {
  .shop-main {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .sidebar-container {
    width: 100%;
    max-width: none;
    height: auto;
    position: static;
    margin-bottom: 1rem;
  }
  
  .content-container {
    padding: 0 1rem;
  }
  
  .search-bar {
    justify-content: center;
    margin-top: 0.5rem;
  }
  
  .search-bar .input-group {
    width: 100%;
    max-width: none;
  }
  
  .sort-controls {
    justify-content: center;
    text-align: center;
  }
  
  .result-count {
    order: -1;
    width: 100%;
  }
}

/* 响应式设计 - 小屏幕 */
@media (max-width: 768px) {
  .active-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .reset-filters {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .boxes-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
}

/* 响应式设计 - 移动端 */
@media (max-width: 576px) {
  .shop-container {
    padding: 0.75rem 0;
  }
  
  .content-container {
    padding: 0 0.75rem;
  }
  
  .search-input {
    height: 2.25rem;
    font-size: 0.875rem;
  }
  
  .search-btn {
    height: 2.25rem;
    font-size: 0.875rem;
    min-width: 70px;
  }
  
  .boxes-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .pagination {
    padding-bottom: 1.5rem;
  }
}
</style>