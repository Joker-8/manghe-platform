import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    },
    server: {
        port: 5174,
        host: true,
        strictPort: true,
        logLevel: 'info',
        // 启用代理配置，将API请求转发到后端服务器
        proxy: {
            '/api': {
                target: 'http://localhost:3004',
                changeOrigin: true
            }
        }
    },
    logLevel: 'info'
})