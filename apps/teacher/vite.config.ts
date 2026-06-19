import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Each app gets its own dev port so all three can run side-by-side via
// `pnpm dev`. Production builds the same way; subdomain mapping happens at
// the Vercel/Cloudflare layer, not here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  // Workspace packages export raw .ts/.tsx through pnpm symlinks. Tell Vite
  // not to pre-bundle them so HMR hot-reloads source edits in real time.
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
});
