import { ElNotification } from 'element-plus'
import { extractPDF } from './pdf.js'

class BaseHandler {
  constructor(parameters) {
    console.log(parameters)
    let { name, inferencing, carouselPlay, ymlCode, schemaVersion, pdfImageDataList } = parameters
    this.name = name || 'BaseHandler'
    this.inferencing = inferencing
    this.carouselPlay = carouselPlay
    this.ymlCode = ymlCode
    this.schemaVersion = schemaVersion
    this.pdfImageDataList = pdfImageDataList
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
    this.carouselPlay.value = false
    if (fullYamlCode === null) return
    ElNotification({
      title: 'AI 處理完成',
      message: 'AI 處理完成',
      type: 'success',
      duration: 2000
    })
    this.ymlCode.value = ''
    this.ymlCode.value = fullYamlCode
    this.schemaVersion.value += 1
  }
  handle_pdf_screenshot(pdfImageUrl) {
    console.log(`${this.name}-handler_pdf_screenshot`)
    this.inferencing.value = true
    this.pdfImageDataList.value = pdfImageUrl
    this.carouselPlay.value = true
  }
  handle_pdf_file(pdfFile, isMock, isDetailHigh) {
    throw new Error('Not implemented')
  }
}
export class SocketIOBackendHandler extends BaseHandler {
  constructor(socketIO, args) {
    super({ name: 'SocketIOBackendHandler', ...args })
    this.socketIO = socketIO
  }
  handle_pdf_file(pdfFile, isMock, isDetailHigh) {
    console.log(`${this.name}-handle_pdf_file`)
    this.socketIO.emit('upload_pdf', {
      data: pdfFile,
      is_mock: isMock,
      is_detail_high: isDetailHigh
    })
  }
}
export class FrontendOnlyHandler extends BaseHandler {
  constructor(parameters) {
    super({ name: 'FrontendOnlyHandler', ...parameters })
  }
  handle_pdf_file(pdfFile) {
    console.log(`${this.name}-handle_pdf_file`)
    extractPDF({'data': atob(pdfFile.split(',')[1])}).then(
      function (pdfData) {
        console.log('PDF Result: ');
        console.dir(pdfData)
        ElNotification({
          title: 'PDF 解析完成',
          message: `成功解析${pdfData.images.length}頁PDF`,
          type: 'success',
          duration: 3000
        })
      },
      function (reason) {
        ElNotification({
          title: 'PDF 處理失敗',
          message: 'PDF 處理失敗',
          type: 'error',
          duration: 5000
        })
      },
    );
  }
}
