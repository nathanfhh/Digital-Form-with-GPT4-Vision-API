import OpenAI from 'openai'

const mockedResponse = `# This is a sample schema for mock response.
---
title: 測試用表單
pages:
- name: page1
  elements:
  - type: text
    name: firstName
    title: First name
    isRequired: true
  - type: text
    name: lastName
    title: Last name
    description: 請輸入您的姓氏
    isRequired: true
  - type: text
    name: price
    title: 價格
    inputType: number
  - type: text
    name: age
    title: 年紀
    inputType: number
    min: 16
    max: 80
  - type: comment
    name: bio
    title: 自我介紹
  - type: text
    name: password
    title: Password
    inputType: password
  - type: text
    name: telephone
    title: Telephone
    inputType: tel
`
export const llmModelConfigs = {
    "gpt-4.1": {
        price: {
            completion_tokens: 8 / 1e6,
            prompt_tokens: 2 / 1e6
        },
        is_reasoning: false
    },
    "o4-mini": {
        price: {
            completion_tokens: 4.4 / 1e6,
            prompt_tokens: 1.1 / 1e6
        },
        is_reasoning: true
    },
    "gpt-4o": {
        price: {
            completion_tokens: 10 / 1e6,
            prompt_tokens: 2.5 / 1e6
        },
        is_reasoning: false
    },
}
export const defaultModelUse = Object.keys(llmModelConfigs)[0]

export function calculatePrice(handlerObj, usage) {
    if (!usage) return null
    console.log("In calculatePrice", usage)
    const currentModel = llmModelConfigs[handlerObj.modelUse.value]
    const price = (
        usage.completion_tokens * currentModel.price.completion_tokens +
        usage.prompt_tokens * currentModel.price.prompt_tokens
    ).toFixed(6);
    console.log("Price", price)
    return price
}


export async function inference(prompts, handlerObj) {
    handlerObj.tabActiveName.value = 'schemaDefYaml'
    if (handlerObj.isMock.value) {
        let chunk = mockedResponse.split('\n')
        await Promise.all(
            chunk.map(async (line, index) => {
                const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
                await delay(index * 75)
                handlerObj.handle_ai_response(line + '\n')
            })
        )
        return mockedResponse
    }
    const openai = new OpenAI({
        apiKey: handlerObj.apiKey.value.trim(),
        dangerouslyAllowBrowser: true
    })
    const params = {
        model: handlerObj.modelUse.value,
        messages: prompts,
        stream: true,
        max_tokens: 8192,
        temperature: 0,
        stream_options: {
            include_usage: true
        }
    }
    const modelConfig = llmModelConfigs[handlerObj.modelUse.value]
    if (modelConfig.is_reasoning) {
        ["max_tokens", "temperature"].forEach((key) => {
            delete params[key]
        })
    }
    const stream = await openai.chat.completions.create(params)
    let fullResponse = ''
    let buffer = ''
    let usage = null;
    for await (const chunk of stream) {
        let content = chunk.choices[0]?.delta?.content || ''
        fullResponse += content
        buffer += content
        if (buffer && buffer.endsWith('\n')) {
            handlerObj.handle_ai_response(buffer)
            buffer = ''
        }
        usage = chunk.usage;
    }

    return {
        fullResponse,
        usage
    }
}
