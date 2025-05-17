<script setup>
import {ref, watch, defineAsyncComponent, onMounted, nextTick} from 'vue'
import {SurveyModel} from 'survey-core'
import 'survey-core/survey-core.css';

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
  ElTag,
  ElDialog
} from 'element-plus'
import {
  ArrowLeft,
  ArrowRight
} from '@element-plus/icons-vue'
import {basicSchema} from './configs.js'
import {codeMirrorConfig} from './codeMirror.js'
import {getVersion} from './axios.js'
import {handlers} from './handler'
import {version as fontendVersion} from '../package.json'
import {useModel} from "./handler/frontend/openai.js";

window.jsyaml = jsyaml
const Codemirror = defineAsyncComponent(() => import('codemirror-editor-vue3'))
const surveyJson = ref(basicSchema)
const surveyModel = ref(null)
const formData = ref()
const cmOptions = ref(codeMirrorConfig)
const ymlCode = ref(jsyaml.dump(surveyJson.value) || '')
const myCm = ref()
const pdfFileList = ref([])
const pdfImageDataList = ref([])
const inferencing = ref(false)
const tabActiveName = ref('schemaDefYaml')
const isMock = ref(localStorage.getItem('isMock') === 'true')
const isDetailHigh = ref(localStorage.getItem('isDetailHigh') === 'true')
const tabContentHeight = ref('')
const frontendOnly = ref(false)
const OpenAPIKey = ref(localStorage.getItem('OpenAPIKey') || '')
const frontendOnlyMaxPDFPages = ref(parseInt(localStorage.getItem('maxPDFPages')) || 3)
const frontendVersion = ref(fontendVersion)
const backendVersion = ref('')
const imagePreviewDialogVisible = ref(false)
const imagePreviewUrl = ref('')
const leftColSpan = ref(12)
const reloadKey = ref(0)

watch(OpenAPIKey, (newVal) => {
  localStorage.setItem('OpenAPIKey', newVal)
})


function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

console.log('Frontend version:', frontendVersion.value)
const {SocketIOBackendHandler, FrontendOnlyHandler} = handlers
const leastColSpan = 4;
let handler = null
let handlerParameters = {
  inferencing: inferencing,
  ymlCode: ymlCode,
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


const parseYAML = (data) => {
  return jsyaml.load(data)
}
const onFormSubmit = () => {
  surveyModel.value.onCompleting.add((sender, options) => {
    formData.value = sender.data
    tabActiveName.value = 'formData'
  });
}
const onCodeChange = (code) => {
  let lastYamlCode = ''
  let lastSurveyFormModel;
  try {
    const result = parseYAML(code)
    result.questionsOnPageMode = "singlePage"
    lastYamlCode = result
    surveyJson.value = result
    lastSurveyFormModel = new SurveyModel(result)
    surveyModel.value = lastSurveyFormModel
  } catch (e) {
    if (lastYamlCode) {
      if (lastYamlCode) {
        surveyJson.value = lastYamlCode
      }
      if (lastSurveyFormModel) {
        surveyModel.value = lastSurveyFormModel
      }
      lastYamlCode = null
      lastSurveyFormModel = null
    }
  } finally {
    onFormSubmit()
    reloadKey.value += 1
    if (inferencing.value) {
      nextTick().then(
          () => {
            const target = document.querySelector(".sd-navigation__complete-btn");
            if (!target) return
            try {
              console.log("Scroll surveyjs")
              target.scrollIntoView({behavior: 'instant', block: 'end'});
            } catch (e) {
            }
          }
      )
    }
  }
  if (!inferencing.value || !myCm.value) return
  try {
    myCm.value.cminstance.scrollTo(0, myCm.value.cminstance.getScrollInfo().height)
  } catch (e) {
  }
}
onCodeChange(ymlCode.value)
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
  let blob = new Blob([ymlCode.value], {type: 'text/plain;charset=utf-8'})
  let url = window.URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = 'schema.yaml'
  a.click()
  window.URL.revokeObjectURL(url)
}
const downloadGeneratedJSON = () => {
  let blob = new Blob([JSON.stringify(surveyJson.value, null, 2)], {type: 'text/plain;charset=utf-8'})
  let url = window.URL.createObjectURL(blob)
  let a = document.createElement('a')
  a.href = url
  a.download = 'schema.json'
  a.click()
  window.URL.revokeObjectURL(url)
}
const adjustTabContentHeight = () => {
  let vh = window.innerHeight
  let px = vh - 282
  if (px < 300) px = 300
  document.querySelectorAll('[name="tabContent"]').forEach((el) => {
    el.style.height = `${px}px`
  })
  tabContentHeight.value = `${px}px` // 220px Upload + 40px Tab + 15px Margin + 5px Body Margin
}
onMounted(() => {
  window.addEventListener('resize', adjustTabContentHeight)
  adjustTabContentHeight()
})
</script>
<template>
  <el-row :gutter="10" style="margin: 0">
    <el-col :span="leftColSpan">
      <el-row class="operation border">
        <el-col :span="8" class="upload-container">
          <el-upload :disabled="inferencing" ref="uploadPdf" action accept=".pdf" :limit="1" :on-exceed="handleExceed"
                     :before-upload="pdfUploadLogic" :file-list="pdfFileList" :auto-upload="true"
                     :http-request="(x) => x.onSuccess({})" :show-file-list="false">
            <div slot="trigger" class="upload">
              <img :style="inferencing ? 'cursor: not-allowed' : ''" style="width: 40px" src="./assets/upload.svg"
                   alt=""/><br/>
              <small :style="inferencing ? 'cursor: not-allowed' : ''">點擊上傳PDF</small>
            </div>
          </el-upload>
        </el-col>
        <el-col :span="16">
          <div style="position: absolute; top: 2px; right: 2px; z-index: 1000;">
            <el-button circle type="success"
                       @click="() => { leftColSpan <= leastColSpan ? leftColSpan = 12 : leftColSpan = leastColSpan }"
                       :icon="leftColSpan <= leastColSpan ? ArrowRight : ArrowLeft">
            </el-button>
          </div>
          <div id="monitor">
            <div :class="inferencing ? 'scan' : ''"></div>
            <el-carousel v-if="pdfImageDataList" :autoplay="inferencing" :interval="3500" indicator-position="none"
                         type="card" height="220px">
              <el-carousel-item v-for="url in pdfImageDataList" :key="url">
                <img :src="url" :class="pdfImageDataList ? 'pdfImage' : 'hide'" alt="pdf screenshot" @click="() => {
                  imagePreviewUrl = url
                  imagePreviewDialogVisible = true
                }
                  "/>
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
                <img style="width: 20px" src="./assets/download.svg" alt="download button"/>&nbsp;下載
              </el-button>
              <div>
                <Codemirror ref="myCm" v-model:value="ymlCode" :options="cmOptions" :height="tabContentHeight"
                            @change="onCodeChange"/>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Schema JSON" name="schemaDefJson">
              <el-button class="tab-button" type="primary" @click="downloadGeneratedJSON">
                <img style="width: 20px" src="./assets/download.svg" alt="download button"/>&nbsp;下載
              </el-button>
              <div name="tabContent" class="overflow-auto">
                <pre @click="selectText($event.target)">{{ surveyJson }}</pre>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Form Data" name="formData">
              <div name="tabContent" class="overflow-auto">
                <pre @click="selectText($event.target)">{{ formData }}</pre>
                <h3 v-show="!formData || Object.keys(formData).length === 0">提交表單後答案將呈現於此處</h3>
              </div>
            </el-tab-pane>
            <el-tab-pane label="Settings" name="settings">
              <div name="tabContent" class="overflow-auto">
                <p>
                  &nbsp;&nbsp;LLM Model: <br>
                  <span style="display: flex; justify-content: center">
                    <el-tag type="success">{{ useModel }}</el-tag>
                  </span>
                </p>
                <p>
                  &nbsp;&nbsp;Use AI Model:<br/>
                  <span style="display: flex; justify-content: center">
                    <el-switch v-model="isMock" active-text="Mocked" inactive-text="Real"/>
                  </span>
                </p>
                <p>
                  &nbsp;&nbsp;OpenAI Image Detail:<br/>
                  <span style="display: flex; justify-content: center">
                    <el-switch v-model="isDetailHigh" active-text="High" inactive-text="Low"/>
                  </span>
                </p>
                <Transition>
                  <p v-show="frontendOnly && !isMock">
                    &nbsp;&nbsp;OpenAI API Key (for Frontend Only Mode):<br/>
                    <span style="display: flex; justify-content: center">
                      <span style="
                          display: flex;
                          flex-direction: column;
                          justify-content: center;
                          width: 90%;
                          margin-top: 5px;
                        ">
                        <el-input id="apiKey" type="password" v-model="OpenAPIKey"
                                  placeholder="OpenAI API Key: sk-....."/>
                        <small style="color: rgba(0, 0, 0, 0.7); margin-top: 2px">
                          Your key <i>MUST</i> have access to
                          <a href="https://openai.com/index/gpt-4-1/" target="_blank">GPT-4.1</a> in order to work.
                        </small>
                        <small style="color: rgba(200, 0, 0, 0.7); margin-top: 2px">
                          Entering credentials on the frontend may expose them to threat actors. For
                          security, users is recommended to
                          <a href="https://platform.openai.com/api-keys" target="_blank">revoked</a>
                          the key after potential exposure.
                          <br>
                          The API key will be stored in LocalStorage. If you're using a public or shared computer, make sure to clear the input above and delete the key from LocalStorage before leaving.
                        </small>
                      </span>
                    </span>
                  </p>
                </Transition>
                <Transition>
                  <p v-show="frontendOnly && !isMock">
                    &nbsp;&nbsp;Max PDF Pages:<br/>
                    <span style="display: flex; justify-content: center">
                      <el-input-number v-model="frontendOnlyMaxPDFPages" :min="1" :max="10"/>
                    </span>
                  </p>
                </Transition>
                <p>
                  &nbsp;&nbsp;Version Information:<br/>
                  <span style="display: flex; justify-content: space-evenly">
                    <el-tag class="ml-2" type="success">Frontend: {{ frontendVersion }}</el-tag>
                    <el-tag v-show="!frontendOnly" class="ml-2" type="success">Backend: {{ backendVersion }}</el-tag>
                  </span>
                </p>
                <p>
                  &nbsp;&nbsp;Source Code on Github:<br/>
                  <span style="display: flex; justify-content: center">
                    <a target="_blank" href="https://github.com/nathanfhh/Digital-Form-with-GPT4-Vision-API">
                      <img style="margin-top: 2px; width: 40px" src="./assets/github-mark.svg" alt="github button"/>
                    </a>
                  </span>
                </p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-col>
      </el-row>
    </el-col>
    <el-col class="border" :span="24 - leftColSpan" style="overflow-y: auto; height: calc(100vh - 6px)">
      <SurveyComponent :model="surveyModel" :key="reloadKey"/>
    </el-col>
  </el-row>
  <el-dialog v-model="imagePreviewDialogVisible" title="PDF Image Preview" style="z-index: 10000" :width="'93vw'">
    <div style="display: flex; justify-content: center">
      <img :src="imagePreviewUrl" alt="image preview" style="max-width: 90vw"/>
    </div>
  </el-dialog>
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

.el-carousel__item {
  display: flex;
  align-items: center;
  overflow: visible;
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

.upload {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.scan {
  width: 75%;
  height: 10px;
  background-color: rgba(238, 72, 72, 0.8);
  position: absolute;
  left: 12.5%;
  z-index: 1000;
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
