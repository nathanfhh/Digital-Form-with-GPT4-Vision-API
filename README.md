# PDF to Digital Form using GPT4 Vision API

A POC that uses GPT 4 Vision API to generate a digital form from an Image using JSON Forms from `https://jsonforms.io/`

Inspired by:

1. https://github.com/abi/screenshot-to-code
2. https://github.com/SawyerHood/draw-a-ui

Both repositories demonstrate that the GPT4 Vision API can be used to generate a UI from an image and can recognize the
patterns and structure of the layout provided in the image.

## Demo

[![Watch the Demo Video](https://img.youtube.com/vi/HN_RxSpQXDg/maxresdefault.jpg)](https://youtu.be/HN_RxSpQXDg)

## Frontend

1. `cd` into frontend directory

```sh
cd ai-json-form
```

2. Install Packages and run

```sh
npm install
npm run dev
```

## Backend

1. `cd` into directory

```sh
cd backend
```

2. Install Packages

```sh
poetry install
```

3. Setup Environment Variables

```sh
export OPENAI_API_KEY=
# optional
export OPENAI_ORG=
```

> If you plan to use the Mock response only, you should set OPENAI_API_KEY to any value.

4. Run

```sh
python main.py
```

## Disclaimer

I am new to Vue, so the code might not be the best practice. I am still learning and improving. Should you have any
suggestions, please feel free to PR.

## Flow Explain

1. Upload a SINGLE page PDF from the frontend
2. When the backend receives the PDF file in Base64 string format, it does the following processes:

- Convert the URL String Back to Bytes
- Read the PDF file, convert it to a JPG image, and save it to the /tmp folder using the package `pdf2image`.
- Extract the strings from the same PDF file using the package `PyPDF2`. The extracted strings will become part of the
  prompt sent to the GPT4 model to enhance accuracy.
- Prepare the prompts and send them along with the PDF screenshot to the GPT4 Vision API
- Send the chunk to the frontend via Socket.IO incrementally.

3. Whenever the frontend receives the chunk, it appends it to the `codemirror` editor, and checks if the
   current content is a valid YAML. If it's a valid YAML, it will apply it to the JSON Scheme to force the UI to
   re-render.
