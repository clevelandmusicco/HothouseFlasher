import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
  },
  // Set base to './' for GitHub Pages compatibility (relative asset paths)
  // base: './',
  base: '/HothouseFlasher/',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
