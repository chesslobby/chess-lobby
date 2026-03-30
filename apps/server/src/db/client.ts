// ─────────────────────────────────────────────────────────────
//  Prisma Client — Singleton
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
// Note: keepalive SELECT 1 removed — it consumed one of the pooled connections
// every 30 s, exhausting the pool. Supabase pgBouncer keeps connections alive.
