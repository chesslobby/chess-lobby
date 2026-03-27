'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getSocket } from '@/lib/socket'
import { getUser } from '@/lib/api'
import { playMoveSound, playCaptureSound, playCheckSound, playGameEndSound } from '@/lib/sounds'

// ── Themes ──────────────────────────────────────────────────────
const THEMES = [
  { light: '#f0d9b5', dark: '#b58863' }, // Classic Wood
  { light: '#ffffdd', dark: '#86a666' }, // Emerald Green
  { light: '#dee3e6', dark: '#8ca2ad' }, // Midnight Blue
]

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

const PIECE_UNICODE: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 }

const RESULT_REASONS: Record<string, string> = {
  checkmate: 'by Checkmate', resign: 'by Resignation',
  timeout: 'by Timeout',    stalemate: 'Stalemate',
  draw: 'by Agreement',     abandoned: 'Abandoned',
}

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

/** Find a piece that disappeared between two FEN positions */
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

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

// ── Component ────────────────────────────────────────────────────
export default function GamePage() {
  const [boardTheme, setBoardTheme] = useState(0)
  const [gameInfo, setGameInfo]     = useState<any>(null)
  const [chess, setChess]           = useState<any>(null)
  const [board, setBoard]           = useState<(string | null)[][]>(fenToBoard(INITIAL_FEN))
  const [fen, setFen]               = useState(INITIAL_FEN)
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w')
  const [myColor, setMyColor]       = useState<'w' | 'b'>('w')
  const [boardFlipped, setBoardFlipped] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [validMoves, setValidMoves] = useState<string[]>([])
  const [clocks, setClocks]         = useState({ w: 600000, b: 600000 })
  const [gameOver, setGameOver]     = useState(false)
  const [gameResult, setGameResult] = useState('')
  const [gameResultReason, setGameResultReason] = useState('')
  const [eloChange, setEloChange]   = useState<number | null>(null)
  const [captured, setCaptured]     = useState<{ w: string[], b: string[] }>({ w: [], b: [] })
  const [moveHistory, setMoveHistory] = useState<{ n: number; w: string; b: string }[]>([])
  const [pendingWhite, setPendingWhite] = useState<string | null>(null)
  const [activeTab, setActiveTab]   = useState<'chat' | 'voice'>('chat')
  const [messages, setMessages]     = useState<ChatMsg[]>([
    { sender: 'System', text: 'Good luck! Have fun! 🤝', system: true },
  ])
  const [chatInput, setChatInput]   = useState('')
  const [chatFocused, setChatFocused] = useState(false)
  const [voiceJoined, setVoiceJoined] = useState(false)

  // Refs that stay current inside socket closures
  const fenRef          = useRef(INITIAL_FEN)
  const myColorRef      = useRef<'w' | 'b'>('w')
  const pendingWhiteRef = useRef<string | null>(null)
  const moveScrollRef   = useRef<HTMLDivElement>(null)
  const chatScrollRef   = useRef<HTMLDivElement>(null)

  const theme = THEMES[boardTheme]

  // ── Auto-scroll move list + chat ─────────────────────────────
  useEffect(() => {
    if (moveScrollRef.current)
      moveScrollRef.current.scrollTop = moveScrollRef.current.scrollHeight
  }, [moveHistory, pendingWhite])

  useEffect(() => {
    if (chatScrollRef.current)
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [messages])

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

  // ── Game init + socket ───────────────────────────────────────
  useEffect(() => {
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
    socket.emit('game:ready', { gameId: info.gameId })

    socket.on('game:start', ({ fen: startFen, clocks: c }: any) => {
      const { Chess } = require('chess.js')
      const ch = new Chess()
      if (startFen) ch.load(startFen)
      const f = ch.fen()
      fenRef.current = f
      setChess(ch); setFen(f); setBoard(fenToBoard(f)); setCurrentTurn(ch.turn())
      if (c) setClocks(c)
    })

    socket.on('game:move', ({ fen: moveFen, clocks: c, san }: any) => {
      const { Chess } = require('chess.js')
      const ch = new Chess()
      ch.load(moveFen)
      const justMoved: 'w' | 'b' = ch.turn() === 'w' ? 'b' : 'w'
      const isOpponent = justMoved !== myColorRef.current

      // Capture detection (only for opponent; mine handled in handleSquareClick)
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

      // Move history (server is source of truth for both players)
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

    socket.on('chat:receive', ({ senderName, message }: any) => {
      setMessages(prev => [...prev, { sender: senderName, text: message, self: false }])
    })

    return () => {
      ['game:start','game:move','game:clock','game:end','game:invalid-move','chat:receive']
        .forEach(ev => socket.off(ev))
    }
  }, [])

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
    if (gameOver || !chess) return
    if (chess.turn() !== myColor) return

    const sq = toSquare(dRow, dCol)

    if (selectedSquare) {
      if (validMoves.includes(sq)) {
        getSocket().emit('game:move', { gameId: gameInfo?.gameId, from: selectedSquare, to: sq, promotion: 'q' })

        // Optimistic update
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
    const user = getUser()
    setMessages(prev => [...prev, { sender: user?.username || 'You', text: chatInput.trim(), self: true }])
    setChatInput('')
  }

  // ── Derived values ───────────────────────────────────────────
  const user        = getUser()
  const myName      = user?.username || 'You'
  const myElo       = user?.eloRating || 1200
  const opponentName = gameInfo?.opponent?.username || 'Opponent'
  const opponentElo  = gameInfo?.opponent?.eloRating || 1200

  const myClock  = myColor === 'w' ? clocks.w : clocks.b
  const oppClock = myColor === 'w' ? clocks.b : clocks.w

  const myCaptures  = myColor === 'w' ? captured.w : captured.b
  const oppCaptures = myColor === 'w' ? captured.b : captured.w
  const bal        = materialBalance(captured)
  const myAdv      = myColor === 'w' ? bal.w : bal.b
  const oppAdv     = myColor === 'w' ? bal.b : bal.w

  return (
    <>
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
        .game-over-card { animation: fadeInScale 0.3s ease both; }
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

        {/* ── Top bar ───────────────────────────────────── */}
        <div style={{ height:'48px', background:'rgba(10,22,40,0.97)', borderBottom:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', paddingTop:'env(safe-area-inset-top, 0px)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span style={{ fontSize:'1.1rem', color:'#c9a84c' }}>♛</span>
            <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'0.9rem', color:'#c9a84c', letterSpacing:'0.04em' }}>Chess Lobby</span>
          </div>
          <div style={{ fontSize:'0.9rem', color:'#e8e0d0', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <span>{currentTurn === 'w' ? '⚪' : '⚫'}</span>
            <span>{currentTurn === 'w' ? "White's Turn" : "Black's Turn"}</span>
          </div>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <button onClick={() => getSocket().emit('game:draw-offer', { gameId: gameInfo?.gameId })} style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.8rem', borderRadius:'6px', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>🤝 Draw</button>
            <button onClick={() => getSocket().emit('game:resign', { gameId: gameInfo?.gameId })} style={{ border:'1px solid rgba(239,68,68,0.4)', background:'transparent', color:'#ef4444', padding:'0.3rem 0.8rem', borderRadius:'6px', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>🏳️ Resign</button>
            <Link href="/lobby" style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.7rem', borderRadius:'6px', fontSize:'0.82rem', textDecoration:'none', display:'flex', alignItems:'center' }}>🏠</Link>
          </div>
        </div>

        {/* ── Main area ─────────────────────────────────── */}
        <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

          {/* Left panel */}
          <div style={{ width:'clamp(180px,15vw,220px)', flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(201,168,76,0.15)', overflow:'hidden' }}>

            {/* Opponent */}
            <div style={{ padding:'0.75rem', borderBottom:'1px solid rgba(201,168,76,0.1)', background: currentTurn !== myColor ? 'rgba(201,168,76,0.04)' : 'transparent', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', flexShrink:0 }}>
                  {opponentName[0]?.toUpperCase() || 'O'}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.83rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{opponentName}</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{opponentElo} · {myColor === 'w' ? '⚫' : '⚪'}</div>
                </div>
              </div>
              <div style={{ fontSize:'1.45rem', fontFamily:'monospace', color: currentTurn !== myColor ? '#ef4444' : '#e8c97a', marginTop:'0.35rem', letterSpacing:'0.05em' }}>{formatClock(oppClock)}</div>
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
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.78rem', flexShrink:0 }}>
                  {myName[0]?.toUpperCase() || 'Y'}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.83rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{myName}</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{myElo} · {myColor === 'w' ? '⚪' : '⚫'}</div>
                </div>
              </div>
              <div style={{ fontSize:'1.45rem', fontFamily:'monospace', color: currentTurn === myColor ? '#ef4444' : '#e8c97a', marginTop:'0.35rem', letterSpacing:'0.05em' }}>{formatClock(myClock)}</div>
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
            <div style={{ position:'relative', width:'min(calc(100dvh - 80px), calc(100vw - 500px))', maxWidth:'520px', aspectRatio:'1', flexShrink:0 }}>
              <div style={{ position:'relative', paddingLeft:'1.4rem', paddingBottom:'1.4rem', width:'100%', height:'100%', boxSizing:'border-box' }}>

                {rankLabels.map((rank, ri) => (
                  <div key={ri} style={{ position:'absolute', left:0, top:`calc(${ri}*(100%-1.4rem)/8+(100%-1.4rem)/16)`, fontSize:'0.62rem', color:'#9aa5b4', fontFamily:'monospace', lineHeight:1, transform:'translateY(-50%)' }}>{rank}</div>
                ))}
                {fileLabels.map((f, ci) => (
                  <div key={f} style={{ position:'absolute', bottom:0, left:`calc(1.4rem+${ci}*(100%-1.4rem)/8+(100%-1.4rem)/16)`, fontSize:'0.62rem', color:'#9aa5b4', fontFamily:'monospace', lineHeight:1, transform:'translateX(-50%)' }}>{f}</div>
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
          <div style={{ width:'clamp(260px,20vw,300px)', flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.02)', borderLeft:'1px solid rgba(201,168,76,0.15)', overflow:'hidden' }}>

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
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.5rem', padding:'1.5rem' }}>
                <div style={{ display:'flex', gap:'2rem' }}>
                  {[{ label: opponentName, init: opponentName[0]?.toUpperCase() || 'O' }, { label: myName, init: myName[0]?.toUpperCase() || 'Y' }].map(p => (
                    <div key={p.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.35rem' }}>
                      <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color:'#c9a84c' }}>{p.init}</div>
                      <span style={{ fontSize:'0.76rem', color:'#9aa5b4', textAlign:'center' }}>{p.label}</span>
                    </div>
                  ))}
                </div>
                {voiceJoined
                  ? <button onClick={() => setVoiceJoined(false)} style={{ background:'transparent', color:'#c9a84c', border:'1.5px solid #c9a84c', borderRadius:'8px', padding:'0.65rem 1.75rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer' }}>Mute</button>
                  : <button onClick={() => setVoiceJoined(true)} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.65rem 1.75rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer' }}>Join Voice</button>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
