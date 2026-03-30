'use client'
// @ts-nocheck
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import AdUnit from '@/components/AdUnit'

const TOTAL_ENDGAMES = 7

export default function LearnPage() {
  const [puzzleStreak, setPuzzleStreak] = useState(0)
  const [endgamesDone, setEndgamesDone] = useState(0)
  const [lastGameId, setLastGameId] = useState(null)

  useEffect(() => {
    try {
      const streak = parseInt(localStorage.getItem('puzzle_streak') || '0', 10)
      setPuzzleStreak(isNaN(streak) ? 0 : streak)
      const completed = JSON.parse(localStorage.getItem('endgames_completed') || '{}')
      setEndgamesDone(Object.keys(completed).length)
      const gameRaw = localStorage.getItem('current_game')
      if (gameRaw) {
        const g = JSON.parse(gameRaw)
        if (g?.gameId) setLastGameId(g.gameId)
      }
    } catch {}
  }, [])

  const CARDS = [
    {
      icon: '🧩',
      title: 'Daily Puzzle',
      desc: 'Solve today\'s tactical puzzle and build pattern recognition.',
      stat: puzzleStreak > 0 ? `🔥 ${puzzleStreak} day streak` : 'Start your streak!',
      link: '/puzzles',
      cta: 'Solve Puzzle',
      color: '#c9a84c',
      border: 'rgba(201,168,76,0.3)',
      bg: 'rgba(201,168,76,0.06)',
    },
    {
      icon: '⚡',
      title: 'Puzzle Rush',
      desc: 'Solve as many puzzles as possible in 3 minutes. Beat your high score!',
      stat: 'Train your speed',
      link: '/puzzles',
      cta: 'Start Rush',
      color: '#f97316',
      border: 'rgba(249,115,22,0.3)',
      bg: 'rgba(249,115,22,0.06)',
    },
    {
      icon: '📖',
      title: 'Opening Explorer',
      desc: 'Learn and play through 20+ essential chess openings with key ideas.',
      stat: '20+ openings',
      link: '/openings',
      cta: 'Explore',
      color: '#8b5cf6',
      border: 'rgba(139,92,246,0.3)',
      bg: 'rgba(139,92,246,0.06)',
    },
    {
      icon: '♟',
      title: 'Endgame Practice',
      desc: 'Master 7 essential endgame techniques from KQ vs K to the Philidor position.',
      stat: `${endgamesDone} / ${TOTAL_ENDGAMES} completed`,
      link: '/endgames',
      cta: endgamesDone >= TOTAL_ENDGAMES ? '✅ All Done!' : 'Practice',
      color: '#22c55e',
      border: 'rgba(34,197,94,0.3)',
      bg: 'rgba(34,197,94,0.06)',
    },
    {
      icon: '📊',
      title: 'Game Analysis',
      desc: 'Review your games move by move with quality indicators and opening detection.',
      stat: lastGameId ? 'Analyze last game' : 'Play a game first',
      link: lastGameId ? `/analysis/${lastGameId}` : '/lobby',
      cta: lastGameId ? 'Analyze' : 'Play First',
      color: '#3b82f6',
      border: 'rgba(59,130,246,0.3)',
      bg: 'rgba(59,130,246,0.06)',
    },
    {
      icon: '🎯',
      title: 'Tactics Trainer',
      desc: 'Sharpen your tactical eye with puzzles on forks, pins, skewers, and more.',
      stat: 'Puzzles rated 900–1700',
      link: '/puzzles',
      cta: 'Train Tactics',
      color: '#ef4444',
      border: 'rgba(239,68,68,0.3)',
      bg: 'rgba(239,68,68,0.06)',
    },
  ]

  return (
    <>
      <style>{`
        .learn-card {
          background: rgba(255,255,255,0.03);
          border-radius: 14px;
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          cursor: default;
        }
        .learn-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 36px rgba(0,0,0,0.3);
        }
        .learn-cta {
          display: inline-block;
          border-radius: 8px;
          padding: 0.5rem 1.1rem;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          text-align: center;
          transition: all 0.15s;
          font-family: var(--font-crimson), Georgia, serif;
          margin-top: auto;
        }
        .learn-cta:hover { filter: brightness(1.12); transform: translateY(-1px); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: '2.2rem', color: '#e8e0d0', margin: '0 0 0.5rem', fontWeight: 700 }}>
              📚 Chess Academy
            </h1>
            <p style={{ color: '#4a5568', fontSize: '0.95rem', margin: 0 }}>
              Improve your game with structured learning tools.
            </p>
          </div>

          {/* Progress bar */}
          <div className="fade-up" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e8e0d0', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>Your Progress</div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ color: '#4a5568', fontSize: '0.78rem' }}>Puzzle Streak </span>
                  <span style={{ color: '#c9a84c', fontWeight: 700 }}>🔥 {puzzleStreak}</span>
                </div>
                <div>
                  <span style={{ color: '#4a5568', fontSize: '0.78rem' }}>Endgames </span>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{endgamesDone}/{TOTAL_ENDGAMES}</span>
                </div>
              </div>
            </div>
            <Link
              href="/lobby"
              style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8, padding: '0.5rem 1.1rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              ♟ Play a Game
            </Link>
          </div>

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
            {CARDS.map((card, i) => (
              <div
                key={i}
                className="learn-card fade-up"
                style={{ border: `1px solid ${card.border}`, background: card.bg, animationDelay: `${i * 0.07}s` }}
              >
                <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{card.icon}</div>
                <div style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#e8e0d0', fontWeight: 700, fontSize: '1.05rem' }}>
                  {card.title}
                </div>
                <div style={{ color: '#4a5568', fontSize: '0.83rem', lineHeight: 1.5 }}>
                  {card.desc}
                </div>
                <div style={{ fontSize: '0.78rem', color: card.color, fontWeight: 600, marginTop: '0.2rem' }}>
                  {card.stat}
                </div>
                <Link
                  href={card.link}
                  className="learn-cta"
                  style={{ background: `${card.color}18`, color: card.color, border: `1px solid ${card.color}55` }}
                >
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>

          {/* Ad — bottom of learn page */}
          <AdUnit slot="2222222222" format="horizontal" style={{ marginTop: 32, marginBottom: 8, minHeight: 90 }} />

          {/* Footer tip */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#4a5568', fontSize: '0.8rem' }}>
            "Chess is 99% tactics" — Richard Teichmann. Solve puzzles daily to improve fastest.
          </div>
        </div>
      </div>
    </>
  )
}
