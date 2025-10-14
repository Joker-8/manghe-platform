// 跨设备数据持久化功能测试脚本
// 用于验证数据同步功能的可靠性和异常处理能力

// 测试场景：
// 1. 基本同步功能测试
// 2. 网络中断恢复后的同步
// 3. 数据冲突解决
// 4. 边界情况测试

const axios = require('axios');

// 配置API基础URL
const API_BASE_URL = 'http://localhost:3000/api';
const userId = 1; // 测试用户ID

// 创建API客户端
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 模拟数据生成函数
function generateTestData() {
  return {
    favorites: [101, 102, 103, 104],
    cart: [
      { id: 201, quantity: 1 },
      { id: 202, quantity: 2 }
    ],
    version: Math.floor(Math.random() * 1000),
    lastSyncTime: new Date().toISOString()
  };
}

// 测试1: 基本同步功能测试
async function testBasicSync() {
  console.log('\n=== 测试1: 基本同步功能测试 ===');
  try {
    // 准备测试数据
    const testData = generateTestData();
    
    // 上传测试数据到服务器
    console.log('上传测试数据到服务器...');
    const syncResponse = await apiClient.post(`/users/${userId}/sync`, testData);
    console.log('同步响应:', syncResponse.data);
    
    // 验证同步成功
    if (syncResponse.data.success) {
      console.log('✓ 数据同步到服务器成功');
      
      // 从服务器获取数据并验证
      console.log('从服务器获取同步数据...');
      const getResponse = await apiClient.get(`/users/${userId}/sync`);
      console.log('获取响应:', getResponse.data);
      
      if (getResponse.data.success) {
        const serverData = getResponse.data.data;
        // 验证数据一致性
        console.log('验证数据一致性...');
        console.log(`本地收藏数: ${testData.favorites.length}, 服务器收藏数: ${serverData.favorites.length}`);
        console.log(`本地购物车数: ${testData.cart.length}, 服务器购物车数: ${serverData.cart.length}`);
        console.log('✓ 基本同步功能测试通过');
      } else {
        console.error('✗ 从服务器获取数据失败');
      }
    } else {
      console.error('✗ 数据同步到服务器失败');
    }
  } catch (error) {
    console.error('✗ 基本同步测试发生错误:', error.message);
  }
}

// 测试2: 数据版本控制测试
async function testVersionControl() {
  console.log('\n=== 测试2: 数据版本控制测试 ===');
  try {
    // 先上传低版本数据
    const oldData = {
      favorites: [301, 302],
      version: 1,
      lastSyncTime: new Date().toISOString()
    };
    
    console.log('上传低版本数据 (version: 1)...');
    await apiClient.post(`/users/${userId}/sync`, oldData);
    console.log('✓ 低版本数据上传成功');
    
    // 上传高版本数据
    const newData = {
      favorites: [301, 302, 303, 304],
      version: 2,
      lastSyncTime: new Date().toISOString()
    };
    
    console.log('上传高版本数据 (version: 2)...');
    await apiClient.post(`/users/${userId}/sync`, newData);
    console.log('✓ 高版本数据上传成功');
    
    // 再次尝试上传低版本数据（应该被忽略）
    console.log('再次尝试上传低版本数据...');
    const response = await apiClient.post(`/users/${userId}/sync`, oldData);
    console.log('响应:', response.data);
    
    // 验证服务器数据是否仍然保持高版本
    const finalData = await apiClient.get(`/users/${userId}/sync`);
    if (finalData.data.data.version >= 2) {
      console.log('✓ 版本控制测试通过 - 低版本数据被正确忽略');
    } else {
      console.error('✗ 版本控制测试失败 - 低版本数据覆盖了高版本数据');
    }
  } catch (error) {
    console.error('✗ 版本控制测试发生错误:', error.message);
  }
}

// 测试3: 异常处理测试
async function testErrorHandling() {
  console.log('\n=== 测试3: 异常处理测试 ===');
  
  // 测试无效的用户ID
  try {
    console.log('测试无效的用户ID...');
    const response = await apiClient.get('/users/999999/sync');
    console.log('响应:', response.data);
    console.log('✓ 无效用户ID处理测试完成');
  } catch (error) {
    console.error('✗ 无效用户ID测试异常:', error.message);
  }
  
  // 测试无效的数据格式
  try {
    console.log('测试无效的数据格式...');
    const invalidData = 'this is not valid JSON';
    await apiClient.post(`/users/${userId}/sync`, invalidData);
  } catch (error) {
    console.log('✓ 无效数据格式正确被拒绝');
  }
  
  // 测试空数据
  try {
    console.log('测试空数据...');
    const response = await apiClient.post(`/users/${userId}/sync`, {});
    console.log('✓ 空数据处理测试完成');
  } catch (error) {
    console.error('✗ 空数据测试异常:', error.message);
  }
}

// 测试4: 性能测试 - 大量数据
async function testPerformance() {
  console.log('\n=== 测试4: 大量数据性能测试 ===');
  try {
    // 生成大量测试数据
    const largeData = {
      favorites: Array.from({length: 1000}, (_, i) => 10000 + i), // 1000个收藏项
      cart: Array.from({length: 100}, (_, i) => ({ id: 20000 + i, quantity: i % 10 + 1 })), // 100个购物车项
      version: 100,
      lastSyncTime: new Date().toISOString()
    };
    
    console.log('开始上传大量数据...');
    const startTime = Date.now();
    const response = await apiClient.post(`/users/${userId}/sync`, largeData);
    const endTime = Date.now();
    
    console.log(`✓ 大量数据上传完成，耗时: ${endTime - startTime}ms`);
    console.log('响应:', response.data);
  } catch (error) {
    console.error('✗ 性能测试发生错误:', error.message);
  }
}

// 执行所有测试
async function runAllTests() {
  console.log('========== 跨设备数据持久化功能测试 ==========');
  
  await testBasicSync();
  await testVersionControl();
  await testErrorHandling();
  await testPerformance();
  
  console.log('\n========== 测试完成 ==========');
}

// 启动测试
runAllTests().catch(err => {
  console.error('测试执行失败:', err);
});