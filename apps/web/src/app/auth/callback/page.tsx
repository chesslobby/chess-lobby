'use client'
// @ts-nocheck
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/auth/oauth`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.user.email,
                name:
                  session.user.user_metadata?.full_name ||
                  session.user.user_metadata?.user_name ||
                  session.user.email?.split('@')[0],
                provider: session.user.app_metadata?.provider,
                supabaseId: session.user.id,
              }),
            }
          )
          if (res.ok) {
            const data = await res.json()
            localStorage.setItem('chess_token', data.token)
            localStorage.setItem('chess_user', JSON.stringify(data.user))
            window.location.href = '/lobby'
          } else {
            window.location.href = '/login?error=oauth_failed'
          }
        } catch {
          window.location.href = '/login?error=oauth_failed'
        }
      } else {
        window.location.href = '/login?error=no_session'
      }
    })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1628',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      color: '#c9a84c',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ fontSize: '3rem' }}>♛</div>
      <div style={{ fontSize: '1.2rem' }}>Signing you in...</div>
      <div style={{
        width: 40, height: 40, border: '3px solid #c9a84c',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
