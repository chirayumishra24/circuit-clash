import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Honour an assigned PORT so the dev server can coexist with the other
    // SkilliZee activities in this folder, which also default to 5173.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
})
