'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getTitle } from '@/lib/titles'

const ARENA_DATA: Record<string, any> = {
  'arena-1': { name: 'Bullet Arena', variant: 'Bullet 1+0', status: 'live', durationMins: 30, startTime: Date.now() - 900000 },
  'arena-2': { name: 'Blitz Championship', variant: 'Blitz 3+2', status: 'live', durationMins: 60, startTime: Date.now() - 300000 },
  'arena-3': { name: 'Rapid Open', variant: 'Rapid 10+0', status: 'upcoming', durationMins: 90, startTime: Date.now() + 3600000 },
  'arena-4': { name: 'Daily Blitz Bash', variant: 'Blitz 5+0', status: 'upcoming', durationMins: 45, startTime: Date.now() + 7200000 },
  'arena-5': { name: 'Morning Bullet', variant: 'Bullet 1+0', status: 'finished', durationMins: 30, startTime: Date.now() - 7200000 },
}

const FAKE_PLAYERS = [
  { rank: 1, username: 'Magnus_C',    elo: 2200, score: 18, wins: 7, draws: 4, losses: 1, berserk: 3 },
  { rank: 2, username: 'GrandBlitz',  elo: 1950, score: 14, wins: 6, draws: 2, losses: 2, berserk: 2 },
  { rank: 3, username: 'BlitzQueen',  elo: 1830, score: 12, wins: 5, draws: 2, losses: 3, berserk: 1 },
  { rank: 4, username: 'TactixKing',  elo: 1760, score: 11, wins: 4, draws: 3, losses: 3, berserk: 0 },
  { rank: 5, username: 'PawnStorm',   elo: 1680, score: 9,  wins: 4, draws: 1, losses: 4, berserk: 2 },
  { rank: 6, username: 'RookEnder',   elo: 1620, score: 8,  wins: 3, draws: 2, losses: 5, berserk: 0 },
  { rank: 7, username: 'KnightFork',  elo: 1590, score: 7,  wins: 3, draws: 1, losses: 6, berserk: 1 },
  { rank: 8, username: 'BishopPair',  elo: 1540, score: 6,  wins: 2, draws: 2, losses: 6, berserk: 0 },
  { rank: 9, username: 'SilentKing',  elo: 1480, score: 5,  wins: 2, draws: 1, losses: 7, berserk: 0 },
  { rank: 10, username: 'QuickMate',  elo: 1450, score: 4,  wins: 1, draws: 2, losses: 7, berserk: 0 },
]

const RECENT_GAMES = [
  { white: 'Magnus_C',   black: 'GrandBlitz',  result: '1-0', time: '1:23' },
  { white: 'BlitzQueen', black: 'TactixKing',  result: '0-1', time: '0:54' },
  { white: 'PawnStorm',  black: 'Magnus_C',    result: '0-1', time: '0:31' },
  { white: 'GrandBlitz', black: 'KnightFork',  result: '1-0', time: '2:15' },
  { white: 'RookEnder',  black: 'BlitzQueen',  result: '½-½', time: '1:45' },
  { white: 'BishopPair', black: 'PawnStorm',   result: '0-1', time: '0:58' },
]

function timeUntil(ts: number): string {
  const diff = ts - Date.now()
  if (diff <= 0) return '0:00'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}:${String(s).padStart(2, '0')}`
}

function resultColor(r: string) {
  if (r === '1-0') return '#22c55e'
  if (r === '0-1') return '#ef4444'
  return '#f39c12'
}

export default function ArenaPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const tournament = ARENA_DATA[id] || { name: 'Arena Tournament', variant: 'Blitz 3+2', status: 'live', durationMins: 60, startTime: Date.now() - 600000 }

  const [joined, setJoined] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [tab, setTab] = useState<'standings' | 'games'>('standings')
  const [tick, setTick] = useState(0)

  const endTime = tournament.startTime + tournament.durationMins * 60000
  const isLive = tournament.status === 'live'
  const isUpcoming = tournament.status === 'upcoming'

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (isLive) setTimeLeft(timeUntil(endTime))
    else if (isUpcoming) setTimeLeft(timeUntil(tournament.startTime))
  }, [tick])

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }
  const tabActive = { borderBottom: '2px solid #c9a84c', color: '#c9a84c' }
  const tabInactive = { borderBottom: '2px solid transparent', color: '#4a5568' }

  return (
    <>
      <style>{`
        .join-btn{background:linear-gradient(135deg,#c9a84c,#a07830);color:#0a1628;border:none;border-radius:8px;padding:.5rem 1.6rem;font-size:.92rem;font-weight:700;cursor:pointer;font-family:var(--font-playfair),Georgia,serif;transition:opacity .15s;}
        .join-btn:hover{opacity:.85;}
        .join-btn:disabled{opacity:.5;cursor:default;}
        .leave-btn{background:transparent;color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:.5rem 1.2rem;font-size:.88rem;cursor:pointer;font-family:var(--font-crimson),Georgia,serif;transition:background .15s;}
        .leave-btn:hover{background:rgba(239,68,68,.08);}
        tr:hover td{background:rgba(255,255,255,.03);}
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Breadcrumb */}
          <div style={{ color: '#4a5568', fontSize: '.82rem', marginBottom: '1rem' }}>
            <Link href="/tournaments" style={{ color: '#4a5568', textDecoration: 'none' }}>Tournaments</Link>
            {' / '}
            <span style={{ color: '#9aa5b4' }}>{tournament.name}</span>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.7rem', color: '#e8e0d0', margin: 0, fontWeight: 700 }}>
                  ⚡ {tournament.name}
                </h1>
                {isLive && <span style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', color: '#22c55e', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>● Live</span>}
                {isUpcoming && <span style={{ background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>◷ Upcoming</span>}
                {tournament.status === 'finished' && <span style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#4a5568', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem' }}>✓ Finished</span>}
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#c9a84c', fontSize: '.85rem' }}>{tournament.variant}</span>
                <span style={{ color: '#4a5568', fontSize: '.85rem' }}>👥 {FAKE_PLAYERS.length} players</span>
                <span style={{ color: '#4a5568', fontSize: '.85rem' }}>⏱ {tournament.durationMins} min</span>
              </div>
            </div>

            {/* Timer + action */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem' }}>
              {isLive && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4a5568', fontSize: '.75rem' }}>Time left</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', color: '#e8e0d0', fontWeight: 700 }}>{timeLeft}</div>
                </div>
              )}
              {isUpcoming && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#4a5568', fontSize: '.75rem' }}>Starts in</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.3rem', color: '#60a5fa', fontWeight: 700 }}>{timeLeft}</div>
                </div>
              )}
              {(isLive || isUpcoming) && !joined && (
                <button className="join-btn" onClick={() => setJoined(true)}>Join Tournament</button>
              )}
              {joined && (
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <span style={{ color: '#22c55e', fontSize: '.85rem' }}>✓ Joined</span>
                  <button className="leave-btn" onClick={() => setJoined(false)}>Leave</button>
                </div>
              )}
            </div>
          </div>

          {/* Arena info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Format', value: 'Arena', icon: '⚡' },
              { label: 'Variant', value: tournament.variant, icon: '♟️' },
              { label: 'Duration', value: `${tournament.durationMins}m`, icon: '⏱' },
              { label: 'Players', value: FAKE_PLAYERS.length, icon: '👥' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ ...cardStyle, padding: '.85rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem' }}>{icon}</div>
                <div style={{ color: '#c9a84c', fontWeight: 700, fontSize: '.95rem', marginTop: '.2rem' }}>{value}</div>
                <div style={{ color: '#4a5568', fontSize: '.75rem' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Berserk info */}
          {isLive && (
            <div style={{ ...cardStyle, padding: '.85rem 1.15rem', marginBottom: '1.25rem', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <div>
                <span style={{ color: '#c9a84c', fontWeight: 600, fontSize: '.88rem' }}>Berserk mode available! </span>
                <span style={{ color: '#4a5568', fontSize: '.82rem' }}>Halve your time to score double points on a win.</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '1rem', display: 'flex', gap: 0 }}>
            {(['standings', 'games'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', padding: '.5rem 1.1rem', fontSize: '.92rem', cursor: 'pointer', fontFamily: 'var(--font-crimson),Georgia,serif', ...(tab === t ? tabActive : tabInactive) }}>
                {t === 'standings' ? '🏅 Standings' : '🎮 Recent Games'}
              </button>
            ))}
          </div>

          {tab === 'standings' && (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    {['#', 'Player', 'Score', 'W', 'D', 'L', 'Berserk'].map(h => (
                      <th key={h} style={{ padding: '.65rem .85rem', color: '#4a5568', fontWeight: 600, textAlign: h === '#' || h === 'W' || h === 'D' || h === 'L' || h === 'Score' || h === 'Berserk' ? 'center' : 'left', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAKE_PLAYERS.map((p, i) => {
                    const t = getTitle(p.elo)
                    return (
                      <tr key={p.username} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: i < 3 ? ['#ffd700','#c0c0c0','#cd7f32'][i] : '#4a5568', fontWeight: 700 }}>{p.rank}</td>
                        <td style={{ padding: '.65rem .85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                            <span style={{ fontSize: '.82rem' }}>{t.icon}</span>
                            <span style={{ color: '#e8e0d0' }}>{p.username}</span>
                            <span style={{ color: '#4a5568', fontSize: '.75rem' }}>({p.elo})</span>
                          </div>
                        </td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#c9a84c', fontWeight: 700 }}>{p.score}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#22c55e' }}>{p.wins}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#f39c12' }}>{p.draws}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#ef4444' }}>{p.losses}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#60a5fa' }}>{p.berserk > 0 ? `⚡${p.berserk}` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'games' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {RECENT_GAMES.map((g, i) => (
                <div key={i} style={{ ...cardStyle, padding: '.75rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#e8e0d0', fontSize: '.88rem' }}>
                      <span style={{ color: '#9aa5b4', fontSize: '.75rem', marginRight: '.3rem' }}>⬜</span>
                      {g.white}
                    </span>
                    <span style={{ color: resultColor(g.result), fontWeight: 700, fontSize: '.88rem', minWidth: 36, textAlign: 'center' }}>{g.result}</span>
                    <span style={{ color: '#e8e0d0', fontSize: '.88rem' }}>
                      <span style={{ color: '#4a5568', fontSize: '.75rem', marginRight: '.3rem' }}>⬛</span>
                      {g.black}
                    </span>
                  </div>
                  <span style={{ color: '#4a5568', fontSize: '.78rem' }}>⏱ {g.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
