import { readFile } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findStaticImports } from 'mlly'

const root = join(dirname(fileURLToPath(import.meta.url)), 'client')

export default {
  createRenderFunction: () => {},
  prepareClient,
  createRoute,
  findClientImports,
}

async function prepareClient (clientModule, scope, config) {
  if (!clientModule) {
    return null
  }
  const { routes } = clientModule
  for (const route of routes) {
  	route.clientImports = await findClientImports(route.modulePath)
  }
  return Object.assign({}, clientModule, { routes })
}

function createRoute ({ handler, errorHandler, route }, fastify, config) {
  if (!route.path) {
  	return
  }
  fastify.route({
    url: route.path,
    method: route.method ?? 'GET',
    async handler (req, reply) {
      reply.type('text/html')
      if (route.fragment) {
        reply.send(await route.default(req, reply))
      } else {
        reply.html({
          element: await route.default(req, reply),
          clientImports: JSON.stringify(route.clientImports),
        })
      }
    },
    errorHandler,
    ...route
  })
}

async function findClientImports (path, imports = []) {
  const source = await readFile(join(root, path), 'utf8')
  const specifiers = findStaticImports(source)
    .filter(({ specifier }) => {
      return specifier.endsWith('.css') || 
      	specifier.endsWith('.svg') ||
      	specifier.endsWith('.client.js')
    })
    .map(({ specifier }) => specifier)
  for (const specifier of specifiers) {
    const resolved = resolve(dirname(path), specifier)
    imports.push(resolved)
    if (specifier.endsWith('.client.js')) {
      imports.push(...await findClientImports(resolved))
    }
  }
  return imports
}