import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: 'esbuild',
  },
});
