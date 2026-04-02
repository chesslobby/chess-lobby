// ─────────────────────────────────────────────────────────────
//  Royal Chess — Game Socket Handler
//  Events: game:move, game:resign, game:offer-draw,
//          game:draw-response, game:clock
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'
// chess.js 0.12.0 exports { Chess } as a named CommonJS export
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chess = require('chess.js').Chess
import { prisma } from '../db/client'
import { pendingGames } from './matchmaking'

function calculateElo(
  whiteElo: number,
  blackElo: number,
  result: 'white' | 'black' | 'draw',
  whiteGamesPlayed: number,
  blackGamesPlayed: number
) {
  const kFactor = (elo: number, games: number) => games < 30 ? 40 : elo >= 2400 ? 10 : 20
  const expected = (a: number, b: number) => 1 / (1 + Math.pow(10, (b - a) / 400))
  const kWhite = kFactor(whiteElo, whiteGamesPlayed)
  const kBlack = kFactor(blackElo, blackGamesPlayed)
  const expWhite = expected(whiteElo, blackElo)
  const expBlack = expected(blackElo, whiteElo)
  const actualWhite = result === 'white' ? 1 : result === 'draw' ? 0.5 : 0
  const actualBlack = result === 'black' ? 1 : result === 'draw' ? 0.5 : 0
  const whiteChange = Math.round(kWhite * (actualWhite - expWhite))
  const blackChange = Math.round(kBlack * (actualBlack - expBlack))
  return {
    newWhiteElo: Math.max(100, whiteElo + whiteChange),
    newBlackElo: Math.max(100, blackElo + blackChange),
    whiteChange,
    blackChange,
  }
}

interface ActiveGame {
  chess: any
  whiteId: string
  blackId: string
  whiteSocketId: string
  blackSocketId: string
  clocks: { w: number; b: number }   // ms remaining
  lastTick: number                    // Date.now() of last tick
  timeControl: number
  clockInterval: NodeJS.Timeout | null
  drawOfferedBy: string | null
  pgn: string[]
}

// gameId → ActiveGame
const activeGames  = new Map<string, ActiveGame>()
// gameId → Set of userIds that have sent game:ready
const readyPlayers = new Map<string, Set<string>>()
// gameId → timestamp of last game:start emission
// Using a Map (not a Set) so we can re-emit if both players reconnect within 5 s
const startedGames = new Map<string, number>()

export function registerGameHandlers(io: Server, socket: Socket) {
  const { userId } = socket.data

  // ── Player ready (both players have loaded) ────────────────
  socket.on('game:ready', async ({ gameId }: { gameId: string }) => {
    // JOIN the socket.io room — await so the join completes before we check room size
    await socket.join(gameId)
    console.log(`[Room] ${socket.data.username} joined room ${gameId} | room size: ${io.sockets.adapter.rooms.get(gameId)?.size ?? 0}`)

    // Initialize the set if it doesn't exist
    if (!readyPlayers.has(gameId)) {
      readyPlayers.set(gameId, new Set())
    }

    const ready = readyPlayers.get(gameId)!
    ready.add(userId)

    // Initialise active game if not exists
    if (!activeGames.has(gameId)) {
      await initActiveGame(io, socket, gameId)
    }

    const game = activeGames.get(gameId)
    if (!game) {
      console.error('[Game] Game not found after init:', gameId)
      return
    }

    // Update socket IDs
    if (userId === game.whiteId) game.whiteSocketId = socket.id
    if (userId === game.blackId) game.blackSocketId = socket.id

    console.log(`[Game] Ready: ${socket.data.username} for game ${gameId}. Ready count: ${ready.size}`)

    // Start when both ready.
    // Allow re-emission if both players reconnected and the last start was > 5 s ago —
    // this handles the case where game:start was sent to a stale socket and never received.
    const lastStarted = startedGames.get(gameId) ?? 0
    const alreadyStartedRecently = Date.now() - lastStarted < 5000
    if (ready.size >= 2 && !alreadyStartedRecently) {
      startedGames.set(gameId, Date.now())
      readyPlayers.delete(gameId)
      startClock(io, gameId)

      const startPayload = {
        fen:    game.chess.fen(),
        turn:   game.chess.turn(),
        clocks: game.clocks,
        white:  { id: game.whiteId },
        black:  { id: game.blackId },
      }

      // Emit to each player's current socket individually (handles reconnected sockets)
      const whiteSocket = io.sockets.sockets.get(game.whiteSocketId)
      const blackSocket = io.sockets.sockets.get(game.blackSocketId)
      if (whiteSocket) whiteSocket.emit('game:start', startPayload)
      if (blackSocket) blackSocket.emit('game:start', startPayload)
      // Room broadcast as belt-and-suspenders for spectators / edge cases
      io.to(gameId).emit('game:start', startPayload)

      console.log(`[Game] Started ${gameId} | white socket ok: ${!!whiteSocket} | black socket ok: ${!!blackSocket}`)
    }
  })

  // ── Player makes a move ────────────────────────────────────
  socket.on('game:move', async ({ gameId, from, to, promotion }: {
    gameId: string; from: string; to: string; promotion?: string
  }) => {
    console.log(`[Move] Received from ${socket.data.username}: ${from}-${to}`)
    console.log(`[Move] Room ${gameId} has ${io.sockets.adapter.rooms.get(gameId)?.size ?? 0} sockets`)

    const game = activeGames.get(gameId)
    if (!game) return

    const expectedId = game.chess.turn() === 'w' ? game.whiteId : game.blackId
    if (userId !== expectedId) return  // not your turn

    try {
      const move = game.chess.move({ from, to, promotion: promotion ?? 'q' })

      const moveFen = game.chess.fen()
      console.log(`[Move] Broadcasting FEN: ${moveFen.substring(0, 40)}`)

      // Broadcast move to everyone in the room (opponent + spectators + sender for FEN/clock sync)
      io.to(gameId).emit('game:move', {
        from: move.from,
        to: move.to,
        san: move.san,
        promotion: move.promotion || null,
        fen: moveFen,
        turn: game.chess.turn(),
        clocks: game.clocks,
      })

      const roomSockets = io.sockets.adapter.rooms.get(gameId)
      console.log(`[Move] Emitted game:move to room. Sockets in room:`, [...(roomSockets || [])])
      console.log(`[Move] Broadcast to room ${gameId}: ${move.san} | room size: ${roomSockets?.size ?? 0}`)

      game.pgn.push(move.san)

      // Check for game end
      if (game.chess.game_over()) {
        await handleGameEnd(io, gameId, game)
      }
    } catch {
      socket.emit('game:invalid-move', { from, to })
    }
  })

  // ── Resign ─────────────────────────────────────────────────
  socket.on('game:resign', async ({ gameId }: { gameId: string }) => {
    const game = activeGames.get(gameId)
    if (!game) return

    const winnerId = game.whiteId === userId ? game.blackId : game.whiteId
    await endGame(io, gameId, game, 'resign', winnerId)
  })

  // ── Offer draw ─────────────────────────────────────────────
  socket.on('game:draw-offer', ({ gameId }: { gameId: string }) => {
    const game = activeGames.get(gameId)
    if (!game) return

    game.drawOfferedBy = userId
    // Send only to opponent
    const opponentId = game.whiteId === userId ? game.blackSocketId : game.whiteSocketId
    io.to(opponentId).emit('game:draw-offered', { by: userId })
  })

  // ── Respond to draw offer ──────────────────────────────────
  socket.on('game:draw-response', async ({ gameId, accept }: { gameId: string; accept: boolean }) => {
    const game = activeGames.get(gameId)
    if (!game || game.drawOfferedBy === userId) return  // can't respond to own offer

    if (accept) {
      await endGame(io, gameId, game, 'draw', null)
    } else {
      game.drawOfferedBy = null
      const offererSocketId = game.whiteId === game.drawOfferedBy ? game.whiteSocketId : game.blackSocketId
      io.to(offererSocketId).emit('game:draw-declined')
    }
  })

  // ── Disconnect handling ────────────────────────────────────
  socket.on('disconnect', () => {
    // Give player 60 seconds to reconnect before forfeiting
    for (const [gameId, game] of activeGames.entries()) {
      if (game.whiteSocketId === socket.id || game.blackSocketId === socket.id) {
        const isWhite = game.whiteSocketId === socket.id
        io.to(gameId).emit('game:opponent-disconnected', {
          color: isWhite ? 'w' : 'b',
          reconnectTimeout: 60,
        })

        setTimeout(async () => {
          if (!activeGames.has(gameId)) return  // already ended
          const winnerId = isWhite ? game.blackId : game.whiteId
          await endGame(io, gameId, game, 'timeout', winnerId)
        }, 60_000)
      }
    }
  })
}

// ── Initialise active game ─────────────────────────────────────

async function initActiveGame(io: Server, socket: Socket, gameId: string) {
  const dbGame = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id:            true,
      whitePlayerId: true,
      blackPlayerId: true,
      timeControl:   true,
      whiteEloBefore: true,
      blackEloBefore: true,
    },
  })

  if (!dbGame) {
    socket.emit('game:error', { message: 'Game not found' })
    return
  }

  // Assign the current socket's ID to whichever colour this player is.
  // The second player's socket ID will be filled in when they call game:ready.
  const game: ActiveGame = {
    chess:         new Chess(),
    whiteId:       dbGame.whitePlayerId,
    blackId:       dbGame.blackPlayerId,
    whiteSocketId: socket.data.userId === dbGame.whitePlayerId ? socket.id : '',
    blackSocketId: socket.data.userId === dbGame.blackPlayerId ? socket.id : '',
    clocks: {
      w: dbGame.timeControl * 1000,
      b: dbGame.timeControl * 1000,
    },
    lastTick:      Date.now(),
    timeControl:   dbGame.timeControl,
    clockInterval: null,
    drawOfferedBy: null,
    pgn:           [],
  }

  activeGames.set(gameId, game)
}

// ── Clock ──────────────────────────────────────────────────────

function startClock(io: Server, gameId: string) {
  const game = activeGames.get(gameId)
  if (!game || game.timeControl === 0) return

  game.lastTick = Date.now()

  game.clockInterval = setInterval(async () => {
    const g = activeGames.get(gameId)
    if (!g) return

    const now = Date.now()
    const elapsed = now - g.lastTick
    g.lastTick = now

    const turn = g.chess.turn()
    g.clocks[turn] -= elapsed

    if (g.clocks[turn] <= 0) {
      g.clocks[turn] = 0
      const winnerId = turn === 'w' ? g.blackId : g.whiteId
      await endGame(io, gameId, g, 'timeout', winnerId)
      return
    }

    io.to(gameId).emit('game:clock', { clocks: g.clocks })
  }, 1000)
}

// ── End game ───────────────────────────────────────────────────

async function handleGameEnd(io: Server, gameId: string, game: ActiveGame) {
  let result: 'checkmate' | 'stalemate' | 'draw'
  let winnerId: string | null = null

  if (game.chess.in_checkmate()) {
    result = 'checkmate'
    winnerId = game.chess.turn() === 'w' ? game.blackId : game.whiteId
  } else {
    result = game.chess.in_stalemate() ? 'stalemate' : 'draw'
  }

  await endGame(io, gameId, game, result, winnerId)
}

async function endGame(
  io: Server,
  gameId: string,
  game: ActiveGame,
  result: string,
  winnerId: string | null
) {
  if (game.clockInterval) clearInterval(game.clockInterval)
  activeGames.delete(gameId)
  startedGames.delete(gameId)   // Map.delete — same API as Set
  // Clear pending-game entries so reconnecting players don't get stale match:found
  pendingGames.delete(game.whiteId)
  pendingGames.delete(game.blackId)

  // DB updates are best-effort — a connection drop must not prevent the clients
  // from receiving game:end and returning to the lobby.
  let eloChanges: Record<string, any> = {}

  try {
    const [whiteUser, blackUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: game.whiteId } }),
      prisma.user.findUnique({ where: { id: game.blackId } }),
    ])

    if (whiteUser && blackUser) {
      const eloResult = winnerId === game.whiteId ? 'white' : winnerId === null ? 'draw' : 'black'

      const { newWhiteElo, newBlackElo, whiteChange, blackChange } = calculateElo(
        whiteUser.eloRating, blackUser.eloRating, eloResult, whiteUser.gamesPlayed, blackUser.gamesPlayed
      )

      const pgn = game.chess.pgn() || game.pgn.join(' ')

      await prisma.$transaction([
        prisma.game.update({
          where: { id: gameId },
          data: {
            result: result as any,
            winnerId,
            pgn,
            fen: game.chess.fen(),
            eloChangeWhite: whiteChange,
            eloChangeBlack: blackChange,
            endedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: game.whiteId },
          data: {
            eloRating: newWhiteElo,
            gamesPlayed: { increment: 1 },
            gamesWon: winnerId === game.whiteId ? { increment: 1 } : undefined,
            gamesDraw: winnerId === null ? { increment: 1 } : undefined,
          },
        }),
        prisma.user.update({
          where: { id: game.blackId },
          data: {
            eloRating: newBlackElo,
            gamesPlayed: { increment: 1 },
            gamesWon: winnerId === game.blackId ? { increment: 1 } : undefined,
            gamesDraw: winnerId === null ? { increment: 1 } : undefined,
          },
        }),
        prisma.eloHistory.createMany({
          data: [
            { userId: game.whiteId, elo: newWhiteElo, change: whiteChange, gameId },
            { userId: game.blackId, elo: newBlackElo, change: blackChange, gameId },
          ],
        }),
      ])

      eloChanges = {
        [game.whiteId]: { before: whiteUser.eloRating, after: newWhiteElo, change: whiteChange },
        [game.blackId]: { before: blackUser.eloRating, after: newBlackElo, change: blackChange },
      }
    }
  } catch (err) {
    console.error('endGame DB error (non-fatal):', err)
  }

  // Always notify clients — even if DB write failed
  io.to(gameId).emit('game:end', { result, winnerId, eloChanges })
}
