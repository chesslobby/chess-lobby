'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

const PLAYERS = [
  { rank: 1,  name: 'Magnus_C',      elo: 2847, games: 1203, winPct: 68 },
  { rank: 2,  name: 'Hikaru_N',      elo: 2783, games: 2145, winPct: 65 },
  { rank: 3,  name: 'GrandMaster99', elo: 2654, games: 876,  winPct: 61 },
  { rank: 4,  name: 'BlitzQueen',    elo: 2201, games: 543,  winPct: 58 },
  { rank: 5,  name: 'TacticsGuru',   elo: 2150, games: 987,  winPct: 55 },
  { rank: 6,  name: 'KnightRider',   elo: 1987, games: 432,  winPct: 53 },
  { rank: 7,  name: 'PawnStorm',     elo: 1876, games: 765,  winPct: 51 },
  { rank: 8,  name: 'EndgameKing',   elo: 1745, games: 321,  winPct: 49 },
  { rank: 9,  name: 'OpeningBook',   elo: 1623, games: 654,  winPct: 47 },
  { rank: 10, name: 'ChessNovice',   elo: 1502, games: 234,  winPct: 44 },
]

const TABS = ['Global', 'This Week', 'Friends']

function rankMedal(rank: number) {
  if (rank === 1) return '👑'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

function rowBg(rank: number) {
  if (rank === 1) return 'rgba(201,168,76,0.12)'
  if (rank === 2) return 'rgba(192,192,192,0.08)'
  if (rank === 3) return 'rgba(205,127,50,0.08)'
  return 'transparent'
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('Global')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const filtered = PLAYERS.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <style>{`
        .input-search {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: #e8e0d0;
          font-size: 0.92rem;
          outline: none;
          box-sizing: border-box;
          font-family: var(--font-crimson), Georgia, serif;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-search::placeholder { color: #4a5568; }
        .input-search.focused {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
        }
      `}</style>

      <div
        style={{
          background: '#0a1628',
          minHeight: '100vh',
          fontFamily: 'var(--font-crimson), Georgia, serif',
        }}
      >
        <Navbar />

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: '2rem 1rem',
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>🏆</span>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '2rem',
                color: '#e8e0d0',
                margin: 0,
                fontWeight: 700,
              }}
            >
              Leaderboard
            </h1>
          </div>

          {/* Tab switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '1.25rem',
              width: 'fit-content',
            }}
          >
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  border: 'none',
                  transition: 'all 0.2s',
                  background: activeTab === tab ? '#c9a84c' : 'transparent',
                  color: activeTab === tab ? '#0a1628' : '#4a5568',
                  fontWeight: activeTab === tab ? 700 : 400,
                  fontFamily: 'var(--font-crimson), Georgia, serif',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: '1.25rem' }}>
            <input
              className={`input-search${searchFocused ? ' focused' : ''}`}
              type="text"
              placeholder="🔍 Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          {/* Leaderboard table card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(201,168,76,0.15)',
                  }}
                >
                  {['Rank', 'Player', 'Elo', 'Games', 'Win%'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        color: '#4a5568',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(player => {
                  const medal = rankMedal(player.rank)
                  const isHovered = hoveredRow === player.rank
                  const bg = isHovered && player.rank > 3
                    ? 'rgba(255,255,255,0.03)'
                    : rowBg(player.rank)

                  return (
                    <tr
                      key={player.rank}
                      onMouseEnter={() => setHoveredRow(player.rank)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{ background: bg }}
                    >
                      {/* Rank */}
                      <td
                        style={{
                          padding: '0.85rem 1.25rem',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          fontSize: '0.92rem',
                          color: player.rank <= 3 ? '#c9a84c' : '#4a5568',
                          fontWeight: player.rank <= 3 ? 700 : 400,
                          verticalAlign: 'middle',
                        }}
                      >
                        {medal ? `${medal} ${player.rank}` : player.rank}
                      </td>

                      {/* Player */}
                      <td
                        style={{
                          padding: '0.85rem 1.25rem',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(201,168,76,0.15)',
                              border: '1px solid rgba(201,168,76,0.25)',
                              color: '#c9a84c',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              fontFamily: 'var(--font-playfair), Georgia, serif',
                            }}
                          >
                            {player.name[0]}
                          </div>
                          <span style={{ color: '#e8e0d0', fontSize: '0.92rem' }}>
                            {player.name}
                          </span>
                        </div>
                      </td>

                      {/* Elo */}
                      <td
                        style={{
                          padding: '0.85rem 1.25rem',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          fontWeight: 700,
                          color: '#c9a84c',
                          fontSize: '0.95rem',
                          fontFamily: 'monospace',
                          verticalAlign: 'middle',
                        }}
                      >
                        {player.elo}
                      </td>

                      {/* Games */}
                      <td
                        style={{
                          padding: '0.85rem 1.25rem',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          color: '#9aa5b4',
                          fontSize: '0.88rem',
                          verticalAlign: 'middle',
                        }}
                      >
                        {player.games}
                      </td>

                      {/* Win% */}
                      <td
                        style={{
                          padding: '0.85rem 1.25rem',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              color: '#e8e0d0',
                              fontSize: '0.88rem',
                              width: '3rem',
                              flexShrink: 0,
                            }}
                          >
                            {player.winPct}%
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '4px',
                              background: 'rgba(255,255,255,0.08)',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${player.winPct}%`,
                                height: '100%',
                                background: 'linear-gradient(to right, #c9a84c, #e8c97a)',
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '2.5rem',
                        textAlign: 'center',
                        color: '#4a5568',
                        fontStyle: 'italic',
                        fontSize: '0.9rem',
                      }}
                    >
                      No players found matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div
            style={{
              marginTop: '0.75rem',
              textAlign: 'right',
              fontSize: '0.75rem',
              color: '#4a5568',
            }}
          >
            Updated every 5 minutes
          </div>
        </div>
      </div>
    </>
  )
}
