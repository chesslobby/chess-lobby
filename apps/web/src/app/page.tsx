'use client'

import Link from 'next/link'

const FLOAT_PIECES = [
  { piece: '♟', left: '8%',  dur: '14s', delay: '0s',   size: '2rem'   },
  { piece: '♞', left: '22%', dur: '18s', delay: '3s',   size: '2.4rem' },
  { piece: '♝', left: '45%', dur: '12s', delay: '1.5s', size: '1.8rem' },
  { piece: '♜', left: '67%', dur: '20s', delay: '5s',   size: '2.2rem' },
  { piece: '♛', left: '85%', dur: '15s', delay: '2s',   size: '2.6rem' },
]

const HOW_IT_WORKS = [
  { icon: '🎮', title: 'Create or Join',     desc: 'Start a quick match or invite a friend with a private room code.' },
  { icon: '♟',  title: 'Play in Real-Time',  desc: 'Full chess with move validation, clocks, and live board updates.' },
  { icon: '🎙️', title: 'Chat & Voice',        desc: 'Talk trash or make friends — in-game chat and voice built right in.' },
]

const STATS = [
  { value: '1,200+', label: 'Games Played' },
  { value: '500+',   label: 'Players'       },
  { value: '3',      label: 'Platforms'     },
]

export default function HomePage() {
  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes crownGlow {
          0%,100% { text-shadow: 0 0 24px rgba(201,168,76,0.6), 0 0 48px rgba(201,168,76,0.3); }
          50%      { text-shadow: 0 0 40px rgba(201,168,76,0.9), 0 0 80px rgba(201,168,76,0.5); }
        }
        @keyframes floatUp {
          0%   { transform: translateY(110vh) rotate(0deg);   opacity: 0;    }
          8%   { opacity: 0.1; }
          92%  { opacity: 0.1; }
          100% { transform: translateY(-10vh) rotate(20deg); opacity: 0;    }
        }
        .fade-in   { animation: fadeInUp 0.8s ease both; }
        .fade-in-1 { animation: fadeInUp 0.8s ease 0.1s both; }
        .fade-in-2 { animation: fadeInUp 0.8s ease 0.25s both; }
        .fade-in-3 { animation: fadeInUp 0.8s ease 0.4s both; }
        .fade-in-4 { animation: fadeInUp 0.8s ease 0.55s both; }
        .fade-in-5 { animation: fadeInUp 0.8s ease 0.7s both; }
        .fade-in-6 { animation: fadeInUp 0.8s ease 0.85s both; }
        .fade-in-7 { animation: fadeInUp 0.8s ease 1s both; }
        .crown { animation: crownGlow 3s ease-in-out infinite; }

        .btn-gold {
          background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%);
          color: #0a1628; border: none; padding: 1rem 3rem; border-radius: 8px;
          font-size: 1.05rem; font-weight: 700; letter-spacing: 0.05em;
          cursor: pointer; transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(201,168,76,0.4);
          font-family: var(--font-playfair), Georgia, serif;
          text-decoration: none; display: inline-block;
        }
        .btn-gold:hover { filter: brightness(1.12); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(201,168,76,0.55); }

        .btn-outline {
          background: transparent; color: #e8c97a; border: 2px solid #c9a84c;
          padding: 1rem 3rem; border-radius: 8px; font-size: 1.05rem;
          font-weight: 700; letter-spacing: 0.05em; cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          font-family: var(--font-playfair), Georgia, serif;
          text-decoration: none; display: inline-block;
        }
        .btn-outline:hover { background: rgba(201,168,76,0.12); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(201,168,76,0.2); }

        .pill {
          border: 1px solid rgba(201,168,76,0.45); background: rgba(201,168,76,0.07);
          color: #c9a84c; padding: 0.35rem 1rem; border-radius: 999px;
          font-size: 0.85rem; letter-spacing: 0.03em; white-space: nowrap;
        }
        .chess-pattern {
          background-image: repeating-conic-gradient(rgba(201,168,76,0.07) 0% 25%, transparent 0% 50%);
          background-size: 64px 64px;
        }
        .how-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 14px; padding: 1.75rem 1.5rem;
          flex: 1; min-width: 0; text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .how-card:hover { border-color: rgba(201,168,76,0.55); box-shadow: 0 4px 24px rgba(201,168,76,0.12); }
        .stat-card {
          text-align: center; flex: 1;
        }
      `}</style>

      <main style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', backgroundColor:'#0a1628', overflow:'hidden' }}>

        {/* Chess pattern */}
        <div className="chess-pattern" style={{ position:'absolute', inset:0, zIndex:0 }} />

        {/* Dark overlay */}
        <div style={{ position:'absolute', inset:0, zIndex:1, background:'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(10,22,40,0.5) 0%, rgba(10,22,40,0.85) 55%, rgba(10,22,40,0.98) 100%)' }} />

        {/* Floating pieces */}
        {FLOAT_PIECES.map((fp, i) => (
          <div key={i} style={{ position:'absolute', left:fp.left, bottom:'-10vh', fontSize:fp.size, color:'rgba(201,168,76,0.18)', zIndex:1, userSelect:'none', animation:`floatUp ${fp.dur} linear ${fp.delay} infinite`, pointerEvents:'none' }}>
            {fp.piece}
          </div>
        ))}

        {/* ── Hero ───────────────────────────────────────── */}
        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'4rem 1.5rem 3rem', maxWidth:'680px', width:'100%' }}>

          <div className="fade-in crown" style={{ fontSize:'6rem', lineHeight:1, marginBottom:'1rem', userSelect:'none' }}>♔</div>

          <h1 className="fade-in-1" style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'clamp(2.8rem,7vw,4rem)', fontWeight:700, letterSpacing:'0.04em', color:'#c9a84c', margin:'0 0 0.6rem', lineHeight:1.1 }}>
            Chess Lobby
          </h1>

          <div className="fade-in-1" style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'0.5rem 0 1.2rem', width:'100%', maxWidth:'340px' }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right, transparent, #c9a84c)' }} />
            <span style={{ fontSize:'0.65rem', letterSpacing:'0.45em', textTransform:'uppercase', color:'#8b6914' }}>Est. 2026</span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>

          <p className="fade-in-2" style={{ fontFamily:'var(--font-crimson),Georgia,serif', fontSize:'1.4rem', color:'#9aa5b4', margin:'0 0 2rem', letterSpacing:'0.06em' }}>
            Play Chess.&ensp;Talk.&ensp;Win.
          </p>

          <div className="fade-in-2" style={{ display:'flex', flexWrap:'wrap', gap:'0.6rem', justifyContent:'center', marginBottom:'2.5rem' }}>
            <span className="pill">🎙️ Voice Chat</span>
            <span className="pill">💬 Live Chat</span>
            <span className="pill">🏆 Elo Ranking</span>
          </div>

          <div className="fade-in-3" style={{ display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center', marginBottom:'1.25rem' }}>
            <Link href="/lobby" className="btn-gold">Play Now</Link>
            <Link href="/login" className="btn-outline">Sign In</Link>
          </div>

          <p className="fade-in-4" style={{ fontSize:'0.82rem', color:'#4a5568', margin:0, letterSpacing:'0.03em' }}>
            No account needed — play as guest
          </p>
        </div>

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="fade-in-5" style={{ position:'relative', zIndex:2, display:'flex', gap:'0', width:'100%', maxWidth:'600px', padding:'0 1.5rem', marginBottom:'4rem' }}>
          {STATS.map((s, i) => (
            <div key={i} className="stat-card" style={{ borderRight: i < STATS.length - 1 ? '1px solid rgba(201,168,76,0.2)' : 'none', padding:'0 1.5rem' }}>
              <div style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.8rem', fontWeight:700, color:'#c9a84c', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.8rem', color:'#4a5568', marginTop:'0.3rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── How it works ────────────────────────────────── */}
        <div className="fade-in-6" style={{ position:'relative', zIndex:2, width:'100%', maxWidth:'900px', padding:'0 1.5rem', marginBottom:'5rem' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', justifyContent:'center', marginBottom:'0.5rem' }}>
              <div style={{ width:'40px', height:'1px', background:'linear-gradient(to right, transparent, rgba(201,168,76,0.5))' }} />
              <span style={{ fontSize:'0.7rem', letterSpacing:'0.35em', textTransform:'uppercase', color:'#8b6914' }}>How it works</span>
              <div style={{ width:'40px', height:'1px', background:'linear-gradient(to left, transparent, rgba(201,168,76,0.5))' }} />
            </div>
            <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.6rem', color:'#e8e0d0', margin:0 }}>Three steps to glory</h2>
          </div>

          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="how-card">
                <div style={{ fontSize:'2.2rem', marginBottom:'0.75rem' }}>{step.icon}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
                  <span style={{ width:'20px', height:'20px', borderRadius:'50%', background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.3)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', color:'#c9a84c', fontFamily:'monospace', flexShrink:0 }}>{i + 1}</span>
                  <h3 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1rem', color:'#e8e0d0', margin:0 }}>{step.title}</h3>
                </div>
                <p style={{ fontSize:'0.88rem', color:'#9aa5b4', margin:0, lineHeight:1.55 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="fade-in-7" style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', paddingBottom:'2rem' }}>
          <div style={{ width:'160px', height:'1px', background:'linear-gradient(to right, transparent, #c9a84c, transparent)', marginBottom:'0.75rem' }} />
          <span style={{ fontSize:'0.75rem', color:'#4a5568', letterSpacing:'0.2em', textTransform:'uppercase' }}>
            Web &bull; Android &bull; Cross-Platform
          </span>
        </footer>
      </main>
    </>
  )
}
