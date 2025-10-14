<template>
  <div class="collection-page container mt-4">
    <div class="row">
      <div class="col-12">
        <h2 class="mb-4">我的收藏馆</h2>

        <!-- 收藏统计 -->
        <div class="row mb-4">
          <div class="col-md-3 col-6">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-primary">
                  <i class="bi bi-collection"></i>
                </div>
                <h4 class="text-primary">{{ totalCollections }}</h4>
                <p class="text-muted mb-0">总收藏数</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-success">
                  <i class="bi bi-layers"></i>
                </div>
                <h4 class="text-success">{{ uniqueSeries }}</h4>
                <p class="text-muted mb-0">系列数</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-warning">
                  <i class="bi bi-star"></i>
                </div>
                <h4 class="text-warning">{{ rareItems }}</h4>
                <p class="text-muted mb-0">稀有物品</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="stat-card card text-center">
              <div class="card-body">
                <div class="stat-icon text-info">
                  <i class="bi bi-graph-up"></i>
                </div>
                <h4 class="text-info">{{ completionRate }}%</h4>
                <p class="text-muted mb-0">收集完成度</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 视图切换 -->
        <div class="view-controls mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <h4>我的收藏</h4>
            <div class="btn-group">
              <button
                  class="btn"
                  :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="viewMode = 'grid'"
              >
                <i class="bi bi-grid"></i> 网格视图
              </button>
              <button
                  class="btn"
                  :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="viewMode = 'list'"
              >
                <i class="bi bi-list"></i> 列表视图
              </button>
              <button
                  class="btn"
                  :class="viewMode === '3d' ? 'btn-primary' : 'btn-outline-primary'"
                  @click="viewMode = '3d'"
              >
                <i class="bi bi-box"></i> 3D展馆
              </button>
            </div>
          </div>
        </div>

        <!-- 3D虚拟展馆 -->
        <div v-if="viewMode === '3d'" class="virtual-gallery-container">
          <div class="gallery-controls mb-3">
            <div class="row align-items-center">
              <div class="col-md-6">
                <div class="btn-group">
                  <button class="btn btn-outline-secondary btn-sm" @click="rotateGallery('left')">
                    <i class="bi bi-arrow-left"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" @click="rotateGallery('right')">
                    <i class="bi bi-arrow-right"></i>
                  </button>
                  <button class="btn btn-outline-secondary btn-sm" @click="resetGallery">
                    <i class="bi bi-arrow-clockwise"></i> 重置视角
                  </button>
                </div>
              </div>
              <div class="col-md-6 text-end">
                <div class="form-check form-switch d-inline-block">
                  <input class="form-check-input" type="checkbox" v-model="autoRotate">
                  <label class="form-check-label">自动旋转</label>
                </div>
              </div>
            </div>
          </div>

          <div class="virtual-gallery" ref="galleryContainer">
            <div class="gallery-scene" :style="{ transform: `rotateY(${rotationY}deg) rotateX(${rotationX}deg)` }">
              <!-- 展厅墙壁 -->
              <div class="gallery-wall wall-front">
                <div class="wall-label">最新收藏</div>
                <div class="exhibit-grid">
                  <div v-for="item in recentCollections" :key="item.id"
                       class="exhibit-item" @click="selectExhibit(item)">
                    <img :src="item.image" :alt="item.name">
                    <div class="exhibit-info">
                      <span class="rarity-badge" :class="item.rarity">{{ item.rarity }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="gallery-wall wall-right">
                <div class="wall-label">稀有收藏</div>
                <div class="exhibit-grid">
                  <div v-for="item in rareCollections" :key="item.id"
                       class="exhibit-item" @click="selectExhibit(item)">
                    <img :src="item.image" :alt="item.name">
                    <div class="exhibit-info">
                      <span class="rarity-badge" :class="item.rarity">{{ item.rarity }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="gallery-wall wall-back">
                <div class="wall-label">经典系列</div>
                <div class="exhibit-grid">
                  <div v-for="item in classicCollections" :key="item.id"
                       class="exhibit-item" @click="selectExhibit(item)">
                    <img :src="item.image" :alt="item.name">
                    <div class="exhibit-info">
                      <span class="rarity-badge" :class="item.rarity">{{ item.rarity }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="gallery-wall wall-left">
                <div class="wall-label">隐藏款式</div>
                <div class="exhibit-grid">
                  <div v-for="item in hiddenCollections" :key="item.id"
                       class="exhibit-item highlight" @click="selectExhibit(item)">
                    <img :src="item.image" :alt="item.name">
                    <div class="exhibit-info">
                      <span class="rarity-badge" :class="item.rarity">{{ item.rarity }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 天花板和地板 -->
              <div class="gallery-ceiling"></div>
              <div class="gallery-floor"></div>
            </div>
          </div>

          <!-- 展品详情模态框 -->
          <div v-if="selectedExhibit" class="exhibit-modal">
            <div class="modal-content">
              <button class="close-btn" @click="selectedExhibit = null">×</button>
              <div class="row">
                <div class="col-md-6">
                  <img :src="selectedExhibit.image" :alt="selectedExhibit.name" class="exhibit-image">
                </div>
                <div class="col-md-6">
                  <h4>{{ selectedExhibit.name }}</h4>
                  <p class="text-muted">{{ selectedExhibit.series }}</p>
                  <div class="exhibit-details">
                    <p><strong>稀有度:</strong> <span class="badge" :class="selectedExhibit.rarity">{{ selectedExhibit.rarity }}</span></p>
                    <p><strong>获得时间:</strong> {{ selectedExhibit.acquiredDate }}</p>
                    <p><strong>编号:</strong> #{{ selectedExhibit.id }}</p>
                    <p><strong>描述:</strong> {{ selectedExhibit.description }}</p>
                  </div>
                  <div class="action-buttons mt-4">
                    <button class="btn btn-primary me-2" @click="shareExhibit">
                      <i class="bi bi-share me-1"></i>分享
                    </button>
                    <button class="btn btn-outline-secondary">
                      <i class="bi bi-download me-1"></i>保存图片
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="grid-view">
          <div class="row">
            <div v-for="item in collections" :key="item.id" class="col-xl-3 col-lg-4 col-md-6 mb-4">
              <div class="card collection-item h-100">
                <img :src="item.image" class="card-img-top" :alt="item.name">
                <div class="card-body">
                  <h6 class="card-title">{{ item.name }}</h6>
                  <p class="card-text text-muted small">{{ item.series }}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge" :class="getRarityClass(item.rarity)">{{ item.rarity }}</span>
                    <small class="text-muted">获得于 {{ item.acquiredDate }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-view">
          <div class="card">
            <div class="card-body">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>物品</th>
                    <th>系列</th>
                    <th>稀有度</th>
                    <th>获得时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in collections" :key="item.id">
                    <td>
                      <div class="d-flex align-items-center">
                        <img :src="item.image" :alt="item.name" class="list-item-image me-3">
                        <span>{{ item.name }}</span>
                      </div>
                    </td>
                    <td>{{ item.series }}</td>
                    <td>
                      <span class="badge" :class="getRarityClass(item.rarity)">{{ item.rarity }}</span>
                    </td>
                    <td>{{ item.acquiredDate }}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary me-1">查看</button>
                      <button class="btn btn-sm btn-outline-secondary">分享</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="collections.length === 0" class="col-12 text-center py-5">
          <div class="empty-state">
            <i class="bi bi-inbox display-1 text-muted"></i>
            <h4 class="mt-3 text-muted">还没有收藏任何盲盒</h4>
            <p class="text-muted">快去商城发现你喜欢的盲盒吧！</p>
            <router-link to="/shop" class="btn btn-primary">去商城逛逛</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'

export default {
  name: 'CollectionPage',
  setup() {
    const collections = ref([])
    const viewMode = ref('grid')
    const rotationY = ref(0)
    const rotationX = ref(0)
    const autoRotate = ref(false)
    const selectedExhibit = ref(null)
    const galleryContainer = ref(null)

    // 模拟收藏数据
    const mockCollections = [
      {
        id: 1,
        name: '星空幻想 - 隐藏款',
        series: '星空幻想系列',
        image: 'https://via.placeholder.com/200x200/6B21A8/FFFFFF?text=隐藏款',
        rarity: '隐藏',
        acquiredDate: '2024-01-15',
        description: '极其稀有的隐藏款式，拥有独特的星空特效'
      },
      {
        id: 2,
        name: '森林物语 - 普通款',
        series: '森林物语系列',
        image: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=普通款',
        rarity: '普通',
        acquiredDate: '2024-01-10',
        description: '经典的森林主题款式'
      },
      {
        id: 3,
        name: '海洋奇缘 - 稀有款',
        series: '海洋奇缘系列',
        image: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=稀有款',
        rarity: '稀有',
        acquiredDate: '2024-01-08',
        description: '带有海洋波纹特效的稀有款式'
      },
      {
        id: 4,
        name: '城市探险 - 史诗款',
        series: '城市探险系列',
        image: 'https://via.placeholder.com/200x200/8B5CF6/FFFFFF?text=史诗款',
        rarity: '史诗',
        acquiredDate: '2024-01-05',
        description: '展现城市风貌的史诗级收藏品'
      },
      {
        id: 5,
        name: '夏日限定 - 传说款',
        series: '夏日限定系列',
        image: 'https://via.placeholder.com/200x200/F59E0B/FFFFFF?text=传说款',
        rarity: '传说',
        acquiredDate: '2024-01-03',
        description: '夏季限定的传说级收藏品'
      },
      {
        id: 6,
        name: '复古经典 - 普通款',
        series: '复古经典系列',
        image: 'https://via.placeholder.com/200x200/6B7280/FFFFFF?text=普通款',
        rarity: '普通',
        acquiredDate: '2024-01-01',
        description: '怀旧风格的经典款式'
      }
    ]

    // 计算属性
    const totalCollections = computed(() => collections.value.length)
    const uniqueSeries = computed(() => new Set(collections.value.map(item => item.series)).size)
    const rareItems = computed(() => collections.value.filter(item =>
        ['稀有', '史诗', '传说', '隐藏'].includes(item.rarity)
    ).length)
    const completionRate = computed(() => {
      return collections.value.length > 0 ? Math.round((collections.value.length / 20) * 100) : 0
    })

    // 3D展厅分类数据
    const recentCollections = computed(() =>
        collections.value.slice(0, 4).map(item => ({ ...item, rarity: item.rarity.toLowerCase() }))
    )

    const rareCollections = computed(() =>
        collections.value.filter(item => ['稀有', '史诗', '传说'].includes(item.rarity))
            .slice(0, 4)
            .map(item => ({ ...item, rarity: item.rarity.toLowerCase() }))
    )

    const classicCollections = computed(() =>
        collections.value.filter(item => item.series.includes('经典') || item.series.includes('复古'))
            .slice(0, 4)
            .map(item => ({ ...item, rarity: item.rarity.toLowerCase() }))
    )

    const hiddenCollections = computed(() =>
        collections.value.filter(item => item.rarity === '隐藏')
            .map(item => ({ ...item, rarity: item.rarity.toLowerCase() }))
    )

    // 方法
    const getRarityClass = (rarity) => {
      const classes = {
        '隐藏': 'bg-danger',
        '传说': 'bg-warning',
        '史诗': 'bg-purple',
        '稀有': 'bg-info',
        '普通': 'bg-secondary'
      }
      return classes[rarity] || 'bg-secondary'
    }

    const rotateGallery = (direction) => {
      if (direction === 'left') {
        rotationY.value -= 90
      } else if (direction === 'right') {
        rotationY.value += 90
      }
    }

    const resetGallery = () => {
      rotationY.value = 0
      rotationX.value = 0
    }

    const selectExhibit = (item) => {
      selectedExhibit.value = item
    }

    const shareExhibit = () => {
      if (selectedExhibit.value) {
        console.log('分享展品:', selectedExhibit.value)
        alert(`分享 ${selectedExhibit.value.name} 到社交媒体`)
      }
    }

    // 自动旋转逻辑
    watch(autoRotate, (newVal) => {
      if (newVal) {
        const interval = setInterval(() => {
          rotationY.value += 1
        }, 50)

        // 清理函数
        return () => clearInterval(interval)
      }
    })

    // 拖拽旋转逻辑
    const setupDragRotation = () => {
      if (!galleryContainer.value) return

      let isDragging = false
      let startX, startY

      const onMouseDown = (e) => {
        isDragging = true
        startX = e.clientX
        startY = e.clientY
      }

      const onMouseMove = (e) => {
        if (!isDragging) return

        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY

        rotationY.value += deltaX * 0.5
        rotationX.value -= deltaY * 0.5

        startX = e.clientX
        startY = e.clientY
      }

      const onMouseUp = () => {
        isDragging = false
      }

      galleryContainer.value.addEventListener('mousedown', onMouseDown)
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)

      // 清理函数
      return () => {
        if (galleryContainer.value) {
          galleryContainer.value.removeEventListener('mousedown', onMouseDown)
        }
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
    }

    onMounted(() => {
      // 模拟加载数据
      setTimeout(() => {
        collections.value = mockCollections
      }, 500)

      // 设置拖拽旋转
      setupDragRotation()
    })

    return {
      collections,
      viewMode,
      rotationY,
      rotationX,
      autoRotate,
      selectedExhibit,
      galleryContainer,
      totalCollections,
      uniqueSeries,
      rareItems,
      completionRate,
      recentCollections,
      rareCollections,
      classicCollections,
      hiddenCollections,
      getRarityClass,
      rotateGallery,
      resetGallery,
      selectExhibit,
      shareExhibit
    }
  }
}
</script>

<style scoped>
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

/* 3D虚拟展馆样式 */
.virtual-gallery-container {
  position: relative;
  height: 500px;
  perspective: 1200px;
}

.virtual-gallery {
  width: 100%;
  height: 100%;
  position: relative;
}

.gallery-scene {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1s ease;
}

.gallery-wall {
  position: absolute;
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(243,244,246,0.8));
  border: 2px solid rgba(107, 33, 168, 0.1);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
}

.wall-front {
  transform: translateZ(150px);
}

.wall-right {
  transform: rotateY(90deg) translateZ(150px);
}

.wall-back {
  transform: rotateY(180deg) translateZ(150px);
}

.wall-left {
  transform: rotateY(-90deg) translateZ(150px);
}

.gallery-ceiling {
  position: absolute;
  width: 300px;
  height: 300px;
  background: linear-gradient(rgba(107, 33, 168, 0.05), rgba(236, 72, 153, 0.05));
  transform: rotateX(90deg) translateZ(150px);
}

.gallery-floor {
  position: absolute;
  width: 300px;
  height: 300px;
  background: linear-gradient(rgba(59, 130, 246, 0.05), rgba(245, 158, 11, 0.05));
  transform: rotateX(-90deg) translateZ(150px);
}

.wall-label {
  position: absolute;
  top: -2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary-purple);
  color: white;
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.exhibit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  height: 100%;
  align-content: center;
}

.exhibit-item {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
}

.exhibit-item:hover {
  transform: scale(1.1);
  z-index: 10;
}

.exhibit-item.highlight {
  animation: pulse 2s infinite;
}

.exhibit-item img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.exhibit-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  padding: 0.25rem;
  text-align: center;
}

.rarity-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  color: white;
}

.rarity-badge.隐藏 { background: #dc3545; }
.rarity-badge.传说 { background: #fd7e14; }
.rarity-badge.史诗 { background: #6f42c1; }
.rarity-badge.稀有 { background: #0dcaf0; }
.rarity-badge.普通 { background: #6c757d; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 5px rgba(236, 72, 153, 0.5); }
  50% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.8); }
}

/* 展品详情模态框 */
.exhibit-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6c757d;
}

.exhibit-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 12px;
}

/* 网格和列表视图样式 */
.collection-item {
  transition: transform 0.3s ease;
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.collection-item:hover {
  transform: translateY(-5px);
}

.list-item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

.bg-purple {
  background-color: #6f42c1 !important;
}

.empty-state {
  max-width: 400px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .virtual-gallery-container {
    height: 300px;
  }

  .gallery-wall {
    width: 200px;
    height: 200px;
  }

  .wall-front {
    transform: translateZ(100px);
  }

  .wall-right {
    transform: rotateY(90deg) translateZ(100px);
  }

  .wall-back {
    transform: rotateY(180deg) translateZ(100px);
  }

  .wall-left {
    transform: rotateY(-90deg) translateZ(100px);
  }

  .gallery-ceiling {
    width: 200px;
    height: 200px;
    transform: rotateX(90deg) translateZ(100px);
  }

  .gallery-floor {
    width: 200px;
    height: 200px;
    transform: rotateX(-90deg) translateZ(100px);
  }

  .exhibit-item img {
    height: 60px;
  }
}
</style>