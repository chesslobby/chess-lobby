'use client'
// @ts-nocheck
import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const API = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

// Unicode piece map
const PIECES = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

function parseFen(fen) {
  const [pos] = fen.split(' ')
  const board = []
  for (const row of pos.split('/')) {
    const rank = []
    for (const ch of row) {
      if (/\d/.test(ch)) {
        for (let i = 0; i < parseInt(ch); i++) rank.push(null)
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b'
        rank.push(color + ch.toUpperCase())
      }
    }
    board.push(rank)
  }
  return board
}

function parsePgnMoves(pgn) {
  if (!pgn) return []
  return pgn
    .replace(/\{[^}]*\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\d+\.\.\./g, '')
    .replace(/\d+\./g, '')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '')
    .trim()
    .split(/\s+/)
    .filter(m => m && m.length > 0)
}

function buildPositions(pgn) {
  const moves = parsePgnMoves(pgn)
  const positions = []
  const Chess = require('chess.js').Chess || require('chess.js')
  const chess = typeof Chess === 'function' ? new Chess() : new Chess.Chess()

  positions.push({ fen: chess.fen(), san: null })

  for (const san of moves) {
    try {
      const move = chess.move(san)
      if (!move) break
      positions.push({ fen: chess.fen(), san: move.san, from: move.from, to: move.to })
    } catch { break }
  }

  return { positions, moves }
}

function tcLabel(s) {
  if (!s) return ''
  if (s <= 60) return `${s}s`
  return `${Math.round(s / 60)}min`
}

function resultLabel(result, winnerId, white, black) {
  if (!result) return ''
  if (result === 'draw' || result === 'stalemate') return '½ – ½'
  if (winnerId === white?.id) return '1 – 0'
  if (winnerId === black?.id) return '0 – 1'
  return result
}

function ReplayContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gameData, setGameData] = useState(null)
  const [positions, setPositions] = useState([])
  const [moves, setMoves] = useState([])
  const [idx, setIdx] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const autoRef = useRef(null)
  const moveListRef = useRef(null)

  useEffect(() => {
    if (!gameId) { setError('No game ID provided'); setLoading(false); return }
    fetch(`${API}/games/${gameId}/replay`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setGameData(data.game)
        const { positions: pos, moves: mv } = buildPositions(data.game?.pgn || '')
        setPositions(pos)
        setMoves(mv)
        setIdx(pos.length - 1)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load game'); setLoading(false) })
  }, [gameId])

  useEffect(() => {
    if (autoPlay) {
      autoRef.current = setInterval(() => {
        setIdx(prev => {
          if (prev >= positions.length - 1) { setAutoPlay(false); return prev }
          return prev + 1
        })
      }, 900)
    }
    return () => clearInterval(autoRef.current)
  }, [autoPlay, positions.length])

  // Scroll move list to active move
  useEffect(() => {
    const el = document.getElementById(`move-${idx}`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [idx])

  const board = positions[idx] ? parseFen(positions[idx].fen) : null
  const lastFrom = positions[idx]?.from
  const lastTo = positions[idx]?.to

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

  if (loading) return (
    <div style={{ background: '#0a1628', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#c9a84c' }}>
        Loading game…
      </div>
    </div>
  )

  if (error) return (
    <div style={{ background: '#0a1628', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
        <Link href="/profile" style={{ color: '#c9a84c' }}>← Back to Profile</Link>
      </div>
    </div>
  )

  const g = gameData
  const movePairs = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({ n: Math.floor(i / 2) + 1, w: moves[i], b: moves[i + 1] || null, wi: i + 1, bi: i + 2 })
  }

  return (
    <>
      <style>{`
        .ctrl-btn{background:rgba(255,255,255,.06);border:1px solid rgba(201,168,76,.25);border-radius:8px;color:#e8e0d0;font-size:1.1rem;width:40px;height:40px;cursor:pointer;transition:background .15s;display:flex;align-items:center;justify-content:center;}
        .ctrl-btn:hover:not(:disabled){background:rgba(201,168,76,.15);}
        .ctrl-btn:disabled{opacity:.4;cursor:default;}
        .move-btn{background:transparent;border:none;color:#9aa5b4;padding:.3rem .55rem;border-radius:5px;cursor:pointer;font-size:.88rem;font-family:monospace;transition:background .1s;text-align:left;white-space:nowrap;}
        .move-btn.active{background:rgba(201,168,76,.2);color:#c9a84c;font-weight:700;}
        .move-btn:hover:not(.active){background:rgba(255,255,255,.05);}
        .auto-btn{background:transparent;border:1px solid rgba(201,168,76,.35);color:#c9a84c;padding:.4rem .9rem;border-radius:7px;cursor:pointer;font-size:.85rem;transition:background .15s;}
        .auto-btn.on{background:rgba(201,168,76,.15);}
        .auto-btn:hover{background:rgba(201,168,76,.15);}
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '1060px', margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/profile" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: '.88rem' }}>← Back to Profile</Link>
            <div style={{ flex: 1 }} />
            <div style={{ color: '#9aa5b4', fontSize: '.88rem' }}>
              {g?.whitePlayer?.username} vs {g?.blackPlayer?.username}
              {g?.timeControl ? ` · ${tcLabel(g.timeControl)}` : ''}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Board column */}
            <div>
              {/* Player bars */}
              {[
                { p: g?.blackPlayer, eloChange: g?.eloChangeBlack, top: true },
                { p: g?.whitePlayer, eloChange: g?.eloChangeWhite, top: false },
              ].map(({ p, eloChange, top }) => p && (
                <div key={top ? 'top' : 'bot'} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem .25rem', marginBottom: top ? '.25rem' : 0, marginTop: top ? 0 : '.25rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: '#c9a84c', fontSize: '.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: '#e8e0d0', fontSize: '.92rem', fontWeight: 600 }}>{p.username}</span>
                  <span style={{ color: '#4a5568', fontSize: '.8rem' }}>{p.eloRating}</span>
                  {eloChange !== undefined && eloChange !== null && (
                    <span style={{ fontSize: '.8rem', color: eloChange >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'monospace' }}>
                      {eloChange >= 0 ? `+${eloChange}` : eloChange}
                    </span>
                  )}
                </div>
              ))}

              {/* Board */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', background: '#1a2a3a', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.5)' }}>
                {board && board.map((rank, ri) =>
                  rank.map((piece, fi) => {
                    const isLight = (ri + fi) % 2 === 0
                    const sq = files[fi] + ranks[ri]
                    const isLastFrom = sq === lastFrom
                    const isLastTo = sq === lastTo
                    return (
                      <div
                        key={`${ri}-${fi}`}
                        style={{
                          position: 'absolute',
                          left: `${fi * 12.5}%`, top: `${ri * 12.5}%`,
                          width: '12.5%', height: '12.5%',
                          background: isLastFrom || isLastTo
                            ? 'rgba(201,168,76,0.45)'
                            : isLight ? '#f0d9b5' : '#b58863',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'clamp(1rem,2.8vw,1.8rem)', lineHeight: 1,
                          userSelect: 'none',
                          color: piece && piece[0] === 'b' ? '#1a0a00' : '#fff',
                          textShadow: piece && piece[0] === 'b'
                            ? '0 1px 2px rgba(255,255,255,.35)'
                            : '0 1px 3px rgba(0,0,0,.7)',
                        }}
                      >
                        {piece ? PIECES[piece] || '' : ''}
                      </div>
                    )
                  })
                )}
                {/* Rank labels */}
                {ranks.map((r, i) => (
                  <div key={r} style={{ position: 'absolute', right: '1%', top: `${i * 12.5 + 1}%`, fontSize: '.65rem', color: i % 2 === 0 ? '#b58863' : '#f0d9b5', fontWeight: 700, lineHeight: 1, pointerEvents: 'none' }}>{r}</div>
                ))}
                {/* File labels */}
                {files.map((f, i) => (
                  <div key={f} style={{ position: 'absolute', left: `${i * 12.5 + 1}%`, bottom: '1%', fontSize: '.65rem', color: i % 2 === 0 ? '#f0d9b5' : '#b58863', fontWeight: 700, lineHeight: 1, pointerEvents: 'none' }}>{f}</div>
                ))}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button className="ctrl-btn" onClick={() => { setAutoPlay(false); setIdx(0) }} disabled={idx === 0} title="First">⏮</button>
                <button className="ctrl-btn" onClick={() => { setAutoPlay(false); setIdx(i => Math.max(0, i - 1)) }} disabled={idx === 0} title="Previous">◀</button>
                <button
                  className={`auto-btn${autoPlay ? ' on' : ''}`}
                  onClick={() => {
                    if (idx >= positions.length - 1) setIdx(0)
                    setAutoPlay(v => !v)
                  }}
                >
                  {autoPlay ? '⏸ Pause' : '▶ Auto-play'}
                </button>
                <button className="ctrl-btn" onClick={() => { setAutoPlay(false); setIdx(i => Math.min(positions.length - 1, i + 1)) }} disabled={idx >= positions.length - 1} title="Next">▶</button>
                <button className="ctrl-btn" onClick={() => { setAutoPlay(false); setIdx(positions.length - 1) }} disabled={idx >= positions.length - 1} title="Last">⏭</button>
              </div>

              {/* Position indicator */}
              <div style={{ textAlign: 'center', marginTop: '.5rem', fontSize: '.8rem', color: '#4a5568' }}>
                Move {idx} of {positions.length - 1}
                {g?.result && <span style={{ marginLeft: '.75rem', color: '#c9a84c' }}>
                  {resultLabel(g.result, g.winnerId, g.whitePlayer, g.blackPlayer)} ({g.result})
                </span>}
              </div>
            </div>

            {/* Move list */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '.75rem 1rem', borderBottom: '1px solid rgba(201,168,76,.1)', fontSize: '.85rem', color: '#e8e0d0', fontWeight: 700, fontFamily: 'var(--font-playfair),Georgia,serif' }}>
                Moves
              </div>
              <div ref={moveListRef} style={{ maxHeight: '420px', overflowY: 'auto', padding: '.5rem' }}>
                {movePairs.map(({ n, w, b, wi, bi }) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '.2rem', marginBottom: '.1rem' }}>
                    <span style={{ width: '1.8rem', fontSize: '.78rem', color: '#4a5568', textAlign: 'right', flexShrink: 0, fontFamily: 'monospace' }}>{n}.</span>
                    <button id={`move-${wi}`} className={`move-btn${idx === wi ? ' active' : ''}`} onClick={() => { setAutoPlay(false); setIdx(wi) }}>{w}</button>
                    {b && <button id={`move-${bi}`} className={`move-btn${idx === bi ? ' active' : ''}`} onClick={() => { setAutoPlay(false); setIdx(bi) }}>{b}</button>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default function ReplayPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#c9a84c',
        fontSize: '1.2rem'
      }}>
        Loading replay...
      </div>
    }>
      <ReplayContent />
    </Suspense>
  )
}
