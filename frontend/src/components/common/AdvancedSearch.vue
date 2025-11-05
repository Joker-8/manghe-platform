<template>
  <div class="advanced-search-container relative">
    <div class="input-group">
      <input
        type="text"
        class="form-control"
        :placeholder="placeholder || '搜索盲盒系列...'"
        v-model="searchKeyword"
        @input="handleSearchInput"
        @focus="showDropdown = true"
        @blur="handleBlur"
        @keyup.enter="handleSearch"
        ref="searchInput"
      >
      <button 
        class="btn btn-light" 
        type="button"
        @click="handleSearch"
      >
        <i class="bi bi-search"></i>
      </button>
    </div>
    
    <!-- 搜索下拉框 -->
    <div 
      v-if="showDropdown && (searchSuggestions.length > 0 || searchHistory.length > 0)" 
      class="search-dropdown absolute w-full bg-white border border-gray-300 rounded shadow-lg z-50"
    >
      <!-- 搜索建议 -->
      <div v-if="searchSuggestions.length > 0" class="suggestions-section">
        <div class="dropdown-header">搜索建议</div>
        <div 
          v-for="(suggestion, index) in searchSuggestions" 
          :key="`suggestion-${index}`"
          class="dropdown-item"
          @mousedown="selectSuggestion(suggestion)"
        >
          <span class="result-icon me-2 text-gray-500"><i class="bi bi-search"></i></span>
          <span v-html="highlightKeyword(suggestion)"></span>
        </div>
      </div>
      
      <!-- 分隔线 -->
      <div v-if="searchSuggestions.length > 0 && searchHistory.length > 0" class="dropdown-divider"></div>
      
      <!-- 搜索历史 -->
      <div v-if="searchHistory.length > 0" class="history-section">
        <div class="dropdown-header d-flex justify-content-between items-center">
          <span>搜索历史</span>
          <button 
            class="clear-history btn text-xs text-gray-500"
            @click.stop="clearSearchHistory"
          >
            清空
          </button>
        </div>
        <div 
          v-for="(item, index) in searchHistory" 
          :key="`history-${index}`"
          class="dropdown-item"
          @mousedown="selectHistoryItem(item)"
        >
          <span class="history-icon me-2 text-gray-500"><i class="bi bi-clock-history"></i></span>
          <span v-html="highlightKeyword(item)"></span>
          <button 
            class="remove-history ml-auto btn text-xs text-gray-400"
            @click.stop="removeHistoryItem(index)"
          >
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'AdvancedSearch',
  props: {
    placeholder: {
      type: String,
      default: '搜索盲盒系列...'
    },
    // 可以传入完整的商品列表，用于生成搜索建议
    items: {
      type: Array,
      default: () => []
    }
  },
  emits: ['search'],
  setup(props, { emit }) {
    const searchKeyword = ref('')
    const showDropdown = ref(false)
    const searchInput = ref(null)
    const searchHistory = ref([])
    const searchSuggestions = ref([])
    const router = useRouter()
    
    // 从localStorage加载搜索历史
    const loadSearchHistory = () => {
      try {
        const history = localStorage.getItem('searchHistory')
        if (history) {
          searchHistory.value = JSON.parse(history)
        }
      } catch (error) {
        console.error('Failed to load search history:', error)
        searchHistory.value = []
      }
    }
    
    // 保存搜索历史到localStorage
    const saveSearchHistory = (keyword) => {
      try {
        // 去重并限制历史记录数量
        const newHistory = [keyword, ...searchHistory.value.filter(item => item !== keyword)].slice(0, 10)
        searchHistory.value = newHistory
        localStorage.setItem('searchHistory', JSON.stringify(newHistory))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }
    }
    
    // 清空搜索历史
    const clearSearchHistory = () => {
      searchHistory.value = []
      try {
        localStorage.removeItem('searchHistory')
      } catch (error) {
        console.error('Failed to clear search history:', error)
      }
    }
    
    // 移除单个历史记录
    const removeHistoryItem = (index) => {
      searchHistory.value.splice(index, 1)
      try {
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
      } catch (error) {
        console.error('Failed to update search history:', error)
      }
    }
    
    // 处理搜索输入
    const handleSearchInput = () => {
      if (!searchKeyword.value.trim()) {
        searchSuggestions.value = []
        return
      }
      
      // 生成搜索建议
      const query = searchKeyword.value.toLowerCase()
      const suggestions = []
      
      // 从商品列表中查找匹配项
      props.items.forEach(item => {
        if (item.name && item.name.toLowerCase().includes(query)) {
          suggestions.push(item.name)
        }
        if (item.series && item.series.toLowerCase().includes(query)) {
          suggestions.push(item.series)
        }
      })
      
      // 去重并限制数量
      searchSuggestions.value = [...new Set(suggestions)].slice(0, 5)
    }
    
    // 处理搜索
    const handleSearch = () => {
      const keyword = searchKeyword.value.trim()
      if (!keyword) return
      
      // 保存到搜索历史
      saveSearchHistory(keyword)
      
      // 隐藏下拉框
      showDropdown.value = false
      
      // 发出搜索事件
      emit('search', keyword)
      
      // 导航到商城页面并执行搜索
      router.push({
        path: '/shop',
        query: { search: keyword }
      })
    }
    
    // 选择搜索建议
    const selectSuggestion = (suggestion) => {
      searchKeyword.value = suggestion
      handleSearch()
    }
    
    // 选择历史记录项
    const selectHistoryItem = (item) => {
      searchKeyword.value = item
      handleSearch()
    }
    
    // 高亮关键词
    const highlightKeyword = (text) => {
      if (!searchKeyword.value.trim()) return text
      
      const regex = new RegExp(`(${searchKeyword.value})`, 'gi')
      return text.replace(regex, '<span class="highlight">$1</span>')
    }
    
    // 处理失去焦点
    const handleBlur = () => {
      // 延迟隐藏，以便点击下拉项能触发事件
      setTimeout(() => {
        showDropdown.value = false
      }, 200)
    }
    
    // 监听URL参数，自动填充搜索词
    watch(() => router.currentRoute.value.query.search, (newSearch) => {
      if (newSearch) {
        searchKeyword.value = newSearch
      }
    }, { immediate: true })
    
    // 组件挂载时加载搜索历史
    onMounted(() => {
      loadSearchHistory()
    })
    
    return {
      searchKeyword,
      showDropdown,
      searchInput,
      searchHistory,
      searchSuggestions,
      handleSearchInput,
      handleSearch,
      selectSuggestion,
      selectHistoryItem,
      highlightKeyword,
      handleBlur,
      clearSearchHistory,
      removeHistoryItem
    }
  }
}
</script>

<style scoped>
.advanced-search-container {
  width: 100%;
}

.search-dropdown {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-header {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.dropdown-divider {
  margin: 0;
  border-color: #e5e7eb;
}

.result-icon,
.history-icon {
  font-size: 0.875rem;
}

.clear-history:hover {
  color: #dc2626;
}

.remove-history:hover {
  color: #dc2626;
}

.highlight {
  background-color: #fef3c7;
  font-weight: 500;
  color: #92400e;
}

/* 自定义滚动条 */
.search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.search-dropdown::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.search-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.search-dropdown::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>