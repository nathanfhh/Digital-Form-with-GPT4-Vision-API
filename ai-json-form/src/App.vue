<script setup>
import { createAjvInstance } from './ajvVueForm.js';
import { ref, watch, defineAsyncComponent } from 'vue'
import { io } from 'socket.io-client'

import jsyaml from 'js-yaml'
import { ElNotification, ElSwitch } from 'element-plus'
import { basicSchema } from './configs.js'
import { codeMirrorConfig } from './codeMirror.js'

window.jsyaml = jsyaml
const VueForm = defineAsyncComponent(() => import('@lljj/vue3-form-element'))
const Codemirror = defineAsyncComponent(() => import('codemirror-editor-vue3'))
const schema = ref(basicSchema)
const formData = ref()
const ajv = createAjvInstance()
const cmOptions = ref(codeMirrorConfig)
const ymlCode = ref(jsyaml.dump(schema.value))
const myCm = ref()
const pdfFileList = ref([])
const pdfImageUrl = ref('')
const inferencing = ref(false)
const activeName = ref('schemaDefYaml')
const isMock = ref(localStorage.getItem('isMock') === 'true')
const isDetailHigh = ref(localStorage.getItem('isDetailHigh') === 'true')
const schemaVersion = ref(0)
const carouselPlay = ref(true)

let lastYamlCode = ''
let socket = io(`${import.meta.env.VITE_APP_BACKEND_URL}/openai`, {
  transports: ['websocket', 'polling']
})

socket.on('connect', () => {
  socket.emit('join', {})
})
socket.on('server_command', (data) => {
  switch (data.cmd) {
    case 'greeting':
      ElNotification({
        title: '成功連接 SocketIo!',
        message: data.data,
        type: 'success',
        duration: 2000
      })
      break
    case 'ai_response':
      inferencing.value = true
      ymlCode.value += data.data
      try {
        document.querySelector('.el-form').scrollIntoView({
          block: 'end',
          behavior: 'instant'
        })
      } catch (e) {}
      break
    case 'ai_response_done':
      inferencing.value = false
      carouselPlay.value = false
      if (data.data === null) return
      ElNotification({
        title: 'AI 處理完成',
        message: 'AI 處理完成',
        type: 'success',
        duration: 2000
      })
      ymlCode.value = ''
      ymlCode.value = data.data
      schemaVersion.value += 1
      break
    case 'pdf_screenshot':
      inferencing.value = true
      pdfImageUrl.value = data.data
      carouselPlay.value = true
      break
    case 'message':
      ElNotification({
        title: '訊息',
        message: data.data.message,
        type: data.data.type,
        duration: data.data.type === 'error' ? 0 : 5000
      })
      break
  }
})
const parseYAML = (data) => {
  return jsyaml.load(data)
}
const isLastLineEqualsTo = (code, target) => {
  let lines = code.trim().split('\n')
  return lines[lines.length - 1].trim() === target
}
const onCodeChange = (code) => {
  try {
    let result = parseYAML(code)
    ajv.compile(result) // make the error happen to trigger catch block to sync the data to UI
    lastYamlCode = result // make sure the lastYamlCode is always valid
    if (!inferencing.value) {
      // manually change the code
      schema.value = result
    }
  } catch (e) {
    ajv.errors = []
    if (lastYamlCode && !isLastLineEqualsTo(code, 'items:')) {
      // the VueForm will failed to the type of array not defining items
      console.log('syncContent', lastYamlCode)
      schema.value = lastYamlCode
      lastYamlCode = null
    }
  }
  // Scroll to the bottom of CodeMirror
  if (!inferencing.value) return
  myCm.value.cminstance.scrollTo(0, myCm.value.cminstance.getScrollInfo().height)
}

const handleExceed = () => {
  ElNotification({
    title: '超過上傳限制',
    message: '上傳檔案數量超過限制',
    type: 'warning',
    duration: 2000
  })
}
const pdfUploadLogic = (file) => {
  ymlCode.value = ''
  let reader = new FileReader()
  reader.onload = () => {
    socket.emit('upload_pdf', {
      data: reader.result,
      is_mock: isMock.value,
      is_detail_high: isDetailHigh.value
    })
    ElNotification({
      title: '成功上傳PDF',
      message: '成功上傳PDF',
      type: 'success',
      duration: 2000
    })
    pdfFileList.value = []
  }
  reader.readAsDataURL(file)
}
const selectText = (element) => {
  let range
  if (document.selection) {
    range = document.body.createTextRange()
    range.moveToElementText(element)
    range.select()
  } else if (window.getSelection) {
    range = document.createRange()
    range.selectNode(element)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }
}
watch(isMock, (newVal) => {
  localStorage.setItem('isMock', newVal)
})
watch(isDetailHigh, (newVal) => {
  localStorage.setItem('isDetailHigh', newVal)
})
const downloadGeneratedYaml = () => {
  let blob = new Blob([ymlCode.value], { type: 'text/plain;charset=utf-8' })
  let url = window.URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = 'schema.yaml'
  a.click()
  window.URL.revokeObjectURL(url)
}
const downloadGeneratedJSON = () => {
  let blob = new Blob([JSON.stringify(schema.value, null, 2)], { type: 'text/plain;charset=utf-8' })
  let url = window.URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = 'schema.json'
  a.click()
  window.URL.revokeObjectURL(url)
}
const adjusttabContentHeight = () => {
  let vh = window.innerHeight
  let px = vh - 282
  if (px < 300) px = 300
  document.querySelectorAll('[name="tabContent"]').forEach((el) => {
    el.style.height = `${px}px`
  })
  tabContentHeight.value = `${px}px` // 220px Upload + 40px Tab + 15px Margin + 5px Body Margin
}
onMounted(() => {
  window.addEventListener('resize', adjusttabContentHeight)
  adjusttabContentHeight()
})
</script>
<template>
  <el-row :gutter="20">
    <el-col :span="12">
      <el-row class="operation">
        <el-col :span="8" class="upload-container">
          <el-upload :disabled="inferencing" ref="uploadPdf" action accept=".pdf" :limit="1" :on-exceed="handleExceed"
            :before-upload="pdfUploadLogic" :file-list="pdfFileList" :auto-upload="true"
            :http-request="(x) => x.onSuccess({})" :show-file-list="false">
            <div slot="trigger" class="icon">
              <img style="width: 40px" src="./assets/upload.svg" alt="" /><br>
              <small>點擊上傳PDF</small>
            </div>
          </el-upload>
        </el-col>
        <el-col :span="16">
          <div id="monitor">
            <div :class="inferencing ? 'scan' : ''"></div>
            <el-carousel v-if="pdfImageUrl" :autoplay="carouselPlay" :interval="3500" type="card" style="width: 100%;">
              <el-carousel-item v-for="url in pdfImageUrl" :key="url" height="100%">
                <img :src="url" :class="pdfImageUrl ? 'pdfImage' : 'hide'" alt="pdf screenshot" />
              </el-carousel-item>
            </el-carousel>
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-tabs v-model="activeName">
            <el-tab-pane label="Schema YAML" name="schemaDefYaml">
              <el-button
                class="tab-button"
                type="primary"
                @click="downloadGeneratedYaml"
              >
                <img
                  style="width: 20px"
                  src="./assets/download.svg"
                  alt="download button"
                />&nbsp;下載
              </el-button>
              <div>
                <Codemirror
                  ref="myCm"
                  v-model:value="ymlCode"
                  :options="cmOptions"
                  :height="tabContentHeight"
                  @change="onCodeChange"
                />
              </div>
            </el-tab-pane>
            <el-tab-pane label="Schema JSON" name="schemaDefJson">
              <el-button class="tab-button" type="primary" @click="downloadGeneratedJSON">
                <img
                  style="width: 20px"
                  src="./assets/download.svg"
                  alt="download button"
                />&nbsp;下載
              </el-button>
              <div name="tabContent" style="overflow: scroll">
                <pre @click="selectText($event.target)">{{ schema }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Form Data" name="formData">
              <div style="height: 60vh; overflow: scroll;">
                <pre @click="selectText($event.target)">{{ formData }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Settings" name="settings">
              <el-switch v-model="isMock" active-text="Mock Response" inactive-text="Use AI Model" />
              <br>
              <el-switch v-model="isDetailHigh" active-text="OpenAI Image Detail: High"
                inactive-text="OpenAI Image Detail: Low" />
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-col>
    <el-col :span="12" style="overflow-y: scroll; height: 98vh;">
      <VueForm :key="schemaVersion" v-model="formData" :schema="schema"></VueForm>
    </el-col>
  </el-row>
</template>

<style scoped>
.operation {
  border-radius: 5px;
  border: 1px solid #ccc;
}

.hide {
  display: none;
}

.pdfImage {
  width: auto;
  border: 1px solid #452f2f;
  max-height: 29vh;
  object-fit: contain;
}

.upload-container {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  height: 31vh;
  padding: 0 10px;
  /* overflow: scroll; */
}

.scan {
  width: 100%;
  height: 10px;
  background-color: rgba(238, 72, 72, 0.8);
  position: absolute;
  z-index: 9999;
  -moz-animation: scan 5s infinite;
  -webkit-animation: scan 5s infinite;
  animation: scan 5s infinite;
  -webkit-animation-direction: alternate-reverse;
  box-shadow: 0px 0px 30px rgba(255, 204, 102, 0.5);
}

@keyframes scan {

  0%,
  100% {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }

  100% {
    -webkit-transform: translateY(calc(-10px + 30vh));
    transform: translateY(calc(-10px + 30vh));
  }
}

#monitor {
  position: relative;
  display: block;
  height: 31vh;
}
</style>
