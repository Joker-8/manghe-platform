<template>
  <div :class="cardClasses" :style="cardStyles">
    <div v-if="header" class="card-header" :class="headerClass">
      <slot name="header">{{ header }}</slot>
    </div>
    
    <div class="card-body" :class="bodyClass">
      <slot></slot>
    </div>
    
    <div v-if="footer" class="card-footer" :class="footerClass">
      <slot name="footer">{{ footer }}</slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    // 卡片标题
    header: {
      type: String,
      default: ''
    },
    // 卡片底部内容
    footer: {
      type: String,
      default: ''
    },
    // 卡片类型
    type: {
      type: String,
      default: 'default', // default, primary, success, warning, danger, info
      validator: value => {
        return ['default', 'primary', 'success', 'warning', 'danger', 'info'].includes(value);
      }
    },
    // 是否带有阴影
    shadow: {
      type: Boolean,
      default: true
    },
    // 阴影大小
    shadowSize: {
      type: String,
      default: 'md', // sm, md, lg
      validator: value => {
        return ['sm', 'md', 'lg'].includes(value);
      }
    },
    // 圆角大小
    radius: {
      type: String,
      default: 'md', // none, sm, md, lg, xl
      validator: value => {
        return ['none', 'sm', 'md', 'lg', 'xl'].includes(value);
      }
    },
    // 自定义class
    customClass: {
      type: String,
      default: ''
    },
    // 头部自定义class
    headerClass: {
      type: String,
      default: ''
    },
    // 内容自定义class
    bodyClass: {
      type: String,
      default: ''
    },
    // 底部自定义class
    footerClass: {
      type: String,
      default: ''
    },
    // 是否可折叠
    collapsible: {
      type: Boolean,
      default: false
    },
    // 初始是否折叠
    collapsed: {
      type: Boolean,
      default: false
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isCollapsed: this.collapsed
    };
  },
  computed: {
    cardClasses() {
      const classes = ['mg-card'];
      
      // 类型相关class
      if (this.type !== 'default') {
        classes.push(`mg-card-${this.type}`);
      }
      
      // 阴影相关class
      if (this.shadow) {
        classes.push(`mg-card-shadow-${this.shadowSize}`);
      }
      
      // 圆角相关class
      if (this.radius !== 'md') {
        classes.push(`mg-card-radius-${this.radius}`);
      }
      
      // 折叠状态相关class
      if (this.collapsible) {
        classes.push('mg-card-collapsible');
        if (this.isCollapsed) {
          classes.push('mg-card-collapsed');
        }
      }
      
      // 禁用状态相关class
      if (this.disabled) {
        classes.push('mg-card-disabled');
      }
      
      // 自定义class
      if (this.customClass) {
        classes.push(this.customClass);
      }
      
      return classes;
    },
    cardStyles() {
      const styles = {};
      return styles;
    }
  },
  watch: {
    collapsed(newVal) {
      this.isCollapsed = newVal;
    }
  },
  methods: {
    /**
     * 切换折叠状态
     */
    toggleCollapse() {
      if (this.collapsible && !this.disabled) {
        this.isCollapsed = !this.isCollapsed;
        this.$emit('collapse-change', this.isCollapsed);
      }
    },
    /**
     * 折叠卡片
     */
    collapse() {
      if (this.collapsible && !this.disabled) {
        this.isCollapsed = true;
        this.$emit('collapse-change', this.isCollapsed);
      }
    },
    /**
     * 展开卡片
     */
    expand() {
      if (this.collapsible && !this.disabled) {
        this.isCollapsed = false;
        this.$emit('collapse-change', this.isCollapsed);
      }
    },
    /**
     * 获取卡片尺寸
     * @returns {Object} 尺寸信息
     */
    getSize() {
      if (this.$el) {
        return {
          width: this.$el.offsetWidth,
          height: this.$el.offsetHeight
        };
      }
      return { width: 0, height: 0 };
    }
  },
  mounted() {
    // 卡片挂载后的处理
    this.$emit('mounted', this);
  },
  beforeDestroy() {
    // 卡片销毁前的处理
    this.$emit('before-destroy', this);
  }
};
</script>

<style scoped>
.mg-card {
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 类型样式 */
.mg-card-primary {
  border-color: #409eff;
}

.mg-card-success {
  border-color: #67c23a;
}

.mg-card-warning {
  border-color: #e6a23c;
}

.mg-card-danger {
  border-color: #f56c6c;
}

.mg-card-info {
  border-color: #909399;
}

/* 阴影样式 */
.mg-card-shadow-sm {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.mg-card-shadow-md {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mg-card-shadow-lg {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 圆角样式 */
.mg-card-radius-none {
  border-radius: 0;
}

.mg-card-radius-sm {
  border-radius: 2px;
}

.mg-card-radius-lg {
  border-radius: 8px;
}

.mg-card-radius-xl {
  border-radius: 12px;
}

/* 禁用状态 */
.mg-card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* 卡片头部 */
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
  font-weight: 500;
  font-size: 16px;
  color: #303133;
}

.mg-card-primary .card-header {
  background-color: #ecf5ff;
  border-bottom-color: #d9ecff;
}

.mg-card-success .card-header {
  background-color: #f0f9eb;
  border-bottom-color: #e1f3d8;
}

.mg-card-warning .card-header {
  background-color: #fdf6ec;
  border-bottom-color: #faecd8;
}

.mg-card-danger .card-header {
  background-color: #fef0f0;
  border-bottom-color: #fde2e2;
}

.mg-card-info .card-header {
  background-color: #edf2fc;
  border-bottom-color: #ebeef5;
}

/* 可折叠卡片头部 */
.mg-card-collapsible .card-header {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 36px;
}

.mg-card-collapsible .card-header::after {
  content: '▼';
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  transition: transform 0.3s ease;
}

.mg-card-collapsed .card-header::after {
  transform: translateY(-50%) rotate(-90deg);
}

/* 卡片内容 */
.card-body {
  padding: 20px;
  color: #606266;
  line-height: 1.6;
}

/* 可折叠卡片内容 */
.mg-card-collapsible .card-body {
  transition: max-height 0.3s ease, padding 0.3s ease;
  overflow: hidden;
}

.mg-card-collapsed .card-body {
  max-height: 0;
  padding: 0 20px;
}

/* 卡片底部 */
.card-footer {
  padding: 16px 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #fafafa;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mg-card {
    margin-left: -16px;
    margin-right: -16px;
    border-radius: 0;
  }
  
  .card-header,
  .card-body,
  .card-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}

/* 悬停效果 */
.mg-card:not(.mg-card-disabled):hover {
  transform: translateY(-2px);
}

/* 活跃状态 */
.mg-card:active {
  transform: translateY(0);
  transition: transform 0.1s ease;
}
</style>