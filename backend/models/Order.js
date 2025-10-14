/**
 * 订单模型
 * 定义订单数据结构和相关方法
 */

class Order {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.items = data.items || [];
    this.total_amount = data.total_amount || 0;
    this.status = data.status || 'pending'; // pending, paid, shipped, delivered, cancelled
    this.payment_method = data.payment_method || '';
    this.payment_id = data.payment_id || '';
    this.shipping_address = data.shipping_address || {};
    this.tracking_number = data.tracking_number || '';
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.paid_at = data.paid_at || null;
    this.shipped_at = data.shipped_at || null;
    this.delivered_at = data.delivered_at || null;
    this.cancelled_at = data.cancelled_at || null;
    this.cancellation_reason = data.cancellation_reason || '';
  }

  /**
   * 获取订单的公共信息
   */
  getPublicInfo() {
    return {
      id: this.id,
      user_id: this.user_id,
      items: this.items.map(item => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      total_amount: this.total_amount,
      status: this.status,
      status_text: this.getStatusText(),
      payment_method: this.payment_method,
      shipping_address: this.shipping_address,
      tracking_number: this.tracking_number,
      created_at: this.created_at,
      updated_at: this.updated_at,
      item_count: this.calculateItemCount()
    };
  }

  /**
   * 获取订单状态的中文文本
   */
  getStatusText() {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消'
    };
    return statusMap[this.status] || '未知状态';
  }

  /**
   * 计算订单中的商品总数
   */
  calculateItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * 更新订单状态
   * @param {string} newStatus - 新的状态
   * @param {Object} options - 附加选项
   */
  updateStatus(newStatus, options = {}) {
    this.status = newStatus;
    this.updated_at = new Date().toISOString();
    
    // 更新对应时间戳
    switch (newStatus) {
      case 'paid':
        this.paid_at = options.paid_at || new Date().toISOString();
        this.payment_id = options.payment_id || this.payment_id;
        break;
      case 'shipped':
        this.shipped_at = options.shipped_at || new Date().toISOString();
        this.tracking_number = options.tracking_number || this.tracking_number;
        break;
      case 'delivered':
        this.delivered_at = options.delivered_at || new Date().toISOString();
        break;
      case 'cancelled':
        this.cancelled_at = options.cancelled_at || new Date().toISOString();
        this.cancellation_reason = options.reason || '';
        break;
    }
  }

  /**
   * 更新收货地址
   * @param {Object} address - 新的收货地址
   */
  updateShippingAddress(address) {
    this.shipping_address = { ...this.shipping_address, ...address };
    this.updated_at = new Date().toISOString();
  }

  /**
   * 设置支付信息
   * @param {string} paymentMethod - 支付方式
   * @param {string} paymentId - 支付ID
   */
  setPaymentInfo(paymentMethod, paymentId) {
    this.payment_method = paymentMethod;
    this.payment_id = paymentId;
    this.updated_at = new Date().toISOString();
  }

  /**
   * 设置物流信息
   * @param {string} trackingNumber - 物流单号
   */
  setTrackingInfo(trackingNumber) {
    this.tracking_number = trackingNumber;
    this.updated_at = new Date().toISOString();
  }

  /**
   * 检查订单是否可取消
   */
  canCancel() {
    return ['pending', 'paid'].includes(this.status);
  }

  /**
   * 检查订单是否已完成
   */
  isCompleted() {
    return this.status === 'delivered';
  }

  /**
   * 检查订单是否已取消
   */
  isCancelled() {
    return this.status === 'cancelled';
  }

  /**
   * 重新计算订单总价
   */
  recalculateTotal() {
    this.total_amount = this.items.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
    this.updated_at = new Date().toISOString();
  }

  /**
   * 将订单数据转换为数据库插入格式
   */
  toDbFormat() {
    return {
      user_id: this.user_id,
      items: JSON.stringify(this.items),
      total_amount: this.total_amount,
      status: this.status,
      payment_method: this.payment_method,
      payment_id: this.payment_id,
      shipping_address: JSON.stringify(this.shipping_address),
      tracking_number: this.tracking_number,
      created_at: this.created_at,
      updated_at: this.updated_at,
      paid_at: this.paid_at,
      shipped_at: this.shipped_at,
      delivered_at: this.delivered_at,
      cancelled_at: this.cancelled_at,
      cancellation_reason: this.cancellation_reason
    };
  }

  /**
   * 从数据库结果创建Order实例
   * @param {Object} dbResult - 数据库查询结果
   * @returns {Order} Order实例
   */
  static fromDbResult(dbResult) {
    // 处理JSON字符串字段
    const data = { ...dbResult };
    if (typeof data.items === 'string') {
      try {
        data.items = JSON.parse(data.items);
      } catch (e) {
        data.items = [];
      }
    }
    if (typeof data.shipping_address === 'string') {
      try {
        data.shipping_address = JSON.parse(data.shipping_address);
      } catch (e) {
        data.shipping_address = {};
      }
    }
    return new Order(data);
  }

  /**
   * 创建订单摘要信息
   */
  toSummary() {
    return {
      id: this.id,
      total_amount: this.total_amount,
      item_count: this.calculateItemCount(),
      status: this.status,
      status_text: this.getStatusText(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Order;