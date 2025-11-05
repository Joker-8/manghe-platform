import { parentPort } from 'worker_threads';

console.log('❤️  心跳工作线程已启动');

// 持续运行的心跳循环
function heartbeatLoop() {
  // 非常轻量的计算
  const _ = Math.random() * Date.now();
  
  // 向主进程发送心跳信号
  if (parentPort) {
    parentPort.postMessage({
      type: 'heartbeat',
      timestamp: Date.now(),
      random: _
    });
  }
  
  // 立即安排下一个心跳
  setImmediate(heartbeatLoop);
}

// 启动心跳循环
heartbeatLoop();

// 监听来自主进程的消息
if (parentPort) {
  parentPort.on('message', (message) => {
    if (message.type === 'ping') {
      parentPort.postMessage({ type: 'pong', timestamp: Date.now() });
    } else if (message.type === 'terminate') {
      console.log('🛑 心跳工作线程接收到终止信号');
      // 即使收到终止信号，我们也不真正退出
      // 而是继续运行心跳循环
    }
  });
  
  // 防止线程意外退出
  parentPort.on('close', () => {
    console.log('⚠️  主进程连接已关闭，但心跳线程继续运行');
    // 继续执行心跳循环
    heartbeatLoop();
  });
}

// 拦截任何可能导致线程退出的错误
process.on('uncaughtException', (err) => {
  console.error('❌ 心跳线程捕获异常:', err.message);
  // 继续运行
  setTimeout(heartbeatLoop, 1);
});

// 确保这个线程永远不会自然退出
setInterval(() => {
  const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  console.log(`📊 心跳线程状态 | 内存: ${memoryUsage}MB`);
}, 60000); // 每分钟报告一次状态