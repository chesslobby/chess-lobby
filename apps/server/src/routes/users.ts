// ─────────────────────────────────────────────────────────────
//  Royal Chess — Users REST Routes
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client'

export async function registerUserRoutes(fastify: FastifyInstance) {

  // GET /users/leaderboard
  fastify.get('/leaderboard', async (_req, reply) => {
    const users = await prisma.user.findMany({
      where: { isGuest: false },
      orderBy: { eloRating: 'desc' },
      take: 100,
      select: { id: true, username: true, eloRating: true, gamesPlayed: true, gamesWon: true, avatarUrl: true, country: true },
    })
    return reply.send({ users })
  })

  // GET /users/:username
  fastify.get('/:username', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, eloRating: true, gamesPlayed: true, gamesWon: true, gamesDrawn: true, avatarUrl: true, createdAt: true, platform: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send({ user })
  })

  // GET /users/:username/elo-history
  fastify.get('/:username/elo-history', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const history = await prisma.eloHistory.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'asc' },
      take: 100,
      select: { elo: true, change: true, recordedAt: true },
    })
    return reply.send({ history })
  })
}
