import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Дев-сервер проксирует API на Django: фронт и бэк для браузера остаются
// одним origin, поэтому не нужны ни CORS, ни настройка CSRF_TRUSTED_ORIGINS,
// а сессионная кука ставится как обычная same-origin.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Host не подменяем (changeOrigin по умолчанию false): Django сверяет
      // заголовок Origin с хостом запроса, и при подмене на 127.0.0.1:8000
      // POST-запросы отваливались бы с «Origin checking failed».
      proxy: {
        '/api': { target: backend },
        // Логин/логаут браузерного интерфейса DRF (доступен при DEBUG=True).
        '/api-auth': { target: backend },
        '/admin': { target: backend },
        '/static': { target: backend },
      },
    },
  }
})
