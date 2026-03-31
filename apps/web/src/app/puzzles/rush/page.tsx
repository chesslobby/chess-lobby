'use client'
// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const PIECES = { wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙', bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' }
const FILES = ['a','b','c','d','e','f','g','h']

const RUSH_PUZZLES = [
  { id:1, fen:'6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', moves:['e1e8'], theme:'Back Rank Mate' },
  { id:2, fen:'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves:['f3g5','f6e4','g5f7'], theme:'Fork' },
  { id:3, fen:'4k3/8/4K3/8/8/8/8/4R3 w - - 0 1', moves:['e1e8'], theme:'Checkmate' },
  { id:4, fen:'3r4/8/8/3k4/8/3K4/8/3R4 w - - 0 1', moves:['d1d5'], theme:'Skewer' },
  { id:5, fen:'4k3/R7/4K3/8/8/8/8/8 w - - 0 1', moves:['a7a8'], theme:'Checkmate' },
  { id:6, fen:'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3', moves:['c6d4'], theme:'Fork' },
  { id:7, fen:'6k1/pp4pp/2p5/8/2Pb4/1P4P1/P4P1P/3R2K1 b - - 0 1', moves:['d4b2'], theme:'Discovered Attack' },
  { id:8, fen:'2r3k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1', moves:['c1c8'], theme:'Back Rank' },
  { id:9, fen:'8/8/8/3k4/3P4/3K4/8/8 w - - 0 1', moves:['d4d5'], theme:'Pawn Endgame' },
  { id:10, fen:'r2q1rk1/ppp2ppp/2n1bn2/3pp3/1bB1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7', moves:['c4f7','f8f7','f3e5'], theme:'Double Bishop' },
  { id:11, fen:'r1b1kb1r/pppp1ppp/2n2n2/4p2q/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves:['f3g5','h5f3','g5f7'], theme:'Deflection' },
  { id:12, fen:'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4', moves:['c5f2','f1f2','d8b6'], theme:'Double Attack' },
  { id:13, fen:'r2qkb1r/ppp2ppp/2np1n2/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', moves:['f3e5','g4d1','c4f7','e8f7','e5d7'], theme:'Piece Sacrifice' },
  { id:14, fen:'r1bqk2r/ppppqppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPPQPPP/R1B1K2R w KQkq - 6 6', moves:['c4f7','e8f7','f3e5','f7e8','e5c6'], theme:'Greek Gift' },
  { id:15, fen:'r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 6', moves:['c4f7','f8f7','f3e5','f7e8','e5d7'], theme:'Combination' },
  { id:16, fen:'4k3/8/8/8/8/8/8/R3K3 w Q - 0 1', moves:['a1a8'], theme:'Rook Mate' },
  { id:17, fen:'5rk1/ppp2ppp/8/8/8/8/PPP2PPP/5RK1 w - - 0 1', moves:['f1f8'], theme:'Back Rank' },
  { id:18, fen:'r5k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', moves:['a1a8'], theme:'Rook Endgame' },
  { id:19, fen:'6k1/8/6K1/8/8/8/8/7Q w - - 0 1', moves:['h1h7'], theme:'Queen Mate' },
  { id:20, fen:'7k/8/6K1/8/8/8/8/3Q4 w - - 0 1', moves:['d1h5'], theme:'Queen Mate' },
]

function parseFen(fen) {
  const [pos] = fen.split(' ')
  const board = []
  for (const row of pos.split('/')) {
    const rank = []
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < parseInt(ch); i++) rank.push(null)
      else rank.push((ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase())
    }
    board.push(rank)
  }
  return board
}

function fenTurn(fen) { return fen.split(' ')[1] }

const TOTAL_SECONDS = 180

export default function PuzzleRushPage() {
  const [phase, setPhase] = useState<'idle'|'playing'|'ended'>('idle')
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [moveIdx, setMoveIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [board, setBoard] = useState(null)
  const [chess, setChess] = useState(null)
  const [selected, setSelected] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [flashSq, setFlashSq] = useState(null)
  const [flashColor, setFlashColor] = useState(null)
  const [wrongMsg, setWrongMsg] = useState('')
  const [bestScore, setBestScore] = useState(0)
  const timerRef = useRef(null)

  const puzzle = RUSH_PUZZLES[puzzleIdx % RUSH_PUZZLES.length]
  const playerColor = fenTurn(puzzle.fen)
  const flipped = playerColor === 'b'

  useEffect(() => {
    try {
      const b = parseInt(localStorage.getItem('puzzleRushBest') || '0')
      setBestScore(b)
    } catch {}
  }, [])

  function loadPuzzle(idx) {
    const p = RUSH_PUZZLES[idx % RUSH_PUZZLES.length]
    const Chess = require('chess.js').Chess
    const c = new Chess()
    c.load(p.fen)
    setChess(c)
    setBoard(parseFen(p.fen))
    setMoveIdx(0)
    setSelected(null)
    setValidMoves([])
  }

  function startGame() {
    setScore(0)
    setMistakes(0)
    setTimeLeft(TOTAL_SECONDS)
    setPuzzleIdx(0)
    setPhase('playing')
    loadPuzzle(0)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setPhase('ended')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  function flash(sq, color) {
    setFlashSq(sq); setFlashColor(color)
    setTimeout(() => { setFlashSq(null); setFlashColor(null) }, 400)
  }

  function colRowToSquare(col, row) {
    const file = flipped ? 7 - col : col
    const rank = flipped ? row + 1 : 8 - row
    return FILES[file] + rank
  }

  function nextPuzzle(newScore) {
    const next = puzzleIdx + 1
    setPuzzleIdx(next)
    setMoveIdx(0)
    setSelected(null)
    setValidMoves([])
    loadPuzzle(next)
  }

  function handleSquareClick(col, row) {
    if (phase !== 'playing' || !chess) return
    const sq = colRowToSquare(col, row)
    const currentMove = puzzle.moves[moveIdx]
    const fromSq = currentMove.slice(0, 2)

    if (!selected) {
      if (sq === fromSq) {
        setSelected(sq)
        const moves = chess.moves({ square: sq, verbose: true })
        setValidMoves(moves.map(m => m.to))
      } else {
        flash(sq, 'red')
        const correctSan = currentMove.slice(0, 2) + '-' + currentMove.slice(2, 4)
        const newMistakes = mistakes + 1
        setMistakes(newMistakes)
        setWrongMsg(`Wrong! Move the piece on ${currentMove.slice(0, 2)}`)
        setTimeout(() => setWrongMsg(''), 1800)
        if (newMistakes >= 3) {
          clearInterval(timerRef.current)
          setPhase('ended')
        }
      }
    } else {
      if (sq === selected) { setSelected(null); setValidMoves([]); return }
      const expectedFrom = currentMove.slice(0, 2)
      const expectedTo = currentMove.slice(2, 4)

      if (selected === expectedFrom && sq === expectedTo) {
        try {
          chess.move({ from: selected, to: sq, promotion: 'q' })
          setBoard(parseFen(chess.fen()))
          flash(sq, 'green')
          setSelected(null); setValidMoves([])
          setWrongMsg('')

          const nextIdx = moveIdx + 1
          if (nextIdx >= puzzle.moves.length) {
            const newScore = score + 1
            setScore(newScore)
            setTimeout(() => nextPuzzle(newScore), 400)
          } else {
            setTimeout(() => {
              const compMove = puzzle.moves[nextIdx]
              const cf = compMove.slice(0, 2), ct = compMove.slice(2, 4)
              try {
                chess.move({ from: cf, to: ct, promotion: 'q' })
                setBoard(parseFen(chess.fen()))
                flash(ct, 'green')
              } catch {}
              setMoveIdx(nextIdx + 1)
            }, 500)
            setMoveIdx(nextIdx + 1)
          }
        } catch { flash(sq, 'red'); setSelected(null); setValidMoves([]) }
      } else {
        flash(sq, 'red')
        setSelected(null); setValidMoves([])
        const newMistakes = mistakes + 1
        setMistakes(newMistakes)
        setWrongMsg(`Wrong! Correct: ${expectedFrom}→${expectedTo}`)
        setTimeout(() => setWrongMsg(''), 1800)
        if (newMistakes >= 3) {
          clearInterval(timerRef.current)
          setPhase('ended')
        }
      }
    }
  }

  useEffect(() => {
    if (phase === 'ended' && score > bestScore) {
      setBestScore(score)
      try { localStorage.setItem('puzzleRushBest', String(score)) } catch {}
    }
  }, [phase])

  const displayBoard = flipped
    ? board?.map(r => [...r].reverse()).reverse()
    : board

  const pct = (timeLeft / TOTAL_SECONDS) * 100
  const timerColor = timeLeft > 60 ? '#22c55e' : timeLeft > 30 ? '#f39c12' : '#ef4444'
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }

  return (
    <>
      <style>{`
        @keyframes flashG{0%,100%{background-color:inherit}50%{background-color:rgba(34,197,94,.5)}}
        @keyframes flashR{0%,100%{background-color:inherit}50%{background-color:rgba(239,68,68,.5)}}
        .flash-green{animation:flashG .4s ease}
        .flash-red{animation:flashR .4s ease}
        .start-btn{background:linear-gradient(135deg,#c9a84c,#a07830);color:#0a1628;border:none;border-radius:10px;padding:.85rem 2.5rem;font-size:1.15rem;font-weight:700;cursor:pointer;font-family:var(--font-playfair),Georgia,serif;letter-spacing:.04em;transition:opacity .15s;}
        .start-btn:hover{opacity:.88;}
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.8rem', color: '#e8e0d0', margin: '0 0 .25rem', fontWeight: 700 }}>
                ⚡ Puzzle Rush
              </h1>
              <div style={{ fontSize: '.82rem', color: '#4a5568' }}>Solve as many puzzles as you can in 3 minutes</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '.6rem', alignItems: 'center' }}>
              <span style={{ color: '#9aa5b4', fontSize: '.85rem' }}>Best: <span style={{ color: '#c9a84c', fontWeight: 700 }}>{bestScore}</span></span>
              <Link href="/puzzles" style={{ color: '#4a5568', fontSize: '.82rem', textDecoration: 'none' }}>← Daily Puzzle</Link>
            </div>
          </div>

          {phase === 'idle' && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>⚡</div>
              <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#e8e0d0', fontSize: '1.6rem', marginBottom: '.5rem' }}>Ready to Rush?</h2>
              <p style={{ color: '#4a5568', fontSize: '.95rem', marginBottom: '2rem', maxWidth: 360, margin: '0 auto 2rem' }}>
                Solve as many puzzles as you can in 3 minutes. 3 mistakes and it's game over!
              </p>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                {[['⏱', '3 min', 'Time limit'], ['❌', '3 lives', 'Mistakes allowed'], ['🧩', 'Unlimited', 'Puzzles']].map(([icon, val, label]) => (
                  <div key={label} style={{ ...cardStyle, padding: '1rem 1.25rem', minWidth: 100, textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                    <div style={{ color: '#c9a84c', fontWeight: 700, fontSize: '1.1rem', marginTop: '.25rem' }}>{val}</div>
                    <div style={{ color: '#4a5568', fontSize: '.78rem' }}>{label}</div>
                  </div>
                ))}
              </div>
              {bestScore > 0 && (
                <div style={{ color: '#4a5568', fontSize: '.88rem', marginBottom: '1.5rem' }}>
                  Your best: <span style={{ color: '#c9a84c', fontWeight: 700 }}>{bestScore} puzzles</span>
                </div>
              )}
              <button className="start-btn" onClick={startGame}>Start Rush!</button>
            </div>
          )}

          {(phase === 'playing' || phase === 'ended') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1.25rem', alignItems: 'start' }}>
              {/* Board */}
              <div>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.5)', opacity: phase === 'ended' ? 0.55 : 1 }}>
                  {displayBoard && displayBoard.map((rank, ri) =>
                    rank.map((piece, fi) => {
                      const isLight = (ri + fi) % 2 === 0
                      const sq = colRowToSquare(fi, ri)
                      const isSelected = selected === sq
                      const isValid = validMoves.includes(sq)
                      const isFlash = flashSq === sq
                      return (
                        <div
                          key={`${ri}-${fi}`}
                          className={isFlash ? (flashColor === 'green' ? 'flash-green' : 'flash-red') : ''}
                          onClick={() => handleSquareClick(fi, ri)}
                          style={{
                            position: 'absolute',
                            left: `${fi * 12.5}%`, top: `${ri * 12.5}%`,
                            width: '12.5%', height: '12.5%',
                            background: isSelected ? 'rgba(201,168,76,.6)' : isLight ? '#f0d9b5' : '#b58863',
                            cursor: phase === 'playing' ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'clamp(1rem,2.8vw,1.8rem)', lineHeight: 1, userSelect: 'none',
                            color: piece && piece[0] === 'b' ? '#1a0a00' : '#fff',
                            textShadow: piece && piece[0] === 'b' ? '0 1px 2px rgba(255,255,255,.35)' : '0 1px 3px rgba(0,0,0,.7)',
                          }}
                        >
                          {piece ? PIECES[piece] || '' : ''}
                          {isValid && !piece && <div style={{ width: '28%', height: '28%', borderRadius: '50%', background: 'rgba(201,168,76,.55)', pointerEvents: 'none' }} />}
                          {isValid && piece && <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(201,168,76,.7)', borderRadius: 2, pointerEvents: 'none' }} />}
                        </div>
                      )
                    })
                  )}
                </div>
                {phase === 'playing' && wrongMsg && (
                  <div style={{ marginTop: '.6rem', padding: '.6rem 1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, color: '#ef4444', fontSize: '.88rem', textAlign: 'center' }}>
                    {wrongMsg}
                  </div>
                )}

                {phase === 'ended' && (
                  <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>{score >= 10 ? '🏆' : score >= 5 ? '🥈' : '🧩'}</div>
                    <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.4rem', color: '#e8e0d0', fontWeight: 700, marginBottom: '.35rem' }}>
                      {score >= 10 ? 'Brilliant!' : score >= 5 ? 'Well done!' : 'Keep practicing!'}
                    </div>
                    <div style={{ color: '#c9a84c', fontSize: '1.1rem', marginBottom: '.25rem' }}>Score: <strong>{score}</strong> puzzles</div>
                    {score >= bestScore && score > 0 && <div style={{ color: '#22c55e', fontSize: '.85rem', marginBottom: '.75rem' }}>🎉 New personal best!</div>}
                    <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '.75rem' }}>
                      <button onClick={startGame} style={{ background: 'rgba(201,168,76,.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, padding: '.45rem 1rem', cursor: 'pointer', fontSize: '.88rem' }}>
                        ⚡ Play Again
                      </button>
                      <Link href="/puzzles" style={{ background: 'rgba(255,255,255,.05)', color: '#9aa5b4', border: '1px solid rgba(255,255,255,.1)', borderRadius: 7, padding: '.45rem 1rem', textDecoration: 'none', fontSize: '.88rem' }}>
                        Daily Puzzle
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {/* Timer */}
                <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
                  <div style={{ fontSize: '.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.5rem' }}>Time</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 700, color: timerColor, fontFamily: 'monospace', lineHeight: 1 }}>
                    {mins}:{String(secs).padStart(2,'0')}
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, marginTop: '.6rem' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: timerColor, borderRadius: 3, transition: 'width 1s linear, background .3s' }} />
                  </div>
                </div>

                {/* Score */}
                <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
                  <div style={{ fontSize: '.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.3rem' }}>Score</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#c9a84c', lineHeight: 1 }}>{score}</div>
                  <div style={{ fontSize: '.78rem', color: '#4a5568', marginTop: '.2rem' }}>Best: {bestScore}</div>
                </div>

                {/* Lives */}
                <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
                  <div style={{ fontSize: '.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem' }}>Lives</div>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ fontSize: '1.4rem', opacity: i < (3 - mistakes) ? 1 : 0.2 }}>❤️</div>
                    ))}
                  </div>
                  {mistakes > 0 && <div style={{ fontSize: '.78rem', color: '#ef4444', marginTop: '.3rem' }}>{mistakes} mistake{mistakes > 1 ? 's' : ''}</div>}
                </div>

                {/* Current puzzle theme */}
                {phase === 'playing' && (
                  <div style={{ ...cardStyle, padding: '.85rem 1.1rem' }}>
                    <div style={{ fontSize: '.78rem', color: '#4a5568', marginBottom: '.2rem' }}>Puzzle #{puzzleIdx + 1}</div>
                    <div style={{ color: '#c9a84c', fontSize: '.88rem', fontWeight: 600 }}>{puzzle.theme}</div>
                    <div style={{ fontSize: '.78rem', color: '#9aa5b4', marginTop: '.2rem' }}>
                      {playerColor === 'w' ? '⬜ White to move' : '⬛ Black to move'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
