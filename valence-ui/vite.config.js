import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- Add this import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- Add this to your plugins array
  ],
  server: {
    host: '0.0.0.0', // This tells the server to listen on all network interfaces
    port: 5173       // Or whichever port you are using
  }
})