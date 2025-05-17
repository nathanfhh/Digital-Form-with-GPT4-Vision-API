import {ElNotification} from 'element-plus'

import {extractPDF} from './pdf.js'
import {generatePrompt} from './prompt.js'
import {inference} from './openai.js'
import {BaseHandler} from '../base.js'

export class FrontendOnlyHandler extends BaseHandler {
    constructor(apiKey, parameters) {
        let frontendOnlyMaxPDFPages = parameters.frontendOnlyMaxPDFPages
        super({name: 'FrontendOnlyHandler', ...parameters})
        delete parameters.frontendOnlyMaxPDFPages
        this.frontendOnlyMaxPDFPages = frontendOnlyMaxPDFPages
        this.apiKey = apiKey
    }

    check_api_key() {
        if (!this.isMock.value && !this.apiKey.value) {
            ElNotification({
                title: '請輸入 OpenAI API Key',
                message: '請輸入 OpenAI API Key',
                type: 'error',
                duration: 5000
            })
            document.querySelector('#apiKey').focus()
            this.tabActiveName.value = 'settings'
            return false
        }
        return true
    }

    handle_pdf_file(pdfFile) {
        console.log(`${this.name}-handle_pdf_file`)
        if (!this.check_api_key()) return
        extractPDF({data: atob(pdfFile.split(',')[1])}, this).then(
            (pdfData) => {
                ElNotification({
                    title: 'PDF 解析完成',
                    message: `成功解析${pdfData.images.length}頁PDF`,
                    type: 'success',
                    duration: 3000
                })
                this.inferencing.value = true
                let {fullText, images} = pdfData
                this.pdfImageDataList.value = images
                let promptContent = generatePrompt(images.length, this.isDetailHigh.value, images, fullText)
                console.dir(promptContent)
                inference(promptContent, this).then(
                    ({fullResponse, usage}) => {
                        this.handle_ai_response_done(fullResponse, usage)
                    },
                    (reason) => {
                        ElNotification({
                            title: 'AI 處理失敗',
                            message: 'AI 處理失敗' + reason,
                            type: 'error',
                            duration: 8000
                        })
                        console.error(reason)
                        this.inferencing.value = false
                    }
                )
            },
            (reason) => {
                ElNotification({
                    title: 'PDF 處理失敗',
                    message: 'PDF 處理失敗' + reason,
                    type: 'error',
                    duration: 5000
                })
                this.inferencing.value = false
            }
        )
    }
}
