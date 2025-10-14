<template>
  <div class="community-page container mt-4">
    <div class="row">
      <!-- 左侧内容区域 -->
      <div class="col-lg-8">
        <!-- 发布动态卡片 -->
        <div class="card mb-4 create-post-card">
          <div class="card-body">
            <div class="d-flex align-items-start">
              <img :src="currentUser.avatar" class="user-avatar me-3" alt="用户头像">
              <div class="flex-grow-1">
                <textarea
                    v-model="newPostContent"
                    class="form-control post-input"
                    placeholder="分享你的开盒心得..."
                    rows="3"
                    @focus="showPostOptions = true"
                ></textarea>

                <!-- 图片上传预览 -->
                <div v-if="postImages && postImages.length > 0" class="image-preview mt-3">
                  <div class="row g-2">
                    <div v-for="(image, index) in postImages" :key="index" class="col-4">
                      <div class="image-preview-item position-relative">
                        <img :src="image.url" class="img-fluid rounded" alt="预览图片">
                        <button class="btn-remove-image" @click="removeImage(index)">
                          <i class="bi bi-x"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 发布选项 -->
                <div v-if="showPostOptions" class="post-options mt-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex gap-2">
                      <input
                          type="file"
                          ref="imageInput"
                          multiple
                          accept="image/*"
                          @change="handleImageUpload"
                          class="d-none"
                      >
                      <button class="btn btn-outline-secondary btn-sm" @click="triggerImageUpload">
                        <i class="bi bi-image me-1"></i>图片
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" @click="showTopicSelector = true">
                        <i class="bi bi-tag me-1"></i>话题
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" @click="toggleEmojiPicker">
                        <i class="bi bi-emoji-smile me-1"></i>表情
                      </button>
                    </div>
                    <button
                        class="btn btn-primary btn-sm"
                        @click="publishPost"
                        :disabled="!newPostContent.trim() && (!postImages || postImages.length === 0)"
                    >
                      发布
                    </button>
                  </div>

                  <!-- 话题选择器 -->
                  <div v-if="showTopicSelector" class="topic-selector mt-2">
                    <div class="d-flex flex-wrap gap-2">
                      <span
                          v-for="topic in popularTopics"
                          :key="topic"
                          class="badge bg-light text-dark topic-badge"
                          :class="{ active: selectedTopic === topic }"
                          @click="selectTopic(topic)"
                      >
                        {{ topic }}
                      </span>
                    </div>
                    <div class="mt-2">
                      <input
                          v-model="customTopic"
                          type="text"
                          class="form-control form-control-sm"
                          placeholder="自定义话题..."
                          @keyup.enter="addCustomTopic"
                      >
                    </div>
                  </div>

                  <!-- 表情选择器 -->
                  <div v-if="showEmojiPicker" class="emoji-picker mt-2">
                    <div class="emoji-grid">
                      <span
                          v-for="emoji in emojis"
                          :key="emoji"
                          class="emoji"
                          @click="addEmoji(emoji)"
                      >
                        {{ emoji }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 帖子筛选 -->
        <div class="card mb-4">
          <div class="card-body py-2">
            <div class="d-flex justify-content-between align-items-center">
              <div class="filter-tabs">
                <button
                    v-for="filter in postFilters"
                    :key="filter.key"
                    class="btn btn-link filter-btn"
                    :class="{ active: currentFilter === filter.key }"
                    @click="changeFilter(filter.key)"
                >
                  {{ filter.label }}
                </button>
              </div>
              <div class="sort-options">
                <select v-model="sortBy" class="form-select form-select-sm">
                  <option value="latest">最新发布</option>
                  <option value="popular">最热内容</option>
                  <option value="trending">正在流行</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 帖子列表 -->
        <div class="posts-container">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
          </div>

          <div v-else-if="!filteredPosts || filteredPosts.length === 0" class="text-center py-5">
            <i class="bi bi-inbox display-1 text-muted"></i>
            <h5 class="mt-3 text-muted">暂无帖子</h5>
            <p class="text-muted">成为第一个分享的人吧！</p>
          </div>

          <div v-else>
            <PostCard
                v-for="post in filteredPosts"
                :key="post.id"
                :post="post"
                @like="handleLike"
                @comment="handleComment"
                @share="handleShare"
                @delete="handleDeletePost"
            />
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="col-lg-4">
        <!-- 热门话题 -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">🔥 热门话题</h6>
          </div>
          <div class="card-body">
            <div class="trending-topics">
              <div
                  v-for="topic in trendingTopics"
                  :key="topic.name"
                  class="topic-item d-flex justify-content-between align-items-center py-2"
              >
                <div>
                  <span class="topic-name">#{{ topic.name }}</span>
                  <small class="text-muted d-block">{{ topic.count }} 讨论</small>
                </div>
                <span class="trend-indicator" :class="topic.trend"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 活跃用户 -->
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">🌟 活跃用户</h6>
          </div>
          <div class="card-body">
            <div class="active-users">
              <div
                  v-for="user in activeUsers"
                  :key="user.id"
                  class="user-item d-flex align-items-center py-2"
              >
                <img :src="user.avatar" class="user-avatar-sm me-2" alt="用户头像">
                <div class="flex-grow-1">
                  <div class="user-name">{{ user.name }}</div>
                  <small class="text-muted">{{ user.posts }} 篇帖子</small>
                </div>
                <button class="btn btn-outline-primary btn-sm">关注</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 社区指南 -->
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">📝 社区指南</h6>
          </div>
          <div class="card-body">
            <ul class="community-guidelines">
              <li>分享真实的开盒体验</li>
              <li>尊重他人的收藏喜好</li>
              <li>禁止发布广告内容</li>
              <li>保护个人隐私信息</li>
              <li>共同维护友好氛围</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论模态框 -->
    <CommentModal
        v-if="selectedPost"
        :post="selectedPost"
        @close="selectedPost = null"
        @comment-added="handleNewComment"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import PostCard from '@/components/community/PostCard.vue'
import CommentModal from '@/components/community/CommentModal.vue'

export default {
  name: 'CommunityPage',
  components: {
    PostCard,
    CommentModal
  },
  setup() {
    const store = useStore()
    const imageInput = ref(null)

    // 状态管理
    const newPostContent = ref('')
    const showPostOptions = ref(false)
    const showTopicSelector = ref(false)
    const showEmojiPicker = ref(false)
    const selectedTopic = ref('')
    const customTopic = ref('')
    const postImages = ref([])
    const currentFilter = ref('all')
    const sortBy = ref('latest')
    const loading = ref(false)
    const selectedPost = ref(null)
    const posts = ref([]) // 确保 posts 被定义

    // 模拟数据
    const currentUser = ref({
      id: 1,
      name: '当前用户',
      avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2QjIxQTgiLz4KPHBhdGggZD0iTTIwIDIxQzIyLjIwOTEgMjEgMjQgMTkuMjA5MSAyNCAxN0MyNCAxNC43OTA5IDIyLjIwOTEgMTMgMjAgMTNDMTcuNzkwOSAxMyAxNiAxNC43OTA5IDE2IDE3QzE2IDE5LjIwOTEgMTcuNzkwOSAyMSAyMCAyMVoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0yMCAyMkMxNS41ODIyIDIyIDEyIDI0LjY4NjMgMTIgMjhIMjBIMjhDMjggMjQuNjg2MyAyNC40MTc4IDIyIDIwIDIyWiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==',
      level: '黄金会员'
    })

    const popularTopics = ref(['开箱分享', '隐藏款展示', '新品评测', '收藏心得', '交易交流', '问题求助'])
    const trendingTopics = ref([
      { name: '星空幻想', count: 128, trend: 'up' },
      { name: '隐藏款', count: 96, trend: 'up' },
      { name: '新品首发', count: 87, trend: 'steady' },
      { name: '收藏技巧', count: 65, trend: 'down' },
      { name: '盲盒交换', count: 54, trend: 'up' }
    ])
    const activeUsers = ref([
      { id: 2, name: '盲盒达人', avatar: 'https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=用户', posts: 24 },
      { id: 3, name: '收藏家小明', avatar: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=用户', posts: 18 },
      { id: 4, name: '开盒幸运星', avatar: 'https://via.placeholder.com/40x40/EC4899/FFFFFF?text=用户', posts: 15 },
      { id: 5, name: '系列控', avatar: 'https://via.placeholder.com/40x40/F59E0B/FFFFFF?text=用户', posts: 12 }
    ])

    const emojis = ref(['😊', '😂', '🥰', '😍', '🤩', '😎', '🤗', '👍', '🎉', '❤️', '🔥', '⭐', '🎁', '🤞'])

    const postFilters = ref([
      { key: 'all', label: '全部' },
      { key: 'following', label: '关注' },
      { key: 'popular', label: '热门' },
      { key: 'media', label: '图片/视频' }
    ])

    // 计算属性 - 修复空值检查
    const filteredPosts = computed(() => {
      if (!posts.value || posts.value.length === 0) {
        return []
      }

      let filtered = [...posts.value]

      // 过滤
      switch (currentFilter.value) {
        case 'following':
          filtered = filtered.filter(post => post.user && post.user.isFollowing)
          break
        case 'popular':
          filtered = filtered.filter(post => post.likes > 10)
          break
        case 'media':
          filtered = filtered.filter(post => post.images && post.images.length > 0)
          break
      }

      // 排序
      switch (sortBy.value) {
        case 'latest':
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          break
        case 'popular':
          filtered.sort((a, b) => b.likes - a.likes)
          break
        case 'trending':
          filtered.sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2))
          break
      }

      return filtered
    })

    // 方法
    const triggerImageUpload = () => {
      imageInput.value?.click()
    }

    const handleImageUpload = (event) => {
      const files = event.target.files
      if (!files || !files.length) return

      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            postImages.value.push({
              file,
              url: e.target.result
            })
          }
          reader.readAsDataURL(file)
        }
      })

      // 清空input，允许重复选择相同文件
      event.target.value = ''
    }

    const removeImage = (index) => {
      if (postImages.value && postImages.value.length > index) {
        postImages.value.splice(index, 1)
      }
    }

    const selectTopic = (topic) => {
      selectedTopic.value = topic
      showTopicSelector.value = false
      if (!newPostContent.value.includes(`#${topic}`)) {
        newPostContent.value += ` #${topic}`
      }
    }

    const addCustomTopic = () => {
      if (customTopic.value.trim()) {
        const topic = customTopic.value.trim()
        if (!popularTopics.value.includes(topic)) {
          popularTopics.value.push(topic)
        }
        selectTopic(topic)
        customTopic.value = ''
      }
    }

    const toggleEmojiPicker = () => {
      showEmojiPicker.value = !showEmojiPicker.value
    }

    const addEmoji = (emoji) => {
      newPostContent.value += emoji
      showEmojiPicker.value = false
    }

    const publishPost = async () => {
      if (!newPostContent.value.trim() && (!postImages.value || postImages.value.length === 0)) return

      const newPost = {
        id: Date.now(),
        user: { ...currentUser.value },
        content: newPostContent.value,
        images: postImages.value ? postImages.value.map(img => img.url) : [],
        topic: selectedTopic.value,
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        isShared: false,
        createdAt: new Date().toISOString(),
        commentsList: []
      }

      // 确保 posts 数组存在
      if (!posts.value) {
        posts.value = []
      }

      // 添加到帖子列表开头
      posts.value.unshift(newPost)

      // 重置表单
      newPostContent.value = ''
      postImages.value = []
      selectedTopic.value = ''
      showPostOptions.value = false
      showTopicSelector.value = false
      showEmojiPicker.value = false

      // 模拟API调用
      console.log('发布帖子:', newPost)
    }

    const changeFilter = (filter) => {
      currentFilter.value = filter
    }

    const handleLike = (postId) => {
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.isLiked = !post.isLiked
        post.likes += post.isLiked ? 1 : -1
      }
    }

    const handleComment = (postId) => {
      selectedPost.value = posts.value.find(p => p.id === postId)
    }

    const handleShare = (postId) => {
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.isShared = true
        post.shares += 1
        // 这里可以集成实际的分享功能
        console.log('分享帖子:', post)
        alert('分享功能开发中...')
      }
    }

    const handleDeletePost = (postId) => {
      if (confirm('确定要删除这条帖子吗？')) {
        posts.value = posts.value.filter(p => p.id !== postId)
      }
    }

    const handleNewComment = (postId, comment) => {
      const post = posts.value.find(p => p.id === postId)
      if (post) {
        post.comments += 1
        if (!post.commentsList) {
          post.commentsList = []
        }
        post.commentsList.unshift(comment)
      }
    }

    // 模拟加载帖子数据
    const loadPosts = () => {
      loading.value = true
      setTimeout(() => {
        posts.value = [
          {
            id: 1,
            user: {
              id: 2,
              name: '盲盒达人',
              avatar: 'https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=用户',
              level: '钻石会员',
              isFollowing: true
            },
            content: '今天开到了隐藏款！太幸运了！🎉 这个系列的做工真的很精致，推荐大家收藏！#开箱分享 #隐藏款展示',
            images: [
              'https://via.placeholder.com/400x300/6B21A8/FFFFFF?text=隐藏款'
            ],
            topic: '开箱分享',
            likes: 24,
            comments: 8,
            shares: 3,
            isLiked: false,
            isShared: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
            commentsList: [
              {
                id: 1,
                user: { name: '收藏家小明', avatar: 'https://via.placeholder.com/32x32/10B981/FFFFFF?text=用户' },
                content: '太羡慕了！我也想要这个隐藏款！',
                createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
              }
            ]
          },
          {
            id: 2,
            user: {
              id: 3,
              name: '收藏家小明',
              avatar: 'https://via.placeholder.com/40x40/10B981/FFFFFF?text=用户',
              level: '黄金会员',
              isFollowing: false
            },
            content: '这个系列的做工真的很精致，每个细节都很完美。已经收集齐全套了！🥰 #收藏心得 #新品评测',
            images: [
              'https://via.placeholder.com/400x300/10B981/FFFFFF?text=全套收藏',
              'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=细节展示'
            ],
            topic: '收藏心得',
            likes: 15,
            comments: 3,
            shares: 1,
            isLiked: true,
            isShared: false,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5小时前
            commentsList: []
          }
        ]
        loading.value = false
      }, 1000)
    }

    // 监听排序变化
    watch(sortBy, () => {
      // 排序逻辑已经在计算属性中处理
    })

    onMounted(() => {
      loadPosts()
    })

    return {
      newPostContent,
      showPostOptions,
      showTopicSelector,
      showEmojiPicker,
      selectedTopic,
      customTopic,
      postImages,
      currentFilter,
      sortBy,
      loading,
      selectedPost,
      currentUser,
      posts: filteredPosts,
      popularTopics,
      trendingTopics,
      activeUsers,
      emojis,
      postFilters,
      imageInput,
      triggerImageUpload,
      handleImageUpload,
      removeImage,
      selectTopic,
      addCustomTopic,
      toggleEmojiPicker,
      addEmoji,
      publishPost,
      changeFilter,
      handleLike,
      handleComment,
      handleShare,
      handleDeletePost,
      handleNewComment
    }
  }
}
</script>

<style scoped>
/* 保持原有样式不变 */
.create-post-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.post-input {
  border: none;
  resize: none;
  font-size: 0.95rem;
}

.post-input:focus {
  box-shadow: none;
  border: none;
}

.post-options {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.image-preview-item {
  position: relative;
}

.btn-remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #dc3545;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.topic-badge {
  cursor: pointer;
  transition: all 0.3s ease;
}

.topic-badge.active {
  background: var(--primary-purple) !important;
  color: white !important;
}

.emoji-picker {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.emoji {
  cursor: pointer;
  padding: 0.25rem;
  text-align: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji:hover {
  background: #f8f9fa;
}

.filter-tabs {
  display: flex;
  gap: 1rem;
}

.filter-btn {
  text-decoration: none;
  color: #6c757d;
  border: none;
  background: none;
  padding: 0.5rem 0;
  position: relative;
}

.filter-btn.active {
  color: var(--primary-purple);
  font-weight: 600;
}

.filter-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-purple);
}

.trending-topics .topic-item {
  border-bottom: 1px solid #f8f9fa;
}

.topic-item:last-child {
  border-bottom: none;
}

.topic-name {
  font-weight: 500;
}

.trend-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.trend-indicator.up {
  background: #10b981;
}

.trend-indicator.down {
  background: #ef4444;
}

.trend-indicator.steady {
  background: #6b7280;
}

.active-users .user-item {
  border-bottom: 1px solid #f8f9fa;
}

.user-item:last-child {
  border-bottom: none;
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.community-guidelines {
  list-style: none;
  padding: 0;
  margin: 0;
}

.community-guidelines li {
  padding: 0.25rem 0;
  color: #6c757d;
  position: relative;
  padding-left: 1rem;
}

.community-guidelines li::before {
  content: '•';
  color: var(--primary-purple);
  position: absolute;
  left: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-tabs {
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .filter-btn {
    white-space: nowrap;
  }

  .emoji-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>