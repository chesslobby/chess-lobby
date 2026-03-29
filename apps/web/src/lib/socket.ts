import { io, Socket } from 'socket.io-client'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

let socket: Socket | null = null

export function getSocket(): Socket {
  // Return existing socket regardless of connection state.
  // socket.io reconnects automatically — never destroy a socket that is
  // between reconnect attempts or we lose all registered event listeners
  // (game:move, game:start, etc.) and the socket room membership.
  if (socket) return socket

  let token: string | null = null
  try {
    token = typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null
  } catch {}

  socket = io(SERVER_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    transports: ['websocket'],  // websocket only — polling causes transport close on Render
    timeout: 60000,
    pingTimeout: 60000,
    pingInterval: 25000,
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
