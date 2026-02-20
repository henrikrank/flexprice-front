import path from 'path';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig } from 'vite';

const meta = JSON.parse(fs.readFileSync('./public/meta.json', 'utf8'));

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(meta.versionId),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true, // or '0.0.0.0'
    port: 3000,
    allowedHosts: ['flexprice.henrikrank.ee'],
    cors: {
      // IMPORTANT: in production you usually don't want localhost here
      origin: ['https://flexprice.henrikrank.ee'],
      methods: ['GET', 'POST'],
    },
  },
});