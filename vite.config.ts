import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages uses the repository name as the base path.
// Cloudflare Pages and other root-domain hosts keep '/'.
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop() || 'portfolio_jordan'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GITHUB_PAGES === 'true' ? `/${repositoryName}/` : '/',
  server: { host: '0.0.0.0' },
})
