import 'dotenv/config'
import Fastify from 'fastify'
import { Server } from 'socket.io'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import { registerAuthRoutes } from './routes/auth'
import { registerUserRoutes, registerFriendRoutes } from './routes/users'
import { registerGameRoutes } from './routes/games'
import { authMiddleware } from './middleware/auth'
import { registerMatchmakingHandlers } from './sockets/matchmaking'
import { registerGameHandlers } from './sockets/game'
import { registerChatHandlers } from './sockets/chat'

const app = Fastify({ logger: true })

const io = new Server(app.server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
})

// ── Plugins ──
app.register(fastifyCors, {
  origin: (origin, cb) => {
    // Allow all origins in production
    cb(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'change-me-in-production',
})
app.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// ── Routes ──
app.get('/health', async () => ({ status: 'ok', version: '1.0.0' }))
app.register(registerAuthRoutes,   { prefix: '/auth' })
app.register(registerUserRoutes,   { prefix: '/users' })
app.register(registerFriendRoutes, { prefix: '/friends' })
app.register(registerGameRoutes,   { prefix: '/games' })

// ── Socket.io ──
io.use(authMiddleware)

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} user: ${socket.data.userId} username: ${socket.data.username}`)
  registerMatchmakingHandlers(io, socket)
  registerGameHandlers(io, socket)
  registerChatHandlers(io, socket)
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// ── Start ──
const PORT = parseInt(process.env.PORT || '4000')
app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
  console.log(`🚀 Chess Lobby Server running on port ${PORT}`)
})

export { io }
