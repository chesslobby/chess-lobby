'use client'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-6px); }
          75%      { transform: translateX(6px); }
        }
        .shake-once { animation: shake 0.5s ease; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', padding: '2rem', textAlign: 'center' }}>
        <div className="shake-once" style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ color: '#c9a84c', fontSize: '1.8rem', margin: '0 0 0.5rem', fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: '#9aa5b4', fontSize: '0.95rem', margin: '0 0 0.5rem', maxWidth: 360 }}>
          The game encountered an error. Don't worry — your position is saved.
        </p>
        {error?.message && (
          <p style={{ color: '#4a5568', fontSize: '0.78rem', margin: '0 0 2rem', fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', padding: '0.5rem 1rem', borderRadius: 6, maxWidth: 400 }}>
            {error.message}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={reset} style={{ background: 'linear-gradient(135deg,#e8c97a,#c9a84c,#a07828)', color: '#0a1628', padding: '0.85rem 2rem', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '1rem' }}>
            🔄 Try Again
          </button>
          <Link href="/" style={{ background: 'transparent', color: '#c9a84c', border: '2px solid #c9a84c', padding: '0.85rem 2rem', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            ♛ Go Home
          </Link>
        </div>
      </div>
    </>
  )
}
