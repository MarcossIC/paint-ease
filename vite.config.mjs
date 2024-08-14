import { defineConfig } from "vite";

export default defineConfig({
  publicDir: 'public',
  root: './',
  server: {
    open: "/index.html",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssMinify: "esbuild"
  },
});