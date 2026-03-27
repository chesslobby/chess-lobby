import { io, Socket } from 'socket.io-client'

const SERVER_URL = 'http://localhost:4000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('chess_token')
        : null

    socket = io(SERVER_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('Connected to Chess Lobby server:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message)
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
