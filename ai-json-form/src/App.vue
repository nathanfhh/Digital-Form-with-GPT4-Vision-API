<script setup>
import { createAjvInstance } from './ajvVueForm.js'
import { ref, watch, defineAsyncComponent, onMounted } from 'vue'

import jsyaml from 'js-yaml'
import {
  ElNotification,
  ElSwitch,
  ElInput,
  ElRow,
  ElCol,
  ElUpload,
  ElCarousel,
  ElCarouselItem,
  ElTabPane,
  ElTabs,
  ElButton,
  ElTag
} from 'element-plus'
import { basicSchema } from './configs.js'
import { codeMirrorConfig } from './codeMirror.js'
import { getVersion } from './axios.js'
import { handlers } from './handler'
import { version as fontendVersion } from '../package.json'

window.jsyaml = jsyaml
const VueForm = defineAsyncComponent(() => import('@lljj/vue3-form-element'))
const Codemirror = defineAsyncComponent(() => import('codemirror-editor-vue3'))
const schema = ref(basicSchema)
const formData = ref()
const ajv = createAjvInstance()
const cmOptions = ref(codeMirrorConfig)
const ymlCode = ref(jsyaml.dump(schema.value) || '')
const myCm = ref()
const pdfFileList = ref([])
const pdfImageDataList = ref([])
const inferencing = ref(false)
const tabActiveName = ref('schemaDefYaml')
const isMock = ref(localStorage.getItem('isMock') === 'true')
const isDetailHigh = ref(localStorage.getItem('isDetailHigh') === 'true')
const schemaVersion = ref(0)
const tabContentHeight = ref('')
const frontendOnly = ref(false)
const OpenAPIKey = ref('')
const frontendOnlyMaxPDFPages = ref(parseInt(localStorage.getItem('maxPDFPages')) || 3)
const frontendVersion = ref(fontendVersion)
const backendVersion = ref('')
console.log('Frontend version:', frontendVersion.value)

const { SocketIOBackendHandler, FrontendOnlyHandler } = handlers
let handler = null
let handlerParameters = {
  inferencing: inferencing,
  ymlCode: ymlCode,
  schemaVersion: schemaVersion,
  pdfImageDataList: pdfImageDataList,
  isDetailHigh: isDetailHigh,
  isMock: isMock,
  tabActiveName: tabActiveName
}

const frontendOnlyHandler = () => {
  frontendOnly.value = true
  handler = new FrontendOnlyHandler(OpenAPIKey, {
    frontendOnlyMaxPDFPages: frontendOnlyMaxPDFPages,
    ...handlerParameters
  })
  ElNotification({
    title: '您正使用純前端功能',
    message: '由於無法連接後端，將使用純前端功能，請至 Settings 下填入 OpenAI API Key',
    type: 'warning',
    duration: 30000
  })
  console.log('無法連接後端，將使用純前端功能，請至 Settings 下填入 OpenAI API Key')
  tabActiveName.value = 'settings'
}
getVersion()
  .then((response) => {
    console.log(response)
    if (response.status !== 200) return frontendOnlyHandler()
    if (!response.data?.data?.version) return frontendOnlyHandler()
    backendVersion.value = response.data.data.version
    console.log('Backend version:', backendVersion.value)
    handler = new SocketIOBackendHandler(handlerParameters)
  })
  .catch((e) => {
    console.error(e)
    frontendOnlyHandler()
  })

let lastYamlCode = ''
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
    handler.handle_pdf_file(reader.result, isMock.value, isDetailHigh.value)
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
watch(frontendOnlyMaxPDFPages, (newVal) => {
  localStorage.setItem('maxPDFPages', newVal)
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
  <el-row :gutter="10" style="margin: 0">
    <el-col :span="12">
      <el-row class="operation border">
        <el-col :span="8" class="upload-container">
          <el-upload
            :disabled="inferencing"
            ref="uploadPdf"
            action
            accept=".pdf"
            :limit="1"
            :on-exceed="handleExceed"
            :before-upload="pdfUploadLogic"
            :file-list="pdfFileList"
            :auto-upload="true"
            :http-request="(x) => x.onSuccess({})"
            :show-file-list="false"
          >
            <div slot="trigger" style="display: flex; align-items: center; flex-direction: column">
              <img style="width: 40px" src="./assets/upload.svg" alt="" /><br />
              <small>點擊上傳PDF</small>
            </div>
          </el-upload>
        </el-col>
        <el-col :span="16">
          <div id="monitor">
            <div :class="inferencing ? 'scan' : ''"></div>
            <el-carousel
              v-if="pdfImageDataList"
              :autoplay="inferencing"
              :interval="3500"
              type="card"
              height="220px"
            >
              <el-carousel-item v-for="url in pdfImageDataList" :key="url">
                <img
                  :src="url"
                  :class="pdfImageDataList ? 'pdfImage' : 'hide'"
                  alt="pdf screenshot"
                />
              </el-carousel-item>
            </el-carousel>
          </div>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-tabs v-model="tabActiveName">
            <el-tab-pane label="Schema YAML" name="schemaDefYaml">
              <el-button class="tab-button" type="primary" @click="downloadGeneratedYaml">
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
              <div name="tabContent" class="overflow-auto">
                <pre @click="selectText($event.target)">{{ schema }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Form Data" name="formData">
              <div name="tabContent" class="overflow-auto">
                <pre @click="selectText($event.target)">{{ formData }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Settings" name="settings">
              <div name="tabContent" class="overflow-auto">
                <p>
                  &nbsp;&nbsp;Use AI Model:<br />
                  <span style="display: flex; justify-content: center">
                    <el-switch v-model="isMock" active-text="Mocked" inactive-text="Real" />
                  </span>
                </p>
                <p>
                  &nbsp;&nbsp;OpenAI Image Detail:<br />
                  <span style="display: flex; justify-content: center">
                    <el-switch v-model="isDetailHigh" active-text="High" inactive-text="Low" />
                  </span>
                </p>
                <Transition>
                  <p v-show="frontendOnly && !isMock">
                    &nbsp;&nbsp;OpenAI API Key (for Frontend Only Mode):<br />
                    <span style="display: flex; justify-content: center">
                      <span
                        style="
                          display: flex;
                          flex-direction: column;
                          justify-content: center;
                          width: 90%;
                          margin-top: 5px;
                        "
                      >
                        <el-input
                          id="apiKey"
                          type="password"
                          v-model="OpenAPIKey"
                          placeholder="OpenAI API Key: sk-....."
                        />
                        <small style="color: rgba(0, 0, 0, 0.7); margin-top: 2px">
                          Your key <b>MUST</b> have access to
                          <a href="https://platform.openai.com/docs/guides/vision" target="_blank"
                            >GPT-4 Vision</a
                          >, for details you may refer to the trouble shooting guide from the
                          <a
                            href="https://github.com/abi/screenshot-to-code/blob/main/Troubleshooting.md"
                            target="_blank"
                            >screenshot-to-code</a
                          >
                          repository.
                        </small>
                        <small style="color: rgba(200, 0, 0, 0.7); margin-top: 2px">
                          The frontend-only mode exposes API keys in browser code, which may create
                          security risks. Keys are recommended to be
                          <a href="https://platform.openai.com/api-keys" target="_blank">revoked</a>
                          after use. We will not record any entries.
                        </small>
                      </span>
                    </span>
                  </p>
                </Transition>
                <Transition>
                  <p v-show="frontendOnly && !isMock">
                    &nbsp;&nbsp;Max PDF Pages:<br />
                    <span style="display: flex; justify-content: center">
                      <el-input-number v-model="frontendOnlyMaxPDFPages" :min="1" :max="10" />
                    </span>
                  </p>
                </Transition>
                <p>
                  &nbsp;&nbsp;Version Information:<br />
                  <span style="display: flex; justify-content: space-evenly">
                    <el-tag class="ml-2" type="success">Frontend: {{ frontendVersion }}</el-tag>
                    <el-tag v-show="!frontendOnly" class="ml-2" type="success"
                      >Backend: {{ backendVersion }}</el-tag
                    >
                  </span>
                </p>
                <p>
                  &nbsp;&nbsp;Source Code on Github:<br />
                  <span style="display: flex; justify-content: center">
                    <a
                      target="_blank"
                      href="https://github.com/nathanfhh/Digital-Form-with-GPT4-Vision-API"
                    >
                      <img
                        style="margin-top: 2px; width: 40px"
                        src="./assets/github-mark.svg"
                        alt="github button"
                      />
                    </a>
                  </span>
                </p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-col>
    <el-col class="border" :span="12" style="overflow-y: auto; height: calc(100vh - 6px)">
      <VueForm :key="schemaVersion" v-model="formData" :schema="schema"></VueForm>
    </el-col>
  </el-row>
</template>

<style scoped>
.border {
  padding: 1px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
.operation {
  height: 220px;
}

.el-carousel__container,
.el-carousel__item {
  height: 200px;
}

.hide {
  display: none;
}

.pdfImage {
  width: auto;
  border: 1px solid #452f2f;
  max-height: 198px;
  object-fit: contain;
}

.upload-container {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  padding: 0 10px;
}

.scan {
  width: 75%;
  height: 10px;
  background-color: rgba(238, 72, 72, 0.8);
  position: absolute;
  left: 12.5%;
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
    -webkit-transform: translateY(210px);
    transform: translateY(210px);
  }
}

#monitor {
  position: relative;
  display: block;
  text-align: center;
  margin: 0 auto;
}

p {
  margin-bottom: 2px;
}

pre {
  margin: 0;
}

.tab-button {
  top: 0;
  right: 0;
  position: absolute;
  z-index: 1;
}
.overflow-auto {
  overflow: auto;
}
.v-enter-active {
  animation: bounce-in 0.5s;
}
.v-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
</style>
