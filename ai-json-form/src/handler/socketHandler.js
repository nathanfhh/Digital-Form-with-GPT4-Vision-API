import {ElNotification} from 'element-plus'
import {io} from 'socket.io-client'

import {BaseHandler} from './base.js'
import {llmModelConfigs} from "./frontend/openai.js";

export class SocketIOBackendHandler extends BaseHandler {
    constructor(args) {
        super({name: 'SocketIOBackendHandler', ...args})
        this.socketIO = io(`${import.meta.env.VITE_APP_BACKEND_URL}/openai`, {
            transports: ['websocket', 'polling']
        })
        this.socketIO.on('connect', () => {
            this.socketIO.emit('join', {})
        })
        this.socketIO.on('server_command', (data) => {
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
                    this.handle_ai_response(data.data)
                    break
                case 'ai_response_done':
                    this.handle_ai_response_done(data.data, data.usage)
                    break
                case 'pdf_screenshot':
                    this.handle_pdf_screenshot(data.data)
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
    }

    handle_pdf_file(pdfFile, isMock, isDetailHigh) {
        console.log(`${this.name}-handle_pdf_file`)
        ElNotification({
            title: '成功上傳PDF',
            message: '成功上傳PDF',
            type: 'success',
            duration: 2500
        })
        this.socketIO.emit('upload_pdf', {
            data: pdfFile,
            is_mock: isMock,
            is_detail_high: isDetailHigh,
            model_configs: {
                model_use: this.modelUse.value,
                is_reasoning: llmModelConfigs[this.modelUse.value].is_reasoning
            },
        })
    }
}
