'use client'
import Link from 'next/link'
import { useState } from 'react'

const THEMES = [
  { id: 'classic', light: '#f0d9b5', dark: '#b58863' },
  { id: 'green', light: '#e8f0e9', dark: '#4a7c59' },
  { id: 'slate', light: '#e8e4d9', dark: '#86a666' },
]

const INITIAL_BOARD: (string | null)[][] = [
  ['♜','♞','♝','♛','♚','♝','♞','♜'],
  ['♟','♟','♟','♟','♟','♟','♟','♟'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['♙','♙','♙','♙','♙','♙','♙','♙'],
  ['♖','♘','♗','♕','♔','♗','♘','♖'],
]

const FILES = ['a','b','c','d','e','f','g','h']

const MOVES = [
  { n: 1, w: 'e4', b: 'e5' },
  { n: 2, w: 'Nf3', b: 'Nc6' },
  { n: 3, w: 'Bb5', b: 'a6' },
  { n: 4, w: 'Ba4', b: 'Nf6' },
]

type ChatMsg = { id: number; user: string; text: string; time: string; isMe: boolean }

const INITIAL_CHAT: ChatMsg[] = [
  { id: 1, user: 'Opponent', text: 'Good luck have fun! 🤝', time: '10:00', isMe: false },
  { id: 2, user: 'You', text: "gl hf! Let's play! ♟", time: '9:58', isMe: true },
]

export default function GamePage() {
  const [boardTheme, setBoardTheme] = useState('classic')
  const [board, setBoard] = useState<(string | null)[][]>(
    INITIAL_BOARD.map(row => [...row])
  )
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null)
  const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white')
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat')
  const [chatInput, setChatInput] = useState('')
  const [chatInputFocused, setChatInputFocused] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>(INITIAL_CHAT)
  const [voiceJoined, setVoiceJoined] = useState(false)

  const currentTheme = THEMES.find(t => t.id === boardTheme) || THEMES[0]

  function handleSquareClick(row: number, col: number) {
    const piece = board[row][col]
    if (selectedSquare) {
      const [selRow, selCol] = selectedSquare
      if (selRow === row && selCol === col) {
        setSelectedSquare(null)
        return
      }
      // Move piece
      const newBoard = board.map(r => [...r])
      newBoard[row][col] = newBoard[selRow][selCol]
      newBoard[selRow][selCol] = null
      setBoard(newBoard)
      setSelectedSquare(null)
      setCurrentTurn(t => t === 'white' ? 'black' : 'white')
    } else {
      if (piece) {
        setSelectedSquare([row, col])
      }
    }
  }

  function handleSendChat() {
    if (!chatInput.trim()) return
    setChatMessages(prev => [
      ...prev,
      { id: prev.length + 1, user: 'You', text: chatInput, time: 'now', isMe: true },
    ])
    setChatInput('')
  }

  function appendEmoji(emoji: string) {
    setChatInput(prev => prev + emoji)
  }

  return (
    <>
      <style>{`
        .board-sq { transition: filter 0.1s; }
        .board-sq:hover { filter: brightness(1.12); }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        .moves-scroll::-webkit-scrollbar { width: 3px; }
        .moves-scroll::-webkit-scrollbar-track { background: transparent; }
        .moves-scroll::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.15); border-radius: 2px; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: '#0a1628',
          overflow: 'hidden',
          fontFamily: 'var(--font-crimson), Georgia, serif',
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            height: '48px',
            background: 'rgba(10,22,40,0.97)',
            borderBottom: '1px solid rgba(201,168,76,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            flexShrink: 0,
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem', color: '#c9a84c' }}>♛</span>
            <span
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '0.9rem',
                color: '#c9a84c',
                letterSpacing: '0.04em',
              }}
            >
              Chess Lobby
            </span>
          </div>

          {/* Center */}
          <div style={{ fontSize: '0.95rem', color: '#e8e0d0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>{currentTurn === 'white' ? '⚪' : '⚫'}</span>
            <span>{currentTurn === 'white' ? "White's Turn" : "Black's Turn"}</span>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              style={{
                border: '1px solid rgba(201,168,76,0.4)',
                background: 'transparent',
                color: '#c9a84c',
                padding: '0.3rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-crimson), Georgia, serif',
              }}
            >
              🤝 Draw
            </button>
            <button
              style={{
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'transparent',
                color: '#ef4444',
                padding: '0.3rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-crimson), Georgia, serif',
              }}
            >
              🏳️ Resign
            </button>
            <Link
              href="/lobby"
              style={{
                border: '1px solid rgba(201,168,76,0.4)',
                background: 'transparent',
                color: '#c9a84c',
                padding: '0.3rem 0.7rem',
                borderRadius: '6px',
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              🏠
            </Link>
          </div>
        </div>

        {/* MAIN AREA */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT PANEL */}
          <div
            style={{
              width: '200px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.02)',
              borderRight: '1px solid rgba(201,168,76,0.15)',
              overflowY: 'auto',
            }}
          >
            {/* Black player card */}
            <div
              style={{
                padding: '0.75rem',
                borderBottom: '1px solid rgba(201,168,76,0.1)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#e8e0d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                }}
              >
                B
              </div>
              <div style={{ fontSize: '0.88rem', color: '#e8e0d0', marginTop: '0.4rem' }}>Opponent</div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>1200</div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontFamily: 'monospace',
                  color: '#e8c97a',
                  marginTop: '0.3rem',
                  letterSpacing: '0.05em',
                }}
              >
                10:00
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.25rem' }}>
                Captures: <span style={{ color: '#4a5568' }}>—</span>
              </div>
            </div>

            {/* Move history */}
            <div style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }} className="moves-scroll">
              <div
                style={{
                  fontSize: '0.78rem',
                  color: '#4a5568',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.4rem',
                }}
              >
                Moves
              </div>
              {MOVES.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.3rem',
                    padding: '0.2rem 0.3rem',
                    fontSize: '0.82rem',
                    borderRadius: '4px',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                >
                  <span style={{ color: '#4a5568', width: '1.2rem', flexShrink: 0 }}>{m.n}.</span>
                  <span style={{ color: '#e8e0d0', flex: 1 }}>{m.w}</span>
                  <span style={{ color: '#9aa5b4', flex: 1 }}>{m.b}</span>
                </div>
              ))}
            </div>

            {/* White player card */}
            <div
              style={{
                padding: '0.75rem',
                borderTop: '1px solid rgba(201,168,76,0.1)',
                marginTop: 'auto',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#e8e0d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                }}
              >
                W
              </div>
              <div style={{ fontSize: '0.88rem', color: '#e8e0d0', marginTop: '0.4rem' }}>You</div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>1200</div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontFamily: 'monospace',
                  color: '#e8c97a',
                  marginTop: '0.3rem',
                  letterSpacing: '0.05em',
                }}
              >
                10:00
              </div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.25rem' }}>
                Captures: <span style={{ color: '#4a5568' }}>—</span>
              </div>
            </div>
          </div>

          {/* CENTER PANEL */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              position: 'relative',
              minWidth: 0,
            }}
          >
            {/* Board theme switcher */}
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem' }}>
              {THEMES.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setBoardTheme(t.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`,
                    outline: boardTheme === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                    outlineOffset: '1px',
                    transition: 'outline 0.15s',
                  }}
                />
              ))}
            </div>

            {/* Board container with coordinates */}
            <div
              style={{
                position: 'relative',
                width: 'min(calc(100vh - 160px), calc(100vw - 600px))',
                maxWidth: '540px',
                aspectRatio: '1',
              }}
            >
              <div style={{ position: 'relative', paddingLeft: '1.5rem', paddingBottom: '1.5rem', width: '100%', height: '100%', boxSizing: 'border-box' }}>

                {/* Rank numbers left side */}
                {[0,1,2,3,4,5,6,7].map(rowIdx => (
                  <div
                    key={rowIdx}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: `calc(${rowIdx} * (100% - 1.5rem) / 8 + (100% - 1.5rem) / 16)`,
                      fontSize: '0.7rem',
                      color: '#9aa5b4',
                      fontFamily: 'monospace',
                      lineHeight: 1,
                      transform: 'translateY(-50%)',
                    }}
                  >
                    {8 - rowIdx}
                  </div>
                ))}

                {/* File letters bottom */}
                {FILES.map((f, colIdx) => (
                  <div
                    key={f}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: `calc(1.5rem + ${colIdx} * (100% - 1.5rem) / 8 + (100% - 1.5rem) / 16)`,
                      fontSize: '0.7rem',
                      color: '#9aa5b4',
                      fontFamily: 'monospace',
                      lineHeight: 1,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {f}
                  </div>
                ))}

                {/* Board grid */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '1.5rem',
                    right: 0,
                    bottom: '1.5rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                    border: '2px solid rgba(201,168,76,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  {board.map((row, rowIdx) =>
                    row.map((piece, colIdx) => {
                      const isLight = (rowIdx + colIdx) % 2 === 0
                      const isSelected =
                        selectedSquare !== null &&
                        selectedSquare[0] === rowIdx &&
                        selectedSquare[1] === colIdx
                      const isBlackPiece = piece ? ['♜','♞','♝','♛','♚','♟'].includes(piece) : false

                      return (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          className="board-sq"
                          onClick={() => handleSquareClick(rowIdx, colIdx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isSelected
                              ? 'rgba(201,168,76,0.6)'
                              : isLight
                              ? currentTheme.light
                              : currentTheme.dark,
                            cursor: piece ? 'pointer' : 'default',
                            aspectRatio: '1',
                          }}
                        >
                          {piece && (
                            <span
                              style={{
                                fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
                                lineHeight: 1,
                                color: isBlackPiece ? '#1a0a00' : '#fff',
                                textShadow: isBlackPiece
                                  ? '0 1px 2px rgba(255,255,255,0.4)'
                                  : '0 1px 3px rgba(0,0,0,0.8)',
                                userSelect: 'none',
                              }}
                            >
                              {piece}
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div
            style={{
              width: '280px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(255,255,255,0.02)',
              borderLeft: '1px solid rgba(201,168,76,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(201,168,76,0.15)', flexShrink: 0 }}>
              {(['chat', 'voice'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    background: 'transparent',
                    border: 'none',
                    color: activeTab === tab ? '#c9a84c' : '#4a5568',
                    borderBottom: activeTab === tab ? '2px solid #c9a84c' : '2px solid transparent',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-crimson), Georgia, serif',
                  }}
                >
                  {tab === 'chat' ? '💬 Chat' : '🎙️ Voice'}
                </button>
              ))}
            </div>

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
              <>
                {/* Messages */}
                <div
                  className="chat-scroll"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    minHeight: 0,
                  }}
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.isMe ? 'flex-end' : 'flex-start',
                        background: msg.isMe ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.05)',
                        border: msg.isMe
                          ? '1px solid rgba(201,168,76,0.25)'
                          : '1px solid rgba(201,168,76,0.1)',
                        borderRadius: msg.isMe ? '8px 0 8px 8px' : '0 8px 8px 8px',
                        padding: '0.5rem 0.75rem',
                        maxWidth: '80%',
                        fontSize: '0.85rem',
                        color: msg.isMe ? '#e8c97a' : '#e8e0d0',
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Emoji bar */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.3rem',
                    padding: '0.5rem 0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {['👏','😮','😄','🤔','😤','🏆'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => appendEmoji(emoji)}
                      style={{
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        padding: '0.25rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.04)',
                        border: 'none',
                        transition: 'background 0.15s',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Input row */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    borderTop: '1px solid rgba(201,168,76,0.1)',
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onFocus={() => setChatInputFocused(true)}
                    onBlur={() => setChatInputFocused(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat() }}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${chatInputFocused ? '#c9a84c' : 'rgba(201,168,76,0.25)'}`,
                      borderRadius: '7px',
                      padding: '0.5rem 0.7rem',
                      color: '#e8e0d0',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxShadow: chatInputFocused ? '0 0 0 3px rgba(201,168,76,0.15)' : 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={handleSendChat}
                    style={{
                      background: 'linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%)',
                      color: '#0a1628',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 0.8rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}

            {/* VOICE TAB */}
            {activeTab === 'voice' && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  padding: '1.5rem',
                }}
              >
                {/* Avatars */}
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                  {[{ label: 'Opponent', initial: 'B' }, { label: 'You', initial: 'W' }].map(p => (
                    <div
                      key={p.label}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          color: '#c9a84c',
                          fontFamily: 'var(--font-playfair), Georgia, serif',
                        }}
                      >
                        {p.initial}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#9aa5b4', marginTop: '0.4rem', textAlign: 'center' }}>
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Status */}
                {voiceJoined ? (
                  <span style={{ fontSize: '0.85rem', color: '#22c55e' }}>Connected ●</span>
                ) : (
                  <span style={{ color: '#4a5568', fontSize: '0.85rem' }}>Not connected</span>
                )}

                {/* Buttons */}
                {voiceJoined ? (
                  <button
                    onClick={() => setVoiceJoined(false)}
                    style={{
                      background: 'transparent',
                      color: '#c9a84c',
                      border: '1.5px solid #c9a84c',
                      borderRadius: '8px',
                      padding: '0.75rem 2rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                    }}
                  >
                    Mute
                  </button>
                ) : (
                  <button
                    onClick={() => setVoiceJoined(true)}
                    style={{
                      background: 'linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%)',
                      color: '#0a1628',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 2rem',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                    }}
                  >
                    Join Voice
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
