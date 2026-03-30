'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.chesslobby.in/reset-password'
      })
      if (error) setError(error.message)
      else setSent(true)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh', background:'#0a1628', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:12, padding:32, width:'100%', maxWidth:400}}>
        <div style={{textAlign:'center', marginBottom:24}}>
          <div style={{fontSize:'2rem'}}>♛</div>
          <h2 style={{color:'#c9a84c', fontFamily:'Georgia,serif', margin:'8px 0'}}>Reset Password</h2>
          <p style={{color:'#6b7a8d', fontSize:'0.9rem'}}>Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <div style={{textAlign:'center', color:'#27ae60'}}>
            ✅ Reset link sent! Check your email.
            <div style={{marginTop:16}}>
              <Link href="/login" style={{color:'#c9a84c'}}>Back to Login</Link>
            </div>
          </div>
        ) : (
          <>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{width:'100%', padding:'12px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:8, color:'#e8e0d0', fontSize:'1rem', marginBottom:12, boxSizing:'border-box'}}
            />
            {error && <div style={{color:'#e74c3c', marginBottom:8, fontSize:'0.9rem'}}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{width:'100%', padding:'12px', background:'#c9a84c', color:'#0a1628', border:'none', borderRadius:8, fontWeight:'bold', fontSize:'1rem', cursor:'pointer'}}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div style={{textAlign:'center', marginTop:16}}>
              <Link href="/login" style={{color:'#6b7a8d', fontSize:'0.9rem'}}>Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
