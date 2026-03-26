// ─────────────────────────────────────────────────────────────
//  Royal Chess — Socket.io Auth Middleware
//  Verifies JWT on every socket connection
// ─────────────────────────────────────────────────────────────

import { Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

interface TokenPayload {
  userId: string
  username: string
  isGuest: boolean
}

export function authMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1]

  if (!token) {
    // Allow guest connections with a temporary ID
    socket.data.userId = `guest_${socket.id}`
    socket.data.username = 'Guest'
    socket.data.isGuest = true
    return next()
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    socket.data.userId = payload.userId
    socket.data.username = payload.username
    socket.data.isGuest = payload.isGuest
    next()
  } catch {
    next(new Error('Invalid or expired token'))
  }
}
