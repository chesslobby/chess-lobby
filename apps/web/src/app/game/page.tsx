'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getSocket } from '@/lib/socket'
import { getUser } from '@/lib/api'
import { playMoveSound, playCaptureSound, playCheckSound, playGameEndSound } from '@/lib/sounds'
import { showToast } from '@/components/Toast'
import { detectOpeningFromMoves } from '@/lib/openings'

// ── Constants ───────────────────────────────────────────────────
const THEMES = [
  { light: '#f0d9b5', dark: '#b58863' }, // Classic Wood
  { light: '#ffffdd', dark: '#86a666' }, // Emerald Green
  { light: '#dee3e6', dark: '#8ca2ad' }, // Midnight Blue
]

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'turn:openrelay.metered.ca:80',          username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',         username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const PIECE_UNICODE: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

const RESULT_REASONS: Record<string, string> = {
  checkmate: 'by Checkmate', resign: 'by Resignation',
  timeout:   'by Timeout',   stalemate: 'Stalemate',
  draw:      'by Agreement', abandoned: 'Abandoned',
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

type ChatMsg = { sender: string; text: string; self?: boolean; system?: boolean }

// ── Helpers ──────────────────────────────────────────────────────
function fenToBoard(fen: string): (string | null)[][] {
  return fen.split(' ')[0].split('/').map(row => {
    const cells: (string | null)[] = []
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) cells.push(null)
      else cells.push(ch)
    }
    return cells
  })
}

function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function getCapturedPiece(oldFen: string, newFen: string): string | null {
  const count = (fen: string) => {
    const m: Record<string, number> = {}
    fenToBoard(fen).flat().forEach(p => { if (p) m[p] = (m[p] || 0) + 1 })
    return m
  }
  const o = count(oldFen), n = count(newFen)
  for (const [p, c] of Object.entries(o)) {
    if ((n[p] || 0) < c) return p
  }
  return null
}

function materialBalance(cap: { w: string[], b: string[] }) {
  const sum = (arr: string[]) => arr.reduce((s, p) => s + (PIECE_VALUES[p.toLowerCase()] || 0), 0)
  const wMat = sum(cap.w), bMat = sum(cap.b)
  return { w: wMat - bMat, b: bMat - wMat }
}

// ── Component ────────────────────────────────────────────────────
export default function GamePage() {
  // Board / game state
  const [boardTheme, setBoardTheme]   = useState(0)
  const [gameInfo, setGameInfo]       = useState<any>(null)
  const [chess, setChess]             = useState<any>(null)
  const [board, setBoard]             = useState<(string | null)[][]>(fenToBoard(INITIAL_FEN))
  const [fen, setFen]                 = useState(INITIAL_FEN)
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w')
  const [myColor, setMyColor]         = useState<'w' | 'b'>('w')
  const [boardFlipped, setBoardFlipped] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [validMoves, setValidMoves]   = useState<string[]>([])
  const [clocks, setClocks]           = useState({ w: 600000, b: 600000 })
  const [gameOver, setGameOver]       = useState(false)
  const [gameWaiting, setGameWaiting] = useState(true)
  const [gameResult, setGameResult]   = useState('')
  const [gameResultReason, setGameResultReason] = useState('')
  const [eloChange, setEloChange]     = useState<number | null>(null)
  const [captured, setCaptured]       = useState<{ w: string[], b: string[] }>({ w: [], b: [] })
  const [moveHistory, setMoveHistory] = useState<{ n: number; w: string; b: string }[]>([])
  const [pendingWhite, setPendingWhite] = useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab]     = useState<'chat' | 'voice'>('chat')
  const [messages, setMessages]       = useState<ChatMsg[]>([
    { sender: 'System', text: 'Good luck! Have fun! 🤝', system: true },
  ])
  const [chatInput, setChatInput]     = useState('')
  const [chatFocused, setChatFocused] = useState(false)
  const [statusMsg, setStatusMsg]     = useState('')
  const [drawOfferReceived, setDrawOfferReceived] = useState(false)
  const [isMobile, setIsMobile]       = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showChatDrawer, setShowChatDrawer] = useState(false)

  // Connection status
  const [socketConnected, setSocketConnected] = useState(false)

  // Voice state
  const [voiceState, setVoiceState]   = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [isMuted, setIsMuted]         = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isSpeaking, setIsSpeaking]               = useState(false)
  const [isOpponentSpeaking, setIsOpponentSpeaking] = useState(false)
  const [isDeafened, setIsDeafened]               = useState(false)
  const voiceStartedRef = useRef(false)   // guard: only auto-start once

  // New feature states
  const [showPromotion, setShowPromotion]   = useState(false)
  const [pendingMove, setPendingMove]       = useState<{from:string,to:string}|null>(null)
  const [lastMove, setLastMove]             = useState<{from:string,to:string}|null>(null)
  const [rematchOffered, setRematchOffered] = useState(false)
  const [rematchReceived, setRematchReceived] = useState(false)
  const [showResignConfirm, setShowResignConfirm] = useState(false)

  // Animation state
  const [animPiece, setAnimPiece] = useState<{symbol:string, fromSq:string, toSq:string}|null>(null)
  const [animReady, setAnimReady] = useState(false)

  // Social features state
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{id:number, emoji:string, x:number}>>([])
  const [quickCooldown, setQuickCooldown] = useState(false)
  const [gameOverDividerAdded, setGameOverDividerAdded] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareWhatsAppSent, setShareWhatsAppSent] = useState(false)
  const [openingName, setOpeningName] = useState('')
  const [showOpponentProfile, setShowOpponentProfile] = useState(false)
  const floatingIdRef = useRef(0)

  // Refs for stale-closure safety
  const fenRef          = useRef(INITIAL_FEN)
  const myColorRef      = useRef<'w' | 'b'>('w')
  const pendingWhiteRef = useRef<string | null>(null)
  const moveScrollRef   = useRef<HTMLDivElement>(null)
  const chatScrollRef   = useRef<HTMLDivElement>(null)
  const peerRef         = useRef<RTCPeerConnection | null>(null)
  const remoteAudioRef  = useRef<HTMLAudioElement | null>(null)
  const statusTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animTimeoutRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingIntervalRef = useRef<any>(null)
  const audioContextRef     = useRef<AudioContext | null>(null)

  const theme = THEMES[boardTheme]

  // ── Auto-scroll ───────────────────────────────────────────────
  useEffect(() => {
    if (moveScrollRef.current)
      moveScrollRef.current.scrollTop = moveScrollRef.current.scrollHeight
  }, [moveHistory, pendingWhite])

  useEffect(() => {
    if (chatScrollRef.current)
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [messages])

  // ── Opening detection ─────────────────────────────────────
  useEffect(() => {
    const allMoves: string[] = []
    moveHistory.forEach(row => { if (row.w && row.w !== '—') allMoves.push(row.w); if (row.b) allMoves.push(row.b) })
    if (pendingWhite) allMoves.push(pendingWhite)
    if (allMoves.length > 0 && allMoves.length <= 20) {
      const name = detectOpeningFromMoves(allMoves)
      if (name && name !== 'Opening') setOpeningName(name)
    }
  }, [moveHistory, pendingWhite])

  // ── Mount guard (prevents localStorage hydration mismatch) ──
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ── Mobile detection ─────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (e.key === 'Escape') { setSelectedSquare(null); setValidMoves([]); setShowOpponentProfile(false) }
      if (e.key === 'f' || e.key === 'F') setBoardFlipped(p => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Status message auto-clear ────────────────────────────────
  function showStatusMsg(msg: string) {
    setStatusMsg(msg)
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    statusTimerRef.current = setTimeout(() => setStatusMsg(''), 5000)
  }

  // ── Game init + socket ───────────────────────────────────────
  useEffect(() => {
    if (!mounted) return

    const stored = localStorage.getItem('current_game')
    if (!stored) { window.location.href = '/lobby'; return }

    const info = JSON.parse(stored)
    setGameInfo(info)

    const color: 'w' | 'b' = info.color === 'b' ? 'b' : 'w'
    setMyColor(color)
    myColorRef.current = color
    setBoardFlipped(color === 'b')

    const initialMs = (info.timeControl || 600) * 1000
    setClocks({ w: initialMs, b: initialMs })

    const socket = getSocket()
    setSocketConnected(socket.connected)

    // Emit immediately (socket may already be connected)
    socket.emit('game:ready', { gameId: info.gameId })
    console.log('Emitted game:ready for', info.gameId, '| connected:', socket.connected)

    // Re-emit on connect in case socket wasn't connected yet
    socket.on('connect', () => {
      console.log('Socket connected, re-emitting game:ready for', info.gameId)
      setSocketConnected(true)
      socket.emit('game:ready', { gameId: info.gameId })
    })

    socket.on('disconnect', () => { setSocketConnected(false) })

    socket.on('game:start', ({ fen: startFen, clocks: c }: any) => {
      console.log('game:start received!', { fen: startFen, clocks: c })
      const { Chess } = require('chess.js')
      const ch = new Chess()
      if (startFen) ch.load(startFen)
      const f = ch.fen()
      fenRef.current = f
      setChess(ch); setFen(f); setBoard(fenToBoard(f)); setCurrentTurn(ch.turn())
      if (c) setClocks(c)
      setGameWaiting(false)
      // Auto-connect voice ONCE — pass `info` via closure so it's never stale
      if (!voiceStartedRef.current) {
        voiceStartedRef.current = true
        const currentInfo = info
        setTimeout(() => startVoice(currentInfo), 1500)
      }
    })

    socket.on('game:move', ({ from: mFrom, to: mTo, fen: moveFen, clocks: c, san }: any) => {
      const { Chess } = require('chess.js')
      const ch = new Chess()
      ch.load(moveFen)
      const justMoved: 'w' | 'b' = ch.turn() === 'w' ? 'b' : 'w'
      const isOpponent = justMoved !== myColorRef.current

      // Animate opponent's move (piece is at mTo in the new FEN)
      if (isOpponent && mFrom && mTo) {
        const movedPiece = ch.get(mTo as any)
        if (movedPiece) animateMove(mFrom, mTo, getPieceSymbol(movedPiece.type, movedPiece.color))
      }

      if (isOpponent) {
        const cap = getCapturedPiece(fenRef.current, moveFen)
        if (cap) {
          const isBlack = cap === cap.toLowerCase()
          setCaptured(prev => isBlack
            ? { ...prev, w: [...prev.w, cap] }
            : { ...prev, b: [...prev.b, cap] }
          )
          playCaptureSound()
        } else {
          playMoveSound()
        }
        if (ch.inCheck()) playCheckSound()
      }

      fenRef.current = moveFen
      setChess(ch); setFen(moveFen); setBoard(fenToBoard(moveFen))
      setCurrentTurn(ch.turn())
      if (c) setClocks(c)
      if (mFrom && mTo) setLastMove({ from: mFrom, to: mTo })
      setSelectedSquare(null); setValidMoves([])

      if (san) {
        if (justMoved === 'w') {
          pendingWhiteRef.current = san
          setPendingWhite(san)
        } else {
          const wMove = pendingWhiteRef.current || '—'
          pendingWhiteRef.current = null
          setPendingWhite(null)
          setMoveHistory(prev => [...prev, { n: prev.length + 1, w: wMove, b: san }])
        }
      }
    })

    socket.on('game:clock', ({ clocks: c }: any) => { if (c) setClocks(c) })

    socket.on('game:end', ({ result, winnerId, eloChanges }: any) => {
      setGameResultReason(RESULT_REASONS[result] || result)
      const myId = getUser()?.id
      const won = winnerId === myId
      setGameResult(won ? 'You Win! 🏆' : !winnerId ? 'Draw!' : 'You Lose!')
      if (eloChanges && myId && eloChanges[myId]) setEloChange(eloChanges[myId].change)
      playGameEndSound(won)
      setGameOver(true)
    })

    socket.on('game:invalid-move', () => { setSelectedSquare(null); setValidMoves([]) })

    socket.on('game:draw-offered', () => {
      setDrawOfferReceived(true)
      showToast('Opponent offered a draw', 'info')
    })

    socket.on('game:opponent-disconnected', ({ reconnectTimeout }: any) => {
      showStatusMsg(`Opponent disconnected. Waiting ${reconnectTimeout || 30}s for reconnect...`)
      showToast('Opponent disconnected', 'warning')
    })

    socket.on('chat:receive', ({ senderName, message }: any) => {
      setMessages(prev => [...prev, { sender: senderName, text: message, self: false }])
      // Floating emoji if message is a single emoji
      const FLOAT_EMOJIS = ['😮','😄','🤔','😤','👏','🏆','😅','🤩','😂','❤️','🔥','💀','🎯','✨']
      if (FLOAT_EMOJIS.includes(message.trim())) {
        const id = ++floatingIdRef.current
        const x = Math.floor(Math.random() * 60) + 20
        setFloatingEmojis(prev => [...prev, { id, emoji: message.trim(), x }])
        setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 1800)
      }
    })

    socket.on('game:rematch-offered', () => {
      setRematchReceived(true)
      showToast('Opponent wants a rematch!', 'info')
    })

    socket.on('voice:speaking', ({ userId, speaking }: any) => {
      if (userId !== getUser()?.id) {
        setIsOpponentSpeaking(speaking)
        setTimeout(() => setIsOpponentSpeaking(false), 500)
      }
    })

    return () => {
      ['connect','disconnect','game:start','game:move','game:clock','game:end','game:invalid-move',
       'game:draw-offered','game:opponent-disconnected','chat:receive','game:rematch-offered','voice:speaking'].forEach(ev => socket.off(ev))
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => null)
    }
  }, [mounted])

  // ── Game-over chat divider ───────────────────────────────────
  useEffect(() => {
    if (gameOver && !gameOverDividerAdded) {
      setGameOverDividerAdded(true)
      setMessages(prev => [
        ...prev,
        { sender: 'System', text: '── Game Over ──', system: true, divider: true },
        { sender: 'System', text: 'Chat continues after game — analyze together! 💬', system: true },
      ])
    }
  }, [gameOver])

  // ── Share game helpers ───────────────────────────────────────
  function handleShareGame() {
    const url = `https://chesslobby.in/replay?gameId=${gameInfo?.gameId}`
    try { navigator.clipboard.writeText(url) } catch {}
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2500)
  }

  function handleShareWhatsApp() {
    const url = `https://chesslobby.in/replay?gameId=${gameInfo?.gameId}`
    window.open(`https://wa.me/?text=${encodeURIComponent('Check out this chess game! ' + url)}`, '_blank')
  }

  function handleShareTwitter() {
    const url = `https://chesslobby.in/replay?gameId=${gameInfo?.gameId}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just played chess on Chess Lobby!')}&url=${encodeURIComponent(url)}`, '_blank')
  }

  // ── Quick message sender ─────────────────────────────────────
  function sendQuickMsg(text: string) {
    if (quickCooldown || !gameInfo) return
    getSocket().emit('chat:send', { gameId: gameInfo.gameId, message: text, type: 'quick' })
    setMessages(prev => [...prev, { sender: myName, text, self: true }])
    setQuickCooldown(true)
    setTimeout(() => setQuickCooldown(false), 3000)
  }

  // ── Voice ────────────────────────────────────────────────────
  async function startVoice(gameInfoOverride?: any) {
    console.log('[Voice] startVoice called, override:', gameInfoOverride, 'state:', gameInfo)
    const info = gameInfoOverride ?? gameInfo
    console.log('[Voice] using info:', info)
    if (!info?.gameId) {
      console.log('[Voice] no gameId, aborting')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('[Voice] getUserMedia not supported')
      setVoiceState('error')
      return
    }

    try {
      setVoiceState('connecting')
      console.log('[Voice] requesting microphone...')

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        })
        console.log('[Voice] microphone granted, tracks:', stream.getTracks().length)
      } catch (err: any) {
        console.error('[Voice] microphone error:', err.name, err.message)
        setVoiceState('error')
        showToast('Microphone access denied', 'error')
        return
      }
      setLocalStream(stream)

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 })
      peerRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
        console.log('Remote audio track received!')
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0]
          remoteAudioRef.current.play().catch(console.error)
        }
        setVoiceState('connected')
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket().emit('voice:ice', { gameId: info.gameId, candidate: event.candidate })
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('WebRTC connection state:', pc.connectionState)
        if (pc.connectionState === 'connected') setVoiceState('connected')
        else if (pc.connectionState === 'failed') setVoiceState('error')
        else if (pc.connectionState === 'disconnected') setVoiceState('connecting')
      }

      pc.oniceconnectionstatechange = () => {
        console.log('ICE state:', pc.iceConnectionState)
      }

      // Speaking detection via Web Audio API
      try {
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)
        microphone.connect(analyser)
        analyser.fftSize = 512
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        speakingIntervalRef.current = setInterval(() => {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          const speaking = average > 15
          setIsSpeaking(speaking)
          if (speaking) getSocket().emit('voice:speaking', { gameId: info.gameId, speaking: true })
        }, 100)
      } catch (err) {
        console.error('Audio analysis error:', err)
      }

      const socket = getSocket()

      socket.off('voice:initiate')
      socket.on('voice:initiate', async ({ toUserId }: any) => {
        console.log('We are the caller, creating offer')
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('voice:offer', { gameId: info.gameId, toUserId, offer: pc.localDescription })
      })

      socket.off('voice:offer')
      socket.on('voice:offer', async ({ fromUserId, offer }: any) => {
        console.log('Received offer, creating answer')
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('voice:answer', { gameId: info.gameId, toUserId: fromUserId, answer: pc.localDescription })
      })

      socket.off('voice:answer')
      socket.on('voice:answer', async ({ answer }: any) => {
        console.log('Received answer')
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
        }
      })

      socket.off('voice:ice')
      socket.on('voice:ice', async ({ candidate }: any) => {
        try {
          if (candidate && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          }
        } catch (err) {
          console.error('ICE candidate error:', err)
        }
      })

      socket.off('voice:peer-left')
      socket.on('voice:peer-left', () => {
        setVoiceState('idle')
        showToast('Opponent left voice chat', 'info')
      })

      // Join voice — retry up to 3 times with 8s gaps until we get a response
      let voiceJoinAttempts = 0
      const MAX_VOICE_ATTEMPTS = 3
      let voiceRetryTimer: ReturnType<typeof setTimeout> | null = null

      function emitVoiceJoin() {
        voiceJoinAttempts++
        console.log(`[Voice] voice:join attempt ${voiceJoinAttempts}/${MAX_VOICE_ATTEMPTS} for`, info.gameId)
        socket.emit('voice:join', { gameId: info.gameId })

        if (voiceJoinAttempts < MAX_VOICE_ATTEMPTS) {
          voiceRetryTimer = setTimeout(() => {
            if (peerRef.current?.connectionState !== 'connected') {
              console.log('[Voice] no response, retrying...')
              emitVoiceJoin()
            }
          }, 8000)
        }
      }

      // Clear retry timer when signaling arrives
      function clearVoiceRetry() { if (voiceRetryTimer) { clearTimeout(voiceRetryTimer); voiceRetryTimer = null } }
      socket.once('voice:initiate', clearVoiceRetry)
      socket.once('voice:offer',    clearVoiceRetry)

      // Re-emit if socket reconnects while still not connected
      socket.on('connect', () => {
        if (peerRef.current?.connectionState !== 'connected') {
          console.log('[Voice] socket reconnected mid-voice, re-emitting voice:join')
          setTimeout(() => emitVoiceJoin(), 500)
        }
      })

      if (!socket.connected) {
        console.log('[Voice] socket not connected, waiting for reconnect...')
        socket.once('connect', () => emitVoiceJoin())
      } else {
        emitVoiceJoin()
      }

    } catch (err: any) {
      console.error('[Voice] unexpected error:', err)
      setVoiceState('error')
    }
  }

  function stopVoice() {
    const socket = getSocket()
    ;['voice:initiate','voice:offer','voice:answer','voice:ice','voice:peer-left'].forEach(ev => socket.off(ev))
    if (speakingIntervalRef.current) { clearInterval(speakingIntervalRef.current); speakingIntervalRef.current = null }
    if (audioContextRef.current) { audioContextRef.current.close().catch(() => null); audioContextRef.current = null }
    localStream?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
    peerRef.current = null
    setLocalStream(null)
    setVoiceState('idle')
    setIsSpeaking(false)
    setIsOpponentSpeaking(false)
    socket.emit('voice:leave', { gameId: gameInfo?.gameId })
  }

  function toggleMute() {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = isMuted })
      setIsMuted(m => !m)
    }
  }

  function toggleDeafen() {
    setIsDeafened(prev => {
      const newDeafened = !prev
      if (remoteAudioRef.current) remoteAudioRef.current.muted = newDeafened
      return newDeafened
    })
  }

  // ── Board orientation ────────────────────────────────────────
  const displayBoard = boardFlipped
    ? [...board].reverse().map(row => [...row].reverse())
    : board

  const rankLabels = boardFlipped ? [1,2,3,4,5,6,7,8] : [8,7,6,5,4,3,2,1]
  const fileLabels = boardFlipped ? ['h','g','f','e','d','c','b','a'] : FILES

  function toSquare(dRow: number, dCol: number): string {
    if (boardFlipped) return FILES[7 - dCol] + (dRow + 1)
    return FILES[dCol] + (8 - dRow)
  }

  // ── Animation helpers ─────────────────────────────────────────
  function getPieceSymbol(type: string, color: string): string {
    const map: Record<string, Record<string, string>> = {
      w: { k:'♔', q:'♕', r:'♖', b:'♗', n:'♘', p:'♙' },
      b: { k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' },
    }
    return map[color]?.[type] || ''
  }

  // Convert chess square name → display grid {col, row} (0-based)
  // Must use boardFlipped at call time — only called from render-phase code
  function squareToColRow(sq: string): {col: number, row: number} {
    const file = sq.charCodeAt(0) - 97  // a=0 … h=7
    const rank = parseInt(sq[1]) - 1    // 1=0 … 8=7
    return boardFlipped
      ? { col: 7 - file, row: rank }
      : { col: file,     row: 7 - rank }
  }

  function animateMove(fromSq: string, toSq: string, symbol: string) {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current)
    setAnimReady(false)
    setAnimPiece({ symbol, fromSq, toSq })
    // Double-rAF: ensure the element is painted at fromSq before transition starts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { setAnimReady(true) })
    })
    animTimeoutRef.current = setTimeout(() => {
      setAnimPiece(null)
      setAnimReady(false)
    }, 180)
  }

  // ── Make move (optimistic) ────────────────────────────────────
  function makeMove(from: string, to: string, promotion: string) {
    // Trigger animation before board state changes
    const pieceObj = chess?.get(from as any)
    if (pieceObj) animateMove(from, to, getPieceSymbol(pieceObj.type, pieceObj.color))

    getSocket().emit('game:move', { gameId: gameInfo?.gameId, from, to, promotion })
    try {
      const { Chess } = require('chess.js')
      const newChess = new Chess()
      newChess.load(chess!.fen())
      const result = newChess.move({ from, to, promotion })
      if (result) {
        if (result.captured) {
          const cap = myColor === 'w' ? result.captured : result.captured.toUpperCase()
          setCaptured(prev => ({ ...prev, [myColor]: [...prev[myColor], cap] }))
          playCaptureSound()
        } else {
          playMoveSound()
        }
        if (newChess.inCheck()) playCheckSound()
        const nf = newChess.fen()
        fenRef.current = nf
        setChess(newChess); setFen(nf); setBoard(fenToBoard(nf)); setCurrentTurn(newChess.turn())
        setLastMove({ from, to })
      }
    } catch {}
  }

  // ── Square click ─────────────────────────────────────────────
  function handleSquareClick(dRow: number, dCol: number) {
    if (gameOver || !chess || gameWaiting) return
    if (chess.turn() !== myColor) return

    const sq = toSquare(dRow, dCol)

    if (selectedSquare) {
      if (validMoves.includes(sq)) {
        const piece = chess.get(selectedSquare as any)
        const isPromotion = piece?.type === 'p' &&
          ((myColor === 'w' && sq[1] === '8') || (myColor === 'b' && sq[1] === '1'))

        if (isPromotion) {
          setPendingMove({ from: selectedSquare, to: sq })
          setShowPromotion(true)
          setSelectedSquare(null)
          setValidMoves([])
          return
        }

        makeMove(selectedSquare, sq, 'q')
        setSelectedSquare(null)
        setValidMoves([])
      } else {
        const piece = chess.get(sq as any)
        if (piece && piece.color === myColor) {
          setSelectedSquare(sq)
          const moves = chess.moves({ square: sq as any, verbose: true }) as any[]
          setValidMoves(moves.map((m: any) => m.to))
        } else {
          setSelectedSquare(null)
          setValidMoves([])
        }
      }
    } else {
      const piece = chess.get(sq as any)
      if (piece && piece.color === myColor) {
        setSelectedSquare(sq)
        const moves = chess.moves({ square: sq as any, verbose: true }) as any[]
        setValidMoves(moves.map((m: any) => m.to))
      }
    }
  }

  function sendMessage() {
    if (!chatInput.trim() || !gameInfo) return
    getSocket().emit('chat:send', { gameId: gameInfo.gameId, message: chatInput.trim(), type: 'text' })
    setMessages(prev => [...prev, { sender: myName, text: chatInput.trim(), self: true }])
    setChatInput('')
  }

  function handleDraw() {
    if (window.confirm('Offer a draw to your opponent?')) {
      getSocket().emit('game:draw-offer', { gameId: gameInfo?.gameId })
      showToast('Draw offered to opponent', 'info')
    }
  }

  function handleResign() {
    setShowResignConfirm(true)
  }

  function acceptDraw() {
    getSocket().emit('game:draw-response', { gameId: gameInfo?.gameId, accept: true })
    setDrawOfferReceived(false)
  }

  function declineDraw() {
    getSocket().emit('game:draw-response', { gameId: gameInfo?.gameId, accept: false })
    setDrawOfferReceived(false)
    showToast('Draw declined', 'info')
  }

  // ── Derived values ───────────────────────────────────────────
  // Use mounted guard — getUser() reads localStorage, which doesn't exist on server
  const user         = mounted ? getUser() : null
  const myName       = user?.username || 'You'
  const myElo        = user?.eloRating || 1200
  const opponentName = gameInfo?.opponent?.username || 'Opponent'
  const opponentElo  = gameInfo?.opponent?.eloRating || 1200
  const myClock      = myColor === 'w' ? clocks.w : clocks.b
  const oppClock     = myColor === 'w' ? clocks.b : clocks.w
  const myCaptures   = myColor === 'w' ? captured.w : captured.b
  const oppCaptures  = myColor === 'w' ? captured.b : captured.w
  const bal          = materialBalance(captured)
  const myAdv        = myColor === 'w' ? bal.w : bal.b
  const oppAdv       = myColor === 'w' ? bal.b : bal.w

  // ── Check detection ──────────────────────────────────────────
  function getKingSquare(color: 'w' | 'b'): string | null {
    if (!chess) return null
    const boardArr = chess.board()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = boardArr[r][c]
        if (p && p.type === 'k' && p.color === color) {
          return String.fromCharCode(97 + c) + (8 - r)
        }
      }
    }
    return null
  }
  const isInCheck = chess?.inCheck?.() || false
  const kingSquare = isInCheck ? getKingSquare(chess!.turn() as 'w' | 'b') : null

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Hidden audio element for remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      <style suppressHydrationWarning>{`
        .board-sq { transition: filter 0.1s; }
        .board-sq:hover { filter: brightness(1.12); }
        .valid-dot::after {
          content: "";
          display: block; width: 32%; height: 32%;
          border-radius: 50%; background: rgba(0,0,0,0.25);
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%); pointer-events: none;
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        .moves-scroll::-webkit-scrollbar { width: 3px; }
        .moves-scroll::-webkit-scrollbar-track { background: transparent; }
        .moves-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
        @keyframes fadeInScale { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes pulseRing { 0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.6); } 50% { box-shadow: 0 0 0 8px rgba(201,168,76,0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes waitPulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity:1; } 100% { transform: translateY(-200px) scale(1.5); opacity:0; } }
        @keyframes speakPulse { from { box-shadow: 0 0 10px rgba(39,174,96,0.4); } to { box-shadow: 0 0 25px rgba(39,174,96,0.8); } }
        .game-over-card { animation: fadeInScale 0.3s ease both; }
        .quick-msg-btn { background:rgba(255,255,255,0.04); border:1px solid rgba(201,168,76,0.18); border-radius:8px; color:#9aa5b4; font-size:11px; padding:2px 8px; cursor:pointer; font-family:var(--font-crimson),Georgia,serif; transition:all .15s; white-space:nowrap; }
        .quick-msg-btn:hover:not(:disabled) { background:rgba(201,168,76,0.15); color:#c9a84c; border-color:rgba(201,168,76,0.4); }
        .quick-msg-btn:disabled { opacity:0.35; cursor:default; }
        .voice-ring { animation: pulseRing 1.5s ease-in-out infinite; }
        .wait-pulse { animation: waitPulse 1.4s ease-in-out infinite; }
        .spinner { width:36px;height:36px;border:3px solid rgba(201,168,76,0.2);border-top-color:#c9a84c;border-radius:50%;animation:spin 0.8s linear infinite; }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
          .left-panel.mobile-show { display: flex !important; position:fixed; top:48px; left:0; bottom:0; z-index:150; width:200px; background:#0d1f3c; box-shadow:4px 0 20px rgba(0,0,0,0.5); }
          .right-panel { display: none !important; }
          .right-panel.mobile-show { display:flex !important; position:fixed; bottom:0; left:0; right:0; height:60vh; z-index:150; background:#0d1f3c; border-top:1px solid rgba(201,168,76,0.3); box-shadow:0 -4px 20px rgba(0,0,0,0.5); }
          .mobile-overlay { display:block !important; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:140; }
          .mobile-bar { display:flex !important; }
          .board-size { width: min(calc(100dvh - 130px), calc(100vw - 24px)) !important; }
        }
        .mobile-overlay { display:none; }
        .mobile-bar { display:none; }
      `}</style>

      <div suppressHydrationWarning style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#0a1628', overflow:'hidden', fontFamily:'var(--font-crimson),Georgia,serif', position:'relative' }}>

        {/* ── Pawn promotion dialog ─────────────────────── */}
        {showPromotion && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
            <div style={{ background:'#1a2035', border:'2px solid #c9a84c', borderRadius:12, padding:24, textAlign:'center' }}>
              <h3 style={{ color:'#c9a84c', marginBottom:16, fontFamily:'var(--font-playfair),Georgia,serif', margin:'0 0 16px' }}>Choose promotion piece</h3>
              <div style={{ display:'flex', gap:12 }}>
                {[
                  { piece:'q', symbol:'♛', name:'Queen' },
                  { piece:'r', symbol:'♜', name:'Rook' },
                  { piece:'b', symbol:'♝', name:'Bishop' },
                  { piece:'n', symbol:'♞', name:'Knight' },
                ].map(({ piece, symbol, name }) => (
                  <button key={piece} onClick={() => {
                    if (pendingMove) makeMove(pendingMove.from, pendingMove.to, piece)
                    setShowPromotion(false)
                    setPendingMove(null)
                  }} style={{ background:'#2a3550', border:'2px solid #3a4560', borderRadius:8, padding:'12px 16px', cursor:'pointer', color:'white', fontSize:36, display:'flex', flexDirection:'column', alignItems:'center', gap:4, transition:'all 0.2s', fontFamily:'initial' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#c9a84c')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#3a4560')}
                  >
                    {symbol}
                    <span style={{ fontSize:12, color:'#aaa', fontFamily:'var(--font-crimson),Georgia,serif' }}>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Resign confirmation dialog ─────────────────── */}
        {showResignConfirm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
            <div style={{ background:'#0d1f3c', border:'1px solid rgba(239,68,68,0.5)', borderRadius:12, padding:28, textAlign:'center', minWidth:260 }}>
              <p style={{ color:'#e8e0d0', marginBottom:20, fontSize:'1rem', margin:'0 0 20px' }}>Are you sure you want to resign?</p>
              <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                <button onClick={() => setShowResignConfirm(false)} style={{ background:'transparent', color:'#c9a84c', border:'1.5px solid rgba(201,168,76,0.5)', borderRadius:8, padding:'0.6rem 1.2rem', fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>Cancel</button>
                <button onClick={() => { getSocket().emit('game:resign', { gameId: gameInfo?.gameId }); setShowResignConfirm(false) }} style={{ background:'rgba(239,68,68,0.15)', color:'#ef4444', border:'1.5px solid rgba(239,68,68,0.5)', borderRadius:8, padding:'0.6rem 1.2rem', fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>Resign</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Game-over overlay ─────────────────────────── */}
        {gameOver && (
          <div style={{ position:'absolute', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(10,22,40,0.88)', backdropFilter:'blur(6px)' }}>
            <div className="game-over-card" style={{ background:'#0d1f3c', border:'1px solid rgba(201,168,76,0.5)', borderRadius:'20px', padding:'2.5rem 3rem', textAlign:'center', boxShadow:'0 12px 64px rgba(0,0,0,0.8)', minWidth:'300px', maxWidth:'400px' }}>
              <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem' }}>
                {gameResult.includes('Win') ? '🏆' : gameResult.includes('Draw') ? '🤝' : '😢'}
              </div>
              <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'2rem', color:'#c9a84c', margin:'0 0 0.25rem' }}>{gameResult}</h2>
              <p style={{ color:'#9aa5b4', fontSize:'0.95rem', margin:'0 0 0.5rem' }}>{gameResultReason}</p>
              {eloChange !== null && (
                <div style={{ fontSize:'1.2rem', fontWeight:700, color: eloChange >= 0 ? '#22c55e' : '#ef4444', margin:'0 0 0.5rem' }}>
                  {eloChange >= 0 ? '+' : ''}{eloChange} Elo
                </div>
              )}
              <div style={{ fontSize:'0.8rem', color:'#4a5568', marginBottom:'1.25rem' }}>
                {moveHistory.length * 2 - (pendingWhite ? 1 : 0)} moves played
              </div>
              {/* Rematch */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'0.75rem' }}>
                {rematchReceived && (
                  <button onClick={() => { getSocket().emit('game:rematch-accept', { gameId: gameInfo?.gameId }); localStorage.removeItem('current_game'); window.location.href = '/lobby' }} style={{ background:'#22c55e', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.75rem 1.5rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>✅ Accept Rematch</button>
                )}
                {!rematchOffered ? (
                  <button onClick={() => { getSocket().emit('game:rematch-offer', { gameId: gameInfo?.gameId }); setRematchOffered(true) }} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.75rem 1.5rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>🔄 Rematch</button>
                ) : (
                  <div style={{ color:'#9aa5b4', fontSize:'0.82rem', padding:'0.4rem' }}>Rematch offered... waiting</div>
                )}
              </div>
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
                <button onClick={() => { localStorage.removeItem('current_game'); window.location.href = '/lobby' }} style={{ background:'transparent', color:'#c9a84c', border:'1.5px solid rgba(201,168,76,0.5)', borderRadius:'8px', padding:'0.7rem 1.25rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>New Game</button>
                {gameInfo?.gameId && (
                  <button onClick={() => { window.location.href = `/analysis/${gameInfo.gameId}` }} style={{ background:'rgba(59,130,246,0.12)', color:'#60a5fa', border:'1.5px solid rgba(59,130,246,0.4)', borderRadius:'8px', padding:'0.7rem 1.25rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>📊 Analyze</button>
                )}
                <button onClick={() => { localStorage.removeItem('current_game'); window.location.href = '/' }} style={{ background:'transparent', color:'#9aa5b4', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:'8px', padding:'0.7rem 1.25rem', fontSize:'0.9rem', cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>Home</button>
              </div>
              {/* Share game */}
              {gameInfo?.gameId && (
                <div style={{ marginTop:'0.75rem', borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:'0.75rem' }}>
                  <div style={{ fontSize:'0.75rem', color:'#4a5568', marginBottom:'0.5rem' }}>Share this game</div>
                  <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap' }}>
                    <button onClick={handleShareGame} style={{ background: shareCopied ? 'rgba(34,197,94,.12)' : 'rgba(201,168,76,0.1)', color: shareCopied ? '#22c55e' : '#c9a84c', border:`1px solid ${shareCopied ? 'rgba(34,197,94,.3)' : 'rgba(201,168,76,0.35)'}`, borderRadius:7, padding:'0.4rem 0.9rem', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>
                      {shareCopied ? '✓ Copied!' : '🔗 Copy Link'}
                    </button>
                    <button onClick={handleShareWhatsApp} style={{ background:'rgba(37,211,102,0.1)', color:'#25d366', border:'1px solid rgba(37,211,102,0.3)', borderRadius:7, padding:'0.4rem 0.9rem', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>
                      WhatsApp
                    </button>
                    <button onClick={handleShareTwitter} style={{ background:'rgba(29,161,242,0.1)', color:'#1da1f2', border:'1px solid rgba(29,161,242,0.3)', borderRadius:7, padding:'0.4rem 0.9rem', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>
                      𝕏 Twitter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Waiting overlay ───────────────────────────── */}
        {gameWaiting && !gameOver && (
          <div style={{ position:'absolute', inset:0, zIndex:150, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(10,22,40,0.92)', backdropFilter:'blur(4px)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }} className="wait-pulse">♛</div>
            <div className="spinner" style={{ marginBottom:'1rem' }} />
            <div style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.1rem', color:'#c9a84c', marginBottom:'0.4rem' }}>Waiting for opponent...</div>
            <div style={{ fontSize:'0.82rem', color:'#4a5568' }}>Game will start automatically</div>
          </div>
        )}

        {/* ── Mobile overlay (closes panels) ────────────── */}
        {isMobile && (showLeftPanel || showChatDrawer) && (
          <div className="mobile-overlay" onClick={() => { setShowLeftPanel(false); setShowChatDrawer(false) }} />
        )}

        {/* ── Top bar ───────────────────────────────────── */}
        <div style={{ height:'48px', background:'rgba(10,22,40,0.97)', borderBottom:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 0.75rem', paddingTop:'env(safe-area-inset-top, 0px)', flexShrink:0, gap:'0.5rem' }}>
          {/* Left: logo */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
            <span style={{ fontSize:'1.1rem', color:'#c9a84c' }}>♛</span>
            <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'0.9rem', color:'#c9a84c', letterSpacing:'0.04em', display: isMobile ? 'none' : 'inline' }}>Chess Lobby</span>
          </div>
          {/* Center: turn + player names + connection */}
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.83rem', color:'#e8e0d0', overflow:'hidden', flex:1, justifyContent:'center', minWidth:0 }}>
            <span style={{ flexShrink:0 }}>{currentTurn === 'w' ? '⚪' : '⚫'}</span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#c9a84c' }} suppressHydrationWarning>
              {myColor === 'w' ? myName : opponentName}
            </span>
            <span style={{ color:'#4a5568', flexShrink:0 }}>vs</span>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} suppressHydrationWarning>
              {myColor === 'w' ? opponentName : myName}
            </span>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: socketConnected ? '#22c55e' : '#ef4444', flexShrink:0, boxShadow: socketConnected ? '0 0 4px #22c55e' : 'none' }} title={socketConnected ? 'Connected' : 'Disconnected'} />
          </div>
          {/* Right: actions */}
          <div style={{ display:'flex', gap:'0.4rem', flexShrink:0 }}>
            <button onClick={handleDraw} style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.6rem', borderRadius:'6px', fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>🤝 Draw</button>
            <button onClick={() => {
              if (moveHistory.length < 2 && pendingWhite === null) {
                if (window.confirm('Abort game?')) {
                  getSocket().emit('game:abort', { gameId: gameInfo?.gameId })
                  localStorage.removeItem('current_game')
                  window.location.href = '/lobby'
                }
              } else {
                setShowResignConfirm(true)
              }
            }} style={{ border:'1px solid rgba(239,68,68,0.4)', background:'transparent', color:'#ef4444', padding:'0.3rem 0.6rem', borderRadius:'6px', fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>
              {moveHistory.length < 2 && pendingWhite === null ? '🚫 Abort' : '🏳️ Resign'}
            </button>
            <Link href="/lobby" style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.6rem', borderRadius:'6px', fontSize:'0.78rem', textDecoration:'none', display:'flex', alignItems:'center' }}>🏠</Link>
          </div>
        </div>

        {/* ── Status / draw offer banners ───────────────── */}
        {statusMsg && (
          <div style={{ background:'rgba(201,168,76,0.12)', borderBottom:'1px solid rgba(201,168,76,0.25)', padding:'0.5rem 1rem', textAlign:'center', fontSize:'0.83rem', color:'#c9a84c', flexShrink:0 }}>
            ⚠️ {statusMsg}
          </div>
        )}
        {drawOfferReceived && (
          <div style={{ background:'rgba(34,197,94,0.1)', borderBottom:'1px solid rgba(34,197,94,0.3)', padding:'0.5rem 1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', fontSize:'0.85rem', color:'#e8e0d0', flexShrink:0 }}>
            <span>🤝 Opponent offers a draw</span>
            <button onClick={acceptDraw} style={{ background:'#22c55e', color:'#0a1628', border:'none', borderRadius:'5px', padding:'0.25rem 0.75rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>Accept</button>
            <button onClick={declineDraw} style={{ background:'transparent', color:'#ef4444', border:'1px solid rgba(239,68,68,0.5)', borderRadius:'5px', padding:'0.25rem 0.75rem', fontSize:'0.8rem', cursor:'pointer' }}>Decline</button>
          </div>
        )}

        {/* ── Mobile bar ─────────────────────────────────── */}
        <div className="mobile-bar" style={{ padding:'0.4rem 0.75rem', background:'rgba(10,22,40,0.8)', borderBottom:'1px solid rgba(201,168,76,0.1)', gap:'0.5rem', flexShrink:0 }}>
          <button onClick={() => { setShowLeftPanel(p => !p); setShowChatDrawer(false) }} style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#c9a84c', padding:'0.3rem 0.7rem', borderRadius:'6px', fontSize:'0.78rem', cursor:'pointer' }}>📋 Moves</button>
          <button onClick={() => { setShowChatDrawer(p => !p); setShowLeftPanel(false) }} style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#c9a84c', padding:'0.3rem 0.7rem', borderRadius:'6px', fontSize:'0.78rem', cursor:'pointer' }}>💬 Chat</button>
          <button onClick={() => setBoardFlipped(p => !p)} style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#c9a84c', padding:'0.3rem 0.7rem', borderRadius:'6px', fontSize:'0.78rem', cursor:'pointer' }}>🔄 Flip</button>
        </div>

        {/* ── Main area ─────────────────────────────────── */}
        <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

          {/* Left panel */}
          <div className={`left-panel${isMobile && showLeftPanel ? ' mobile-show' : ''}`} style={{ width:'clamp(180px,15vw,220px)', flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(201,168,76,0.15)', overflow:'hidden' }}>

            {/* Opponent */}
            <div style={{ padding:'0.75rem', borderBottom:'1px solid rgba(201,168,76,0.1)', background: currentTurn !== myColor ? 'rgba(201,168,76,0.04)' : 'transparent', flexShrink:0, position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <div suppressHydrationWarning onClick={() => setShowOpponentProfile(p => !p)} style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', flexShrink:0, cursor:'pointer' }}>
                  {opponentName[0]?.toUpperCase() || 'O'}
                </div>
                <div style={{ minWidth:0 }}>
                  <div onClick={() => setShowOpponentProfile(p => !p)} style={{ fontSize:'0.83rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }}>{opponentName}</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{opponentElo} · {myColor === 'w' ? '⚫' : '⚪'}</div>
                </div>
              </div>
              {/* Opponent profile popup */}
              {showOpponentProfile && (
                <div style={{ position:'absolute', top:'100%', left:'0.5rem', zIndex:300, background:'#0d1f3c', border:'1px solid rgba(201,168,76,0.4)', borderRadius:10, padding:'0.85rem 1rem', width:'200px', boxShadow:'0 8px 32px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowOpponentProfile(false)} style={{ position:'absolute', top:6, right:8, background:'none', border:'none', color:'#4a5568', cursor:'pointer', fontSize:'0.85rem' }}>✕</button>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(201,168,76,0.2)', border:'1px solid rgba(201,168,76,0.4)', color:'#c9a84c', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {opponentName[0]?.toUpperCase() || 'O'}
                    </div>
                    <div>
                      <div style={{ color:'#e8e0d0', fontSize:'0.85rem', fontWeight:600 }}>{opponentName}</div>
                      <div style={{ color:'#4a5568', fontSize:'0.7rem' }}>{opponentElo} Elo</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.5rem' }}>
                    <a href={`/profile/${opponentName}`} target="_blank" rel="noreferrer" style={{ flex:1, background:'rgba(201,168,76,.1)', color:'#c9a84c', border:'1px solid rgba(201,168,76,.3)', borderRadius:6, padding:'0.3rem 0.5rem', fontSize:'0.75rem', textDecoration:'none', textAlign:'center' }}>View Profile</a>
                  </div>
                </div>
              )}
              <div style={{ fontSize:'1.45rem', fontFamily:'monospace', color: oppClock <= 30000 ? '#ef4444' : '#e8c97a', marginTop:'0.35rem', letterSpacing:'0.05em' }}>{formatClock(oppClock)}</div>
              {oppCaptures.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'1px', marginTop:'0.2rem', alignItems:'center' }}>
                  {oppCaptures.map((p, i) => <span key={i} style={{ fontSize:'0.8rem', lineHeight:1 }}>{PIECE_UNICODE[p] || p}</span>)}
                  {oppAdv > 0 && <span style={{ fontSize:'0.68rem', color:'#22c55e', marginLeft:'3px' }}>+{oppAdv}</span>}
                </div>
              )}
            </div>

            {/* Move history */}
            <div ref={moveScrollRef} className="moves-scroll" style={{ flex:1, padding:'0.4rem 0.5rem', overflowY:'auto' }}>
              <div style={{ fontSize:'0.68rem', color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Moves</div>
              {openingName && (
                <div style={{ fontSize:'0.7rem', color:'#c9a84c', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:4, padding:'0.2rem 0.4rem', marginBottom:'0.3rem', fontStyle:'italic' }}>
                  📖 {openingName}
                </div>
              )}
              {moveHistory.map((m, i) => {
                const isLast = i === moveHistory.length - 1 && !pendingWhite
                return (
                  <div key={i} style={{ display:'flex', gap:'0.2rem', padding:'0.18rem 0.25rem', fontSize:'0.78rem', borderRadius:'3px', background: isLast ? 'rgba(201,168,76,0.12)' : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', fontFamily:'monospace' }}>
                    <span style={{ color:'#4a5568', width:'1.3rem', flexShrink:0 }}>{m.n}.</span>
                    <span style={{ color:'#e8e0d0', flex:1 }}>{m.w}</span>
                    <span style={{ color:'#9aa5b4', flex:1 }}>{m.b}</span>
                  </div>
                )
              })}
              {pendingWhite && (
                <div style={{ display:'flex', gap:'0.2rem', padding:'0.18rem 0.25rem', fontSize:'0.78rem', borderRadius:'3px', background:'rgba(201,168,76,0.12)', fontFamily:'monospace' }}>
                  <span style={{ color:'#4a5568', width:'1.3rem', flexShrink:0 }}>{moveHistory.length + 1}.</span>
                  <span style={{ color:'#e8e0d0', flex:1 }}>{pendingWhite}</span>
                  <span style={{ color:'#4a5568', flex:1 }}>…</span>
                </div>
              )}
            </div>

            {/* My card */}
            <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(201,168,76,0.1)', flexShrink:0, background: currentTurn === myColor ? 'rgba(201,168,76,0.04)' : 'transparent' }}>
              {myCaptures.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'1px', marginBottom:'0.2rem', alignItems:'center' }}>
                  {myCaptures.map((p, i) => <span key={i} style={{ fontSize:'0.8rem', lineHeight:1 }}>{PIECE_UNICODE[p] || p}</span>)}
                  {myAdv > 0 && <span style={{ fontSize:'0.68rem', color:'#22c55e', marginLeft:'3px' }}>+{myAdv}</span>}
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <div suppressHydrationWarning style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', flexShrink:0 }}>
                  {myName[0]?.toUpperCase() || 'Y'}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.83rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{myName}</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{myElo} · {myColor === 'w' ? '⚪' : '⚫'}</div>
                </div>
              </div>
              <div style={{ fontSize:'1.45rem', fontFamily:'monospace', color: myClock <= 30000 ? '#ef4444' : '#e8c97a', marginTop:'0.35rem', letterSpacing:'0.05em' }}>{formatClock(myClock)}</div>
            </div>
          </div>

          {/* Center panel — board */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0.75rem', minWidth:0, overflow:'hidden' }}>

            {/* Theme switcher */}
            <div style={{ marginBottom:'0.5rem', display:'flex', gap:'0.4rem' }}>
              {THEMES.map((t, idx) => (
                <div key={idx} onClick={() => setBoardTheme(idx)} style={{ width:'20px', height:'20px', borderRadius:'50%', cursor:'pointer', background:`linear-gradient(135deg,${t.light} 50%,${t.dark} 50%)`, border: boardTheme === idx ? '2px solid #c9a84c' : '2px solid transparent', transition:'border 0.15s', flexShrink:0 }} />
              ))}
            </div>

            {/* Board */}
            <div className="board-size" style={{ position:'relative', width:'min(calc(100dvh - 80px), calc(100vw - 500px))', maxWidth:'520px', aspectRatio:'1', flexShrink:0 }}>
              <div style={{ position:'relative', paddingLeft:'1.4rem', paddingBottom:'1.4rem', width:'100%', height:'100%', boxSizing:'border-box' }}>

                {rankLabels.map((rank, ri) => (
                  <div key={ri} style={{ position:'absolute', left:0, top:`calc(${ri}*(100%-1.4rem)/8+(100%-1.4rem)/16)`, fontSize:'0.62rem', color:'rgba(201,168,76,0.55)', fontFamily:'monospace', lineHeight:1, transform:'translateY(-50%)', userSelect:'none' }}>{rank}</div>
                ))}
                {fileLabels.map((f, ci) => (
                  <div key={f} style={{ position:'absolute', bottom:0, left:`calc(1.4rem+${ci}*(100%-1.4rem)/8+(100%-1.4rem)/16)`, fontSize:'0.62rem', color:'rgba(201,168,76,0.55)', fontFamily:'monospace', lineHeight:1, transform:'translateX(-50%)', userSelect:'none' }}>{f}</div>
                ))}

                <div style={{ position:'absolute', top:0, left:'1.4rem', right:0, bottom:'1.4rem', display:'grid', gridTemplateColumns:'repeat(8,1fr)', boxShadow:'0 8px 40px rgba(0,0,0,0.6)', border:'2px solid rgba(201,168,76,0.3)', borderRadius:'2px', overflow:'hidden' }}>
                  {displayBoard.map((row, ri) =>
                    row.map((piece, ci) => {
                      const isLight     = (ri + ci) % 2 === 0
                      const sq          = toSquare(ri, ci)
                      const isSelected  = selectedSquare === sq
                      const isValid     = validMoves.includes(sq)
                      const isLastMoveQ = lastMove && (sq === lastMove.from || sq === lastMove.to)
                      const isKingCheck = kingSquare === sq && isInCheck
                      const isBlack     = piece ? piece === piece.toLowerCase() : false
                      const unicode     = piece ? PIECE_UNICODE[piece] ?? piece : null
                      // Hide the piece at the destination square while it is being animated there
                      const isAnimDest  = animPiece?.toSq === sq
                      return (
                        <div key={`${ri}-${ci}`} className="board-sq" onClick={() => handleSquareClick(ri, ci)} style={{ display:'flex', alignItems:'center', justifyContent:'center', background: isLight ? theme.light : theme.dark, cursor:'pointer', aspectRatio:'1', position:'relative' }}>
                          {/* z1: last move highlight */}
                          {isLastMoveQ && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(255,255,0,0.22)', pointerEvents:'none', zIndex:1 }} />
                          )}
                          {/* z2: check indicator */}
                          {isKingCheck && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(255,0,0,0.5)', pointerEvents:'none', zIndex:2, animation:'pulse 1s infinite' }} />
                          )}
                          {/* z3: selected square */}
                          {isSelected && (
                            <div style={{ position:'absolute', inset:0, background:'rgba(201,168,76,0.5)', pointerEvents:'none', zIndex:3 }} />
                          )}
                          {/* z4: chess piece — hidden while animation overlay is sliding it in */}
                          {unicode && !isAnimDest && (
                            <span style={{ fontSize:'clamp(1.1rem,2.8vw,1.75rem)', lineHeight:1, color: isBlack ? '#1a0a00' : '#fff', textShadow: isBlack ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 3px rgba(0,0,0,0.8)', userSelect:'none', position:'relative', zIndex:4 }}>{unicode}</span>
                          )}
                          {/* z5: valid move dot (empty) */}
                          {isValid && !piece && (
                            <div style={{ position:'absolute', width:'32%', height:'32%', borderRadius:'50%', background:'rgba(0,0,0,0.25)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:5 }} />
                          )}
                          {/* z5: valid move ring (capture) */}
                          {isValid && piece && (
                            <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 0 4px rgba(0,0,0,0.35)', pointerEvents:'none', zIndex:5 }} />
                          )}
                        </div>
                      )
                    })
                  )}
                  {/* ── Floating emoji reactions ── */}
                  {floatingEmojis.map(e => (
                    <div key={e.id} style={{ position:'absolute', left:`${e.x}%`, bottom:'10%', fontSize:'2.5rem', animation:'floatUp 1.5s ease-out forwards', pointerEvents:'none', zIndex:20 }}>
                      {e.emoji}
                    </div>
                  ))}
                  {/* ── Sliding piece animation overlay ── */}
                  {(() => {
                    if (!animPiece) return null
                    const from = squareToColRow(animPiece.fromSq)
                    const to   = squareToColRow(animPiece.toSq)
                    const dx   = (to.col - from.col) * 100
                    const dy   = (to.row - from.row) * 100
                    const blackSymbols = ['♚','♛','♜','♝','♞','♟']
                    const isBlackPiece = blackSymbols.includes(animPiece.symbol)
                    return (
                      <div style={{
                        position: 'absolute',
                        left: `${from.col * 12.5}%`,
                        top:  `${from.row * 12.5}%`,
                        width: '12.5%',
                        height: '12.5%',
                        transform: animReady ? `translate(${dx}%, ${dy}%)` : 'translate(0,0)',
                        transition: animReady ? 'transform 0.15s ease-out' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(1.1rem,2.8vw,1.75rem)',
                        lineHeight: 1,
                        pointerEvents: 'none',
                        zIndex: 10,
                        userSelect: 'none',
                        color: isBlackPiece ? '#1a0a00' : '#fff',
                        textShadow: isBlackPiece ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 3px rgba(0,0,0,0.8)',
                      }}>
                        {animPiece.symbol}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            <div style={{ marginTop:'0.35rem', fontSize:'0.68rem', color:'rgba(201,168,76,0.35)', letterSpacing:'0.04em', textAlign:'center' }}>
              ESC to deselect · F to flip board
            </div>
          </div>

          {/* Right panel — chat/voice */}
          <div className={`right-panel${isMobile && showChatDrawer ? ' mobile-show' : ''}`} style={{ width:'clamp(260px,20vw,320px)', flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.02)', borderLeft:'1px solid rgba(201,168,76,0.15)', overflow:'hidden' }}>

            <div style={{ display:'flex', borderBottom:'1px solid rgba(201,168,76,0.15)', flexShrink:0 }}>
              {(['chat','voice'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex:1, padding:'0.65rem', textAlign:'center', cursor:'pointer', fontSize:'0.85rem', background:'transparent', border:'none', color: activeTab === tab ? '#c9a84c' : '#4a5568', borderBottom: activeTab === tab ? '2px solid #c9a84c' : '2px solid transparent', transition:'all 0.2s', fontFamily:'var(--font-crimson),Georgia,serif' }}>
                  {tab === 'chat' ? '💬 Chat' : '🎙️ Voice'}
                </button>
              ))}
            </div>

            {activeTab === 'chat' && (
              <>
                <div ref={chatScrollRef} className="chat-scroll" style={{ flex:1, overflowY:'auto', padding:'0.7rem', display:'flex', flexDirection:'column', gap:'0.4rem', minHeight:0 }}>
                  {messages.map((msg: any, i) =>
                    msg.system ? (
                      <div key={i} style={{ fontSize:'0.76rem', color: msg.divider ? 'rgba(201,168,76,0.4)' : '#4a5568', fontStyle:'italic', textAlign:'center', padding:'0.2rem' }}>{msg.text}</div>
                    ) : (
                      <div key={i} style={{ alignSelf: msg.self ? 'flex-end' : 'flex-start', maxWidth:'82%' }}>
                        {!msg.self && <div style={{ fontSize:'0.7rem', color:'#c9a84c', marginBottom:'0.12rem' }}>{msg.sender}</div>}
                        <div style={{ background: msg.self ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)', border: msg.self ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(201,168,76,0.1)', borderRadius: msg.self ? '8px 0 8px 8px' : '0 8px 8px 8px', padding:'0.4rem 0.65rem', fontSize:'0.83rem', color: msg.self ? '#e8c97a' : '#e8e0d0' }}>
                          {msg.text}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Quick messages */}
                <div style={{ padding:'0.3rem 0.55rem', borderTop:'1px solid rgba(201,168,76,0.08)', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                  {!gameOver ? (
                    <>
                      <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                        {[['gg','Good game! 🤝'],['glhf','Good luck, have fun! 🍀'],['wp','Well played! 👏'],['ty','Thank you! 😊']].map(([label, msg]) => (
                          <button key={label} className="quick-msg-btn" onClick={() => sendQuickMsg(msg)} disabled={quickCooldown}>{label}</button>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                        {['😮','😄','🤔','😤'].map(e => (
                          <button key={e} className="quick-msg-btn" onClick={() => sendQuickMsg(e)} disabled={quickCooldown} style={{ fontSize:'0.95rem', padding:'2px 6px' }}>{e}</button>
                        ))}
                        {[['nice','Nice move! ✨'],['oops','Oops! 😅'],['wow','Wow! 🤩'],['lol','haha 😂']].map(([label, msg]) => (
                          <button key={label} className="quick-msg-btn" onClick={() => sendQuickMsg(msg)} disabled={quickCooldown}>{label}</button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                      {[
                        ['gg','GG! Great game! 🏆'],
                        ['rematch?','Rematch? Let\'s go again! 🔄'],
                        ['wp','Well played! 👏'],
                        ['analyze?','Want to analyze the game together?'],
                      ].map(([label, msg]) => (
                        <button key={label} className="quick-msg-btn" onClick={() => sendQuickMsg(msg)} disabled={quickCooldown}>{label}</button>
                      ))}
                    </div>
                  )}
                  {!gameOver && (
                    <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap' }}>
                      {[['That was a great game! 👏','That was a great game! 👏'],['Good moves! 🎯','Good moves! 🎯'],['Rematch? 🔄','Rematch? 🔄'],['Well played! 🤝','Well played! 🤝']].filter(() => gameOver).map(([label, msg]) => (
                        <button key={label} className="quick-msg-btn" onClick={() => sendQuickMsg(msg)} disabled={quickCooldown}>{label}</button>
                      ))}
                    </div>
                  )}
                  {gameOver && (
                    <div style={{ display:'flex', gap:'0.25rem', flexWrap:'wrap', marginTop:'0.1rem' }}>
                      {[['That was a great game! 👏','That was a great game! 👏'],['Good moves! 🎯','Good moves! 🎯'],['Well played! 🤝','Well played! 🤝']].map(([label, msg]) => (
                        <button key={label} className="quick-msg-btn" onClick={() => sendQuickMsg(msg)} disabled={quickCooldown} style={{ fontSize:'10px' }}>{label}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:'0.4rem', padding:'0.5rem 0.65rem', borderTop:'1px solid rgba(201,168,76,0.1)', flexShrink:0 }}>
                  <input type="text" placeholder="Message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onFocus={() => setChatFocused(true)} onBlur={() => setChatFocused(false)} onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                    style={{ flex:1, background:'rgba(255,255,255,0.05)', border:`1.5px solid ${chatFocused ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`, borderRadius:'7px', padding:'0.4rem 0.6rem', color:'#e8e0d0', fontSize:'0.83rem', outline:'none', boxSizing:'border-box' }} />
                  <button onClick={sendMessage} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'6px', padding:'0.4rem 0.7rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>Send</button>
                </div>
              </>
            )}

            {activeTab === 'voice' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'20px', padding:'16px', overflow:'auto' }}>

                {/* Status bar */}
                <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.8rem', marginTop:'8px',
                  color: voiceState === 'connected' ? '#27ae60' : voiceState === 'connecting' ? '#f39c12' : voiceState === 'error' ? '#ef4444' : '#95a5a6' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'currentColor', flexShrink:0,
                    animation: voiceState === 'connecting' ? 'pulse 1s infinite' : 'none' }} />
                  {voiceState === 'connected'  ? 'Voice Connected' :
                   voiceState === 'connecting' ? 'Connecting...' :
                   voiceState === 'error'      ? 'Mic access denied' : 'Auto-connecting...'}
                </div>

                {/* Player avatars with speaking indicators */}
                <div style={{ display:'flex', gap:'32px', alignItems:'center', justifyContent:'center', flex:1 }}>

                  {/* My avatar */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                    <div suppressHydrationWarning style={{
                      width:64, height:64, borderRadius:'50%', background:'#2a3550',
                      border:`3px solid ${isSpeaking ? '#27ae60' : '#3a4560'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1.5rem', color:'#c9a84c', transition:'all 0.15s ease',
                      animation: isSpeaking ? 'speakPulse 0.5s infinite alternate' : 'none',
                    }}>
                      {(user?.username || 'Y')[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize:'0.75rem', color:'#8899aa' }}>You {isMuted ? '🔇' : '🎤'}</span>
                  </div>

                  <div style={{ color:'#3a4560', fontSize:'1.2rem' }}>vs</div>

                  {/* Opponent avatar */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                    <div suppressHydrationWarning style={{
                      width:64, height:64, borderRadius:'50%', background:'#2a3550',
                      border:`3px solid ${isOpponentSpeaking ? '#27ae60' : '#3a4560'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1.5rem', color:'#c9a84c', transition:'all 0.15s ease',
                      animation: isOpponentSpeaking ? 'speakPulse 0.5s infinite alternate' : 'none',
                    }}>
                      {(opponentName || 'O')[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize:'0.75rem', color:'#8899aa' }}>
                      {opponentName || 'Opponent'}{isDeafened ? ' 🔇' : ''}
                    </span>
                  </div>
                </div>

                {/* Controls — PUBG style */}
                <div style={{ display:'flex', gap:'12px', justifyContent:'center', alignItems:'center' }}>
                  <button onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'} style={{
                    width:52, height:52, borderRadius:'50%',
                    background: isMuted ? '#8b1a1a' : '#1a2e4a',
                    border:`2px solid ${isMuted ? '#c9353e' : '#3a4560'}`,
                    color: isMuted ? '#ff6b6b' : '#c9a84c',
                    fontSize:'1.3rem', cursor:'pointer', transition:'all 0.2s',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isMuted ? '🔇' : '🎤'}
                  </button>
                  <button onClick={toggleDeafen} title={isDeafened ? 'Undeafen' : 'Deafen'} style={{
                    width:52, height:52, borderRadius:'50%',
                    background: isDeafened ? '#8b1a1a' : '#1a2e4a',
                    border:`2px solid ${isDeafened ? '#c9353e' : '#3a4560'}`,
                    color: isDeafened ? '#ff6b6b' : '#c9a84c',
                    fontSize:'1.3rem', cursor:'pointer', transition:'all 0.2s',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isDeafened ? '🔕' : '🔊'}
                  </button>
                  {voiceState === 'connected' && (
                    <button onClick={stopVoice} title="Leave voice" style={{
                      width:52, height:52, borderRadius:'50%',
                      background:'#1a2e4a', border:'2px solid #3a4560',
                      color:'#8899aa', fontSize:'1.1rem', cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      📵
                    </button>
                  )}
                  {voiceState === 'connecting' && <div className="spinner" style={{ width:36, height:36 }} />}
                </div>

                {/* Error state */}
                {voiceState === 'error' && (
                  <div style={{ textAlign:'center', color:'#ff6b6b', fontSize:'0.8rem' }}>
                    <div>Microphone access denied</div>
                    <div style={{ color:'#8899aa', marginTop:4 }}>Allow mic access in browser settings</div>
                  </div>
                )}

                {/* Manual join — shown when idle or after error */}
                {(voiceState === 'idle' || voiceState === 'error') && (
                  <button onClick={() => { voiceStartedRef.current = true; startVoice() }} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer', fontSize:'0.9rem', marginTop:4 }}>
                    🎤 Join Voice Chat
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
