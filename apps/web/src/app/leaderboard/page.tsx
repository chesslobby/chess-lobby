'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'

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
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('http://localhost:4000/users/leaderboard')
        const data = await res.json()
        const list = (data.users || []).map((u: any, i: number) => ({
          rank: i + 1,
          name: u.username,
          elo: u.eloRating,
          games: u.gamesPlayed,
          winPct: u.gamesPlayed > 0 ? Math.round((u.gamesWon / u.gamesPlayed) * 100) : 0,
        }))
        setPlayers(list)
      } catch {
        // keep empty list on error
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  const filtered = players.filter(p =>
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
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner-ring {
          width: 40px; height: 40px;
          border: 3px solid rgba(201,168,76,0.2);
          border-top-color: #c9a84c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson), Georgia, serif' }}>
        <Navbar />

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🏆</span>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '2rem', color: '#e8e0d0', margin: 0, fontWeight: 700 }}>
              Leaderboard
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '4px', marginBottom: '1.25rem', width: 'fit-content' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1.25rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.9rem', border: 'none', transition: 'all 0.2s', background: activeTab === tab ? '#c9a84c' : 'transparent', color: activeTab === tab ? '#0a1628' : '#4a5568', fontWeight: activeTab === tab ? 700 : 400, fontFamily: 'var(--font-crimson), Georgia, serif' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: '1.25rem' }}>
            <input className={`input-search${searchFocused ? ' focused' : ''}`} type="text" placeholder="🔍 Search by username..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
          </div>

          {/* Table card */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px', overflow: 'hidden' }}>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
                <div className="spinner-ring" />
                <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>Loading leaderboard...</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
                    {['Rank', 'Player', 'Elo', 'Games', 'Win%'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(player => {
                    const medal = rankMedal(player.rank)
                    const isHovered = hoveredRow === player.rank
                    const bg = isHovered && player.rank > 3 ? 'rgba(255,255,255,0.03)' : rowBg(player.rank)

                    return (
                      <tr key={player.rank} onMouseEnter={() => setHoveredRow(player.rank)} onMouseLeave={() => setHoveredRow(null)} style={{ background: bg }}>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem', color: player.rank <= 3 ? '#c9a84c' : '#4a5568', fontWeight: player.rank <= 3 ? 700 : 400, verticalAlign: 'middle' }}>
                          {medal ? `${medal} ${player.rank}` : player.rank}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                              {player.name[0]}
                            </div>
                            <span style={{ color: '#e8e0d0', fontSize: '0.92rem' }}>{player.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 700, color: '#c9a84c', fontSize: '0.95rem', fontFamily: 'monospace', verticalAlign: 'middle' }}>
                          {player.elo}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#9aa5b4', fontSize: '0.88rem', verticalAlign: 'middle' }}>
                          {player.games}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#e8e0d0', fontSize: '0.88rem', width: '3rem', flexShrink: 0 }}>{player.winPct}%</span>
                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${player.winPct}%`, height: '100%', background: 'linear-gradient(to right, #c9a84c, #e8c97a)', borderRadius: '2px' }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#4a5568', fontStyle: 'italic', fontSize: '0.9rem' }}>
                        {players.length === 0
                          ? 'No players yet — be the first to play!'
                          : `No players found matching "${searchQuery}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#4a5568' }}>
            Updated every 5 minutes
          </div>
        </div>
      </div>
    </>
  )
}
