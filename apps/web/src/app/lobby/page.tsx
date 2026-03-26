'use client'
import { useState } from 'react'
import Link from 'next/link'

const TIME_CONTROLS = [
  { emoji: '⚡', time: '1 min', mode: 'Bullet' },
  { emoji: '🔥', time: '3 min', mode: 'Blitz' },
  { emoji: '⚡', time: '5 min', mode: 'Blitz' },
  { emoji: '📚', time: '10 min', mode: 'Rapid' },
]

const LIVE_GAMES = [
  { p1: 'Magnus_C', e1: 2847, p2: 'Hikaru_N', e2: 2783, time: '3+0', id: 1 },
  { p1: 'GrandMaster99', e1: 1920, p2: 'ChessKing', e2: 1875, time: '10+0', id: 2 },
  { p1: 'BlitzQueen', e1: 1650, p2: 'TacticsGuru', e2: 1620, time: '1+0', id: 3 },
]

type ChatMessage = {
  user: string
  text: string
  time: string
  isSystem: boolean
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { user: 'Magnus_C', text: 'GG everyone! Great games today', time: '2m ago', isSystem: false },
  { user: 'BlitzQueen', text: 'Anyone up for a 3+0 game?', time: '1m ago', isSystem: false },
  { user: 'System', text: 'GrandMaster99 just won a Rapid game! 🏆', time: 'just now', isSystem: true },
]

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export default function LobbyPage() {
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinFocused, setJoinFocused] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatFocused, setChatFocused] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES)

  function handleSendChat() {
    if (!chatInput.trim()) return
    setMessages(prev => [
      ...prev,
      { user: 'Guest', text: chatInput, time: 'just now', isSystem: false },
    ])
    setChatInput('')
  }

  return (
    <>
      <style>{`
        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(201,168,76,0.25);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          color: #e8e0d0;
          font-size: 0.97rem;
          outline: none;
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
          border-radius: 12px;
          padding: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          user-select: none;
        }
        .time-card:hover {
          border: 1px solid #c9a84c;
          background: rgba(201,168,76,0.08);
          box-shadow: 0 0 12px rgba(201,168,76,0.2);
        }
        .time-card.selected {
          border: 1px solid #c9a84c;
          background: rgba(201,168,76,0.08);
          box-shadow: 0 0 12px rgba(201,168,76,0.2);
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a1628',
          minHeight: '100vh',
          fontFamily: 'var(--font-crimson), Georgia, serif',
        }}
      >
        {/* NAVBAR */}
        <div
          style={{
            height: '56px',
            background: 'rgba(10,22,40,0.97)',
            borderBottom: '1px solid rgba(201,168,76,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            zIndex: 100,
            position: 'sticky',
            top: 0,
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
        >
          {/* Left */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: '0.4rem',
            }}
          >
            <span style={{ fontSize: '1.4rem', color: '#c9a84c' }}>♛</span>
            <span
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.1rem',
                color: '#c9a84c',
                letterSpacing: '0.05em',
                marginLeft: '0.5rem',
              }}
            >
              Chess Lobby
            </span>
          </Link>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.88rem', color: '#9aa5b4' }}>Guest&nbsp; |&nbsp; ♟ 1200 Elo</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(201,168,76,0.2)',
                border: '1px solid #c9a84c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c9a84c',
                fontSize: '0.85rem',
                marginLeft: '0.75rem',
              }}
            >
              G
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: '1.5rem',
            padding: '1.5rem',
            maxWidth: '1400px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* LEFT COLUMN */}
          <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

            {/* Quick Play */}
            <div>
              <div style={{ borderLeft: '3px solid #c9a84c', paddingLeft: '0.75rem', marginBottom: '0.75rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: '1.2rem',
                    color: '#e8e0d0',
                    margin: 0,
                  }}
                >
                  Quick Play
                </h2>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                }}
              >
                {TIME_CONTROLS.map((tc, i) => (
                  <div
                    key={i}
                    className={`time-card${selectedTime === i ? ' selected' : ''}`}
                    onClick={() => setSelectedTime(i)}
                  >
                    <span style={{ fontSize: '1.8rem' }}>{tc.emoji}</span>
                    <span
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#e8e0d0',
                        display: 'block',
                        marginTop: '0.3rem',
                      }}
                    >
                      {tc.time}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#4a5568',
                        display: 'block',
                        marginTop: '0.2rem',
                      }}
                    >
                      {tc.mode}
                    </span>
                  </div>
                ))}
              </div>

              {/* Find Match Button */}
              <button
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  background: selectedTime !== null
                    ? 'linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%)'
                    : 'linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%)',
                  color: '#0a1628',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.9rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  cursor: selectedTime !== null ? 'pointer' : 'not-allowed',
                  opacity: selectedTime !== null ? 1 : 0.5,
                  transition: 'all 0.2s',
                  boxShadow: selectedTime !== null ? '0 4px 20px rgba(201,168,76,0.35)' : 'none',
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                }}
              >
                Find Match
              </button>
            </div>

            {/* Private Room */}
            <div>
              <div style={{ borderLeft: '3px solid #c9a84c', paddingLeft: '0.75rem', marginBottom: '0.75rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: '1.2rem',
                    color: '#e8e0d0',
                    margin: 0,
                  }}
                >
                  Private Room
                </h2>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                {/* Row 1: Create Room */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button
                    onClick={() => setRoomCode(generateRoomCode())}
                    style={{
                      background: 'linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%)',
                      color: '#0a1628',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.7rem 1.5rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                      boxShadow: '0 3px 14px rgba(201,168,76,0.3)',
                    }}
                  >
                    Create Room
                  </button>
                  {roomCode && (
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1.5rem',
                        letterSpacing: '0.2em',
                        color: '#c9a84c',
                        border: '1px dashed rgba(201,168,76,0.4)',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        marginLeft: '1rem',
                      }}
                    >
                      {roomCode}
                    </span>
                  )}
                </div>

                {/* Row 2: Join Room */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    className={`input-field${joinFocused ? ' focused' : ''}`}
                    type="text"
                    placeholder="Enter 6-letter code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onFocus={() => setJoinFocused(true)}
                    onBlur={() => setJoinFocused(false)}
                    maxLength={6}
                    style={{ flex: 1 }}
                  />
                  <button
                    style={{
                      background: 'transparent',
                      color: '#c9a84c',
                      border: '1.5px solid #c9a84c',
                      borderRadius: '8px',
                      paddingLeft: '1.5rem',
                      paddingRight: '1.5rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {/* Live Games */}
            <div>
              <div style={{ borderLeft: '3px solid #c9a84c', paddingLeft: '0.75rem', marginBottom: '0.75rem' }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair), Georgia, serif',
                    fontSize: '1.2rem',
                    color: '#e8e0d0',
                    margin: 0,
                  }}
                >
                  Live Games
                </h2>
              </div>
              {LIVE_GAMES.map((g) => (
                <div
                  key={g.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(201,168,76,0.15)',
                    borderRadius: '10px',
                    padding: '0.9rem 1.1rem',
                    marginBottom: '0.6rem',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.92rem', color: '#e8e0d0', flex: 1 }}>
                    {g.p1} ({g.e1}) vs {g.p2} ({g.e2})
                  </span>
                  <span
                    style={{
                      border: '1px solid rgba(201,168,76,0.3)',
                      background: 'rgba(201,168,76,0.07)',
                      color: '#c9a84c',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⚡ {g.time}
                  </span>
                  <button
                    style={{
                      border: '1px solid rgba(201,168,76,0.4)',
                      background: 'transparent',
                      color: '#c9a84c',
                      padding: '0.35rem 0.9rem',
                      borderRadius: '6px',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-crimson), Georgia, serif',
                    }}
                  >
                    Watch
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Lobby Chat */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px',
              overflow: 'hidden',
              minWidth: 0,
              minHeight: '500px',
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: '0.9rem 1.1rem',
                borderBottom: '1px solid rgba(201,168,76,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  color: '#e8e0d0',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                Lobby Chat
              </span>
              <span style={{ color: '#22c55e', fontSize: '0.7rem' }}>●</span>
              <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Live</span>
            </div>

            {/* Messages area */}
            <div
              className="chat-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.isSystem ? (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#4a5568',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '0.25rem',
                      }}
                    >
                      {msg.text}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        style={{
                          color: '#c9a84c',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {msg.user}
                      </span>
                      <span
                        style={{
                          color: '#e8e0d0',
                          fontSize: '0.9rem',
                          marginTop: '0.15rem',
                        }}
                      >
                        {msg.text}
                      </span>
                      <span
                        style={{
                          color: '#4a5568',
                          fontSize: '0.72rem',
                          marginTop: '0.15rem',
                        }}
                      >
                        {msg.time}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input area */}
            <div
              style={{
                padding: '0.75rem',
                borderTop: '1px solid rgba(201,168,76,0.15)',
                display: 'flex',
                gap: '0.5rem',
                flexShrink: 0,
              }}
            >
              <input
                className={`input-field${chatFocused ? ' focused' : ''}`}
                type="text"
                placeholder="Say something..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onFocus={() => setChatFocused(true)}
                onBlur={() => setChatFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat() }}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.9rem',
                }}
              />
              <button
                onClick={handleSendChat}
                style={{
                  background: '#c9a84c',
                  color: '#0a1628',
                  border: 'none',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-playfair), Georgia, serif',
                  fontSize: '0.9rem',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
