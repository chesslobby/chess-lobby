// ─────────────────────────────────────────────────────────────
//  Chess Lobby — Admin Routes
//  All routes require x-admin-key header
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client'
import { io } from '../index'

async function verifyAdmin(req: any, reply: any) {
  const adminKey = req.headers['x-admin-key']
  const expected = process.env.ADMIN_SECRET_KEY || 'chesslobby-admin-2026'
  console.log('[Admin] key received:', adminKey?.substring(0, 10))
  console.log('[Admin] key expected:', expected?.substring(0, 10))
  if (adminKey !== expected) {
    return reply.status(403).send({ error: 'Forbidden' })
  }
}

export async function registerAdminRoutes(fastify: FastifyInstance) {

  // ── GET /admin/stats ────────────────────────────────────────
  fastify.get('/stats', { preHandler: verifyAdmin }, async (_req, reply) => {
    try {
      const [totalUsers, totalGames] = await Promise.all([
        prisma.user.count(),
        prisma.game.count(),
      ])

      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const gamesToday = await prisma.game.count({
        where: { createdAt: { gte: startOfDay } },
      })

      const onlineNow = io.sockets.sockets.size

      return reply.send({ totalUsers, totalGames, gamesToday, onlineNow })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── GET /admin/users ────────────────────────────────────────
  fastify.get('/users', { preHandler: verifyAdmin }, async (req, reply) => {
    const { page = '1', limit = '20', search = '', sort = 'eloRating' } = req.query as any
    const pageNum  = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const skip     = (pageNum - 1) * limitNum

    const validSorts: Record<string, any> = {
      eloRating: { eloRating: 'desc' },
      gamesPlayed: { gamesPlayed: 'desc' },
      createdAt: { createdAt: 'desc' },
      lastSeen: { lastSeen: 'desc' },
    }
    const orderBy = validSorts[sort] || { eloRating: 'desc' }

    const where = search
      ? { OR: [
          { username: { contains: search, mode: 'insensitive' as any } },
          { email:    { contains: search, mode: 'insensitive' as any } },
        ]}
      : {}

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where, orderBy, skip, take: limitNum,
          select: {
            id: true, username: true, email: true, eloRating: true,
            gamesPlayed: true, gamesWon: true, gamesDraw: true,
            isGuest: true, createdAt: true, lastSeen: true,
          },
        }),
        prisma.user.count({ where }),
      ])
      return reply.send({ users, total, page: pageNum, limit: limitNum })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── GET /admin/games ────────────────────────────────────────
  fastify.get('/games', { preHandler: verifyAdmin }, async (req, reply) => {
    const { limit = '50' } = req.query as any
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)))

    try {
      const games = await prisma.game.findMany({
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        select: {
          id: true, result: true, pgn: true,
          timeControl: true, createdAt: true, endedAt: true,
          whitePlayer: { select: { username: true } },
          blackPlayer: { select: { username: true } },
        },
      })

      const mapped = games.map((g: any) => ({
        id: g.id,
        whiteName: g.whitePlayer?.username || '—',
        blackName: g.blackPlayer?.username || '—',
        result: g.result,
        moveCount: g.pgn ? g.pgn.trim().split(/\s+\d+\./).length : null,
        timeControl: g.timeControl,
        createdAt: g.createdAt,
        endedAt: g.endedAt,
      }))

      return reply.send({ games: mapped })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── POST /admin/announce ────────────────────────────────────
  fastify.post('/announce', { preHandler: verifyAdmin }, async (req, reply) => {
    const { message } = req.body as any
    if (!message?.trim()) return reply.status(400).send({ error: 'Message required' })
    try {
      io.emit('admin:announcement', { message: message.trim(), timestamp: Date.now() })
      return reply.send({ ok: true, message: message.trim() })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── DELETE /admin/guests ────────────────────────────────────
  fastify.delete('/guests', { preHandler: verifyAdmin }, async (_req, reply) => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    try {
      const result = await prisma.user.deleteMany({
        where: { isGuest: true, createdAt: { lt: cutoff } },
      })
      return reply.send({ deleted: result.count })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── GET /admin/registration-stats ──────────────────────────
  fastify.get('/registration-stats', { preHandler: verifyAdmin }, async (_req, reply) => {
    try {
      // Last 7 days bucketed by day
      const days: { day: string; count: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const start = new Date()
        start.setDate(start.getDate() - i)
        start.setHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setHours(23, 59, 59, 999)
        const count = await prisma.user.count({
          where: { createdAt: { gte: start, lte: end } },
        })
        days.push({
          day: start.toLocaleDateString('en-US', { weekday: 'short' }),
          count,
        })
      }
      return reply.send({ days })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
