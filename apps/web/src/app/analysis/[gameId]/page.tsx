'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { detectOpeningFromMoves } from '@/lib/openings'

const API = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

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

const QUALITY_CONFIG = {
  brilliant:  { icon: '!!', color: '#22d3ee', label: 'Brilliant' },
  good:       { icon: '!',  color: '#22c55e', label: 'Good' },
  inaccuracy: { icon: '?!', color: '#eab308', label: 'Inaccuracy' },
  mistake:    { icon: '?',  color: '#f97316', label: 'Mistake' },
  blunder:    { icon: '??', color: '#ef4444', label: 'Blunder' },
}

function classifyMove(evalBefore, evalAfter, side) {
  // Positive delta = player improved position
  const delta = side === 'w' ? evalAfter - evalBefore : evalBefore - evalAfter
  if (delta >= 0.5)  return 'brilliant'
  if (delta >= -0.2) return 'good'
  if (delta >= -0.5) return 'inaccuracy'
  if (delta >= -1.5) return 'mistake'
  return 'blunder'
}

function EvalBar({ evaluation }) {
  const clamped = Math.max(-10, Math.min(10, evaluation ?? 0))
  const whitePct = Math.round((clamped + 10) / 20 * 100)
  const isMate = Math.abs(evaluation) >= 99
  const label = isMate
    ? (evaluation > 0 ? 'M+' : 'M-')
    : (evaluation > 0 ? `+${Math.abs(evaluation).toFixed(1)}` : `-${Math.abs(evaluation).toFixed(1)}`)
  return (
    <div style={{ width: 22, alignSelf: 'stretch', background: '#1a1a2e', borderRadius: 5, overflow: 'hidden', position: 'relative', flexShrink: 0, minHeight: 320 }}>
      {/* Black section */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${100 - whitePct}%`, background: '#3a3a4a', transition: 'height 0.5s ease' }} />
      {/* White section */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${whitePct}%`, background: '#f0d9b5', transition: 'height 0.5s ease' }} />
      {/* Label */}
      <div style={{
        position: 'absolute',
        bottom: whitePct > 50 ? 4 : 'auto',
        top: whitePct <= 50 ? 4 : 'auto',
        left: 0, right: 0,
        textAlign: 'center',
        fontSize: '0.5rem',
        fontWeight: 'bold',
        color: whitePct > 50 ? '#333' : '#e8e0d0',
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        lineHeight: '22px',
        padding: '2px 0',
        overflow: 'hidden',
      }}>
        {label}
      </div>
    </div>
  )
}

function parsePgnPositions(pgn) {
  try {
    const { Chess } = require('chess.js')
    const tokens = pgn
      .replace(/\{[^}]*\}/g, '')
      .replace(/\([^)]*\)/g, '')
      .split(/\s+/)
      .filter(t => t && !t.match(/^\d+\./) && !t.match(/^(1-0|0-1|1\/2-1\/2|\*)$/))

    const chess = new Chess()
    const positions = [chess.fen()]
    const sanMoves = []
    const sides = []

    for (const token of tokens) {
      try {
        const mv = chess.move(token)
        if (!mv) continue
        sanMoves.push(mv.san)
        sides.push(mv.color)
        positions.push(chess.fen())
      } catch {}
    }

    return { positions, sanMoves, sides }
  } catch {
    return { positions: [], sanMoves: [], sides: [] }
  }
}

export default function AnalysisPage({ params }) {
  const { gameId } = params
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sanMoves, setSanMoves] = useState([])
  const [positions, setPositions] = useState([])
  const [sides, setSides] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const [displayFen, setDisplayFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [openingName, setOpeningName] = useState('')

  // Stockfish states
  const stockfishRef = useRef(null)
  const [evaluations, setEvaluations] = useState([])
  const [moveQualities, setMoveQualities] = useState([])
  const [bestMoves, setBestMoves] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sfError, setSfError] = useState(false)

  // Load Stockfish worker
  useEffect(() => {
    try {
      const worker = new Worker(
        URL.createObjectURL(new Blob(
          [`importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')`],
          { type: 'application/javascript' }
        ))
      )
      stockfishRef.current = worker
      worker.postMessage('uci')
      worker.postMessage('setoption name MultiPV value 1')
      worker.postMessage('isready')
      worker.onerror = () => setSfError(true)
    } catch {
      setSfError(true)
    }
    return () => stockfishRef.current?.terminate()
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/games/${gameId}/replay`)
        if (res.status === 404) { setError('Game not found. It may have been a guest game or the server restarted.'); return }
        if (!res.ok) { setError(`Server error (${res.status}). Please try again later.`); return }
        const data = await res.json()
        const g = data.game
        setGame(g)
        if (!g?.pgn) { setError('This game has no recorded moves. Play a complete game to analyze it.'); return }
        const { positions: pos, sanMoves: sm, sides: sd } = parsePgnPositions(g.pgn)
        setPositions(pos)
        setSanMoves(sm)
        setSides(sd)
        if (sm.length > 0) {
          const name = detectOpeningFromMoves(sm)
          if (name && name !== 'Opening') setOpeningName(name)
        }
        if (pos.length > 1) setDisplayFen(pos[pos.length - 1])
      } catch {
        setError('Could not connect to server. Make sure the game server is running.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId])

  async function analyzePosition(fen) {
    return new Promise((resolve) => {
      const worker = stockfishRef.current
      if (!worker) { resolve({ ev: 0, best: '' }); return }
      let evaluation = 0
      let bestMove = ''
      let done = false
      const timeout = setTimeout(() => {
        if (!done) { done = true; resolve({ ev: evaluation, best: bestMove }) }
      }, 3500)
      worker.onmessage = (e) => {
        const msg = e.data
        if (typeof msg !== 'string') return
        if (msg.includes('score cp')) {
          const m = msg.match(/score cp (-?\d+)/)
          if (m) evaluation = parseInt(m[1]) / 100
        }
        if (msg.includes('score mate')) {
          const m = msg.match(/score mate (-?\d+)/)
          if (m) evaluation = parseInt(m[1]) > 0 ? 99 : -99
        }
        if (msg.startsWith('bestmove')) {
          const parts = msg.split(' ')
          bestMove = parts[1] || ''
          if (!done) { done = true; clearTimeout(timeout); resolve({ ev: evaluation, best: bestMove }) }
        }
      }
      worker.postMessage(`position fen ${fen}`)
      worker.postMessage('go depth 12 movetime 500')
    })
  }

  async function runFullAnalysis() {
    if (!stockfishRef.current || positions.length < 2) return
    setAnalyzing(true)
    setProgress(0)
    setEvaluations([])
    setMoveQualities([])
    setBestMoves([])

    const evals = []
    const bests = []

    for (let i = 0; i < positions.length; i++) {
      const { ev, best } = await analyzePosition(positions[i])
      evals.push(ev)
      bests.push(best)
      setProgress(Math.round((i / Math.max(positions.length - 1, 1)) * 100))
      await new Promise(r => setTimeout(r, 0)) // yield UI thread
    }

    const qualities = sides.map((side, i) => classifyMove(evals[i], evals[i + 1], side))

    setEvaluations(evals)
    setMoveQualities(qualities)
    setBestMoves(bests)
    setAnalyzing(false)
    setProgress(100)
  }

  function selectMove(idx) {
    setSelectedIdx(idx)
    if (idx === -1) {
      setDisplayFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    } else {
      setDisplayFen(positions[idx + 1] || displayFen)
    }
  }

  const board = fenToBoard(displayFen)

  // Group into move rows
  const moveRows = []
  for (let i = 0; i < sanMoves.length; i += 2) {
    moveRows.push({ n: Math.floor(i / 2) + 1, wIdx: i, bIdx: i + 1 < sanMoves.length ? i + 1 : -1 })
  }

  // Stats
  const whiteMoveIdxs = sides.map((s, i) => s === 'w' ? i : -1).filter(i => i >= 0)
  const blackMoveIdxs = sides.map((s, i) => s === 'b' ? i : -1).filter(i => i >= 0)
  const goodSet = new Set(['brilliant', 'good'])

  const whiteAccuracy = whiteMoveIdxs.length > 0 && moveQualities.length > 0
    ? Math.round(whiteMoveIdxs.filter(i => goodSet.has(moveQualities[i])).length / whiteMoveIdxs.length * 100) : 0
  const blackAccuracy = blackMoveIdxs.length > 0 && moveQualities.length > 0
    ? Math.round(blackMoveIdxs.filter(i => goodSet.has(moveQualities[i])).length / blackMoveIdxs.length * 100) : 0
  const whiteBlunders   = whiteMoveIdxs.filter(i => moveQualities[i] === 'blunder').length
  const blackBlunders   = blackMoveIdxs.filter(i => moveQualities[i] === 'blunder').length
  const whiteMistakes   = whiteMoveIdxs.filter(i => moveQualities[i] === 'mistake').length
  const blackMistakes   = blackMoveIdxs.filter(i => moveQualities[i] === 'mistake').length
  const whiteInaccs     = whiteMoveIdxs.filter(i => moveQualities[i] === 'inaccuracy').length
  const blackInaccs     = blackMoveIdxs.filter(i => moveQualities[i] === 'inaccuracy').length

  const currentEval = evaluations.length > 0
    ? (selectedIdx === -1 ? evaluations[0] : (evaluations[selectedIdx + 1] ?? evaluations[evaluations.length - 1]))
    : 0

  const currentBest = selectedIdx >= 0 && bestMoves.length > selectedIdx + 1 ? bestMoves[selectedIdx + 1] : ''

  return (
    <>
      <style>{`
        .analysis-move-row { display:flex; align-items:center; padding:0.3rem 0.5rem; border-radius:6px; cursor:pointer; transition:background 0.15s; }
        .analysis-move-row:hover { background:rgba(201,168,76,0.08); }
        .analysis-move-row.selected { background:rgba(201,168,76,0.16); }
        .move-btn { background:none; border:none; padding:0.15rem 0.35rem; border-radius:4px; cursor:pointer; font-family:var(--font-crimson),Georgia,serif; font-size:0.9rem; transition:background 0.15s; display:inline-flex; align-items:center; gap:0.2rem; }
        .move-btn:hover { background:rgba(201,168,76,0.12); }
        .move-btn.active { background:rgba(201,168,76,0.2); color:#c9a84c; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .board-sq { width:12.5%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:clamp(1rem,3vw,1.6rem); user-select:none; }
        .sf-progress { position:fixed; top:0; left:0; right:0; height:3px; background:rgba(201,168,76,0.15); z-index:1000; }
        .sf-progress-bar { height:100%; background:#c9a84c; transition:width 0.3s ease; }
        @media (max-width: 768px) {
          .eval-bar-col { display:none !important; }
          .analysis-right { flex: 1 1 100% !important; }
          .move-list-col { flex: 1 1 100% !important; max-height: 260px !important; }
        }
      `}</style>

      {analyzing && (
        <div className="sf-progress">
          <div className="sf-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem' }}>

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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {!sfError && moveQualities.length === 0 && !analyzing && positions.length > 1 && (
                <button
                  onClick={runFullAnalysis}
                  style={{ background: 'linear-gradient(135deg,#e8c97a,#c9a84c)', color: '#0a1628', border: 'none', borderRadius: 8, padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  ⚡ Analyze with Stockfish
                </button>
              )}
              {analyzing && (
                <span style={{ color: '#c9a84c', fontSize: '0.8rem' }}>
                  Analyzing... {progress}% · may take 1–2 min
                </span>
              )}
              {moveQualities.length > 0 && !analyzing && (
                <span style={{ color: '#22c55e', fontSize: '0.82rem' }}>✓ Analysis complete</span>
              )}
              {sfError && (
                <span style={{ color: '#ef4444', fontSize: '0.82rem' }}>⚠ Engine unavailable</span>
              )}
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '4rem', color: '#4a5568' }}>Loading game...</div>}

          {error && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
              <div style={{ color: '#ef4444', fontSize: '0.95rem', marginBottom: '1rem' }}>{error}</div>
              <Link href="/lobby" style={{ display: 'inline-block', background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8, padding: '0.55rem 1.25rem', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 600 }}>
                ♟ Play a Game
              </Link>
            </div>
          )}

          {!loading && !error && game && (
            <div className="fade-up" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

              {/* Move list */}
              <div className="move-list-col" style={{ flex: '0 0 240px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, overflow: 'hidden', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(201,168,76,0.1)', color: '#e8e0d0', fontWeight: 700, fontSize: '0.88rem' }}>
                  Move List
                </div>
                <div style={{ overflow: 'auto', flex: 1, padding: '0.5rem' }}>
                  <div className={`analysis-move-row${selectedIdx === -1 ? ' selected' : ''}`} onClick={() => selectMove(-1)} style={{ color: '#4a5568', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    Starting position
                  </div>
                  {moveRows.map(row => {
                    const wQ = moveQualities[row.wIdx]
                    const bQ = row.bIdx >= 0 ? moveQualities[row.bIdx] : null
                    return (
                      <div key={row.n} className="analysis-move-row">
                        <span style={{ color: '#4a5568', fontSize: '0.78rem', width: '1.8rem', flexShrink: 0 }}>{row.n}.</span>
                        <button
                          className={`move-btn${selectedIdx === row.wIdx ? ' active' : ''}`}
                          onClick={() => selectMove(row.wIdx)}
                          style={{ color: '#e8e0d0', minWidth: '4rem', justifyContent: 'flex-start' }}
                        >
                          {sanMoves[row.wIdx]}
                          {wQ && QUALITY_CONFIG[wQ]?.icon && (
                            <span style={{ color: QUALITY_CONFIG[wQ].color, fontSize: '0.75rem' }}>{QUALITY_CONFIG[wQ].icon}</span>
                          )}
                        </button>
                        {row.bIdx >= 0 && (
                          <button
                            className={`move-btn${selectedIdx === row.bIdx ? ' active' : ''}`}
                            onClick={() => selectMove(row.bIdx)}
                            style={{ color: '#e8e0d0', minWidth: '4rem', justifyContent: 'flex-start' }}
                          >
                            {sanMoves[row.bIdx]}
                            {bQ && QUALITY_CONFIG[bQ]?.icon && (
                              <span style={{ color: QUALITY_CONFIG[bQ].color, fontSize: '0.75rem' }}>{QUALITY_CONFIG[bQ].icon}</span>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {sanMoves.length === 0 && (
                    <div style={{ color: '#4a5568', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>No moves to display</div>
                  )}
                </div>
              </div>

              {/* Board + eval bar */}
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', width: '100%', maxWidth: '440px' }}>
                  {/* Eval bar — hidden on mobile */}
                  <div className="eval-bar-col">
                    <EvalBar evaluation={evaluations.length > 0 ? currentEval : 0} />
                  </div>
                  {/* Board */}
                  <div style={{ flex: 1, background: '#1a1a2e', borderRadius: 8, padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                    {board.map((rank, ri) => (
                      <div key={ri} style={{ display: 'flex' }}>
                        {rank.map((piece, fi) => {
                          const isLight = (ri + fi) % 2 === 0
                          return (
                            <div key={fi} className="board-sq" style={{ background: isLight ? '#f0d9b5' : '#b58863', color: piece && piece === piece.toUpperCase() ? '#1a1a1a' : '#f0f0f0' }}>
                              {piece && (PIECE_UNICODE[piece] || piece)}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button onClick={() => selectMove(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.75rem' }}>|◀</button>
                  <button onClick={() => selectMove(Math.max(-1, selectedIdx - 1))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '1rem' }}>◀</button>
                  <span style={{ color: '#4a5568', fontSize: '0.8rem', minWidth: '7rem', textAlign: 'center' }}>
                    {selectedIdx === -1 ? 'Start' : `Move ${selectedIdx + 1} / ${sanMoves.length}`}
                  </span>
                  <button onClick={() => selectMove(Math.min(sanMoves.length - 1, selectedIdx + 1))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '1rem' }}>▶</button>
                  <button onClick={() => selectMove(sanMoves.length - 1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e0d0', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.75rem' }}>▶|</button>
                </div>

                {/* Move quality badge */}
                {selectedIdx >= 0 && moveQualities.length > 0 && moveQualities[selectedIdx] && (() => {
                  const q = QUALITY_CONFIG[moveQualities[selectedIdx]]
                  return q ? (
                    <div style={{ background: q.color + '18', border: `1px solid ${q.color}40`, borderRadius: 8, padding: '0.4rem 1rem', color: q.color, fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span>{q.icon} {q.label}</span>
                      {currentBest && moveQualities[selectedIdx] !== 'brilliant' && moveQualities[selectedIdx] !== 'good' && (
                        <span style={{ fontSize: '0.75rem', opacity: 0.75, color: '#9aa5b4' }}>· Best: {currentBest}</span>
                      )}
                    </div>
                  ) : null
                })()}

                {/* Eval score text */}
                {evaluations.length > 0 && (
                  <div style={{ fontSize: '0.82rem', color: '#9aa5b4' }}>
                    Eval:{' '}
                    <span style={{ color: currentEval > 0.2 ? '#f0d9b5' : currentEval < -0.2 ? '#9aa5b4' : '#e8e0d0', fontWeight: 600 }}>
                      {Math.abs(currentEval) >= 99
                        ? (currentEval > 0 ? 'Forced mate' : 'Opponent has forced mate')
                        : (currentEval > 0 ? `+${currentEval.toFixed(2)}` : currentEval.toFixed(2))}
                    </span>
                  </div>
                )}
              </div>

              {/* Right panel */}
              <div className="analysis-right" style={{ flex: '0 0 215px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                {/* Per-side accuracy — only after SF analysis */}
                {moveQualities.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem' }}>
                    <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Accuracy</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: whiteAccuracy >= 80 ? '#22c55e' : whiteAccuracy >= 60 ? '#eab308' : '#ef4444' }}>{whiteAccuracy}%</div>
                        <div style={{ fontSize: '0.72rem', color: '#9aa5b4' }}>♔ White</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: blackAccuracy >= 80 ? '#22c55e' : blackAccuracy >= 60 ? '#eab308' : '#ef4444' }}>{blackAccuracy}%</div>
                        <div style={{ fontSize: '0.72rem', color: '#9aa5b4' }}>♚ Black</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', textAlign: 'center', fontSize: '0.7rem' }}>
                      <div style={{ color: '#4a5568' }}>Blunders</div>
                      <div style={{ color: '#4a5568' }}>Mistakes</div>
                      <div style={{ color: '#4a5568' }}>Inaccs.</div>
                      <div>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{whiteBlunders}</span>
                        <span style={{ color: '#4a5568' }}>/</span>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{blackBlunders}</span>
                      </div>
                      <div>
                        <span style={{ color: '#f97316', fontWeight: 700 }}>{whiteMistakes}</span>
                        <span style={{ color: '#4a5568' }}>/</span>
                        <span style={{ color: '#f97316', fontWeight: 700 }}>{blackMistakes}</span>
                      </div>
                      <div>
                        <span style={{ color: '#eab308', fontWeight: 700 }}>{whiteInaccs}</span>
                        <span style={{ color: '#4a5568' }}>/</span>
                        <span style={{ color: '#eab308', fontWeight: 700 }}>{blackInaccs}</span>
                      </div>
                      <div style={{ color: '#4a5568', fontSize: '0.6rem' }}>W/B</div>
                      <div style={{ color: '#4a5568', fontSize: '0.6rem' }}>W/B</div>
                      <div style={{ color: '#4a5568', fontSize: '0.6rem' }}>W/B</div>
                    </div>
                  </div>
                )}

                {/* Game summary */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Game Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#4a5568' }}>Total moves</span>
                      <span style={{ color: '#e8e0d0' }}>{sanMoves.length}</span>
                    </div>
                    {moveQualities.length > 0 && (
                      <>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />
                        {([
                          ['!! Brilliant', 'brilliant', '#22d3ee'],
                          ['!  Good',      'good',       '#22c55e'],
                          ['?! Inaccuracy','inaccuracy', '#eab308'],
                          ['?  Mistake',   'mistake',    '#f97316'],
                          ['?? Blunder',   'blunder',    '#ef4444'],
                        ]).map(([lbl, key, clr]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ color: clr }}>{lbl}</span>
                            <span style={{ color: '#e8e0d0' }}>{moveQualities.filter(q => q === key).length}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Players */}
                {(game.whitePlayer || game.blackPlayer) && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem' }}>
                    <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Players</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>♔</span>
                        <span style={{ color: '#e8e0d0', fontSize: '0.85rem' }}>{game.whitePlayer?.username || 'White'}</span>
                        <span style={{ color: '#c9a84c', fontSize: '0.75rem', marginLeft: 'auto' }}>{game.whitePlayer?.eloRating || ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>♚</span>
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
