'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes crownGlow {
          0%, 100% { text-shadow: 0 0 24px rgba(201,168,76,0.6), 0 0 48px rgba(201,168,76,0.3); }
          50%       { text-shadow: 0 0 40px rgba(201,168,76,0.9), 0 0 80px rgba(201,168,76,0.5); }
        }
        .fade-in { animation: fadeInUp 0.8s ease both; }
        .fade-in-1 { animation: fadeInUp 0.8s ease 0.1s both; }
        .fade-in-2 { animation: fadeInUp 0.8s ease 0.25s both; }
        .fade-in-3 { animation: fadeInUp 0.8s ease 0.4s both; }
        .fade-in-4 { animation: fadeInUp 0.8s ease 0.55s both; }
        .fade-in-5 { animation: fadeInUp 0.8s ease 0.7s both; }
        .crown     { animation: crownGlow 3s ease-in-out infinite; }

        .btn-gold {
          background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%);
          color: #0a1628;
          border: none;
          padding: 1rem 3rem;
          border-radius: 8px;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(201,168,76,0.4);
          font-family: var(--font-playfair), Georgia, serif;
          text-decoration: none;
          display: inline-block;
        }
        .btn-gold:hover {
          filter: brightness(1.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(201,168,76,0.55);
        }

        .btn-outline {
          background: transparent;
          color: #e8c97a;
          border: 2px solid #c9a84c;
          padding: 1rem 3rem;
          border-radius: 8px;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          font-family: var(--font-playfair), Georgia, serif;
          text-decoration: none;
          display: inline-block;
        }
        .btn-outline:hover {
          background: rgba(201,168,76,0.12);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(201,168,76,0.2);
        }

        .pill {
          border: 1px solid rgba(201,168,76,0.45);
          background: rgba(201,168,76,0.07);
          color: #c9a84c;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }

        /* Chess board pattern */
        .chess-pattern {
          background-image:
            repeating-conic-gradient(rgba(201,168,76,0.08) 0% 25%, transparent 0% 50%);
          background-size: 64px 64px;
        }
      `}</style>

      <main
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#0a1628',
        }}
      >
        {/* Chess pattern layer */}
        <div
          className="chess-pattern"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />

        {/* Radial dark overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background:
              'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(10,22,40,0.6) 0%, rgba(10,22,40,0.88) 55%, rgba(10,22,40,0.98) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2rem 1.5rem',
            maxWidth: '680px',
            width: '100%',
          }}
        >
          {/* Crown */}
          <div className="fade-in crown" style={{ fontSize: '6rem', lineHeight: 1, marginBottom: '1rem', userSelect: 'none' }}>
            ♔
          </div>

          {/* Title */}
          <h1
            className="fade-in-1"
            style={{
              fontFamily: 'var(--font-playfair), Georgia, serif',
              fontSize: 'clamp(2.8rem, 7vw, 4rem)',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#c9a84c',
              margin: '0 0 0.6rem 0',
              lineHeight: 1.1,
            }}
          >
            Chess Lobby
          </h1>

          {/* Divider */}
          <div
            className="fade-in-1"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              margin: '0.5rem 0 1.2rem',
              width: '100%',
              maxWidth: '340px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #c9a84c)' }} />
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.45em', textTransform: 'uppercase', color: '#8b6914' }}>Est. 2026</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>

          {/* Subtitle */}
          <p
            className="fade-in-2"
            style={{
              fontFamily: 'var(--font-crimson), Georgia, serif',
              fontSize: '1.4rem',
              color: '#9aa5b4',
              margin: '0 0 2rem 0',
              letterSpacing: '0.06em',
            }}
          >
            Play Chess.&ensp;Talk.&ensp;Win.
          </p>

          {/* Feature pills */}
          <div
            className="fade-in-2"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center', marginBottom: '2.5rem' }}
          >
            <span className="pill">🎙️ Voice Chat</span>
            <span className="pill">💬 Live Chat</span>
            <span className="pill">🏆 Elo Ranking</span>
          </div>

          {/* Buttons */}
          <div
            className="fade-in-3"
            style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '1.25rem' }}
          >
            <Link href="/play" className="btn-gold">Play Now</Link>
            <Link href="/auth/signin" className="btn-outline">Sign In</Link>
          </div>

          {/* Guest note */}
          <p
            className="fade-in-4"
            style={{ fontSize: '0.82rem', color: '#4a5568', margin: '0 0 0 0', letterSpacing: '0.03em' }}
          >
            No account needed — play as guest
          </p>
        </div>

        {/* Footer */}
        <footer
          className="fade-in-5"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingBottom: '1.5rem',
          }}
        >
          <div style={{ width: '160px', height: '1px', background: 'linear-gradient(to right, transparent, #c9a84c, transparent)', marginBottom: '0.75rem' }} />
          <span style={{ fontSize: '0.75rem', color: '#4a5568', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Web &bull; Android &bull; Cross-Platform
          </span>
        </footer>
      </main>
    </>
  )
}
