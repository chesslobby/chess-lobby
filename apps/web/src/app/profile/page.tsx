'use client'
// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import AdUnit from '@/components/AdUnit'
import { getUser, clearAuth } from '@/lib/api'
import { showToast } from '@/components/Toast'

// ── Countries ─────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' },  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },    { code: 'BD', name: 'Bangladesh' },
  { code: 'BE', name: 'Belgium' },    { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },     { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },      { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },      { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },     { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' },      { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },    { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },       { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },     { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },      { code: 'KE', name: 'Kenya' },
  { code: 'MX', name: 'Mexico' },     { code: 'MA', name: 'Morocco' },
  { code: 'MM', name: 'Myanmar' },    { code: 'MY', name: 'Malaysia' },
  { code: 'NP', name: 'Nepal' },      { code: 'NL', name: 'Netherlands' },
  { code: 'NG', name: 'Nigeria' },    { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },   { code: 'PE', name: 'Peru' },
  { code: 'PH', name: 'Philippines' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },   { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },     { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },  { code: 'ZA', name: 'South Africa' },
  { code: 'KR', name: 'South Korea' }, { code: 'ES', name: 'Spain' },
  { code: 'LK', name: 'Sri Lanka' },  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },     { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'UAE' },        { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'VN', name: 'Vietnam' },
]

function getFlag(code) {
  if (!code) return ''
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('')
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function tcLabel(seconds) {
  if (seconds <= 60) return `${seconds}s`
  return `${Math.round(seconds / 60)}min`
}

// ── Achievements ──────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_game', icon: '♟️', name: 'First Move',    desc: 'Play your first game',   cond: u => u.gamesPlayed >= 1 },
  { id: 'first_win',  icon: '🏆', name: 'First Victory', desc: 'Win your first game',     cond: u => u.gamesWon >= 1 },
  { id: 'ten_wins',   icon: '⭐', name: 'Rising Star',   desc: 'Win 10 games',            cond: u => u.gamesWon >= 10 },
  { id: 'fifty_wins', icon: '🌟', name: 'Chess Knight',  desc: 'Win 50 games',            cond: u => u.gamesWon >= 50 },
  { id: 'hundred_g',  icon: '🎯', name: 'Dedicated',     desc: 'Play 100 games',          cond: u => u.gamesPlayed >= 100 },
  { id: 'elo_1300',   icon: '📈', name: 'Improving',     desc: 'Reach 1300 Elo',          cond: u => u.eloRating >= 1300 },
  { id: 'elo_1500',   icon: '💎', name: 'Advanced',      desc: 'Reach 1500 Elo',          cond: u => u.eloRating >= 1500 },
  { id: 'elo_1800',   icon: '👑', name: 'Expert',        desc: 'Reach 1800 Elo',          cond: u => u.eloRating >= 1800 },
  { id: 'elo_2000',   icon: '🔱', name: 'Master',        desc: 'Reach 2000 Elo',          cond: u => u.eloRating >= 2000 },
  { id: 'on_fire',    icon: '🔥', name: 'On Fire',       desc: 'Win 3 games in a row',    cond: u => u.gamesWon >= 3 },
  { id: 'diplomat',   icon: '🤝', name: 'Diplomat',      desc: 'Draw 5 games',            cond: u => u.gamesDraw >= 5 },
  { id: 'veteran',    icon: '🎖️', name: 'Veteran',       desc: 'Play 500 games',          cond: u => u.gamesPlayed >= 500 },
]

// ── Elo Chart (pure SVG) ──────────────────────────────────────
function EloChart({ history }) {
  if (!history || history.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#4a5568', fontSize: '0.9rem' }}>
        Play more games to see your Elo graph
      </div>
    )
  }

  const W = 760, H = 160
  const pL = 52, pR = 16, pT = 14, pB = 26
  const pw = W - pL - pR, ph = H - pT - pB

  const elos = history.map(h => h.elo)
  const rawMin = Math.min(...elos), rawMax = Math.max(...elos)
  const pad = rawMax === rawMin ? 50 : Math.max(20, Math.round((rawMax - rawMin) * 0.12))
  const minE = rawMin - pad, maxE = rawMax + pad

  const px = i => pL + (i / Math.max(history.length - 1, 1)) * pw
  const py = e => pT + (1 - (e - minE) / (maxE - minE)) * ph

  const pts = history.map((h, i) => `${px(i)},${py(h.elo)}`).join(' ')
  const area = `M ${pL} ${py(history[0].elo)} ` +
    history.map((h, i) => `L ${px(i)} ${py(h.elo)}`).join(' ') +
    ` L ${px(history.length - 1)} ${pT + ph} L ${pL} ${pT + ph} Z`

  const yLabels = [rawMin, Math.round((rawMin + rawMax) / 2), rawMax]
  const xStep = Math.max(1, Math.floor(history.length / 6))
  const last = history[history.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map(y => (
        <g key={y}>
          <line x1={pL} y1={py(y)} x2={pL + pw} y2={py(y)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={pL - 6} y={py(y) + 4} textAnchor="end" fill="#4a5568" fontSize="10" fontFamily="monospace">{y}</text>
        </g>
      ))}
      {history.map((_, i) => i % xStep === 0 ? (
        <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fill="#4a5568" fontSize="9">{i + 1}</text>
      ) : null)}
      <path d={area} fill="url(#eg)" />
      <polyline points={pts} fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {history.length <= 40 && history.map((h, i) => (
        <circle key={i} cx={px(i)} cy={py(h.elo)} r="2.5" fill="#c9a84c" stroke="#0a1628" strokeWidth="1.5" />
      ))}
      <text x={px(history.length - 1)} y={py(last.elo) - 7} textAnchor="middle" fill="#c9a84c" fontSize="11" fontWeight="bold" fontFamily="monospace">
        {last.elo}
      </text>
    </svg>
  )
}

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

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [games, setGames] = useState([])
  const [gamesTotal, setGamesTotal] = useState(0)
  const [gamesOffset, setGamesOffset] = useState(0)
  const [gamesLoading, setGamesLoading] = useState(false)
  const [eloHistory, setEloHistory] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [country, setCountry] = useState('')
  const [savingCountry, setSavingCountry] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [friendInput, setFriendInput] = useState('')
  const [friendFocused, setFriendFocused] = useState(false)
  const [friendMsg, setFriendMsg] = useState('')
  const [sendingFriend, setSendingFriend] = useState(false)
  const avatarInputRef = useRef(null)

  const API = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('chess_token') : null

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace('/login'); return }
    setUser(u)
    setCountry(u.country || '')
    refreshUser(u.username)
    fetchGames(u.id, 0)
    fetchEloHistory(u.username)
  }, [router])

  async function refreshUser(username) {
    try {
      const res = await fetch(`${API}/users/${username}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) return
      const { user: fresh } = await res.json()
      setUser(prev => ({ ...prev, ...fresh }))
      setCountry(fresh.country || '')
      const stored = JSON.parse(localStorage.getItem('chess_user') || '{}')
      localStorage.setItem('chess_user', JSON.stringify({ ...stored, ...fresh }))
    } catch {}
  }

  async function fetchGames(userId, offset) {
    setGamesLoading(true)
    try {
      const res = await fetch(`${API}/games/history?userId=${userId}&limit=10&offset=${offset}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGames(prev => offset === 0 ? (data.games || []) : [...prev, ...(data.games || [])])
        setGamesTotal(data.total || 0)
        setGamesOffset(offset)
      }
    } catch {}
    setGamesLoading(false)
  }

  async function fetchEloHistory(username) {
    try {
      const res = await fetch(`${API}/users/${username}/elo-history`)
      if (res.ok) {
        const { history } = await res.json()
        setEloHistory(history || [])
      }
    } catch {}
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG or WebP images are allowed', 'error'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error'); return
    }
    setAvatarUploading(true)
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const dataUrl = ev.target.result
        const base64 = dataUrl.split(',')[1]
        const res = await fetch(`${API}/users/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        })
        if (res.ok) {
          const { avatarUrl } = await res.json()
          setUser(prev => ({ ...prev, avatarUrl }))
          const stored = JSON.parse(localStorage.getItem('chess_user') || '{}')
          localStorage.setItem('chess_user', JSON.stringify({ ...stored, avatarUrl }))
          showToast('Avatar updated!', 'success')
        } else {
          showToast('Failed to upload avatar', 'error')
        }
      } catch { showToast('Upload error', 'error') }
      setAvatarUploading(false)
    }
    reader.readAsDataURL(file)
  }

  async function saveCountry() {
    setSavingCountry(true)
    try {
      const res = await fetch(`${API}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ country }),
      })
      if (res.ok) {
        setUser(prev => ({ ...prev, country }))
        const stored = JSON.parse(localStorage.getItem('chess_user') || '{}')
        localStorage.setItem('chess_user', JSON.stringify({ ...stored, country }))
        showToast('Profile saved!', 'success')
        setEditMode(false)
      } else {
        showToast('Failed to save profile', 'error')
      }
    } catch { showToast('Network error', 'error') }
    setSavingCountry(false)
  }

  async function sendFriendRequest() {
    if (!friendInput.trim()) return
    setSendingFriend(true); setFriendMsg('')
    try {
      const res = await fetch(`${API}/friends/request/${friendInput.trim()}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.ok) {
        setFriendMsg('Friend request sent! ✅'); setFriendInput('')
        showToast('Friend request sent!', 'success')
      } else {
        const data = await res.json()
        setFriendMsg(data.error || 'Failed'); showToast(data.error || 'Failed', 'error')
      }
    } catch { setFriendMsg('Network error'); showToast('Network error', 'error') }
    setSendingFriend(false)
  }

  if (!user) return null

  const gamesPlayed = user.gamesPlayed ?? 0
  const gamesWon    = user.gamesWon ?? 0
  const gamesDraw   = user.gamesDraw ?? 0
  const losses      = Math.max(0, gamesPlayed - gamesWon - gamesDraw)
  const winRate     = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) + '%' : '0%'
  const flagEmoji   = user.country ? getFlag(user.country) : null
  const unlocked    = ACHIEVEMENTS.filter(a => a.cond(user))

  const STATS = [
    { label: 'Games Played', value: gamesPlayed, color: '#e8e0d0' },
    { label: 'Wins',         value: gamesWon,    color: '#22c55e' },
    { label: 'Losses',       value: losses,      color: '#ef4444' },
    { label: 'Draws',        value: gamesDraw,   color: '#9aa5b4' },
  ]

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px' }

  return (
    <>
      <style>{`
        .inp { background:rgba(255,255,255,0.05);border:1.5px solid rgba(201,168,76,0.25);border-radius:8px;padding:.75rem 1rem;color:#e8e0d0;font-size:.9rem;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box;font-family:var(--font-crimson),Georgia,serif; }
        .inp::placeholder{color:#4a5568;}
        .inp:focus{border-color:#c9a84c;box-shadow:0 0 0 3px rgba(201,168,76,.15);}
        .inp-sel{background:rgba(255,255,255,0.05);border:1.5px solid rgba(201,168,76,0.25);border-radius:8px;padding:.7rem 1rem;color:#e8e0d0;font-size:.9rem;outline:none;cursor:pointer;font-family:var(--font-crimson),Georgia,serif;}
        .inp-sel:focus{border-color:#c9a84c;}
        .btn-gold{background:linear-gradient(135deg,#e8c97a 0%,#c9a84c 55%,#a07828 100%);color:#0a1628;border:none;border-radius:8px;padding:.55rem 1.1rem;font-size:.85rem;font-weight:700;letter-spacing:.04em;cursor:pointer;transition:all .2s;box-shadow:0 3px 14px rgba(201,168,76,.3);font-family:var(--font-playfair),Georgia,serif;white-space:nowrap;}
        .btn-gold:hover{filter:brightness(1.1);transform:translateY(-1px);}
        .btn-gold:disabled{opacity:.6;pointer-events:none;}
        .btn-sm{background:transparent;color:#c9a84c;border:1px solid rgba(201,168,76,.4);border-radius:6px;padding:.3rem .75rem;font-size:.8rem;cursor:pointer;transition:background .2s;font-family:var(--font-crimson),Georgia,serif;white-space:nowrap;}
        .btn-sm:hover{background:rgba(201,168,76,.1);}
        .btn-logout{background:transparent;color:#ef4444;border:1px solid rgba(239,68,68,.4);border-radius:6px;padding:.4rem 1rem;font-size:.85rem;cursor:pointer;transition:background .2s;font-family:var(--font-crimson),Georgia,serif;}
        .btn-logout:hover{background:rgba(239,68,68,.1);}
        .btn-edit{background:transparent;color:#c9a84c;border:1px solid rgba(201,168,76,.4);border-radius:6px;padding:.4rem 1rem;font-size:.85rem;cursor:pointer;transition:background .2s;font-family:var(--font-crimson),Georgia,serif;}
        .btn-edit:hover{background:rgba(201,168,76,.08);}
        .tr-hover:hover td{background:rgba(201,168,76,.04);}
        .ach-card{transition:transform .15s,box-shadow .15s;cursor:default;}
        .ach-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.3);}
        .avatar-wrap:hover .avatar-overlay{opacity:1!important;}
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .achievements-grid { grid-template-columns: 1fr 1fr !important; }
          .profile-header { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .elo-chart { height: 180px !important; }
          .game-history-table .col-hide-mobile { display: none !important; }
        }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* ── PROFILE HEADER ── */}
          <div className="profile-header" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.5rem' }}>
            {/* Avatar with upload */}
            <div
              className="avatar-wrap"
              style={{ position: 'relative', width: 80, height: 80, flexShrink: 0, cursor: 'pointer' }}
              onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9a84c' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a84c,#a07828)', border: '3px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#0a1628', fontWeight: 700 }}>
                  {(user.username?.[0] ?? 'G').toUpperCase()}
                </div>
              )}
              <div
                className="avatar-overlay"
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s', fontSize: '.75rem', color: '#fff', textAlign: 'center', lineHeight: 1.3 }}
              >
                {avatarUploading ? '...' : '📷\nChange'}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.8rem', color: '#e8e0d0', margin: '0 0 .3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                {flagEmoji && <span style={{ fontSize: '1.4rem' }}>{flagEmoji}</span>}
                {user.username ?? 'Guest'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
                <span style={{ color: '#22c55e', fontSize: '.8rem' }}>● Online</span>
                <span style={{ background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.3)', color: '#c9a84c', padding: '.2rem .7rem', borderRadius: 999, fontSize: '.88rem' }}>
                  ♟ {user.eloRating ?? 1200} Elo
                </span>
                <span style={{ fontSize: '.82rem', color: '#9aa5b4' }}>Win rate: {winRate}</span>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                <button className="btn-edit" onClick={() => setEditMode(v => !v)}>
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </button>
                <button className="btn-sm" onClick={() => {
                  const text = `🏆 ${user.username} on Chess Lobby\n📊 Elo: ${user.eloRating ?? 1200} | Games: ${gamesPlayed} | Win rate: ${winRate}\nPlay me at https://chesslobby.in/profile/${user.username}`
                  try { navigator.clipboard.writeText(text) } catch {}
                  showToast('Profile link copied! 🔗', 'success')
                }}>📤 Share Profile</button>
                <button className="btn-logout" onClick={() => { clearAuth(); router.push('/') }}>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* ── EDIT PANEL ── */}
          {editMode && (
            <div style={{ ...cardStyle, padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '.95rem', color: '#e8e0d0', fontWeight: 600, marginBottom: '.75rem', fontFamily: 'var(--font-playfair),Georgia,serif' }}>Edit Profile</div>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ fontSize: '.75rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '.35rem' }}>Country</label>
                  <select
                    className="inp-sel"
                    style={{ width: '100%' }}
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  >
                    <option value="">— Select country —</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{getFlag(c.code)} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ paddingTop: '1.5rem' }}>
                  <button className="btn-gold" onClick={saveCountry} disabled={savingCountry}>
                    {savingCountry ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '.75rem', fontSize: '.8rem', color: '#4a5568' }}>
                💡 Click your avatar photo to change it
              </div>
            </div>
          )}

          {/* ── STATS ROW ── */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ ...cardStyle, padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-playfair),Georgia,serif', lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '.78rem', color: '#4a5568', marginTop: '.3rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── ELO CHART ── */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '1.05rem', color: '#e8e0d0', fontWeight: 700, fontFamily: 'var(--font-playfair),Georgia,serif', marginBottom: '.75rem' }}>
              📈 Elo History
            </div>
            <EloChart history={eloHistory} />
          </div>

          {/* ── ACHIEVEMENTS ── */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.05rem', color: '#e8e0d0', fontWeight: 700 }}>Achievements</span>
              <span style={{ fontSize: '.82rem', color: '#4a5568' }}>{unlocked.length} / {ACHIEVEMENTS.length} unlocked</span>
            </div>
            <div className="achievements-grid" style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '.75rem' }}>
              {ACHIEVEMENTS.map(a => {
                const done = a.cond(user)
                return (
                  <div
                    key={a.id}
                    className="ach-card"
                    style={{
                      background: done ? 'rgba(201,168,76,.1)' : 'rgba(255,255,255,.03)',
                      border: `1px solid ${done ? 'rgba(201,168,76,.4)' : 'rgba(255,255,255,.06)'}`,
                      borderRadius: 10,
                      padding: '.85rem',
                      textAlign: 'center',
                      filter: done ? 'none' : 'grayscale(1)',
                      opacity: done ? 1 : 0.5,
                    }}
                    title={done ? a.desc : `Locked — ${a.desc}`}
                  >
                    <div style={{ fontSize: '1.6rem', marginBottom: '.35rem' }}>{a.icon}</div>
                    <div style={{ fontSize: '.82rem', color: done ? '#c9a84c' : '#4a5568', fontWeight: 700 }}>{a.name}</div>
                    <div style={{ fontSize: '.72rem', color: '#4a5568', marginTop: '.2rem' }}>{done ? a.desc : 'Locked'}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ad — between Achievements and Recent Games, desktop only */}
          <div className="desktop-only">
            <AdUnit slot="4444444444" format="rectangle" style={{ margin: '0 0 1.5rem', minHeight: 250 }} />
          </div>

          {/* ── RECENT GAMES ── */}
          <div style={{ ...cardStyle, marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.05rem', color: '#e8e0d0', fontWeight: 700 }}>Recent Games</span>
              {gamesTotal > 0 && <span style={{ fontSize: '.8rem', color: '#4a5568' }}>{gamesTotal} total</span>}
            </div>
            {games.length === 0 && !gamesLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#4a5568', fontSize: '.9rem', fontStyle: 'italic' }}>
                No games played yet
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Opponent', 'Result', 'Elo Δ', 'Time', 'Date', ''].map(h => (
                        <th key={h} style={{ fontSize: '.72rem', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.07em', padding: '.6rem 1rem', textAlign: 'left', fontWeight: 600, background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {games.map(g => (
                      <tr key={g.id} className="tr-hover">
                        <td style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: '#e8e0d0', fontSize: '.9rem', verticalAlign: 'middle' }}>
                          <Link href={`/profile/${g.opponent?.username}`} style={{ color: '#e8e0d0', textDecoration: 'none' }}>
                            {g.opponent?.username ?? '?'}
                          </Link>
                          <span style={{ marginLeft: '.4rem', fontSize: '.78rem', color: '#4a5568' }}>({g.opponent?.elo})</span>
                        </td>
                        <td style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: resultColor(g.result), fontWeight: 600, fontSize: '.88rem', verticalAlign: 'middle' }}>
                          {g.result}
                        </td>
                        <td style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: eloColor(g.eloChange), fontFamily: 'monospace', fontSize: '.9rem', verticalAlign: 'middle' }}>
                          {g.eloChange > 0 ? `+${g.eloChange}` : g.eloChange}
                        </td>
                        <td style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: '#9aa5b4', fontSize: '.8rem', verticalAlign: 'middle' }}>
                          {tcLabel(g.timeControl)}
                        </td>
                        <td style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', color: '#4a5568', fontSize: '.8rem', verticalAlign: 'middle' }}>
                          {timeAgo(g.date)}
                        </td>
                        <td style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.03)', verticalAlign: 'middle' }}>
                          {g.pgn && (
                            <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                              <Link href={`/replay?gameId=${g.id}`} style={{ color: '#c9a84c', fontSize: '.78rem', textDecoration: 'none', border: '1px solid rgba(201,168,76,.35)', padding: '.2rem .55rem', borderRadius: 5, whiteSpace: 'nowrap' }}>
                                ▶ Replay
                              </Link>
                              <button
                                onClick={() => {
                                  const url = `https://chesslobby.in/replay?gameId=${g.id}`
                                  try {
                                    navigator.clipboard.writeText(url)
                                    showToast('Replay link copied! 🔗', 'success')
                                  } catch {}
                                }}
                                title="Copy replay link"
                                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: '#4a5568', borderRadius: 5, padding: '.2rem .45rem', fontSize: '.78rem', cursor: 'pointer', lineHeight: 1 }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#c9a84c'; e.currentTarget.style.borderColor = 'rgba(201,168,76,.35)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#4a5568'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)' }}
                              >🔗</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {games.length < gamesTotal && (
                  <div style={{ padding: '.85rem 1rem', textAlign: 'center' }}>
                    <button
                      className="btn-sm"
                      onClick={() => fetchGames(user.id, gamesOffset + 10)}
                      disabled={gamesLoading}
                    >
                      {gamesLoading ? 'Loading…' : `Load more (${gamesTotal - games.length} remaining)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── INVITE FRIENDS ── */}
          <div style={{ ...cardStyle, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1rem', color: '#e8e0d0', fontWeight: 700, marginBottom: '0.25rem' }}>🎖️ Invite Friends</div>
                <div style={{ fontSize: '0.78rem', color: '#4a5568' }}>Share your invite link — invite 5 friends → unlock <span style={{ color: '#c9a84c' }}>Recruiter badge</span></div>
              </div>
              <button
                className="btn-sm"
                onClick={() => {
                  const link = `https://chesslobby.in/lobby?ref=${user.username}`
                  try { navigator.clipboard.writeText(link) } catch {}
                  showToast('Invite link copied! 🎉', 'success')
                }}
              >
                🔗 Copy Invite Link
              </button>
            </div>
          </div>

          {/* ── FRIENDS ── */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
              <span style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.05rem', color: '#e8e0d0', fontWeight: 700 }}>Friends</span>
            </div>
            <div style={{ padding: '.75rem 1.25rem', borderBottom: '1px solid rgba(201,168,76,.1)' }}>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input
                  className="inp"
                  type="text"
                  placeholder="Add friend by username…"
                  value={friendInput}
                  onChange={e => setFriendInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendFriendRequest() }}
                  style={{ flex: 1 }}
                />
                <button className="btn-gold" onClick={sendFriendRequest} disabled={sendingFriend}>
                  {sendingFriend ? '…' : 'Add Friend'}
                </button>
              </div>
              {friendMsg && (
                <p style={{ margin: '.4rem 0 0', fontSize: '.82rem', color: friendMsg.includes('✅') ? '#22c55e' : '#ef4444' }}>
                  {friendMsg}
                </p>
              )}
            </div>
            <div style={{ padding: '.75rem 1.25rem', color: '#4a5568', fontSize: '.85rem', fontStyle: 'italic' }}>
              Accept friend requests from the notification panel
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
