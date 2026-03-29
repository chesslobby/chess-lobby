'use client'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/lobby',       label: 'Play' },
  { href: '/puzzles',     label: 'Puzzles' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile',     label: 'Profile' },
]

export default function Navbar() {
  const [signInHover, setSignInHover] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <style>{`
        .nav-link { transition: background 0.2s; }
        .nav-link:hover { background: rgba(201,168,76,0.1) !important; }
        .nav-signin:hover { background: rgba(201,168,76,0.1) !important; border-color: #c9a84c !important; }
      `}</style>

      <nav
        style={{
          height: '56px',
          background: 'rgba(10,22,40,0.97)',
          borderBottom: '1px solid rgba(201,168,76,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
          <span style={{ fontSize: '1.4rem', color: '#c9a84c' }}>♛</span>
          <span style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.1rem', color: '#c9a84c', letterSpacing: '0.05em' }}>
            Chess Lobby
          </span>
        </Link>

        {/* Center: Nav links */}
        <nav style={{ display: 'flex', gap: '0.15rem' }}>
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="nav-link"
                style={{
                  color: active ? '#c9a84c' : '#e8e0d0',
                  textDecoration: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  fontFamily: 'var(--font-crimson), Georgia, serif',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Sign In */}
        <Link
          href="/login"
          className="nav-signin"
          onMouseEnter={() => setSignInHover(true)}
          onMouseLeave={() => setSignInHover(false)}
          style={{
            border: '1px solid rgba(201,168,76,0.6)',
            color: '#c9a84c',
            padding: '0.4rem 1.2rem',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '0.88rem',
            transition: 'all 0.2s',
            display: 'inline-block',
            background: signInHover ? 'rgba(201,168,76,0.1)' : 'transparent',
            fontFamily: 'var(--font-crimson), Georgia, serif',
          }}
        >
          Sign In
        </Link>
      </nav>
    </>
  )
}
