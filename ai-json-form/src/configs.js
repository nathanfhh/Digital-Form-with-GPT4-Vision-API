export const basicSchema = {
    "title": "測試用表單",
    "pages": [
        {
            "name": "page1",
            "elements": [
                {
                    "type": "text",
                    "name": "firstName",
                    "title": "First name",
                    "isRequired": true
                },
                {
                    "type": "text",
                    "name": "lastName",
                    "title": "Last name",
                    "description": "請輸入您的姓氏",
                    "isRequired": true
                },
                {
                    "type": "text",
                    "name": "price",
                    "title": "價格",
                    "inputType": "number"
                },
                {
                    "type": "text",
                    "name": "age",
                    "title": "年紀",
                    "inputType": "number",
                    "min": 16,
                    "max": 80
                },
                {
                    "type": "comment",
                    "name": "bio",
                    "title": "自我介紹"
                },
                {
                    "type": "text",
                    "name": "password",
                    "title": "Password",
                    "inputType": "password"
                },
                {
                    "type": "text",
                    "name": "telephone",
                    "title": "Telephone",
                    "inputType": "tel"
                }
            ]
        }
    ]
}
