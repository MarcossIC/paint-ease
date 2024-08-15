import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'public',
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssMinify: 'esbuild',
  },
});
