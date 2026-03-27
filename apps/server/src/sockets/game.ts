// ─────────────────────────────────────────────────────────────
//  Royal Chess — Game Socket Handler
//  Events: game:move, game:resign, game:offer-draw,
//          game:draw-response, game:clock
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'
import { Chess, calculateElo } from '@royal-chess/chess-engine'
import { prisma } from '../db/client'

interface ActiveGame {
  chess: Chess
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
const activeGames = new Map<string, ActiveGame>()

export function registerGameHandlers(io: Server, socket: Socket) {
  const { userId } = socket.data

  // ── Player ready (both players have loaded) ────────────────
  socket.on('game:ready', ({ gameId }: { gameId: string }) => {
    const game = activeGames.get(gameId)

    if (!game) {
      // First player ready — initialise game state
      initActiveGame(io, socket, gameId)
      return
    }

    // Second player ready — start clock
    startClock(io, gameId)
    io.to(gameId).emit('game:start', {
      fen: game.chess.fen(),
      turn: game.chess.turn(),
      clocks: game.clocks,
    })
  })

  // ── Player makes a move ────────────────────────────────────
  socket.on('game:move', async ({ gameId, from, to, promotion }: {
    gameId: string; from: string; to: string; promotion?: string
  }) => {
    const game = activeGames.get(gameId)
    if (!game) return

    const expectedId = game.chess.turn() === 'w' ? game.whiteId : game.blackId
    if (userId !== expectedId) return  // not your turn

    try {
      const move = game.chess.move({ from, to, promotion: promotion ?? 'q' })

      // Broadcast move to everyone in the room (opponent + spectators)
      io.to(gameId).emit('game:move', {
        from: move.from,
        to: move.to,
        san: move.san,
        promotion: move.promotion,
        fen: game.chess.fen(),
        turn: game.chess.turn(),
        clocks: game.clocks,
      })

      game.pgn.push(move.san)

      // Check for game end
      if (game.chess.isGameOver()) {
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
    include: {
      whitePlayer: { select: { id: true } },
      blackPlayer: { select: { id: true } },
    },
  })

  if (!dbGame) {
    socket.emit('game:error', { message: 'Game not found' })
    return
  }

  // Find sockets for white and black
  const roomSockets = await io.in(gameId).fetchSockets()
  const whiteSock = roomSockets.find(s => s.data.userId === dbGame.whitePlayerId)
  const blackSock = roomSockets.find(s => s.data.userId === dbGame.blackPlayerId)

  const game: ActiveGame = {
    chess: new Chess(),
    whiteId: dbGame.whitePlayerId,
    blackId: dbGame.blackPlayerId,
    whiteSocketId: whiteSock?.id ?? '',
    blackSocketId: blackSock?.id ?? '',
    clocks: {
      w: dbGame.timeControl * 1000,
      b: dbGame.timeControl * 1000,
    },
    lastTick: Date.now(),
    timeControl: dbGame.timeControl,
    clockInterval: null,
    drawOfferedBy: null,
    pgn: [],
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

  if (game.chess.isCheckmate()) {
    result = 'checkmate'
    winnerId = game.chess.turn() === 'w' ? game.blackId : game.whiteId
  } else {
    result = game.chess.isStalemate() ? 'stalemate' : 'draw'
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

  // Calculate Elo
  const [whiteUser, blackUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: game.whiteId } }),
    prisma.user.findUnique({ where: { id: game.blackId } }),
  ])

  if (!whiteUser || !blackUser) return

  const eloResult = winnerId === game.whiteId ? 'white' : winnerId === null ? 'draw' : 'black'

  const { newWhiteElo, newBlackElo, whiteChange, blackChange } = calculateElo(
    whiteUser.eloRating, blackUser.eloRating, eloResult, whiteUser.gamesPlayed, blackUser.gamesPlayed
  )

  const pgn = game.chess.pgn() || game.pgn.join(' ')

  // Persist to DB
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

  io.to(gameId).emit('game:end', {
    result,
    winnerId,
    eloChanges: {
      [game.whiteId]: { before: whiteUser.eloRating, after: newWhiteElo, change: whiteChange },
      [game.blackId]: { before: blackUser.eloRating, after: newBlackElo, change: blackChange },
    },
  })
}
