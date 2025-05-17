import {ElNotification} from 'element-plus'
import {calculatePrice} from "./frontend/openai.js";

export class BaseHandler {
    constructor(parameters) {
        console.log(parameters)
        let {
            name,
            inferencing,
            ymlCode,
            pdfImageDataList,
            isDetailHigh,
            isMock,
            tabActiveName
        } = parameters
        this.name = name || 'BaseHandler'
        this.inferencing = inferencing
        this.ymlCode = ymlCode
        this.pdfImageDataList = pdfImageDataList
        this.isDetailHigh = isDetailHigh
        this.isMock = isMock
        this.tabActiveName = tabActiveName
    }

    handle_ai_response(yamlCodeChunk) {
        console.log(`${this.name}-handle_ai_response`)
        this.inferencing.value = true
        this.ymlCode.value += yamlCodeChunk
    }

    handle_ai_response_done(fullYamlCode, usage) {
        console.log(`${this.name}-handle_ai_response_done`)
        this.inferencing.value = false
        if (!fullYamlCode) return
        const totalPrice = calculatePrice(usage)
        ElNotification({
            title: 'AI 處理完成',
            message: 'AI 處理完成',
            type: 'success',
            duration: 15000
        })
        if (totalPrice) {
            ElNotification({
                title: '花費金額',
                message: totalPrice,
                type: 'success',
                duration: 5000
            })
        }
        console.log("fullYamlCode", fullYamlCode)
        this.ymlCode.value = fullYamlCode
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
