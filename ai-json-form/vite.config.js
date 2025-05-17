import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from "rollup-plugin-visualizer";
import { splitVendorChunkPlugin } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_APP_BASE_URL + '/',
    plugins: [vue(), visualizer(), splitVendorChunkPlugin()],
    optimizeDeps: {
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      minify: "terser",
      sourcemap: false,
      target: "esnext",
      rollupOptions: {
        output: {
          manualChunks: {
            'element-plus': ["element-plus"],
            'pdfjs-dist': ["pdfjs-dist"],
            'codemirror': ["codemirror"],
            'openai': ["openai"],
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    resolve: {},
    server: {
      host: "0.0.0.0",
      port: "5173",
      proxy: {
        "/api": {
          target: env.VITE_APP_BACKEND_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  }
})
