// ─────────────────────────────────────────────────────────────
//  Prisma Client — Singleton + keepalive for Supabase free tier
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma
}

// Ping every 30 s so Supabase free tier doesn't pause the connection
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {}
}, 30_000)
