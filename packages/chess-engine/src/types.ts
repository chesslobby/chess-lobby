// Shared types used across all apps
export type PlayerColor = 'w' | 'b'
export type GameResult = 'checkmate' | 'stalemate' | 'resign' | 'timeout' | 'draw' | 'abandoned'
export type TimeControl = 60 | 180 | 300 | 600 | 0 // seconds, 0 = untimed
export type RoomType = 'public' | 'private' | 'friend'
export type Platform = 'web' | 'android' | 'ios'

export interface GameState {
  gameId: string
  fen: string
  turn: PlayerColor
  pgn: string
  clocks: { w: number; b: number }
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw: boolean
  isGameOver: boolean
  lastMove: string | null
}

export interface Player {
  id: string
  username: string
  avatarUrl?: string
  eloRating: number
  color: PlayerColor
  platform: Platform
  isGuest: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  message: string
  type: 'text' | 'emoji'
  sentAt: string
}

export interface EloResult {
  newWhiteElo: number
  newBlackElo: number
  whiteChange: number
  blackChange: number
}
