import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import *  as elp from 'element-plus'

import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app
  .use(elp)
  .mount('#app')
