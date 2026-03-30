'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'

const BOT_PERSONALITIES = [
  {
    id: 'rookie_rex',
    name: 'Rookie Rex',
    avatar: '🐣',
    title: 'Newbie',
    elo: 800,
    skill: 1,
    depth: 1,
    personality: 'Just started learning chess. Makes random mistakes!',
    catchphrase: 'I think I can, I think I can...',
    color: '#27ae60',
    style: 'Random',
  },
  {
    id: 'casual_charlie',
    name: 'Casual Charlie',
    avatar: '😊',
    title: 'Club Player',
    elo: 1000,
    skill: 5,
    depth: 3,
    personality: 'Plays for fun. Misses tactics occasionally.',
    catchphrase: 'Not bad, not bad at all!',
    color: '#3498db',
    style: 'Casual',
  },
  {
    id: 'tactical_tony',
    name: 'Tactical Tony',
    avatar: '🎯',
    title: 'Intermediate',
    elo: 1200,
    skill: 10,
    depth: 5,
    personality: 'Loves tactics. Will find your hanging pieces!',
    catchphrase: 'Did you just hang that piece?',
    color: '#f39c12',
    style: 'Tactical',
  },
  {
    id: 'positional_petra',
    name: 'Positional Petra',
    avatar: '♟️',
    title: 'Advanced',
    elo: 1500,
    skill: 15,
    depth: 8,
    personality: 'Plays slow, positional chess. Strangling you slowly.',
    catchphrase: 'Every pawn structure tells a story.',
    color: '#9b59b6',
    style: 'Positional',
  },
  {
    id: 'aggressive_alex',
    name: 'Aggressive Alex',
    avatar: '⚔️',
    title: 'Expert',
    elo: 1800,
    skill: 18,
    depth: 12,
    personality: 'Attacks relentlessly. King safety? Never heard of it.',
    catchphrase: 'The best defense is a good offense!',
    color: '#e74c3c',
    style: 'Aggressive',
  },
  {
    id: 'magnus_mind',
    name: 'Magnus Mind',
    avatar: '👑',
    title: 'Grandmaster',
    elo: 2200,
    skill: 20,
    depth: 20,
    personality: 'Near perfect play. Good luck, you will need it.',
    catchphrase: 'I see 20 moves ahead. Do you?',
    color: '#c9a84c',
    style: 'Universal',
  },
]

const BOT_REACTIONS = {
  rookie_rex:       { win: "I won?! Even I'm surprised! 😅", loss: "You beat me! I'll learn from this! 🐣", draw: "A draw! That's like winning for me! 😄" },
  casual_charlie:   { win: "Nice game! Better luck next time 😊", loss: "Well played! You got me this time!", draw: "A fair result! Want a rematch?" },
  tactical_tony:    { win: "Spotted every tactic! 🎯", loss: "You missed nothing! Impressive!", draw: "You held on! Good defense!" },
  positional_petra: { win: "Slowly but surely ♟️", loss: "Your position was impeccable!", draw: "Equal game, equal result!" },
  aggressive_alex:  { win: "ATTACK WINS AGAIN! ⚔️", loss: "Your king survived my assault!", draw: "I couldn't break through!" },
  magnus_mind:      { win: "As expected 👑", loss: "Extraordinary! You defeated me!", draw: "You managed to hold the draw!" },
}

const PIECE_MAP = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
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

export default function PlayBotPage() {
  const [phase, setPhase] = useState('select') // 'select' | 'game' | 'over'
  const [selectedBot, setSelectedBot] = useState(BOT_PERSONALITIES[2])
  const [colorChoice, setColorChoice] = useState('w') // 'w' | 'b' | 'r'
  const [playerColor, setPlayerColor] = useState('w')

  const chessRef = useRef(null)
  const workerRef = useRef(null)
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [selected, setSelected] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [botThinking, setBotThinking] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [moveList, setMoveList] = useState([])
  const [hintSq, setHintSq] = useState(null)
  const [promoState, setPromoState] = useState(null)
  const [gameResult, setGameResult] = useState(null)
  const [gamePgn, setGamePgn] = useState('')
  const [currentEval, setCurrentEval] = useState(0)
  const moveListRef = useRef(null)

  useEffect(() => {
    if (moveListRef.current) moveListRef.current.scrollTop = moveListRef.current.scrollHeight
  }, [moveList])

  useEffect(() => () => { workerRef.current?.terminate() }, [])

  function createWorker(bot) {
    try {
      const blob = new Blob(
        [`importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')`],
        { type: 'text/javascript' }
      )
      const w = new Worker(URL.createObjectURL(blob))
      w.postMessage('uci')
      w.postMessage('isready')
      w.postMessage(`setoption name Skill Level value ${bot.skill}`)
      return w
    } catch (e) {
      console.warn('Stockfish worker init failed:', e)
      return null
    }
  }

  function startGame() {
    const color = colorChoice === 'r' ? (Math.random() > 0.5 ? 'w' : 'b') : colorChoice
    setPlayerColor(color)
    setFlipped(color === 'b')

    const Chess = require('chess.js').Chess
    const chess = new Chess()
    chessRef.current = chess

    setFen(chess.fen())
    setSelected(null)
    setLegalTargets([])
    setLastMove(null)
    setMoveList([])
    setGameResult(null)
    setBotThinking(false)
    setHintSq(null)
    setPromoState(null)
    setGamePgn('')

    workerRef.current?.terminate()
    workerRef.current = createWorker(selectedBot)

    setPhase('game')

    if (color === 'b') {
      setTimeout(() => triggerBotMove(chess, selectedBot, color), 700)
    }
  }

  function triggerBotMove(chess, bot, pColor) {
    const w = workerRef.current
    if (!w) return
    setBotThinking(true)
    let responded = false
    w.onmessage = (e) => {
      const msg = e.data
      if (typeof msg === 'string') {
        if (msg.includes('score cp')) {
          const m = msg.match(/score cp (-?\d+)/)
          if (m) {
            const raw = parseInt(m[1]) / 100
            setCurrentEval(playerColor === 'w' ? raw : -raw)
          }
        }
        if (msg.includes('score mate')) {
          const m = msg.match(/score mate (-?\d+)/)
          if (m) {
            const raw = parseInt(m[1]) > 0 ? 99 : -99
            setCurrentEval(playerColor === 'w' ? raw : -raw)
          }
        }
      }
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
          checkGameOver(chess, pColor)
        } catch { setBotThinking(false) }
      }, 300)
    }
    w.postMessage(`position fen ${chess.fen()}`)
    w.postMessage(`go depth ${bot.depth} movetime 800`)
  }

  function handleSquareClick(sq) {
    const chess = chessRef.current
    if (!chess || botThinking || promoState || gameResult) return
    if (chess.turn() !== playerColor) return

    if (selected) {
      if (legalTargets.includes(sq)) {
        const piece = chess.get(selected)
        const isPromo = piece?.type === 'p' && (
          (playerColor === 'w' && sq[1] === '8') || (playerColor === 'b' && sq[1] === '1')
        )
        if (isPromo) {
          setPromoState({ from: selected, to: sq })
          setSelected(null); setLegalTargets([])
          return
        }
        doPlayerMove(selected, sq, undefined)
      } else if (chess.get(sq)?.color === playerColor) {
        const mvs = chess.moves({ square: sq, verbose: true })
        setSelected(sq); setLegalTargets(mvs.map(m => m.to))
      } else {
        setSelected(null); setLegalTargets([])
      }
    } else {
      if (chess.get(sq)?.color === playerColor) {
        const mvs = chess.moves({ square: sq, verbose: true })
        setSelected(sq); setLegalTargets(mvs.map(m => m.to))
      }
    }
  }

  function doPlayerMove(from, to, promo) {
    const chess = chessRef.current
    try {
      const mv = chess.move({ from, to, promotion: promo || undefined })
      if (!mv) return
      setFen(chess.fen())
      setLastMove({ from, to })
      setMoveList(h => [...h, mv.san])
      setSelected(null); setLegalTargets([]); setPromoState(null)
      if (checkGameOver(chess, playerColor)) return
      setTimeout(() => triggerBotMove(chess, selectedBot, playerColor), 200)
    } catch {
      setSelected(null); setLegalTargets([])
    }
  }

  function checkGameOver(chess, pColor) {
    const checkmate = chess.isCheckmate?.() || chess.in_checkmate?.()
    const draw = chess.isDraw?.() || chess.in_draw?.()
    if (checkmate) {
      const winner = chess.turn() === pColor ? 'bot' : 'player'
      setGameResult({ winner, reason: 'Checkmate' })
      setGamePgn(chess.pgn()); setPhase('over')
      return true
    }
    if (draw) {
      let reason = 'Draw'
      if (chess.isStalemate?.() || chess.in_stalemate?.()) reason = 'Stalemate'
      else if (chess.isThreefoldRepetition?.() || chess.in_threefold_repetition?.()) reason = 'Threefold Repetition'
      else if (chess.isInsufficientMaterial?.() || chess.insufficient_material?.()) reason = 'Insufficient Material'
      setGameResult({ winner: 'draw', reason })
      setGamePgn(chess.pgn()); setPhase('over')
      return true
    }
    return false
  }

  function handleUndo() {
    const chess = chessRef.current
    if (!chess || botThinking || moveList.length < 2) return
    chess.undo(); chess.undo()
    setFen(chess.fen())
    setMoveList(h => h.slice(0, -2))
    setLastMove(null); setSelected(null); setLegalTargets([])
  }

  function handleHint() {
    const w = workerRef.current
    const chess = chessRef.current
    if (!w || !chess || botThinking || chess.turn() !== playerColor) return
    let done = false
    const prev = w.onmessage
    w.onmessage = (e) => {
      const msg = e.data
      if (!msg.startsWith('bestmove') || done) return
      done = true; w.onmessage = prev
      const uci = msg.split(' ')[1]
      if (uci && uci !== '(none)') {
        setHintSq(uci.slice(0, 2))
        setTimeout(() => setHintSq(null), 2000)
      }
    }
    w.postMessage(`position fen ${chess.fen()}`)
    w.postMessage('go depth 5 movetime 400')
  }

  function handleResign() {
    setGamePgn(chessRef.current?.pgn() || '')
    setGameResult({ winner: 'bot', reason: 'Resignation' })
    setPhase('over')
  }

  function resetToSelect() {
    workerRef.current?.terminate(); workerRef.current = null
    setPhase('select')
  }

  // ─── SELECT SCREEN ─────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <>
        <style>{`
          .bot-card { background:rgba(255,255,255,0.04); border:1.5px solid rgba(255,255,255,0.1); border-radius:14px; padding:1.1rem; cursor:pointer; transition:all 0.15s; }
          .bot-card:hover { background:rgba(255,255,255,0.07); transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,0.3); }
          .bot-card.sel { border-color:#c9a84c; background:rgba(201,168,76,0.08); }
          .color-tab { flex:1; border-radius:8px; padding:0.7rem; cursor:pointer; transition:all 0.15s; background:rgba(255,255,255,0.04); border:2px solid transparent; font-family:var(--font-playfair),Georgia,serif; font-size:0.95rem; font-weight:700; color:#9aa5b4; }
          .color-tab.sel { border-color:#c9a84c; background:rgba(201,168,76,0.1); color:#c9a84c; }
          .color-tab:hover { background:rgba(255,255,255,0.07); }
          .style-badge { font-size:0.65rem; padding:0.12rem 0.4rem; border-radius:999px; font-weight:700; letter-spacing:0.04em; }
          @media (max-width: 640px) {
            .bot-grid { grid-template-columns: 1fr !important; }
            .bot-card { flex-direction: row !important; align-items: center !important; gap: 12px !important; padding: 12px !important; }
            .bot-card-avatar { font-size: 2rem !important; width: 48px !important; flex-shrink: 0 !important; }
            .bot-card-info { flex: 1 !important; text-align: left !important; }
            .color-buttons { flex-direction: column !important; }
            .color-btn { width: 100% !important; min-height: 48px !important; }
            .start-btn { width: 100% !important; min-height: 52px !important; }
            .game-board-area { flex-direction: column !important; }
            .play-bot-panels { display: none !important; }
          }
        `}</style>
        <div style={{ background:'#0a1628', minHeight:'100vh', fontFamily:'var(--font-crimson),Georgia,serif' }}>
          <Navbar />
          <div style={{ maxWidth:'720px', margin:'0 auto', padding:'2.5rem 1rem' }}>
            <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
              <div style={{ fontSize:'4rem', lineHeight:1, marginBottom:'0.75rem' }}>♟</div>
              <h1 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'2.2rem', color:'#e8e0d0', margin:'0 0 0.5rem', fontWeight:700 }}>
                Choose Your Opponent
              </h1>
              <p style={{ color:'#4a5568', margin:0, fontSize:'0.9rem' }}>
                Powered by Stockfish — runs entirely in your browser
              </p>
            </div>

            {/* Bot personality grid */}
            <div style={{ marginBottom:'2rem' }}>
              <div style={{ fontFamily:'var(--font-playfair)', color:'#9aa5b4', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>
                Select Opponent
              </div>
              <div className="bot-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                {BOT_PERSONALITIES.map(bot => (
                  <div key={bot.id}
                    className={`bot-card${selectedBot.id === bot.id ? ' sel' : ''}`}
                    onClick={() => setSelectedBot(bot)}
                    style={selectedBot.id === bot.id ? { borderLeftColor: bot.color, borderLeftWidth: '3px' } : {}}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
                      <span style={{ fontSize:'2.5rem', lineHeight:1 }}>{bot.avatar}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
                          <span style={{ fontWeight:700, color:'#e8e0d0', fontSize:'0.95rem' }}>{bot.name}</span>
                          <span className="style-badge" style={{ background:`${bot.color}22`, color:bot.color, border:`1px solid ${bot.color}44` }}>{bot.style}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.1rem' }}>
                          <span style={{ fontSize:'0.72rem', color:'#9aa5b4', background:'rgba(255,255,255,0.06)', padding:'0.1rem 0.4rem', borderRadius:4 }}>{bot.title}</span>
                          <span style={{ fontSize:'0.72rem', color:'#c9a84c', fontWeight:700 }}>{bot.elo} Elo</span>
                        </div>
                      </div>
                    </div>
                    <p style={{ fontSize:'0.76rem', color:'#4a5568', margin:'0 0 0.4rem', fontStyle:'italic', lineHeight:1.4 }}>{bot.personality}</p>
                    <p style={{ fontSize:'0.74rem', color:'#6b7a8d', margin:0, fontStyle:'italic' }}>"{bot.catchphrase}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Color choice */}
            <div style={{ marginBottom:'2.5rem' }}>
              <div style={{ fontFamily:'var(--font-playfair)', color:'#9aa5b4', fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem' }}>
                Play As
              </div>
              <div style={{ display:'flex', gap:'0.6rem' }}>
                {[['w','♔ White'],['b','♚ Black'],['r','⚄ Random']].map(([v, l]) => (
                  <button key={v} className={`color-tab${colorChoice === v ? ' sel' : ''}`} onClick={() => setColorChoice(v)}>{l}</button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              style={{ width:'100%', background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'10px', padding:'1rem', fontSize:'1.05rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif', boxShadow:'0 4px 20px rgba(201,168,76,0.35)', transition:'filter 0.2s,transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.1)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.filter=''; e.currentTarget.style.transform='' }}
            >
              ▶ Play vs {selectedBot.name}
            </button>
          </div>
        </div>
      </>
    )
  }

  // ─── GAME SCREEN ───────────────────────────────────────────────
  const board = fenToBoard(fen)
  const chess = chessRef.current
  const currentTurn = chess?.turn() || 'w'
  const inCheck = chess?.inCheck?.() || chess?.in_check?.() || false

  const moveRows = moveList.reduce((rows, m, i) => {
    if (i % 2 === 0) rows.push({ n: Math.floor(i / 2) + 1, w: m, b: undefined })
    else rows[rows.length - 1].b = m
    return rows
  }, [])

  const reaction = gameResult ? BOT_REACTIONS[selectedBot.id]?.[
    gameResult.winner === 'player' ? 'loss' : gameResult.winner === 'bot' ? 'win' : 'draw'
  ] : null

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes hint-pulse { 0%,100%{outline-color:rgba(201,168,76,0.9)} 50%{outline-color:rgba(201,168,76,0.1)} }
        @keyframes dot-blink { 0%,100%{opacity:0.2} 50%{opacity:1} }
        .bsq { width:60px;height:60px;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;user-select:none;box-sizing:border-box;flex-shrink:0; }
        .bsq.hint-sq { animation:hint-pulse 0.55s ease-in-out 3; }
        .ctrl-btn { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:0.5rem 0.85rem; color:#9aa5b4; font-size:0.82rem; cursor:pointer; transition:all 0.15s; font-family:var(--font-crimson),Georgia,serif; text-align:left; width:100%; }
        .ctrl-btn:hover:not([disabled]) { background:rgba(255,255,255,0.09); color:#e8e0d0; }
        .ctrl-btn[disabled] { opacity:0.35;cursor:not-allowed; }
        .thinking-dot { width:5px;height:5px;border-radius:50%;background:#c9a84c;display:inline-block; }
        .thinking-dot:nth-child(1){animation:dot-blink 1s ease-in-out 0s infinite}
        .thinking-dot:nth-child(2){animation:dot-blink 1s ease-in-out 0.33s infinite}
        .thinking-dot:nth-child(3){animation:dot-blink 1s ease-in-out 0.66s infinite}
        .moves-s::-webkit-scrollbar{width:4px}
        .moves-s::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
        @media(max-width:620px){
          .bsq{width:44px!important;height:44px!important;}
          .piece-g{font-size:1.55rem!important;}
          .side-l,.side-r{display:none!important;}
          .bot-eval-bar{display:none!important;}
        }
      `}</style>

      <div style={{ background:'#0a1628', minHeight:'100vh', fontFamily:'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth:'1080px', margin:'0 auto', padding:'1rem 1rem', display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', alignItems:'flex-start' }}>

          {/* Left panel — bot/player info */}
          <div className="side-l" style={{ width:'155px', display:'flex', flexDirection:'column', gap:'0.7rem', paddingTop:'0.5rem' }}>
            {/* Bot card */}
            <div style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${selectedBot.color}44`, borderRadius:'12px', padding:'1rem', textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', lineHeight:1, marginBottom:'0.4rem' }}>{selectedBot.avatar}</div>
              <div style={{ fontFamily:'var(--font-playfair)', color:'#e8e0d0', fontWeight:700, fontSize:'0.9rem', marginBottom:'0.15rem' }}>{selectedBot.name}</div>
              <div style={{ fontSize:'0.7rem', color:selectedBot.color, background:`${selectedBot.color}22`, border:`1px solid ${selectedBot.color}44`, padding:'0.1rem 0.4rem', borderRadius:999, display:'inline-block', marginBottom:'0.25rem' }}>{selectedBot.style}</div>
              <div style={{ fontSize:'0.72rem', color:'#c9a84c', marginBottom:'0.15rem' }}>{selectedBot.elo} Elo</div>
              {botThinking ? (
                <div style={{ marginTop:'0.4rem' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'3px', marginBottom:'0.3rem' }}>
                    <span style={{ fontSize:'0.68rem', color:'#9aa5b4', marginRight:'2px' }}>Thinking</span>
                    <span className="thinking-dot"/><span className="thinking-dot"/><span className="thinking-dot"/>
                  </div>
                  <div style={{ fontSize:'0.65rem', color:'#4a5568', fontStyle:'italic', padding:'0 0.3rem', lineHeight:1.4 }}>"{selectedBot.catchphrase}"</div>
                </div>
              ) : (
                <div style={{ fontSize:'0.7rem', color: currentTurn !== playerColor ? '#22c55e' : '#4a5568', marginTop:'0.3rem' }}>
                  {currentTurn !== playerColor ? '● Turn' : '○ Waiting'}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div style={{ flex:1 }} />

            {/* Player card */}
            <div style={{ background:'rgba(201,168,76,0.06)', border:'1.5px solid rgba(201,168,76,0.25)', borderRadius:'12px', padding:'1rem', textAlign:'center' }}>
              <div style={{ fontSize:'2rem', lineHeight:1, marginBottom:'0.4rem' }}>{playerColor === 'w' ? '♔' : '♚'}</div>
              <div style={{ fontFamily:'var(--font-playfair)', color:'#e8e0d0', fontWeight:700, fontSize:'0.9rem', marginBottom:'0.2rem' }}>You</div>
              <div style={{ fontSize:'0.72rem', color:'#c9a84c', marginBottom:'0.2rem' }}>{playerColor === 'w' ? 'White' : 'Black'}</div>
              <div style={{ fontSize:'0.7rem', color: currentTurn === playerColor ? '#22c55e' : '#4a5568' }}>
                {currentTurn === playerColor ? '● Your Turn' : '○ Waiting'}
              </div>
            </div>
          </div>

          {/* Board + eval bar */}
          <div style={{ display:'flex', gap:'6px', alignItems:'stretch', flexShrink:0 }}>
          {/* Eval bar */}
          <div className="bot-eval-bar" style={{ width:20, background:'#1a1a2e', borderRadius:4, overflow:'hidden', position:'relative', minHeight:480, flexShrink:0 }}>
            {(() => {
              const clamped = Math.max(-10, Math.min(10, currentEval))
              const whitePct = Math.round((clamped + 10) / 20 * 100)
              return (<>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:`${100-whitePct}%`, background:'#3a3a4a', transition:'height 0.5s ease' }} />
                <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${whitePct}%`, background:'#f0d9b5', transition:'height 0.5s ease' }} />
                <div style={{ position:'absolute', bottom: whitePct>50?4:'auto', top: whitePct<=50?4:'auto', left:0, right:0, textAlign:'center', fontSize:'0.48rem', fontWeight:'bold', color: whitePct>50?'#333':'#e8e0d0', writingMode:'vertical-rl', transform:'rotate(180deg)', lineHeight:'20px', overflow:'hidden' }}>
                  {Math.abs(currentEval)>=99 ? (currentEval>0?'M+':'M-') : (currentEval>0?`+${currentEval.toFixed(1)}`:currentEval.toFixed(1))}
                </div>
              </>)
            })()}
          </div>
          <div style={{ position:'relative', flexShrink:0 }}>
            {/* Promotion modal */}
            {promoState && (
              <div style={{ position:'absolute', inset:0, background:'rgba(5,12,28,0.92)', zIndex:20, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'4px' }}>
                <div style={{ background:'#0d1f3c', border:'1.5px solid rgba(201,168,76,0.5)', borderRadius:'12px', padding:'1.5rem', textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--font-playfair)', color:'#e8e0d0', fontWeight:700, marginBottom:'1rem', fontSize:'0.95rem' }}>Promote Pawn To:</div>
                  <div style={{ display:'flex', gap:'0.6rem' }}>
                    {['q','r','b','n'].map(p => (
                      <button key={p} onClick={() => doPlayerMove(promoState.from, promoState.to, p)}
                        style={{ background:'rgba(201,168,76,0.1)', border:'1.5px solid rgba(201,168,76,0.4)', borderRadius:'8px', padding:'0.5rem 0.6rem', fontSize:'2.2rem', cursor:'pointer', lineHeight:1, transition:'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(201,168,76,0.22)'}
                        onMouseLeave={e => e.currentTarget.style.background='rgba(201,168,76,0.1)'}>
                        {PIECE_MAP[playerColor + p.toUpperCase()]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chess board */}
            <div style={{ border:'2.5px solid rgba(201,168,76,0.4)', borderRadius:'3px', overflow:'hidden', boxShadow:'0 8px 40px rgba(0,0,0,0.5)', display:'inline-block' }}>
              {Array.from({ length: 8 }, (_, r) => (
                <div key={r} style={{ display:'flex' }}>
                  {Array.from({ length: 8 }, (_, c) => {
                    const sq = coordToSq(r, c, flipped)
                    const boardRow = flipped ? 7 - r : r
                    const boardCol = flipped ? 7 - c : c
                    const cell = board[boardRow]?.[boardCol]
                    const isLight = (r + c) % 2 === 0
                    const isSel = selected === sq
                    const isLegal = legalTargets.includes(sq)
                    const isHint = hintSq === sq
                    const isLastFrom = lastMove?.from === sq
                    const isLastTo = lastMove?.to === sq
                    const isKingCheck = inCheck && cell?.p === 'K' && cell?.c === currentTurn
                    const hasPiece = !!cell?.p

                    let bg = isLight ? '#f0d9b5' : '#b58863'
                    if (isLastFrom || isLastTo) bg = isLight ? '#cdd26a' : '#aaa23a'
                    if (isSel) bg = '#7fc97f'
                    if (isKingCheck) bg = '#e74c3c'

                    const pieceKey = cell?.p && cell?.c ? cell.c + cell.p : null
                    const pieceChar = pieceKey ? PIECE_MAP[pieceKey] : null

                    return (
                      <div key={c} className={`bsq${isHint ? ' hint-sq' : ''}`}
                        onClick={() => handleSquareClick(sq)}
                        style={{ background: bg, outline: isHint ? '3px solid rgba(201,168,76,0.9)' : 'none', outlineOffset: '-3px' }}>
                        {isLegal && (
                          <div style={{ position:'absolute', width: hasPiece ? '88%' : '32%', height: hasPiece ? '88%' : '32%', borderRadius:'50%', background: hasPiece ? 'transparent' : 'rgba(0,0,0,0.22)', border: hasPiece ? '3px solid rgba(0,0,0,0.28)' : 'none', zIndex:1, pointerEvents:'none' }} />
                        )}
                        {pieceChar && (
                          <span className="piece-g" style={{ fontSize:'2.1rem', lineHeight:1, zIndex:2, position:'relative', filter:'drop-shadow(1px 2px 2px rgba(0,0,0,0.45))', color: cell?.c === 'w' ? '#fff' : '#1a1008', WebkitTextStroke: cell?.c === 'w' ? '0.5px #555' : '0.5px #bbb' }}>
                            {pieceChar}
                          </span>
                        )}
                        {c === 0 && <span style={{ position:'absolute', top:'2px', left:'2px', fontSize:'0.58rem', color: isLight ? '#b58863' : '#f0d9b5', fontWeight:700, lineHeight:1, userSelect:'none' }}>{flipped ? r + 1 : 8 - r}</span>}
                        {r === 7 && <span style={{ position:'absolute', bottom:'2px', right:'3px', fontSize:'0.58rem', color: isLight ? '#b58863' : '#f0d9b5', fontWeight:700, lineHeight:1, userSelect:'none' }}>{String.fromCharCode(flipped ? 104 - c : 97 + c)}</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          </div>{/* end board+eval wrapper */}

          {/* Right panel — controls + moves */}
          <div className="side-r" style={{ width:'185px', display:'flex', flexDirection:'column', gap:'0.7rem', paddingTop:'0.5rem' }}>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'0.75rem', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              <div style={{ fontFamily:'var(--font-playfair)', color:'#9aa5b4', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Controls</div>
              <button className="ctrl-btn" onClick={() => setFlipped(f => !f)}>🔄 Flip Board</button>
              <button className="ctrl-btn" onClick={handleUndo} disabled={moveList.length < 2 || botThinking}>↩ Undo Move</button>
              <button className="ctrl-btn" onClick={handleHint} disabled={botThinking || currentTurn !== playerColor}>💡 Hint</button>
              <button className="ctrl-btn" onClick={handleResign} style={{ color:'#ef4444', borderColor:'rgba(239,68,68,0.2)' }}>🏳 Resign</button>
              <button className="ctrl-btn" onClick={resetToSelect} style={{ marginTop:'0.2rem', borderColor:'rgba(201,168,76,0.2)', color:'#c9a84c' }}>⚙ New Game</button>
            </div>

            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'0.75rem', flex:1, display:'flex', flexDirection:'column', minHeight:'240px' }}>
              <div style={{ fontFamily:'var(--font-playfair)', color:'#9aa5b4', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.5rem' }}>Moves</div>
              <div ref={moveListRef} className="moves-s" style={{ flex:1, overflowY:'auto', fontFamily:'monospace', fontSize:'0.8rem' }}>
                {moveRows.map(row => (
                  <div key={row.n} style={{ display:'flex', gap:'0.35rem', padding:'0.2rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color:'#374151', width:'1.5rem', flexShrink:0, fontSize:'0.72rem' }}>{row.n}.</span>
                    <span style={{ flex:1, color:'#e8e0d0' }}>{row.w}</span>
                    <span style={{ flex:1, color:'#9aa5b4' }}>{row.b || ''}</span>
                  </div>
                ))}
                {moveList.length === 0 && <span style={{ color:'#374151', fontStyle:'italic', fontSize:'0.75rem' }}>No moves yet</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game over overlay */}
      {phase === 'over' && gameResult && (
        <div style={{ position:'fixed', inset:0, background:'rgba(5,12,28,0.88)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#0d1f3c', border:'1.5px solid rgba(201,168,76,0.4)', borderRadius:'16px', padding:'2rem 2.5rem', textAlign:'center', maxWidth:'380px', width:'90%', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:'0.5rem', lineHeight:1 }}>
              {gameResult.winner === 'player' ? '🏆' : gameResult.winner === 'bot' ? selectedBot.avatar : '🤝'}
            </div>
            <h2 style={{ fontFamily:'var(--font-playfair)', color:'#e8e0d0', fontSize:'1.6rem', margin:'0 0 0.3rem', fontWeight:700 }}>
              {gameResult.winner === 'player' ? 'You Win!' : gameResult.winner === 'bot' ? `${selectedBot.name} Wins!` : "It's a Draw!"}
            </h2>
            <p style={{ color:'#9aa5b4', fontSize:'0.9rem', margin:'0 0 0.25rem' }}>{gameResult.reason}</p>
            {reaction && (
              <p style={{ color:selectedBot.color, fontSize:'0.82rem', fontStyle:'italic', margin:'0.3rem 0 0.25rem', padding:'0.5rem', background:`${selectedBot.color}11`, border:`1px solid ${selectedBot.color}33`, borderRadius:8 }}>
                {selectedBot.name}: &ldquo;{reaction}&rdquo;
              </p>
            )}
            <p style={{ color:'#4a5568', fontSize:'0.78rem', margin:'0.25rem 0 1.75rem' }}>{moveList.length} moves · vs {selectedBot.name}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
              <button onClick={startGame}
                style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.85rem', fontSize:'0.95rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair)' }}>
                ▶ Play Again
              </button>
              <button onClick={resetToSelect}
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'#9aa5b4', borderRadius:'8px', padding:'0.75rem', fontSize:'0.88rem', cursor:'pointer', fontFamily:'var(--font-crimson)' }}>
                ⚙ Choose Different Opponent
              </button>
              {gamePgn && (
                <button onClick={() => { try { localStorage.setItem('bot_game_pgn', gamePgn) } catch {} window.alert('PGN saved to local storage!') }}
                  style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa', borderRadius:'8px', padding:'0.75rem', fontSize:'0.88rem', cursor:'pointer', fontFamily:'var(--font-crimson)' }}>
                  📊 Save PGN
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
