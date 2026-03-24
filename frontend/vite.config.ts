import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ts-monorepo/common": path.resolve(__dirname, "../common/src/index.ts"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3001,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
})
