// ─────────────────────────────────────────────────────────────
//  Royal Chess — Users REST Routes (including Friends)
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'

async function verifyToken(req: any, reply: any) {
  const auth = req.headers.authorization
  if (!auth) return reply.status(401).send({ error: 'No token' })
  try {
    const token = auth.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.userId = payload.userId
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}

export async function registerUserRoutes(fastify: FastifyInstance) {

  // GET /users/leaderboard
  fastify.get('/leaderboard', async (_req, reply) => {
    const users = await prisma.user.findMany({
      where: { isGuest: false },
      orderBy: { eloRating: 'desc' },
      take: 100,
      select: { id: true, username: true, eloRating: true, gamesPlayed: true, gamesWon: true, avatarUrl: true },
    })
    return reply.send({ users })
  })

  // GET /users/:username
  fastify.get('/:username', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, eloRating: true, gamesPlayed: true, gamesWon: true, gamesDraw: true, avatarUrl: true, createdAt: true, platform: true },
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

// ── Friend routes registered on /friends prefix ───────────────
export async function registerFriendRoutes(fastify: FastifyInstance) {

  // POST /friends/request/:username
  fastify.post('/request/:username', { preHandler: verifyToken }, async (req: any, reply) => {
    const { username } = req.params as { username: string }
    const senderId: string = req.userId

    const receiver = await prisma.user.findUnique({ where: { username } })
    if (!receiver) return reply.status(404).send({ error: 'User not found' })
    if (receiver.id === senderId) return reply.status(400).send({ error: 'Cannot send request to yourself' })

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
      },
    })
    if (existing) return reply.status(400).send({ error: 'Friend request already exists' })

    await prisma.friendship.create({
      data: { senderId, receiverId: receiver.id },
    })
    return reply.send({ success: true })
  })

  // GET /friends
  fastify.get('/', { preHandler: verifyToken }, async (req: any, reply) => {
    const userId: string = req.userId
    const friends = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender:   { select: { id: true, username: true, eloRating: true, lastSeen: true } },
        receiver: { select: { id: true, username: true, eloRating: true, lastSeen: true } },
      },
    })
    const list = friends.map(f => {
      const friend = f.senderId === userId ? f.receiver : f.sender
      const online = (Date.now() - new Date(friend.lastSeen).getTime()) < 5 * 60 * 1000
      return { ...friend, online }
    })
    return reply.send({ friends: list })
  })

  // GET /friends/requests
  fastify.get('/requests', { preHandler: verifyToken }, async (req: any, reply) => {
    const userId: string = req.userId
    const requests = await prisma.friendship.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: { sender: { select: { id: true, username: true, eloRating: true } } },
    })
    return reply.send({ requests })
  })

  // POST /friends/accept/:userId
  fastify.post('/accept/:userId', { preHandler: verifyToken }, async (req: any, reply) => {
    const { userId: senderId } = req.params as { userId: string }
    const receiverId: string = req.userId

    const friendship = await prisma.friendship.findFirst({
      where: { senderId, receiverId, status: 'pending' },
    })
    if (!friendship) return reply.status(404).send({ error: 'Request not found' })

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'accepted' },
    })
    return reply.send({ success: true })
  })
}
