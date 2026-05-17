import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/game4/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/game4/health': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/game4/, '')
      },
      '/game4/ws': {
        target: 'ws://127.0.0.1:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/game4/, ''),
        ws: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/three/')) return 'three';
          if (
            id.includes('@react-three/fiber') ||
            id.includes('react-reconciler') ||
            id.includes('its-fine') ||
            id.includes('react-use-measure')
          ) {
            return 'r3f';
          }
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react';
          }

          return undefined;
        }
      }
    }
  }
});
