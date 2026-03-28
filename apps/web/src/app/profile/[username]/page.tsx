'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getUser } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'

function getFlag(code) {
  if (!code) return ''
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d} days ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function tcLabel(s) {
  if (!s) return ''
  if (s <= 60) return `${s}s`
  return `${Math.round(s / 60)}min`
}

const ACHIEVEMENTS = [
  { id: 'first_game', icon: '♟️', name: 'First Move',    cond: u => u.gamesPlayed >= 1 },
  { id: 'first_win',  icon: '🏆', name: 'First Victory', cond: u => u.gamesWon >= 1 },
  { id: 'ten_wins',   icon: '⭐', name: 'Rising Star',   cond: u => u.gamesWon >= 10 },
  { id: 'fifty_wins', icon: '🌟', name: 'Chess Knight',  cond: u => u.gamesWon >= 50 },
  { id: 'hundred_g',  icon: '🎯', name: 'Dedicated',     cond: u => u.gamesPlayed >= 100 },
  { id: 'elo_1300',   icon: '📈', name: 'Improving',     cond: u => u.eloRating >= 1300 },
  { id: 'elo_1500',   icon: '💎', name: 'Advanced',      cond: u => u.eloRating >= 1500 },
  { id: 'elo_1800',   icon: '👑', name: 'Expert',        cond: u => u.eloRating >= 1800 },
  { id: 'elo_2000',   icon: '🔱', name: 'Master',        cond: u => u.eloRating >= 2000 },
  { id: 'on_fire',    icon: '🔥', name: 'On Fire',       cond: u => u.gamesWon >= 3 },
  { id: 'diplomat',   icon: '🤝', name: 'Diplomat',      cond: u => u.gamesDraw >= 5 },
  { id: 'veteran',    icon: '🎖️', name: 'Veteran',       cond: u => u.gamesPlayed >= 500 },
]

function resultColor(r) {
  if (r === 'Win') return '#22c55e'
  if (r === 'Loss') return '#ef4444'
  return '#9aa5b4'
}
function eloColor(n) {
  if (n > 0) return '#22c55e'
  if (n < 0) return '#ef4444'
  return '#4a5568'
}

export default function PublicProfilePage() {
  const params = useParams()
  const username = params?.username

  const [profile, setProfile] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isSelf, setIsSelf] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [games, setGames] = useState([])
  const [actionLoading, setActionLoading] = useState(false)

  const me = typeof window !== 'undefined' ? getUser() : null
  const token = typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null

  useEffect(() => {
    if (!username) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/users/by-username/${username}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then(r => r.json()),
      fetch(`${API}/games/history?userId=placeholder&limit=10&offset=0`).then(() => null).catch(() => null),
    ]).then(async ([profileData]) => {
      if (profileData.error) { setError(profileData.error); setLoading(false); return }
      setProfile(profileData.user)
      setIsFollowing(profileData.isFollowing)
      setIsBlocked(profileData.isBlocked)
      setIsSelf(profileData.isSelf)

      // Fetch games using the actual user id
      try {
        const gr = await fetch(`${API}/games/history?userId=${profileData.user.id}&limit=10`)
        if (gr.ok) {
          const gdata = await gr.json()
          setGames(gdata.games || [])
        }
      } catch {}
      setLoading(false)
    }).catch(() => { setError('Failed to load profile'); setLoading(false) })
  }, [username, token])

  async function toggleFollow() {
    if (!token || !profile) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API}/users/follow/${profile.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.following)
      }
    } catch {}
    setActionLoading(false)
  }

  async function toggleBlock() {
    if (!token || !profile) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API}/users/block/${profile.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setIsBlocked(data.blocked)
      }
    } catch {}
    setActionLoading(false)
  }

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px' }

  if (loading) return (
    <div style={{ background: '#0a1628', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#c9a84c' }}>Loading…</div>
    </div>
  )

  if (error) return (
    <div style={{ background: '#0a1628', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ color: '#ef4444' }}>{error}</div>
        <Link href="/lobby" style={{ color: '#c9a84c' }}>← Back to Lobby</Link>
      </div>
    </div>
  )

  const p = profile
  const gp = p.gamesPlayed ?? 0
  const gw = p.gamesWon ?? 0
  const gd = p.gamesDraw ?? 0
  const gl = Math.max(0, gp - gw - gd)
  const wr = gp > 0 ? ((gw / gp) * 100).toFixed(1) + '%' : '0%'
  const flag = p.country ? getFlag(p.country) : null
  const unlocked = ACHIEVEMENTS.filter(a => a.cond(p))

  return (
    <>
      <style>{`
        .btn-follow{background:rgba(201,168,76,.15);color:#c9a84c;border:1px solid rgba(201,168,76,.4);border-radius:7px;padding:.4rem 1rem;font-size:.88rem;cursor:pointer;transition:all .2s;font-family:var(--font-crimson),Georgia,serif;}
        .btn-follow:hover{background:rgba(201,168,76,.25);}
        .btn-block{background:transparent;color:#ef4444;border:1px solid rgba(239,68,68,.35);border-radius:7px;padding:.4rem 1rem;font-size:.88rem;cursor:pointer;transition:all .2s;font-family:var(--font-crimson),Georgia,serif;}
        .btn-block:hover{background:rgba(239,68,68,.1);}
        .btn-back{background:transparent;color:#c9a84c;border:1px solid rgba(201,168,76,.3);border-radius:6px;padding:.35rem .9rem;font-size:.85rem;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:.35rem;transition:background .2s;}
        .btn-back:hover{background:rgba(201,168,76,.08);}
        .tr-h:hover td{background:rgba(201,168,76,.04);}
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem' }}>

          <div style={{ marginBottom: '1.25rem' }}>
            <Link href="/lobby" className="btn-back">← Back to Lobby</Link>
          </div>

          {/* HEADER */}
          <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ flexShrink: 0 }}>
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9a84c' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a84c,#a07828)', border: '3px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#0a1628', fontWeight: 700 }}>
                  {(p.username?.[0] ?? '?').toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.7rem', color: '#e8e0d0', margin: '0 0 .3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                {flag && <span style={{ fontSize: '1.3rem' }}>{flag}</span>}
                {p.username}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                <span style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', color: '#c9a84c', padding: '.2rem .7rem', borderRadius: 999, fontSize: '.88rem' }}>
                  ♟ {p.eloRating} Elo
                </span>
                <span style={{ fontSize: '.82rem', color: '#9aa5b4' }}>Win rate: {wr}</span>
                {p.createdAt && <span style={{ fontSize: '.8rem', color: '#4a5568' }}>Joined {timeAgo(p.createdAt)}</span>}
              </div>
              {!isSelf && token && (
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <button className="btn-follow" onClick={toggleFollow} disabled={actionLoading}>
                    {isFollowing ? '✓ Following' : '+ Follow'}
                  </button>
                  <button className="btn-block" onClick={toggleBlock} disabled={actionLoading}>
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              )}
              {isSelf && (
                <Link href="/profile" style={{ color: '#c9a84c', fontSize: '.88rem', textDecoration: 'none' }}>
                  ✏️ Edit your profile →
                </Link>
              )}
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Games Played', value: gp, color: '#e8e0d0' },
              { label: 'Wins',         value: gw, color: '#22c55e' },
              { label: 'Losses',       value: gl, color: '#ef4444' },
              { label: 'Draws',        value: gd, color: '#9aa5b4' },
            ].map(s => (
              <div key={s.label} style={{ ...cardStyle, padding: '1.1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-playfair),Georgia,serif' }}>{s.value}</div>
                <div style={{ fontSize: '.75rem', color: '#4a5568', marginTop: '.25rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ACHIEVEMENTS */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1rem', color: '#e8e0d0', fontWeight: 700 }}>Achievements</span>
              <span style={{ fontSize: '.8rem', color: '#4a5568' }}>{unlocked.length} / {ACHIEVEMENTS.length}</span>
            </div>
            <div style={{ padding: '.85rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {ACHIEVEMENTS.map(a => {
                const done = a.cond(p)
                return (
                  <div
                    key={a.id}
                    title={a.name}
                    style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: done ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.03)',
                      border: `1px solid ${done ? 'rgba(201,168,76,.45)' : 'rgba(255,255,255,.06)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.3rem',
                      filter: done ? 'none' : 'grayscale(1)',
                      opacity: done ? 1 : 0.4,
                    }}
                  >
                    {a.icon}
                  </div>
                )
              })}
            </div>
          </div>

          {/* RECENT GAMES */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '.85rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
              <span style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1rem', color: '#e8e0d0', fontWeight: 700 }}>Recent Games</span>
            </div>
            {games.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#4a5568', fontStyle: 'italic', fontSize: '.9rem' }}>No games yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Opponent', 'Result', 'Elo Δ', 'Time', 'Date', ''].map(h => (
                      <th key={h} style={{ fontSize: '.72rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.07em', padding: '.55rem 1rem', textAlign: 'left', fontWeight: 600, background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(201,168,76,.1)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {games.map(g => (
                    <tr key={g.id} className="tr-h">
                      <td style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: '#e8e0d0', fontSize: '.9rem' }}>
                        <Link href={`/profile/${g.opponent?.username}`} style={{ color: '#e8e0d0', textDecoration: 'none' }}>
                          {g.opponent?.username ?? '?'}
                        </Link>
                        <span style={{ marginLeft: '.35rem', fontSize: '.78rem', color: '#4a5568' }}>({g.opponent?.elo})</span>
                      </td>
                      <td style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: resultColor(g.result), fontWeight: 600, fontSize: '.88rem' }}>{g.result}</td>
                      <td style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: eloColor(g.eloChange), fontFamily: 'monospace', fontSize: '.88rem' }}>
                        {g.eloChange > 0 ? `+${g.eloChange}` : g.eloChange}
                      </td>
                      <td style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: '#9aa5b4', fontSize: '.8rem' }}>{tcLabel(g.timeControl)}</td>
                      <td style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: '#4a5568', fontSize: '.8rem' }}>{timeAgo(g.date)}</td>
                      <td style={{ padding: '.65rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                        {g.pgn && (
                          <Link href={`/replay?gameId=${g.id}`} style={{ color: '#c9a84c', fontSize: '.78rem', textDecoration: 'none', border: '1px solid rgba(201,168,76,.35)', padding: '.2rem .5rem', borderRadius: 5 }}>
                            ▶ Replay
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
