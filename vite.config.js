import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createServer } from './backend/server.js'

function expressPlugin() {
  return {
    name: 'express-plugin',
    async configureServer(viteDevServer) {
      const app = await createServer()
      viteDevServer.middlewares.use(app)
    },
  }
}

export default defineConfig({
  plugins: [react(), expressPlugin()],
})
