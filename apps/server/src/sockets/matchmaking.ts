// ─────────────────────────────────────────────────────────────
//  Royal Chess — Matchmaking Socket Handler
//  Events: queue:join, queue:leave, room:create, room:join
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'
import { generateRoomCode } from 'chess-engine'
import { prisma } from '../db/client'

// In-memory matchmaking queue per time control
// Format: { [timeControl]: [ {socketId, userId, username, elo} ] }
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
    if (!queues[timeControl]) queues[timeControl] = []

    // Remove any existing queue entry for this user
    queues[timeControl] = queues[timeControl].filter(e => e.userId !== userId)

    const entry: QueueEntry = {
      socketId: socket.id,
      userId,
      username,
      eloRating,
      joinedAt: Date.now(),
    }

    // Try to find an opponent (within 200 Elo, expanding over time)
    const opponent = findOpponent(queues[timeControl], entry)

    if (opponent) {
      // Remove opponent from queue
      queues[timeControl] = queues[timeControl].filter(e => e.userId !== opponent.userId)

      // Create the game
      const game = await createGame(entry, opponent, timeControl, 'public')

      // Assign colors randomly
      const [white, black] = Math.random() > 0.5 ? [entry, opponent] : [opponent, entry]

      // Put both in a Socket.io room
      socket.join(game.id)
      io.sockets.sockets.get(opponent.socketId)?.join(game.id)

      // Notify both players
      socket.emit('match:found', {
        gameId: game.id,
        color: white.userId === userId ? 'w' : 'b',
        opponent: { username: opponent.username, eloRating: opponent.eloRating },
        timeControl,
      })

      io.to(opponent.socketId).emit('match:found', {
        gameId: game.id,
        color: white.userId === opponent.userId ? 'w' : 'b',
        opponent: { username, eloRating },
        timeControl,
      })
    } else {
      // Add to queue and wait
      queues[timeControl].push(entry)
      socket.emit('queue:waiting', { position: queues[timeControl].length })
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
    const code = generateRoomCode()

    pendingRooms[code] = {
      code,
      hostSocketId: socket.id,
      hostUserId: userId,
      hostUsername: username,
      hostElo: eloRating,
      timeControl,
      createdAt: Date.now(),
    }

    socket.emit('room:created', { code, timeControl })

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
    const room = pendingRooms[code.toUpperCase()]

    if (!room) {
      socket.emit('room:error', { message: 'Room not found or expired' })
      return
    }
    if (room.hostUserId === userId) {
      socket.emit('room:error', { message: 'Cannot join your own room' })
      return
    }

    delete pendingRooms[code]

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
      eloRating,
      joinedAt: Date.now(),
    }

    const game = await createGame(hostEntry, guestEntry, room.timeControl, 'private')

    const [white, black] = Math.random() > 0.5 ? [hostEntry, guestEntry] : [guestEntry, hostEntry]

    socket.join(game.id)
    io.sockets.sockets.get(room.hostSocketId)?.join(game.id)

    io.to(room.hostSocketId).emit('room:joined', {
      gameId: game.id,
      color: white.userId === room.hostUserId ? 'w' : 'b',
      opponent: { username, eloRating },
      timeControl: room.timeControl,
    })

    socket.emit('room:joined', {
      gameId: game.id,
      color: white.userId === userId ? 'w' : 'b',
      opponent: { username: room.hostUsername, eloRating: room.hostElo },
      timeControl: room.timeControl,
    })
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
  const waitSeconds = (Date.now() - seeker.joinedAt) / 1000
  // Expand Elo range by 50 per 30 seconds of waiting
  const eloRange = 200 + Math.floor(waitSeconds / 30) * 50

  return (
    queue.find(e =>
      e.userId !== seeker.userId &&
      Math.abs(e.eloRating - seeker.eloRating) <= eloRange
    ) ?? null
  )
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
    },
  })
}
