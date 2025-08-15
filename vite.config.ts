import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Set the base URL from an environment variable
  base: process.env.VITE_BASE_URL || '/',

  plugins: [
    tailwindcss(),
    react()
  ],
})
