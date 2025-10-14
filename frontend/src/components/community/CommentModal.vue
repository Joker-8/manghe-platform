<template>
  <div class="comment-modal-overlay" @click.self="$emit('close')">
    <div class="comment-modal">
      <div class="modal-header">
        <h5 class="modal-title">评论</h5>
        <button type="button" class="btn-close" @click="$emit('close')"></button>
      </div>

      <div class="modal-body">
        <!-- 原帖子内容 -->
        <div class="original-post mb-4">
          <div class="d-flex align-items-start">
            <img :src="post.user.avatar" class="user-avatar me-3" alt="用户头像">
            <div class="flex-grow-1">
              <h6 class="user-name mb-1">{{ post.user.name }}</h6>
              <p class="post-content mb-2">{{ post.content }}</p>
              <div v-if="post.images && post.images.length" class="post-images-preview">
                <img
                    v-for="(image, index) in post.images.slice(0, 1)"
                    :key="index"
                    :src="image"
                    alt="帖子图片"
                    class="img-fluid rounded"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list">
          <div
              v-for="comment in allComments"
              :key="comment.id"
              class="comment-item mb-3"
          >
            <div class="d-flex align-items-start">
              <img :src="comment.user.avatar" class="user-avatar me-3" alt="用户头像">
              <div class="flex-grow-1">
                <div class="comment-header mb-1">
                  <strong class="comment-author">{{ comment.user.name }}</strong>
                  <span class="comment-time ms-2">{{ formatTime(comment.createdAt) }}</span>
                </div>
                <p class="comment-content mb-1">{{ comment.content }}</p>
                <div class="comment-actions">
                  <button class="btn btn-link btn-sm p-0 text-muted me-2">
                    回复
                  </button>
                  <button class="btn btn-link btn-sm p-0 text-muted">
                    <i class="bi bi-heart"></i> 点赞
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 发布评论 -->
        <div class="comment-input-container">
          <div class="d-flex align-items-start">
            <img :src="currentUser.avatar" class="user-avatar me-3" alt="用户头像">
            <div class="flex-grow-1">
              <textarea
                  v-model="newComment"
                  class="form-control comment-input"
                  placeholder="写下你的评论..."
                  rows="2"
              ></textarea>
              <div class="comment-options mt-2">
                <button
                    class="btn btn-primary btn-sm"
                    @click="addComment"
                    :disabled="!newComment.trim()"
                >
                  发布
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
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CommentModal',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'comment-added'],
  setup(props, { emit }) {
    const store = useStore()
    const newComment = ref('')

    const currentUser = ref({
      id: 1,
      name: '当前用户',
      avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTIwIDIxQzIyLjIwOTEgMjEgMjQgMTkuMjA5MSAyNCAxN0MyNCAxNC43OTA5IDIyLjIwOTEgMTMgMjAgMTNDMTcuNzkwOSAxMyAxNiAxNC43OTA5IDE2IDE3QzE2IDE5LjIwOTEgMTcuNzkwOSAyMSAyMCAyMVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAyMkMxNS41ODIyIDIyIDEyIDI0LjY4NjMgMTIgMjhIMjBIMjhDMjggMjQuNjg2MyAyNC40MTc4IDIyIDIwIDIyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='
    })

    const allComments = computed(() => {
      return [...props.post.commentsList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })

    const formatTime = (timestamp) => {
      const now = new Date()
      const commentTime = new Date(timestamp)
      const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60))

      if (diffInMinutes < 1) return '刚刚'
      if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`
      return `${Math.floor(diffInMinutes / 1440)}天前`
    }

    const addComment = () => {
      if (!newComment.value.trim()) return

      const comment = {
        id: Date.now(),
        user: { ...currentUser.value },
        content: newComment.value.trim(),
        createdAt: new Date().toISOString()
      }

      emit('comment-added', props.post.id, comment)
      newComment.value = ''
    }

    return {
      newComment,
      currentUser,
      allComments,
      formatTime,
      addComment
    }
  }
}
</script>

<style scoped>
.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.comment-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem 1.5rem 0;
  border-bottom: none;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.post-content {
  color: #495057;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.post-images-preview img {
  max-width: 200px;
  max-height: 150px;
  object-fit: cover;
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.comment-item {
  padding: 0.75rem;
  border-radius: 8px;
  background: #f8f9fa;
}

.comment-header {
  display: flex;
  align-items: center;
}

.comment-author {
  font-size: 0.9rem;
}

.comment-time {
  font-size: 0.75rem;
  color: #6c757d;
}

.comment-content {
  color: #495057;
  line-height: 1.4;
  margin-bottom: 0.5rem;
}

.comment-actions {
  font-size: 0.875rem;
}

.comment-input-container {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.comment-input {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  resize: none;
}

.comment-input:focus {
  border-color: var(--primary-purple);
  box-shadow: 0 0 0 0.2rem rgba(107, 33, 168, 0.1);
}

.comment-options {
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comment-modal {
    max-height: 90vh;
  }

  .modal-body {
    padding: 1rem;
  }
}
</style>