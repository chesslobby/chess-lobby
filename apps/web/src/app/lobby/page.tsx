'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { getUser, clearAuth, isLoggedIn } from '@/lib/api'
import { getSocket } from '@/lib/socket'

const TIME_CONTROLS = [
  { emoji: '⚡', time: '1 min',  mode: 'Bullet', seconds: 60  },
  { emoji: '🔥', time: '3 min',  mode: 'Blitz',  seconds: 180 },
  { emoji: '⚡', time: '5 min',  mode: 'Blitz',  seconds: 300 },
  { emoji: '📚', time: '10 min', mode: 'Rapid',  seconds: 600 },
]

type ChatMsg = { user: string; text: string; time: string; isSystem: boolean }
const INITIAL_MSGS: ChatMsg[] = [
  { user: 'Magnus_C',   text: 'GG everyone! Great games today',          time: '2m ago',   isSystem: false },
  { user: 'BlitzQueen', text: 'Anyone up for a 3+0 game?',               time: '1m ago',   isSystem: false },
  { user: 'System',     text: 'GrandMaster99 just won a Rapid game! 🏆', time: 'just now', isSystem: true  },
]

function formatSearchTime(sec: number): string {
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
}

export default function LobbyPage() {
  const [user, setUser]         = useState<any>(null)
  const [mounted, setMounted]   = useState(false)

  // Quick Play
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [searching, setSearching]       = useState(false)
  const [searchSec, setSearchSec]       = useState(0)
  const [statusMsg, setStatusMsg]       = useState('')

  // Private Room
  const [generatedCode, setGeneratedCode] = useState('')
  const [joinCode, setJoinCode]           = useState('')
  const [joinFocused, setJoinFocused]     = useState(false)
  const [copied, setCopied]               = useState(false)

  // Online count
  const [onlineCount, setOnlineCount] = useState<number | null>(null)

  // Live games
  const [liveGames, setLiveGames]     = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  // Chat
  const [chatInput, setChatInput]   = useState('')
  const [chatFocused, setChatFocused] = useState(false)
  const [messages, setMessages]     = useState<ChatMsg[]>(INITIAL_MSGS)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Quick Access / Puzzle teaser
  const [puzzleStreak, setPuzzleStreak] = useState(0)

  // Friends online (mock)
  const [friendsOnline] = useState([
    { username: 'Magnus_C',   elo: 2200, status: 'In a game',    online: true  },
    { username: 'BlitzQueen', elo: 1830, status: 'In lobby',     online: true  },
    { username: 'TactixKing', elo: 1760, status: 'Playing puzzle', online: true },
    { username: 'RookEnder',  elo: 1620, status: 'Last seen 2h ago', online: false },
  ])

  // ── Mount + auth ─────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn()) { window.location.href = '/login'; return }
    setUser(getUser())
    try {
      const s = parseInt(localStorage.getItem('puzzle_streak') || '0', 10)
      setPuzzleStreak(isNaN(s) ? 0 : s)
    } catch {}
    setTimeout(() => setPageLoading(false), 600)
  }, [])

  // ── Search timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!searching) { setSearchSec(0); return }
    const id = setInterval(() => setSearchSec(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [searching])

  // ── Live games fetch ──────────────────────────────────────────
  useEffect(() => {
    async function fetchLiveGames() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/games/live`)
        const data = await res.json()
        setLiveGames(data.games || [])
      } catch {}
    }
    fetchLiveGames()
    const interval = setInterval(fetchLiveGames, 15000)
    return () => clearInterval(interval)
  }, [])

  // ── Chat auto-scroll ──────────────────────────────────────────
  useEffect(() => {
    if (chatScrollRef.current)
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [messages])

  // ── Socket events ─────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()

    socket.on('match:found', ({ gameId, color, opponent, timeControl }: any) => {
      setSearching(false)
      localStorage.setItem('current_game', JSON.stringify({ gameId, color, opponent, timeControl }))
      window.location.href = '/game'
    })

    socket.on('queue:waiting', ({ position }: any) => {
      setStatusMsg(`In queue — position ${position}`)
    })

    socket.on('room:created', ({ code }: any) => {
      setGeneratedCode(code)
      setStatusMsg('Room created! Share the code with your friend.')
    })

    socket.on('room:joined', ({ gameId, color, opponent, timeControl }: any) => {
      localStorage.setItem('current_game', JSON.stringify({ gameId, color, opponent, timeControl }))
      window.location.href = '/game'
    })

    socket.on('room:error', ({ message }: any) => {
      setStatusMsg('Error: ' + message)
    })

    socket.on('lobby:online-count', (count: number) => {
      setOnlineCount(count)
    })

    socket.on('lobby:chat:receive', ({ senderName, message }: any) => {
      const now = new Date()
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
      setMessages(prev => [...prev, { user: senderName, text: message, time: timeStr, isSystem: false }])
    })

    return () => {
      ['match:found','queue:waiting','room:created','room:joined','room:error','lobby:online-count','lobby:chat:receive']
        .forEach(ev => socket.off(ev))
    }
  }, [])

  if (!mounted) return null

  if (pageLoading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a1628', gap:'1rem' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width:'44px', height:'44px', border:'3px solid rgba(201,168,76,0.2)', borderTopColor:'#c9a84c', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <span style={{ color:'#c9a84c', fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1rem', letterSpacing:'0.05em' }}>Connecting to Chess Lobby...</span>
      </div>
    )
  }

  // ── Handlers ──────────────────────────────────────────────────
  function handleQuickPlay(seconds: number) {
    const socket = getSocket()
    setSelectedTime(seconds)
    setSearching(true)
    setStatusMsg('Searching for opponent...')
    socket.emit('queue:join', { timeControl: seconds, eloRating: user?.eloRating || 1200 })
  }

  function handleCancelSearch() {
    getSocket().emit('queue:leave')
    setSearching(false)
    setStatusMsg('')
  }

  function handleCreateRoom() {
    getSocket().emit('room:create', { timeControl: selectedTime || 600, eloRating: user?.eloRating || 1200 })
  }

  function handleJoinRoom() {
    if (!joinCode.trim()) return
    getSocket().emit('room:join', { code: joinCode.trim().toUpperCase(), eloRating: user?.eloRating || 1200 })
  }

  function copyCode() {
    if (!generatedCode) return
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  function handleSendChat() {
    if (!chatInput.trim()) return
    const socket = getSocket()
    socket.emit('lobby:chat:send', { message: chatInput.trim() })
    const now = new Date()
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
    setMessages(prev => [...prev, { user: user?.username || 'Guest', text: chatInput.trim(), time: timeStr, isSystem: false }])
    setChatInput('')
    setShowEmojiPicker(false)
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(201,168,76,0.25);
          border-radius: 8px; padding: 0.85rem 1rem;
          color: #e8e0d0; font-size: 0.97rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-field::placeholder { color: #4a5568; }
        .input-field.focused {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
        }
        .time-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 12px; padding: 1.2rem;
          cursor: pointer; transition: all 0.2s;
          text-align: center; user-select: none;
          position: relative; overflow: hidden;
        }
        .time-card:hover { border-color: #c9a84c; background: rgba(201,168,76,0.08); box-shadow: 0 0 12px rgba(201,168,76,0.2); }
        .time-card.selected { border-color: #c9a84c; background: rgba(201,168,76,0.08); box-shadow: 0 0 12px rgba(201,168,76,0.2); }
        @keyframes pulse-bg { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        .searching-pulse { animation: pulse-bg 1.4s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; display: inline-block; }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .puzzle-teaser {
          background: rgba(201,168,76,0.05);
          border: 1px solid rgba(201,168,76,0.25);
          border-left: 3px solid #c9a84c;
          border-radius: 10px;
          padding: 0.85rem 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .puzzle-teaser:hover { background: rgba(201,168,76,0.09); transform: translateY(-1px); }
        .quick-row {
          display: flex;
          gap: 0.6rem;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
          scrollbar-color: rgba(201,168,76,0.2) transparent;
        }
        .quick-row::-webkit-scrollbar { height: 4px; }
        .quick-row::-webkit-scrollbar-track { background: transparent; }
        .quick-row::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        .bot-play-link {
          display: block; width: 100%; margin-top: 0.5rem;
          background: rgba(52,152,219,0.08); color: #3498db;
          border: 1.5px solid rgba(52,152,219,0.4); border-radius: 8px;
          padding: 0.75rem; font-size: 0.92rem; font-weight: 700;
          font-family: var(--font-playfair),Georgia,serif;
          text-decoration: none; text-align: center; box-sizing: border-box;
          transition: all 0.2s;
        }
        .bot-play-link:hover { background: rgba(52,152,219,0.15); border-color: rgba(52,152,219,0.7); }
        .qcard {
          flex-shrink: 0;
          width: 155px;
          background: #111e35;
          border-radius: 10px;
          padding: 0.7rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          cursor: pointer;
        }
        .qcard:hover { background: #172540; transform: translateY(-2px); }
        @media (max-width: 768px) {
          .lobby-main { flex-direction: column !important; padding: 1rem !important; gap: 1rem !important; }
          .lobby-left { min-width: 0 !important; }
          .lobby-right { min-height: 320px !important; }
          .time-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .lobby-grid { grid-template-columns: 1fr !important; }
          .quick-access-row { display: flex !important; gap: 10px !important; overflow-x: auto !important; padding-bottom: 8px !important; scrollbar-width: none !important; flex-wrap: nowrap !important; }
          .quick-access-row::-webkit-scrollbar { display: none !important; }
          .quick-access-card { min-width: 110px !important; flex-shrink: 0 !important; }
          .lobby-chat { max-height: 300px !important; }
          .live-games-list { overflow-x: auto !important; }
          .friends-list { display: flex !important; overflow-x: auto !important; gap: 12px !important; padding-bottom: 6px !important; }
        }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', backgroundColor:'#0a1628', minHeight:'100vh', fontFamily:'var(--font-crimson),Georgia,serif' }}>

        {/* NAVBAR */}
        <div style={{ height:'56px', background:'rgba(10,22,40,0.97)', borderBottom:'1px solid rgba(201,168,76,0.2)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.5rem', zIndex:100, position:'sticky', top:0, boxSizing:'border-box', flexShrink:0 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', textDecoration:'none', gap:'0.4rem' }}>
            <span style={{ fontSize:'1.4rem', color:'#c9a84c' }}>♛</span>
            <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.1rem', color:'#c9a84c', letterSpacing:'0.05em', marginLeft:'0.5rem' }}>Chess Lobby</span>
          </Link>

          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            {/* Online count */}
            {onlineCount !== null && (
              <span style={{ fontSize:'0.8rem', color:'#22c55e', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
                {onlineCount} online
              </span>
            )}
            <span style={{ fontSize:'0.88rem', color:'#9aa5b4' }}>
              {user?.username || 'Guest'}&nbsp;|&nbsp;♟ {user?.eloRating || 1200} Elo
            </span>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(201,168,76,0.2)', border:'1px solid #c9a84c', display:'flex', alignItems:'center', justifyContent:'center', color:'#c9a84c', fontSize:'0.85rem' }}>
              {(user?.username?.[0] || 'G').toUpperCase()}
            </div>
            <button onClick={() => { clearAuth(); window.location.href = '/' }}
              style={{ background:'transparent', border:'1px solid rgba(201,168,76,0.3)', color:'#4a5568', padding:'0.3rem 0.75rem', borderRadius:'6px', fontSize:'0.8rem', cursor:'pointer', transition:'all 0.2s', fontFamily:'var(--font-crimson),Georgia,serif' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c9a84c'; (e.currentTarget as HTMLElement).style.borderColor = '#c9a84c' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a5568'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)' }}
            >Log out</button>
          </div>
        </div>

        {/* MAIN */}
        <div className="lobby-main lobby-grid" style={{ flex:1, display:'flex', gap:'1.5rem', padding:'1.5rem', maxWidth:'1400px', width:'100%', margin:'0 auto', boxSizing:'border-box' }}>

          {/* LEFT COLUMN */}
          <div className="lobby-left" style={{ flex:1.5, display:'flex', flexDirection:'column', gap:'1.5rem', minWidth:0 }}>

            {/* Daily Puzzle Teaser */}
            <Link href="/puzzles" className="puzzle-teaser">
              <span style={{ fontSize:'1.7rem', lineHeight:1, flexShrink:0 }}>🧩</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', color:'#e8e0d0', fontWeight:700, fontSize:'0.92rem' }}>Daily Puzzle</span>
                  <span style={{ fontSize:'0.72rem', color:'#9aa5b4' }}>
                    {new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                  </span>
                  {puzzleStreak > 0 && (
                    <span style={{ fontSize:'0.7rem', background:'rgba(239,115,22,0.15)', border:'1px solid rgba(239,115,22,0.35)', color:'#f97316', padding:'0.05rem 0.45rem', borderRadius:999, fontWeight:600 }}>
                      🔥 {puzzleStreak} day streak
                    </span>
                  )}
                </div>
                <div style={{ fontSize:'0.78rem', color:'#4a5568', marginTop:'0.15rem' }}>⭐⭐ Medium &nbsp;·&nbsp; Sharpen your tactics</div>
              </div>
              <span style={{ color:'#c9a84c', fontWeight:700, fontSize:'0.85rem', whiteSpace:'nowrap', flexShrink:0 }}>Solve Now →</span>
            </Link>

            {/* Quick Play */}
            <div>
              <div style={{ borderLeft:'3px solid #c9a84c', paddingLeft:'0.75rem', marginBottom:'0.75rem' }}>
                <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.2rem', color:'#e8e0d0', margin:0 }}>Quick Play</h2>
              </div>

              <div className="time-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                {TIME_CONTROLS.map(tc => {
                  const isSel = selectedTime === tc.seconds
                  return (
                    <div key={tc.seconds} className={`time-card${isSel ? ' selected' : ''}`}
                      onClick={() => !searching && handleQuickPlay(tc.seconds)}
                      style={{ opacity: searching && !isSel ? 0.45 : 1 }}
                    >
                      {isSel && searching && <div className="searching-pulse" style={{ position:'absolute', inset:0, background:'rgba(201,168,76,0.06)', borderRadius:'12px' }} />}
                      <span style={{ fontSize:'1.8rem' }}>{tc.emoji}</span>
                      <span style={{ fontSize:'1.1rem', fontWeight:700, color:'#e8e0d0', display:'block', marginTop:'0.3rem' }}>{tc.time}</span>
                      <span style={{ fontSize:'0.8rem', color:'#4a5568', display:'block', marginTop:'0.2rem' }}>
                        {isSel && searching
                          ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem' }}>
                              <span className="spinner" style={{ fontSize:'0.75rem' }}>⏳</span>
                              {formatSearchTime(searchSec)}
                            </span>
                          : tc.mode
                        }
                      </span>
                    </div>
                  )
                })}
              </div>

              {statusMsg && <p style={{ color:'#c9a84c', fontSize:'0.88rem', margin:'0.6rem 0 0', letterSpacing:'0.02em' }}>{statusMsg}</p>}

              {searching ? (
                <button onClick={handleCancelSearch} style={{ width:'100%', marginTop:'0.75rem', background:'transparent', color:'#ef4444', border:'1.5px solid rgba(239,68,68,0.5)', borderRadius:'8px', padding:'0.9rem', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif' }}>
                  ✕ Cancel Search
                </button>
              ) : (
                <button onClick={() => selectedTime !== null && handleQuickPlay(selectedTime)} disabled={selectedTime === null}
                  style={{ width:'100%', marginTop:'0.75rem', background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.9rem', fontSize:'1rem', fontWeight:700, cursor: selectedTime !== null ? 'pointer' : 'not-allowed', opacity: selectedTime !== null ? 1 : 0.5, fontFamily:'var(--font-playfair),Georgia,serif', boxShadow: selectedTime !== null ? '0 4px 20px rgba(201,168,76,0.35)' : 'none' }}>
                  Find Match
                </button>
              )}

              {/* Play vs Computer shortcut */}
              <Link href="/play-bot" className="bot-play-link">
                🤖 vs Computer
              </Link>
            </div>

            {/* Private Room */}
            <div>
              <div style={{ borderLeft:'3px solid #c9a84c', paddingLeft:'0.75rem', marginBottom:'0.75rem' }}>
                <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.2rem', color:'#e8e0d0', margin:0 }}>Private Room</h2>
              </div>
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px', padding:'1.25rem' }}>

                <div style={{ display:'flex', alignItems:'center', marginBottom:'0.75rem', gap:'0.75rem' }}>
                  <button onClick={handleCreateRoom} style={{ background:'linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%)', color:'#0a1628', border:'none', borderRadius:'8px', padding:'0.7rem 1.5rem', fontSize:'0.92rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif', boxShadow:'0 3px 14px rgba(201,168,76,0.3)' }}>
                    Create Room
                  </button>
                </div>

                {/* Generated room code */}
                {generatedCode && (
                  <div style={{ marginBottom:'0.75rem', padding:'1rem', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.4)', borderRadius:'10px', textAlign:'center', position:'relative' }}>
                    <p style={{ fontSize:'0.72rem', color:'#9aa5b4', margin:'0 0 0.5rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>Share this code with your friend</p>
                    <div style={{ fontFamily:'monospace', fontSize:'2.5rem', letterSpacing:'0.5rem', color:'#c9a84c', fontWeight:700, lineHeight:1, marginBottom:'0.75rem' }}>
                      {generatedCode}
                    </div>
                    <button onClick={copyCode} style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(201,168,76,0.1)', color: copied ? '#22c55e' : '#c9a84c', border:`1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(201,168,76,0.4)'}`, borderRadius:'6px', padding:'0.4rem 1rem', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif', transition:'all 0.2s' }}>
                      {copied ? '✓ Copied!' : '📋 Copy Code'}
                    </button>
                  </div>
                )}

                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <input className={`input-field${joinFocused ? ' focused' : ''}`} type="text" placeholder="Enter 6-letter code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} onFocus={() => setJoinFocused(true)} onBlur={() => setJoinFocused(false)} maxLength={6} style={{ flex:1 }} />
                  <button onClick={handleJoinRoom} style={{ background:'transparent', color:'#c9a84c', border:'1.5px solid #c9a84c', borderRadius:'8px', padding:'0 1.5rem', fontSize:'0.92rem', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif', whiteSpace:'nowrap' }}>Join</button>
                </div>
              </div>
            </div>

            {/* Live Games */}
            <div>
              <div style={{ borderLeft:'3px solid #c9a84c', paddingLeft:'0.75rem', marginBottom:'0.75rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.2rem', color:'#e8e0d0', margin:0 }}>Live Games</h2>
                {liveGames.length > 0 && (
                  <span style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', padding:'0.1rem 0.5rem', borderRadius:'999px', fontSize:'0.7rem' }}>
                    {liveGames.length} live
                  </span>
                )}
              </div>

              {liveGames.length === 0 ? (
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(201,168,76,0.2)', borderRadius:'10px', padding:'2rem', textAlign:'center', color:'#4a5568', fontSize:'0.88rem' }}>
                  No live games right now
                  <div style={{ fontSize:'0.78rem', marginTop:'0.3rem', color:'#374151' }}>Be the first to start a match!</div>
                </div>
              ) : (
                liveGames.map((g: any) => (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'10px', padding:'0.9rem 1.1rem', marginBottom:'0.6rem', gap:'0.75rem' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.88rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {g.whitePlayer?.username} <span style={{ color:'#4a5568' }}>({g.whitePlayer?.eloRating})</span>
                        {' vs '}
                        {g.blackPlayer?.username} <span style={{ color:'#4a5568' }}>({g.blackPlayer?.eloRating})</span>
                      </div>
                      {g._count?.spectators > 0 && (
                        <div style={{ fontSize:'0.72rem', color:'#4a5568', marginTop:'0.15rem' }}>👁 {g._count.spectators} watching</div>
                      )}
                    </div>
                    <span style={{ border:'1px solid rgba(201,168,76,0.3)', background:'rgba(201,168,76,0.07)', color:'#c9a84c', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.75rem', whiteSpace:'nowrap' }}>
                      ⚡ {g.timeControl}s
                    </span>
                    <button onClick={() => { window.location.href = '/spectate?gameId=' + g.id }} style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.85rem', borderRadius:'6px', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>
                      👁 Watch
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Access */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.6rem' }}>
                <div style={{ borderLeft:'3px solid #c9a84c', paddingLeft:'0.75rem' }}>
                  <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.1rem', color:'#e8e0d0', margin:0 }}>Quick Access</h2>
                </div>
                <span style={{ fontSize:'0.75rem', color:'#4a5568' }}>scroll →</span>
              </div>
              <div className="quick-row quick-access-row">
                {[
                  { icon:'🧩', label:'Daily Puzzle', sub:"Solve today's puzzle", href:'/puzzles',      color:'#c9a84c' },
                  { icon:'⚡', label:'Puzzle Rush',  sub:'3 min challenge',       href:'/puzzles/rush', color:'#e74c3c' },
                  { icon:'📖', label:'Openings',     sub:'60+ openings',          href:'/openings',     color:'#3498db' },
                  { icon:'♟️', label:'Endgames',     sub:'7 essential positions', href:'/endgames',     color:'#27ae60' },
                  { icon:'🏆', label:'Tournaments',  sub:'Compete & win',         href:'/tournaments',  color:'#9b59b6' },
                  { icon:'🎲', label:'Variants',     sub:'Chess960 & more',       href:'/variants',     color:'#3498db' },
                  { icon:'📚', label:'Learn',        sub:'Chess Academy',         href:'/learn',        color:'#f39c12' },
                ].map(q => (
                  <Link key={q.href} href={q.href} className="qcard" style={{ borderLeft:`3px solid ${q.color}` }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:`${q.color}22`, border:`1px solid ${q.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                      {q.icon}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ color:'#e8e0d0', fontWeight:700, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.label}</div>
                      <div style={{ color:'#4a5568', fontSize:'0.72rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{q.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lobby-right" style={{ flex:1, display:'flex', flexDirection:'column', gap:'1rem', minWidth:0 }}>

            {/* Friends Online */}
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ padding:'0.75rem 1.1rem', borderBottom:'1px solid rgba(201,168,76,0.12)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', color:'#e8e0d0', fontSize:'0.95rem', fontWeight:700 }}>Friends Online</span>
                <span style={{ fontSize:'0.72rem', color:'#22c55e', background:'rgba(34,197,94,.12)', border:'1px solid rgba(34,197,94,.25)', padding:'0.1rem 0.45rem', borderRadius:999 }}>
                  {friendsOnline.filter(f => f.online).length} online
                </span>
              </div>
              <div style={{ padding:'0.5rem 0' }}>
                {friendsOnline.map(f => (
                  <div key={f.username} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.5rem 1rem' }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(201,168,76,.15)', border:'1px solid rgba(201,168,76,.3)', color:'#c9a84c', fontSize:'0.78rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {f.username[0].toUpperCase()}
                      </div>
                      <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, borderRadius:'50%', background: f.online ? '#22c55e' : '#4a5568', border:'1.5px solid #0a1628' }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <Link href={`/profile/${f.username}`} style={{ color:'#e8e0d0', fontSize:'0.83rem', textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {f.username} <span style={{ color:'#4a5568', fontSize:'0.73rem' }}>({f.elo})</span>
                      </Link>
                      <div style={{ fontSize:'0.72rem', color: f.online ? '#9aa5b4' : '#374151' }}>{f.status}</div>
                    </div>
                    {f.online && (
                      <button
                        onClick={() => { getSocket().emit('room:create', { timeControl: selectedTime || 600 }); setStatusMsg(`Challenge sent to ${f.username}!`) }}
                        style={{ background:'transparent', border:'1px solid rgba(201,168,76,.35)', color:'#c9a84c', borderRadius:5, padding:'0.2rem 0.55rem', fontSize:'0.72rem', cursor:'pointer', flexShrink:0, fontFamily:'var(--font-crimson),Georgia,serif' }}
                      >Challenge</button>
                    )}
                  </div>
                ))}
                {friendsOnline.length === 0 && (
                  <div style={{ padding:'1rem', textAlign:'center', color:'#4a5568', fontSize:'0.82rem' }}>
                    Add friends to see them here!
                  </div>
                )}
              </div>
            </div>

            {/* Lobby Chat */}
            <div className="lobby-chat" style={{ flex:1, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px', overflow:'hidden', minHeight:'360px', position:'relative' }}>
              <div style={{ padding:'0.9rem 1.1rem', borderBottom:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
                <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', color:'#e8e0d0', fontSize:'1rem', fontWeight:700 }}>Lobby Chat</span>
                <span style={{ color:'#22c55e', fontSize:'0.7rem' }}>●</span>
                <span style={{ fontSize:'0.75rem', color:'#22c55e' }}>Live</span>
                {onlineCount !== null && (
                  <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:'#9aa5b4' }}>
                    👥 {onlineCount} online
                  </span>
                )}
              </div>

              {/* Date separator */}
              <div style={{ padding:'0.4rem 1rem 0', flexShrink:0 }}>
                <div style={{ textAlign:'center', fontSize:'0.7rem', color:'#374151', position:'relative' }}>
                  <span style={{ background:'rgba(10,22,40,1)', padding:'0 0.5rem', position:'relative', zIndex:1 }}>── Today ──</span>
                </div>
              </div>

              <div ref={chatScrollRef} className="chat-scroll" style={{ flex:1, overflowY:'auto', padding:'0.6rem 1rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.isSystem ? (
                      <div style={{ fontSize:'0.78rem', color:'#4a5568', fontStyle:'italic', textAlign:'center', padding:'0.15rem' }}>{msg.text}</div>
                    ) : (
                      <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(201,168,76,.12)', border:'1px solid rgba(201,168,76,.2)', color:'#c9a84c', fontSize:'0.65rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                          {msg.user[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'baseline', gap:'0.35rem', flexWrap:'wrap' }}>
                            <Link href={`/profile/${msg.user}`} style={{ color:'#c9a84c', fontSize:'0.82rem', fontWeight:600, textDecoration:'none' }}>{msg.user}</Link>
                            <span style={{ color:'#374151', fontSize:'0.68rem' }}>{msg.time}</span>
                          </div>
                          <div style={{ color:'#e8e0d0', fontSize:'0.88rem', marginTop:'0.1rem', wordBreak:'break-word' }}>{msg.text}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Emoji picker popup */}
              {showEmojiPicker && (
                <div style={{ position:'absolute', bottom:'56px', left:'0.75rem', right:'0.75rem', background:'#0d1f3c', border:'1px solid rgba(201,168,76,0.3)', borderRadius:10, padding:'0.6rem', zIndex:50, display:'flex', flexWrap:'wrap', gap:'0.25rem' }}>
                  {['😀','😂','🤔','😎','😤','🤩','👏','🔥','💀','🏆','❤️','👍','😮','🎯','⚡','🎮','♟️','🤝','😅','🌟'].map(e => (
                    <button key={e} onClick={() => { setChatInput(p => p + e); setShowEmojiPicker(false) }} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.08)', borderRadius:5, padding:'0.25rem 0.35rem', fontSize:'1.15rem', cursor:'pointer', lineHeight:1 }}>{e}</button>
                  ))}
                </div>
              )}

              <div style={{ padding:'0.6rem 0.75rem', borderTop:'1px solid rgba(201,168,76,0.15)', display:'flex', gap:'0.4rem', flexShrink:0 }}>
                <button onClick={() => setShowEmojiPicker(p => !p)} style={{ background: showEmojiPicker ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.04)', border:'1px solid rgba(201,168,76,.2)', color:'#c9a84c', borderRadius:6, padding:'0 0.55rem', fontSize:'1rem', cursor:'pointer', flexShrink:0, lineHeight:1 }}>😀</button>
                <input className={`input-field${chatFocused ? ' focused' : ''}`} type="text" placeholder="Say something..." value={chatInput} onChange={e => setChatInput(e.target.value)} onFocus={() => setChatFocused(true)} onBlur={() => { setChatFocused(false); setTimeout(() => setShowEmojiPicker(false), 200) }} onKeyDown={e => { if (e.key === 'Enter') handleSendChat() }} style={{ flex:1, padding:'0.5rem 0.75rem', fontSize:'0.88rem' }} />
                <button onClick={handleSendChat} style={{ background:'#c9a84c', color:'#0a1628', border:'none', padding:'0.5rem 0.9rem', borderRadius:'6px', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'0.88rem', flexShrink:0 }}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
