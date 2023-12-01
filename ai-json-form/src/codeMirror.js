import 'codemirror/addon/lint/lint.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/yaml/yaml.js'
import 'codemirror/addon/lint/lint'
import 'codemirror/addon/lint/yaml-lint'
import 'codemirror/theme/dracula.css'

// 括號/標籤 匹配
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/matchtags'
// 括號/標籤 自動關閉
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/closetag'
// 程式碼摺疊
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/comment-fold'
// 縮排檔案
import 'codemirror/addon/fold/indent-fold'
// 游標行背景高亮
import 'codemirror/addon/selection/active-line'

// Search
import 'codemirror/addon/scroll/annotatescrollbar.js'
import 'codemirror/addon/search/matchesonscrollbar.js'
import 'codemirror/addon/search/match-highlighter.js'
import 'codemirror/addon/search/jump-to-line.js'
import 'codemirror/addon/dialog/dialog.js'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor.js'
import 'codemirror/addon/search/search.js'

export const codeMirrorConfig = {
  tabSize: 4,
  mode: 'text/yaml',
  theme: 'dracula',
  keepCursorInEnd: true,
  styleActiveLine: true,
  lineWrapping: true,
  lineNumbers: true,
  autofocus: true,
  autocorrect: true,
  matchBrackets: true,
  autoCloseBrackets: true,
  foldGutter: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
  lint: true
}
