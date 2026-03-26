// Shared constants across all apps
export const SOCKET_EVENTS = {
  // Matchmaking
  QUEUE_JOIN: 'queue:join',
  QUEUE_LEAVE: 'queue:leave',
  MATCH_FOUND: 'match:found',
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',

  // Game
  GAME_MOVE: 'game:move',
  GAME_OFFER_DRAW: 'game:offer-draw',
  GAME_DRAW_RESPONSE: 'game:draw-response',
  GAME_RESIGN: 'game:resign',
  GAME_END: 'game:end',
  GAME_CLOCK: 'game:clock',
  GAME_STATE: 'game:state',

  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  LOBBY_CHAT_SEND: 'lobby:chat:send',
  LOBBY_CHAT_RECEIVE: 'lobby:chat:receive',

  // Voice (WebRTC signaling)
  VOICE_JOIN: 'voice:join',
  VOICE_OFFER: 'voice:offer',
  VOICE_ANSWER: 'voice:answer',
  VOICE_ICE: 'voice:ice',
  VOICE_RELAY_OFFER: 'voice:relay:offer',
  VOICE_RELAY_ANSWER: 'voice:relay:answer',
  VOICE_RELAY_ICE: 'voice:relay:ice',
  VOICE_LEAVE: 'voice:leave',

  // Spectate
  SPECTATE_JOIN: 'spectate:join',
  SPECTATE_STATE: 'spectate:state',
  SPECTATE_MOVE: 'spectate:move',
} as const

export const API_ROUTES = {
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_GUEST: '/auth/guest',
  AUTH_ME: '/auth/me',
  USERS: '/users',
  LEADERBOARD: '/leaderboard',
  FRIENDS: '/friends',
  GAMES: '/games',
} as const

export const DEFAULT_ELO = 1200
export const ELO_FLOOR = 100
export const MAX_ROOM_CODE_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours
export const RECONNECT_TIMEOUT_MS = 60 * 1000 // 60 seconds
export const ABANDONED_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes
