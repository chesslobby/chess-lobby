'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getTitle } from '@/lib/titles'

const SWISS_DATA: Record<string, any> = {
  'swiss-1': { name: 'Weekly Swiss', variant: 'Classical 15+10', status: 'live', rounds: 5, currentRound: 3, startTime: Date.now() - 1800000 },
  'swiss-2': { name: 'Blitz Swiss Open', variant: 'Blitz 3+2', status: 'upcoming', rounds: 6, currentRound: 0, startTime: Date.now() + 5400000 },
  'swiss-3': { name: 'Rapid Swiss League', variant: 'Rapid 10+5', status: 'upcoming', rounds: 5, currentRound: 0, startTime: Date.now() + 86400000 },
  'swiss-4': { name: 'Club Championship', variant: 'Classical 30+0', status: 'finished', rounds: 7, currentRound: 7, startTime: Date.now() - 86400000 },
}

const STANDINGS = [
  { rank: 1, username: 'Magnus_C',   elo: 2200, points: 2.5, buch: 9.0, wins: 2, draws: 1, losses: 0 },
  { rank: 2, username: 'GrandBlitz', elo: 1950, points: 2.0, buch: 8.5, wins: 2, draws: 0, losses: 1 },
  { rank: 3, username: 'BlitzQueen', elo: 1830, points: 2.0, buch: 7.0, wins: 1, draws: 2, losses: 0 },
  { rank: 4, username: 'TactixKing', elo: 1760, points: 1.5, buch: 8.0, wins: 1, draws: 1, losses: 1 },
  { rank: 5, username: 'PawnStorm',  elo: 1680, points: 1.5, buch: 6.5, wins: 1, draws: 1, losses: 1 },
  { rank: 6, username: 'RookEnder',  elo: 1620, points: 1.0, buch: 7.5, wins: 1, draws: 0, losses: 2 },
  { rank: 7, username: 'KnightFork', elo: 1590, points: 1.0, buch: 6.0, wins: 0, draws: 2, losses: 1 },
  { rank: 8, username: 'BishopPair', elo: 1540, points: 0.5, buch: 7.0, wins: 0, draws: 1, losses: 2 },
  { rank: 9, username: 'SilentKing', elo: 1480, points: 0.5, buch: 5.5, wins: 0, draws: 1, losses: 2 },
  { rank: 10, username: 'QuickMate', elo: 1450, points: 0.0, buch: 4.5, wins: 0, draws: 0, losses: 3 },
]

const PAIRINGS_BY_ROUND: Record<number, any[]> = {
  1: [
    { board: 1, white: 'Magnus_C',   black: 'GrandBlitz', result: '1-0' },
    { board: 2, white: 'BlitzQueen', black: 'TactixKing', result: '½-½' },
    { board: 3, white: 'PawnStorm',  black: 'RookEnder',  result: '0-1' },
    { board: 4, white: 'KnightFork', black: 'BishopPair', result: '½-½' },
    { board: 5, white: 'SilentKing', black: 'QuickMate',  result: '½-½' },
  ],
  2: [
    { board: 1, white: 'GrandBlitz', black: 'BlitzQueen', result: '1-0' },
    { board: 2, white: 'Magnus_C',   black: 'TactixKing', result: '1-0' },
    { board: 3, white: 'RookEnder',  black: 'PawnStorm',  result: '½-½' },
    { board: 4, white: 'BishopPair', black: 'SilentKing', result: '0-1' },
    { board: 5, white: 'QuickMate',  black: 'KnightFork', result: '0-1' },
  ],
  3: [
    { board: 1, white: 'Magnus_C',   black: 'BlitzQueen', result: '*' },
    { board: 2, white: 'GrandBlitz', black: 'TactixKing', result: '*' },
    { board: 3, white: 'PawnStorm',  black: 'KnightFork', result: '*' },
    { board: 4, white: 'RookEnder',  black: 'BishopPair', result: '*' },
    { board: 5, white: 'SilentKing', black: 'QuickMate',  result: '*' },
  ],
}

function resultColor(r: string) {
  if (r === '1-0') return '#22c55e'
  if (r === '0-1') return '#ef4444'
  if (r === '½-½') return '#f39c12'
  return '#4a5568'
}

function timeUntil(ts: number): string {
  const diff = ts - Date.now()
  if (diff <= 0) return ''
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function SwissPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const tournament = SWISS_DATA[id] || { name: 'Swiss Tournament', variant: 'Rapid 10+5', status: 'live', rounds: 5, currentRound: 2, startTime: Date.now() - 3600000 }

  const [joined, setJoined] = useState(false)
  const [tab, setTab] = useState<'standings' | 'pairings'>('standings')
  const [roundTab, setRoundTab] = useState(Math.max(1, tournament.currentRound))
  const [tick, setTick] = useState(0)

  const isLive = tournament.status === 'live'
  const isUpcoming = tournament.status === 'upcoming'

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 10000)
    return () => clearInterval(t)
  }, [])

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12 }
  const tabActive = { borderBottom: '2px solid #c9a84c', color: '#c9a84c' }
  const tabInactive = { borderBottom: '2px solid transparent', color: '#4a5568' }

  const pairings = PAIRINGS_BY_ROUND[roundTab] || []
  const rounds = Array.from({ length: tournament.rounds }, (_, i) => i + 1)

  return (
    <>
      <style>{`
        .join-btn{background:linear-gradient(135deg,#c9a84c,#a07830);color:#0a1628;border:none;border-radius:8px;padding:.5rem 1.6rem;font-size:.92rem;font-weight:700;cursor:pointer;font-family:var(--font-playfair),Georgia,serif;transition:opacity .15s;}
        .join-btn:hover{opacity:.85;}
        .leave-btn{background:transparent;color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:8px;padding:.5rem 1.2rem;font-size:.88rem;cursor:pointer;font-family:var(--font-crimson),Georgia,serif;transition:background .15s;}
        .leave-btn:hover{background:rgba(239,68,68,.08);}
        .round-pill{background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:.25rem .7rem;font-size:.78rem;cursor:pointer;font-family:var(--font-crimson),Georgia,serif;color:#4a5568;transition:all .15s;}
        .round-pill.active{background:rgba(201,168,76,.15);border-color:rgba(201,168,76,.4);color:#c9a84c;}
        .round-pill:hover:not(.active){border-color:rgba(255,255,255,.2);color:#9aa5b4;}
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
                  ⚖️ {tournament.name}
                </h1>
                {isLive && <span style={{ background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.3)', color: '#22c55e', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>● Live</span>}
                {isUpcoming && <span style={{ background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.3)', color: '#60a5fa', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600 }}>◷ Upcoming</span>}
                {tournament.status === 'finished' && <span style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#4a5568', padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem' }}>✓ Finished</span>}
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#c9a84c', fontSize: '.85rem' }}>{tournament.variant}</span>
                <span style={{ color: '#4a5568', fontSize: '.85rem' }}>👥 {STANDINGS.length} players</span>
                <span style={{ color: '#4a5568', fontSize: '.85rem' }}>
                  {isLive
                    ? `Round ${tournament.currentRound} of ${tournament.rounds}`
                    : isUpcoming
                    ? `Starts in ${timeUntil(tournament.startTime)}`
                    : `${tournament.rounds} rounds completed`}
                </span>
              </div>
            </div>

            {(isLive || isUpcoming) && !joined && (
              <button className="join-btn" onClick={() => setJoined(true)}>Join Tournament</button>
            )}
            {joined && (
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <span style={{ color: '#22c55e', fontSize: '.85rem' }}>✓ Registered</span>
                <button className="leave-btn" onClick={() => setJoined(false)}>Withdraw</button>
              </div>
            )}
          </div>

          {/* Round progress */}
          <div style={{ ...cardStyle, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ color: '#4a5568', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 70 }}>Rounds</div>
              <div style={{ display: 'flex', gap: '.35rem', flex: 1, flexWrap: 'wrap' }}>
                {rounds.map(r => {
                  const done = r < tournament.currentRound
                  const current = r === tournament.currentRound && isLive
                  return (
                    <div key={r} style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.75rem', fontWeight: 600,
                      background: done ? 'rgba(34,197,94,.15)' : current ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${done ? 'rgba(34,197,94,.4)' : current ? 'rgba(201,168,76,.5)' : 'rgba(255,255,255,.1)'}`,
                      color: done ? '#22c55e' : current ? '#c9a84c' : '#4a5568',
                    }}>
                      {done ? '✓' : r}
                    </div>
                  )
                })}
              </div>
              {isLive && (
                <div style={{ color: '#c9a84c', fontSize: '.82rem', fontWeight: 600 }}>
                  Round {tournament.currentRound} in progress
                </div>
              )}
            </div>
          </div>

          {/* Swiss rules info */}
          <div style={{ ...cardStyle, padding: '.85rem 1.15rem', marginBottom: '1.25rem', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem' }}>ℹ️</span>
            <div style={{ color: '#4a5568', fontSize: '.82rem', lineHeight: 1.5 }}>
              <strong style={{ color: '#9aa5b4' }}>Swiss system:</strong> Players with equal scores are paired each round. Buchholz tiebreak is used to separate players with the same score.
            </div>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,.08)', marginBottom: '1rem', display: 'flex', gap: 0 }}>
            {(['standings', 'pairings'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', padding: '.5rem 1.1rem', fontSize: '.92rem', cursor: 'pointer', fontFamily: 'var(--font-crimson),Georgia,serif', ...(tab === t ? tabActive : tabInactive) }}>
                {t === 'standings' ? '🏅 Standings' : '🎯 Pairings'}
              </button>
            ))}
          </div>

          {tab === 'standings' && (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                    {['#', 'Player', 'Pts', 'Buch', 'W', 'D', 'L'].map(h => (
                      <th key={h} style={{ padding: '.65rem .85rem', color: '#4a5568', fontWeight: 600, textAlign: h === '#' || h === 'Pts' || h === 'Buch' || h === 'W' || h === 'D' || h === 'L' ? 'center' : 'left', fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STANDINGS.map((p, i) => {
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
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#c9a84c', fontWeight: 700 }}>{p.points}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#9aa5b4', fontSize: '.82rem' }}>{p.buch}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#22c55e' }}>{p.wins}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#f39c12' }}>{p.draws}</td>
                        <td style={{ padding: '.65rem .85rem', textAlign: 'center', color: '#ef4444' }}>{p.losses}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'pairings' && (
            <div>
              {/* Round selector */}
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {rounds.filter(r => r <= Math.max(tournament.currentRound, 1)).map(r => (
                  <button key={r} className={`round-pill${roundTab === r ? ' active' : ''}`} onClick={() => setRoundTab(r)}>
                    Round {r}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {pairings.length > 0 ? pairings.map(pair => (
                  <div key={pair.board} style={{ ...cardStyle, padding: '.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ color: '#4a5568', fontSize: '.78rem', minWidth: 50 }}>Board {pair.board}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#e8e0d0', fontSize: '.9rem' }}>
                        <span style={{ color: '#9aa5b4', fontSize: '.75rem', marginRight: '.3rem' }}>⬜</span>
                        {pair.white}
                      </span>
                      <span style={{ color: pair.result === '*' ? '#4a5568' : resultColor(pair.result), fontWeight: 700, fontSize: '.9rem', minWidth: 36, textAlign: 'center' }}>
                        {pair.result === '*' ? 'vs' : pair.result}
                      </span>
                      <span style={{ color: '#e8e0d0', fontSize: '.9rem' }}>
                        <span style={{ color: '#4a5568', fontSize: '.75rem', marginRight: '.3rem' }}>⬛</span>
                        {pair.black}
                      </span>
                    </div>
                    {pair.result === '*' && isLive && (
                      <span style={{ color: '#22c55e', fontSize: '.75rem', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', padding: '.2rem .55rem', borderRadius: 999 }}>In progress</span>
                    )}
                  </div>
                )) : (
                  <div style={{ color: '#4a5568', fontSize: '.88rem', padding: '2rem', textAlign: 'center' }}>
                    Pairings not yet available for this round.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
