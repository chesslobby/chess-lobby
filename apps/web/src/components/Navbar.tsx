'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [playHover, setPlayHover] = useState(false)
  const [lbHover, setLbHover] = useState(false)
  const [profileHover, setProfileHover] = useState(false)
  const [signInHover, setSignInHover] = useState(false)

  return (
    <>
      <style>{`
        .nav-link:hover { background: rgba(201,168,76,0.1); }
        .nav-signin:hover { background: rgba(201,168,76,0.1); border-color: #c9a84c; }
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
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              fontSize: '1.4rem',
              color: '#c9a84c',
            }}
          >
            ♛
          </span>
          <span
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: '1.1rem',
              color: '#c9a84c',
              letterSpacing: '0.05em',
            }}
          >
            Chess Lobby
          </span>
        </Link>

        {/* Center: Nav links */}
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          <Link
            href="/lobby"
            className="nav-link"
            onMouseEnter={() => setPlayHover(true)}
            onMouseLeave={() => setPlayHover(false)}
            style={{
              color: '#e8e0d0',
              textDecoration: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.92rem',
              transition: 'background 0.2s',
              background: playHover ? 'rgba(201,168,76,0.1)' : 'transparent',
              fontFamily: 'var(--font-crimson), Georgia, serif',
            }}
          >
            Play
          </Link>
          <Link
            href="/leaderboard"
            className="nav-link"
            onMouseEnter={() => setLbHover(true)}
            onMouseLeave={() => setLbHover(false)}
            style={{
              color: '#e8e0d0',
              textDecoration: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.92rem',
              transition: 'background 0.2s',
              background: lbHover ? 'rgba(201,168,76,0.1)' : 'transparent',
              fontFamily: 'var(--font-crimson), Georgia, serif',
            }}
          >
            Leaderboard
          </Link>
          <Link
            href="/profile"
            className="nav-link"
            onMouseEnter={() => setProfileHover(true)}
            onMouseLeave={() => setProfileHover(false)}
            style={{
              color: '#e8e0d0',
              textDecoration: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.92rem',
              transition: 'background 0.2s',
              background: profileHover ? 'rgba(201,168,76,0.1)' : 'transparent',
              fontFamily: 'var(--font-crimson), Georgia, serif',
            }}
          >
            Profile
          </Link>
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
