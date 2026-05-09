import { defineConfig } from 'vite';

export default defineConfig({
  // Set base to './' for GitHub Pages compatibility (relative asset paths)
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
