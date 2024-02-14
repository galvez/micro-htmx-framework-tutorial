import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: join(dirname(fileURLToPath(import.meta.url)), 'client'),
  build: {
  	assetsInlineLimit: 1,
  },
  plugins: [
  	ensureClientOnlyScripts()
  ]
})

function ensureClientOnlyScripts () {
  let config
  return {
    name: 'vite-plugin-fastify-vite-htmx',
    configResolved (resolvedConfig) {
      // store the resolved config
      config = resolvedConfig
    },
    load (id, options) {
      if (options?.ssr && id.endsWith('.client.js')) {
        return {
          code: '',
          map: null,
        }
      }
    },
  }
}