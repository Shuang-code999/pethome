import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    proxy: {
      // 前端 /api 转发到后端 Spring Boot (8088，避开被 nginx 占用的 8080)
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true
      }
    }
  }
})
