<template>
  <div class="shop-page container mt-4">
    <!-- 页面标题和搜索 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center">
          <h2 class="mb-0">盲盒商城</h2>
          <div class="search-box" style="max-width: 300px;">
            <div class="input-group">
              <input type="text" class="form-control" placeholder="搜索盲盒系列...">
              <button class="btn btn-primary">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="filter-section card">
          <div class="card-body">
            <div class="row g-3">
              <!-- 系列筛选 -->
              <div class="col-md-3">
                <label class="form-label">系列</label>
                <select class="form-select">
                  <option value="">全部系列</option>
                  <option value="星空幻想">星空幻想系列</option>
                  <option value="森林物语">森林物语系列</option>
                  <option value="海洋奇缘">海洋奇缘系列</option>
                  <option value="城市探险">城市探险系列</option>
                </select>
              </div>

              <!-- 价格筛选 -->
              <div class="col-md-3">
                <label class="form-label">价格范围</label>
                <select class="form-select">
                  <option value="">全部价格</option>
                  <option value="0-50">¥0 - ¥50</option>
                  <option value="50-100">¥50 - ¥100</option>
                  <option value="100-200">¥100 - ¥200</option>
                  <option value="200+">¥200以上</option>
                </select>
              </div>

              <!-- 稀有度筛选 -->
              <div class="col-md-3">
                <label class="form-label">稀有度</label>
                <select class="form-select">
                  <option value="">全部稀有度</option>
                  <option value="普通">普通</option>
                  <option value="稀有">稀有</option>
                  <option value="史诗">史诗</option>
                  <option value="传说">传说</option>
                  <option value="隐藏">隐藏</option>
                </select>
              </div>

              <!-- 排序方式 -->
              <div class="col-md-3">
                <label class="form-label">排序方式</label>
                <select class="form-select">
                  <option value="newest">最新上架</option>
                  <option value="price-low">价格从低到高</option>
                  <option value="price-high">价格从高到低</option>
                  <option value="popular">最受欢迎</option>
                  <option value="rating">评分最高</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 商品网格 -->
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">所有盲盒</h4>
          <span class="text-muted">共 {{ filteredBoxes.length }} 个商品</span>
        </div>
      </div>
    </div>

    <div class="row">
      <BoxCard
          v-for="box in filteredBoxes"
          :key="box.id"
          :box-data="box"
      />
    </div>

    <!-- 分页 -->
    <div class="row mt-5">
      <div class="col-12">
        <nav aria-label="Page navigation">
          <ul class="pagination justify-content-center">
            <li class="page-item disabled">
              <a class="page-link" href="#" tabindex="-1">上一页</a>
            </li>
            <li class="page-item active"><a class="page-link" href="#">1</a></li>
            <li class="page-item"><a class="page-link" href="#">2</a></li>
            <li class="page-item"><a class="page-link" href="#">3</a></li>
            <li class="page-item">
              <a class="page-link" href="#">下一页</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import BoxCard from '@/components/common/BoxCard.vue'

export default {
  name: 'ShopPage',
  components: {
    BoxCard
  },
  setup() {
    const boxes = ref([])
    const searchQuery = ref('')
    const selectedSeries = ref('')
    const priceRange = ref('')
    const rarityFilter = ref('')
    const sortBy = ref('newest')

    // 模拟数据
    const mockBoxes = [
      {
        id: 1,
        name: '星空幻想 - 银河守护者',
        series: '星空幻想系列',
        image: 'https://via.placeholder.com/300x300/6B21A8/FFFFFF?text=星空幻想',
        price: 89,
        rating: 4.8,
        stock: 156,
        isLimited: true,
        isNew: true,
        rarity: '稀有'
      },
      {
        id: 2,
        name: '森林物语 - 精灵仙子',
        series: '森林物语系列',
        image: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=森林物语',
        price: 79,
        rating: 4.6,
        stock: 89,
        isLimited: false,
        isNew: false,
        rarity: '普通'
      },
      {
        id: 3,
        name: '海洋奇缘 - 深海美人鱼',
        series: '海洋奇缘系列',
        image: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=海洋奇缘',
        price: 99,
        rating: 4.9,
        stock: 45,
        isLimited: true,
        isNew: true,
        rarity: '史诗'
      },
      {
        id: 4,
        name: '城市探险 - 都市探险家',
        series: '城市探险系列',
        image: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=城市探险',
        price: 85,
        rating: 4.7,
        stock: 120,
        isLimited: false,
        isNew: true,
        rarity: '稀有'
      },
      {
        id: 5,
        name: '复古经典 - 怀旧时光',
        series: '复古经典系列',
        image: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=复古经典',
        price: 95,
        rating: 4.5,
        stock: 78,
        isLimited: true,
        isNew: false,
        rarity: '传说'
      },
      {
        id: 6,
        name: '夏日限定 - 海滩派对',
        series: '夏日限定系列',
        image: 'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=夏日限定',
        price: 88,
        rating: 4.8,
        stock: 34,
        isLimited: true,
        isNew: true,
        rarity: '隐藏'
      }
    ]

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

      // 系列过滤
      if (selectedSeries.value) {
        filtered = filtered.filter(box => box.series === selectedSeries.value)
      }

      // 价格范围过滤
      if (priceRange.value) {
        filtered = filtered.filter(box => {
          const [min, max] = priceRange.value.split('-').map(Number)
          if (max) {
            return box.price >= min && box.price <= max
          } else {
            return box.price >= min
          }
        })
      }

      // 稀有度过滤
      if (rarityFilter.value) {
        filtered = filtered.filter(box => box.rarity === rarityFilter.value)
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

    const fetchBoxes = async () => {
      // 模拟API调用
      setTimeout(() => {
        boxes.value = mockBoxes
      }, 500)
    }

    onMounted(() => {
      fetchBoxes()
    })

    return {
      boxes,
      searchQuery,
      selectedSeries,
      priceRange,
      rarityFilter,
      sortBy,
      filteredBoxes
    }
  }
}
</script>

<style scoped>
.filter-section {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.search-box .form-control {
  border-right: none;
}

.search-box .btn {
  border-left: none;
}

.pagination .page-item .page-link {
  color: var(--primary-purple);
  border: 1px solid #dee2e6;
}

.pagination .page-item.active .page-link {
  background-color: var(--primary-purple);
  border-color: var(--primary-purple);
  color: white;
}

.pagination .page-item .page-link:hover {
  background-color: #e9ecef;
  border-color: #dee2e6;
}
</style>