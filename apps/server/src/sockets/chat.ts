// ─────────────────────────────────────────────────────────────
//  Royal Chess — Chat Socket Handler
//  Events: chat:send, lobby:chat:send, lobby:online-count
// ─────────────────────────────────────────────────────────────

import { Server, Socket } from 'socket.io'
import { prisma } from '../db/client'

const LOBBY_ROOM = 'lobby'
const MAX_MSG_LENGTH = 300
const RATE_LIMIT_MS = 500  // min ms between messages per user
const lastMessageTime = new Map<string, number>()

export function registerChatHandlers(io: Server, socket: Socket) {
  const { userId, username } = socket.data

  // Join global lobby room automatically
  socket.join(LOBBY_ROOM)

  // ── In-game chat ───────────────────────────────────────────
  // type: 'text' | 'emoji' | 'quick' | 'system' | 'spectator' | 'player'
  socket.on('chat:send', async ({ gameId, message, type }: {
    gameId: string; message: string; type: string
  }) => {
    if (!isAllowed(userId)) return
    if (!message?.trim() || message.length > MAX_MSG_LENGTH) return

    const sanitized = sanitize(message)
    const msgType = type || 'text'

    // Fire-and-forget — don't block socket relay on the DB write
    prisma.chatMessage.create({
      data: { gameId, senderId: userId, message: sanitized, type: msgType },
    }).catch(err => console.error('[Chat] save failed:', err.message))

    const payload = {
      senderId: userId,
      senderName: username,
      message: sanitized,
      type: msgType,
      timestamp: Date.now(),
    }

    // Relay to the rest of the room — exclude sender (client adds its own message optimistically)
    socket.to(gameId).emit('chat:receive', payload)
  })

  // ── Spectator chat (same room, tagged type) ────────────────
  socket.on('chat:spectator', async ({ gameId, message }: {
    gameId: string; message: string
  }) => {
    if (!isAllowed(userId)) return
    if (!message?.trim() || message.length > MAX_MSG_LENGTH) return

    const sanitized = sanitize(message)

    io.to(gameId).emit('chat:receive', {
      senderId: userId,
      senderName: username,
      message: sanitized,
      type: 'spectator',
      timestamp: Date.now(),
    })
  })

  // ── Lobby chat ─────────────────────────────────────────────
  socket.on('lobby:chat:send', async ({ message }: { message: string }) => {
    if (!isAllowed(userId)) return
    if (!message?.trim() || message.length > MAX_MSG_LENGTH) return

    const sanitized = sanitize(message)

    prisma.chatMessage.create({
      data: { senderId: userId, message: sanitized, type: 'text', isLobby: true },
    }).catch(err => console.error('[Chat] lobby save failed:', err.message))

    io.to(LOBBY_ROOM).emit('lobby:chat:receive', {
      senderId: userId,
      senderName: username,
      message: sanitized,
      timestamp: Date.now(),
    })
  })

  // ── Online count ───────────────────────────────────────────
  socket.on('lobby:online-count', () => {
    const count = io.engine.clientsCount
    socket.emit('lobby:online-count', count)
  })
}

// ── Helpers ───────────────────────────────────────────────────

function isAllowed(userId: string): boolean {
  const last = lastMessageTime.get(userId) ?? 0
  const now = Date.now()
  if (now - last < RATE_LIMIT_MS) return false
  lastMessageTime.set(userId, now)
  return true
}

function sanitize(text: string): string {
  return text
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, MAX_MSG_LENGTH)
}
