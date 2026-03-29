'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getUser, clearAuth, isLoggedIn } from '@/lib/api'

const NAV_LINKS = [
  { href: '/lobby',       label: 'Play' },
  { href: '/play-bot',    label: '🤖 Bot' },
  { href: '/puzzles',     label: 'Puzzles' },
  { href: '/learn',       label: 'Learn', hasDropdown: true },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

const LEARN_ITEMS = [
  { href: '/learn',     icon: '📚', label: 'Chess Academy',     desc: 'All learning tools' },
  { href: '/play-bot',  icon: '🤖', label: 'Play vs Computer',  desc: 'Challenge Stockfish AI' },
  { href: '/openings',  icon: '📖', label: 'Opening Explorer',  desc: 'Learn 20+ openings' },
  { href: '/endgames',  icon: '♟',  label: 'Endgame Practice',  desc: '7 essential endgames' },
  { href: '/puzzles',   icon: '🧩', label: 'Tactics Puzzles',   desc: 'Sharpen your tactics' },
]

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen]     = useState(false)
  const [learnOpen, setLearnOpen]           = useState(false)
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [mobilelearnOpen, setMobileLearnOpen] = useState(false)
  const [user, setUser]                     = useState<any>(null)
  const [loggedIn, setLoggedIn]             = useState(false)
  const [scrolled, setScrolled]             = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const learnRef    = useRef<HTMLDivElement>(null)
  const pathname    = usePathname()

  useEffect(() => {
    const logged = isLoggedIn()
    setLoggedIn(logged)
    if (logged) setUser(getUser())
  }, [])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
      if (learnRef.current    && !learnRef.current.contains(e.target as Node))    setLearnOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function getTitleBadge(elo: number) {
    if (elo >= 2400) return { label: 'GM',           color: '#f59e0b' }
    if (elo >= 2000) return { label: 'Expert',       color: '#8b5cf6' }
    if (elo >= 1800) return { label: 'Club',         color: '#3b82f6' }
    if (elo >= 1500) return { label: 'Intermediate', color: '#22c55e' }
    return { label: 'Beginner', color: '#6b7a8d' }
  }

  const badge = user ? getTitleBadge(user.eloRating || 1200) : null

  return (
    <>
      <style>{`
        .nav-link {
          position: relative;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 50%; right: 50%;
          height: 2px;
          background: #c9a84c;
          border-radius: 1px;
          transition: left 0.2s ease, right 0.2s ease;
        }
        .nav-link:hover { color: #c9a84c !important; }
        .nav-link:hover::after { left: 0.5rem; right: 0.5rem; }
        .nav-link-active::after { left: 0.5rem !important; right: 0.5rem !important; }
        .nav-active-dot {
          position: absolute; bottom: -7px; left: 50%;
          transform: translateX(-50%);
          width: 4px; height: 4px; border-radius: 50%;
          background: #c9a84c;
        }
        .nav-dropdown {
          background: rgba(8,18,34,0.97);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.06);
          overflow: hidden;
          backdrop-filter: blur(12px);
        }
        .dropdown-item {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.1rem;
          color: #9aa5b4; font-size: 0.875rem; text-decoration: none;
          transition: all 0.15s; cursor: pointer;
          background: none; border: none; width: 100%;
          text-align: left; font-family: var(--font-crimson), Georgia, serif;
        }
        .dropdown-item:hover { background: rgba(201,168,76,0.1); color: #c9a84c; }
        .learn-item {
          display: flex; align-items: flex-start; gap: 0.65rem;
          padding: 0.65rem 1rem; text-decoration: none;
          transition: all 0.15s; border-radius: 6px; margin: 0.2rem;
        }
        .learn-item:hover { background: rgba(201,168,76,0.1); }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-enter { animation: dropdownIn 0.15s ease; }
        .avatar-btn:hover .avatar-ring { border-color: #c9a84c !important; box-shadow: 0 0 0 2px rgba(201,168,76,0.25) !important; }
        .nav-play-btn {
          background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%);
          color: #0a1628; border: none; border-radius: 6px;
          padding: 0.38rem 1rem; font-size: 0.85rem; font-weight: 700;
          cursor: pointer; text-decoration: none; display: inline-block;
          font-family: var(--font-playfair), Georgia, serif;
          transition: filter 0.2s, transform 0.2s;
          box-shadow: 0 2px 12px rgba(201,168,76,0.3);
          white-space: nowrap;
        }
        .nav-play-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .mobile-menu { display: none; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .mobile-menu.open {
          display: flex; flex-direction: column;
          position: fixed; top: 56px; right: 0; bottom: 0; width: 260px;
          background: rgba(8,18,34,0.98);
          border-left: 1px solid rgba(201,168,76,0.2);
          padding: 1.5rem 1rem; gap: 0.25rem;
          z-index: 200; backdrop-filter: blur(20px);
          animation: slideIn 0.2s ease;
          overflow-y: auto;
        }
        .mobile-link {
          color: #9aa5b4; text-decoration: none;
          padding: 0.7rem 0.75rem; border-radius: 8px;
          font-size: 0.95rem; font-family: var(--font-crimson), Georgia, serif;
          transition: all 0.15s; display: block;
        }
        .mobile-link:hover, .mobile-link.active { background: rgba(201,168,76,0.1); color: #c9a84c; }
        .mobile-sublabel {
          font-size: 0.72rem; color: #4a5568; padding: 0.4rem 0.75rem 0.2rem;
          text-transform: uppercase; letter-spacing: 0.08em;
        }
        .hamburger { display: none; }
        @media (max-width: 760px) {
          .nav-center { display: none !important; }
          .hamburger { display: flex !important; }
          .nav-play-desktop { display: none !important; }
        }
      `}</style>

      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <nav style={{
          height: '56px', background: 'rgba(10,22,40,0.85)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem', width: '100%', boxSizing: 'border-box',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
          transition: 'box-shadow 0.3s',
        }}>

          {/* Logo → / */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: '1.4rem', color: '#c9a84c', filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.5))', lineHeight: 1 }}>♛</span>
            <span style={{
              fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #c9a84c, #e8c86d, #c9a84c)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Chess Lobby
            </span>
          </Link>

          {/* Center nav */}
          <nav className="nav-center" style={{ display: 'flex', gap: '0.1rem' }}>
            {NAV_LINKS.map(({ href, label, hasDropdown }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              if (hasDropdown) {
                return (
                  <div key={href} ref={learnRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setLearnOpen(p => !p)}
                      className={`nav-link${active ? ' nav-link-active' : ''}`}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: active ? '#c9a84c' : '#9aa5b4',
                        padding: '0.4rem 0.75rem', borderRadius: '6px',
                        fontSize: '0.9rem', fontFamily: 'var(--font-crimson), Georgia, serif',
                        fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.25rem',
                      }}
                    >
                      {label}
                      <span style={{ fontSize: '0.55rem', color: '#4a5568', transition: 'transform 0.2s', transform: learnOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                      {active && <span className="nav-active-dot" />}
                    </button>
                    {learnOpen && (
                      <div className="nav-dropdown dropdown-enter" style={{ position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)', width: '220px', zIndex: 200, padding: '0.4rem 0' }}>
                        {LEARN_ITEMS.map(item => (
                          <Link key={item.href} href={item.href} className="learn-item" onClick={() => setLearnOpen(false)}>
                            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                            <div>
                              <div style={{ color: '#e8e0d0', fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</div>
                              <div style={{ color: '#4a5568', fontSize: '0.72rem' }}>{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={href} href={href}
                  className={`nav-link${active ? ' nav-link-active' : ''}`}
                  style={{
                    color: active ? '#c9a84c' : '#9aa5b4', textDecoration: 'none',
                    padding: '0.4rem 0.75rem', borderRadius: '6px',
                    fontSize: '0.9rem', fontFamily: 'var(--font-crimson), Georgia, serif',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                  {active && <span className="nav-active-dot" />}
                </Link>
              )
            })}
          </nav>

          {/* Right: user or guest buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {loggedIn && user ? (
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="avatar-btn"
                  onClick={() => setDropdownOpen(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div
                    className="avatar-ring"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(201,168,76,0.15)', border: '1.5px solid rgba(201,168,76,0.35)', color: '#c9a84c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-playfair), Georgia, serif', transition: 'border-color 0.2s, box-shadow 0.2s', flexShrink: 0 }}
                  >
                    {(user.username?.[0] || 'G').toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#e8e0d0', fontFamily: 'var(--font-crimson), Georgia, serif', lineHeight: 1 }}>
                      {user.username}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#c9a84c', fontFamily: 'monospace' }}>♟ {user.eloRating || 1200}</span>
                      {badge && (
                        <span style={{ fontSize: '0.6rem', color: badge.color, background: badge.color + '22', border: `1px solid ${badge.color}44`, padding: '0 0.3rem', borderRadius: '3px', lineHeight: '1.4' }}>{badge.label}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: '#4a5568', fontSize: '0.6rem', marginLeft: '0.1rem', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown dropdown-enter" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '185px', zIndex: 200 }}>
                    <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span>👤</span> Profile
                    </Link>
                    <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span>📜</span> Game History
                    </Link>
                    <div style={{ height: '1px', background: 'rgba(201,168,76,0.1)', margin: '0.2rem 0' }} />
                    <Link href="/play-bot" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span>🤖</span> Play vs Computer
                    </Link>
                    <Link href="/openings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span>📖</span> Opening Explorer
                    </Link>
                    <Link href="/endgames" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span>♟</span> Endgame Practice
                    </Link>
                    <div style={{ height: '1px', background: 'rgba(201,168,76,0.1)', margin: '0.2rem 0' }} />
                    <button className="dropdown-item" style={{ color: '#ef4444' }} onClick={() => { setDropdownOpen(false); clearAuth(); window.location.href = '/' }}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/lobby"
                  className="nav-play-btn nav-play-desktop"
                >
                  Play Now
                </Link>
                <Link
                  href="/login"
                  style={{
                    border: '1px solid rgba(201,168,76,0.5)', color: '#c9a84c',
                    padding: '0.38rem 1rem', borderRadius: '6px', textDecoration: 'none',
                    fontSize: '0.85rem', transition: 'all 0.2s', display: 'inline-block',
                    fontFamily: 'var(--font-crimson), Georgia, serif', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(201,168,76,0.1)'; el.style.borderColor = '#c9a84c' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(201,168,76,0.5)' }}
                >
                  Sign In
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button
              className="hamburger"
              onClick={() => setMobileOpen(p => !p)}
              style={{ background: 'transparent', border: 'none', color: '#c9a84c', fontSize: '1.2rem', cursor: 'pointer', padding: '0.3rem', display: 'none' }}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {/* Gradient border line */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)' }} />

        {/* Mobile menu */}
        <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
          {NAV_LINKS.filter(l => !l.hasDropdown).map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={`mobile-link${active ? ' active' : ''}`} onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            )
          })}
          {/* Learn section in mobile */}
          <button
            className="mobile-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: pathname.startsWith('/learn') || pathname.startsWith('/openings') || pathname.startsWith('/endgames') || pathname.startsWith('/puzzles') ? '#c9a84c' : '#9aa5b4' }}
            onClick={() => setMobileLearnOpen(p => !p)}
          >
            <span>Learn</span>
            <span style={{ fontSize: '0.65rem', color: '#4a5568' }}>{mobilelearnOpen ? '▲' : '▼'}</span>
          </button>
          {mobilelearnOpen && (
            <div style={{ paddingLeft: '0.75rem' }}>
              {LEARN_ITEMS.map(item => (
                <Link key={item.href} href={item.href} className="mobile-link" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setMobileOpen(false)}>
                  <span>{item.icon}</span> {item.label}
                </Link>
              ))}
            </div>
          )}
          <div style={{ height: '1px', background: 'rgba(201,168,76,0.15)', margin: '0.5rem 0' }} />
          {loggedIn ? (
            <>
              <Link href="/profile" className="mobile-link" onClick={() => setMobileOpen(false)}>Profile</Link>
              <button className="mobile-link" style={{ color: '#ef4444', textAlign: 'left', cursor: 'pointer', border: 'none', background: 'none' }} onClick={() => { clearAuth(); window.location.href = '/' }}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/lobby" className="mobile-link" style={{ color: '#c9a84c', fontWeight: 700 }} onClick={() => setMobileOpen(false)}>Play Now</Link>
              <Link href="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>Sign In</Link>
            </>
          )}
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.4)' }} />
        )}
      </div>
    </>
  )
}
