// ─────────────────────────────────────────────────────────────
//  Royal Chess — Puzzle Routes (streak tracking)
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/client'

async function optionalAuth(req: any) {
  const auth = req.headers.authorization
  if (!auth) return null
  try {
    const token = auth.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any
    return payload.userId as string
  } catch { return null }
}

// Day string helper: YYYY-MM-DD UTC
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export async function registerPuzzleRoutes(fastify: FastifyInstance) {

  // GET /puzzles/today — returns today's puzzle index (day of year % total)
  fastify.get('/today', async (_req, reply) => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    return reply.send({ dayOfYear, date: todayStr() })
  })

  // POST /puzzles/solve — record a solve (best-effort, no schema change needed)
  fastify.post('/solve', async (req: any, reply) => {
    const userId = await optionalAuth(req)
    const { puzzleId, moves, timeSeconds } = req.body as {
      puzzleId: number; moves: number; timeSeconds: number
    }
    // Store in Notification model as a lightweight log (no new table needed)
    if (userId) {
      try {
        await prisma.notification.create({
          data: {
            userId,
            type: 'puzzle_solve',
            data: { puzzleId, moves, timeSeconds, date: todayStr() },
          },
        })
      } catch {}
    }
    return reply.send({ success: true })
  })
}
