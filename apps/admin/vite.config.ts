import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5175 },
  optimizeDeps: {
    exclude: [
      '@ebringgs/api',
      '@ebringgs/auth',
      '@ebringgs/styles',
      '@ebringgs/types',
      '@ebringgs/ui',
    ],
  },
});
