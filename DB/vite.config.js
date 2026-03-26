import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(),tailwindcss(),],
// })
// const env = loadEnv(mode, process.cwd())
// api=import.meta.env.VITE_API_URL
export default defineConfig({
  plugins: [react(), tailwindcss()],
})