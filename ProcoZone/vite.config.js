import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Al ejecutar npm run dev se abre directamente la landpage
    open: '/',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
