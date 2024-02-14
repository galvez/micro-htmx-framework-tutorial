import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import inject from '@rollup/plugin-inject'

export default defineConfig({
  root: join(dirname(fileURLToPath(import.meta.url)), 'client'),
  esbuild: {
    jsxFactory: 'Html.createElement',
    jsxFragment: 'Html.Fragment',
  },
  plugins: [
    inject({
       htmx: 'htmx.org',
       Html: '@kitajs/html'
    }),
    ensureClientOnlyScripts()
  ],
})

function ensureClientOnlyScripts() {
  let config
  return {
    name: 'vite-plugin-fastify-vite-htmx',
    configResolved (resolvedConfig) {
      // Store the resolved config
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