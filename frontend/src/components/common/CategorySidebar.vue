<template>
  <div class="category-sidebar">
    <h3 class="sidebar-title">商品分类</h3>
    
    <!-- 主分类列表 -->
    <ul class="category-list">
      <li 
        v-for="category in categories" 
        :key="category.id"
        class="category-item"
        :class="{ 'active': selectedCategory === category.id, 'has-children': category.subcategories && category.subcategories.length > 0 }"
        @click="toggleCategory(category.id)"
      >
        <div class="category-header">
          <i :class="['category-icon', 'bi', category.icon]"></i>
          <span class="category-name">{{ category.name }}</span>
          <i v-if="category.subcategories && category.subcategories.length > 0" 
             :class="['bi', expandedCategories.includes(category.id) ? 'bi-chevron-down' : 'bi-chevron-right']" 
             class="category-arrow"></i>
        </div>
        
        <!-- 子分类列表 -->
        <ul v-if="category.subcategories && category.subcategories.length > 0" 
            :class="['subcategory-list', expandedCategories.includes(category.id) ? 'expanded' : 'collapsed']">
          <li 
            v-for="subcat in category.subcategories" 
            :key="subcat.id"
            class="subcategory-item"
            :class="{ 'active': selectedSubcategory === subcat.id }"
            @click.stop="selectSubcategory(category.id, subcat.id)"
          >
            <i :class="['subcategory-icon', 'bi', subcat.icon]"></i>
            <span>{{ subcat.name }}</span>
          </li>
        </ul>
      </li>
    </ul>
    
    <!-- 其他分类筛选 -->
    <div class="sidebar-section">
      <h4 class="section-title">稀有度</h4>
      <ul class="filter-list">
        <li 
          v-for="rarity in rarityOptions" 
          :key="rarity.value"
          class="filter-item"
          :class="{ 'active': selectedRarities.includes(rarity.value) }"
          @click="toggleRarity(rarity.value)"
        >
          <span class="filter-name">{{ rarity.label }}</span>
          <span class="filter-count">({{ rarity.count }})</span>
        </li>
      </ul>
    </div>
    
    <div class="sidebar-section">
      <h4 class="section-title">价格区间</h4>
      <ul class="filter-list">
        <li 
          v-for="range in priceOptions" 
          :key="range.value"
          class="filter-item"
          :class="{ 'active': selectedPriceRange === range.value }"
          @click="selectPriceRange(range.value)"
        >
          <span class="filter-name">{{ range.label }}</span>
        </li>
      </ul>
    </div>
    
    <!-- 重置筛选按钮 -->
    <button class="reset-btn" @click="resetFilters">
      重置筛选条件
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'CategorySidebar',
  emits: ['category-selected', 'filters-changed'],
  setup(props, { emit }) {
    // 响应式数据
    const selectedCategory = ref('')
    const selectedSubcategory = ref('')
    const expandedCategories = ref([])
    const selectedRarities = ref([])
    const selectedPriceRange = ref('')
    
    // 分类数据
    const categories = ref([
      {
        id: 'series',
        name: '盲盒系列',
        icon: 'bi-box-seam',
        subcategories: [
          { id: 'series-1', name: '星空幻想系列', icon: 'bi-globe' },
          { id: 'series-2', name: '森林物语系列', icon: 'bi-tree' },
          { id: 'series-3', name: '海洋奇缘系列', icon: 'bi-droplet' },
          { id: 'series-4', name: '城市探险系列', icon: 'bi-building' },
          { id: 'series-5', name: '复古经典系列', icon: 'bi-clock' },
          { id: 'series-6', name: '夏日限定系列', icon: 'bi-umbrella' }
        ]
      },
      {
        id: 'new-arrivals',
        name: '新品上市',
        icon: 'bi-star'
      },
      {
        id: 'limited',
        name: '限量款式',
        icon: 'bi-diamond'
      },
      {
        id: 'hot',
        name: '热销商品',
        icon: 'bi-fire'
      },
      {
        id: 'preorder',
        name: '预售商品',
        icon: 'bi-clock'
      }
    ])
    
    // 稀有度选项
    const rarityOptions = ref([
      { label: '普通', value: 'common', count: 15 },
      { label: '稀有', value: 'rare', count: 10 },
      { label: '史诗', value: 'epic', count: 6 },
      { label: '传说', value: 'legendary', count: 3 },
      { label: '隐藏', value: 'secret', count: 2 }
    ])
    
    // 价格区间选项
    const priceOptions = ref([
      { label: '¥0 - ¥50', value: '0-50' },
      { label: '¥50 - ¥100', value: '50-100' },
      { label: '¥100 - ¥200', value: '100-200' },
      { label: '¥200以上', value: '200+' }
    ])
    
    // 方法
    const toggleCategory = (categoryId) => {
      // 如果点击的是当前选中的分类，则取消选中
      if (selectedCategory.value === categoryId) {
        selectedCategory.value = ''
        selectedSubcategory.value = ''
      } else {
        selectedCategory.value = categoryId
        selectedSubcategory.value = ''
      }
      
      // 切换子分类展开状态
      const index = expandedCategories.value.indexOf(categoryId)
      if (index > -1) {
        expandedCategories.value.splice(index, 1)
      } else {
        // 先关闭所有已展开的分类
        expandedCategories.value = []
        // 然后展开当前点击的分类
        expandedCategories.value.push(categoryId)
      }
      
      emitFilterChange()
    }
    
    const selectSubcategory = (categoryId, subcategoryId) => {
      selectedCategory.value = categoryId
      selectedSubcategory.value = subcategoryId
      emitFilterChange()
    }
    
    const toggleRarity = (rarityValue) => {
      const index = selectedRarities.value.indexOf(rarityValue)
      if (index > -1) {
        selectedRarities.value.splice(index, 1)
      } else {
        selectedRarities.value.push(rarityValue)
      }
      emitFilterChange()
    }
    
    const selectPriceRange = (priceRangeValue) => {
      selectedPriceRange.value = selectedPriceRange.value === priceRangeValue ? '' : priceRangeValue
      emitFilterChange()
    }
    
    const resetFilters = () => {
      selectedCategory.value = ''
      selectedSubcategory.value = ''
      expandedCategories.value = []
      selectedRarities.value = []
      selectedPriceRange.value = ''
      emitFilterChange()
    }
    
    const emitFilterChange = () => {
      emit('filters-changed', {
        category: selectedCategory.value,
        subcategory: selectedSubcategory.value,
        rarities: [...selectedRarities.value],
        priceRange: selectedPriceRange.value
      })
    }
    
    // 组件挂载时，展开第一个有子分类的分类
    onMounted(() => {
      const firstWithChildren = categories.value.find(cat => cat.subcategories && cat.subcategories.length > 0)
      if (firstWithChildren) {
        expandedCategories.value.push(firstWithChildren.id)
      }
    })
    
    return {
      categories,
      selectedCategory,
      selectedSubcategory,
      expandedCategories,
      rarityOptions,
      selectedRarities,
      priceOptions,
      selectedPriceRange,
      toggleCategory,
      selectSubcategory,
      toggleRarity,
      selectPriceRange,
      resetFilters
    }
  }
}
</script>

<style scoped>
.category-sidebar {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto; /* 添加滚动条以确保内容溢出时可以滚动 */
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--bs-dark);
  border-bottom: 2px solid var(--primary-purple);
  padding-bottom: 10px;
}

.sidebar-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--bs-gray-700);
}

.category-list, .filter-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  margin-bottom: 4px;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.category-header:hover {
  background-color: #e9ecef;
}

.category-item.active .category-header {
  background-color: var(--primary-purple);
  color: white;
}

.category-icon, .subcategory-icon {
  margin-right: 10px;
  font-size: 16px;
}

.category-name {
  flex: 1;
  font-weight: 500;
}

.category-arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.subcategory-list {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  padding-left: 36px;
}

.subcategory-list.expanded {
  max-height: 300px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.subcategory-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.subcategory-item:hover {
  background-color: #f8f9fa;
}

.subcategory-item.active {
  background-color: #e2d9f3;
  color: var(--primary-purple);
  font-weight: 500;
}

.filter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-item:hover {
  background-color: #f8f9fa;
}

.filter-item.active {
  background-color: #e2d9f3;
  color: var(--primary-purple);
  font-weight: 500;
}

.filter-name {
  display: flex;
  align-items: center;
}

.filter-count {
  font-size: 13px;
  color: var(--bs-gray-500);
}

.filter-item.active .filter-count {
  color: var(--primary-purple);
}

.reset-btn {
  width: 100%;
  padding: 12px;
  margin-top: 24px;
  border: 1px solid #ddd;
  background-color: #fff;
  color: var(--bs-gray-700);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.reset-btn:hover {
  background-color: #f8f9fa;
  border-color: #ccc;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .category-sidebar {
    position: relative;
    top: 0;
    margin-bottom: 20px;
  }
}

@media (max-width: 576px) {
  .category-sidebar {
    padding: 16px;
  }
  
  .sidebar-title {
    font-size: 16px;
  }
  
  .section-title {
    font-size: 14px;
  }
}
</style>