'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getSocket } from '@/lib/socket'
import { getUser } from '@/lib/api'
import { playMoveSound, playCaptureSound, playCheckSound, playGameEndSound } from '@/lib/sounds'
import { showToast } from '@/components/Toast'

// ── Constants ───────────────────────────────────────────────────
const THEMES = [
  { light: '#f0d9b5', dark: '#b58863' }, // Classic Wood
  { light: '#ffffdd', dark: '#86a666' }, // Emerald Green
  { light: '#dee3e6', dark: '#8ca2ad' }, // Midnight Blue
]

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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

  // Refs for stale-closure safety
  const fenRef          = useRef(INITIAL_FEN)
  const myColorRef      = useRef<'w' | 'b'>('w')
  const pendingWhiteRef = useRef<string | null>(null)
  const moveScrollRef   = useRef<HTMLDivElement>(null)
  const chatScrollRef   = useRef<HTMLDivElement>(null)
  const peerRef         = useRef<RTCPeerConnection | null>(null)
  const remoteAudioRef  = useRef<HTMLAudioElement | null>(null)
  const statusTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (e.key === 'Escape') { setSelectedSquare(null); setValidMoves([]) }
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
    })

    socket.on('game:move', ({ fen: moveFen, clocks: c, san }: any) => {
      const { Chess } = require('chess.js')
      const ch = new Chess()
      ch.load(moveFen)
      const justMoved: 'w' | 'b' = ch.turn() === 'w' ? 'b' : 'w'
      const isOpponent = justMoved !== myColorRef.current

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
    })

    return () => {
      ['connect','disconnect','game:start','game:move','game:clock','game:end','game:invalid-move',
       'game:draw-offered','game:opponent-disconnected','chat:receive'].forEach(ev => socket.off(ev))
    }
  }, [mounted])

  // ── Voice ────────────────────────────────────────────────────
  async function startVoice() {
    const info = gameInfo
    try {
      setVoiceState('connecting')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      setLocalStream(stream)

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      peerRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0]
        setVoiceState('connected')
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket().emit('voice:ice', {
            gameId: info?.gameId,
            toUserId: info?.opponent?.id,
            candidate: event.candidate,
          })
        }
      }

      const socket = getSocket()
      socket.emit('voice:join', { gameId: info?.gameId })

      socket.on('voice:initiate', async ({ toUserId }: any) => {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket.emit('voice:offer', { gameId: info?.gameId, toUserId, offer })
      })

      socket.on('voice:offer', async ({ fromUserId, offer }: any) => {
        await pc.setRemoteDescription(offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('voice:answer', { gameId: info?.gameId, toUserId: fromUserId, answer })
      })

      socket.on('voice:answer', async ({ answer }: any) => {
        await pc.setRemoteDescription(answer)
      })

      socket.on('voice:ice', async ({ candidate }: any) => {
        try { await pc.addIceCandidate(candidate) } catch {}
      })

      socket.on('voice:peer-left', () => {
        setVoiceState('idle')
        showToast('Opponent left voice chat', 'info')
      })

    } catch (err) {
      console.error('Voice error:', err)
      setVoiceState('error')
      showToast('Microphone access denied', 'error')
    }
  }

  function stopVoice() {
    localStream?.getTracks().forEach(t => t.stop())
    peerRef.current?.close()
    peerRef.current = null
    setLocalStream(null)
    setVoiceState('idle')
    getSocket().emit('voice:leave', { gameId: gameInfo?.gameId })
    ;['voice:initiate','voice:offer','voice:answer','voice:ice','voice:peer-left']
      .forEach(ev => getSocket().off(ev))
  }

  function toggleMute() {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = isMuted })
      setIsMuted(m => !m)
    }
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

  // ── Square click ─────────────────────────────────────────────
  function handleSquareClick(dRow: number, dCol: number) {
    if (gameOver || !chess || gameWaiting) return
    if (chess.turn() !== myColor) return

    const sq = toSquare(dRow, dCol)
    console.log('Clicked:', sq, 'myColor:', myColor, 'turn:', chess?.turn(), 'piece:', chess?.get(sq as any))

    if (selectedSquare) {
      if (validMoves.includes(sq)) {
        getSocket().emit('game:move', { gameId: gameInfo?.gameId, from: selectedSquare, to: sq, promotion: 'q' })
        try {
          const { Chess } = require('chess.js')
          const opt = new Chess(); opt.load(fen)
          const mv = opt.move({ from: selectedSquare, to: sq, promotion: 'q' })
          if (mv) {
            if (mv.captured) {
              const cap = myColor === 'w' ? mv.captured : mv.captured.toUpperCase()
              setCaptured(prev => ({ ...prev, [myColor]: [...prev[myColor], cap] }))
              playCaptureSound()
            } else { playMoveSound() }
            if (opt.inCheck()) playCheckSound()
            const nf = opt.fen()
            fenRef.current = nf
            setChess(opt); setFen(nf); setBoard(fenToBoard(nf)); setCurrentTurn(opt.turn())
          }
        } catch {}
        setSelectedSquare(null); setValidMoves([])
      } else {
        const piece = chess.get(sq)
        if (piece && piece.color === myColor) {
          setSelectedSquare(sq)
          setValidMoves(chess.moves({ square: sq, verbose: true }).map((m: any) => m.to))
        } else { setSelectedSquare(null); setValidMoves([]) }
      }
    } else {
      const piece = chess.get(sq)
      if (piece && piece.color === myColor) {
        setSelectedSquare(sq)
        setValidMoves(chess.moves({ square: sq, verbose: true }).map((m: any) => m.to))
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
    if (window.confirm('Are you sure you want to resign?')) {
      getSocket().emit('game:resign', { gameId: gameInfo?.gameId })
    }
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

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Hidden audio element for remote voice */}
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

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
        .game-over-card { animation: fadeInScale 0.3s ease both; }
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
                <div style={{ fontSize:'1.2rem', fontWeight:700, color: eloChange >= 0 ? '#22c55e' : '#ef4444', marginBottom:'1.25rem' }}>
                  {eloChange >= 0 ? '+' : ''}{eloChange} Elo
                </div>
              )}
              <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
                <button onClick={() => { localStorage.removeItem('current_game'); window.location.href = '/lobby' }} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.8rem 1.5rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>Play Again</button>
                <button onClick={() => { localStorage.removeItem('current_game'); window.location.href = '/lobby' }} style={{ background:'transparent', color:'#c9a84c', border:'1.5px solid rgba(201,168,76,0.5)', borderRadius:'8px', padding:'0.8rem 1.5rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>Lobby</button>
              </div>
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
            <button onClick={handleResign} style={{ border:'1px solid rgba(239,68,68,0.4)', background:'transparent', color:'#ef4444', padding:'0.3rem 0.6rem', borderRadius:'6px', fontSize:'0.78rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>🏳️ Resign</button>
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
            <div style={{ padding:'0.75rem', borderBottom:'1px solid rgba(201,168,76,0.1)', background: currentTurn !== myColor ? 'rgba(201,168,76,0.04)' : 'transparent', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <div suppressHydrationWarning style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', flexShrink:0 }}>
                  {opponentName[0]?.toUpperCase() || 'O'}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.83rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{opponentName}</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{opponentElo} · {myColor === 'w' ? '⚫' : '⚪'}</div>
                </div>
              </div>
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
                      const isLight    = (ri + ci) % 2 === 0
                      const sq         = toSquare(ri, ci)
                      const isSelected = selectedSquare === sq
                      const isValid    = validMoves.includes(sq)
                      const isBlack    = piece ? piece === piece.toLowerCase() : false
                      const unicode    = piece ? PIECE_UNICODE[piece] ?? piece : null
                      let bg = isLight ? theme.light : theme.dark
                      if (isSelected) bg = 'rgba(201,168,76,0.65)'
                      return (
                        <div key={`${ri}-${ci}`} className={`board-sq${isValid && !piece ? ' valid-dot' : ''}`} onClick={() => handleSquareClick(ri, ci)} style={{ display:'flex', alignItems:'center', justifyContent:'center', background:bg, cursor:'pointer', aspectRatio:'1', position:'relative', outline: isValid && piece ? '2px solid rgba(201,168,76,0.7)' : 'none', outlineOffset:'-2px' }}>
                          {unicode && (
                            <span style={{ fontSize:'clamp(1.1rem,2.8vw,1.75rem)', lineHeight:1, color: isBlack ? '#1a0a00' : '#fff', textShadow: isBlack ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 3px rgba(0,0,0,0.8)', userSelect:'none', position:'relative', zIndex:1 }}>{unicode}</span>
                          )}
                        </div>
                      )
                    })
                  )}
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
                  {messages.map((msg, i) =>
                    msg.system ? (
                      <div key={i} style={{ fontSize:'0.76rem', color:'#4a5568', fontStyle:'italic', textAlign:'center', padding:'0.2rem' }}>{msg.text}</div>
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
                <div style={{ display:'flex', gap:'0.25rem', padding:'0.35rem 0.6rem', flexWrap:'wrap', borderTop:'1px solid rgba(201,168,76,0.08)' }}>
                  {['👏','😮','😄','🤔','😤','🏆'].map(e => (
                    <button key={e} onClick={() => setChatInput(p => p + e)} style={{ fontSize:'1rem', cursor:'pointer', padding:'0.2rem 0.3rem', borderRadius:'4px', background:'rgba(255,255,255,0.04)', border:'none' }}>{e}</button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'0.4rem', padding:'0.5rem 0.65rem', borderTop:'1px solid rgba(201,168,76,0.1)', flexShrink:0 }}>
                  <input type="text" placeholder="Message..." value={chatInput} onChange={e => setChatInput(e.target.value)} onFocus={() => setChatFocused(true)} onBlur={() => setChatFocused(false)} onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                    style={{ flex:1, background:'rgba(255,255,255,0.05)', border:`1.5px solid ${chatFocused ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`, borderRadius:'7px', padding:'0.4rem 0.6rem', color:'#e8e0d0', fontSize:'0.83rem', outline:'none', boxSizing:'border-box' }} />
                  <button onClick={sendMessage} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'6px', padding:'0.4rem 0.7rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>Send</button>
                </div>
              </>
            )}

            {activeTab === 'voice' && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.25rem', padding:'1.5rem', textAlign:'center' }}>

                {/* Avatar circles */}
                <div style={{ display:'flex', gap:'2rem' }}>
                  {[
                    { label: opponentName, init: opponentName[0]?.toUpperCase() || 'O' },
                    { label: myName,       init: myName[0]?.toUpperCase() || 'Y' },
                  ].map(p => (
                    <div key={p.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem' }}>
                      <div className={voiceState === 'connected' ? 'voice-ring' : ''} style={{ width:'52px', height:'52px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:`1px solid ${voiceState === 'connected' ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.15rem', color:'#c9a84c' }}>
                        {p.init}
                      </div>
                      <span style={{ fontSize:'0.72rem', color:'#9aa5b4' }}>{p.label}</span>
                    </div>
                  ))}
                </div>

                {/* State text */}
                <div style={{ fontSize:'0.82rem', color: voiceState === 'error' ? '#ef4444' : voiceState === 'connected' ? '#22c55e' : '#9aa5b4' }}>
                  {voiceState === 'idle'       && 'Click to join voice chat'}
                  {voiceState === 'connecting' && '⏳ Connecting...'}
                  {voiceState === 'connected'  && '✓ Voice connected'}
                  {voiceState === 'error'      && '❌ Microphone access denied'}
                </div>

                {/* Controls */}
                {voiceState === 'idle' && (
                  <button onClick={startVoice} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.65rem 1.75rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer' }}>
                    Join Voice 🎙️
                  </button>
                )}

                {voiceState === 'connecting' && (
                  <div className="spinner" />
                )}

                {voiceState === 'connected' && (
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={toggleMute} style={{ background:'rgba(201,168,76,0.1)', color:'#c9a84c', border:'1px solid rgba(201,168,76,0.4)', borderRadius:'7px', padding:'0.5rem 1rem', fontSize:'0.85rem', cursor:'pointer' }}>
                      {isMuted ? '🔊 Unmute' : '🔇 Mute'}
                    </button>
                    <button onClick={stopVoice} style={{ background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.4)', borderRadius:'7px', padding:'0.5rem 1rem', fontSize:'0.85rem', cursor:'pointer' }}>
                      🔴 Leave
                    </button>
                  </div>
                )}

                {voiceState === 'error' && (
                  <button onClick={startVoice} style={{ background:'rgba(201,168,76,0.1)', color:'#c9a84c', border:'1px solid rgba(201,168,76,0.4)', borderRadius:'7px', padding:'0.5rem 1rem', fontSize:'0.85rem', cursor:'pointer' }}>
                    Try Again
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
