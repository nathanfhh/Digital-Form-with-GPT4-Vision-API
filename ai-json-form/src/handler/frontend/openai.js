import OpenAI from 'openai'
const mockedResponse = `# This is a sample schema for mock response.
title: 勞工特殊體格及健康檢查紀錄
type: object
required:
  - name
  - gender
  - idNumber
  - birthDate
  - employmentDate
  - checkDate
  - companyName
  - companyAddress
  - pastExperience
  - currentJob
  - dailyWorkingHours
  - checkPeriod
  - chronicDiseases
  - smokingHabit
  - betelNutChewingHabit
  - drinkingHabit
  - symptoms
properties:
  name:
    type: string
    title: 姓名
  gender:
    type: string
    title: 性別
    oneOf:
      - const: 男
        title: 男
      - const: 女
        title: 女
  idNumber:
    type: string
    title: 身分證字號 (護照號碼)
  birthDate:
    type: string
    title: 出生日期
    pattern: "\\\\d{3}年\\\\d{1,2}月\\\\d{1,2}日"
  employmentDate:
    type: string
    title: 受僱日期
    pattern: "\\\\d{3}年\\\\d{1,2}月\\\\d{1,2}日"
  checkDate:
    type: string
    title: 檢查日期
    pattern: "\\\\d{3}年\\\\d{1,2}月\\\\d{1,2}日"
  companyName:
    type: string
    title: 事業單位名稱 (廠別)
  companyAddress:
    type: string
    title: 地址
  pastExperience:
    type: object
    title: 曾經從事
    properties:
      job:
        type: string
        title: 工作
      startDate:
        type: string
        title: 起始日期
        pattern: "\\\\d{3}年\\\\d{1,2}月"
      endDate:
        type: string
        title: 截止日期
        pattern: "\\\\d{3}年\\\\d{1,2}月"
      duration:
        type: string
        title: 共計
        pattern: "\\\\d{1,2}年\\\\d{1,2}月"
  currentJob:
    type: object
    title: 目前從事
    properties:
      job:
        type: string
        title: 工作
      startDate:
        type: string
        title: 起始日期
        pattern: "\\\\d{3}年\\\\d{1,2}月"
      endDate:
        type: string
        title: 截至
        pattern: "\\\\d{3}年\\\\d{1,2}月"
      duration:
        type: string
        title: 共計
        pattern: "\\\\d{1,2}年\\\\d{1,2}月"
  dailyWorkingHours:
    type: string
    title: 從事黃磷作業平均每日工時
  checkPeriod:
    type: string
    title: 檢查時期（原因）
    oneOf:
      - const: 新進員工（受僱時）
        title: 新進員工（受僱時）
      - const: 變更作業
        title: 變更作業
      - const: 定期檢查
        title: 定期檢查
      - const: 健康追蹤檢查
        title: 健康追蹤檢查
  chronicDiseases:
    type: object
    title: 既往病史
    properties:
      respiratorySystem:
        type: array
        title: 呼吸系統
        items:
          type: string
          enum:
            - 慢性氣管炎、肺氣腫
            - 肺炎
            - 無
      liverDisease:
        type: array
        title: 肝臟疾病
        items:
          type: string
          enum:
            - B型肝炎
            - C型肝炎
            - 脂肪肝
            - 酒精性肝炎
            - 藥物性肝炎
            - 無
      skinSystem:
        type: array
        title: 皮膚系統
        items:
          type: string
          enum:
            - 刺激性皮膚炎
            - 過敏性皮膚炎
            - 化學性灼傷
            - 無
      otherDiseases:
        type: array
        title: 其他
        items:
          type: string
          enum:
            - 疲倦、倦怠
            - 貧血
            - 眼睛疾病
            - 腎臟疾病
            - 無
  smokingHabit:
    type: object
    title: 生活習慣 - 吸菸
    properties:
      neverSmoked:
        type: boolean
        title: 從未吸菸
      occasionallySmokes:
        type: boolean
        title: 偶爾吸(不是天天)
      smokesDaily:
        type: object
        title: (幾乎)每天吸
        properties:
          averagePerDay:
            type: integer
            title: 平均每天吸
          yearsSmoked:
            type: integer
            title: 已吸菸
      quitSmoking:
        type: object
        title: 已經戒菸
        properties:
          yearsQuit:
            type: integer
            title: 戒了
          monthsQuit:
            type: integer
            title: 個月
  betelNutChewingHabit:
    type: object
    title: 生活習慣 - 嚼食檳榔
    properties:
      neverChewed:
        type: boolean
        title: 從未嚼食檳榔
      occasionallyChews:
        type: boolean
        title: 偶爾嚼(不是天天)
      chewsDaily:
        type: object
        title: (幾乎)每天嚼
        properties:
          averagePerDay:
            type: integer
            title: 平均每天嚼
          yearsChewed:
            type: integer
            title: 已嚼
      quitChewing:
        type: object
        title: 已經戒食
        properties:
          yearsQuit:
            type: integer
            title: 戒了
          monthsQuit:
            type: integer
            title: 個月
  drinkingHabit:
    type: object
    title: 生活習慣 - 喝酒
    properties:
      neverDrank:
        type: boolean
        title: 從未喝酒
      occasionallyDrinks:
        type: boolean
        title: 偶爾喝(不是天天)
      drinksDaily:
        type: object
        title: （幾乎）每天喝
        properties:
          averagePerWeek:
            type: integer
            title: 平均每週喝
          favoriteDrink:
            type: string
            title: 最常喝
          amountPerOccasion:
            type: integer
            title: 每次
      quitDrinking:
        type: object
        title: 已經戒酒
        properties:
          yearsQuit:
            type: integer
            title: 戒了
          monthsQuit:
            type: integer
            title: 個月
  symptoms:
    type: object
    title: 自覺症狀
    properties:
      cardiovascular:
        type: array
        title: 心臟血管
        items:
          type: string
          enum:
            - 心悸
            - 頭暈
            - 頭痛
      respiratorySystem:
        type: array
        title: 呼吸系統
        items:
          type: string
          enum:
            - 咳嗽
            - 咳痰
            - 呼吸困難
            - 胸痛
      urinarySystem:
        type: array
        title: 泌尿系統
        items:
          type: string
          enum:
            - 排尿不適
            - 多尿、頻尿
      digestiveSystem:
        type: array
        title: 消化系統
        items:
          type: string
          enum:
            - 噁心
            - 腹痛
            - 便秘
            - 腹瀉
            - 血便
            - 食慾不振
      skinSystem:
        type: array
        title: 皮膚系統
        items:
          type: string
          enum:
            - 暴露部位皮膚紅腫、水泡、乾燥、刺痛、脫皮、潰瘍
            - 傷口癒合慢
      otherSymptoms:
        type: array
        title: 其他
        items:
          type: string
          enum:
            - 牙痛
            - 下顎痛
            - 無
      noSymptoms:
        type: boolean
        title: 以上皆無
# This is a sample schema for mock response.`

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
  const stream = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: prompts,
    stream: true,
    max_tokens: 4096,
    temperature: 0
  })
  let fullResponse = ''
  let buffer = ''
  for await (const chunk of stream) {
    let content = chunk.choices[0]?.delta?.content || ''
    fullResponse += content
    buffer += content
    if (buffer && buffer.endsWith('\n')) {
      handlerObj.handle_ai_response(buffer)
      buffer = ''
    }
  }
  return fullResponse
}
