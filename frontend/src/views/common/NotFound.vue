<template>
  <div class="not-found-page">
    <div class="container text-center">
      <div class="error-code">404</div>
      <h1 class="error-title">页面未找到</h1>
      <p class="error-description">
        抱歉，您访问的页面不存在。
      </p>
      <div class="action-buttons mt-4">
        <router-link to="/" class="btn btn-primary me-3">返回首页</router-link>
        <button @click="$router.back()" class="btn btn-outline-secondary">返回上页</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage',
  setup() {
    return {}
  }
}
</script>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem 0;
}

.error-code {
  font-size: 8rem;
  font-weight: 700;
  color: var(--primary-purple);
  line-height: 1;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 2rem;
  color: var(--dark-night);
  margin-bottom: 1rem;
}

.error-description {
  font-size: 1.1rem;
  color: #6c757d;
  max-width: 500px;
  margin: 0 auto;
}

.action-buttons {
  margin-top: 2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }

  .error-title {
    font-size: 1.5rem;
  }
}
</style>