// ─────────────────────────────────────────────────────────────
//  Royal Chess — Arena Socket Handler
//  Events: arena:join, arena:leave, arena:ready
//  Emits: arena:standings, arena:game-found, arena:finished
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'

interface ArenaPlayer {
  userId: string
  username: string
  score: number
  games: number
  socketId: string
  ready: boolean
}

// arenaId → Map<userId, ArenaPlayer>
const arenas = new Map<string, Map<string, ArenaPlayer>>()
// arenaId → standings broadcast interval
const standingsIntervals = new Map<string, NodeJS.Timeout>()
// arenaId → end timeout
const arenaEndTimeouts = new Map<string, NodeJS.Timeout>()

const ARENA_DURATIONS: Record<string, number> = {
  'daily-blitz':   60 * 60 * 1000,
  'daily-bullet':  30 * 60 * 1000,
  'weekend-rapid': 90 * 60 * 1000,
}

function getStandings(arenaId: string) {
  const players = arenas.get(arenaId)
  if (!players) return []
  return [...players.values()]
    .sort((a, b) => b.score - a.score || b.games - a.games)
    .map((p, i) => ({ rank: i + 1, userId: p.userId, username: p.username, score: p.score, games: p.games }))
}

function startStandingsBroadcast(io: Server, arenaId: string) {
  if (standingsIntervals.has(arenaId)) return
  const interval = setInterval(() => {
    io.to(arenaId).emit('arena:standings', { standings: getStandings(arenaId) })
  }, 5000)
  standingsIntervals.set(arenaId, interval)
}

function stopArena(io: Server, arenaId: string) {
  const interval = standingsIntervals.get(arenaId)
  if (interval) { clearInterval(interval); standingsIntervals.delete(arenaId) }
  const endTimeout = arenaEndTimeouts.get(arenaId)
  if (endTimeout) { clearTimeout(endTimeout); arenaEndTimeouts.delete(arenaId) }

  io.to(arenaId).emit('arena:finished', { standings: getStandings(arenaId) })
  arenas.delete(arenaId)
}

function tryPairPlayers(io: Server, arenaId: string) {
  const players = arenas.get(arenaId)
  if (!players) return

  const readyPlayers = [...players.values()].filter(p => p.ready)
  if (readyPlayers.length < 2) return

  // Pair by closest scores
  readyPlayers.sort((a, b) => Math.abs(a.score - b.score))
  const white = readyPlayers[0]
  const black = readyPlayers[1]

  white.ready = false
  black.ready = false

  const gameId = `arena_${arenaId}_${Date.now()}`

  io.to(white.socketId).emit('arena:game-found', { gameId, color: 'w', opponent: black.username })
  io.to(black.socketId).emit('arena:game-found', { gameId, color: 'b', opponent: white.username })
}

export function registerArenaHandlers(io: Server, socket: Socket) {
  const { userId, username } = socket.data

  socket.on('arena:join', ({ arenaId }: { arenaId: string }) => {
    if (!arenas.has(arenaId)) arenas.set(arenaId, new Map())
    const players = arenas.get(arenaId)!

    if (!players.has(userId)) {
      players.set(userId, { userId, username, score: 0, games: 0, socketId: socket.id, ready: false })
    } else {
      players.get(userId)!.socketId = socket.id
    }

    socket.join(arenaId)
    socket.emit('arena:joined', { standings: getStandings(arenaId) })
    startStandingsBroadcast(io, arenaId)

    // Auto-end arena based on duration
    if (!arenaEndTimeouts.has(arenaId)) {
      const duration = ARENA_DURATIONS[arenaId] || 60 * 60 * 1000
      const timeout = setTimeout(() => stopArena(io, arenaId), duration)
      arenaEndTimeouts.set(arenaId, timeout)
    }
  })

  socket.on('arena:leave', ({ arenaId }: { arenaId: string }) => {
    const players = arenas.get(arenaId)
    if (players) {
      players.delete(userId)
      if (players.size === 0) {
        stopArena(io, arenaId)
      }
    }
    socket.leave(arenaId)
  })

  socket.on('arena:ready', ({ arenaId }: { arenaId: string }) => {
    const players = arenas.get(arenaId)
    if (!players || !players.has(userId)) return
    players.get(userId)!.ready = true
    tryPairPlayers(io, arenaId)
  })

  socket.on('arena:game-result', ({ arenaId, result }: { arenaId: string; result: 'win' | 'loss' | 'draw' }) => {
    const players = arenas.get(arenaId)
    if (!players || !players.has(userId)) return
    const p = players.get(userId)!
    if (result === 'win') p.score += 2
    else if (result === 'draw') p.score += 1
    p.games += 1
    io.to(arenaId).emit('arena:standings', { standings: getStandings(arenaId) })
  })

  socket.on('disconnect', () => {
    // Mark player as not ready in all arenas they're in
    for (const [arenaId, players] of arenas.entries()) {
      if (players.has(userId)) {
        players.get(userId)!.ready = false
      }
    }
  })
}
