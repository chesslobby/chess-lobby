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
      select: { id: true, username: true, eloRating: true, gamesPlayed: true, gamesWon: true, country: true },
    })
    return reply.send({ users })
  })

  // GET /users/by-username/:username — public profile with follow/block status
  fastify.get('/by-username/:username', async (req: any, reply) => {
    const { username } = req.params as { username: string }

    let viewerId: string | null = null
    const auth = req.headers.authorization
    if (auth) {
      try {
        const token = auth.split(' ')[1]
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
        viewerId = payload.userId
      } catch {}
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, eloRating: true, gamesPlayed: true,
        gamesWon: true, gamesDraw: true, avatarUrl: true, createdAt: true,
        platform: true, country: true,
      },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    let isFollowing = false
    let isBlocked = false
    if (viewerId && viewerId !== user.id) {
      const [follow, block] = await Promise.all([
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } }),
        prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } } }),
      ])
      isFollowing = !!follow
      isBlocked = !!block
    }

    return reply.send({ user, isFollowing, isBlocked, isSelf: viewerId === user.id })
  })

  // POST /users/follow/:userId — toggle follow
  fastify.post('/follow/:userId', { preHandler: verifyToken }, async (req: any, reply) => {
    const { userId: targetId } = req.params as { userId: string }
    const followerId = req.userId
    if (followerId === targetId) return reply.status(400).send({ error: 'Cannot follow yourself' })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: targetId } },
    })

    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId: targetId } } })
      return reply.send({ following: false })
    } else {
      await prisma.follow.create({ data: { followerId, followingId: targetId } })
      return reply.send({ following: true })
    }
  })

  // POST /users/block/:userId — toggle block
  fastify.post('/block/:userId', { preHandler: verifyToken }, async (req: any, reply) => {
    const { userId: targetId } = req.params as { userId: string }
    const blockerId = req.userId
    if (blockerId === targetId) return reply.status(400).send({ error: 'Cannot block yourself' })

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId: targetId } },
    })

    if (existing) {
      await prisma.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId: targetId } } })
      return reply.send({ blocked: false })
    } else {
      await prisma.block.create({ data: { blockerId, blockedId: targetId } })
      return reply.send({ blocked: true })
    }
  })

  // PUT /users/profile — update country
  fastify.put('/profile', { preHandler: verifyToken }, async (req: any, reply) => {
    const { country } = req.body as { country?: string }
    const userId = req.userId

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { country: country || null },
      select: { id: true, username: true, country: true },
    })
    return reply.send({ user: updated })
  })

  // POST /users/avatar — store as base64 data URL
  fastify.post('/avatar', { preHandler: verifyToken }, async (req: any, reply) => {
    const { imageBase64, mimeType } = req.body as { imageBase64: string; mimeType: string }
    const userId = req.userId

    if (!imageBase64 || !mimeType) return reply.status(400).send({ error: 'Missing fields' })
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return reply.status(400).send({ error: 'Invalid image type' })
    }
    if (imageBase64.length > 3_500_000) return reply.status(400).send({ error: 'Image too large (max 2MB)' })

    const avatarUrl = `data:${mimeType};base64,${imageBase64}`
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl } })
    return reply.send({ avatarUrl })
  })

  // GET /users/:username
  fastify.get('/:username', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, eloRating: true, gamesPlayed: true,
        gamesWon: true, gamesDraw: true, avatarUrl: true, createdAt: true,
        platform: true, country: true,
      },
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

  // GET /users/:username/followers
  fastify.get('/:username/followers', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const rows = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { id: true, username: true, eloRating: true, country: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ followers: rows.map(r => r.follower) })
  })

  // GET /users/:username/following
  fastify.get('/:username/following', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const rows = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, username: true, eloRating: true, country: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ following: rows.map(r => r.following) })
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
