import { readFile } from 'node:fs/promises'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findStaticImports } from 'mlly'

const root = join(dirname(fileURLToPath(import.meta.url)), 'client')

export default {
  prepareClient,
  createRoute,
}

const kPrefetch = Symbol('kPrefetch')

async function prepareClient(clientModule, scope, config) {
  if (!clientModule) {
    return null
  }
  const { routes } = clientModule
  for (const route of routes) {
    // Pregenerate prefetching <head> elements
    const { css, svg, js } = await findClientImports(route.modulePath)
    route[kPrefetch] = ''
    for (const stylesheet of css) {
      if (config.dev) {
        route[kPrefetch] += `  <link rel="stylesheet" href="/${stylesheet}">\n`
      } else if (config.ssrManifest[stylesheet]) {
        const [asset] = config.ssrManifest[stylesheet].filter((s) =>
          s.endsWith('.css'),
        )
        route[kPrefetch] +=
          `  <link rel="stylesheet" href="${asset}" crossorigin>\n`
      }
    }
    for (const image of svg) {
      if (config.dev) {
        route[kPrefetch] +=
          `  <link as="image" rel="preload" href="/${image}" fetchpriority="high">\n`
      } else if (config.ssrManifest[image]) {
        const [asset] = config.ssrManifest[image].filter((s) =>
          s.endsWith('.svg') || s.endsWith('.js'),
        )
        route[kPrefetch] +=
          `  <link as="image" rel="preload" href="${asset}" fetchpriority="high">\n`
      }
    }
    for (const script of js) {
      if (config.dev) {
        route[kPrefetch] += `<script src="/${script}" type="module"></script>\n`
      } else if (config.ssrManifest[script]) {
        const [asset] = config.ssrManifest[script].filter((s) =>
          s.endsWith('.js'),
        )
        route[kPrefetch] +=
          `<script src="${asset}" type="module" crossorigin></script>\n`
      }
    }
  }
  return Object.assign({}, clientModule, { routes })
}

function createRoute ({ handler, errorHandler, route, client }, fastify, config) {
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
          head: await renderHead(client, route, { 
            app: fastify, 
            req, 
            reply
          }),
          element: await route.default(req, reply),
        })
      }
      return reply
    },
    errorHandler,
    ...route
  })
}

async function renderHead(client, route, ctx) {
  let rendered = ''
  if (route[kPrefetch]) {
    rendered += route[kPrefetch]
  }
  if (route.head === 'function') {
    rendered += await route.head(ctx)
  } else if (route.head) {
    rendered += route.head
  }
  rendered += '\n'
  if (client.head === 'function') {
    rendered += await client.head(ctx)
  } else if (client.head) {
    rendered += client.head
  }
  return rendered
}

async function findClientImports(path, { 
  js = [], 
  css = [], 
  svg = []
} = {}) {
  const source = await readFile(join(root, path), 'utf8')
  const specifiers = findStaticImports(source)
    .filter(({ specifier }) => {
      return specifier.match(/\.((svg)|(css)|(m?js)|(tsx?)|(jsx?))$/)
    })
    .map(({ specifier }) => specifier)
  for (const specifier of specifiers) {
    const resolved = resolve(dirname(path), specifier)
    if (specifier.match(/\.svg$/)) {
      svg.push(resolved.slice(1))
    }
    if (specifier.match(/\.client\.((m?js)|(tsx?)|(jsx?))$/)) {
      js.push(resolved.slice(1))
    }
    if (specifier.match(/\.css$/)) {
      css.push(resolved.slice(1))
    }
    if (specifier.match(/\.((m?js)|(tsx?)|(jsx?))$/)) {
      const submoduleImports = await findClientImports(resolved)
      js.push(...submoduleImports.js)
      css.push(...submoduleImports.css)
      svg.push(...submoduleImports.svg)
    }
  }
  return { js, css, svg }
}
