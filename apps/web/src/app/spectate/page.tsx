'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSocket } from '@/lib/socket'

const FILES = ['a','b','c','d','e','f','g','h']

const PIECE_UNICODE: Record<string, string> = {
  K:'♔', Q:'♕', R:'♖', B:'♗', N:'♘', P:'♙',
  k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟',
}

const BOARD_LIGHT = '#f0d9b5'
const BOARD_DARK  = '#b58863'

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function fenToBoard(fen: string): (string|null)[][] {
  return fen.split(' ')[0].split('/').map(row => {
    const cells: (string|null)[] = []
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) cells.push(null)
      else cells.push(ch)
    }
    return cells
  })
}

function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`
}

function SpectateInner() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId')

  const [board, setBoard]           = useState<(string|null)[][]>(fenToBoard(INITIAL_FEN))
  const [clocks, setClocks]         = useState({ w: 600000, b: 600000 })
  const [moves, setMoves]           = useState<{ n:number; w:string; b:string }[]>([])
  const [pendingWhite, setPendingWhite] = useState<string|null>(null)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [players, setPlayers]       = useState<{ white: any; black: any }>({ white: null, black: null })
  const [connected, setConnected]   = useState(false)
  const [currentTurn, setCurrentTurn] = useState<'w'|'b'>('w')
  const moveScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (moveScrollRef.current)
      moveScrollRef.current.scrollTop = moveScrollRef.current.scrollHeight
  }, [moves, pendingWhite])

  useEffect(() => {
    if (!gameId) return
    const socket = getSocket()
    socket.emit('spectate:join', { gameId })

    socket.on('spectate:state', ({ fen, moves: m, clocks: c, players: p, spectatorCount: sc }: any) => {
      setBoard(fenToBoard(fen))
      setClocks(c || { w: 600000, b: 600000 })
      setPlayers(p || { white: null, black: null })
      setSpectatorCount(sc || 0)
      setConnected(true)
      if (m && Array.isArray(m)) {
        const history: { n:number; w:string; b:string }[] = []
        for (let i = 0; i < m.length; i += 2) {
          history.push({ n: history.length + 1, w: m[i] || '—', b: m[i+1] || '' })
        }
        setMoves(history)
      }
    })

    socket.on('game:move', ({ fen, clocks: c, san, turn }: any) => {
      setBoard(fenToBoard(fen))
      if (c) setClocks(c)
      const justMoved: 'w'|'b' = turn === 'w' ? 'b' : 'w'
      setCurrentTurn(turn || 'w')
      if (san) {
        if (justMoved === 'w') {
          setPendingWhite(san)
        } else {
          setPendingWhite(prev => {
            const wMove = prev || '—'
            setMoves(prev2 => [...prev2, { n: prev2.length + 1, w: wMove, b: san }])
            return null
          })
        }
      }
    })

    socket.on('spectate:count', ({ count }: any) => setSpectatorCount(count))

    socket.on('game:end', () => setConnected(false))

    return () => {
      socket.emit('spectate:leave', { gameId })
      ;['spectate:state','game:move','spectate:count','game:end'].forEach(ev => socket.off(ev))
    }
  }, [gameId])

  const whiteName = players.white?.username || 'White'
  const blackName = players.black?.username || 'Black'
  const whiteElo  = players.white?.eloRating || 1200
  const blackElo  = players.black?.eloRating || 1200

  return (
    <>
      <style suppressHydrationWarning>{`
        .spec-sq { transition: filter 0.1s; }
        .moves-scroll::-webkit-scrollbar { width: 3px; }
        .moves-scroll::-webkit-scrollbar-track { background: transparent; }
        .moves-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .live-dot { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <div suppressHydrationWarning style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#0a1628', overflow:'hidden', fontFamily:'var(--font-crimson),Georgia,serif' }}>

        {/* Top bar */}
        <div style={{ height:'48px', background:'rgba(10,22,40,0.97)', borderBottom:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1rem', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ fontSize:'1.1rem', color:'#c9a84c' }}>♛</span>
            <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'0.9rem', color:'#c9a84c' }}>Chess Lobby</span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', color:'#ef4444', padding:'0.2rem 0.75rem', borderRadius:'999px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
              <span className="live-dot" style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#ef4444', display:'inline-block' }} />
              LIVE
            </span>
            <span style={{ fontSize:'0.82rem', color:'#9aa5b4' }}>👁 {spectatorCount} watching</span>
          </div>

          <Link href="/lobby" style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.8rem', borderRadius:'6px', fontSize:'0.82rem', textDecoration:'none' }}>
            ← Lobby
          </Link>
        </div>

        {/* Main */}
        <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

          {/* Left panel — move history */}
          <div style={{ width:'200px', flexShrink:0, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(201,168,76,0.15)' }}>

            {/* Black player (top) */}
            <div style={{ padding:'0.75rem', borderBottom:'1px solid rgba(201,168,76,0.1)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>
                  {blackName[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:'0.82rem', color:'#e8e0d0' }}>{blackName} ⚫</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{blackElo} Elo</div>
                </div>
              </div>
              <div style={{ fontSize:'1.4rem', fontFamily:'monospace', color: currentTurn === 'b' ? '#ef4444' : '#e8c97a', marginTop:'0.3rem' }}>
                {formatClock(clocks.b)}
              </div>
            </div>

            {/* Moves */}
            <div ref={moveScrollRef} className="moves-scroll" style={{ flex:1, padding:'0.4rem 0.5rem', overflowY:'auto' }}>
              <div style={{ fontSize:'0.68rem', color:'#4a5568', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Moves</div>
              {moves.map((m, i) => (
                <div key={i} style={{ display:'flex', gap:'0.2rem', padding:'0.18rem 0.25rem', fontSize:'0.78rem', borderRadius:'3px', background: i === moves.length - 1 ? 'rgba(201,168,76,0.12)' : i%2===0 ? 'rgba(255,255,255,0.02)' : 'transparent', fontFamily:'monospace' }}>
                  <span style={{ color:'#4a5568', width:'1.3rem', flexShrink:0 }}>{m.n}.</span>
                  <span style={{ color:'#e8e0d0', flex:1 }}>{m.w}</span>
                  <span style={{ color:'#9aa5b4', flex:1 }}>{m.b}</span>
                </div>
              ))}
              {pendingWhite && (
                <div style={{ display:'flex', gap:'0.2rem', padding:'0.18rem 0.25rem', fontSize:'0.78rem', borderRadius:'3px', background:'rgba(201,168,76,0.12)', fontFamily:'monospace' }}>
                  <span style={{ color:'#4a5568', width:'1.3rem', flexShrink:0 }}>{moves.length + 1}.</span>
                  <span style={{ color:'#e8e0d0', flex:1 }}>{pendingWhite}</span>
                  <span style={{ color:'#4a5568', flex:1 }}>…</span>
                </div>
              )}
            </div>

            {/* White player (bottom) */}
            <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(201,168,76,0.1)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(201,168,76,0.3)', color:'#e8e0d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>
                  {whiteName[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:'0.82rem', color:'#e8e0d0' }}>{whiteName} ⚪</div>
                  <div style={{ fontSize:'0.7rem', color:'#4a5568' }}>{whiteElo} Elo</div>
                </div>
              </div>
              <div style={{ fontSize:'1.4rem', fontFamily:'monospace', color: currentTurn === 'w' ? '#ef4444' : '#e8c97a', marginTop:'0.3rem' }}>
                {formatClock(clocks.w)}
              </div>
            </div>
          </div>

          {/* Board */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0.75rem', minWidth:0, overflow:'hidden' }}>
            {!connected && !gameId && (
              <div style={{ textAlign:'center', color:'#4a5568' }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>❌</div>
                <div>No game ID provided.</div>
                <Link href="/lobby" style={{ color:'#c9a84c', marginTop:'0.5rem', display:'inline-block' }}>← Back to Lobby</Link>
              </div>
            )}

            <div style={{ position:'relative', width:'min(calc(100dvh - 80px), calc(100vw - 220px))', maxWidth:'560px', aspectRatio:'1', flexShrink:0 }}>
              <div style={{ position:'relative', paddingLeft:'1.4rem', paddingBottom:'1.4rem', width:'100%', height:'100%', boxSizing:'border-box' }}>

                {[8,7,6,5,4,3,2,1].map((rank, ri) => (
                  <div key={ri} style={{ position:'absolute', left:0, top:`calc(${ri}*(100%-1.4rem)/8+(100%-1.4rem)/16)`, fontSize:'0.62rem', color:'#9aa5b4', fontFamily:'monospace', lineHeight:1, transform:'translateY(-50%)' }}>{rank}</div>
                ))}
                {FILES.map((f, ci) => (
                  <div key={f} style={{ position:'absolute', bottom:0, left:`calc(1.4rem+${ci}*(100%-1.4rem)/8+(100%-1.4rem)/16)`, fontSize:'0.62rem', color:'#9aa5b4', fontFamily:'monospace', lineHeight:1, transform:'translateX(-50%)' }}>{f}</div>
                ))}

                <div style={{ position:'absolute', top:0, left:'1.4rem', right:0, bottom:'1.4rem', display:'grid', gridTemplateColumns:'repeat(8,1fr)', boxShadow:'0 8px 40px rgba(0,0,0,0.6)', border:'2px solid rgba(201,168,76,0.3)', borderRadius:'2px', overflow:'hidden' }}>
                  {board.map((row, ri) =>
                    row.map((piece, ci) => {
                      const isLight = (ri + ci) % 2 === 0
                      const isBlack = piece ? piece === piece.toLowerCase() : false
                      const unicode = piece ? PIECE_UNICODE[piece] ?? piece : null
                      return (
                        <div key={`${ri}-${ci}`} className="spec-sq" style={{ display:'flex', alignItems:'center', justifyContent:'center', background: isLight ? BOARD_LIGHT : BOARD_DARK, aspectRatio:'1', position:'relative' }}>
                          {unicode && (
                            <span style={{ fontSize:'clamp(1.1rem,2.8vw,1.75rem)', lineHeight:1, color: isBlack ? '#1a0a00' : '#fff', textShadow: isBlack ? '0 1px 2px rgba(255,255,255,0.4)' : '0 1px 3px rgba(0,0,0,0.8)', userSelect:'none' }}>{unicode}</span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop:'0.5rem', fontSize:'0.75rem', color:'rgba(201,168,76,0.4)', letterSpacing:'0.04em' }}>
              Spectating · Read-only
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SpectatePage() {
  return (
    <Suspense fallback={
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a1628', color:'#c9a84c', fontFamily:'Georgia, serif' }}>
        Loading spectator view...
      </div>
    }>
      <SpectateInner />
    </Suspense>
  )
}
