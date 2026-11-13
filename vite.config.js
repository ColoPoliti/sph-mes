import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy hacia la API PHP de lotes.
// Evita el bloqueo CORS del navegador en desarrollo (la API no envía CORS).
// En producción se puede sobrescribir con VITE_API_BASE.
const apiProxy = {
  '/api': {
    target: 'http://10.200.1.243:8080',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // "@/..." apunta a src/ (ver también jsconfig.json para el editor)
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
})
