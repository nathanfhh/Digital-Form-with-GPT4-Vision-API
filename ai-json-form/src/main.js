import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect, ElDatePicker, ElButton, ElPopover, ElSwitch } from 'element-plus';


import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app
  .use(ElForm)
  .use(ElFormItem)
  .use(ElInput)
  .use(ElInputNumber)
  .use(ElSelect)
  .use(ElDatePicker)
  .use(ElButton)
  .use(ElPopover)
  .use(ElSwitch)
  .mount('#app')
