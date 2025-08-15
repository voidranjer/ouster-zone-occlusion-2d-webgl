import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Set the base URL from an environment variable
  base: process.env.VITE_BASE_URL || '/',

  plugins: [
    tailwindcss(),
  ],
})
