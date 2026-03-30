// ─────────────────────────────────────────────────────────────
//  Royal Chess — Auth REST Routes
//  POST /auth/register, /auth/login, /auth/guest, GET /auth/me
// ─────────────────────────────────────────────────────────────

import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db/client'

const RegisterSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

function signToken(userId: string, username: string, isGuest: boolean) {
  return jwt.sign(
    { userId, username, isGuest },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  )
}

export async function registerAuthRoutes(fastify: FastifyInstance) {

  // ── Register ───────────────────────────────────────────────
  fastify.post('/register', async (req, reply) => {
    try {
      const parsed = RegisterSchema.safeParse(req.body)
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

      const { username, email, password } = parsed.data

      const exists = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      })
      if (exists) {
        return reply.status(409).send({ error: 'Username or email already taken' })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await prisma.user.create({
        data: { username, email, passwordHash },
      })

      const token = signToken(user.id, user.username, false)
      return reply.status(201).send({ token, user: safeUser(user) })
    } catch (err: any) {
      console.error('Register error:', err)
      return reply.status(500).send({ error: err.message || 'Unknown error' })
    }
  })

  // ── Login ──────────────────────────────────────────────────
  fastify.post('/login', async (req, reply) => {
    const parsed = LoginSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })

    const { email, password } = parsed.data
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } })

    const token = signToken(user.id, user.username, false)
    return reply.send({ token, user: safeUser(user) })
  })

  // ── OAuth (Google / Facebook via Supabase) ─────────────────
  fastify.post('/oauth', async (req, reply) => {
    const { email, name, provider, supabaseId } = req.body as any
    console.log('[OAuth] Request:', { email, name, provider })

    if (!email) return reply.status(400).send({ error: 'Email is required' })

    try {
      let user = await prisma.user.findFirst({ where: { email } })
      console.log('[OAuth] Existing user:', user?.id)

      if (!user) {
        let username = (name || email.split('@')[0])
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .substring(0, 20)

        const existing = await prisma.user.findFirst({ where: { username } })
        if (existing) {
          username = username.substring(0, 15) + '_' + Math.random().toString(36).substring(2, 5)
        }

        user = await prisma.user.create({
          data: {
            username,
            email,
            passwordHash: '',
            isGuest: false,
          },
        })
        console.log('[OAuth] Created user:', user.id, username)
      }

      const token = signToken(user.id, user.username, false)
      return reply.status(200).send({ token, user: safeUser(user) })
    } catch (err: any) {
      console.error('[OAuth] Error:', err.message)
      return reply.status(500).send({ error: 'OAuth login failed: ' + err.message })
    }
  })

  // ── Guest ──────────────────────────────────────────────────
  fastify.post('/guest', async (_req, reply) => {
    const username = `Guest_${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    const user = await prisma.user.create({
      data: { username, isGuest: true },
    })

    const token = signToken(user.id, user.username, true)
    return reply.status(201).send({ token, user: safeUser(user) })
  })

  // ── Me ─────────────────────────────────────────────────────
  fastify.get('/me', async (req, reply) => {
    const authHeader = req.headers.authorization
    if (!authHeader) return reply.status(401).send({ error: 'No token' })

    try {
      const token = authHeader.split(' ')[1]
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (!user) return reply.status(404).send({ error: 'User not found' })
      return reply.send({ user: safeUser(user) })
    } catch {
      return reply.status(401).send({ error: 'Invalid token' })
    }
  })
}

function safeUser(user: any) {
  const { passwordHash: _ph, ...safe } = user
  return safe
}
