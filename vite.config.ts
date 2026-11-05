import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isUserOrOrgSite = repository?.endsWith('.github.io') ?? false
const base = repository && !isUserOrOrgSite ? `/${repository}/` : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
})
