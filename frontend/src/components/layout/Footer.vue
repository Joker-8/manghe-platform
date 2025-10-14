<template>
  <footer class="main-footer">
    <div class="container">
      <div class="row">
        <!-- 品牌信息 -->
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="footer-brand">
            <!-- 添加导航链接到首页 -->
            <router-link to="/" class="footer-logo-link">
              <img
                  :src="logoImage"
                  alt="芒盒"
                  class="footer-logo"
                  v-if="logoImage"
                  @error="handleLogoError"
              >
              <div v-else class="logo-icon">🎁</div>
            </router-link>
            <p class="brand-description">
              专业的盲盒销售与收藏平台<br>
              为您提供最优质的盲盒购物体验
            </p>
          </div>
        </div>

        <!-- 快速链接 -->
        <div class="col-lg-2 col-md-6 mb-4">
          <h6 class="footer-title">快速链接</h6>
          <ul class="footer-links">
            <li><router-link to="/shop" class="footer-link">盲盒商城</router-link></li>
            <li><router-link to="/collection" class="footer-link">我的收藏</router-link></li>
            <li><router-link to="/community" class="footer-link">社区交流</router-link></li>
            <li><router-link to="/about" class="footer-link">关于我们</router-link></li>
          </ul>
        </div>

        <!-- 客户服务 -->
        <div class="col-lg-3 col-md-6 mb-4">
          <h6 class="footer-title">客户服务</h6>
          <ul class="footer-links">
            <li><a href="#" class="footer-link">帮助中心</a></li>
            <li><a href="#" class="footer-link">联系客服</a></li>
            <li><a href="#" class="footer-link">退换货政策</a></li>
            <li><a href="#" class="footer-link">配送信息</a></li>
          </ul>
        </div>

        <!-- 联系信息 -->
        <div class="col-lg-3 col-md-6 mb-4">
          <h6 class="footer-title">联系我们</h6>
          <div class="contact-info">
            <p class="contact-item">
              <i class="bi bi-envelope me-2"></i>
              support@manghe.com
            </p>
            <p class="contact-item">
              <i class="bi bi-telephone me-2"></i>
              400-888-9999
            </p>
            <p class="contact-item">
              <i class="bi bi-clock me-2"></i>
              周一至周五 9:00-18:00
            </p>
          </div>

          <!-- 社交媒体 -->
          <div class="social-links mt-3">
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

      <!-- 版权信息 -->
      <div class="footer-bottom">
        <div class="row align-items-center">
          <div class="col-md-6">
            <p class="copyright">
              &copy; 2024 芒盒盲盒平台. 保留所有权利.
            </p>
          </div>
          <div class="col-md-6">
            <div class="footer-legal-links">
              <a href="#" class="legal-link">隐私政策</a>
              <a href="#" class="legal-link">服务条款</a>
              <a href="#" class="legal-link">法律声明</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
import { ref, onMounted } from 'vue'

// 直接使用public目录下的Logo
let logoImport = null
let logoPath = '/images/Logo.png'

export default {
  name: 'Footer',
  setup() {
    const logoImage = ref(null)

    const handleLogoError = () => {
      console.error('Logo图片加载失败')
      logoImage.value = null
    }

    onMounted(() => {
      // 直接设置Logo图片路径
      logoImage.value = logoPath
    })

    return {
      logoImage,
      handleLogoError
    }
  }
}
</script>

<style scoped>
.main-footer {
  background: linear-gradient(135deg, var(--dark-night), #2d3748);
  color: white;
  padding: 3rem 0 1rem;
  margin-top: auto;
}

.footer-logo-link {
  display: inline-block;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.footer-logo-link:hover {
  transform: scale(1.05);
}

.footer-logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  margin-bottom: 1rem;
}

.footer-brand .logo-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: inline-block;
  transition: transform 0.3s ease;
}

.footer-logo-link:hover .logo-icon {
  transform: scale(1.1);
}

.brand-description {
  color: #a0aec0;
  line-height: 1.6;
}

.footer-title {
  font-weight: 600;
  margin-bottom: 1rem;
  color: white;
  position: relative;
}

.footer-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 30px;
  height: 2px;
  background: var(--neon-pink);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-link {
  color: #a0aec0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: var(--neon-pink);
}

.contact-info {
  color: #a0aec0;
}

.contact-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: var(--neon-pink);
  transform: translateY(-2px);
}

.footer-bottom {
  border-top: 1px solid #4a5568;
  padding-top: 1.5rem;
  margin-top: 2rem;
}

.copyright {
  color: #a0aec0;
  margin: 0;
}

.footer-legal-links {
  display: flex;
  justify-content: flex-end;
  gap: 1.5rem;
}

.legal-link {
  color: #a0aec0;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.3s ease;
}

.legal-link:hover {
  color: var(--neon-pink);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-footer {
    padding: 2rem 0 1rem;
  }

  .footer-legal-links {
    justify-content: flex-start;
    margin-top: 1rem;
  }

  .social-links {
    justify-content: center;
  }
}
</style>