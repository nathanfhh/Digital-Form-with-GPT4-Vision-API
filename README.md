# PDF to Digital Form using GPT4 Vision API

A POC for GPT4 Vision APT to generate digital form from an Image using JSONForms from `https://jsonforms.io/`

Inspired by:
1. https://github.com/abi/screenshot-to-code
2. https://github.com/SawyerHood/draw-a-ui

## Frontend
1. `cd` into directory
```sh
cd frontend
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
4. Run
```sh
python main.py
```

## Flow Explain
1. Upload a SINGLE page PDF from the frontend
2. When the backend received the PDF file in Base64 string format, it does the following processes:
  1. Convert the URL String Back to Bytes
  2. Read the PDF file and convert it to a JPG image and save it to the /tmp folder using package `pdf2image`.
  3. Extract the strings from the same PDF file using package `PyPDF2`. The extracted strings will become part of the prompt sent to GPT4 model to enhance accuracy.
  4. Prepare the prompts and send it along with the PDF screenshot to the GPT4 Vision API
  5. Send the chunk to the frontend via socketIO incrementally.
3. Every time when the frontend receives the chunk, it append the chunk to the `codemirror` editor, and check if the current content is a valid YAML. If it's a valid YAML, it will apply it to the JSON Scheme to force the UI to rerender.