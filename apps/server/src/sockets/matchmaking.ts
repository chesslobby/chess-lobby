// ─────────────────────────────────────────────────────────────
//  Royal Chess — Matchmaking Socket Handler
//  Events: queue:join, queue:leave, room:create, room:join
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'
import { prisma } from '../db/client'

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// In-memory matchmaking queue per time control
const queues: Record<number, QueueEntry[]> = {}

// Active private rooms waiting for opponent
const pendingRooms: Record<string, PendingRoom> = {}

interface QueueEntry {
  socketId: string
  userId: string
  username: string
  eloRating: number
  joinedAt: number
}

interface PendingRoom {
  code: string
  hostSocketId: string
  hostUserId: string
  hostUsername: string
  hostElo: number
  timeControl: number
  createdAt: number
}

export function registerMatchmakingHandlers(io: Server, socket: Socket) {
  const { userId, username } = socket.data

  // ── Join public queue ──────────────────────────────────────
  socket.on('queue:join', async ({ timeControl, eloRating }: { timeControl: number; eloRating: number }) => {
    // Parse eloRating as number — client may send it as a string from localStorage
    const elo = Number(eloRating) || 1200
    const tc  = Number(timeControl) || 600

    if (!queues[tc]) queues[tc] = []

    // Remove any stale entry for this user
    queues[tc] = queues[tc].filter(e => e.userId !== userId)

    console.log(`[Queue] ${username} joined queue for ${tc}s (elo: ${elo}). Queue size before: ${queues[tc].length}`)

    const entry: QueueEntry = {
      socketId: socket.id,
      userId,
      username,
      eloRating: elo,
      joinedAt: Date.now(),
    }

    // Try to find an opponent BEFORE adding self to queue
    const opponent = findOpponent(queues[tc], entry)

    if (opponent) {
      // Remove opponent from queue
      queues[tc] = queues[tc].filter(e => e.userId !== opponent.userId)

      console.log(`[Match] Matched ${username} (${elo}) with ${opponent.username} (${opponent.eloRating})`)

      try {
        const game = await createGame(entry, opponent, tc, 'public')

        // Assign colors randomly
        const [white, black] = Math.random() > 0.5 ? [entry, opponent] : [opponent, entry]

        // Put both in a Socket.io room
        socket.join(game.id)
        io.sockets.sockets.get(opponent.socketId)?.join(game.id)

        socket.emit('match:found', {
          gameId: game.id,
          color: white.userId === userId ? 'w' : 'b',
          opponent: { id: opponent.userId, username: opponent.username, eloRating: opponent.eloRating },
          timeControl: tc,
        })

        io.to(opponent.socketId).emit('match:found', {
          gameId: game.id,
          color: white.userId === opponent.userId ? 'w' : 'b',
          opponent: { id: userId, username, eloRating: elo },
          timeControl: tc,
        })
      } catch (err) {
        console.error('[Match] createGame failed:', err)
        socket.emit('queue:error', { message: 'Failed to create game, please try again' })
      }
    } else {
      // No opponent found — add to queue and wait
      queues[tc].push(entry)
      console.log(`[Queue] No opponent for ${username}. Queue size now: ${queues[tc].length}`)
      socket.emit('queue:waiting', { position: queues[tc].length })
    }
  })

  // ── Leave queue ────────────────────────────────────────────
  socket.on('queue:leave', () => {
    for (const tc of Object.keys(queues)) {
      queues[Number(tc)] = queues[Number(tc)].filter(e => e.userId !== userId)
    }
    socket.emit('queue:left')
  })

  // ── Create private room ────────────────────────────────────
  socket.on('room:create', async ({ timeControl, eloRating }: { timeControl: number; eloRating: number }) => {
    const elo = Number(eloRating) || 1200
    const tc  = Number(timeControl) || 600
    const code = generateRoomCode()

    pendingRooms[code] = {
      code,
      hostSocketId: socket.id,
      hostUserId: userId,
      hostUsername: username,
      hostElo: elo,
      timeControl: tc,
      createdAt: Date.now(),
    }

    socket.emit('room:created', { code, timeControl: tc })

    // Auto-expire room after 10 minutes
    setTimeout(() => {
      if (pendingRooms[code]) {
        delete pendingRooms[code]
        socket.emit('room:expired', { code })
      }
    }, 10 * 60 * 1000)
  })

  // ── Join private room ──────────────────────────────────────
  socket.on('room:join', async ({ code, eloRating }: { code: string; eloRating: number }) => {
    const elo  = Number(eloRating) || 1200
    const room = pendingRooms[code.toUpperCase()]

    if (!room) {
      socket.emit('room:error', { message: 'Room not found or expired' })
      return
    }
    if (room.hostUserId === userId) {
      socket.emit('room:error', { message: 'Cannot join your own room' })
      return
    }

    delete pendingRooms[code.toUpperCase()]

    const hostEntry: QueueEntry = {
      socketId: room.hostSocketId,
      userId: room.hostUserId,
      username: room.hostUsername,
      eloRating: room.hostElo,
      joinedAt: room.createdAt,
    }
    const guestEntry: QueueEntry = {
      socketId: socket.id,
      userId,
      username,
      eloRating: elo,
      joinedAt: Date.now(),
    }

    try {
      const game = await createGame(hostEntry, guestEntry, room.timeControl, 'private')
      const [white, black] = Math.random() > 0.5 ? [hostEntry, guestEntry] : [guestEntry, hostEntry]

      socket.join(game.id)
      io.sockets.sockets.get(room.hostSocketId)?.join(game.id)

      io.to(room.hostSocketId).emit('room:joined', {
        gameId: game.id,
        color: white.userId === room.hostUserId ? 'w' : 'b',
        opponent: { id: userId, username, eloRating: elo },
        timeControl: room.timeControl,
      })

      socket.emit('room:joined', {
        gameId: game.id,
        color: white.userId === userId ? 'w' : 'b',
        opponent: { id: room.hostUserId, username: room.hostUsername, eloRating: room.hostElo },
        timeControl: room.timeControl,
      })
    } catch (err) {
      console.error('[Room] createGame failed:', err)
      socket.emit('room:error', { message: 'Failed to create game, please try again' })
    }
  })

  // ── Clean up on disconnect ─────────────────────────────────
  socket.on('disconnect', () => {
    for (const tc of Object.keys(queues)) {
      queues[Number(tc)] = queues[Number(tc)].filter(e => e.socketId !== socket.id)
    }
    for (const code of Object.keys(pendingRooms)) {
      if (pendingRooms[code].hostSocketId === socket.id) {
        delete pendingRooms[code]
      }
    }
  })
}

// ── Helpers ───────────────────────────────────────────────────

function findOpponent(queue: QueueEntry[], seeker: QueueEntry): QueueEntry | null {
  const seekerWait = (Date.now() - seeker.joinedAt) / 1000

  for (const candidate of queue) {
    if (candidate.userId === seeker.userId) continue

    // Use the longer of the two wait times to determine Elo range.
    // This ensures a player who has been waiting 60s gets a wider bracket.
    const candidateWait = (Date.now() - candidate.joinedAt) / 1000
    const maxWait  = Math.max(seekerWait, candidateWait)
    const eloRange = 500 + Math.floor(maxWait / 30) * 50

    const eloDiff = Math.abs(candidate.eloRating - seeker.eloRating)

    console.log(
      `[Match] Checking ${seeker.username} (${seeker.eloRating}) vs ${candidate.username} (${candidate.eloRating}) ` +
      `| diff: ${eloDiff} | range: ${eloRange} | maxWait: ${maxWait.toFixed(0)}s`
    )

    if (eloDiff <= eloRange) return candidate
  }

  return null
}

async function createGame(
  white: QueueEntry,
  black: QueueEntry,
  timeControl: number,
  roomType: 'public' | 'private'
) {
  return prisma.game.create({
    data: {
      whitePlayerId: white.userId,
      blackPlayerId: black.userId,
      timeControl,
      whiteEloBefore: white.eloRating,
      blackEloBefore: black.eloRating,
      roomType,
      pgn: '',
    },
  })
}
