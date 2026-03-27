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

const LIVE_GAMES = [
  { p1: 'Magnus_C',      e1: 2847, p2: 'Hikaru_N',    e2: 2783, time: '3+0',  id: 1 },
  { p1: 'GrandMaster99', e1: 1920, p2: 'ChessKing',   e2: 1875, time: '10+0', id: 2 },
  { p1: 'BlitzQueen',    e1: 1650, p2: 'TacticsGuru', e2: 1620, time: '1+0',  id: 3 },
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

  // Chat
  const [chatInput, setChatInput]   = useState('')
  const [chatFocused, setChatFocused] = useState(false)
  const [messages, setMessages]     = useState<ChatMsg[]>(INITIAL_MSGS)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // ── Mount + auth ─────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)
    if (!isLoggedIn()) { window.location.href = '/login'; return }
    setUser(getUser())
  }, [])

  // ── Search timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!searching) { setSearchSec(0); return }
    const id = setInterval(() => setSearchSec(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [searching])

  // ── Chat auto-scroll ─────────────────────────────────────────
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
      setMessages(prev => [...prev, { user: senderName, text: message, time: 'just now', isSystem: false }])
    })

    return () => {
      ['match:found','queue:waiting','room:created','room:joined','room:error','lobby:online-count','lobby:chat:receive']
        .forEach(ev => socket.off(ev))
    }
  }, [])

  if (!mounted) return null

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
    setMessages(prev => [...prev, { user: user?.username || 'Guest', text: chatInput.trim(), time: 'just now', isSystem: false }])
    setChatInput('')
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
        <div style={{ flex:1, display:'flex', gap:'1.5rem', padding:'1.5rem', maxWidth:'1400px', width:'100%', margin:'0 auto', boxSizing:'border-box' }}>

          {/* LEFT COLUMN */}
          <div style={{ flex:1.5, display:'flex', flexDirection:'column', gap:'1.5rem', minWidth:0 }}>

            {/* Quick Play */}
            <div>
              <div style={{ borderLeft:'3px solid #c9a84c', paddingLeft:'0.75rem', marginBottom:'0.75rem' }}>
                <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.2rem', color:'#e8e0d0', margin:0 }}>Quick Play</h2>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
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
              <div style={{ borderLeft:'3px solid #c9a84c', paddingLeft:'0.75rem', marginBottom:'0.75rem' }}>
                <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.2rem', color:'#e8e0d0', margin:0 }}>Live Games</h2>
              </div>
              {LIVE_GAMES.map(g => (
                <div key={g.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'10px', padding:'0.9rem 1.1rem', marginBottom:'0.6rem', gap:'0.75rem' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.88rem', color:'#e8e0d0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.p1} <span style={{ color:'#4a5568' }}>({g.e1})</span> vs {g.p2} <span style={{ color:'#4a5568' }}>({g.e2})</span></div>
                  </div>
                  <span style={{ border:'1px solid rgba(201,168,76,0.3)', background:'rgba(201,168,76,0.07)', color:'#c9a84c', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.75rem', whiteSpace:'nowrap' }}>⚡ {g.time}</span>
                  <button style={{ border:'1px solid rgba(201,168,76,0.4)', background:'transparent', color:'#c9a84c', padding:'0.3rem 0.85rem', borderRadius:'6px', fontSize:'0.82rem', cursor:'pointer', fontFamily:'var(--font-crimson),Georgia,serif' }}>Watch</button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Lobby Chat */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'12px', overflow:'hidden', minWidth:0, minHeight:'500px' }}>
            <div style={{ padding:'0.9rem 1.1rem', borderBottom:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', color:'#e8e0d0', fontSize:'1rem', fontWeight:700 }}>Lobby Chat</span>
              <span style={{ color:'#22c55e', fontSize:'0.7rem' }}>●</span>
              <span style={{ fontSize:'0.75rem', color:'#22c55e' }}>Live</span>
            </div>

            <div ref={chatScrollRef} className="chat-scroll" style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.isSystem ? (
                    <div style={{ fontSize:'0.8rem', color:'#4a5568', fontStyle:'italic', textAlign:'center', padding:'0.25rem' }}>{msg.text}</div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <span style={{ color:'#c9a84c', fontSize:'0.82rem', fontWeight:600 }}>{msg.user}</span>
                      <span style={{ color:'#e8e0d0', fontSize:'0.9rem', marginTop:'0.15rem' }}>{msg.text}</span>
                      <span style={{ color:'#4a5568', fontSize:'0.72rem', marginTop:'0.15rem' }}>{msg.time}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding:'0.75rem', borderTop:'1px solid rgba(201,168,76,0.15)', display:'flex', gap:'0.5rem', flexShrink:0 }}>
              <input className={`input-field${chatFocused ? ' focused' : ''}`} type="text" placeholder="Say something..." value={chatInput} onChange={e => setChatInput(e.target.value)} onFocus={() => setChatFocused(true)} onBlur={() => setChatFocused(false)} onKeyDown={e => { if (e.key === 'Enter') handleSendChat() }} style={{ flex:1, padding:'0.6rem 0.8rem', fontSize:'0.9rem' }} />
              <button onClick={handleSendChat} style={{ background:'#c9a84c', color:'#0a1628', border:'none', padding:'0.6rem 1rem', borderRadius:'6px', fontWeight:700, cursor:'pointer', fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'0.9rem' }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
