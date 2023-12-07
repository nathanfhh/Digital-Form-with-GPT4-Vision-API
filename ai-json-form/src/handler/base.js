import { ElNotification } from 'element-plus'

export class BaseHandler {
  constructor(parameters) {
    console.log(parameters)
    let {
      name,
      inferencing,
      ymlCode,
      schemaVersion,
      pdfImageDataList,
      isDetailHigh,
      isMock,
      tabActiveName
    } = parameters
    this.name = name || 'BaseHandler'
    this.inferencing = inferencing
    this.ymlCode = ymlCode
    this.schemaVersion = schemaVersion
    this.pdfImageDataList = pdfImageDataList
    this.isDetailHigh = isDetailHigh
    this.isMock = isMock
    this.tabActiveName = tabActiveName
  }
  handle_ai_response(yamlCodeChunk) {
    console.log(`${this.name}-handle_ai_response`)
    this.inferencing.value = true
    this.ymlCode.value += yamlCodeChunk
    try {
      document.querySelector('.el-form').scrollIntoView({
        block: 'end',
        behavior: 'instant'
      })
    } catch (e) {}
  }
  handle_ai_response_done(fullYamlCode) {
    console.log(`${this.name}-handle_ai_response_done`)
    this.inferencing.value = false
    if (fullYamlCode === null) return
    ElNotification({
      title: 'AI 處理完成',
      message: 'AI 處理完成',
      type: 'success',
      duration: 15000
    })
    this.ymlCode.value = ''
    this.ymlCode.value = fullYamlCode
    this.schemaVersion.value += 1
  }
  handle_pdf_screenshot(pdfImageUrl) {
    console.log(`${this.name}-handler_pdf_screenshot`)
    this.inferencing.value = true
    this.pdfImageDataList.value = pdfImageUrl
  }
  handle_pdf_file(pdfFile, isMock, isDetailHigh) {
    throw new Error('Not implemented')
  }
}
