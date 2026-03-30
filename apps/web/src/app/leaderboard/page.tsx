'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const TABS = ['Global', 'This Week', 'Friends']

function rankMedal(rank: number) {
  if (rank === 1) return '👑'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

function getFlag(code: string): string {
  if (!code) return ''
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
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
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/users/leaderboard`)
        const data = await res.json()
        const list = (data.users || []).map((u: any, i: number) => ({
          rank: i + 1,
          name: u.username,
          elo: u.eloRating,
          games: u.gamesPlayed,
          winPct: u.gamesPlayed > 0 ? Math.round((u.gamesWon / u.gamesPlayed) * 100) : 0,
          country: u.country || null,
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
        @keyframes podiumRise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .podium-card { animation: podiumRise 0.5s ease both; }
        .podium-card:nth-child(2) { animation-delay: 0.1s; }
        .podium-card:nth-child(3) { animation-delay: 0.2s; }
        .lb-row { transition: background 0.15s; }
        .lb-row:hover { background: rgba(201,168,76,0.07) !important; }
        @media (max-width: 640px) {
          .lb-col-games { display: none !important; }
          .lb-player-name { max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
          .lb-tabs { width: 100% !important; }
          .lb-tabs button { flex: 1; padding: 0.5rem 0.5rem !important; font-size: 0.82rem !important; }
          .podium-wrap { transform: scale(0.85); transform-origin: center top; }
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
          <div className="lb-tabs" style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '4px', marginBottom: '1.25rem', width: 'fit-content' }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '0.5rem 1.25rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.9rem', border: 'none', transition: 'all 0.2s', background: activeTab === tab ? '#c9a84c' : 'transparent', color: activeTab === tab ? '#0a1628' : '#4a5568', fontWeight: activeTab === tab ? 700 : 400, fontFamily: 'var(--font-crimson), Georgia, serif' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Podium — top 3 visualization */}
          {!loading && players.length >= 3 && !searchQuery && activeTab === 'Global' && (
            <div className="podium-wrap" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '1rem 0' }}>
              {/* 2nd place */}
              {(() => {
                const p = players[1]
                return (
                  <div className="podium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(192,192,192,0.15)', border: '2px solid #c0c0c0', color: '#c0c0c0', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-playfair), Georgia, serif' }}>{p.name[0]}</div>
                    <span style={{ fontSize: '0.78rem', color: '#e8e0d0' }}>{p.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#c0c0c0', fontFamily: 'monospace' }}>{p.elo}</span>
                    <div style={{ width: '80px', background: 'rgba(192,192,192,0.12)', border: '1px solid rgba(192,192,192,0.3)', borderBottom: 'none', borderRadius: '6px 6px 0 0', padding: '0.5rem 0', textAlign: 'center', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.4rem' }}>🥈</span>
                    </div>
                  </div>
                )
              })()}
              {/* 1st place */}
              {(() => {
                const p = players[0]
                return (
                  <div className="podium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.8))' }}>👑</div>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: '2.5px solid #c9a84c', color: '#c9a84c', fontSize: '1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-playfair), Georgia, serif', boxShadow: '0 0 16px rgba(201,168,76,0.35)' }}>{p.name[0]}</div>
                    <span style={{ fontSize: '0.82rem', color: '#c9a84c', fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontSize: '0.73rem', color: '#e8c86d', fontFamily: 'monospace', fontWeight: 700 }}>{p.elo}</span>
                    <div style={{ width: '90px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.4)', borderBottom: 'none', borderRadius: '6px 6px 0 0', padding: '0.5rem 0', textAlign: 'center', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(201,168,76,0.15)' }}>
                      <span style={{ fontSize: '1.6rem' }}>🥇</span>
                    </div>
                  </div>
                )
              })()}
              {/* 3rd place */}
              {(() => {
                const p = players[2]
                return (
                  <div className="podium-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(205,127,50,0.15)', border: '2px solid #cd7f32', color: '#cd7f32', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-playfair), Georgia, serif' }}>{p.name[0]}</div>
                    <span style={{ fontSize: '0.75rem', color: '#e8e0d0' }}>{p.name}</span>
                    <span style={{ fontSize: '0.68rem', color: '#cd7f32', fontFamily: 'monospace' }}>{p.elo}</span>
                    <div style={{ width: '72px', background: 'rgba(205,127,50,0.1)', border: '1px solid rgba(205,127,50,0.3)', borderBottom: 'none', borderRadius: '6px 6px 0 0', padding: '0.5rem 0', textAlign: 'center', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>🥉</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

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
                    {[
                      { label: 'Rank', cls: '' },
                      { label: 'Player', cls: '' },
                      { label: 'Elo', cls: '' },
                      { label: 'Games', cls: 'lb-col-games' },
                      { label: 'Win%', cls: '' },
                    ].map(h => (
                      <th key={h.label} className={h.cls} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                        {h.label}
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
                      <tr key={player.rank} className="lb-row" onMouseEnter={() => setHoveredRow(player.rank)} onMouseLeave={() => setHoveredRow(null)} style={{ background: bg }}>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.92rem', color: player.rank <= 3 ? '#c9a84c' : '#4a5568', fontWeight: player.rank <= 3 ? 700 : 400, verticalAlign: 'middle' }}>
                          {medal ? `${medal} ${player.rank}` : player.rank}
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                              {player.name[0]}
                            </div>
                            {player.country && <span style={{ fontSize: '1rem', lineHeight: 1 }}>{getFlag(player.country)}</span>}
                            <Link href={`/profile/${player.name}`} className="lb-player-name" style={{ color: '#e8e0d0', fontSize: '0.92rem', textDecoration: 'none' }}>{player.name}</Link>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontWeight: 700, color: '#c9a84c', fontSize: '0.95rem', fontFamily: 'monospace', verticalAlign: 'middle' }}>
                          {player.elo}
                        </td>
                        <td className="lb-col-games" style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#9aa5b4', fontSize: '0.88rem', verticalAlign: 'middle' }}>
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
