import { io, Socket } from 'socket.io-client'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

let socket: Socket | null = null

export function getSocket(): Socket {
  // Reuse only if already connected
  if (socket?.connected) return socket

  // Tear down any stale/disconnected instance before creating a new one
  if (socket) {
    socket.disconnect()
    socket = null
  }

  let token: string | null = null
  try {
    token = typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null
  } catch {}

  socket = io(SERVER_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.warn('❌ Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('🔴 Socket connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
