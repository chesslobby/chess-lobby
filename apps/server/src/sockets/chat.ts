// ─────────────────────────────────────────────────────────────
//  Royal Chess — Chat Socket Handler
//  Events: chat:send, lobby:chat:send
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
  socket.on('chat:send', async ({ gameId, message, type }: {
    gameId: string; message: string; type: 'text' | 'emoji'
  }) => {
    if (!isAllowed(userId)) return
    if (!message?.trim() || message.length > MAX_MSG_LENGTH) return

    const sanitized = sanitize(message)

    const saved = await prisma.chatMessage.create({
      data: {
        gameId,
        senderId: userId,
        message: sanitized,
        type,
      },
    })

    io.to(gameId).emit('chat:receive', {
      id: saved.id,
      senderId: userId,
      senderName: username,
      message: sanitized,
      type,
      timestamp: saved.createdAt.getTime(),
    })
  })

  // ── Lobby chat ─────────────────────────────────────────────
  socket.on('lobby:chat:send', async ({ message }: { message: string }) => {
    if (!isAllowed(userId)) return
    if (!message?.trim() || message.length > MAX_MSG_LENGTH) return

    const sanitized = sanitize(message)

    // Save lobby messages without a gameId
    await prisma.chatMessage.create({
      data: {
        senderId: userId,
        message: sanitized,
        type: 'text',
      },
    })

    io.to(LOBBY_ROOM).emit('lobby:chat:receive', {
      senderId: userId,
      senderName: username,
      message: sanitized,
      timestamp: Date.now(),
    })
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
