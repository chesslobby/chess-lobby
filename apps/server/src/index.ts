import 'dotenv/config'
import Fastify from 'fastify'
import compress from '@fastify/compress'
import { Server } from 'socket.io'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import { registerAuthRoutes } from './routes/auth'
import { registerUserRoutes, registerFriendRoutes } from './routes/users'
import { registerGameRoutes } from './routes/games'
import { registerPuzzleRoutes } from './routes/puzzles'
import { registerTournamentRoutes } from './routes/tournaments'
import { registerAdminRoutes } from './routes/admin'
import { authMiddleware } from './middleware/auth'
import { registerMatchmakingHandlers } from './sockets/matchmaking'
import { registerGameHandlers } from './sockets/game'
import { registerChatHandlers } from './sockets/chat'
import { registerArenaHandlers } from './sockets/arena'
import { registerVoiceHandlers } from './sockets/voice'
import { registerSpectateHandlers } from './sockets/spectate'

const app = Fastify({ logger: true })

const io = new Server(app.server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
})

// ── Plugins ──
app.register(compress, { global: true })
app.register(fastifyCors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
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
app.register(registerAuthRoutes,       { prefix: '/auth' })
app.register(registerUserRoutes,       { prefix: '/users' })
app.register(registerFriendRoutes,     { prefix: '/friends' })
app.register(registerGameRoutes,       { prefix: '/games' })
app.register(registerPuzzleRoutes,     { prefix: '/puzzles' })
app.register(registerTournamentRoutes, { prefix: '/tournaments' })
app.register(registerAdminRoutes,      { prefix: '/admin' })

// ── Socket.io ──
io.use(authMiddleware)

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} user: ${socket.data.userId} username: ${socket.data.username}`)
  registerMatchmakingHandlers(io, socket)
  registerGameHandlers(io, socket)
  registerChatHandlers(io, socket)
  registerVoiceHandlers(io, socket)
  registerSpectateHandlers(io, socket)
  registerArenaHandlers(io, socket)
  socket.onAny((event, ...args) => {
    if (event.startsWith('voice:')) {
      console.log(`[Voice DEBUG] ${socket.data.username ?? socket.data.userId} → ${event}`, JSON.stringify(args).slice(0, 120))
    }
  })
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
