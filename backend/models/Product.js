/**
 * 产品模型
 * 定义盲盒产品数据结构和相关方法
 */

class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.original_price = data.original_price || 0;
    this.category = data.category || '';
    this.series = data.series || '';
    this.brand = data.brand || '';
    this.stock = data.stock || 0;
    this.sales = data.sales || 0;
    this.rating = data.rating || 0;
    this.review_count = data.review_count || 0;
    this.images = data.images || [];
    this.is_hot = data.is_hot || false;
    this.is_new = data.is_new || false;
    this.is_limited = data.is_limited || false;
    this.probability = data.probability || {};
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * 获取产品的公共信息
   */
  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      original_price: this.original_price,
      category: this.category,
      series: this.series,
      brand: this.brand,
      stock: this.stock,
      sales: this.sales,
      rating: this.rating,
      review_count: this.review_count,
      images: this.images,
      is_hot: this.is_hot,
      is_new: this.is_new,
      is_limited: this.is_limited,
      discount: this.calculateDiscount(),
      created_at: this.created_at
    };
  }

  /**
   * 计算折扣百分比
   */
  calculateDiscount() {
    if (!this.original_price || this.original_price <= this.price) {
      return 100; // 无折扣
    }
    return Math.round((1 - this.price / this.original_price) * 100);
  }

  /**
   * 检查产品是否有货
   */
  isInStock() {
    return this.stock > 0;
  }

  /**
   * 减少库存
   * @param {number} quantity - 减少的数量
   * @returns {boolean} 是否成功减少库存
   */
  reduceStock(quantity) {
    if (this.stock >= quantity) {
      this.stock -= quantity;
      this.sales += quantity;
      this.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * 增加库存
   * @param {number} quantity - 增加的数量
   */
  addStock(quantity) {
    this.stock += quantity;
    this.updated_at = new Date().toISOString();
  }

  /**
   * 更新产品信息
   * @param {Object} updates - 要更新的字段
   */
  update(updates) {
    Object.assign(this, updates);
    this.updated_at = new Date().toISOString();
  }

  /**
   * 添加评论评分
   * @param {number} newRating - 新的评分（1-5）
   */
  addRating(newRating) {
    const totalRating = this.rating * this.review_count + newRating;
    this.review_count += 1;
    this.rating = parseFloat((totalRating / this.review_count).toFixed(1));
    this.updated_at = new Date().toISOString();
  }

  /**
   * 获取产品的缩略图
   */
  getThumbnail() {
    return this.images && this.images.length > 0 ? this.images[0] : '';
  }

  /**
   * 判断是否为折扣商品
   */
  isOnSale() {
    return this.original_price > this.price;
  }

  /**
   * 将产品数据转换为数据库插入格式
   */
  toDbFormat() {
    return {
      name: this.name,
      description: this.description,
      price: this.price,
      original_price: this.original_price,
      category: this.category,
      series: this.series,
      brand: this.brand,
      stock: this.stock,
      sales: this.sales,
      rating: this.rating,
      review_count: this.review_count,
      images: JSON.stringify(this.images),
      is_hot: this.is_hot,
      is_new: this.is_new,
      is_limited: this.is_limited,
      probability: JSON.stringify(this.probability),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * 从数据库结果创建Product实例
   * @param {Object} dbResult - 数据库查询结果
   * @returns {Product} Product实例
   */
  static fromDbResult(dbResult) {
    // 处理JSON字符串字段
    const data = { ...dbResult };
    if (typeof data.images === 'string') {
      try {
        data.images = JSON.parse(data.images);
      } catch (e) {
        data.images = [];
      }
    }
    if (typeof data.probability === 'string') {
      try {
        data.probability = JSON.parse(data.probability);
      } catch (e) {
        data.probability = {};
      }
    }
    return new Product(data);
  }

  /**
   * 创建简化版产品信息（用于列表展示）
   */
  toSummary() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      original_price: this.original_price,
      discount: this.calculateDiscount(),
      thumbnail: this.getThumbnail(),
      is_hot: this.is_hot,
      is_new: this.is_new
    };
  }
}

export default Product;