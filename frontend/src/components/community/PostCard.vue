<template>
  <div class="post-card card mb-4">
    <div class="card-body">
      <!-- 用户信息 -->
      <div class="d-flex align-items-start mb-3">
        <img :src="post.user.avatar" class="user-avatar me-3" alt="用户头像">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-0 user-name">{{ post.user.name }}</h6>
              <div class="user-meta">
                <span class="user-level">{{ post.user.level }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </div>
            </div>
            <div class="dropdown">
              <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                <i class="bi bi-three-dots"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#"><i class="bi bi-flag me-2"></i>举报</a></li>
                <li v-if="isOwnPost"><hr class="dropdown-divider"></li>
                <li v-if="isOwnPost">
                  <a class="dropdown-item text-danger" @click="$emit('delete', post.id)">
                    <i class="bi bi-trash me-2"></i>删除
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 帖子内容 -->
      <div class="post-content mb-3">
        <p class="mb-2">{{ post.content }}</p>

        <!-- 图片展示 -->
        <div v-if="post.images && post.images.length" class="post-images">
          <div :class="getImageGridClass(post.images.length)">
            <div
                v-for="(image, index) in post.images"
                :key="index"
                class="post-image-item"
            >
              <img
                  :src="image"
                  :alt="`图片${index + 1}`"
                  class="img-fluid rounded"
                  @click="openImageGallery(index)"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 互动统计 -->
      <div class="post-stats mb-3">
        <span class="text-muted me-3">
          <i class="bi bi-heart-fill text-danger me-1"></i>{{ post.likes }}
        </span>
        <span class="text-muted me-3">
          <i class="bi bi-chat me-1"></i>{{ post.comments }}
        </span>
        <span class="text-muted">
          <i class="bi bi-share me-1"></i>{{ post.shares }}
        </span>
      </div>

      <!-- 互动按钮 -->
      <div class="post-actions border-top pt-3">
        <div class="row text-center">
          <div class="col">
            <button
                class="btn btn-action"
                :class="{ 'text-primary': post.isLiked }"
                @click="$emit('like', post.id)"
            >
              <i :class="['bi', post.isLiked ? 'bi-heart-fill' : 'bi-heart']"></i>
              点赞
            </button>
          </div>
          <div class="col">
            <button
                class="btn btn-action"
                @click="$emit('comment', post.id)"
            >
              <i class="bi bi-chat"></i>
              评论
            </button>
          </div>
          <div class="col">
            <button
                class="btn btn-action"
                :class="{ 'text-success': post.isShared }"
                @click="$emit('share', post.id)"
            >
              <i class="bi bi-share"></i>
              分享
            </button>
          </div>
        </div>
      </div>

      <!-- 评论预览 -->
      <div v-if="post.commentsList && post.commentsList.length > 0" class="comments-preview mt-3">
        <div
            v-for="comment in post.commentsList.slice(0, 2)"
            :key="comment.id"
            class="comment-preview d-flex align-items-start mb-2"
        >
          <img :src="comment.user.avatar" class="user-avatar-sm me-2" alt="用户头像">
          <div class="comment-content flex-grow-1">
            <strong class="comment-author">{{ comment.user.name }}</strong>
            <span class="comment-text ms-2">{{ comment.content }}</span>
          </div>
        </div>
        <button
            v-if="post.comments > 2"
            class="btn btn-link btn-sm p-0 text-muted"
            @click="$emit('comment', post.id)"
        >
          查看全部 {{ post.comments }} 条评论
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'PostCard',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  emits: ['like', 'comment', 'share', 'delete'],
  setup(props) {
    const store = useStore()

    const currentUser = computed(() => store.state.user)
    const isOwnPost = computed(() => props.post.user.id === currentUser.value?.id)

    const formatTime = (timestamp) => {
      const now = new Date()
      const postTime = new Date(timestamp)
      const diffInMinutes = Math.floor((now - postTime) / (1000 * 60))

      if (diffInMinutes < 1) return '刚刚'
      if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`
      return `${Math.floor(diffInMinutes / 1440)}天前`
    }

    const getImageGridClass = (imageCount) => {
      if (imageCount === 1) return 'row'
      if (imageCount === 2) return 'row row-cols-2 g-2'
      return 'row row-cols-2 g-2'
    }

    const openImageGallery = (index) => {
      // 这里可以实现图片画廊功能
      console.log('打开图片画廊:', index)
    }

    return {
      isOwnPost,
      formatTime,
      getImageGridClass,
      openImageGallery
    }
  }
}
</script>

<style scoped>
.post-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-sm {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
}

.user-meta {
  font-size: 0.875rem;
  color: #6c757d;
}

.user-level {
  background: linear-gradient(135deg, var(--primary-purple), var(--neon-pink));
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
}

.post-time {
  font-size: 0.75rem;
}

.post-content p {
  margin-bottom: 0;
  line-height: 1.5;
  white-space: pre-wrap;
}

.post-images .post-image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.post-images .post-image-item img:hover {
  transform: scale(1.02);
}

.post-stats {
  font-size: 0.875rem;
}

.btn-action {
  border: none;
  background: none;
  color: #6c757d;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.btn-action:hover {
  background: #f8f9fa;
  color: var(--primary-purple);
}

.comment-preview {
  font-size: 0.875rem;
}

.comment-author {
  font-size: 0.8rem;
}

.comment-text {
  color: #495057;
  word-break: break-word;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .post-images .post-image-item img {
    height: 150px;
  }

  .btn-action {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
}
</style>