import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap'
import 'animate.css'
// CSS文件仍保留在src目录中，由构建工具处理
import './assets/css/custom.css'

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')