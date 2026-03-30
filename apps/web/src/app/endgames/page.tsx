'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import AdUnit from '@/components/AdUnit'

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

const ENDGAMES = [
  {
    id: 1,
    name: 'King and Queen vs King',
    description: 'Learn to deliver checkmate with King + Queen',
    difficulty: 'beginner',
    fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1',
    goal: 'Checkmate the black king',
    tip: 'Use the queen to cut off the king to the edge, then bring your king in to assist.',
    solution: 'Push the king to the edge using the queen, then deliver checkmate with the king on the 6th rank and queen giving check.',
    steps: [
      'Use the queen to cut off the black king rank by rank',
      'Bring your king closer — it must assist the queen',
      'Force the black king to the edge of the board',
      'Deliver checkmate with queen + king cooperating'
    ]
  },
  {
    id: 2,
    name: 'King and Rook vs King',
    description: 'The fundamental rook endgame technique',
    difficulty: 'beginner',
    fen: '8/8/8/4k3/8/8/8/3RK3 w - - 0 1',
    goal: 'Checkmate the black king',
    tip: 'Use the "lawnmower" technique — rook cuts off the king row by row.',
    solution: 'The rook cuts off the king, then the white king comes to support. Force the black king to the last rank.',
    steps: [
      'Use the rook to cut off the black king with a "barrier"',
      'Bring your king toward the opponent\'s king',
      'Force the black king to the edge rank by rank',
      'Deliver checkmate with the rook on the last rank'
    ]
  },
  {
    id: 3,
    name: 'King and Pawn: Opposition',
    description: 'Understanding opposition in pawn endgames',
    difficulty: 'beginner',
    fen: '8/8/8/3k4/8/3K4/3P4/8 w - - 0 1',
    goal: 'Promote the pawn',
    tip: 'Opposition: kings face each other with one square between them. The side NOT to move has the opposition.',
    solution: 'White gains opposition and escorts the pawn. The key is keeping the king in front of the pawn.',
    steps: [
      'Opposition means kings face each other with 1 square gap',
      'The player NOT to move "has" the opposition advantage',
      'White king must stay in front of the pawn to escort it',
      'Key rule: king reaches the 6th rank in front of the pawn to win'
    ]
  },
  {
    id: 4,
    name: 'Lucena Position',
    description: 'The most important winning rook endgame',
    difficulty: 'intermediate',
    fen: '1K1k4/1P6/8/8/8/8/8/R7 w - - 0 1',
    goal: 'Win by building a bridge for the king',
    tip: 'The "bridge building" technique: use the rook to shelter the white king from checks.',
    solution: 'Play Rook to the 4th rank, advance the king, then use the rook to block checks ("build a bridge").',
    steps: [
      'The white king is cut off — it needs to cross the rook file',
      'Move the rook far away to give checking distance',
      'Advance the king past the rook\'s file',
      'Then "build a bridge" — shield the king with the rook'
    ]
  },
  {
    id: 5,
    name: 'Philidor Position',
    description: 'The key drawing technique in rook endgames',
    difficulty: 'intermediate',
    fen: '8/8/8/8/3k4/8/3p4/3RK3 b - - 0 1',
    goal: 'Hold the draw as Black',
    tip: 'Philidor: keep your rook on the 6th rank. Only move it to the back rank when the king advances.',
    solution: 'Black keeps the rook on the 6th rank until White\'s king advances, then switches to back rank checks.',
    steps: [
      'Keep the rook on the 6th rank to prevent the opposing king advancing',
      'When the enemy king crosses the 6th rank, move the rook to the back rank',
      'Give perpetual checks from behind — the king cannot escape',
      'This draws against King + Rook + Pawn vs King + Rook'
    ]
  },
  {
    id: 6,
    name: 'Two Bishops Checkmate',
    description: 'Mate with two bishops — requires technique',
    difficulty: 'intermediate',
    fen: '8/8/8/4k3/8/8/8/2BBK3 w - - 0 1',
    goal: 'Checkmate the black king',
    tip: 'The two bishops control both colors. Drive the king to a corner.',
    solution: 'Use the two bishops to form a diagonal "fence" that shrinks the king\'s space, then drive it to a corner.',
    steps: [
      'The two bishops cover both diagonal colors — very powerful',
      'Create a "fence" with both bishops to limit the king',
      'The king must go to a corner — any corner works',
      'Bring your king in to deliver the final checkmate'
    ]
  },
  {
    id: 7,
    name: 'Wrong Rook Pawn',
    description: 'Why a pawn+bishop can sometimes only draw',
    difficulty: 'intermediate',
    fen: '8/8/8/8/8/7k/7P/6BK w - - 0 1',
    goal: 'Understand why this is a draw',
    tip: 'The promotion square (h8) is a different color than the bishop! The king can sit in the corner forever.',
    solution: 'Black king simply runs to h8. Since the bishop cannot cover h8, it\'s stalemate or the king sits permanently in the corner.',
    steps: [
      'The promotion square h8 is a dark square',
      'The bishop on g1 is a light-squared bishop — it can never control h8!',
      'Black king simply goes to h8 and cannot be displaced',
      'White cannot make progress — this is a theoretical draw'
    ]
  },
]

const DIFF_COLORS = { beginner: '#22c55e', intermediate: '#f39c12', advanced: '#ef4444' }
const DIFF_LABELS = { beginner: '⭐ Beginner', intermediate: '⭐⭐ Intermediate', advanced: '⭐⭐⭐ Advanced' }

export default function EndgamesPage() {
  const [selected, setSelected] = useState(null)
  const [showTip, setShowTip] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [completed, setCompleted] = useState({})

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('endgames_completed') || '{}')
      setCompleted(saved)
    } catch {}
  }, [])

  function markComplete(id) {
    const updated = { ...completed, [id]: true }
    setCompleted(updated)
    try { localStorage.setItem('endgames_completed', JSON.stringify(updated)) } catch {}
  }

  function openEndgame(eg) {
    setSelected(eg)
    setShowTip(false)
    setShowSolution(false)
  }

  const board = selected ? fenToBoard(selected.fen) : null

  return (
    <>
      <style>{`
        .eg-card { background:rgba(255,255,255,0.04); border:1px solid rgba(201,168,76,0.15); border-radius:12px; padding:1rem; cursor:pointer; transition:all 0.2s; }
        .eg-card:hover { border-color:rgba(201,168,76,0.4); background:rgba(255,255,255,0.07); transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,0.25); }
        .eg-card.done { border-color:rgba(34,197,94,0.35); }
        .board-sq { width:12.5%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:clamp(1rem,3vw,1.5rem); user-select:none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.35s ease both; }
        .step-item { display:flex; gap:0.5rem; align-items:flex-start; font-size:0.83rem; color:#9aa5b4; margin-bottom:0.4rem; }
        .tip-box { background:rgba(201,168,76,0.08); border:1px solid rgba(201,168,76,0.25); border-radius:8px; padding:0.75rem; color:#c9a84c; font-size:0.85rem; line-height:1.55; margin-top:0.5rem; }
        .sol-box { background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.25); border-radius:8px; padding:0.75rem; color:#9aa5b4; font-size:0.83rem; line-height:1.55; margin-top:0.5rem; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.85rem', color: '#e8e0d0', margin: '0 0 0.3rem', fontWeight: 700 }}>
              ♟ Endgame Practice
            </h1>
            <p style={{ color: '#4a5568', fontSize: '0.88rem', margin: 0 }}>
              Master essential endgame techniques. {Object.keys(completed).length}/{ENDGAMES.length} completed.
            </p>
          </div>

          {!selected ? (
            // Grid of endgame cards
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {ENDGAMES.map(eg => (
                <div key={eg.id} className={`eg-card${completed[eg.id] ? ' done' : ''}`} onClick={() => openEndgame(eg)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: DIFF_COLORS[eg.difficulty], background: DIFF_COLORS[eg.difficulty] + '18', border: `1px solid ${DIFF_COLORS[eg.difficulty]}40`, borderRadius: 20, padding: '0.15rem 0.55rem' }}>
                      {DIFF_LABELS[eg.difficulty]}
                    </span>
                    {completed[eg.id] && <span style={{ fontSize: '1rem' }}>✅</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#e8e0d0', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>{eg.name}</div>
                  <div style={{ color: '#4a5568', fontSize: '0.82rem' }}>{eg.description}</div>
                  <div style={{ marginTop: '0.6rem', color: '#c9a84c', fontSize: '0.78rem', fontWeight: 600 }}>🎯 Goal: {eg.goal}</div>
                </div>
              ))}
            </div>
          ) : (
            // Endgame practice view
            <div className="fade-up" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Back button */}
              <div style={{ width: '100%' }}>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: '0.85rem', padding: 0, marginBottom: '0.5rem' }}>
                  ← Back to Endgames
                </button>
              </div>

              {/* Board */}
              <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '100%', maxWidth: '340px', background: '#1a1a2e', borderRadius: 8, padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  {board.map((rank, ri) => (
                    <div key={ri} style={{ display: 'flex' }}>
                      {rank.map((piece, fi) => {
                        const isLight = (ri + fi) % 2 === 0
                        return (
                          <div key={fi} className="board-sq"
                            style={{ background: isLight ? '#f0d9b5' : '#b58863', color: piece && piece === piece.toUpperCase() ? '#1a1a1a' : '#f0f0f0' }}>
                            {piece && (PIECE_UNICODE[piece] || piece)}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4a5568', textAlign: 'center' }}>
                  Starting position — {selected.fen.includes(' w ') ? 'White' : 'Black'} to move
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: '1 1 280px' }}>
                <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.3rem', color: '#c9a84c', fontWeight: 700, marginBottom: '0.3rem' }}>
                  {selected.name}
                </div>
                <span style={{ fontSize: '0.72rem', color: DIFF_COLORS[selected.difficulty], background: DIFF_COLORS[selected.difficulty] + '18', border: `1px solid ${DIFF_COLORS[selected.difficulty]}40`, borderRadius: 20, padding: '0.15rem 0.55rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                  {DIFF_LABELS[selected.difficulty]}
                </span>
                <p style={{ color: '#9aa5b4', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {selected.description}
                </p>
                <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 8, padding: '0.65rem 0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#c9a84c', fontSize: '0.78rem', fontWeight: 700 }}>🎯 Goal: </span>
                  <span style={{ color: '#e8e0d0', fontSize: '0.85rem' }}>{selected.goal}</span>
                </div>

                {/* Steps */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>How to approach this</div>
                  {selected.steps.map((step, i) => (
                    <div key={i} className="step-item">
                      <span style={{ color: '#c9a84c', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>

                {/* Hint & Solution buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button
                    onClick={() => setShowTip(p => !p)}
                    style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    💡 {showTip ? 'Hide Tip' : 'Show Tip'}
                  </button>
                  <button
                    onClick={() => setShowSolution(p => !p)}
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    🔍 {showSolution ? 'Hide' : 'Show Solution'}
                  </button>
                </div>

                {showTip && <div className="tip-box">💡 {selected.tip}</div>}
                {showSolution && <div className="sol-box">✅ {selected.solution}</div>}

                {/* Mark complete */}
                {!completed[selected.id] ? (
                  <button
                    onClick={() => markComplete(selected.id)}
                    style={{ marginTop: '1rem', background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 8, padding: '0.55rem 1.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, width: '100%' }}
                  >
                    ✅ Mark as Completed
                  </button>
                ) : (
                  <div style={{ marginTop: '1rem', textAlign: 'center', color: '#22c55e', fontSize: '0.85rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '0.55rem' }}>
                    ✅ Completed!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ad — bottom of endgames page */}
          <AdUnit slot="6666666666" format="horizontal" style={{ marginTop: 24, minHeight: 90 }} />
        </div>
      </div>
    </>
  )
}
