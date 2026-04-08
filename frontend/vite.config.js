import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/test': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
      '/chat': 'http://localhost:5000',
      '/generate-ideas': 'http://localhost:5000',
      '/generate-roadmap': 'http://localhost:5000',
    },
  },
});
