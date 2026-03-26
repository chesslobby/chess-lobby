// ─────────────────────────────────────────────────────────────
//  Royal Chess — useSocket hook
//  Manages a single Socket.io connection per session
// ─────────────────────────────────────────────────────────────

'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000'

let globalSocket: Socket | null = null

export function useSocket() {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('chess_token')
      : null

    if (!globalSocket) {
      globalSocket = io(SERVER_URL, {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })
    }

    socketRef.current = globalSocket

    globalSocket.on('connect', () => setConnected(true))
    globalSocket.on('disconnect', () => setConnected(false))

    if (globalSocket.connected) setConnected(true)

    return () => {
      // Don't disconnect on unmount — keep connection alive
    }
  }, [])

  return { socket: socketRef.current, connected }
}

// Helper to disconnect (call on logout)
export function disconnectSocket() {
  globalSocket?.disconnect()
  globalSocket = null
}
