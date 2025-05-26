import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['@rails/actioncable']
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/cable': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    },
  },
})
