import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: apiTarget
        ? {
            '/test': apiTarget,
            '/auth': apiTarget,
            '/api': apiTarget,
            '/chat': apiTarget,
            '/generate-ideas': apiTarget,
            '/generate-roadmap': apiTarget,
          }
        : undefined,
    },
  };
});
