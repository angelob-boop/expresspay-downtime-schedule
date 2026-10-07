import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// Absolute base: dist/ is uploaded to s3://<bucket>/maintenance/ so the page works
// whichever CloudFront wiring is chosen, even when served at an arbitrary URL.
export default defineConfig({
  base: '/maintenance/',
  plugins: [vue(), tailwindcss()],
})
