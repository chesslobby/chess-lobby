// ─────────────────────────────────────────────────────────────
//  Royal Chess — Games REST Routes
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'
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

  // GET /games/history — game history for a user
  fastify.get('/history', async (req: any, reply) => {
    const query = req.query as { userId?: string; limit?: string; offset?: string }

    let userId = query.userId
    if (!userId) {
      const auth = req.headers.authorization
      if (auth) {
        try {
          const token = auth.split(' ')[1]
          const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
          userId = payload.userId
        } catch {}
      }
    }

    if (!userId) return reply.status(400).send({ error: 'userId required' })

    const limit = Math.min(parseInt(query.limit || '10'), 50)
    const offset = parseInt(query.offset || '0')

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where: {
          endedAt: { not: null },
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
        include: {
          whitePlayer: { select: { id: true, username: true, eloRating: true } },
          blackPlayer: { select: { id: true, username: true, eloRating: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.game.count({
        where: {
          endedAt: { not: null },
          OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
        },
      }),
    ])

    const formatted = games.map(g => {
      const isWhite = g.whitePlayerId === userId
      const opponent = isWhite ? g.blackPlayer : g.whitePlayer
      const eloChange = isWhite ? g.eloChangeWhite : g.eloChangeBlack

      let result: 'Win' | 'Loss' | 'Draw'
      if (!g.winnerId) result = 'Draw'
      else if (g.winnerId === userId) result = 'Win'
      else result = 'Loss'

      return {
        id: g.id,
        opponent: { id: opponent.id, username: opponent.username, elo: opponent.eloRating },
        result,
        eloChange,
        timeControl: g.timeControl,
        date: g.createdAt,
        pgn: g.pgn,
      }
    })

    return reply.send({ games: formatted, total, hasMore: offset + limit < total })
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
      select: {
        pgn: true,
        result: true,
        winnerId: true,
        timeControl: true,
        createdAt: true,
        whitePlayer: { select: { username: true, eloRating: true } },
        blackPlayer: { select: { username: true, eloRating: true } },
        eloChangeWhite: true,
        eloChangeBlack: true,
      },
    })
    if (!game || !game.pgn) return reply.status(404).send({ error: 'Game or PGN not found' })
    return reply.send({ game })
  })
}
