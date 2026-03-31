'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import AdUnit from '@/components/AdUnit'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const PIECE_UNICODE = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
}
const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

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

const OPENING_CATEGORIES = [
  {
    label: '1.e4 Openings', icon: '♙',
    openings: [
      { name: 'Sicilian Defense', eco: 'B20', moves: ['e4', 'c5'], fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
      { name: 'Sicilian: Najdorf', eco: 'B90', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], fen: 'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6' },
      { name: 'French Defense', eco: 'C00', moves: ['e4', 'e6'], fen: 'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
      { name: 'Caro-Kann Defense', eco: 'B10', moves: ['e4', 'c6'], fen: 'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
      { name: 'Italian Game', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3' },
      { name: 'Ruy Lopez', eco: 'C60', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3' },
      { name: "King's Gambit", eco: 'C30', moves: ['e4', 'e5', 'f4'], fen: 'rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2' },
      { name: 'Scandinavian Defense', eco: 'B01', moves: ['e4', 'd5'], fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
      { name: 'Alekhine Defense', eco: 'B02', moves: ['e4', 'Nf6'], fen: 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2' },
      { name: 'Russian Game', eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6'], fen: 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3' },
    ]
  },
  {
    label: '1.d4 Openings', icon: '♙',
    openings: [
      { name: "Queen's Gambit", eco: 'D06', moves: ['d4', 'd5', 'c4'], fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2' },
      { name: "Queen's Gambit Declined", eco: 'D30', moves: ['d4', 'd5', 'c4', 'e6'], fen: 'rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3' },
      { name: "Queen's Gambit Accepted", eco: 'D20', moves: ['d4', 'd5', 'c4', 'dxc4'], fen: 'rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3' },
      { name: "King's Indian Defense", eco: 'E60', moves: ['d4', 'Nf6', 'c4', 'g6'], fen: 'rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3' },
      { name: 'Nimzo-Indian Defense', eco: 'E20', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], fen: 'rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4' },
      { name: 'Grünfeld Defense', eco: 'D80', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'], fen: 'rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4' },
      { name: 'Slav Defense', eco: 'D10', moves: ['d4', 'd5', 'c4', 'c6'], fen: 'rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3' },
      { name: "Queen's Indian Defense", eco: 'E10', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'], fen: 'rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4' },
      { name: 'London System', eco: 'D02', moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], fen: 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/5N2/PPP1PPPP/RN1QKB1R b KQkq - 3 3' },
    ]
  },
  {
    label: 'Flank Openings', icon: '♙',
    openings: [
      { name: 'English Opening', eco: 'A10', moves: ['c4'], fen: 'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1' },
      { name: 'Reti Opening', eco: 'A04', moves: ['Nf3', 'd5'], fen: 'rnbqkbnr/ppp1pppp/8/3p4/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 2' },
      { name: "King's Indian Attack", eco: 'A07', moves: ['Nf3', 'd5', 'g3'], fen: 'rnbqkbnr/ppp1pppp/8/3p4/8/5NP1/PPPPPP1P/RNBQKB1R b KQkq - 0 2' },
    ]
  },
]

const OPENING_INFO = {
  'Sicilian Defense': {
    description: 'The most popular response to 1.e4. Black fights for the center asymmetrically, leading to sharp, complex positions with opposite-side attacking chances.',
    ideas: ['Black gets counterplay on the queenside with ...d5', 'Creates imbalanced positions perfect for fighting for a win', 'Leads to rich tactical battles — loved by attacking players'],
    whiteWin: 32, draw: 26, blackWin: 42,
  },
  'Sicilian: Najdorf': {
    description: "The most ambitious Sicilian — Black plays ...a6 to keep flexibility and prepare ...b5 or ...e5 counterplay. Used by Fischer and Kasparov.",
    ideas: ['...a6 prevents Bb5+ and prepares ...b5', 'Long-term queenside counterplay', 'Many razor-sharp variations — requires precise preparation'],
    whiteWin: 31, draw: 24, blackWin: 45,
  },
  'French Defense': {
    description: 'A solid defense where Black immediately challenges the center with ...e6. Known for its solid but slightly passive pawn structure.',
    ideas: ['Solid pawn structure — hard to break', 'Strong pawn chain with ...d5 and ...c5', 'Queenside counterplay with ...c5 undermining d4'],
    whiteWin: 35, draw: 29, blackWin: 36,
  },
  'Caro-Kann Defense': {
    description: "A solid, reliable defense similar to the French but without the 'bad bishop' problem. Popular at top levels for its soundness.",
    ideas: ['Solid pawn structure with no weaknesses', 'The c8-bishop remains active', 'Good endgame prospects — Black often outplays in endings'],
    whiteWin: 35, draw: 31, blackWin: 34,
  },
  'Italian Game': {
    description: 'One of the oldest openings. White aims for rapid development and control of the center with the bishop on c4.',
    ideas: ['Rapid development and piece activity', 'Fight for the center with d4 or c3+d4', 'Often leads to rich middlegame positions'],
    whiteWin: 38, draw: 28, blackWin: 34,
  },
  'Ruy Lopez': {
    description: "One of the most analyzed openings ever. White pressures the knight that defends e5. Leads to strategic battles.",
    ideas: ['Pressure on e5 with Bb5 pinning the knight', 'Long strategic battles with many plans', 'Many well-analyzed variations — Berlin, Morphy, Closed'],
    whiteWin: 38, draw: 31, blackWin: 31,
  },
  "King's Gambit": {
    description: "A romantic 19th century gambit! White sacrifices a pawn for rapid development and an open f-file. Very sharp.",
    ideas: ['Pawn sacrifice for fast development', 'Open f-file for attack against the king', 'Leads to sharp, double-edged tactical battles'],
    whiteWin: 42, draw: 22, blackWin: 36,
  },
  'Scandinavian Defense': {
    description: "Black immediately grabs the center with ...d5. After exd5, Black plays ...Qxd5 or ...Nf6 with solid counterplay.",
    ideas: ['Immediate central strike with ...d5', 'Active piece play for Black', 'Solid and reliable — avoids main-line theory'],
    whiteWin: 38, draw: 26, blackWin: 36,
  },
  'Alekhine Defense': {
    description: "A provocative defense where Black invites White to advance pawns and then attacks them. Named after World Champion Alekhine.",
    ideas: ['Black provokes White to overextend', 'Counter-attacks the pawn chain later', 'Hypermodern concept — attack from the flank'],
    whiteWin: 37, draw: 27, blackWin: 36,
  },
  'Russian Game': {
    description: "Also called the Petrov Defense. Black mirrors White's knight move for a very solid and symmetrical game.",
    ideas: ['Symmetrical play leads to solid equality', 'Very hard to lose with Black', 'Drawish in the endgame — excellent for defense'],
    whiteWin: 33, draw: 38, blackWin: 29,
  },
  "Queen's Gambit": {
    description: "White offers a pawn to gain center control. Not a true gambit — taking leads to White regaining material with better development.",
    ideas: ['Fight for center control with c4', 'White gets active piece play', 'Can transpose to QGD, QGA, or Slav'],
    whiteWin: 36, draw: 34, blackWin: 30,
  },
  "Queen's Gambit Declined": {
    description: "Black declines the pawn offer and fights for the center with ...e6. One of the most solid openings in chess.",
    ideas: ['Solid central control with ...d5 and ...e6', 'Active piece play after ...c5 or ...dxc4', 'Long strategic battles — excellent for professionals'],
    whiteWin: 34, draw: 36, blackWin: 30,
  },
  "Queen's Gambit Accepted": {
    description: "Black accepts the pawn! This leads to an active game where Black gives up the center temporarily for piece activity.",
    ideas: ['Accept the pawn, then fight for equality', 'Black aims to return the pawn advantageously', 'Leads to open, active positions'],
    whiteWin: 38, draw: 31, blackWin: 31,
  },
  "King's Indian Defense": {
    description: "Black allows White to build a large center then fianchettoes and counter-attacks it. Extremely sharp and double-edged.",
    ideas: ['Black attacks kingside with ...f5 or ...g5', 'White attacks queenside with c5 and b4', 'Requires concrete calculation — loved by Kasparov'],
    whiteWin: 34, draw: 27, blackWin: 39,
  },
  'Nimzo-Indian Defense': {
    description: "Black pins White's knight immediately with ...Bb4. One of the most respected defenses — leads to complex strategic fights.",
    ideas: ['Pin the c3 knight to double White pawns', 'Fight for dark squares after ...Bxc3', 'Flexible — Black chooses structure based on White\'s play'],
    whiteWin: 33, draw: 32, blackWin: 35,
  },
  'Grünfeld Defense': {
    description: "Black invites White to build a big center and then attacks it immediately with ...d5. Very sharp and theoretical.",
    ideas: ['Attack the d4 pawn immediately', 'Active counterplay in the center', 'Very dynamic — used by Kasparov and Fischer'],
    whiteWin: 36, draw: 28, blackWin: 36,
  },
  'Slav Defense': {
    description: "Black supports d5 with ...c6 rather than ...e6, keeping the c8-bishop free. Very solid and reliable.",
    ideas: ['Support d5 without blocking the c8-bishop', 'Active play for both sides', 'Solid foundation — less theoretical than QGD'],
    whiteWin: 34, draw: 33, blackWin: 33,
  },
  "Queen's Indian Defense": {
    description: "Black fianchettoes the queenside bishop to fight for the center from afar. Strategic and positional.",
    ideas: ['Fight for e4 square with ...Bb7', 'Flexible development options', 'Strategic play without early confrontation'],
    whiteWin: 35, draw: 33, blackWin: 32,
  },
  'London System': {
    description: "A solid, setup-based opening for White. After d4+Nf3+Bf4, White builds a strong structure. Very popular at club level.",
    ideas: ['Set up a solid structure regardless of Black\'s play', 'Bf4 secures the e5 square', 'Low theory — same plan against anything'],
    whiteWin: 40, draw: 28, blackWin: 32,
  },
  'English Opening': {
    description: "A flexible flank opening. White controls d5 with c4 and transposes to many different pawn structures.",
    ideas: ['Control d5 from the flank', 'Flexible — can transpose to d4 openings', 'Hypermodern approach to the center'],
    whiteWin: 37, draw: 33, blackWin: 30,
  },
  'Reti Opening': {
    description: "A hypermodern opening by White, delaying central pawns and fianchettoing both bishops to control from afar.",
    ideas: ['Control the center from the flank', 'Flexible — avoid early commitments', 'Often transposes to Catalan or English'],
    whiteWin: 36, draw: 33, blackWin: 31,
  },
  "King's Indian Attack": {
    description: "White sets up the same flexible structure regardless of Black's play — Nf3, g3, Bg2, d3, Nd2, O-O.",
    ideas: ['Solid setup for any Black response', 'Kingside expansion with e5 and f4', 'Flexible — can adjust based on opponent'],
    whiteWin: 38, draw: 29, blackWin: 33,
  },
}

export default function OpeningsPage() {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [selectedOpening, setSelectedOpening] = useState(OPENING_CATEGORIES[0].openings[0])
  const [board, setBoard] = useState(fenToBoard(INITIAL_FEN))
  const [isPlaying, setIsPlaying] = useState(false)
  const [playIdx, setPlayIdx] = useState(0)
  const [currentFen, setCurrentFen] = useState(INITIAL_FEN)
  const playTimerRef = useRef(null)

  function selectOpening(op) {
    stopPlay()
    setSelectedOpening(op)
    setBoard(fenToBoard(op.fen || INITIAL_FEN))
    setCurrentFen(op.fen || INITIAL_FEN)
    setPlayIdx(0)
  }

  function stopPlay() {
    if (playTimerRef.current) { clearTimeout(playTimerRef.current); playTimerRef.current = null }
    setIsPlaying(false)
  }

  function playThrough() {
    if (!selectedOpening) return
    stopPlay()
    setBoard(fenToBoard(INITIAL_FEN))
    setCurrentFen(INITIAL_FEN)
    setPlayIdx(0)
    setIsPlaying(true)
    let idx = 0
    const moves = selectedOpening.moves || []
    function step() {
      if (idx >= moves.length) { setIsPlaying(false); return }
      // Show final FEN after all moves
      if (idx === moves.length - 1) {
        setBoard(fenToBoard(selectedOpening.fen || INITIAL_FEN))
        setCurrentFen(selectedOpening.fen || INITIAL_FEN)
      }
      setPlayIdx(idx)
      idx++
      playTimerRef.current = setTimeout(step, 800)
    }
    playTimerRef.current = setTimeout(step, 300)
  }

  useEffect(() => () => stopPlay(), [])

  const info = OPENING_INFO[selectedOpening?.name]

  return (
    <>
      <style>{`
        .op-item { padding:0.5rem 0.75rem; border-radius:8px; cursor:pointer; transition:background 0.15s, color 0.15s; font-size:0.85rem; }
        .op-item:hover { background:rgba(201,168,76,0.1); color:#c9a84c; }
        .op-item.active { background:rgba(201,168,76,0.15); color:#c9a84c; font-weight:600; }
        .cat-btn { background:none; border:none; cursor:pointer; padding:0.4rem 0.75rem; border-radius:7px; font-family:var(--font-crimson),Georgia,serif; font-size:0.85rem; transition:all 0.15s; }
        .cat-btn.active { background:rgba(201,168,76,0.15); color:#c9a84c; }
        .cat-btn:not(.active) { color:#4a5568; }
        .cat-btn:hover:not(.active) { color:#9aa5b4; background:rgba(255,255,255,0.04); }
        .win-bar-white { height:100%; background:#e8e0d0; border-radius:3px 0 0 3px; display:flex; align-items:center; justify-content:center; font-size:0.72rem; color:#0a1628; font-weight:700; overflow:hidden; }
        .win-bar-draw { height:100%; background:#4a5568; display:flex; align-items:center; justify-content:center; font-size:0.72rem; color:#e8e0d0; font-weight:700; overflow:hidden; }
        .win-bar-black { height:100%; background:#1a1a2e; border:1px solid rgba(255,255,255,0.15); border-radius:0 3px 3px 0; display:flex; align-items:center; justify-content:center; font-size:0.72rem; color:#e8e0d0; font-weight:700; overflow:hidden; }
        .board-sq { width:12.5%; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font-size:clamp(0.9rem,2.5vw,1.5rem); user-select:none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.35s ease both; }
      `}</style>

      <div style={{ background: '#0a1628', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.85rem', color: '#e8e0d0', margin: '0 0 0.3rem', fontWeight: 700 }}>
              📖 Opening Explorer
            </h1>
            <p style={{ color: '#4a5568', fontSize: '0.88rem', margin: 0 }}>
              Browse and learn the most important chess openings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* Left: Category + list */}
            <div style={{ flex: '0 0 220px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, overflow: 'hidden' }}>
              {/* Category tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', padding: '0.6rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                {OPENING_CATEGORIES.map((cat, ci) => (
                  <button key={ci} className={`cat-btn${selectedCategory === ci ? ' active' : ''}`} onClick={() => { setSelectedCategory(ci); selectOpening(cat.openings[0]) }}>
                    {cat.label.split(' ')[0]}
                  </button>
                ))}
              </div>
              {/* Opening list */}
              <div style={{ padding: '0.5rem' }}>
                {OPENING_CATEGORIES[selectedCategory].openings.map((op, oi) => (
                  <div
                    key={oi}
                    className={`op-item${selectedOpening?.name === op.name ? ' active' : ''}`}
                    onClick={() => selectOpening(op)}
                  >
                    <div>{op.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#4a5568', marginTop: '0.1rem' }}>{op.eco} · {op.moves.length} moves</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Board */}
            <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '100%', maxWidth: '360px', background: '#1a1a2e', borderRadius: 8, padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
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

              {/* Moves display */}
              {selectedOpening?.moves?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', justifyContent: 'center', maxWidth: '360px' }}>
                  {selectedOpening.moves.map((m, i) => {
                    const moveNum = Math.floor(i / 2) + 1
                    const isWhite = i % 2 === 0
                    return (
                      <span key={i} style={{ fontSize: '0.82rem', color: isPlaying && playIdx >= i ? '#c9a84c' : '#9aa5b4', background: isPlaying && playIdx === i ? 'rgba(201,168,76,0.15)' : 'transparent', borderRadius: 4, padding: '0.1rem 0.3rem' }}>
                        {isWhite && <span style={{ color: '#4a5568' }}>{moveNum}. </span>}{m}
                      </span>
                    )
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => { stopPlay(); setBoard(fenToBoard(INITIAL_FEN)); setCurrentFen(INITIAL_FEN); setPlayIdx(0) }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa5b4', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  ↺ Reset
                </button>
                <button
                  onClick={isPlaying ? stopPlay : playThrough}
                  style={{ background: isPlaying ? 'rgba(239,68,68,0.12)' : 'rgba(201,168,76,0.12)', border: `1px solid ${isPlaying ? 'rgba(239,68,68,0.35)' : 'rgba(201,168,76,0.35)'}`, color: isPlaying ? '#ef4444' : '#c9a84c', borderRadius: 8, padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  {isPlaying ? '⏹ Stop' : '▶ Play Through'}
                </button>
                <button
                  onClick={() => { stopPlay(); setBoard(fenToBoard(selectedOpening?.fen || INITIAL_FEN)); setCurrentFen(selectedOpening?.fen || INITIAL_FEN) }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#9aa5b4', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem' }}
                >
                  End
                </button>
              </div>
            </div>

            {/* Right: Info panel */}
            {selectedOpening && (
              <div key={selectedOpening.name} className="fade-up" style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Opening card */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '1.1rem' }}>
                  <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.1rem', color: '#c9a84c', fontWeight: 700, marginBottom: '0.2rem' }}>
                    {selectedOpening.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4a5568', marginBottom: '0.75rem' }}>ECO: {selectedOpening.eco}</div>

                  {info ? (
                    <>
                      <p style={{ color: '#9aa5b4', fontSize: '0.83rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                        {info.description}
                      </p>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Key Ideas</div>
                        {info.ideas.map((idea, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#9aa5b4', marginBottom: '0.2rem' }}>
                            <span style={{ color: '#c9a84c', flexShrink: 0 }}>•</span>
                            {idea}
                          </div>
                        ))}
                      </div>
                      {/* Win rate bar */}
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Results at Top Level</div>
                        <div style={{ display: 'flex', height: '22px', borderRadius: 3, overflow: 'hidden' }}>
                          <div className="win-bar-white" style={{ width: `${info.whiteWin}%` }}>{info.whiteWin}%</div>
                          <div className="win-bar-draw" style={{ width: `${info.draw}%` }}>{info.draw}%</div>
                          <div className="win-bar-black" style={{ width: `${info.blackWin}%` }}>{info.blackWin}%</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#4a5568', marginTop: '0.25rem' }}>
                          <span>White</span><span>Draw</span><span>Black</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p style={{ color: '#4a5568', fontSize: '0.83rem' }}>Select an opening to see details.</p>
                  )}
                </div>

                <Link
                  href="/puzzles"
                  style={{ display: 'block', textAlign: 'center', background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8, padding: '0.6rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  🧩 Practice Tactics
                </Link>
                <Link
                  href="/lobby"
                  style={{ display: 'block', textAlign: 'center', background: 'rgba(255,255,255,0.04)', color: '#9aa5b4', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.6rem', textDecoration: 'none', fontSize: '0.85rem' }}
                >
                  ♟ Play a Game
                </Link>
              </div>
            )}

          {/* Ad — bottom of openings page */}
          <AdUnit slot="5555555555" format="horizontal" style={{ marginTop: 24, minHeight: 90 }} />
          </div>
        </div>
      </div>
    </>
  )
}
