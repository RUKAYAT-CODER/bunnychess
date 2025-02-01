import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        ...['stockfish.js', 'stockfish.wasm', 'stockfish.wasm.js'].map((fileName) => ({
          src: `node_modules/stockfish.js/${fileName}`,
          dest: ''
        }))
      ]
    })
  ],
  // Proxy /api and /socket.io requests to the backend
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        ws: true
      },
      '/socket.io': {
        target: 'ws://127.0.0.1:3000/socket.io',
        changeOrigin: true,
        secure: true,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
