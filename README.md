# ♔ Royal Chess

> Cross-platform chess with real-time voice & chat — Web + Android

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9+ → `npm install -g pnpm`
- A [Supabase](https://supabase.com) account (free)
- A [Railway](https://railway.app) account (free)
- A [Vercel](https://vercel.com) account (free)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/royal-chess.git
cd royal-chess
pnpm install
```

### 2. Set Up Environment Variables
```bash
# Server
cp apps/server/.env.example apps/server/.env
# Fill in: DATABASE_URL, REDIS_URL, JWT_SECRET

# Web
cp apps/web/.env.local.example apps/web/.env.local
# Fill in: NEXT_PUBLIC_SERVER_URL, NEXTAUTH_SECRET

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
# Fill in: EXPO_PUBLIC_SERVER_URL
```

### 3. Set Up Database
```bash
pnpm --filter=@royal-chess/server run db:push
```

### 4. Open in VS Code
```bash
code royal-chess.code-workspace
```

### 5. Run Everything
In VS Code: `Ctrl+Shift+P` → `Tasks: Run Task` → `🎮 Start Everything`

Or from terminal:
```bash
pnpm dev:server   # Terminal 1 — Backend on :3001
pnpm dev:web      # Terminal 2 — Web on :3000
pnpm dev:mobile   # Terminal 3 — Expo / Android
```

---

## Project Structure

```
royal-chess/
├── apps/
│   ├── web/          ← Next.js 14 web app
│   ├── server/       ← Fastify + Socket.io backend
│   └── mobile/       ← React Native (Expo) Android app
├── packages/
│   ├── chess-engine/ ← Shared chess logic & types (used by all apps)
│   └── config/       ← Shared constants & Socket.io event names
├── royal-chess.code-workspace  ← Open this in VS Code
└── turbo.json        ← Build pipeline
```

## Tech Stack

| App | Tech |
|-----|------|
| Web | Next.js 14, TypeScript, Tailwind CSS, Socket.io, WebRTC |
| Server | Fastify, Socket.io, Prisma, PostgreSQL (Supabase), Redis |
| Mobile | React Native (Expo), TypeScript, Socket.io, WebRTC |
| Shared | chess.js, TypeScript, Zustand |

## Development Phases

- [x] Phase 0 — Monorepo setup (you are here)
- [ ] Phase 1 — Backend foundation (Auth, DB, API)
- [ ] Phase 2 — Chess core (engine, board UI, local game)
- [ ] Phase 3 — Real-time multiplayer (Socket.io, rooms)
- [ ] Phase 4 — Android app
- [ ] Phase 5 — Chat & Voice (WebRTC)
- [ ] Phase 6 — Social (profiles, friends, Elo, leaderboard)
- [ ] Phase 7 — Spectator mode
- [ ] Phase 8 — Push notifications
- [ ] Phase 9 — Ads (AdSense + AdMob)
- [ ] Phase 10 — Polish & launch

## Deployment

| Service | Platform | Command |
|---------|----------|---------|
| Web | Vercel | Auto-deploy on push to `main` |
| Server | Railway | Auto-deploy on push to `main` |
| Android | EAS Build | `pnpm build:android` |
