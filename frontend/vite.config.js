import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  test: {
    globals: true,
    environment: 'jsdom', // Simula um ambiente de navegador
    setupFiles: './src/setupTests.js', // Arquivo de setup para os testes de React
  },
})
