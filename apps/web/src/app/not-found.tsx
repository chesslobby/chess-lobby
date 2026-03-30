'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <style>{`
        .chess-bg {
          background-image: repeating-conic-gradient(rgba(201,168,76,0.06) 0% 25%, transparent 0% 50%);
          background-size: 64px 64px;
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        .float { animation: float 3s ease-in-out infinite; }
      `}</style>
      <div className="chess-bg" style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: '2rem', textAlign: 'center' }}>
        <div className="float" style={{ fontSize: '5rem', color: '#c9a84c', marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.5))' }}>♟️</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem,6vw,3rem)', color: '#c9a84c', margin: '0 0 0.5rem', fontWeight: 700 }}>404</h1>
        <h2 style={{ color: '#e8e0d0', fontSize: '1.3rem', margin: '0 0 0.75rem', fontWeight: 400 }}>This square is empty</h2>
        <p style={{ color: '#4a5568', fontSize: '0.95rem', margin: '0 0 2rem', maxWidth: 380 }}>
          The page you're looking for has moved, been captured, or never existed. Time to make a new move.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" style={{ background: 'linear-gradient(135deg,#e8c97a,#c9a84c,#a07828)', color: '#0a1628', padding: '0.85rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            ♛ Go Home
          </Link>
          <Link href="/lobby" style={{ background: 'transparent', color: '#c9a84c', border: '2px solid #c9a84c', padding: '0.85rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            ▶ Play a Game
          </Link>
        </div>
      </div>
    </>
  )
}
