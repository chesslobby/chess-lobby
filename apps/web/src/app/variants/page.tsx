'use client'
// @ts-nocheck
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const VARIANTS = [
  {
    id: 'standard',
    name: 'Standard Chess',
    icon: '♔',
    description: 'Classic chess with standard rules. The game as it was meant to be played.',
    color: '#c9a84c',
    available: true,
    href: '/lobby',
  },
  {
    id: 'chess960',
    name: 'Chess960 (Fischer Random)',
    icon: '🎲',
    description: 'Random starting position across 960 possibilities. Same rules, more surprises!',
    color: '#3498db',
    available: true,
    href: '/variants/960',
  },
  {
    id: 'crazyhouse',
    name: 'Crazyhouse',
    icon: '🏠',
    description: 'Captured pieces become yours to drop back on the board!',
    color: '#e74c3c',
    available: false,
    comingSoon: true,
  },
  {
    id: 'kingofthehill',
    name: 'King of the Hill',
    icon: '⛰️',
    description: 'Move your king to the center to win the game!',
    color: '#27ae60',
    available: false,
    comingSoon: true,
  },
  {
    id: 'threecheck',
    name: 'Three-Check',
    icon: '3️⃣',
    description: 'Give check 3 times to win. Attacking is everything!',
    color: '#9b59b6',
    available: false,
    comingSoon: true,
  },
  {
    id: 'antichess',
    name: 'Antichess',
    icon: '🔄',
    description: 'You MUST capture if possible. Lose all your pieces to win!',
    color: '#f39c12',
    available: false,
    comingSoon: true,
  },
]

export default function VariantsPage() {
  return (
    <>
      <style>{`
        .variant-card {
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 1.4rem;
          transition: all 0.15s;
          position: relative;
          overflow: hidden;
        }
        .variant-card.available {
          cursor: pointer;
          text-decoration: none;
          display: block;
          color: inherit;
        }
        .variant-card.available:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .variant-card.unavailable {
          opacity: 0.55;
        }
        .soon-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          background: rgba(255,255,255,0.08);
          color: #6b7a8d;
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          text-transform: uppercase;
        }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1rem' }}>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.75rem' }}>🎲</div>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '2.2rem', color: '#e8e0d0', margin: '0 0 0.5rem', fontWeight: 700 }}>
              Chess Variants
            </h1>
            <p style={{ color: '#4a5568', margin: 0, fontSize: '0.9rem' }}>
              Different ways to play chess — same board, new rules
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {VARIANTS.map(v => {
              const inner = (
                <>
                  {v.comingSoon && <span className="soon-badge">Coming Soon</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: `${v.color}22`,
                      border: `2px solid ${v.color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.8rem', flexShrink: 0,
                    }}>
                      {v.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontWeight: 700, color: '#e8e0d0', fontSize: '0.95rem', lineHeight: 1.3 }}>{v.name}</div>
                      {v.available && (
                        <div style={{ fontSize: '0.72rem', color: v.color, marginTop: '0.2rem', fontWeight: 600 }}>
                          ● Available now
                        </div>
                      )}
                    </div>
                  </div>
                  <p style={{ color: '#9aa5b4', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{v.description}</p>
                  {v.available && (
                    <div style={{ marginTop: '0.9rem', color: v.color, fontSize: '0.82rem', fontWeight: 700 }}>
                      Play now →
                    </div>
                  )}
                </>
              )

              if (v.available && v.href) {
                return (
                  <Link key={v.id} href={v.href} className="variant-card available" style={{ borderLeftColor: v.color, borderLeftWidth: '3px' }}>
                    {inner}
                  </Link>
                )
              }
              return (
                <div key={v.id} className="variant-card unavailable" style={{ borderLeftColor: v.color, borderLeftWidth: '3px' }}>
                  {inner}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center', color: '#374151', fontSize: '0.82rem' }}>
            More variants coming soon — suggest your favorite on Discord!
          </div>
        </div>
      </div>
    </>
  )
}
