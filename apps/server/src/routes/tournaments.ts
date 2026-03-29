// ─────────────────────────────────────────────────────────────
//  Royal Chess — Tournament Routes
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

// Hardcoded daily arenas (schedule-based, not in DB)
const HARDCODED_ARENAS = [
  { id: 'daily-blitz',  name: '⚡ Daily Blitz Arena', timeControl: 180, duration: 60, schedule: 'Daily at 8 PM IST', type: 'arena' },
  { id: 'daily-bullet', name: '🔥 Daily Bullet Arena', timeControl: 60,  duration: 30, schedule: 'Daily at 9 PM IST', type: 'arena' },
  { id: 'weekend-rapid',name: '📚 Weekend Rapid',     timeControl: 600, duration: 90, schedule: 'Saturdays at 6 PM IST', type: 'arena' },
]

export async function registerTournamentRoutes(fastify: FastifyInstance) {

  // GET /tournaments — list all tournaments (DB + hardcoded arenas)
  fastify.get('/', async (_req, reply) => {
    const dbTournaments = await prisma.tournament.findMany({
      orderBy: { startTime: 'desc' },
      take: 20,
      include: { _count: { select: { players: true } } },
    })
    return reply.send({ tournaments: dbTournaments, arenas: HARDCODED_ARENAS })
  })

  // GET /tournaments/:id — get tournament details + standings
  fastify.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    // Check hardcoded arena first
    const arena = HARDCODED_ARENAS.find(a => a.id === id)
    if (arena) return reply.send({ tournament: arena, players: [], isArena: true })

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          orderBy: [{ score: 'desc' }, { buchholz: 'desc' }],
          include: { user: { select: { id: true, username: true, eloRating: true, country: true } } },
        },
        games: { orderBy: { round: 'asc' } },
      },
    })
    if (!tournament) return reply.status(404).send({ error: 'Tournament not found' })
    return reply.send({ tournament, isArena: tournament.type === 'arena' })
  })

  // POST /tournaments/:id/join — register for tournament
  fastify.post('/:id/join', { preHandler: verifyToken }, async (req: any, reply) => {
    const { id } = req.params as { id: string }
    const userId = req.userId

    // Hardcoded arenas just return success (in-memory only)
    if (HARDCODED_ARENAS.find(a => a.id === id)) {
      return reply.send({ success: true, message: 'Joined arena — use socket to play' })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) return reply.status(404).send({ error: 'Tournament not found' })
    if (tournament.status !== 'waiting') return reply.status(400).send({ error: 'Tournament already started' })

    const count = await prisma.tournamentPlayer.count({ where: { tournamentId: id } })
    if (count >= tournament.maxPlayers) return reply.status(400).send({ error: 'Tournament is full' })

    await prisma.tournamentPlayer.upsert({
      where: { tournamentId_userId: { tournamentId: id, userId } },
      create: { tournamentId: id, userId },
      update: {},
    })
    return reply.send({ success: true })
  })

  // GET /tournaments/:id/standings
  fastify.get('/:id/standings', async (req, reply) => {
    const { id } = req.params as { id: string }
    const players = await prisma.tournamentPlayer.findMany({
      where: { tournamentId: id },
      orderBy: [{ score: 'desc' }, { buchholz: 'desc' }],
      include: { user: { select: { id: true, username: true, eloRating: true, country: true } } },
    })
    return reply.send({ standings: players.map((p, i) => ({ rank: i + 1, ...p })) })
  })

  // POST /tournaments/swiss/create
  fastify.post('/swiss/create', { preHandler: verifyToken }, async (req: any, reply) => {
    const { name, timeControl, rounds, maxPlayers, startTime } = req.body as {
      name: string; timeControl: number; rounds: number; maxPlayers: number; startTime: string
    }
    if (!name || !timeControl || !startTime) return reply.status(400).send({ error: 'Missing fields' })

    const tournament = await prisma.tournament.create({
      data: {
        name,
        type: 'swiss',
        timeControl,
        rounds: rounds || 5,
        maxPlayers: maxPlayers || 16,
        startTime: new Date(startTime),
        status: 'waiting',
      },
    })
    return reply.send({ tournament })
  })

  // POST /tournaments/swiss/:id/register
  fastify.post('/swiss/:id/register', { preHandler: verifyToken }, async (req: any, reply) => {
    const { id } = req.params as { id: string }
    const userId = req.userId

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament || tournament.type !== 'swiss') return reply.status(404).send({ error: 'Swiss tournament not found' })
    if (tournament.status !== 'waiting') return reply.status(400).send({ error: 'Registration closed' })

    await prisma.tournamentPlayer.upsert({
      where: { tournamentId_userId: { tournamentId: id, userId } },
      create: { tournamentId: id, userId },
      update: {},
    })
    return reply.send({ success: true })
  })

  // POST /tournaments/swiss/:id/start — generate round 1 pairings
  fastify.post('/swiss/:id/start', { preHandler: verifyToken }, async (req: any, reply) => {
    const { id } = req.params as { id: string }
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { players: true },
    })
    if (!tournament) return reply.status(404).send({ error: 'Not found' })
    if (tournament.status !== 'waiting') return reply.status(400).send({ error: 'Already started' })

    const players = [...tournament.players].sort(() => Math.random() - 0.5)
    const pairings = []
    for (let i = 0; i < players.length - 1; i += 2) {
      pairings.push({
        tournamentId: id,
        round: 1,
        whiteId: players[i].userId,
        blackId: players[i + 1].userId,
      })
    }
    // Bye for odd player
    if (players.length % 2 === 1) {
      const byePlayer = players[players.length - 1]
      pairings.push({
        tournamentId: id,
        round: 1,
        whiteId: byePlayer.userId,
        blackId: byePlayer.userId,
        result: 'bye',
      })
    }

    await prisma.$transaction([
      prisma.tournament.update({ where: { id }, data: { status: 'active' } }),
      prisma.tournamentGame.createMany({ data: pairings as any }),
    ])
    return reply.send({ success: true, pairings })
  })

  // GET /tournaments/swiss/:id/pairings
  fastify.get('/swiss/:id/pairings', async (req, reply) => {
    const { id } = req.params as { id: string }
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        games: {
          orderBy: { round: 'asc' },
          include: {
            white: { select: { id: true, username: true, eloRating: true } },
          },
        },
        players: {
          orderBy: [{ score: 'desc' }, { buchholz: 'desc' }],
          include: { user: { select: { id: true, username: true, eloRating: true } } },
        },
      },
    })
    if (!tournament) return reply.status(404).send({ error: 'Not found' })
    return reply.send({ tournament })
  })
}
