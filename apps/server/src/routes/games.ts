// ─────────────────────────────────────────────────────────────
//  Royal Chess — Games REST Routes
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client'

export async function registerGameRoutes(fastify: FastifyInstance) {

  // GET /games/live — all active public games for spectator browser
  fastify.get('/live', async (_req, reply) => {
    const games = await prisma.game.findMany({
      where: { endedAt: null, roomType: 'public' },
      include: {
        whitePlayer: { select: { username: true, eloRating: true, avatarUrl: true } },
        blackPlayer: { select: { username: true, eloRating: true, avatarUrl: true } },
        _count: { select: { spectators: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send({ games })
  })

  // GET /games/:gameId
  fastify.get('/:gameId', async (req, reply) => {
    const { gameId } = req.params as { gameId: string }
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: { select: { username: true, eloRating: true, avatarUrl: true } },
        blackPlayer: { select: { username: true, eloRating: true, avatarUrl: true } },
        chatMessages: { orderBy: { sentAt: 'asc' }, include: { sender: { select: { username: true } } } },
      },
    })
    if (!game) return reply.status(404).send({ error: 'Game not found' })
    return reply.send({ game })
  })

  // GET /games/:gameId/replay
  fastify.get('/:gameId/replay', async (req, reply) => {
    const { gameId } = req.params as { gameId: string }
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { pgn: true, whitePlayerId: true, blackPlayerId: true, result: true, winnerId: true },
    })
    if (!game || !game.pgn) return reply.status(404).send({ error: 'Game or PGN not found' })
    return reply.send({ pgn: game.pgn, result: game.result, winnerId: game.winnerId })
  })
}
