'use client'
import Link from 'next/link'
import { useState } from 'react'
import { apiPost, saveAuth } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  function triggerShake() {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await apiPost('/auth/login', { email, password })
      saveAuth(data.token, data.user)
      window.location.href = '/lobby'
    } catch {
      setError('Invalid email or password')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  async function handleGuest() {
    setLoading(true)
    setError('')
    try {
      const data = await apiPost('/auth/guest', {})
      saveAuth(data.token, data.user)
      window.location.href = '/lobby'
    } catch {
      setError('Could not start guest session')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .chess-bg {
          background-image: repeating-conic-gradient(rgba(201,168,76,0.08) 0% 25%, transparent 0% 50%);
          background-size: 64px 64px;
        }
        .login-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(201,168,76,0.35);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 48px rgba(0,0,0,0.5), 0 0 40px rgba(201,168,76,0.1);
        }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(201,168,76,0.25);
          border-radius: 8px;
          padding: 14px 16px;
          color: #e8e0d0;
          font-size: 0.97rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-field::placeholder { color: #4a5568; }
        .input-field.focused {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
        }
        .input-with-icon { position: relative; }
        .input-with-icon .input-field { padding-right: 3rem; }
        .eye-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.2rem;
          line-height: 1;
          color: #4a5568;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: #c9a84c; }
        .btn-gold {
          width: 100%;
          background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 55%, #a07828 100%);
          color: #0a1628;
          border: none;
          border-radius: 8px;
          padding: 0.9rem 1rem;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
          font-family: var(--font-playfair), Georgia, serif;
        }
        .btn-gold:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-gold:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-outline {
          width: 100%;
          background: transparent;
          color: #c9a84c;
          border: 1.5px solid #c9a84c;
          border-radius: 8px;
          padding: 0.9rem 1rem;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-playfair), Georgia, serif;
        }
        .btn-outline:hover:not(:disabled) { background: rgba(201,168,76,0.1); transform: translateY(-1px); }
        .btn-outline:disabled { opacity: 0.7; cursor: not-allowed; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeInUp 0.7s ease both; }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-4px); }
          90%       { transform: translateX(4px); }
        }
        .shake { animation: shake 0.5s ease; }
      `}</style>

      <div
        className="chess-bg"
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: 'var(--font-crimson), Georgia, serif',
          padding: '2rem 1rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Radial overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.88) 55%, rgba(10,22,40,0.98) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className={`login-card fade-in${shaking ? ' shake' : ''}`} style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

          {/* Top gold accent line */}
          <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, #c9a84c, transparent)', marginBottom: '1.75rem', borderRadius: '1px' }} />

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3.5rem', color: '#c9a84c', textShadow: '0 0 24px rgba(201,168,76,0.65), 0 0 48px rgba(201,168,76,0.3)', userSelect: 'none', lineHeight: 1 }}>
              ♛
            </div>
            <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: '#c9a84c', margin: '0.4rem 0 0.3rem', letterSpacing: '0.04em' }}>
              Chess Lobby
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#4a5568', margin: 0 }}>
              Sign in to continue your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#9aa5b4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                Email
              </label>
              <input
                className={`input-field${emailFocused ? ' focused' : ''}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.78rem', color: '#9aa5b4', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: '0.78rem', opacity: 0.8 }}>
                  Forgot password?
                </Link>
              </div>
              <div className="input-with-icon">
                <input
                  className={`input-field${passFocused ? ' focused' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  required
                />
                <button type="button" className="eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#4a5568', margin: '0.35rem 0 0' }}>
                Must be at least 8 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className="btn-gold" style={{ marginTop: '0.25rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.2)' }} />
            <span style={{ fontSize: '0.8rem', color: '#4a5568', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(201,168,76,0.2)' }} />
          </div>

          {/* Guest */}
          <button className="btn-outline" type="button" onClick={handleGuest} disabled={loading}>
            ♟ {loading ? 'Loading...' : 'Play as Guest'}
          </button>

          {/* Register link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.88rem', color: '#4a5568' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
