// ─────────────────────────────────────────────────────────────
//  Royal Chess — Spectator Socket Handler
//  Events: spectate:join, spectate:leave
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'
import { prisma } from '../db/client'

export function registerSpectateHandlers(io: Server, socket: Socket) {
  const { userId, username } = socket.data

  socket.on('spectate:join', async ({ gameId }: { gameId: string }) => {
    socket.join(`spectate:${gameId}`)

    await prisma.spectator.upsert({
      where: { gameId_userId: { gameId, userId } },
      update: { leftAt: null },
      create: { gameId, userId },
    })

    // Notify players that someone is watching
    io.to(gameId).emit('spectate:viewer-joined', { username })

    // Send current spectator count
    const count = await prisma.spectator.count({ where: { gameId, leftAt: null } })
    io.to(gameId).emit('spectate:count', { count })
  })

  socket.on('spectate:leave', async ({ gameId }: { gameId: string }) => {
    await leaveSpectate(io, socket, gameId, userId)
  })

  socket.on('disconnect', async () => {
    // Leave all spectated games
    const rooms = [...socket.rooms]
    for (const room of rooms) {
      if (room.startsWith('spectate:')) {
        const gameId = room.replace('spectate:', '')
        await leaveSpectate(io, socket, gameId, userId)
      }
    }
  })
}

async function leaveSpectate(io: Server, socket: Socket, gameId: string, userId: string) {
  socket.leave(`spectate:${gameId}`)

  await prisma.spectator.updateMany({
    where: { gameId, userId, leftAt: null },
    data: { leftAt: new Date() },
  })

  const count = await prisma.spectator.count({ where: { gameId, leftAt: null } })
  io.to(gameId).emit('spectate:count', { count })
}
