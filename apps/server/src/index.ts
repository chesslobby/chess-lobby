import Fastify from 'fastify'
import { Server } from 'socket.io'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import { createServer } from 'http'

const app = Fastify({ logger: true })
const httpServer = createServer(app.server)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// ── Plugins ──
app.register(fastifyCors, {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
})
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'change-me-in-production',
})
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// ── Routes (to be filled in Phase 1) ──
app.get('/health', async () => ({ status: 'ok', version: '1.0.0' }))

// ── Socket.io (to be filled per phase) ──
io.on('connection', (socket) => {
  app.log.info(`Client connected: ${socket.id}`)
  socket.on('disconnect', () => {
    app.log.info(`Client disconnected: ${socket.id}`)
  })
})

// ── Start ──
const PORT = parseInt(process.env.PORT || '3001')
httpServer.listen(PORT, () => {
  console.log(`🚀 Royal Chess Server running on port ${PORT}`)
})

export { io }
