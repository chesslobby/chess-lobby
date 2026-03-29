// ─────────────────────────────────────────────────────────────
//  Royal Chess — WebRTC Voice Signaling Handler
//  Tracks voice-readiness per game independently of socket room size,
//  so voice:initiate fires even if game:ready hasn't propagated yet.
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'

// gameId → Set of userIds that have sent voice:join
const voiceReady = new Map<string, Set<string>>()

export function registerVoiceHandlers(io: Server, socket: Socket) {
  const { userId } = socket.data

  // ── Join voice ─────────────────────────────────────────────
  socket.on('voice:join', ({ gameId }: { gameId: string }) => {
    if (!voiceReady.has(gameId)) voiceReady.set(gameId, new Set())

    const ready = voiceReady.get(gameId)!
    ready.add(userId)

    console.log(`[Voice] ${socket.data.username ?? userId} joined voice for ${gameId}. Ready: ${ready.size}/2`)

    if (ready.size >= 2) {
      // Both players ready — tell the second joiner (latest socket) to initiate
      voiceReady.delete(gameId)
      console.log(`[Voice] both ready, telling ${socket.data.username ?? userId} to initiate`)
      socket.emit('voice:initiate', { toUserId: userId })
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

  // ── Cleanup on disconnect ──────────────────────────────────
  socket.on('disconnect', () => {
    voiceReady.forEach((players, gameId) => {
      players.delete(userId)
      if (players.size === 0) voiceReady.delete(gameId)
    })
  })
}
