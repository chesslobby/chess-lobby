'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { detectOpeningFromMoves } from '@/lib/openings'

const API = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PIECE_UNICODE = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}

function fenToBoard(fen) {
  return fen.split(' ')[0].split('/').map(row => {
    const cells = []
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) cells.push(null)
      else cells.push(ch)
    }
    return cells
  })
}

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 }

function getMoveQuality(move, inCheck, inCheckmate) {
  if (inCheckmate) return 'brilliant'
  if (move.captured) {
    const capturedVal = PIECE_VALUES[move.captured] || 0
    const pieceVal = PIECE_VALUES[move.piece] || 0
    if (capturedVal > pieceVal) return 'excellent'
    if (capturedVal === pieceVal) return 'good'
    if (capturedVal < pieceVal) return 'blunder'
  }
  if (inCheck) return 'excellent'
  return 'good'
}

const QUALITY_CONFIG = {
  brilliant: { icon: '!!', color: '#22d3ee', label: 'Brilliant' },
  excellent:  { icon: '!',  color: '#22c55e', label: 'Excellent' },
  good:       { icon: '',   color: '#9aa5b4', label: 'Good' },
  inaccuracy: { icon: '?!', color: '#eab308', label: 'Inaccuracy' },
  mistake:    { icon: '?',  color: '#f97316', label: 'Mistake' },
  blunder:    { icon: '??', color: '#ef4444', label: 'Blunder' },
}

function analyzePgn(pgn) {
  try {
    const { Chess } = require('chess.js')
    // Parse moves from PGN — strip move numbers and result
    const tokens = pgn
      .replace(/\{[^}]*\}/g, '')
      .replace(/\([^)]*\)/g, '')
      .split(/\s+/)
      .filter(t => t && !t.match(/^\d+\./) && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/))

    const chess = new Chess()
    const analyses = []
    const sanMoves = []

    for (const token of tokens) {
      try {
        const before = chess.fen()
        const result = chess.move(token)
        if (!result) continue
        sanMoves.push(result.san)
        const inCheck = chess.inCheck()
        const inCheckmate = chess.isCheckmate()
        const quality = getMoveQuality(result, inCheck, inCheckmate)
        analyses.push({
          san: result.san,
          fen: chess.fen(),
          quality,
          color: result.color,
          piece: result.piece,
          captured: result.captured || null,
        })
      } catch {}
    }

    return { analyses, sanMoves }
  } catch (e) {
    return { analyses: [], sanMoves: [] }
  }
}

function groupMoves(analyses) {
  const rows = []
  let i = 0
  while (i < analyses.length) {
    const w = analyses[i]
    const b = analyses[i + 1] || null
    rows.push({ n: Math.floor(i / 2) + 1, w, b })
    i += 2
  }
  return rows
}

export default function AnalysisPage({ params }) {
  const { gameId } = params
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analyses, setAnalyses] = useState([])
  const [sanMoves, setSanMoves] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [displayFen, setDisplayFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [openingName, setOpeningName] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/games/${gameId}/replay`)
        if (!res.ok) throw new Error('Game not found')
        const data = await res.json()
        setGame(data.game)
        if (data.game?.pgn) {
          const { analyses: a, sanMoves: sm } = analyzePgn(data.game.pgn)
          setAnalyses(a)
          setSanMoves(sm)
          if (sm.length > 0) {
            const name = detectOpeningFromMoves(sm)
            if (name && name !== 'Opening') setOpeningName(name)
          }
          if (a.length > 0) setDisplayFen(a[a.length - 1].fen)
        }
      } catch (e) {
        setError('Could not load game. It may not exist or the PGN is unavailable.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId])

  function selectMove(idx) {
    setSelectedIdx(idx)
    if (idx === -1) {
      setDisplayFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    } else {
      setDisplayFen(analyses[idx]?.fen || displayFen)
    }
  }

  const board = fenToBoard(displayFen)
  const rows = groupMoves(analyses)

  const totalMoves = analyses.length
  const blunders = analyses.filter(a => a.quality === 'blunder').length
  const mistakes = analyses.filter(a => a.quality === 'mistake').length
  const good = analyses.filter(a => ['good', 'excellent', 'brilliant'].includes(a.quality)).length
  const accuracy = totalMoves > 0 ? Math.round((good / totalMoves) * 100) : 0

  return (
    <>
      <style>{`
        .analysis-move-row { display:flex; align-items:center; padding:0.3rem 0.5rem; border-radius:6px; cursor:pointer; transition:background 0.15s; }
        .analysis-move-row:hover { background:rgba(201,168,76,0.08); }
        .analysis-move-row.selected { background:rgba(201,168,76,0.16); }
        .move-btn { background:none; border:none; padding:0.15rem 0.35rem; border-radius:4px; cursor:pointer; font-family:var(--font-crimson),Georgia,serif; font-size:0.9rem; transition:background 0.15s; display:inline-flex; align-items:center; gap:0.2rem; }
        .move-btn:hover { background:rgba(201,168,76,0.12); }
        .move-btn.active { background:rgba(201,168,76,0.2); color:#c9a84c; }
        .stat-card { background:rgba(255,255,255,0.04); border:1px solid rgba(201,168,76,0.15); border-radius:10px; padding:0.75rem 1rem; text-align:center; flex:1; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .board-sq { width:12.5%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:clamp(1rem,3vw,1.6rem); cursor:pointer; user-select:none; position:relative; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/lobby" style={{ color: '#4a5568', fontSize: '0.85rem', textDecoration: 'none' }}>← Back</Link>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.6rem', color: '#e8e0d0', margin: 0, fontWeight: 700 }}>
              📊 Game Analysis
            </h1>
            {openingName && (
              <span style={{ fontSize: '0.8rem', color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 6, padding: '0.2rem 0.6rem' }}>
                📖 {openingName}
              </span>
            )}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#4a5568' }}>Loading game...</div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{error}</div>
          )}

          {!loading && !error && game && (
            <div className="fade-up" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

              {/* Left: Move list */}
              <div style={{ flex: '0 0 240px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, overflow: 'hidden', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(201,168,76,0.1)', color: '#e8e0d0', fontWeight: 700, fontSize: '0.88rem' }}>
                  Move List
                </div>
                <div style={{ overflow: 'auto', flex: 1, padding: '0.5rem' }}>
                  {/* Start position row */}
                  <div
                    className={`analysis-move-row${selectedIdx === -1 ? ' selected' : ''}`}
                    onClick={() => selectMove(-1)}
                    style={{ color: '#4a5568', fontSize: '0.8rem', marginBottom: '0.25rem' }}
                  >
                    Starting position
                  </div>
                  {rows.map((row) => (
                    <div key={row.n} className="analysis-move-row">
                      <span style={{ color: '#4a5568', fontSize: '0.78rem', width: '1.8rem', flexShrink: 0 }}>{row.n}.</span>
                      {/* White move */}
                      <button
                        className={`move-btn${selectedIdx === (row.n - 1) * 2 ? ' active' : ''}`}
                        onClick={() => selectMove((row.n - 1) * 2)}
                        style={{ color: '#e8e0d0', minWidth: '4rem', justifyContent: 'flex-start' }}
                      >
                        {row.w.san}
                        {QUALITY_CONFIG[row.w.quality]?.icon && (
                          <span style={{ color: QUALITY_CONFIG[row.w.quality].color, fontSize: '0.75rem' }}>
                            {QUALITY_CONFIG[row.w.quality].icon}
                          </span>
                        )}
                      </button>
                      {/* Black move */}
                      {row.b && (
                        <button
                          className={`move-btn${selectedIdx === (row.n - 1) * 2 + 1 ? ' active' : ''}`}
                          onClick={() => selectMove((row.n - 1) * 2 + 1)}
                          style={{ color: '#e8e0d0', minWidth: '4rem', justifyContent: 'flex-start' }}
                        >
                          {row.b.san}
                          {QUALITY_CONFIG[row.b.quality]?.icon && (
                            <span style={{ color: QUALITY_CONFIG[row.b.quality].color, fontSize: '0.75rem' }}>
                              {QUALITY_CONFIG[row.b.quality].icon}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                  {analyses.length === 0 && (
                    <div style={{ color: '#4a5568', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                      No moves to display
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Board */}
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                {/* Board */}
                <div style={{ width: '100%', maxWidth: '400px', background: '#1a1a2e', borderRadius: 8, padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  {board.map((rank, ri) => (
                    <div key={ri} style={{ display: 'flex' }}>
                      {rank.map((piece, fi) => {
                        const isLight = (ri + fi) % 2 === 0
                        return (
                          <div
                            key={fi}
                            className="board-sq"
                            style={{ background: isLight ? '#f0d9b5' : '#b58863', color: piece && piece === piece.toUpperCase() ? '#1a1a1a' : '#f0f0f0' }}
                          >
                            {piece && (PIECE_UNICODE[piece] || piece)}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Prev/Next controls */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => selectMove(Math.max(-1, selectedIdx - 1))}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '1rem' }}
                  >◀</button>
                  <span style={{ color: '#4a5568', fontSize: '0.8rem', minWidth: '6rem', textAlign: 'center' }}>
                    {selectedIdx === -1 ? 'Start' : `Move ${selectedIdx + 1} / ${analyses.length}`}
                  </span>
                  <button
                    onClick={() => selectMove(Math.min(analyses.length - 1, selectedIdx + 1))}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '1rem' }}
                  >▶</button>
                  <button
                    onClick={() => selectMove(analyses.length - 1)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem' }}
                  >End</button>
                </div>

                {/* Current move quality */}
                {selectedIdx >= 0 && analyses[selectedIdx] && (() => {
                  const q = QUALITY_CONFIG[analyses[selectedIdx].quality]
                  return q ? (
                    <div style={{ background: q.color + '18', border: `1px solid ${q.color}40`, borderRadius: 8, padding: '0.4rem 1rem', color: q.color, fontSize: '0.85rem', fontWeight: 600 }}>
                      {q.icon} {q.label}
                    </div>
                  ) : null
                })()}
              </div>

              {/* Right: Summary */}
              <div style={{ flex: '0 0 200px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Game Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#4a5568' }}>Total moves</span>
                      <span style={{ color: '#e8e0d0' }}>{totalMoves}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#4a5568' }}>Accuracy</span>
                      <span style={{ color: accuracy >= 80 ? '#22c55e' : accuracy >= 60 ? '#eab308' : '#ef4444', fontWeight: 700 }}>{accuracy}%</span>
                    </div>
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.25rem 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#22c55e' }}>!! Brilliant</span>
                      <span style={{ color: '#e8e0d0' }}>{analyses.filter(a => a.quality === 'brilliant').length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#22c55e' }}>! Excellent</span>
                      <span style={{ color: '#e8e0d0' }}>{analyses.filter(a => a.quality === 'excellent').length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#eab308' }}>?! Inaccuracy</span>
                      <span style={{ color: '#e8e0d0' }}>{analyses.filter(a => a.quality === 'inaccuracy').length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#f97316' }}>? Mistake</span>
                      <span style={{ color: '#e8e0d0' }}>{mistakes}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#ef4444' }}>?? Blunder</span>
                      <span style={{ color: '#e8e0d0' }}>{blunders}</span>
                    </div>
                  </div>
                </div>

                {/* Players */}
                {(game.whitePlayer || game.blackPlayer) && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem' }}>
                    <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Players</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>♔</span>
                        <span style={{ color: '#e8e0d0', fontSize: '0.85rem' }}>{game.whitePlayer?.username || 'White'}</span>
                        <span style={{ color: '#c9a84c', fontSize: '0.75rem', marginLeft: 'auto' }}>{game.whitePlayer?.eloRating || ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>♚</span>
                        <span style={{ color: '#e8e0d0', fontSize: '0.85rem' }}>{game.blackPlayer?.username || 'Black'}</span>
                        <span style={{ color: '#c9a84c', fontSize: '0.75rem', marginLeft: 'auto' }}>{game.blackPlayer?.eloRating || ''}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Link href="/lobby" style={{ display: 'block', textAlign: 'center', background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8, padding: '0.6rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                  ♟ Play Again
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
