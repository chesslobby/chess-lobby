'use client'
// @ts-nocheck
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function triggerShake() {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_KEY || 'chesslobby-admin-2026'
    await new Promise(r => setTimeout(r, 400)) // deliberate delay
    if (password === ADMIN_PASS) {
      localStorage.setItem('admin_session', Date.now().toString())
      router.push('/admin/dashboard')
    } else {
      setError('Invalid credentials')
      triggerShake()
    }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-8px); }
          30%      { transform: translateX(8px); }
          45%      { transform: translateX(-6px); }
          60%      { transform: translateX(6px); }
          75%      { transform: translateX(-4px); }
          90%      { transform: translateX(4px); }
        }
        .shake { animation: shake 0.5s ease; }
        .admin-input {
          width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(201,168,76,0.25); border-radius: 8px;
          color: #e8e0d0; font-size: 1rem; outline: none; box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .admin-input:focus {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
        }
        .admin-btn {
          width: 100%; padding: 14px; background: linear-gradient(135deg,#e8c97a,#c9a84c,#a07828);
          color: #0a1628; border: none; border-radius: 8px; font-size: 1rem;
          font-weight: 700; cursor: pointer; transition: filter 0.2s, transform 0.2s;
          letter-spacing: 0.06em;
        }
        .admin-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .admin-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div className={shaking ? 'shake' : ''} style={{ width: '100%', maxWidth: 360, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 16, padding: '2.5rem 2rem', boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', color: '#c9a84c', lineHeight: 1 }}>♛</div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#c9a84c', margin: '0.5rem 0 0.25rem', fontWeight: 700 }}>Chess Lobby</h1>
            <p style={{ color: '#4a5568', fontSize: '0.85rem', margin: 0 }}>Access required</p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              className="admin-input"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="off"
              required
            />
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? '...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
