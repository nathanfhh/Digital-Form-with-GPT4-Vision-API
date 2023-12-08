import * as pdfjs from 'pdfjs-dist/build/pdf.mjs'
pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.269/pdf.worker.mjs'
import { ElNotification } from 'element-plus'

const renderPage = (page) =>
  new Promise((resolve) => {
    const viewport = page.getViewport({ scale: 1 })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const renderContext = { canvasContext: ctx, viewport: viewport }

    canvas.height = viewport.height
    canvas.width = viewport.width

    page.render(renderContext).promise.then(() => {
      resolve(canvas.toDataURL('image/jpeg')) // Resolve the promise with the result
    })
  })

export function extractPDF(pdfUrl, handlerObj) {
  var pdf = pdfjs.getDocument(pdfUrl)
  var maxPages = handlerObj.frontendOnlyMaxPDFPages.value
  console.log(`maxPages=${maxPages}`)
  return pdf.promise.then(function (pdf) {
    var totalPageCount = pdf.numPages
    var countPromises = []
    if (totalPageCount > maxPages) {
      ElNotification({
        title: '錯誤',
        message: `PDF 頁數過多(您的檔案有${totalPageCount}頁，目前設定至多${maxPages}頁)`,
        type: 'error',
        duration: 2000
      })
      return null
    }
    for (var currentPage = 1; currentPage <= totalPageCount; currentPage++) {
      var page = pdf.getPage(currentPage)
      countPromises.push(
        page.then(async function (page) {
          var image = await renderPage(page)
          var textContent = page.getTextContent()
          return textContent.then(function (text) {
            return {
              txt: text.items
                .map(function (s) {
                  return s.str
                })
                .join(''),
              image: image
            }
          })
        })
      )
    }
    return Promise.all(countPromises).then((pdfResults) => {
      console.log(pdfResults)
      var fullText = []
      var images = []
      for (let i in pdfResults) {
        fullText.push(pdfResults[i].txt)
        images.push(pdfResults[i].image)
      }
      return {
        fullText: fullText.join('\n---***---\n'),
        images: images
      }
    })
  })
}
