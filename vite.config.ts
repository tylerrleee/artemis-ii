import { defineConfig } from 'vite';

export default defineConfig({
  root: 'test',
  server: {
    port: 5173,
  },
  build: {
    outDir: '../dist',
  },
});
