import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'entire-addressing-skiing-when.trycloudflare.com',
      '.trycloudflare.com'
    ],
    proxy: {
      '/api': {
        // During development, we'll use our API server on port 3001
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        // Keep the /api prefix when forwarding to the API server
        rewrite: (path) => path,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure that the build is optimized for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  }
});