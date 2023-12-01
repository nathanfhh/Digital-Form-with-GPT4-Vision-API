export const basicSchema = {
  title: '測試用表單',
  description: 'A simple form example.',
  type: 'object',
  required: ['firstName', 'lastName'],
  'ui:order': ['lastName', 'firstName', '*', 'password'],
  properties: {
    firstName: {
      type: 'string',
      title: 'First name',
      default: 'Jun'
    },
    lastName: {
      type: 'string',
      title: 'Last name',
      'ui:options': {
        description: '請輸入您的姓氏'
      },
      'err:required': '必須輸入姓氏'
    },
    price: {
      type: 'string',
      description: '最多輸入兩位小數，最大值 999999.99',
      title: '價格',
      format: 'price'
    },
    age: {
      type: 'integer',
      title: '年紀',
      maximum: 80,
      minimum: 16
    },
    bio: {
      type: 'string',
      title: '自我介紹',
      minLength: 10
    },
    password: {
      type: 'string',
      title: 'Password',
      minLength: 3
    },
    telephone: {
      type: 'string',
      title: 'Telephone',
      minLength: 10
    }
  }
}
