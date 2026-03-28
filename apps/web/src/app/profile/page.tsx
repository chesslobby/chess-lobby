'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getUser, clearAuth } from '@/lib/api'
import { showToast } from '@/components/Toast'

function resultColor(result: string) {
  if (result === 'Win') return '#22c55e'
  if (result === 'Loss') return '#ef4444'
  return '#9aa5b4'
}

function eloColor(elo: string) {
  if (elo.startsWith('+')) return '#22c55e'
  if (elo.startsWith('-')) return '#ef4444'
  return '#4a5568'
}

const RECENT_GAMES = [
  { opp: 'Magnus_C', result: 'Loss', elo: '-8', date: 'Today' },
  { opp: 'BlitzQueen', result: 'Win', elo: '+12', date: 'Yesterday' },
  { opp: 'TacticsGuru', result: 'Draw', elo: '±0', date: '2 days ago' },
]

const FRIENDS = [
  { name: 'Magnus_C', elo: 2847, online: true },
  { name: 'BlitzQueen', elo: 1650, online: false },
]

export default function ProfilePage() {
  const router = useRouter()
  const [friendInput, setFriendInput] = useState('')
  const [friendFocused, setFriendFocused] = useState(false)
  const [friendMsg, setFriendMsg] = useState('')
  const [sendingFriend, setSendingFriend] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const u = getUser()
    if (!u) {
      router.replace('/login')
      return
    }
    setUser(u)
  }, [router])

  function handleLogout() {
    clearAuth()
    router.push('/')
  }

  async function sendFriendRequest() {
    if (!friendInput.trim()) return
    setSendingFriend(true)
    setFriendMsg('')
    try {
      const token = localStorage.getItem('chess_token')
      const res = await fetch(`http://localhost:4000/friends/request/${friendInput.trim()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setFriendMsg('Friend request sent! ✅')
        setFriendInput('')
        showToast('Friend request sent!', 'success')
      } else {
        const data = await res.json()
        setFriendMsg(data.error || 'Failed to send request')
        showToast(data.error || 'Failed to send request', 'error')
      }
    } catch {
      setFriendMsg('Network error')
      showToast('Network error', 'error')
    } finally {
      setSendingFriend(false)
    }
  }

  if (!user) return null

  const gamesPlayed: number = user.gamesPlayed ?? 0
  const gamesWon: number = user.gamesWon ?? 0
  const gamesDraw: number = user.gamesDraw ?? 0
  const losses = Math.max(0, gamesPlayed - gamesWon - gamesDraw)
  const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) + '%' : '0.0%'

  const STATS = [
    { label: 'Games Played', value: String(gamesPlayed), color: '#e8e0d0' },
    { label: 'Wins',         value: String(gamesWon),    color: '#22c55e' },
    { label: 'Losses',       value: String(losses),      color: '#ef4444' },
    { label: 'Draws',        value: String(gamesDraw),   color: '#9aa5b4' },
  ]

  return (
    <>
      <style>{`
        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(201,168,76,0.25);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          color: #e8e0d0;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-field::placeholder { color: #4a5568; }
        .input-field.focused {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
        }
        .btn-gold {
          background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%);
          color: #0a1628;
          border: none;
          border-radius: 8px;
          padding: 0.55rem 1rem;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 3px 14px rgba(201,168,76,0.3);
          font-family: var(--font-playfair), Georgia, serif;
          white-space: nowrap;
        }
        .btn-gold:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-outline-sm {
          background: transparent;
          color: #c9a84c;
          border: 1px solid rgba(201,168,76,0.4);
          border-radius: 6px;
          padding: 0.3rem 0.75rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s;
          font-family: var(--font-crimson), Georgia, serif;
          white-space: nowrap;
        }
        .btn-outline-sm:hover { background: rgba(201,168,76,0.1); }
        .btn-logout {
          background: transparent;
          color: #ef4444;
          border: 1px solid rgba(239,68,68,0.4);
          border-radius: 6px;
          padding: 0.4rem 1rem;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
          font-family: var(--font-crimson), Georgia, serif;
          white-space: nowrap;
        }
        .btn-logout:hover { background: rgba(239,68,68,0.1); }
        .table-row-hover:hover td { background: rgba(201,168,76,0.04); }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson), Georgia, serif' }}>
        <Navbar />

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* PROFILE HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px' }}>
            {/* Avatar */}
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a84c, #a07828)', border: '3px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#0a1628', fontWeight: 700, flexShrink: 0 }}>
              {(user.username?.[0] ?? 'G').toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.8rem', color: '#e8e0d0', margin: '0 0 0.3rem', fontWeight: 700 }}>
                {user.username ?? 'Guest'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>● Online</span>
                <span style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.88rem' }}>
                  ♟ {user.eloRating ?? 1200} Elo
                </span>
                <span style={{ fontSize: '0.82rem', color: '#9aa5b4' }}>Win rate: {winRate}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  style={{ border: '1px solid rgba(201,168,76,0.4)', background: 'transparent', color: '#c9a84c', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-crimson), Georgia, serif', transition: 'background 0.2s' }}
                >
                  Edit Profile
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* STATS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {STATS.map((stat) => (
              <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px', padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-playfair), Georgia, serif', lineHeight: 1.1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ELO GRAPH PLACEHOLDER */}
          <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(201,168,76,0.25)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem' }}>📈</div>
            <div style={{ fontSize: '1rem', color: '#9aa5b4', margin: '0.5rem 0 0.25rem', fontFamily: 'var(--font-playfair), Georgia, serif' }}>
              Elo History Chart
            </div>
            <div style={{ fontSize: '0.85rem', color: '#4a5568' }}>Coming Soon</div>
          </div>

          {/* RECENT GAMES */}
          <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
              <span style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.1rem', color: '#e8e0d0', fontWeight: 700 }}>Recent Games</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Opponent', 'Result', 'Elo Δ', 'Date'].map(h => (
                    <th key={h} style={{ fontSize: '0.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.6rem 1.25rem', textAlign: 'left', fontWeight: 600, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_GAMES.map((g, i) => (
                  <tr key={i} className="table-row-hover">
                    <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', color: '#e8e0d0', verticalAlign: 'middle' }}>{g.opp}</td>
                    <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', color: resultColor(g.result), fontWeight: 600, verticalAlign: 'middle' }}>{g.result}</td>
                    <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', color: eloColor(g.elo), fontFamily: 'monospace', verticalAlign: 'middle' }}>{g.elo}</td>
                    <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem', color: '#4a5568', verticalAlign: 'middle' }}>{g.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FRIENDS CARD */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
              <span style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.1rem', color: '#e8e0d0', fontWeight: 700 }}>Friends</span>
            </div>

            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className={`input-field${friendFocused ? ' focused' : ''}`}
                  type="text"
                  placeholder="Search for a player..."
                  value={friendInput}
                  onChange={(e) => setFriendInput(e.target.value)}
                  onFocus={() => setFriendFocused(true)}
                  onBlur={() => setFriendFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter') sendFriendRequest() }}
                  style={{ flex: 1, padding: '0.55rem 0.8rem' }}
                />
                <button className="btn-gold" onClick={sendFriendRequest} disabled={sendingFriend} style={{ opacity: sendingFriend ? 0.7 : 1 }}>
                  {sendingFriend ? '...' : 'Add Friend'}
                </button>
              </div>
              {friendMsg && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: friendMsg.includes('✅') ? '#22c55e' : '#ef4444' }}>
                  {friendMsg}
                </p>
              )}
            </div>

            {FRIENDS.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.85rem 1.25rem', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {f.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', color: '#e8e0d0', fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#4a5568' }}>{f.elo} Elo</div>
                </div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.online ? '#22c55e' : '#374151', marginLeft: 'auto', marginRight: '0.75rem', flexShrink: 0 }} />
                <button className="btn-outline-sm">Challenge</button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
