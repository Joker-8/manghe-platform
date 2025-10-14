<template>
  <div class="open-box-page container mt-4">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <!-- 页面标题和统计 -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
              <h2 class="mb-0">开启盲盒</h2>
              <div class="open-stats">
                <span class="badge bg-primary me-2">今日已开: {{ todayOpened }}/5</span>
                <span class="badge bg-success">总开盒数: {{ totalOpened }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <!-- 左侧：盲盒选择和开盒区域 -->
          <div class="col-lg-8">
            <!-- 盲盒选择区域 -->
            <div class="box-selection mb-4" v-if="!selectedBox">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">选择要开启的盲盒</h5>
                </div>
                <div class="card-body">
                  <div class="row">
                    <div v-for="box in availableBoxes" :key="box.id" class="col-md-6 mb-3">
                      <div class="box-option card h-100" @click="selectBox(box)" :class="{ 'selected': selectedBox?.id === box.id }">
                        <div class="card-img-container">
                          <img :src="box.image" class="card-img-top" :alt="box.name">
                          <div class="box-overlay">
                            <span class="badge bg-danger" v-if="box.isLimited">限量</span>
                            <span class="badge bg-success" v-if="box.isNew">新品</span>
                          </div>
                        </div>
                        <div class="card-body">
                          <h6 class="card-title">{{ box.name }}</h6>
                          <p class="card-text text-muted small">{{ box.series }}</p>
                          <div class="d-flex justify-content-between align-items-center">
                            <span class="price fw-bold text-primary">¥{{ box.price }}</span>
                            <span class="text-muted small">库存: {{ box.stock }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 开盒过程 -->
            <div v-if="selectedBox" class="box-opening-process">
              <div class="card">
                <div class="card-body text-center">
                  <!-- 3D盒子容器 -->
                  <div class="box-3d-container" :class="{ shaking: isShaking, opening: isOpening }">
                    <div class="box-3d" @click="startOpening">
                      <div class="box-front">
                        <img :src="selectedBox.image" :alt="selectedBox.name">
                      </div>
                      <div class="box-back">
                        <div class="result-preview">
                          <img :src="resultItem.image" :alt="resultItem.name" v-if="showResult">
                        </div>
                      </div>
                      <div class="box-top"></div>
                      <div class="box-bottom"></div>
                      <div class="box-left"></div>
                      <div class="box-right"></div>
                    </div>
                  </div>

                  <!-- 粒子特效容器 -->
                  <div class="particles-container" v-if="showParticles">
                    <div v-for="particle in particles" :key="particle.id"
                         class="particle" :style="particle.style"></div>
                  </div>

                  <!-- 开盒统计 -->
                  <div class="opening-stats mt-4">
                    <div class="row text-center">
                      <div class="col-4">
                        <div class="stat-item">
                          <div class="stat-number">{{ openingStats.total }}</div>
                          <div class="stat-label">总开盒</div>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="stat-item">
                          <div class="stat-number">{{ openingStats.rare }}</div>
                          <div class="stat-label">稀有物品</div>
                        </div>
                      </div>
                      <div class="col-4">
                        <div class="stat-item">
                          <div class="stat-number">{{ openingStats.hidden }}%</div>
                          <div class="stat-label">隐藏概率</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="action-buttons mt-4">
                    <button class="btn btn-primary btn-lg me-3" @click="startOpening" :disabled="isOpening || todayOpened >= 5">
                      <span v-if="isOpening" class="spinner-border spinner-border-sm me-2"></span>
                      <i class="bi bi-gift me-2" v-else></i>
                      {{ isOpening ? '开启中...' : todayOpened >= 5 ? '今日次数已用完' : '立即开盒' }}
                    </button>
                    <button class="btn btn-outline-secondary btn-lg" @click="resetSelection">
                      <i class="bi bi-arrow-repeat me-2"></i>重新选择
                    </button>
                  </div>

                  <!-- 开盒提示 -->
                  <div class="opening-tips mt-3">
                    <p class="text-muted small">
                      <i class="bi bi-info-circle me-1"></i>
                      每日可免费开盒5次，稀有物品概率提升中！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：最近开盒记录 -->
          <div class="col-lg-4">
            <div class="recent-openings">
              <div class="card">
                <div class="card-header">
                  <h5 class="mb-0">最近开盒记录</h5>
                </div>
                <div class="card-body">
                  <div v-if="recentOpenings.length === 0" class="text-center py-3">
                    <i class="bi bi-inbox display-6 text-muted"></i>
                    <p class="text-muted mt-2">暂无开盒记录</p>
                  </div>
                  <div v-else>
                    <div v-for="record in recentOpenings" :key="record.id" class="recent-item mb-3">
                      <div class="d-flex align-items-center">
                        <img :src="record.itemImage" :alt="record.itemName" class="item-image me-3">
                        <div class="flex-grow-1">
                          <div class="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 class="mb-1">{{ record.itemName }}</h6>
                              <p class="text-muted small mb-0">{{ record.boxName }}</p>
                            </div>
                            <span class="badge" :class="getRarityClass(record.rarity)">{{ record.rarity }}</span>
                          </div>
                          <small class="text-muted">{{ record.time }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 概率公示 -->
              <div class="card mt-3">
                <div class="card-header">
                  <h5 class="mb-0">概率公示</h5>
                </div>
                <div class="card-body">
                  <div v-for="rate in probabilityRates" :key="rate.rarity" class="rate-item mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="rate-rarity" :class="getRarityClass(rate.rarity)">{{ rate.rarity }}</span>
                      <span class="rate-percentage">{{ rate.percentage }}%</span>
                    </div>
                    <div class="progress" style="height: 4px;">
                      <div class="progress-bar" :class="getRarityProgressClass(rate.rarity)"
                           :style="{ width: rate.percentage + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 开盒结果 -->
        <div v-if="showResult" class="result-container mt-4 animate__animated animate__fadeIn">
          <div class="card result-card">
            <div class="card-body text-center">
              <div class="result-header mb-4">
                <h4 class="text-success mb-2">
                  <i class="bi bi-stars me-2"></i>恭喜您！
                </h4>
                <p class="text-muted">获得了以下物品</p>
              </div>

              <div class="result-content" :class="resultItem.rarityClass">
                <div class="rarity-badge">
                  {{ resultItem.rarity }}
                </div>
                <img :src="resultItem.image" :alt="resultItem.name" class="result-image mb-3">
                <h5 class="card-title">{{ resultItem.name }}</h5>
                <p class="card-text text-muted">{{ resultItem.series }}</p>
                <div class="item-stats mb-3">
                  <span class="badge bg-light text-dark me-2">编号: #{{ resultItem.id }}</span>
                  <span class="badge bg-light text-dark">获得率: {{ resultItem.dropRate }}%</span>
                </div>
                <p class="item-description small text-muted">{{ resultItem.description }}</p>
              </div>

              <div class="result-actions mt-4">
                <button class="btn btn-outline-primary me-2" @click="shareResult">
                  <i class="bi bi-share me-1"></i>分享喜悦
                </button>
                <button class="btn btn-primary me-2" @click="addToCollection">
                  <i class="bi bi-heart me-1"></i>加入收藏
                </button>
                <button class="btn btn-success" @click="openAnother">
                  <i class="bi bi-gift me-1"></i>再开一个
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'OpenBoxPage',
  setup() {
    const store = useStore()
    const router = useRouter()

    const selectedBox = ref(null)
    const isShaking = ref(false)
    const isOpening = ref(false)
    const showParticles = ref(false)
    const showResult = ref(false)
    const todayOpened = ref(0)
    const totalOpened = ref(0)

    const particles = ref([])
    const availableBoxes = ref([])
    const recentOpenings = ref([])

    const resultItem = reactive({
      id: null,
      name: '',
      series: '',
      image: '',
      rarity: '',
      rarityClass: '',
      dropRate: 0,
      description: ''
    })

    const openingStats = reactive({
      total: 0,
      rare: 0,
      hidden: 2.5
    })

    const probabilityRates = ref([
      { rarity: '普通', percentage: 50 },
      { rarity: '稀有', percentage: 30 },
      { rarity: '史诗', percentage: 15 },
      { rarity: '传说', percentage: 5 },
      { rarity: '隐藏', percentage: 2.5 }
    ])

    // 模拟可开启的盲盒数据
    const mockBoxes = [
      {
        id: 1,
        name: '星空幻想系列',
        series: '第一弹',
        image: 'https://via.placeholder.com/200x200/6B21A8/FFFFFF?text=星空幻想',
        price: 89,
        stock: 156,
        isLimited: true,
        isNew: true
      },
      {
        id: 2,
        name: '森林物语系列',
        series: '季节限定',
        image: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=森林物语',
        price: 79,
        stock: 89,
        isLimited: false,
        isNew: false
      },
      {
        id: 3,
        name: '海洋奇缘系列',
        series: '特别版',
        image: 'https://via.placeholder.com/200x300/3B82F6/FFFFFF?text=海洋奇缘',
        price: 99,
        stock: 45,
        isLimited: true,
        isNew: true
      }
    ]

    // 模拟物品掉落池
    const itemPool = [
      {
        id: 1,
        name: '普通星星',
        series: '星空幻想系列',
        image: 'https://via.placeholder.com/150x150/6B7280/FFFFFF?text=普通',
        rarity: '普通',
        rarityClass: 'common',
        dropRate: 50,
        description: '基础的星星款式，收集之路的开始'
      },
      {
        id: 2,
        name: '闪亮星星',
        series: '星空幻想系列',
        image: 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=稀有',
        rarity: '稀有',
        rarityClass: 'rare',
        dropRate: 30,
        description: '散发着微光的稀有星星'
      },
      {
        id: 3,
        name: '璀璨星星',
        series: '星空幻想系列',
        image: 'https://via.placeholder.com/150x150/8B5CF6/FFFFFF?text=史诗',
        rarity: '史诗',
        rarityClass: 'epic',
        dropRate: 15,
        description: '光芒四射的史诗级收藏品'
      },
      {
        id: 4,
        name: '银河之心',
        series: '星空幻想系列',
        image: 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=传说',
        rarity: '传说',
        rarityClass: 'legendary',
        dropRate: 5,
        description: '传说中的银河之心，极其罕见'
      }
    ]

    // 计算属性
    const canOpenMore = computed(() => {
      return todayOpened.value < 5
    })

    const selectBox = (box) => {
      selectedBox.value = box
    }

    const resetSelection = () => {
      selectedBox.value = null
      showResult.value = false
    }

    const generateParticles = () => {
      particles.value = []
      for (let i = 0; i < 30; i++) {
        particles.value.push({
          id: i,
          style: {
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 1}s`,
            backgroundColor: getRandomColor()
          }
        })
      }
    }

    const getRandomColor = () => {
      const colors = ['#6B21A8', '#EC4899', '#3B82F6', '#F59E0B', '#10B981']
      return colors[Math.floor(Math.random() * colors.length)]
    }

    const getRandomItem = () => {
      const random = Math.random() * 100
      let cumulativeRate = 0

      for (const item of itemPool) {
        cumulativeRate += item.dropRate
        if (random <= cumulativeRate) {
          return { ...item }
        }
      }
      return itemPool[0]
    }

    const startOpening = async () => {
      if (isOpening.value || !selectedBox.value || !canOpenMore.value) return

      if (!store.getters.isLoggedIn) {
        router.push('/login')
        return
      }

      isOpening.value = true

      // 阶段1: 摇晃动画
      isShaking.value = true
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 阶段2: 粒子特效
      showParticles.value = true
      generateParticles()
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 阶段3: 开盒翻转
      isShaking.value = false
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 阶段4: 显示结果
      const item = getRandomItem()
      Object.assign(resultItem, item)
      showResult.value = true
      isOpening.value = false

      // 更新统计数据
      todayOpened.value++
      totalOpened.value++
      openingStats.total++

      if (item.rarity !== '普通') {
        openingStats.rare++
      }

      // 添加到最近开盒记录
      addToRecentOpenings(item)

      // 5秒后关闭粒子特效
      setTimeout(() => {
        showParticles.value = false
      }, 5000)
    }

    const addToRecentOpenings = (item) => {
      const record = {
        id: Date.now(),
        itemName: item.name,
        itemImage: item.image,
        boxName: selectedBox.value.name,
        rarity: item.rarity,
        time: '刚刚'
      }

      recentOpenings.value.unshift(record)

      // 只保留最近5条记录
      if (recentOpenings.value.length > 5) {
        recentOpenings.value = recentOpenings.value.slice(0, 5)
      }
    }

    const shareResult = () => {
      console.log('分享结果:', resultItem)
      alert(`分享 ${resultItem.name} 到社交媒体！`)
    }

    const addToCollection = () => {
      if (!store.getters.isLoggedIn) {
        alert('请先登录')
        return
      }
      console.log('添加到收藏:', resultItem)
      store.dispatch('addToCollection', resultItem)
      alert('已添加到收藏！')
    }

    const openAnother = () => {
      if (canOpenMore.value) {
        showResult.value = false
      } else {
        alert('今日开盒次数已用完，请明天再来！')
      }
    }

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

    const getRarityProgressClass = (rarity) => {
      const classes = {
        '隐藏': 'bg-danger',
        '传说': 'bg-warning',
        '史诗': 'bg-purple',
        '稀有': 'bg-info',
        '普通': 'bg-secondary'
      }
      return classes[rarity] || 'bg-secondary'
    }

    onMounted(() => {
      availableBoxes.value = mockBoxes

      // 模拟加载用户数据
      todayOpened.value = 2
      totalOpened.value = 24
      openingStats.total = 24
      openingStats.rare = 8
    })

    return {
      selectedBox,
      isShaking,
      isOpening,
      showParticles,
      showResult,
      particles,
      availableBoxes,
      resultItem,
      todayOpened,
      totalOpened,
      recentOpenings,
      openingStats,
      probabilityRates,
      canOpenMore,
      selectBox,
      resetSelection,
      startOpening,
      shareResult,
      addToCollection,
      openAnother,
      getRarityClass,
      getRarityProgressClass
    }
  }
}
</script>

<style scoped>
.box-option {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.box-option:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.box-option.selected {
  border-color: var(--primary-purple);
}

.card-img-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.box-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
}

.box-3d-container {
  perspective: 1000px;
  margin: 2rem auto;
  width: 200px;
  height: 200px;
  position: relative;
}

.box-3d {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 2s ease;
  cursor: pointer;
}

.box-3d-container.shaking .box-3d {
  animation: shake 0.5s ease-in-out infinite;
}

.box-3d-container.opening .box-3d {
  transform: rotateY(180deg);
}

.box-3d > div {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-purple), var(--neon-pink));
  border: 2px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
}

.box-front {
  transform: translateZ(100px);
}

.box-back {
  transform: rotateY(180deg) translateZ(100px);
  background: rgba(255,255,255,0.95) !important;
}

.box-top {
  transform: rotateX(90deg) translateZ(100px);
}

.box-bottom {
  transform: rotateX(-90deg) translateZ(100px);
}

.box-left {
  transform: rotateY(-90deg) translateZ(100px);
}

.box-right {
  transform: rotateY(90deg) translateZ(100px);
}

.box-3d img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-5px) rotate(-5deg); }
  75% { transform: translateX(5px) rotate(5deg); }
}

/* 粒子特效 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: particle-float 2s ease-out forwards;
}

@keyframes particle-float {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx, 100px), var(--ty, -100px)) scale(0);
    opacity: 0;
  }
}

/* 开盒统计 */
.opening-stats {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 1.5rem;
  border-radius: 12px;
}

.stat-item {
  padding: 0.5rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-purple);
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
}

/* 最近开盒记录 */
.recent-item {
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.recent-item:hover {
  background: #e9ecef;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
}

/* 概率公示 */
.rate-item {
  padding: 0.5rem 0;
}

.rate-rarity {
  font-size: 0.875rem;
  font-weight: 500;
}

.rate-percentage {
  font-size: 0.875rem;
  color: #6c757d;
}

/* 结果卡片样式 */
.result-card {
  border: none;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.result-content {
  position: relative;
  padding: 2rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8f9fa, #ffffff);
}

.rarity-badge {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--neon-pink);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.875rem;
  white-space: nowrap;
}

.result-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
}

.result-content.common {
  border: 2px solid #6B7280;
}

.result-content.rare {
  border: 2px solid #3B82F6;
}

.result-content.epic {
  border: 2px solid #8B5CF6;
}

.result-content.legendary {
  border: 2px solid #F59E0B;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
  }
  to {
    box-shadow: 0 15px 40px rgba(245, 158, 11, 0.6);
  }
}

.item-description {
  max-width: 400px;
  margin: 0 auto;
  line-height: 1.5;
}

.bg-purple {
  background-color: #6f42c1 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .box-3d-container {
    width: 150px;
    height: 150px;
  }

  .box-3d > div {
    transform-style: preserve-3d;
  }

  .box-front {
    transform: translateZ(75px);
  }

  .box-back {
    transform: rotateY(180deg) translateZ(75px);
  }

  .box-top {
    transform: rotateX(90deg) translateZ(75px);
  }

  .box-bottom {
    transform: rotateX(-90deg) translateZ(75px);
  }

  .box-left {
    transform: rotateY(-90deg) translateZ(75px);
  }

  .box-right {
    transform: rotateY(90deg) translateZ(75px);
  }

  .result-image {
    width: 150px;
    height: 150px;
  }

  .action-buttons .btn {
    margin-bottom: 0.5rem;
    width: 100%;
  }
}
</style>