import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: [
      '@ebringgs/api',
      '@ebringgs/auth',
      '@ebringgs/classroom',
      '@ebringgs/styles',
      '@ebringgs/types',
      '@ebringgs/ui',
    ],
  },
})
