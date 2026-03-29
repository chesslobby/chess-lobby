// ─────────────────────────────────────────────────────────────
//  Royal Chess — WebRTC Voice Signaling Handler
//  Uses the existing game room (players are already in it via game:ready).
//  No separate voice room join needed — avoids extra socket.join() overhead.
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'

export function registerVoiceHandlers(io: Server, socket: Socket) {
  const { userId } = socket.data

  // ── Join voice ─────────────────────────────────────────────
  // Player is already in the game room from game:ready.
  // Check room size — if both players are present, tell the joiner to initiate.
  socket.on('voice:join', ({ gameId }: { gameId: string }) => {
    const room = io.sockets.adapter.rooms.get(gameId)
    const roomSize = room ? room.size : 0

    console.log(`[Voice] join from ${socket.data.username ?? userId}, room ${gameId} size: ${roomSize}`)

    if (roomSize >= 2) {
      socket.emit('voice:initiate', { toUserId: userId })
      console.log(`[Voice] telling ${socket.data.username ?? userId} to initiate`)
    }
  })

  // ── Relay WebRTC offer ─────────────────────────────────────
  socket.on('voice:offer', ({ gameId, offer }: { gameId: string; offer: any }) => {
    console.log(`[Voice] relaying offer from ${socket.data.username ?? userId}`)
    socket.to(gameId).emit('voice:offer', { fromUserId: userId, offer })
  })

  // ── Relay WebRTC answer ────────────────────────────────────
  socket.on('voice:answer', ({ gameId, answer }: { gameId: string; answer: any }) => {
    console.log(`[Voice] relaying answer from ${socket.data.username ?? userId}`)
    socket.to(gameId).emit('voice:answer', { fromUserId: userId, answer })
  })

  // ── Relay ICE candidate ────────────────────────────────────
  socket.on('voice:ice', ({ gameId, candidate }: { gameId: string; candidate: any }) => {
    socket.to(gameId).emit('voice:ice', { candidate })
  })

  // ── Leave voice ────────────────────────────────────────────
  socket.on('voice:leave', ({ gameId }: { gameId: string }) => {
    socket.to(gameId).emit('voice:peer-left', { userId })
  })

  // ── Relay speaking indicator ───────────────────────────────
  socket.on('voice:speaking', ({ gameId, speaking }: { gameId: string; speaking: boolean }) => {
    socket.to(gameId).emit('voice:speaking', { userId, speaking })
  })
}
