'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)
  const [confirmFocused, setConfirmFocused] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordError('')
    // TODO: submit
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
          box-shadow: 0 8px 48px rgba(0,0,0,0.5);
        }
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(201,168,76,0.25);
          border-radius: 8px;
          padding: 0.85rem 1rem;
          color: #e8e0d0;
          font-size: 0.97rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-field::placeholder {
          color: #4a5568;
        }
        .input-field.focused {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
        }
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
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.35);
          font-family: var(--font-playfair), Georgia, serif;
        }
        .btn-gold:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
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
          transition: all 0.2s;
          font-family: var(--font-playfair), Georgia, serif;
        }
        .btn-outline:hover {
          background: rgba(201,168,76,0.1);
          transform: translateY(-1px);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeInUp 0.7s ease both;
        }
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
            background:
              'radial-gradient(ellipse 90% 80% at 50% 45%, rgba(10,22,40,0.55) 0%, rgba(10,22,40,0.88) 55%, rgba(10,22,40,0.98) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="login-card fade-in"
          style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
        >
          {/* Logo area */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                fontSize: '3.5rem',
                color: '#c9a84c',
                textShadow:
                  '0 0 24px rgba(201,168,76,0.65), 0 0 48px rgba(201,168,76,0.3)',
                userSelect: 'none',
                lineHeight: 1,
              }}
            >
              ♛
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-playfair), Georgia, serif',
                fontSize: '1.9rem',
                fontWeight: 700,
                color: '#c9a84c',
                margin: '0.4rem 0 0.3rem',
                letterSpacing: '0.04em',
              }}
            >
              Chess Lobby
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#4a5568', margin: 0 }}>
              Create your account
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Username */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#9aa5b4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.4rem',
                }}
              >
                USERNAME
              </label>
              <input
                className={`input-field${usernameFocused ? ' focused' : ''}`}
                type="text"
                placeholder="YourChessName"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUsernameFocused(true)}
                onBlur={() => setUsernameFocused(false)}
              />
              <p style={{ fontSize: '0.75rem', color: '#4a5568', marginTop: '0.25rem', marginBottom: 0 }}>
                This will be your public display name
              </p>
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#9aa5b4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.4rem',
                }}
              >
                EMAIL
              </label>
              <input
                className={`input-field${emailFocused ? ' focused' : ''}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#9aa5b4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.4rem',
                }}
              >
                PASSWORD
              </label>
              <input
                className={`input-field${passFocused ? ' focused' : ''}`}
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: '#9aa5b4',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '0.4rem',
                }}
              >
                CONFIRM PASSWORD
              </label>
              <input
                className={`input-field${confirmFocused ? ' focused' : ''}`}
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (passwordError) setPasswordError('')
                }}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
              />
              {passwordError && (
                <div
                  style={{
                    color: '#ef4444',
                    fontSize: '0.83rem',
                    marginTop: '-0.5rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  {passwordError}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="btn-gold" style={{ marginTop: '0.25rem' }}>
              Create Account
            </button>
          </form>

          {/* Login link */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '1.75rem',
              fontSize: '0.88rem',
              color: '#4a5568',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
