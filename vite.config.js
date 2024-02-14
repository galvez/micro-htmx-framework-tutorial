import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  root: join(dirname(fileURLToPath(import.meta.url)), 'client'),
})
