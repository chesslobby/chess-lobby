// ─────────────────────────────────────────────────────────────
//  Royal Chess — WebRTC Voice Signaling Handler
//  Uses socket.io rooms for relay. Audio is P2P via TURN/STUN.
//  Events: voice:join, voice:offer, voice:answer, voice:ice, voice:leave
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'

export function registerVoiceHandlers(io: Server, socket: Socket) {
  const { userId } = socket.data

  // ── Join voice room ────────────────────────────────────────
  socket.on('voice:join', async ({ gameId }: { gameId: string }) => {
    const roomName = `voice:${gameId}`
    await socket.join(roomName)

    const room = io.sockets.adapter.rooms.get(roomName)
    const roomSize = room ? room.size : 0
    console.log(`Voice room ${gameId} size: ${roomSize}`)

    if (roomSize >= 2) {
      // Second player joined — tell them to initiate the offer
      socket.emit('voice:initiate', { toUserId: userId })
    }
  })

  // ── Relay WebRTC offer ─────────────────────────────────────
  socket.on('voice:offer', ({ gameId, toUserId, offer }: {
    gameId: string; toUserId: string; offer: any
  }) => {
    socket.to(`voice:${gameId}`).emit('voice:offer', { fromUserId: userId, offer })
  })

  // ── Relay WebRTC answer ────────────────────────────────────
  socket.on('voice:answer', ({ gameId, toUserId, answer }: {
    gameId: string; toUserId: string; answer: any
  }) => {
    socket.to(`voice:${gameId}`).emit('voice:answer', { fromUserId: userId, answer })
  })

  // ── Relay ICE candidate ────────────────────────────────────
  socket.on('voice:ice', ({ gameId, candidate }: {
    gameId: string; candidate: any
  }) => {
    socket.to(`voice:${gameId}`).emit('voice:ice', { candidate })
  })

  // ── Leave voice room ───────────────────────────────────────
  socket.on('voice:leave', ({ gameId }: { gameId: string }) => {
    socket.leave(`voice:${gameId}`)
    socket.to(`voice:${gameId}`).emit('voice:peer-left', { userId })
  })

  // ── Relay speaking indicator ───────────────────────────────
  socket.on('voice:speaking', ({ gameId, speaking }: { gameId: string; speaking: boolean }) => {
    socket.to(gameId).emit('voice:speaking', { userId, speaking })
  })

  // ── Cleanup on disconnect ──────────────────────────────────
  socket.on('disconnect', () => {
    // socket.io automatically removes socket from all rooms on disconnect
    // Notify all voice rooms this socket was in
    for (const room of socket.rooms) {
      if (room.startsWith('voice:')) {
        socket.to(room).emit('voice:peer-left', { userId })
      }
    }
  })
}
