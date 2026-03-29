// ─────────────────────────────────────────────────────────────
//  Royal Chess — WebRTC Voice Signaling Handler
//  The server only relays signals — actual audio is P2P
//  Events: voice:join, voice:offer, voice:answer, voice:ice, voice:leave
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'

// gameId → { userId → socketId }
const voiceRooms = new Map<string, Map<string, string>>()

export function registerVoiceHandlers(io: Server, socket: Socket) {
  const { userId } = socket.data

  // ── Join voice channel ─────────────────────────────────────
  socket.on('voice:join', ({ gameId }: { gameId: string }) => {
    if (!voiceRooms.has(gameId)) voiceRooms.set(gameId, new Map())

    const room = voiceRooms.get(gameId)!
    room.set(userId, socket.id)

    // Tell others in game that this user joined voice
    socket.to(gameId).emit('voice:peer-joined', { userId })

    // If there's already someone in the voice room, initiate offer
    if (room.size >= 2) {
      // Signal to the first joiner that a new peer is ready
      const [existingUserId] = [...room.entries()].find(([uid]) => uid !== userId) ?? []
      if (existingUserId) {
        const existingSocketId = room.get(existingUserId)!
        io.to(existingSocketId).emit('voice:initiate', { toUserId: userId })
      }
    }
  })

  // ── Relay WebRTC offer ─────────────────────────────────────
  socket.on('voice:offer', ({ gameId, toUserId, offer }: {
    gameId: string; toUserId: string; offer: any
  }) => {
    const room = voiceRooms.get(gameId)
    const targetSocketId = room?.get(toUserId)
    if (!targetSocketId) return

    io.to(targetSocketId).emit('voice:offer', {
      fromUserId: userId,
      offer,
    })
  })

  // ── Relay WebRTC answer ────────────────────────────────────
  socket.on('voice:answer', ({ gameId, toUserId, answer }: {
    gameId: string; toUserId: string; answer: any
  }) => {
    const room = voiceRooms.get(gameId)
    const targetSocketId = room?.get(toUserId)
    if (!targetSocketId) return

    io.to(targetSocketId).emit('voice:answer', {
      fromUserId: userId,
      answer,
    })
  })

  // ── Relay ICE candidate ────────────────────────────────────
  socket.on('voice:ice', ({ gameId, toUserId, candidate }: {
    gameId: string; toUserId: string; candidate: any
  }) => {
    const room = voiceRooms.get(gameId)
    const targetSocketId = room?.get(toUserId)
    if (!targetSocketId) return

    io.to(targetSocketId).emit('voice:ice', {
      fromUserId: userId,
      candidate,
    })
  })

  // ── Leave voice channel ────────────────────────────────────
  socket.on('voice:leave', ({ gameId }: { gameId: string }) => {
    leaveVoice(io, socket, gameId, userId)
  })

  // ── Relay speaking indicator ───────────────────────────────
  socket.on('voice:speaking', ({ gameId, speaking }: { gameId: string; speaking: boolean }) => {
    socket.to(gameId).emit('voice:speaking', { userId, speaking })
  })

  // ── Cleanup on disconnect ──────────────────────────────────
  socket.on('disconnect', () => {
    for (const [gameId] of voiceRooms.entries()) {
      leaveVoice(io, socket, gameId, userId)
    }
  })
}

function leaveVoice(io: Server, socket: Socket, gameId: string, userId: string) {
  const room = voiceRooms.get(gameId)
  if (!room) return

  room.delete(userId)
  if (room.size === 0) voiceRooms.delete(gameId)

  socket.to(gameId).emit('voice:peer-left', { userId })
}
