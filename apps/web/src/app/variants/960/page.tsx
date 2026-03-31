'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const PIECE_MAP = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
}

function generateChess960Position() {
  const position = new Array(8).fill('')

  // 1. Dark-squared bishop (columns 1,3,5,7)
  const darkBishopCol = [1, 3, 5, 7][Math.floor(Math.random() * 4)]
  position[darkBishopCol] = 'B'

  // 2. Light-squared bishop (columns 0,2,4,6)
  const lightBishopCol = [0, 2, 4, 6][Math.floor(Math.random() * 4)]
  position[lightBishopCol] = 'B'

  // 3. Queen in remaining spots
  const rem1 = position.map((p, i) => p === '' ? i : -1).filter(i => i !== -1)
  const queenPos = rem1[Math.floor(Math.random() * rem1.length)]
  position[queenPos] = 'Q'

  // 4. First knight
  const rem2 = position.map((p, i) => p === '' ? i : -1).filter(i => i !== -1)
  const knight1 = rem2[Math.floor(Math.random() * rem2.length)]
  position[knight1] = 'N'

  // 5. Second knight
  const rem3 = position.map((p, i) => p === '' ? i : -1).filter(i => i !== -1)
  const knight2 = rem3[Math.floor(Math.random() * rem3.length)]
  position[knight2] = 'N'

  // 6. Rook, King, Rook in remaining 3 spots (in order)
  const rem4 = position.map((p, i) => p === '' ? i : -1).filter(i => i !== -1)
  position[rem4[0]] = 'R'
  position[rem4[1]] = 'K'
  position[rem4[2]] = 'R'

  return position.join('')
}

function positionToFEN(whitePos) {
  const blackPos = whitePos.toLowerCase()
  return `${blackPos}/pppppppp/8/8/8/8/PPPPPPPP/${whitePos} w KQkq - 0 1`
}

function fenToBoard(fen) {
  return fen.split(' ')[0].split('/').map(row => {
    const cells = []
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) cells.push({ p: null, c: null })
      else cells.push({ p: ch.toUpperCase(), c: ch === ch.toUpperCase() ? 'w' : 'b' })
    }
    return cells
  })
}

function coordToSq(r, c, flipped) {
  if (flipped) return String.fromCharCode(97 + (7 - c)) + (r + 1)
  return String.fromCharCode(97 + c) + (8 - r)
}

// Calculate Chess960 position number (SP number, 0-959)
function getPositionNumber(pos) {
  // Simplified — just show a friendly hash
  let h = 0
  for (const ch of pos) h = ((h << 5) - h + ch.charCodeAt(0)) | 0
  return Math.abs(h) % 960
}

export default function Chess960Page() {
  const [position, setPosition] = useState(() => generateChess960Position())
  const [phase, setPhase] = useState('setup') // 'setup' | 'game' | 'over'
  const [colorChoice, setColorChoice] = useState('w')
  const [playerColor, setPlayerColor] = useState('w')

  const chessRef = useRef(null)
  const workerRef = useRef(null)
  const [fen, setFen] = useState('')
  const [selected, setSelected] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [botThinking, setBotThinking] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [moveList, setMoveList] = useState([])
  const [promoState, setPromoState] = useState(null)
  const [gameResult, setGameResult] = useState(null)
  const [gamePgn, setGamePgn] = useState('')
  const [boardSize, setBoardSize] = useState(480)
  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [touchDragFrom, setTouchDragFrom] = useState(null)
  const moveListRef = useRef(null)

  useEffect(() => {
    if (moveListRef.current) moveListRef.current.scrollTop = moveListRef.current.scrollHeight
  }, [moveList])
  useEffect(() => () => { workerRef.current?.terminate() }, [])

  useEffect(() => {
    function calcSize() {
      const w = window.innerWidth
      const h = window.innerHeight
      if (w < 640) {
        setBoardSize(Math.min(w - 16, h - 120))
      } else {
        setBoardSize(Math.min(h - 140, w - 155 - 200 - 32))
      }
    }
    calcSize()
    window.addEventListener('resize', calcSize)
    return () => window.removeEventListener('resize', calcSize)
  }, [])

  function rollNewPosition() {
    setPosition(generateChess960Position())
  }

  function startGame() {
    const color = colorChoice === 'r' ? (Math.random() > 0.5 ? 'w' : 'b') : colorChoice
    setPlayerColor(color)
    setFlipped(color === 'b')

    const Chess = require('chess.js').Chess
    const startFen = positionToFEN(position)
    const chess = new Chess(startFen)
    chessRef.current = chess
    setFen(chess.fen())
    setSelected(null); setLegalTargets([]); setLastMove(null)
    setMoveList([]); setGameResult(null); setBotThinking(false)
    setPromoState(null); setGamePgn('')

    const blob = new Blob(
      [`importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')`],
      { type: 'text/javascript' }
    )
    try {
      const w = new Worker(URL.createObjectURL(blob))
      w.postMessage('uci'); w.postMessage('isready')
      w.postMessage('setoption name Skill Level value 10')
      workerRef.current = w
    } catch { workerRef.current = null }

    setPhase('game')
    if (color === 'b') setTimeout(() => triggerBot(chess, color), 700)
  }

  function triggerBot(chess, pColor) {
    const w = workerRef.current
    if (!w) return
    setBotThinking(true)
    let responded = false
    w.onmessage = (e) => {
      const msg = e.data
      if (!msg.startsWith('bestmove') || responded) return
      responded = true
      const uci = msg.split(' ')[1]
      if (!uci || uci === '(none)') { setBotThinking(false); return }
      setTimeout(() => {
        try {
          const mv = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined })
          if (!mv) { setBotThinking(false); return }
          setFen(chess.fen())
          setLastMove({ from: uci.slice(0, 2), to: uci.slice(2, 4) })
          setMoveList(h => [...h, mv.san])
          setBotThinking(false)
          checkOver(chess, pColor)
        } catch { setBotThinking(false) }
      }, 300)
    }
    w.postMessage(`position fen ${chess.fen()}`)
    w.postMessage('go depth 5 movetime 600')
  }

  function handleSquareClick(sq) {
    const chess = chessRef.current
    if (!chess || botThinking || promoState || gameResult) return
    if (chess.turn() !== playerColor) return
    if (selected) {
      if (legalTargets.includes(sq)) {
        const piece = chess.get(selected)
        const isPromo = piece?.type === 'p' && ((playerColor === 'w' && sq[1] === '8') || (playerColor === 'b' && sq[1] === '1'))
        if (isPromo) { setPromoState({ from: selected, to: sq }); setSelected(null); setLegalTargets([]); return }
        doMove(selected, sq, undefined)
      } else if (chess.get(sq)?.color === playerColor) {
        const mvs = chess.moves({ square: sq, verbose: true })
        setSelected(sq); setLegalTargets(mvs.map(m => m.to))
      } else { setSelected(null); setLegalTargets([]) }
    } else {
      if (chess.get(sq)?.color === playerColor) {
        const mvs = chess.moves({ square: sq, verbose: true })
        setSelected(sq); setLegalTargets(mvs.map(m => m.to))
      }
    }
  }

  function handleDragMove(from, to) {
    const chess = chessRef.current
    if (!chess || botThinking || promoState || gameResult) return
    if (chess.turn() !== playerColor) return
    const legal = chess.moves({ square: from, verbose: true }).map(m => m.to)
    if (!legal.includes(to)) return
    const piece = chess.get(from)
    const isPromo = piece?.type === 'p' && ((playerColor === 'w' && to[1] === '8') || (playerColor === 'b' && to[1] === '1'))
    if (isPromo) { setPromoState({ from, to }); setSelected(null); setLegalTargets([]); return }
    doMove(from, to, undefined)
  }

  function doMove(from, to, promo) {
    const chess = chessRef.current
    try {
      const mv = chess.move({ from, to, promotion: promo || undefined })
      if (!mv) return
      setFen(chess.fen()); setLastMove({ from, to })
      setMoveList(h => [...h, mv.san])
      setSelected(null); setLegalTargets([]); setPromoState(null)
      if (checkOver(chess, playerColor)) return
      setTimeout(() => triggerBot(chess, playerColor), 200)
    } catch { setSelected(null); setLegalTargets([]) }
  }

  function checkOver(chess, pColor) {
    const checkmate = chess.isCheckmate?.() || chess.in_checkmate?.()
    const draw = chess.isDraw?.() || chess.in_draw?.()
    if (checkmate) {
      const winner = chess.turn() === pColor ? 'bot' : 'player'
      setGameResult({ winner, reason: 'Checkmate' })
      setGamePgn(chess.pgn()); setPhase('over'); return true
    }
    if (draw) {
      setGameResult({ winner: 'draw', reason: 'Draw' })
      setGamePgn(chess.pgn()); setPhase('over'); return true
    }
    return false
  }

  const posNum = getPositionNumber(position)
  const startFenPreview = positionToFEN(position)

  if (phase === 'setup') {
    const previewBoard = fenToBoard(startFenPreview)
    return (
      <>
        <style>{`
          .color-tab { flex:1; border-radius:8px; padding:0.7rem; cursor:pointer; transition:all 0.15s; background:rgba(255,255,255,0.04); border:2px solid transparent; font-family:var(--font-playfair),Georgia,serif; font-size:0.9rem; font-weight:700; color:#9aa5b4; }
          .color-tab.sel { border-color:#3498db; background:rgba(52,152,219,0.1); color:#3498db; }
          .bsq-p { width:48px; height:48px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        `}</style>
        <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
          <Navbar />
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Link href="/variants" style={{ color: '#4a5568', fontSize: '0.85rem', textDecoration: 'none' }}>← Variants</Link>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', lineHeight: 1, marginBottom: '0.5rem' }}>🎲</div>
              <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '2rem', color: '#e8e0d0', margin: '0 0 0.4rem', fontWeight: 700 }}>Chess960</h1>
              <p style={{ color: '#4a5568', margin: 0, fontSize: '0.85rem' }}>Position #{posNum} — {960} possible starting positions</p>
            </div>

            {/* Starting position display */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(52,152,219,0.3)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#9aa5b4', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Starting Position</div>
              <div style={{ display: 'inline-block', border: '2px solid rgba(52,152,219,0.4)', borderRadius: 4, overflow: 'hidden', marginBottom: '0.75rem' }}>
                {previewBoard.slice(0, 2).map((row, r) => (
                  <div key={r} style={{ display: 'flex' }}>
                    {row.map((cell, c) => {
                      const isLight = (r + c) % 2 === 0
                      const pieceKey = cell?.p && cell?.c ? cell.c + cell.p : null
                      const pieceChar = pieceKey ? PIECE_MAP[pieceKey] : null
                      return (
                        <div key={c} className="bsq-p" style={{ background: isLight ? '#f0d9b5' : '#b58863' }}>
                          {pieceChar && (
                            <span style={{ fontSize: '1.6rem', lineHeight: 1, color: cell?.c === 'w' ? '#fff' : '#1a1008', WebkitTextStroke: cell?.c === 'w' ? '0.5px #555' : '0.5px #bbb', filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.4))' }}>
                              {pieceChar}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.2rem', color: '#3498db', fontWeight: 700 }}>
                {position}
              </div>
              <button
                onClick={rollNewPosition}
                style={{ marginTop: '0.75rem', background: 'rgba(52,152,219,0.1)', color: '#3498db', border: '1px solid rgba(52,152,219,0.4)', borderRadius: 8, padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-playfair),Georgia,serif' }}
              >
                🎲 New Random Position
              </button>
            </div>

            {/* Color choice */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', color: '#9aa5b4', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>Play As</div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {[['w','♔ White'],['b','♚ Black'],['r','⚄ Random']].map(([v, l]) => (
                  <button key={v} className={`color-tab${colorChoice === v ? ' sel' : ''}`} onClick={() => setColorChoice(v)}>{l}</button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              style={{ width: '100%', background: 'linear-gradient(135deg, #5dade2 0%, #3498db 55%, #2471a3 100%)', color: 'white', border: 'none', borderRadius: 10, padding: '1rem', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-playfair),Georgia,serif', boxShadow: '0 4px 20px rgba(52,152,219,0.3)', transition: 'filter 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = '' }}
            >
              ▶ Play Chess960 vs Bot
            </button>
            <p style={{ textAlign: 'center', color: '#374151', fontSize: '0.78rem', marginTop: '0.75rem' }}>
              Bot is set to Intermediate (Elo ~1200)
            </p>
          </div>
        </div>
      </>
    )
  }

  // ─── GAME SCREEN ───────────────────────────────────────────────
  const board = fenToBoard(fen || startFenPreview)
  const chess = chessRef.current
  const currentTurn = chess?.turn() || 'w'
  const inCheck = chess?.inCheck?.() || chess?.in_check?.() || false

  const moveRows = moveList.reduce((rows, m, i) => {
    if (i % 2 === 0) rows.push({ n: Math.floor(i / 2) + 1, w: m, b: undefined })
    else rows[rows.length - 1].b = m
    return rows
  }, [])

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes dot-blink { 0%,100%{opacity:0.2} 50%{opacity:1} }
        .bsq { width:60px;height:60px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;user-select:none;box-sizing:border-box;flex-shrink:0; }
        .ctrl-btn { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.85rem; color:#9aa5b4; font-size:0.82rem; cursor:pointer; transition:all 0.15s; font-family:var(--font-crimson),Georgia,serif; text-align:left; width:100%; }
        .ctrl-btn:hover { background:rgba(255,255,255,0.09); color:#e8e0d0; }
        .thinking-dot { width:5px;height:5px;border-radius:50%;background:#3498db;display:inline-block; }
        .thinking-dot:nth-child(1){animation:dot-blink 1s ease-in-out 0s infinite}
        .thinking-dot:nth-child(2){animation:dot-blink 1s ease-in-out 0.33s infinite}
        .thinking-dot:nth-child(3){animation:dot-blink 1s ease-in-out 0.66s infinite}
        .moves-s::-webkit-scrollbar{width:4px}
        .moves-s::-webkit-scrollbar-thumb{background:rgba(52,152,219,0.2);border-radius:2px}
        @media(max-width:620px){ .side960{display:none!important;} }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Left panel */}
          <div className="side960" style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '0.7rem', paddingTop: '0.5rem' }}>
            <div style={{ background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', lineHeight: 1, marginBottom: '0.4rem' }}>🤖</div>
              <div style={{ fontFamily: 'var(--font-playfair)', color: '#e8e0d0', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>Computer</div>
              <div style={{ fontSize: '0.7rem', color: '#3498db', marginBottom: '0.3rem' }}>1200 Elo</div>
              {botThinking ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span className="thinking-dot"/><span className="thinking-dot"/><span className="thinking-dot"/>
                </div>
              ) : (
                <div style={{ fontSize: '0.7rem', color: currentTurn !== playerColor ? '#22c55e' : '#4a5568' }}>
                  {currentTurn !== playerColor ? '● Turn' : '○ Waiting'}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1.5px solid rgba(201,168,76,0.25)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', lineHeight: 1, marginBottom: '0.4rem' }}>{playerColor === 'w' ? '♔' : '♚'}</div>
              <div style={{ fontFamily: 'var(--font-playfair)', color: '#e8e0d0', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>You</div>
              <div style={{ fontSize: '0.7rem', color: currentTurn === playerColor ? '#22c55e' : '#4a5568' }}>
                {currentTurn === playerColor ? '● Your Turn' : '○ Waiting'}
              </div>
            </div>
          </div>

          {/* Board */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {promoState && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,12,28,0.92)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                <div style={{ background: '#0d1f3c', border: '1.5px solid rgba(52,152,219,0.5)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-playfair)', color: '#e8e0d0', fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Promote to:</div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {['q','r','b','n'].map(p => (
                      <button key={p} onClick={() => doMove(promoState.from, promoState.to, p)}
                        style={{ background: 'rgba(52,152,219,0.1)', border: '1.5px solid rgba(52,152,219,0.4)', borderRadius: 8, padding: '0.5rem 0.6rem', fontSize: '2.2rem', cursor: 'pointer', lineHeight: 1 }}>
                        {PIECE_MAP[playerColor + p.toUpperCase()]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div style={{ border: '2.5px solid rgba(52,152,219,0.4)', borderRadius: 3, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', display: 'inline-block' }}>
              {Array.from({ length: 8 }, (_, r) => (
                <div key={r} style={{ display: 'flex' }}>
                  {Array.from({ length: 8 }, (_, c) => {
                    const sq = coordToSq(r, c, flipped)
                    const boardRow = flipped ? 7 - r : r
                    const boardCol = flipped ? 7 - c : c
                    const cell = board[boardRow]?.[boardCol]
                    const isLight = (r + c) % 2 === 0
                    const isSel = selected === sq
                    const isLegal = legalTargets.includes(sq)
                    const isLastFrom = lastMove?.from === sq
                    const isLastTo = lastMove?.to === sq
                    const isKingCheck = inCheck && cell?.p === 'K' && cell?.c === currentTurn
                    const hasPiece = !!cell?.p

                    let bg = isLight ? '#f0d9b5' : '#b58863'
                    if (isLastFrom || isLastTo) bg = isLight ? '#cdd26a' : '#aaa23a'
                    if (isSel) bg = '#7fc97f'
                    if (isKingCheck) bg = '#e74c3c'
                    const isMyPieceHere = !botThinking && !promoState && !gameResult &&
                      cell?.c === playerColor && chessRef.current?.turn() === playerColor
                    const isDragFrom = dragFrom === sq
                    const isDragOver = dragOver === sq
                    const isDragValid = !!dragFrom && legalTargets.includes(sq)
                    if (isDragOver && isDragValid) bg = isLight ? '#f6f669' : '#baca2b'
                    else if (isDragOver && dragFrom && !isDragValid) bg = isLight ? '#ffaaaa' : '#cc5555'

                    const pieceKey = cell?.p && cell?.c ? cell.c + cell.p : null
                    const pieceChar = pieceKey ? PIECE_MAP[pieceKey] : null

                    const sqPx = Math.max(36, Math.floor(boardSize / 8))
                    const pieceFontPx = Math.round(sqPx * 0.7)
                    return (
                      <div key={c} className="bsq" data-square={sq}
                        draggable={!!isMyPieceHere}
                        onClick={() => handleSquareClick(sq)}
                        onDragStart={isMyPieceHere ? (e) => {
                          setDragFrom(sq); setSelected(sq)
                          const mvs = chessRef.current.moves({ square: sq, verbose: true })
                          setLegalTargets(mvs.map(m => m.to))
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', sq)
                        } : undefined}
                        onDragEnd={() => { setDragFrom(null); setDragOver(null) }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(sq) }}
                        onDragEnter={(e) => { e.preventDefault(); setDragOver(sq) }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const from = e.dataTransfer.getData('text/plain') || dragFrom
                          if (from && from !== sq) handleDragMove(from, sq)
                          setDragFrom(null); setDragOver(null)
                        }}
                        onTouchStart={isMyPieceHere ? (e) => {
                          setTouchDragFrom(sq); setSelected(sq)
                          const mvs = chessRef.current.moves({ square: sq, verbose: true })
                          setLegalTargets(mvs.map(m => m.to))
                        } : undefined}
                        onTouchEnd={(e) => {
                          if (!touchDragFrom) return
                          const t = e.changedTouches[0]
                          const el = document.elementFromPoint(t.clientX, t.clientY)
                          const targetSq = el?.closest('[data-square]')?.getAttribute('data-square')
                          if (targetSq && targetSq !== touchDragFrom) handleDragMove(touchDragFrom, targetSq)
                          setTouchDragFrom(null); setDragOver(null)
                        }}
                        style={{ width: sqPx, height: sqPx, background: bg, opacity: isDragFrom ? 0.5 : 1, cursor: isMyPieceHere ? 'grab' : 'default' }}>
                        {isLegal && (
                          <div style={{ position: 'absolute', width: hasPiece ? '88%' : '32%', height: hasPiece ? '88%' : '32%', borderRadius: '50%', background: hasPiece ? 'transparent' : 'rgba(0,0,0,0.22)', border: hasPiece ? '3px solid rgba(0,0,0,0.28)' : 'none', zIndex: 1, pointerEvents: 'none' }} />
                        )}
                        {pieceChar && (
                          <span className="piece-g" style={{ fontSize: pieceFontPx, lineHeight: 1, zIndex: 2, position: 'relative', filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.45))', color: cell?.c === 'w' ? '#fff' : '#1a1008', WebkitTextStroke: cell?.c === 'w' ? '0.5px #555' : '0.5px #bbb' }}>
                            {pieceChar}
                          </span>
                        )}
                        {c === 0 && <span style={{ position: 'absolute', top: '2px', left: '2px', fontSize: '0.58rem', color: isLight ? '#b58863' : '#f0d9b5', fontWeight: 700, lineHeight: 1, userSelect: 'none' }}>{flipped ? r + 1 : 8 - r}</span>}
                        {r === 7 && <span style={{ position: 'absolute', bottom: '2px', right: '3px', fontSize: '0.58rem', color: isLight ? '#b58863' : '#f0d9b5', fontWeight: 700, lineHeight: 1, userSelect: 'none' }}>{String.fromCharCode(flipped ? 104 - c : 97 + c)}</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#3498db', fontSize: '0.75rem', fontFamily: 'monospace' }}>
              🎲 Chess960 — Position #{posNum}
            </div>
          </div>

          {/* Right panel */}
          <div className="side960" style={{ width: '185px', display: 'flex', flexDirection: 'column', gap: '0.7rem', paddingTop: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', color: '#9aa5b4', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Controls</div>
              <button className="ctrl-btn" onClick={() => setFlipped(f => !f)}>🔄 Flip Board</button>
              <button className="ctrl-btn" onClick={() => { workerRef.current?.terminate(); setPhase('setup') }} style={{ color: '#3498db', borderColor: 'rgba(52,152,219,0.2)' }}>⚙ New Setup</button>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
              <div style={{ fontFamily: 'var(--font-playfair)', color: '#9aa5b4', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Moves</div>
              <div ref={moveListRef} className="moves-s" style={{ flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {moveRows.map(row => (
                  <div key={row.n} style={{ display: 'flex', gap: '0.35rem', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#374151', width: '1.5rem', flexShrink: 0, fontSize: '0.72rem' }}>{row.n}.</span>
                    <span style={{ flex: 1, color: '#e8e0d0' }}>{row.w}</span>
                    <span style={{ flex: 1, color: '#9aa5b4' }}>{row.b || ''}</span>
                  </div>
                ))}
                {moveList.length === 0 && <span style={{ color: '#374151', fontStyle: 'italic', fontSize: '0.75rem' }}>No moves yet</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {phase === 'over' && gameResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,12,28,0.88)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0d1f3c', border: '1.5px solid rgba(52,152,219,0.4)', borderRadius: 16, padding: '2rem 2.5rem', textAlign: 'center', maxWidth: '340px', width: '90%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
              {gameResult.winner === 'player' ? '🏆' : gameResult.winner === 'bot' ? '🤖' : '🤝'}
            </div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#e8e0d0', fontSize: '1.5rem', margin: '0 0 0.4rem' }}>
              {gameResult.winner === 'player' ? 'You Win!' : gameResult.winner === 'bot' ? 'Bot Wins!' : "It's a Draw!"}
            </h2>
            <p style={{ color: '#9aa5b4', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>{gameResult.reason} — Chess960 #{posNum}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #5dade2 0%, #3498db 100%)', color: 'white', border: 'none', borderRadius: 8, padding: '0.85rem', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}>
                ▶ Play Again (same position)
              </button>
              <button onClick={() => { rollNewPosition(); setPhase('setup'); workerRef.current?.terminate() }} style={{ background: 'rgba(52,152,219,0.08)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 8, padding: '0.75rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                🎲 New Position
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
