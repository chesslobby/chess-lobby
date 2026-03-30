'use client'
// @ts-nocheck
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { adminFetch } from '@/lib/adminApi'

export default function AdminDashboard() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalGames: 0, gamesToday: 0, onlineNow: 0 })

  // Users
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userSort, setUserSort] = useState('eloRating')
  const [userPage, setUserPage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)

  // Games
  const [games, setGames] = useState([])

  // Registration chart
  const [regStats, setRegStats] = useState([])

  // Live games
  const [liveGames, setLiveGames] = useState([])

  // Actions
  const [announcement, setAnnouncement] = useState('')
  const [announceMsg, setAnnounceMsg] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  // ── Auth check ───────────────────────────────────────────────
  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (!session) { router.push('/admin'); return }
    const age = Date.now() - parseInt(session)
    if (age > 2 * 60 * 60 * 1000) {
      localStorage.removeItem('admin_session')
      router.push('/admin')
      return
    }
    setAuthed(true)
  }, [])

  // ── Fetch all data ───────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      const [s, u, g, r] = await Promise.allSettled([
        adminFetch('/stats'),
        adminFetch(`/users?page=${userPage}&limit=20&search=${encodeURIComponent(userSearch)}&sort=${userSort}`),
        adminFetch('/games?limit=50'),
        adminFetch('/registration-stats'),
      ])
      if (s.status === 'fulfilled') setStats(s.value)
      if (u.status === 'fulfilled') { setUsers(u.value.users || []); setUserTotal(u.value.total || 0) }
      if (g.status === 'fulfilled') setGames(g.value.games || [])
      if (r.status === 'fulfilled') setRegStats(r.value.days || [])
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('Admin fetch error', e)
    }
  }, [userPage, userSearch, userSort])

  useEffect(() => {
    if (!authed) return
    fetchAllData()
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [authed, fetchAllData])

  // Re-fetch users when search/sort/page changes
  useEffect(() => {
    if (!authed) return
    adminFetch(`/users?page=${userPage}&limit=20&search=${encodeURIComponent(userSearch)}&sort=${userSort}`)
      .then(d => { setUsers(d.users || []); setUserTotal(d.total || 0) })
      .catch(() => {})
  }, [authed, userPage, userSearch, userSort])

  function logout() {
    localStorage.removeItem('admin_session')
    router.push('/admin')
  }

  async function handleAnnounce() {
    if (!announceMsg.trim()) return
    try {
      await adminFetch('/announce', { method: 'POST', body: JSON.stringify({ message: announceMsg }) })
      setAnnouncement('✅ Announcement sent!')
      setAnnounceMsg('')
      setTimeout(() => setAnnouncement(''), 3000)
    } catch { setAnnouncement('❌ Failed to send') }
  }

  async function handleClearGuests() {
    try {
      const d = await adminFetch('/guests', { method: 'DELETE' })
      setActionMsg(`✅ Removed ${d.deleted} guest users`)
      fetchAllData()
    } catch { setActionMsg('❌ Failed') }
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function handleExportCSV() {
    try {
      const d = await adminFetch('/users?limit=10000&page=1')
      const rows = [['Username','Email','Elo','Games','Wins','Guest','Joined']]
      ;(d.users || []).forEach((u: any) => {
        rows.push([u.username, u.email || '', u.eloRating, u.gamesPlayed, u.gamesWon, u.isGuest ? 'Yes' : 'No', new Date(u.createdAt).toLocaleDateString()])
      })
      const csv = rows.map(r => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'chess_lobby_users.csv'; a.click()
      URL.revokeObjectURL(url)
    } catch { setActionMsg('❌ Export failed') }
  }

  if (!authed) return null

  const cardStyle = (color = '#c9a84c') => ({
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${color}33`,
    borderRadius: 12,
    padding: '1.25rem 1.5rem',
  })

  const RESULT_COLOR: Record<string, string> = {
    white: '#27ae60', black: '#e74c3c', draw: '#c9a84c', abandoned: '#4a5568'
  }

  const chartMax = regStats.length ? Math.max(...regStats.map((d: any) => d.count), 1) : 1

  return (
    <>
      <style>{`
        body { background: #0a1628; }
        .admin-wrap { min-height: 100vh; background: #080f1e; color: #e8e0d0; font-family: 'Segoe UI', sans-serif; }
        .section-title { font-size: 1rem; font-weight: 700; color: #c9a84c; margin: 0 0 1rem; letter-spacing: 0.04em; display: flex; align-items: center; gap: 0.5rem; }
        .admin-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .admin-table th { padding: 0.6rem 1rem; text-align: left; color: #4a5568; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .admin-table td { padding: 0.65rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .admin-table tr:hover td { background: rgba(201,168,76,0.04); }
        .admin-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(201,168,76,0.25); border-radius: 8px; padding: 0.6rem 0.9rem; color: #e8e0d0; font-size: 0.9rem; outline: none; }
        .admin-input:focus { border-color: #c9a84c; }
        .admin-btn-sm { padding: 0.4rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; border: none; cursor: pointer; transition: opacity 0.2s; }
        .admin-btn-sm:hover { opacity: 0.85; }
        .stat-num { font-size: 2.2rem; font-weight: 800; font-family: monospace; line-height: 1; }
        .stat-label { font-size: 0.78rem; color: #6b7a8d; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.25rem; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        .live-dot { width:8px;height:8px;border-radius:50%;background:#27ae60;animation:pulse 1.2s infinite; display:inline-block; }
        @media (max-width: 640px) {
          .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-col-hide { display: none !important; }
        }
      `}</style>

      <div className="admin-wrap">
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid rgba(201,168,76,0.15)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e8e0d0' }}>Admin Dashboard</div>
              <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>Chess Lobby Control Panel</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="live-dot" />
              <span style={{ fontSize: '0.75rem', color: '#27ae60' }}>Live</span>
            </div>
            {lastUpdated && <span style={{ fontSize: '0.72rem', color: '#4a5568' }}>Updated {lastUpdated}</span>}
            <button onClick={logout} style={{ padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ── Overview Stats ─────────────────────────── */}
          <div>
            <div className="section-title">📊 Overview</div>
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
              {[
                { icon: '👥', label: 'Total Users',    value: stats.totalUsers,  color: '#3498db' },
                { icon: '🎮', label: 'Total Games',    value: stats.totalGames,  color: '#9b59b6' },
                { icon: '🟢', label: 'Online Now',     value: stats.onlineNow,   color: '#27ae60' },
                { icon: '📅', label: 'Games Today',    value: stats.gamesToday,  color: '#c9a84c' },
              ].map(s => (
                <div key={s.label} style={{ ...cardStyle(s.color), display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{s.icon}</span>
                  <div>
                    <div className="stat-num" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Registration Chart ─────────────────────── */}
          {regStats.length > 0 && (
            <div style={cardStyle()}>
              <div className="section-title">📈 New Users — Last 7 Days</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: 100, padding: '0 4px' }}>
                {regStats.map((d: any, i: number) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.68rem', color: '#c9a84c', fontFamily: 'monospace' }}>{d.count}</span>
                    <div style={{ width: '100%', height: `${Math.round((d.count / chartMax) * 80) + 4}px`, background: 'linear-gradient(to top, #c9a84c, #e8c86d)', borderRadius: '3px 3px 0 0', minHeight: 4 }} />
                    <span style={{ fontSize: '0.65rem', color: '#4a5568' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── User Management ────────────────────────── */}
          <div style={cardStyle()}>
            <div className="section-title">👥 User Management</div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input className="admin-input" placeholder="🔍 Search username or email..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1) }} style={{ flex: 1, minWidth: 180 }} />
              <select className="admin-input" value={userSort} onChange={e => setUserSort(e.target.value)}>
                <option value="eloRating">Sort: Elo</option>
                <option value="gamesPlayed">Sort: Games</option>
                <option value="createdAt">Sort: Joined</option>
                <option value="lastSeen">Sort: Last Seen</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th className="admin-col-hide">Email</th>
                    <th>Elo</th>
                    <th className="admin-col-hide">Games</th>
                    <th>Win%</th>
                    <th className="admin-col-hide">Type</th>
                    <th className="admin-col-hide">Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any, i: number) => {
                    const winPct = u.gamesPlayed > 0 ? Math.round((u.gamesWon / u.gamesPlayed) * 100) : 0
                    const isTop = i < 3
                    return (
                      <tr key={u.id} style={{ opacity: u.isGuest ? 0.55 : 1 }}>
                        <td style={{ color: '#4a5568', fontSize: '0.8rem' }}>{(userPage - 1) * 20 + i + 1}</td>
                        <td style={{ color: isTop ? '#c9a84c' : '#e8e0d0', fontWeight: isTop ? 700 : 400 }}>
                          {isTop && <span style={{ marginRight: 4 }}>{['👑','🥈','🥉'][i]}</span>}
                          {u.username}
                        </td>
                        <td className="admin-col-hide" style={{ color: '#6b7a8d', fontSize: '0.82rem' }}>{u.email || '—'}</td>
                        <td style={{ color: '#c9a84c', fontFamily: 'monospace', fontWeight: 700 }}>{u.eloRating}</td>
                        <td className="admin-col-hide" style={{ color: '#9aa5b4' }}>{u.gamesPlayed}</td>
                        <td style={{ color: '#9aa5b4' }}>{winPct}%</td>
                        <td className="admin-col-hide">
                          <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: u.isGuest ? 'rgba(107,122,141,0.2)' : 'rgba(52,152,219,0.2)', color: u.isGuest ? '#6b7a8d' : '#3498db', border: `1px solid ${u.isGuest ? 'rgba(107,122,141,0.3)' : 'rgba(52,152,219,0.3)'}` }}>
                            {u.isGuest ? 'Guest' : 'User'}
                          </span>
                        </td>
                        <td className="admin-col-hide" style={{ color: '#4a5568', fontSize: '0.8rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                        <td>
                          <a href={`/profile/${u.username}`} target="_blank" rel="noreferrer" style={{ color: '#3498db', fontSize: '0.78rem', textDecoration: 'none' }}>View</a>
                        </td>
                      </tr>
                    )
                  })}
                  {users.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: '#4a5568', padding: '2rem', fontStyle: 'italic' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ color: '#4a5568', fontSize: '0.8rem' }}>
                Showing {Math.min((userPage - 1) * 20 + 1, userTotal)}–{Math.min(userPage * 20, userTotal)} of {userTotal.toLocaleString()} users
              </span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="admin-btn-sm" style={{ background: 'rgba(255,255,255,0.07)', color: '#e8e0d0' }}>← Prev</button>
                <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(201,168,76,0.15)', borderRadius: 6, fontSize: '0.82rem', color: '#c9a84c' }}>Page {userPage}</span>
                <button onClick={() => setUserPage(p => p + 1)} disabled={userPage * 20 >= userTotal} className="admin-btn-sm" style={{ background: 'rgba(255,255,255,0.07)', color: '#e8e0d0' }}>Next →</button>
              </div>
            </div>
          </div>

          {/* ── Recent Games ───────────────────────────── */}
          <div style={cardStyle()}>
            <div className="section-title">🎮 Recent Games (last 50)</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>White</th>
                    <th>Black</th>
                    <th>Result</th>
                    <th className="admin-col-hide">Moves</th>
                    <th className="admin-col-hide">Time Control</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g: any, i: number) => (
                    <tr key={g.id || i}>
                      <td style={{ color: '#4a5568', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td style={{ color: '#e8e0d0' }}>{g.whiteName || '—'}</td>
                      <td style={{ color: '#e8e0d0' }}>{g.blackName || '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: (RESULT_COLOR[g.result] || '#4a5568') + '22', color: RESULT_COLOR[g.result] || '#6b7a8d', border: `1px solid ${(RESULT_COLOR[g.result] || '#4a5568')}44` }}>
                          {g.result || '—'}
                        </span>
                      </td>
                      <td className="admin-col-hide" style={{ color: '#9aa5b4', fontSize: '0.85rem' }}>{g.moveCount ?? '—'}</td>
                      <td className="admin-col-hide" style={{ color: '#6b7a8d', fontSize: '0.82rem' }}>{g.timeControl || '—'}</td>
                      <td style={{ color: '#4a5568', fontSize: '0.8rem' }}>{g.createdAt ? new Date(g.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {games.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#4a5568', padding: '2rem', fontStyle: 'italic' }}>No games yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Quick Actions ──────────────────────────── */}
          <div style={cardStyle()}>
            <div className="section-title">⚡ Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Announce */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input className="admin-input" placeholder="📢 Broadcast message to all players..." value={announceMsg} onChange={e => setAnnounceMsg(e.target.value)} style={{ flex: 1, minWidth: 220 }} onKeyDown={e => e.key === 'Enter' && handleAnnounce()} />
                <button onClick={handleAnnounce} className="admin-btn-sm" style={{ background: '#c9a84c', color: '#0a1628' }}>Send Announcement</button>
              </div>
              {announcement && <div style={{ color: '#27ae60', fontSize: '0.85rem' }}>{announcement}</div>}
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={handleClearGuests} className="admin-btn-sm" style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c' }}>
                  🗑️ Clear Old Guests
                </button>
                <button onClick={handleExportCSV} className="admin-btn-sm" style={{ background: 'rgba(52,152,219,0.15)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db' }}>
                  📊 Export Users CSV
                </button>
              </div>
              {actionMsg && <div style={{ color: '#27ae60', fontSize: '0.85rem' }}>{actionMsg}</div>}
            </div>
          </div>

          {/* ── Footer ─────────────────────────────────── */}
          <div style={{ textAlign: 'center', color: '#4a5568', fontSize: '0.75rem', paddingBottom: '1rem' }}>
            Chess Lobby Admin · Session expires 2h from login · Auto-refresh every 30s
          </div>
        </div>
      </div>
    </>
  )
}
