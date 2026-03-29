'use client'

import Link from 'next/link'

const FLOAT_PIECES = [
  { piece: '♟', left: '8%',  dur: '14s', delay: '0s',   size: '2rem'   },
  { piece: '♞', left: '22%', dur: '18s', delay: '3s',   size: '2.4rem' },
  { piece: '♝', left: '45%', dur: '12s', delay: '1.5s', size: '1.8rem' },
  { piece: '♜', left: '67%', dur: '20s', delay: '5s',   size: '2.2rem' },
  { piece: '♛', left: '85%', dur: '15s', delay: '2s',   size: '2.6rem' },
]

// 20 scattered star particles
const STARS = [
  { left: '5%',  top: '10%', dur: '3.2s', delay: '0s'    },
  { left: '12%', top: '35%', dur: '2.8s', delay: '0.5s'  },
  { left: '18%', top: '65%', dur: '4.1s', delay: '1.2s'  },
  { left: '25%', top: '20%', dur: '3.5s', delay: '0.8s'  },
  { left: '32%', top: '80%', dur: '2.6s', delay: '2.0s'  },
  { left: '38%', top: '45%', dur: '3.8s', delay: '0.3s'  },
  { left: '44%', top: '15%', dur: '2.9s', delay: '1.5s'  },
  { left: '50%', top: '70%', dur: '4.3s', delay: '0.7s'  },
  { left: '57%', top: '30%', dur: '3.1s', delay: '2.3s'  },
  { left: '63%', top: '55%', dur: '2.7s', delay: '0.9s'  },
  { left: '70%', top: '8%',  dur: '3.9s', delay: '1.8s'  },
  { left: '75%', top: '42%', dur: '2.5s', delay: '0.4s'  },
  { left: '80%', top: '78%', dur: '3.4s', delay: '1.1s'  },
  { left: '87%', top: '25%', dur: '4.0s', delay: '2.6s'  },
  { left: '92%', top: '60%', dur: '2.8s', delay: '0.6s'  },
  { left: '95%', top: '85%', dur: '3.6s', delay: '1.9s'  },
  { left: '15%', top: '90%', dur: '3.0s', delay: '2.1s'  },
  { left: '55%', top: '92%', dur: '4.2s', delay: '0.2s'  },
  { left: '72%', top: '88%', dur: '2.9s', delay: '1.6s'  },
  { left: '40%', top: '5%',  dur: '3.3s', delay: '2.4s'  },
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
        @keyframes twinkle {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(1.4); }
        }
        @keyframes bgShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes typewriter {
          from { width: 0; }
          to   { width: 100%; }
        }
        @keyframes blink {
          0%, 100% { border-color: transparent; }
          50%       { border-color: #c9a84c; }
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
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 14px; padding: 1.75rem 1.5rem;
          flex: 1; min-width: 0; text-align: center;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          backdrop-filter: blur(10px);
        }
        .how-card:hover { border-color: rgba(201,168,76,0.6); box-shadow: 0 8px 32px rgba(201,168,76,0.15); transform: translateY(-4px); }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 12px; padding: 1.35rem 1.2rem;
          text-decoration: none; display: flex; flex-direction: column;
          gap: 0.4rem; align-items: flex-start;
          transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          border-color: rgba(201,168,76,0.45);
          background: rgba(255,255,255,0.06);
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.3);
        }
        .btn-learn {
          background: transparent; color: #c9a84c;
          border: 1.5px solid rgba(201,168,76,0.5);
          padding: 0.7rem 2rem; border-radius: 8px;
          font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em;
          cursor: pointer; transition: background 0.2s, transform 0.2s;
          font-family: var(--font-playfair), Georgia, serif;
          text-decoration: none; display: inline-block;
        }
        .btn-learn:hover { background: rgba(201,168,76,0.1); transform: translateY(-2px); }
        @media (max-width: 640px) {
          .feature-grid { grid-template-columns: 1fr 1fr !important; }
        }
        .stat-card {
          text-align: center; flex: 1;
        }

        @media (max-width: 640px) {
          .hero-title { font-size: clamp(2rem,10vw,2.8rem) !important; }
          .hero-crown { font-size: 4rem !important; }
          .cta-buttons { flex-direction: column !important; align-items: stretch !important; }
          .cta-buttons a { text-align: center !important; }
          .how-cards { flex-direction: column !important; }
          .stats-row { gap: 0 !important; }
        }
      `}</style>

      <main style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', backgroundColor:'#0a1628', overflow:'hidden' }}>

        {/* Chess pattern */}
        <div className="chess-pattern" style={{ position:'absolute', inset:0, zIndex:0 }} />

        {/* Animated gradient background blobs */}
        <div style={{ position:'absolute', inset:0, zIndex:0, background:'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(30,50,90,0.5) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(60,30,80,0.3) 0%, transparent 60%)', animation:'bgShift 12s ease infinite', backgroundSize:'200% 200%', pointerEvents:'none' }} />

        {/* Dark overlay */}
        <div style={{ position:'absolute', inset:0, zIndex:1, background:'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(10,22,40,0.5) 0%, rgba(10,22,40,0.85) 55%, rgba(10,22,40,0.98) 100%)' }} />

        {/* Star particles */}
        {STARS.map((s, i) => (
          <div key={`star-${i}`} style={{ position:'absolute', left:s.left, top:s.top, width:'3px', height:'3px', borderRadius:'50%', background:'#c9a84c', zIndex:1, pointerEvents:'none', animation:`twinkle ${s.dur} ease-in-out ${s.delay} infinite` }} />
        ))}

        {/* Floating pieces */}
        {FLOAT_PIECES.map((fp, i) => (
          <div key={i} style={{ position:'absolute', left:fp.left, bottom:'-10vh', fontSize:fp.size, color:'rgba(201,168,76,0.18)', zIndex:1, userSelect:'none', animation:`floatUp ${fp.dur} linear ${fp.delay} infinite`, pointerEvents:'none' }}>
            {fp.piece}
          </div>
        ))}

        {/* ── Hero ───────────────────────────────────────── */}
        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'4rem 1.5rem 3rem', maxWidth:'680px', width:'100%' }}>

          <div className="fade-in crown hero-crown" style={{ fontSize:'6rem', lineHeight:1, marginBottom:'1rem', userSelect:'none' }}>♔</div>

          <h1 className="fade-in-1 hero-title" style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'clamp(2.8rem,7vw,4rem)', fontWeight:700, letterSpacing:'0.04em', color:'#c9a84c', margin:'0 0 0.6rem', lineHeight:1.1 }}>
            Chess Lobby
          </h1>

          <div className="fade-in-1" style={{ display:'flex', alignItems:'center', gap:'1rem', margin:'0.5rem 0 1.2rem', width:'100%', maxWidth:'340px' }}>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to right, transparent, #c9a84c)' }} />
            <span style={{ fontSize:'0.65rem', letterSpacing:'0.45em', textTransform:'uppercase', color:'#8b6914' }}>Est. 2026</span>
            <div style={{ flex:1, height:'1px', background:'linear-gradient(to left, transparent, #c9a84c)' }} />
          </div>

          <div className="fade-in-2" style={{ overflow:'hidden', whiteSpace:'nowrap', margin:'0 0 2rem' }}>
            <p style={{ fontFamily:'var(--font-crimson),Georgia,serif', fontSize:'1.4rem', color:'#9aa5b4', margin:0, letterSpacing:'0.06em', display:'inline-block', overflow:'hidden', whiteSpace:'nowrap', borderRight:'2px solid #c9a84c', animation:'typewriter 2s steps(24) 0.8s both, blink 0.8s step-end 2.8s 8' }}>
              Play Chess.&ensp;Talk.&ensp;Win.
            </p>
          </div>

          <div className="fade-in-2" style={{ display:'flex', flexWrap:'wrap', gap:'0.6rem', justifyContent:'center', marginBottom:'2.5rem' }}>
            <span className="pill">🎙️ Voice Chat</span>
            <span className="pill">💬 Live Chat</span>
            <span className="pill">🏆 Elo Ranking</span>
          </div>

          <div className="fade-in-3 cta-buttons" style={{ display:'flex', flexWrap:'wrap', gap:'1rem', justifyContent:'center', marginBottom:'1.25rem' }}>
            <Link href="/lobby" className="btn-gold">Play Now</Link>
            <Link href="/login" className="btn-outline">Sign In</Link>
          </div>

          <p className="fade-in-4" style={{ fontSize:'0.82rem', color:'#4a5568', margin:0, letterSpacing:'0.03em' }}>
            No account needed — play as guest
          </p>
        </div>

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="fade-in-5 stats-row" style={{ position:'relative', zIndex:2, display:'flex', gap:'0', width:'100%', maxWidth:'600px', padding:'0 1.5rem', marginBottom:'4rem' }}>
          {STATS.map((s, i) => (
            <div key={i} className="stat-card" style={{ borderRight: i < STATS.length - 1 ? '1px solid rgba(201,168,76,0.2)' : 'none', padding:'0 1.5rem' }}>
              <div style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.8rem', fontWeight:700, color:'#c9a84c', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:'0.8rem', color:'#4a5568', marginTop:'0.3rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Features grid ──────────────────────────────── */}
        <div className="fade-in-5" style={{ position:'relative', zIndex:2, width:'100%', maxWidth:'900px', padding:'0 1.5rem', marginBottom:'4rem' }}>
          <div style={{ textAlign:'center', marginBottom:'1.75rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', justifyContent:'center', marginBottom:'0.5rem' }}>
              <div style={{ width:'40px', height:'1px', background:'linear-gradient(to right, transparent, rgba(201,168,76,0.5))' }} />
              <span style={{ fontSize:'0.7rem', letterSpacing:'0.35em', textTransform:'uppercase', color:'#8b6914' }}>Everything you need</span>
              <div style={{ width:'40px', height:'1px', background:'linear-gradient(to left, transparent, rgba(201,168,76,0.5))' }} />
            </div>
            <h2 style={{ fontFamily:'var(--font-playfair),Georgia,serif', fontSize:'1.6rem', color:'#e8e0d0', margin:0 }}>Improve &amp; compete</h2>
          </div>
          <div className="feature-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.85rem' }}>
            {[
              { icon:'🎮', title:'Play Chess',         desc:'Find opponents instantly',       href:'/lobby'       },
              { icon:'🧩', title:'Daily Puzzles',      desc:'Sharpen your tactics daily',     href:'/puzzles'     },
              { icon:'📖', title:'Opening Explorer',   desc:'Learn 20+ chess openings',       href:'/openings'    },
              { icon:'♟',  title:'Endgame Practice',   desc:'Master 7 key endgames',          href:'/endgames'    },
              { icon:'🏆', title:'Tournaments',        desc:'Compete in Arena & Swiss',        href:'/tournaments' },
              { icon:'📊', title:'Game Analysis',      desc:'Review and improve your play',   href:'/learn'       },
            ].map((f, i) => (
              <Link key={i} href={f.href} className="feature-card">
                <span style={{ fontSize:'1.75rem', lineHeight:1 }}>{f.icon}</span>
                <span style={{ fontFamily:'var(--font-playfair),Georgia,serif', color:'#e8e0d0', fontWeight:700, fontSize:'0.92rem' }}>{f.title}</span>
                <span style={{ color:'#4a5568', fontSize:'0.78rem' }}>{f.desc}</span>
              </Link>
            ))}
          </div>
          {/* Learn CTA */}
          <div style={{ textAlign:'center', marginTop:'1.75rem' }}>
            <Link href="/learn" className="btn-learn">📚 Start Learning →</Link>
            <p style={{ fontSize:'0.78rem', color:'#4a5568', margin:'0.5rem 0 0', letterSpacing:'0.04em' }}>
              Puzzles &bull; Openings &bull; Endgames &bull; Analysis
            </p>
          </div>
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

          <div className="how-cards" style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
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
