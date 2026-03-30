'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const FEATURES = [
  { icon: '♟️', label: 'Real-time multiplayer chess' },
  { icon: '🎙️', label: 'Voice chat during games' },
  { icon: '🤖', label: 'AI bot opponent (6 difficulty levels)' },
  { icon: '🏆', label: 'Tournaments — Arena & Swiss formats' },
  { icon: '🧩', label: 'Daily puzzles & Puzzle Rush' },
  { icon: '📊', label: 'Game analysis with Stockfish engine' },
  { icon: '📖', label: 'Opening explorer (60+ openings)' },
  { icon: '🌍', label: 'Global leaderboard & Elo ratings' },
]

const TECH_STACK = [
  { label: 'Frontend', value: 'Next.js 14, React, TypeScript' },
  { label: 'Backend', value: 'Fastify, Socket.IO, WebRTC' },
  { label: 'Database', value: 'Supabase (PostgreSQL)' },
  { label: 'Chess Engine', value: 'Stockfish WASM (browser-side)' },
  { label: 'Hosting', value: 'Vercel (web) + Render (server)' },
  { label: 'Auth', value: 'JWT + Google OAuth via Supabase' },
]

export default function AboutPage() {
  return (
    <>
      <style>{`
        .about-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(201,168,76,0.15); border-radius: 12px; padding: 1.75rem; margin-bottom: 1.5rem; }
        .feature-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .feature-item:last-child { border-bottom: none; }
        .tech-row { display: flex; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.88rem; }
        .tech-row:last-child { border-bottom: none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
        @keyframes glow { 0%,100%{filter:drop-shadow(0 0 18px rgba(201,168,76,0.25))} 50%{filter:drop-shadow(0 0 32px rgba(201,168,76,0.5))} }
        .logo-glow { animation: glow 3s ease-in-out infinite; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 3rem' }}>
          <Link href="/" style={{ color: '#4a5568', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: '1.75rem' }}>
            ← Back to Home
          </Link>

          {/* Hero */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="logo-glow" style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem' }}>♛</div>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: 'clamp(2rem,5vw,2.8rem)', color: '#c9a84c', margin: '0 0 0.5rem', fontWeight: 700 }}>
              About Chess Lobby
            </h1>
            <p style={{ color: '#9aa5b4', fontSize: '1.1rem', margin: 0, fontStyle: 'italic' }}>
              Where chess meets conversation
            </p>
          </div>

          {/* What is Chess Lobby */}
          <div className="about-card fade-up">
            <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#c9a84c', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.85rem' }}>
              What is Chess Lobby?
            </h2>
            <p style={{ color: '#9aa5b4', fontSize: '0.95rem', lineHeight: 1.75, margin: 0 }}>
              Chess Lobby is a free online chess platform with real-time voice chat. Play against friends or
              strangers around the world, join tournaments, solve daily puzzles, and improve your game with
              AI-powered analysis. No download required — everything runs in your browser.
            </p>
          </div>

          {/* Features */}
          <div className="about-card fade-up">
            <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#c9a84c', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.85rem' }}>
              Features
            </h2>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-item">
                <span style={{ fontSize: '1.3rem', flexShrink: 0, width: 28, textAlign: 'center' }}>{f.icon}</span>
                <span style={{ color: '#e8e0d0', fontSize: '0.92rem' }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="about-card fade-up" style={{ borderLeft: '3px solid #c9a84c', background: 'rgba(201,168,76,0.04)' }}>
            <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#c9a84c', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.85rem' }}>
              Our Mission
            </h2>
            <blockquote style={{ margin: 0, padding: 0, borderLeft: 'none' }}>
              <p style={{ color: '#e8e0d0', fontSize: '1rem', lineHeight: 1.75, margin: '0 0 0.75rem', fontStyle: 'italic' }}>
                "We believe chess is more fun when you can talk to your opponent. Chess Lobby combines the
                strategy of chess with the social experience of voice chat, making every game more
                memorable — win or lose."
              </p>
            </blockquote>
          </div>

          {/* Technology */}
          <div className="about-card fade-up">
            <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#c9a84c', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.85rem' }}>
              Technology
            </h2>
            {TECH_STACK.map((t, i) => (
              <div key={i} className="tech-row">
                <span style={{ color: '#4a5568', minWidth: 100, flexShrink: 0 }}>{t.label}</span>
                <span style={{ color: '#e8e0d0' }}>{t.value}</span>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="about-card fade-up">
            <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#c9a84c', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.85rem' }}>
              Contact & Support
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ color: '#4a5568' }}>Email: </span>
                <a href="mailto:chesslobby.play@gmail.com" style={{ color: '#c9a84c', textDecoration: 'none' }}>chesslobby.play@gmail.com</a>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <span style={{ color: '#4a5568' }}>Website: </span>
                <span style={{ color: '#e8e0d0' }}>chesslobby.in</span>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="fade-up" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link
              href="/lobby"
              style={{ background: 'linear-gradient(135deg,#e8c97a,#c9a84c)', color: '#0a1628', borderRadius: 10, padding: '0.9rem 2.5rem', fontFamily: 'var(--font-playfair),Georgia,serif', fontWeight: 700, fontSize: '1.05rem', textDecoration: 'none', display: 'inline-block' }}
            >
              Play Now →
            </Link>
            <Link
              href="/leaderboard"
              style={{ background: 'transparent', color: '#c9a84c', border: '1.5px solid rgba(201,168,76,0.5)', borderRadius: 10, padding: '0.9rem 2rem', fontFamily: 'var(--font-playfair),Georgia,serif', fontWeight: 600, fontSize: '1rem', textDecoration: 'none', display: 'inline-block' }}
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
