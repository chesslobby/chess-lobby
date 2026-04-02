import { io, Socket } from 'socket.io-client'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'
let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket || socket.disconnected) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null

    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }

    socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    socket.on('connect', () => console.log('[Socket] connected:', socket?.id))
    socket.on('disconnect', (r) => console.log('[Socket] disconnected:', r))
    socket.on('connect_error', (e) => console.log('[Socket] error:', e.message))
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
