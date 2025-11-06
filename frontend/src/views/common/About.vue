<template>
  <div class="about-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header text-center mb-5">
        <h1 class="page-title">关于芒盒</h1>
        <p class="page-subtitle">专业的盲盒销售与收藏平台</p>
      </div>

      <!-- 平台介绍 -->
      <div class="row mb-5">
        <div class="col-lg-8 mx-auto">
          <div class="intro-card card">
            <div class="card-body text-center">
              <img :src="logoImage" alt="芒盒" class="about-logo mb-4">
              <p class="lead">
                芒盒致力于为盲盒爱好者提供最优质的购物体验，打造集销售、收藏、社交于一体的综合性平台。
                我们相信每个盲盒都承载着独特的惊喜和情感价值。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 特色功能 -->
      <div class="row mb-5">
        <div class="col-12">
          <h3 class="section-title text-center mb-4">平台特色</h3>
          <div class="row g-4">
            <div v-for="feature in features" :key="feature.id" class="col-md-4">
              <div class="feature-card card text-center h-100">
                <div class="card-body">
                  <div class="feature-icon mb-3" :style="{ color: feature.color }">
                    <i :class="['bi', feature.icon]"></i>
                  </div>
                  <h5 class="card-title">{{ feature.title }}</h5>
                  <p class="card-text">{{ feature.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="row mb-5">
        <div class="col-12">
          <div class="stats-section">
            <h3 class="section-title text-center mb-4">平台数据</h3>
            <div class="row text-center">
              <div v-for="stat in stats" :key="stat.id" class="col-md-3 col-6 mb-4">
                <div class="stat-item">
                  <div class="stat-number">{{ stat.number }}</div>
                  <div class="stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 团队介绍 -->
      <div class="row mb-5">
        <div class="col-12">
          <h3 class="section-title text-center mb-4">开发团队</h3>
          <div class="row g-4 justify-content-center">
            <div v-for="member in teamMembers" :key="member.id" class="col-md-3 col-sm-6">
              <div class="team-card card text-center">
                <div class="card-body">
                  <img :src="member.avatar" :alt="member.name" class="team-avatar mb-3">
                  <h6 class="card-title">{{ member.name }}</h6>
                  <p class="card-text text-muted small">{{ member.role }}</p>
                  <p class="card-text small">{{ member.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系信息 -->
      <div class="row">
        <div class="col-12">
          <div class="contact-info text-center">
            <h3 class="mb-4">联系我们</h3>
            <div class="row justify-content-center">
              <div class="col-md-4 mb-3">
                <div class="contact-item">
                  <i class="bi bi-envelope contact-icon"></i>
                  <p>客服邮箱</p>
                  <strong>support@manghe.com</strong>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="contact-item">
                  <i class="bi bi-telephone contact-icon"></i>
                  <p>客服热线</p>
                  <strong>400-888-9999</strong>
                </div>
              </div>
              <div class="col-md-4 mb-3">
                <div class="contact-item">
                  <i class="bi bi-clock contact-icon"></i>
                  <p>服务时间</p>
                  <strong>9:00-18:00</strong>
                </div>
              </div>
            </div>

            <!-- 社交媒体 -->
            <div class="social-links mt-4">
              <a href="#" class="social-link">
                <i class="bi bi-wechat"></i>
              </a>
              <a href="#" class="social-link">
                <i class="bi bi-weibo"></i>
              </a>
              <a href="#" class="social-link">
                <i class="bi bi-qq"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

// 导入Logo图片
// 使用public目录下的Logo
const logoImage = '/images/Logo.png'

export default {
  name: 'AboutPage',
  setup() {
    const features = ref([
      {
        id: 1,
        icon: 'bi-box-seam',
        title: '海量正版盲盒',
        description: '与知名IP合作，提供丰富多样的正版盲盒系列',
        color: '#6B21A8'
      },
      {
        id: 2,
        icon: 'bi-gift',
        title: '沉浸式开盒',
        description: '3D开盒动画，还原真实开盒的惊喜体验',
        color: '#EC4899'
      },
      {
        id: 3,
        icon: 'bi-collection',
        title: '虚拟收藏馆',
        description: '3D虚拟展馆，展示你的珍贵收藏',
        color: '#3B82F6'
      },
      {
        id: 4,
        icon: 'bi-people',
        title: '活跃社区',
        description: '与同好交流分享，发现更多乐趣',
        color: '#10B981'
      },
      {
        id: 5,
        icon: 'bi-shield-check',
        title: '安全交易',
        description: '多重安全保障，购物更放心',
        color: '#F59E0B'
      },
      {
        id: 6,
        icon: 'bi-graph-up',
        title: '收藏价值',
        description: '稀有款式评估，了解收藏价值',
        color: '#8B5CF6'
      }
    ])

    const stats = ref([
      { id: 1, number: '10,000+', label: '注册用户' },
      { id: 2, number: '5,000+', label: '盲盒系列' },
      { id: 3, number: '100,000+', label: '成功交易' },
      { id: 4, number: '50+', label: '合作品牌' }
    ])

    const teamMembers = ref([
      {
        id: 1,
        name: '张巡',
        role: '项目指导',
        description: '资深互联网产品专家',
        avatar: '/images/default-avatar.svg'
      },
      {
        id: 2,
        name: '蔡杰',
        role: '前端开发',
        description: 'Vue.js技术专家',
        avatar: '/images/default-avatar.svg'
      },
      {
        id: 3,
        name: '吴志豪',
        role: 'UI设计',
        description: '专业UI设计师',
        avatar: '/images/default-avatar.svg'
      }
    ])

    onMounted(() => {
      // 可以在这里添加数据加载逻辑
    })

    return {
      logoImage,
      features,
      stats,
      teamMembers
    }
  }
}
</script>

<style scoped>
.about-page {
  padding: 2rem 0;
  min-height: 60vh;
}

.page-header {
  margin-bottom: 3rem;
}

.page-title {
  font-weight: 700;
  color: var(--dark-night);
  margin-bottom: 1rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1.2rem;
}

.about-logo {
  height: 80px;
  width: auto;
  object-fit: contain;
}

.intro-card {
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
}

.feature-card {
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(107, 33, 168, 0.15);
}

.feature-icon {
  font-size: 3rem;
}

.section-title {
  color: var(--dark-night);
  font-weight: 600;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: var(--primary-purple);
  border-radius: 2px;
}

.stats-section {
  background: linear-gradient(135deg, var(--primary-purple), var(--neon-pink));
  color: white;
  padding: 3rem 2rem;
  border-radius: 16px;
}

.stats-section .section-title {
  color: white;
}

.stats-section .section-title::after {
  background: white;
}

.stat-item {
  padding: 1rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
}

.team-card {
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-5px);
}

.team-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-purple);
}

.contact-info {
  background: linear-gradient(135deg, var(--moon-silver), #f8f9fa);
  padding: 3rem 2rem;
  border-radius: 16px;
}

.contact-item {
  padding: 1rem;
}

.contact-icon {
  font-size: 2.5rem;
  color: var(--primary-purple);
  margin-bottom: 1rem;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: var(--primary-purple);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: var(--neon-pink);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-page {
    padding: 1rem 0;
  }

  .feature-icon {
    font-size: 2.5rem;
  }

  .stat-number {
    font-size: 2rem;
  }

  .contact-info {
    padding: 2rem 1rem;
  }
}
</style>