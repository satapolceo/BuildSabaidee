import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/BuildSabaidee/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        workerMobileDebug: resolve(__dirname, 'worker-mobile-debug.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setupTests.js',
    globals: true,
    css: true,
  },
})
