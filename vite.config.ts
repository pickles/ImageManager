import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { setupImageApiMiddleware } from './server/middleware/imageApi'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 画像ディレクトリAPI用のカスタムプラグイン
    {
      name: 'image-directory-api',
      configureServer(server) {
        setupImageApiMiddleware(server);
      }
    }
  ],
  server: {
    host: true, // ローカルネットワークからのアクセスを許可
    port: 5173, // ポート番号を明示的に指定
    https: false, // HTTPに戻す（APIアクセスのため）
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})