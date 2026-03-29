'use client'
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const API = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

// ── Puzzle data ───────────────────────────────────────────────
const DAILY_PUZZLES = [
  { id: 1, fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4', moves: ['f3g5','f6e4','g5f7'], theme: 'Fork', difficulty: 'medium', description: 'White to move — find the winning fork!', rating: 1400 },
  { id: 2, fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', moves: ['e1e8'], theme: 'Back Rank Mate', difficulty: 'easy', description: 'White to move — deliver checkmate!', rating: 1100 },
  { id: 3, fen: 'r2qkb1r/ppp2ppp/2np1n2/4p3/2B1P1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6', moves: ['f3e5','g4d1','c4f7','e8f7','e5d7'], theme: 'Piece Sacrifice', difficulty: 'hard', description: 'White to move — find the brilliant combination!', rating: 1700 },
  { id: 4, fen: '4k3/8/4K3/8/8/8/8/4R3 w - - 0 1', moves: ['e1e8'], theme: 'Checkmate', difficulty: 'easy', description: 'White to move — checkmate in 1!', rating: 900 },
  { id: 5, fen: 'r1b1kb1r/pppp1ppp/2n2n2/4p2q/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5', moves: ['f3g5','h5f3','g5f7'], theme: 'Deflection', difficulty: 'medium', description: 'White to move — deflect the defender!', rating: 1500 },
  { id: 6, fen: '2r3k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1', moves: ['c1c8'], theme: 'Back Rank', difficulty: 'easy', description: 'White to move — win material!', rating: 1200 },
  { id: 7, fen: 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 4', moves: ['c5f2','f1f2','d8b6'], theme: 'Double Attack', difficulty: 'medium', description: 'Black to move — find the double attack!', rating: 1450 },
  { id: 8, fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3', moves: ['c6d4'], theme: 'Fork', difficulty: 'easy', rating: 1050, description: 'Black to move — fork the pieces!' },
  { id: 9, fen: '6k1/pp4pp/2p5/8/2Pb4/1P4P1/P4P1P/3R2K1 b - - 0 1', moves: ['d4b2'], theme: 'Discovered Attack', difficulty: 'medium', rating: 1350, description: 'Black to move — unleash a discovered attack!' },
  { id: 10, fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4', moves: ['c4f7','e8f7','f3e5','f7e8','e5c6'], theme: 'Piece Sacrifice', difficulty: 'hard', rating: 1650, description: 'White to move — sacrifice for victory!' },
  { id: 11, fen: '4k3/R7/4K3/8/8/8/8/8 w - - 0 1', moves: ['a7a8'], theme: 'Checkmate', difficulty: 'easy', rating: 950, description: 'White to move — checkmate!' },
  { id: 12, fen: 'r2q1rk1/ppp2ppp/2n1bn2/3pp3/1bB1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 7', moves: ['c4f7','f8f7','f3e5'], theme: 'Double Bishop', difficulty: 'medium', rating: 1500, description: 'White to move — exploit the bishops!' },
  { id: 13, fen: '3r4/8/8/3k4/8/3K4/8/3R4 w - - 0 1', moves: ['d1d5'], theme: 'Skewer', difficulty: 'easy', rating: 1100, description: 'White to move — skewer the king!' },
  { id: 14, fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPPQPPP/R1B1K2R w KQkq - 6 6', moves: ['c4f7','e8f7','f3e5','f7e8','e5c6'], theme: 'Greek Gift', difficulty: 'hard', rating: 1700, description: 'White to move — the Greek Gift sacrifice!' },
  { id: 15, fen: '8/8/8/3k4/3P4/3K4/8/8 w - - 0 1', moves: ['d4d5'], theme: 'Pawn Endgame', difficulty: 'easy', rating: 1000, description: 'White to move — advance the pawn!' },
]

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

function diffStars(d) {
  if (d === 'easy') return '⭐'
  if (d === 'medium') return '⭐⭐'
  return '⭐⭐⭐'
}

function diffColor(d) {
  if (d === 'easy') return '#22c55e'
  if (d === 'medium') return '#f39c12'
  return '#ef4444'
}

// Board helpers
const PIECES = { wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙', bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟' }
const FILES = ['a','b','c','d','e','f','g','h']
const RANKS = ['8','7','6','5','4','3','2','1']

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

export default function PuzzlePage() {
  const dayOfYear = getDayOfYear()
  const puzzle = DAILY_PUZZLES[dayOfYear % DAILY_PUZZLES.length]

  const [chess, setChess2] = useState(null)
  const [board, setBoard] = useState(null)
  const [selected, setSelected] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [moveIdx, setMoveIdx] = useState(0)
  const [flashColor, setFlashColor] = useState(null) // 'green' | 'red' | null
  const [flashSq, setFlashSq] = useState(null)
  const [solved, setSolved] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [streak, setStreak] = useState(0)
  const [todaySolved, setTodaySolved] = useState(false)
  const [todayMoves, setTodayMoves] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [hintFrom, setHintFrom] = useState(null)
  const [copyMsg, setCopyMsg] = useState('')

  const playerColor = fenTurn(puzzle.fen)
  const flipped = playerColor === 'b'

  // Init chess.js
  useEffect(() => {
    try {
      const Chess = require('chess.js').Chess
      const c = new Chess()
      c.load(puzzle.fen)
      setChess2(c)
      setBoard(parseFen(puzzle.fen))
    } catch {}
  }, [puzzle.fen])

  // Load streak from localStorage
  useEffect(() => {
    try {
      const s = parseInt(localStorage.getItem('puzzleStreak') || '0')
      const lastDate = localStorage.getItem('lastPuzzleDate') || ''
      const td = localStorage.getItem('todayPuzzleSolved') === todayStr()
      setStreak(s)
      setTodaySolved(td)
      setTodayMoves(parseInt(localStorage.getItem('todayPuzzleMoves') || '0'))
      if (td) setSolved(true)
    } catch {}
  }, [])

  function flash(sq, color) {
    setFlashSq(sq); setFlashColor(color)
    setTimeout(() => { setFlashSq(null); setFlashColor(null) }, 500)
  }

  function squareToColRow(sq) {
    const file = sq.charCodeAt(0) - 97
    const rank = parseInt(sq[1]) - 1
    return flipped ? { col: 7 - file, row: rank } : { col: file, row: 7 - rank }
  }

  function colRowToSquare(col, row) {
    const file = flipped ? 7 - col : col
    const rank = flipped ? row + 1 : 8 - row
    return FILES[file] + rank
  }

  function handleSquareClick(col, row) {
    if (solved || gaveUp || !chess) return
    const sq = colRowToSquare(col, row)
    const currentMove = puzzle.moves[moveIdx]
    const fromSq = currentMove.slice(0, 2)

    if (!selected) {
      // Only allow selecting the piece that should move
      if (sq === fromSq) {
        setSelected(sq)
        const moves = chess.moves({ square: sq, verbose: true })
        setValidMoves(moves.map(m => m.to))
      }
    } else {
      if (sq === selected) { setSelected(null); setValidMoves([]); return }
      // Try the move
      const expectedFrom = currentMove.slice(0, 2)
      const expectedTo = currentMove.slice(2, 4)

      if (selected === expectedFrom && sq === expectedTo) {
        // Correct!
        try {
          chess.move({ from: selected, to: sq, promotion: 'q' })
          setBoard(parseFen(chess.fen()))
          flash(sq, 'green')
          setSelected(null); setValidMoves([])

          const nextIdx = moveIdx + 1
          if (nextIdx >= puzzle.moves.length) {
            // Puzzle solved!
            setSolved(true)
            const moves = Math.ceil((nextIdx) / 2)
            setTodayMoves(moves)
            try {
              const today = todayStr()
              const lastDate = localStorage.getItem('lastPuzzleDate') || ''
              const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
              const newStreak = lastDate === yesterday || lastDate === today ? streak + (lastDate === today ? 0 : 1) : 1
              localStorage.setItem('puzzleStreak', String(newStreak))
              localStorage.setItem('lastPuzzleDate', today)
              localStorage.setItem('todayPuzzleSolved', today)
              localStorage.setItem('todayPuzzleMoves', String(moves))
              localStorage.setItem('totalPuzzlesSolved', String(parseInt(localStorage.getItem('totalPuzzlesSolved') || '0') + 1))
              setStreak(newStreak)
            } catch {}
          } else {
            // Play computer's response after delay
            setTimeout(() => {
              const compMove = puzzle.moves[nextIdx]
              const cf = compMove.slice(0, 2), ct = compMove.slice(2, 4)
              try {
                chess.move({ from: cf, to: ct, promotion: 'q' })
                setBoard(parseFen(chess.fen()))
                flash(ct, 'green')
              } catch {}
              setMoveIdx(nextIdx + 1)
            }, 600)
          }
          setMoveIdx(nextIdx >= puzzle.moves.length ? nextIdx : nextIdx + 1)
        } catch { flash(sq, 'red'); setSelected(null); setValidMoves([]) }
      } else {
        // Wrong move
        flash(sq, 'red')
        setWrongAttempts(w => w + 1)
        setSelected(null); setValidMoves([])
      }
    }
  }

  function handleGiveUp() {
    setGaveUp(true)
    // Play out the solution
    if (!chess) return
    let delay = 300
    puzzle.moves.forEach((mv, i) => {
      setTimeout(() => {
        try {
          chess.move({ from: mv.slice(0,2), to: mv.slice(2,4), promotion: 'q' })
          setBoard(parseFen(chess.fen()))
        } catch {}
      }, delay)
      delay += 700
    })
  }

  function handleShare() {
    const result = `Chess Lobby Daily Puzzle #${puzzle.id} ${solved ? '✅' : '❌'} — Theme: ${puzzle.theme}\nPlay at chesslobby.in/puzzles`
    try {
      navigator.clipboard.writeText(result)
      setCopyMsg('Copied!')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {}
  }

  const displayBoard = flipped
    ? board?.map(r => [...r].reverse()).reverse()
    : board

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }

  return (
    <>
      <style>{`
        .hint-btn{background:transparent;color:#4a5568;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:.35rem .8rem;font-size:.8rem;cursor:pointer;transition:all .15s;font-family:var(--font-crimson),Georgia,serif;}
        .hint-btn:hover{color:#c9a84c;border-color:rgba(201,168,76,.3);}
        .giveup-btn{background:transparent;color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:6px;padding:.35rem .8rem;font-size:.8rem;cursor:pointer;transition:background .15s;font-family:var(--font-crimson),Georgia,serif;}
        .giveup-btn:hover{background:rgba(239,68,68,.1);}
        @keyframes flashG{0%,100%{background-color:inherit}50%{background-color:rgba(34,197,94,.5)}}
        @keyframes flashR{0%,100%{background-color:inherit}50%{background-color:rgba(239,68,68,.5)}}
        .flash-green{animation:flashG .5s ease}
        .flash-red{animation:flashR .5s ease}
        @keyframes flameDance {
          0%,100% { transform: scale(1) rotate(-3deg); }
          33%      { transform: scale(1.15) rotate(3deg); }
          66%      { transform: scale(1.05) rotate(-2deg); }
        }
        .flame { display: inline-block; animation: flameDance 1.5s ease-in-out infinite; }
        @keyframes starFill {
          from { opacity: 0; transform: scale(0) rotate(-30deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .diff-star { display: inline-block; animation: starFill 0.4s cubic-bezier(.34,1.56,.64,1) both; }
        .diff-star:nth-child(2) { animation-delay: 0.1s; }
        .diff-star:nth-child(3) { animation-delay: 0.2s; }
        @keyframes solvedPop {
          0%   { transform: scale(0.8); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .solved-banner { animation: solvedPop 0.5s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.8rem', color: '#e8e0d0', margin: '0 0 .3rem', fontWeight: 700 }}>
                🧩 Daily Puzzle
              </h1>
              <div style={{ fontSize: '.82rem', color: '#4a5568' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', color: '#c9a84c', padding: '.2rem .7rem', borderRadius: 999, fontSize: '.82rem' }}>
                {puzzle.theme}
              </span>
              <span>
                {diffStars(puzzle.difficulty).split('').map((star, i) => (
                  <span key={i} className="diff-star" style={{ color: diffColor(puzzle.difficulty), fontSize: '.9rem' }}>{star}</span>
                ))}
              </span>
              {streak > 0 && (
                <span style={{ color: '#f39c12', fontSize: '.9rem', background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', padding: '.2rem .65rem', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
                  <span className="flame">🔥</span>
                  {streak} day streak
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Board */}
            <div>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.5)' }}>
                {displayBoard && displayBoard.map((rank, ri) =>
                  rank.map((piece, fi) => {
                    const isLight = (ri + fi) % 2 === 0
                    const sq = colRowToSquare(fi, ri)
                    const isSelected = selected === sq
                    const isValid = validMoves.includes(sq)
                    const isHintFrom = showHint && hintFrom === sq
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
                          background: isSelected ? 'rgba(201,168,76,.6)'
                            : isHintFrom ? 'rgba(52,152,219,.5)'
                            : isLight ? '#f0d9b5' : '#b58863',
                          cursor: solved || gaveUp ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 'clamp(1rem,2.8vw,1.8rem)', lineHeight: 1, userSelect: 'none',
                          color: piece && piece[0] === 'b' ? '#1a0a00' : '#fff',
                          textShadow: piece && piece[0] === 'b' ? '0 1px 2px rgba(255,255,255,.35)' : '0 1px 3px rgba(0,0,0,.7)',
                        }}
                      >
                        {piece ? PIECES[piece] || '' : ''}
                        {isValid && !piece && (
                          <div style={{ width: '28%', height: '28%', borderRadius: '50%', background: 'rgba(201,168,76,.55)', pointerEvents: 'none' }} />
                        )}
                        {isValid && piece && (
                          <div style={{ position: 'absolute', inset: 0, border: '3px solid rgba(201,168,76,.7)', borderRadius: 2, pointerEvents: 'none' }} />
                        )}
                      </div>
                    )
                  })
                )}
                {/* Rank/file labels */}
                {RANKS.map((r, i) => {
                  const ri = flipped ? 7 - i : i
                  return <div key={r} style={{ position: 'absolute', right: '1%', top: `${ri * 12.5 + 1}%`, fontSize: '.6rem', color: ri % 2 === 0 ? '#b58863' : '#f0d9b5', fontWeight: 700, pointerEvents: 'none' }}>{flipped ? i+1 : 8-i}</div>
                })}
                {FILES.map((f, i) => {
                  const fi = flipped ? 7 - i : i
                  return <div key={f} style={{ position: 'absolute', left: `${fi * 12.5 + 1}%`, bottom: '1%', fontSize: '.6rem', color: fi % 2 === 0 ? '#f0d9b5' : '#b58863', fontWeight: 700, pointerEvents: 'none' }}>{flipped ? FILES[7-fi] : f}</div>
                })}
              </div>

              {/* Solved overlay message */}
              {solved && (
                <div className="solved-banner" style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '.35rem' }}>✅</div>
                  <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '1.05rem', fontFamily: 'var(--font-playfair),Georgia,serif' }}>
                    {todayMoves <= 1 ? 'Brilliant!' : todayMoves <= 2 ? 'Excellent!' : 'Good job!'}
                  </div>
                  <div style={{ color: '#4a5568', fontSize: '.85rem', marginTop: '.3rem' }}>Come back tomorrow for a new puzzle</div>
                  <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'center', marginTop: '.75rem', flexWrap: 'wrap' }}>
                    <button onClick={handleShare} style={{ background: 'rgba(201,168,76,.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, padding: '.4rem .9rem', cursor: 'pointer', fontSize: '.85rem' }}>
                      {copyMsg || '📤 Share Result'}
                    </button>
                    <Link href="/puzzles/rush" style={{ background: 'rgba(201,168,76,.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.4)', borderRadius: 7, padding: '.4rem .9rem', textDecoration: 'none', fontSize: '.85rem' }}>
                      ⚡ Try Puzzle Rush →
                    </Link>
                  </div>
                </div>
              )}

              {gaveUp && !solved && (
                <div style={{ marginTop: '1rem', padding: '.85rem 1.25rem', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 10, textAlign: 'center', color: '#9aa5b4', fontSize: '.88rem' }}>
                  Solution revealed. Come back tomorrow for a new puzzle!
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
              <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
                <div style={{ fontSize: '.82rem', color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.4rem', fontWeight: 700 }}>Puzzle #{puzzle.id}</div>
                <div style={{ color: '#e8e0d0', fontSize: '.92rem', lineHeight: 1.45 }}>{puzzle.description}</div>
                <div style={{ marginTop: '.6rem', fontSize: '.8rem', color: '#4a5568' }}>Rating: ~{puzzle.rating}</div>
              </div>

              {!solved && !gaveUp && (
                <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
                  <div style={{ fontSize: '.85rem', color: '#9aa5b4', marginBottom: '.4rem' }}>
                    Move {Math.floor(moveIdx / 2) + 1} of {Math.ceil(puzzle.moves.length / 2)}
                  </div>
                  <div style={{ background: 'rgba(201,168,76,.08)', borderRadius: 6, height: 5, marginBottom: '.75rem' }}>
                    <div style={{ height: '100%', width: `${(moveIdx / puzzle.moves.length) * 100}%`, background: '#c9a84c', borderRadius: 6, transition: 'width .3s' }} />
                  </div>
                  <div style={{ color: '#e8e0d0', fontSize: '.88rem', marginBottom: '.6rem' }}>
                    {playerColor === 'w' ? '⬜ White to move' : '⬛ Black to move'}
                  </div>
                  {wrongAttempts > 0 && (
                    <div style={{ color: '#ef4444', fontSize: '.8rem', marginBottom: '.5rem' }}>
                      {wrongAttempts} wrong attempt{wrongAttempts > 1 ? 's' : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                    <button
                      className="hint-btn"
                      onClick={() => {
                        const mv = puzzle.moves[moveIdx]
                        setHintFrom(mv.slice(0, 2))
                        setShowHint(true)
                        setTimeout(() => setShowHint(false), 2000)
                      }}
                    >💡 Hint</button>
                    <button className="giveup-btn" onClick={handleGiveUp}>Give Up</button>
                  </div>
                </div>
              )}

              <div style={{ ...cardStyle, padding: '1rem 1.1rem' }}>
                <div style={{ fontSize: '.82rem', color: '#4a5568', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>Your Stats</div>
                <div style={{ fontSize: '.9rem', color: '#e8e0d0' }}>🔥 {streak} day streak</div>
                <div style={{ fontSize: '.8rem', color: '#4a5568', marginTop: '.25rem' }}>
                  Total solved: {typeof window !== 'undefined' ? parseInt(localStorage.getItem('totalPuzzlesSolved') || '0') : 0}
                </div>
              </div>

              <Link href="/puzzles/rush" style={{ ...cardStyle, padding: '.85rem 1.1rem', textDecoration: 'none', display: 'block', transition: 'border-color .15s' }}>
                <div style={{ color: '#c9a84c', fontWeight: 700, fontSize: '.92rem' }}>⚡ Puzzle Rush</div>
                <div style={{ color: '#4a5568', fontSize: '.8rem', marginTop: '.2rem' }}>Solve as many as you can in 3 minutes</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
