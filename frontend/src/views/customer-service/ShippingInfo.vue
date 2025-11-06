<template>
  <div class="customer-service-page">
    <div class="container py-8">
      <h1 class="page-title mb-6">配送信息</h1>
      
      <div class="shipping-content">
        <!-- 配送范围 -->
        <div class="shipping-section mb-8">
          <h2 class="section-title">配送范围</h2>
          <p class="section-text">芒盒平台目前支持全国范围内的配送服务（港澳台地区除外）。我们与多家优质快递公司合作，确保您的商品能够安全、快速地送达您手中。</p>
          
          <div class="region-list">
            <div class="region-item">
              <h3>主要城市</h3>
              <p>北京、上海、广州、深圳、杭州、南京、成都、重庆、武汉、西安等省会城市和直辖市</p>
            </div>
            <div class="region-item">
              <h3>二线城市</h3>
              <p>天津、苏州、宁波、厦门、青岛、大连、郑州、长沙、昆明、合肥等</p>
            </div>
            <div class="region-item">
              <h3>其他地区</h3>
              <p>全国大部分县级及以上城市，部分偏远地区可能需要额外配送时间</p>
            </div>
          </div>
        </div>
        
        <!-- 配送方式 -->
        <div class="shipping-section mb-8">
          <h2 class="section-title">配送方式</h2>
          
          <div class="delivery-methods">
            <div class="method-card">
              <div class="method-header">
                <div class="method-icon"><i class="bi bi-truck"></i></div>
                <div class="method-title">
                  <h3>标准配送</h3>
                  <span class="delivery-time">3-5个工作日</span>
                </div>
              </div>
              <div class="method-content">
                <p>默认配送方式，覆盖全国大部分地区，运费根据订单金额和地区有所不同。</p>
                <p class="shipping-fee">订单满88元免运费，未满收取10元运费</p>
              </div>
            </div>
            
            <div class="method-card">
              <div class="method-header">
                <div class="method-icon express"><i class="bi bi-train-front"></i></div>
                <div class="method-title">
                  <h3>加急配送</h3>
                  <span class="delivery-time">1-3个工作日</span>
                </div>
              </div>
              <div class="method-content">
                <p>优先处理和配送，适合时间紧急的订单，目前仅支持部分主要城市。</p>
                <p class="shipping-fee">订单满199元免运费，未满收取20元运费</p>
              </div>
            </div>
            
            <div class="method-card">
              <div class="method-header">
                <div class="method-icon special"><i class="bi bi-bicycle"></i></div>
                <div class="method-title">
                  <h3>同城配送</h3>
                  <span class="delivery-time">当日或次日达</span>
                </div>
              </div>
              <div class="method-content">
                <p>仅支持部分一线城市的同城配送，下单后4小时内送达（18:00后下单次日送达）。</p>
                <p class="shipping-fee">订单满59元免运费，未满收取15元运费</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 配送时间 -->
        <div class="shipping-section mb-8">
          <h2 class="section-title">配送时间说明</h2>
          
          <div class="time-info">
            <div class="time-item">
              <h3>订单处理时间</h3>
              <p>工作日（周一至周五）：当天16:00前下单，当天发货；16:00后下单，次日发货</p>
              <p>周末及节假日：订单将在工作日优先处理并发货</p>
            </div>
            
            <div class="time-item">
              <h3>配送时效计算</h3>
              <p>配送时效从订单发货后开始计算，不包含订单处理时间和法定节假日</p>
              <p>偏远地区（如新疆、西藏、内蒙古等）配送时间可能延长1-3个工作日</p>
            </div>
            
            <div class="time-item">
              <h3>物流查询</h3>
              <p>订单发货后，您可以在订单详情页查看物流信息，或通过物流公司官网/APP查询</p>
              <p>如遇物流异常，请及时联系客服协助处理</p>
            </div>
          </div>
        </div>
        
        <!-- 收货须知 -->
        <div class="shipping-section mb-8">
          <h2 class="section-title">收货须知</h2>
          
          <div class="notice-list">
            <div class="notice-item">
              <i class="bi bi-check-circle"></i>
              <span>收货前请当面验货，确认商品完好无损后再签收</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-check-circle"></i>
              <span>如发现商品破损或异常，请拒绝签收并及时联系客服</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-check-circle"></i>
              <span>如需他人代签收，请提前告知代签收人验货注意事项</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-check-circle"></i>
              <span>盲盒类商品属于特殊商品，签收后非质量问题不支持退换</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-check-circle"></i>
              <span>签收后如发现商品问题，请在24小时内联系客服并提供相关凭证</span>
            </div>
          </div>
        </div>
        
        <!-- 配送异常 -->
        <div class="shipping-section">
          <h2 class="section-title">配送异常处理</h2>
          
          <div class="exception-handling">
            <div class="exception-item">
              <h3>长时间未收到商品</h3>
              <p>如超过预计送达时间3天仍未收到商品，请联系客服查询物流状态。我们将协助您联系快递公司或安排重新发货。</p>
            </div>
            
            <div class="exception-item">
              <h3>商品丢失或破损</h3>
              <p>如确认商品在运输过程中丢失或破损，请提供相关证明，我们将为您安排补发或退款。</p>
            </div>
            
            <div class="exception-item">
              <h3>地址错误或变更</h3>
              <p>订单发货前，您可以联系客服修改收货地址；订单已发货，我们将协助您联系快递公司尝试修改地址，但不保证一定成功。</p>
            </div>
            
            <div class="exception-item">
              <h3>节假日配送安排</h3>
              <p>法定节假日期间，部分地区配送可能延迟1-2天。节假日期间的订单将在节后优先处理。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShippingInfo'
}
</script>

<style scoped>
.customer-service-page {
  min-height: 70vh;
  padding-top: 80px;
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.shipping-content {
  max-width: 900px;
  margin: 0 auto;
}

.shipping-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #007bff;
}

.section-text {
  line-height: 1.6;
  color: #555;
  margin-bottom: 1.5rem;
}

.region-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.region-item {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.region-item h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.region-item p {
  color: #555;
  margin: 0;
}

.delivery-methods {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.method-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.method-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.method-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.method-icon {
  width: 50px;
  height: 50px;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.method-icon.express {
  background-color: #28a745;
}

.method-icon.special {
  background-color: #ffc107;
  color: #333;
}

.method-title h3 {
  margin: 0;
  font-size: 1.2rem;
}

.delivery-time {
  color: #666;
  font-size: 0.9rem;
}

.method-content {
  padding: 1rem;
}

.method-content p {
  margin-bottom: 0.5rem;
  color: #555;
}

.shipping-fee {
  font-weight: 500;
  color: #007bff !important;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.time-item h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.time-item p {
  color: #555;
  margin-bottom: 0.25rem;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #555;
}

.notice-item i {
  color: #28a745;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.exception-handling {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exception-item h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.exception-item p {
  color: #555;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .shipping-section {
    padding: 1.5rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
  
  .method-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .method-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
}
</style>