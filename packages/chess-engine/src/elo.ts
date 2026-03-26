// Standard Elo rating calculation (FIDE-style)
import type { EloResult } from './types'

function getKFactor(elo: number, gamesPlayed: number): number {
  if (gamesPlayed < 30) return 40
  if (elo >= 2400) return 10
  return 20
}

function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

export function calculateElo(
  whiteElo: number,
  blackElo: number,
  result: 'white' | 'black' | 'draw',
  whiteGamesPlayed: number,
  blackGamesPlayed: number
): EloResult {
  const kWhite = getKFactor(whiteElo, whiteGamesPlayed)
  const kBlack = getKFactor(blackElo, blackGamesPlayed)

  const expectedWhite = expectedScore(whiteElo, blackElo)
  const expectedBlack = expectedScore(blackElo, whiteElo)

  const actualWhite = result === 'white' ? 1 : result === 'draw' ? 0.5 : 0
  const actualBlack = result === 'black' ? 1 : result === 'draw' ? 0.5 : 0

  const whiteChange = Math.round(kWhite * (actualWhite - expectedWhite))
  const blackChange = Math.round(kBlack * (actualBlack - expectedBlack))

  const ELO_FLOOR = 100
  return {
    newWhiteElo: Math.max(ELO_FLOOR, whiteElo + whiteChange),
    newBlackElo: Math.max(ELO_FLOOR, blackElo + blackChange),
    whiteChange,
    blackChange,
  }
}
