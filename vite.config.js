import { defineConfig } from 'vite'

// Simple Vite config for vanilla HTML/CSS/JS
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})