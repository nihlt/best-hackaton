import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { installAssistantApi } from './server/assistantApi'

// https://vite.dev/config/
const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(frontendDir, '..', '..', '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, '')

  return {
    plugins: [
      react(),
      {
        name: 'assistant-api',
        configureServer(server) {
          installAssistantApi(server, env)
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  }
})
