import Fastify from 'fastify'
import FastifyVite from '@fastify/vite'
import FastifyFormBody from '@fastify/formbody'
import renderer from './renderer.js'

const server = Fastify({
  logger: {
    transport: {
      target: '@fastify/one-line-logger'
    }
  }
})

await server.register(FastifyFormBody)
await server.register(FastifyVite,  {
  root: import.meta.url,
  renderer,
})

await server.vite.ready()
await server.listen({ port: 3000 })
