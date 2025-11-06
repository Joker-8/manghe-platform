<template>
  <div class="customer-service-page">
    <div class="container py-8">
      <h1 class="page-title mb-6">退换货政策</h1>
      
      <div class="policy-content">
        <!-- 退换货政策说明 -->
        <div class="policy-section mb-8">
          <h2 class="section-title">退换货政策概述</h2>
          <p class="section-text">芒盒平台致力于为您提供优质的商品和服务。如果您收到的商品存在质量问题或与描述不符，我们支持7天无理由退换货（部分特殊商品除外）。为了保障您的权益，请仔细阅读以下退换货政策。</p>
        </div>
        
        <!-- 可退换货商品 -->
        <div class="policy-section mb-8">
          <h2 class="section-title">可退换货商品范围</h2>
          <div class="policy-list">
            <div class="policy-item">
              <div class="policy-icon success"><i class="bi bi-check"></i></div>
              <div class="policy-text">
                <strong>质量问题商品</strong>：商品存在破损、变形、功能故障等质量问题
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon success"><i class="bi bi-check"></i></div>
              <div class="policy-text">
                <strong>描述不符商品</strong>：收到的商品与网站描述严重不符
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon success"><i class="bi bi-check"></i></div>
              <div class="policy-text">
                <strong>错发漏发商品</strong>：收到的商品与订单不符或商品数量不足
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon success"><i class="bi bi-check"></i></div>
              <div class="policy-text">
                <strong>7天无理由退货商品</strong>：在不影响二次销售的前提下，支持7天无理由退货
              </div>
            </div>
          </div>
        </div>
        
        <!-- 不可退换货商品 -->
        <div class="policy-section mb-8">
          <h2 class="section-title">不可退换货商品</h2>
          <div class="policy-list">
            <div class="policy-item">
              <div class="policy-icon danger"><i class="bi bi-x"></i></div>
              <div class="policy-text">
                <strong>盲盒商品</strong>：盲盒商品一经拆封，不支持7天无理由退货（质量问题除外）
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon danger"><i class="bi bi-x"></i></div>
              <div class="policy-text">
                <strong>定制商品</strong>：根据客户要求定制的商品，不支持无理由退货
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon danger"><i class="bi bi-x"></i></div>
              <div class="policy-text">
                <strong>影响二次销售的商品</strong>：商品包装破损、标签缺失、已使用过的商品
              </div>
            </div>
            <div class="policy-item">
              <div class="policy-icon danger"><i class="bi bi-x"></i></div>
              <div class="policy-text">
                <strong>超过退换货时限</strong>：自收到商品之日起超过7天的普通商品
              </div>
            </div>
          </div>
        </div>
        
        <!-- 退换货流程 -->
        <div class="policy-section mb-8">
          <h2 class="section-title">退换货流程</h2>
          <div class="process-steps">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>申请退换货</h3>
                <p>在个人中心-我的订单页面，找到需要退换货的订单，点击"申请退换货"按钮，填写退换货原因并上传相关凭证。</p>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>客服审核</h3>
                <p>客服人员将在1-2个工作日内审核您的申请。审核通过后，系统将发送退货地址和退货说明。</p>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>寄回商品</h3>
                <p>请按照客服提供的地址和要求，将商品安全包装后寄回。请保留快递单号以便查询。</p>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="step-item">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>商品检验</h3>
                <p>我们收到退回的商品后，将进行检验以确认商品状态是否符合退换货条件。</p>
              </div>
            </div>
            <div class="step-divider"></div>
            <div class="step-item">
              <div class="step-number">5</div>
              <div class="step-content">
                <h3>处理完成</h3>
                <p>检验通过后，我们将为您办理退款或换货。退款将在1-7个工作日内原路返回您的支付账户。</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 注意事项 -->
        <div class="policy-section mb-8">
          <h2 class="section-title">退换货注意事项</h2>
          <div class="notice-list">
            <div class="notice-item">
              <i class="bi bi-exclamation-circle"></i>
              <span>申请退换货时，请提供清晰的商品照片和问题描述，以便我们快速处理。</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-exclamation-circle"></i>
              <span>退货时，请确保商品及其配件、赠品、说明书、包装等完好无损一并退回。</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-exclamation-circle"></i>
              <span>非质量问题的退货，运费由买家承担；质量问题的退换货，运费由卖家承担。</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-exclamation-circle"></i>
              <span>退款金额将按照您实际支付的金额退还，不包含优惠券、积分等优惠部分。</span>
            </div>
            <div class="notice-item">
              <i class="bi bi-exclamation-circle"></i>
              <span>如遇特殊情况，请及时联系客服协商解决。</span>
            </div>
          </div>
        </div>
        
        <!-- 联系我们 -->
        <div class="policy-section">
          <h2 class="section-title">如有疑问，请联系我们</h2>
          <div class="contact-options">
            <div class="contact-option">
              <i class="bi bi-headset"></i>
              <span>在线客服：9:00-21:00</span>
            </div>
            <div class="contact-option">
              <i class="bi bi-telephone"></i>
              <span>客服电话：400-123-4567</span>
            </div>
            <div class="contact-option">
              <i class="bi bi-envelope"></i>
              <span>客服邮箱：support@manghe.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReturnPolicy'
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

.policy-content {
  max-width: 900px;
  margin: 0 auto;
}

.policy-section {
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
}

.policy-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.policy-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.policy-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.policy-icon.success {
  background-color: #d4edda;
  color: #155724;
}

.policy-icon.danger {
  background-color: #f8d7da;
  color: #721c24;
}

.policy-text {
  flex: 1;
  line-height: 1.5;
}

.process-steps {
  position: relative;
  padding-left: 3rem;
}

.step-item {
  position: relative;
  padding-bottom: 2rem;
  padding-left: 0.5rem;
}

.step-number {
  position: absolute;
  left: -2.5rem;
  top: 0;
  width: 36px;
  height: 36px;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 1;
}

.step-content h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.step-content p {
  color: #555;
  line-height: 1.5;
}

.step-divider {
  position: absolute;
  left: -1.1rem;
  top: 36px;
  width: 2px;
  height: calc(100% - 36px);
  background-color: #e9ecef;
  z-index: 0;
}

.step-item:last-child .step-divider {
  display: none;
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
  color: #ffc107;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.contact-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.contact-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #555;
}

.contact-option i {
  color: #007bff;
  font-size: 1.25rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
  
  .policy-section {
    padding: 1.5rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
  
  .contact-options {
    flex-direction: column;
    gap: 1rem;
  }
  
  .policy-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .process-steps {
    padding-left: 2rem;
  }
  
  .step-item {
    padding-left: 0;
  }
  
  .step-number {
    left: -1.75rem;
    width: 30px;
    height: 30px;
    font-size: 0.875rem;
  }
  
  .step-content h3 {
    font-size: 1.1rem;
  }
}
</style>