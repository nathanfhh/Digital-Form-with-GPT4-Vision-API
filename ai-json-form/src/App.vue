<script setup>
import VueForm from '@lljj/vue3-form-element'
import { createAjvInstance } from './ajvVueForm.js';
import { ref } from 'vue'
import { io } from 'socket.io-client'
import Codemirror from 'codemirror-editor-vue3'
import 'codemirror/addon/lint/lint.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/yaml-lint'
import 'codemirror/theme/dracula.css'

// 括號/標籤 匹配
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/matchtags'
// 括號/標籤 自動關閉
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/closetag'
// 程式碼摺疊
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/comment-fold'
// 縮排檔案
import 'codemirror/addon/fold/indent-fold'
// 游標行背景高亮
import 'codemirror/addon/selection/active-line'

// Search
import 'codemirror/addon/scroll/annotatescrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.js'
import 'codemirror/addon/search/match-highlighter.js'
import 'codemirror/addon/search/jump-to-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'
import jsyaml from 'js-yaml'
import { ElNotification, ElSwitch } from 'element-plus'
import { basicSchema } from './schema.js'

window.jsyaml = jsyaml
const schema = ref(basicSchema)
const formData = ref()
const ajv = createAjvInstance()
const cmOptions = ref({
  tabSize: 4,
  mode: 'text/yaml',
  theme: 'dracula',
  keepCursorInEnd: true,
  styleActiveLine: true,
  lineWrapping: true,
  lineNumbers: true,
  autofocus: true,
  autocorrect: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  foldGutter: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
  lint: true
})
const ymlCode = ref('')
const myCm = ref()
const pdfFileList = ref([])
const pdfImageUrl = ref('')
const inferencing = ref(false)
const activeName = ref('schemaDefYaml')
const isMock = ref(true);
const schemaVersion = ref(0)

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
      } catch (e) {
      }
      break
    case 'ai_response_done':
      ElNotification({
        title: 'AI 處理完成',
        message: 'AI 處理完成',
        type: 'success',
        duration: 2000
      })
      inferencing.value = false
      ymlCode.value = ''
      ymlCode.value = data.data
      break
    case 'pdf_screenshot':
      inferencing.value = true
      pdfImageUrl.value = data.data
      break
  }
})

ymlCode.value = jsyaml.dump(schema.value)
const onCodeChange = (code) => {
  // validate yaml, if its valid, update schema
  try {
    const currentCode = jsyaml.load(code)
    if (!currentCode) return;
    ajv.compile(currentCode)
    schema.value = currentCode;
  } catch (e) {
    ajv.errors = []
  }
  // Scroll to the bottom of CodeMirror
  if (!inferencing.value) return;
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
      is_mock: isMock.value
    })

    ElNotification({
      title: '成功上傳PDF',
      message: '成功上傳PDF',
      type: 'success',
      duration: 2000
    })
  }
  reader.readAsDataURL(file)
}
const selectText = (element) => {
  if (document.selection) {
    var range = document.body.createTextRange()
    range.moveToElementText(element)
    range.select()
  } else if (window.getSelection) {
    var range = document.createRange()
    range.selectNode(element)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }
}
</script>
<template>
  <div class="container">
    <div class="col-left">
      <div class="upload-thumbnail">
        <el-upload
          ref="uploadPdf"
          action
          accept=".pdf"
          :limit="1"
          :on-exceed="handleExceed"
          :before-upload="pdfUploadLogic"
          :file-list="pdfFileList"
          :auto-upload="true"
        >
          <div slot="trigger" class="icon">
            <img style="width: 40px" src="./assets/upload.svg" alt="" />
          </div>
        </el-upload>
        <div id="monitor">
          <div :class="inferencing ? 'scan' : ''"></div>
          <img :src="pdfImageUrl" :class="pdfImageUrl ? 'pdfImage' : 'hide'" alt="pdf screenshot" />
        </div>
      </div>

      <div style="height: 60vh">
        <el-tabs v-model="activeName">
          <el-tab-pane label="Schema YAML" name="schemaDefYaml">
            <div style="height: 60vh">
              <Codemirror ref="myCm" v-model:value="ymlCode" :options="cmOptions" @change="onCodeChange" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="Schema JSON" name="schemaDefJson">
            <div style="height: 60vh; overflow: scroll;">
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
          </el-tab-pane>
        </el-tabs>

      </div>
    </div>
    <div class="col-right">
      <VueForm v-model="formData" :schema="schema"> </VueForm>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 96vw;
  height: 98vh;
  justify-content: space-between;
}

.col-left {
  width: 40vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hide {
  display: none;
}

.col-right {
  width: 50vw;
  max-height: 95vh;
  overflow-y: scroll;
}

.pdfImage {
  width: 100%;
  max-height: 30vh;
  object-fit: contain;
}

.upload-thumbnail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 31vh;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0 10px;
  margin-bottom: 10px;
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
  margin: auto;
  position: relative;
  height: 30vh;
}
</style>
