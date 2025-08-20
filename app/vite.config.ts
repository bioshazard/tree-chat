import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Use relative base so assets resolve correctly on GitHub Pages subpaths
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      '5173.lab1.bios.dev',
    ],
  },
})
