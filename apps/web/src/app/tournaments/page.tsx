'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { getTitle } from '@/lib/titles'

const MOCK_ARENA = [
  { id: 'arena-1', name: 'Bullet Arena', variant: 'Bullet 1+0', status: 'live', players: 24, rounds: null, prize: null, startTime: Date.now() - 900000 },
  { id: 'arena-2', name: 'Blitz Championship', variant: 'Blitz 3+2', status: 'live', players: 41, rounds: null, prize: null, startTime: Date.now() - 300000 },
  { id: 'arena-3', name: 'Rapid Open', variant: 'Rapid 10+0', status: 'upcoming', players: 12, rounds: null, prize: null, startTime: Date.now() + 3600000 },
  { id: 'arena-4', name: 'Daily Blitz Bash', variant: 'Blitz 5+0', status: 'upcoming', players: 8, rounds: null, prize: null, startTime: Date.now() + 7200000 },
  { id: 'arena-5', name: 'Morning Bullet', variant: 'Bullet 1+0', status: 'finished', players: 30, rounds: null, prize: null, startTime: Date.now() - 7200000 },
]

const MOCK_SWISS = [
  { id: 'swiss-1', name: 'Weekly Swiss', variant: 'Classical 15+10', status: 'live', players: 16, rounds: 5, currentRound: 3, startTime: Date.now() - 1800000 },
  { id: 'swiss-2', name: 'Blitz Swiss Open', variant: 'Blitz 3+2', status: 'upcoming', players: 10, rounds: 6, currentRound: 0, startTime: Date.now() + 5400000 },
  { id: 'swiss-3', name: 'Rapid Swiss League', variant: 'Rapid 10+5', status: 'upcoming', players: 6, rounds: 5, currentRound: 0, startTime: Date.now() + 86400000 },
  { id: 'swiss-4', name: 'Club Championship', variant: 'Classical 30+0', status: 'finished', players: 20, rounds: 7, currentRound: 7, startTime: Date.now() - 86400000 },
]

function timeLabel(ts: number): string {
  const diff = ts - Date.now()
  const abs = Math.abs(diff)
  if (abs < 60000) return 'just now'
  if (abs < 3600000) return `${Math.round(abs / 60000)}m ${diff < 0 ? 'ago' : ''}`
  if (abs < 86400000) return `${Math.round(abs / 3600000)}h ${diff < 0 ? 'ago' : ''}`
  return `${Math.round(abs / 86400000)}d ${diff < 0 ? 'ago' : ''}`
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    live: { bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.3)', color: '#22c55e', text: 'Live', isLive: true },
    upcoming: { bg: 'rgba(59,130,246,.1)', border: 'rgba(59,130,246,.3)', color: '#60a5fa', text: '◷ Soon' },
    finished: { bg: 'rgba(255,255,255,.05)', border: 'rgba(255,255,255,.1)', color: '#4a5568', text: '✓ Ended' },
  }
  const s = (map as any)[status] || map.finished
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, padding: '.2rem .6rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '.3rem' }}>
      {s.isLive && <span className="live-indicator" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />}
      {!s.isLive && (status === 'upcoming' ? '◷ ' : '✓ ')}
      {s.text}
    </span>
  )
}

export default function TournamentsPage() {
  const [tab, setTab] = useState<'arena' | 'swiss'>('arena')
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const arenaList = MOCK_ARENA.filter(t => filter === 'all' || t.status === filter)
  const swissList = MOCK_SWISS.filter(t => filter === 'all' || t.status === filter)

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem 1.15rem', transition: 'border-color .15s' }
  const tabActive = { borderBottom: '2px solid #c9a84c', color: '#c9a84c' }
  const tabInactive = { borderBottom: '2px solid transparent', color: '#4a5568' }
  const filterActive = { background: 'rgba(201,168,76,.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,.35)' }
  const filterInactive = { background: 'transparent', color: '#4a5568', border: '1px solid rgba(255,255,255,.08)' }

  return (
    <>
      <style>{`
        .t-card {
          transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
        }
        .t-card:hover {
          border-color: rgba(201,168,76,.4) !important;
          background: rgba(255,255,255,.06) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.25);
        }
        .join-btn{background:rgba(201,168,76,.15);color:#c9a84c;border:1px solid rgba(201,168,76,.4);border-radius:7px;padding:.35rem .9rem;font-size:.82rem;cursor:pointer;text-decoration:none;display:inline-block;font-family:var(--font-crimson),Georgia,serif;transition:all .15s;}
        .join-btn:hover{background:rgba(201,168,76,.28); transform: translateY(-1px); box-shadow: 0 3px 12px rgba(201,168,76,0.2);}
        .join-btn.disabled{opacity:.4;pointer-events:none;}
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .live-indicator { animation: livePulse 1.2s ease-in-out infinite; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '1.85rem', color: '#e8e0d0', margin: '0 0 .3rem', fontWeight: 700 }}>
              🏆 Tournaments
            </h1>
            <p style={{ color: '#4a5568', fontSize: '.88rem', margin: 0 }}>
              Compete in Arena and Swiss tournaments. Rise through the ranks and earn glory.
            </p>
          </div>

          {/* Tabs + Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              {(['arena', 'swiss'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', padding: '.5rem 1.1rem', fontSize: '.92rem', cursor: 'pointer', fontFamily: 'var(--font-crimson),Georgia,serif', ...(tab === t ? tabActive : tabInactive) }}>
                  {t === 'arena' ? '⚡ Arena' : '⚖️ Swiss'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
              {(['all', 'live', 'upcoming', 'finished'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ border: 'none', borderRadius: 7, padding: '.3rem .75rem', fontSize: '.78rem', cursor: 'pointer', fontFamily: 'var(--font-crimson),Georgia,serif', ...(filter === f ? filterActive : filterInactive) }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ ...cardStyle, marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {tab === 'arena' ? (
              <>
                <div style={{ fontSize: '1.8rem' }}>⚡</div>
                <div>
                  <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>Arena Tournaments</div>
                  <div style={{ color: '#4a5568', fontSize: '.82rem', lineHeight: 1.5 }}>
                    Join any time during the tournament window. Play as many games as you can — the top scorers win. Berserk to double your points!
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.8rem' }}>⚖️</div>
                <div>
                  <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '.95rem', marginBottom: '.2rem' }}>Swiss Tournaments</div>
                  <div style={{ color: '#4a5568', fontSize: '.82rem', lineHeight: 1.5 }}>
                    Fixed number of rounds. Players are paired by score — no eliminations. The player with the most points after all rounds wins.
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tournament list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {(tab === 'arena' ? arenaList : swissList).map(t => (
              <div key={t.id} className="t-card" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.3rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '.95rem' }}>{t.name}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#c9a84c', fontSize: '.8rem' }}>{t.variant}</span>
                      <span style={{ color: '#4a5568', fontSize: '.8rem' }}>👥 {t.players} players</span>
                      {tab === 'swiss' && 'rounds' in t && t.rounds && (
                        <span style={{ color: '#4a5568', fontSize: '.8rem' }}>
                          {t.status === 'live' ? `Round ${(t as any).currentRound}/${t.rounds}` : `${t.rounds} rounds`}
                        </span>
                      )}
                      <span style={{ color: '#4a5568', fontSize: '.8rem' }}>
                        {t.status === 'finished' ? `Ended ${timeLabel(t.startTime)}` : t.status === 'live' ? `Started ${timeLabel(t.startTime)}` : `Starts in ${timeLabel(t.startTime)}`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Link
                      href={tab === 'arena' ? `/tournaments/${t.id}` : `/tournaments/swiss/${t.id}`}
                      className={`join-btn${t.status === 'finished' ? ' disabled' : ''}`}
                    >
                      {t.status === 'live' ? 'Join ⚡' : t.status === 'upcoming' ? 'Register' : 'View Results'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {(tab === 'arena' ? arenaList : swissList).length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#4a5568', fontSize: '.9rem' }}>
                No {filter === 'all' ? '' : filter} {tab} tournaments right now.
              </div>
            )}
          </div>

          {/* Create tournament CTA */}
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.15)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ color: '#9aa5b4', fontSize: '.88rem', marginBottom: '.6rem' }}>Want to host your own tournament?</div>
            <button style={{ background: 'transparent', border: '1px solid rgba(201,168,76,.35)', color: '#c9a84c', borderRadius: 8, padding: '.45rem 1.25rem', cursor: 'pointer', fontSize: '.85rem', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
              Create Tournament (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
