'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: [
      { heading: 'Account Information', body: 'When you register, we collect your email address and chosen username.' },
      { heading: 'Game Data', body: 'We record your moves, game results, and Elo rating to power matchmaking, profiles, and leaderboards.' },
      { heading: 'OAuth Sign-In', body: 'If you sign in with Google, we receive your email address and display name from Google. We do not receive your Google password.' },
      { heading: 'Usage Data', body: 'We collect general usage information such as pages visited and features used, to improve the platform.' },
    ],
  },
  {
    title: 'How We Use Your Information',
    content: [
      { heading: 'Gameplay & Matchmaking', body: 'Your data powers real-time matchmaking, game history, Elo calculations, and profile displays.' },
      { heading: 'Leaderboards', body: 'Your username and Elo rating are displayed publicly on the leaderboard.' },
      { heading: 'Platform Improvement', body: 'Usage patterns help us identify bugs and plan new features.' },
      { heading: 'No Data Sales', body: 'We never sell, rent, or trade your personal information to third parties.' },
    ],
  },
  {
    title: 'Data Storage',
    content: [
      { heading: 'Database', body: 'All user data is stored on Supabase-managed PostgreSQL servers.' },
      { heading: 'Server Location', body: 'Database servers are located in Mumbai, India (AWS ap-south-1 region).' },
      { heading: 'Password Security', body: 'All passwords are hashed using bcrypt before storage. We never store plaintext passwords.' },
    ],
  },
  {
    title: 'Cookies & Local Storage',
    content: [
      { heading: 'Session Token', body: 'We store your authentication token in browser localStorage to keep you logged in across sessions.' },
      { heading: 'No Tracking Cookies', body: 'We do not use first-party tracking cookies.' },
      { heading: 'Advertising', body: 'Google AdSense may use cookies to serve personalized advertisements. You can opt out via Google\'s Ad Settings.' },
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      { heading: 'Google OAuth', body: 'Used for "Sign in with Google". Governed by Google\'s Privacy Policy.' },
      { heading: 'Google AdSense', body: 'Used to display advertisements. Google may collect data as described in their Privacy Policy.' },
      { heading: 'Supabase', body: 'Our database and authentication provider. Data is processed per Supabase\'s Data Processing Agreement.' },
      { heading: 'Render.com', body: 'Our game server is hosted on Render. See Render\'s Privacy Policy for hosting details.' },
    ],
  },
  {
    title: "Children's Privacy",
    content: [
      { heading: 'Age Requirement', body: 'Chess Lobby is not directed at children under 13 years of age.' },
      { heading: 'Data Collection', body: 'We do not knowingly collect personal information from children under 13. If we become aware of such data, we will delete it immediately.' },
    ],
  },
  {
    title: 'Your Rights',
    content: [
      { heading: 'Account Deletion', body: 'You may request deletion of your account and all associated data by contacting us at chesslobby.play@gmail.com.' },
      { heading: 'Data Access', body: 'You may request a copy of the personal data we hold about you at any time.' },
      { heading: 'Corrections', body: 'You may update your username and other profile details from your profile page.' },
    ],
  },
  {
    title: 'Contact Us',
    content: [
      { heading: 'Email', body: 'chesslobby.play@gmail.com' },
      { heading: 'Website', body: 'chesslobby.in' },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <>
      <style>{`
        .priv-section { background: rgba(255,255,255,0.03); border: 1px solid rgba(201,168,76,0.15); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1.5rem 1.75rem; margin-bottom: 1.25rem; }
        .priv-item { margin-bottom: 1rem; }
        .priv-item:last-child { margin-bottom: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <div style={{ background: '#0a1628', minHeight: '100vh', fontFamily: 'var(--font-crimson),Georgia,serif' }}>
        <Navbar />

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 3rem' }}>
          {/* Back link */}
          <Link href="/" style={{ color: '#4a5568', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: '1.75rem' }}>
            ← Back to Home
          </Link>

          {/* Header */}
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.75rem', filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.3))' }}>♛</div>
            <h1 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#c9a84c', margin: '0 0 0.5rem', fontWeight: 700 }}>
              Privacy Policy
            </h1>
            <p style={{ color: '#4a5568', fontSize: '0.85rem', margin: 0 }}>Last updated: March 30, 2026</p>
          </div>

          {/* Intro */}
          <div className="fade-up" style={{ color: '#9aa5b4', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem', padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10 }}>
            Chess Lobby ("we", "us", or "our") operates chesslobby.in. This Privacy Policy explains how we collect, use, and protect your information when you use our platform. By using Chess Lobby, you agree to this policy.
          </div>

          {/* Sections */}
          {SECTIONS.map((section, i) => (
            <div key={i} className="priv-section fade-up">
              <h2 style={{ fontFamily: 'var(--font-playfair),Georgia,serif', color: '#c9a84c', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem' }}>
                {i + 1}. {section.title}
              </h2>
              {section.content.map((item, j) => (
                <div key={j} className="priv-item">
                  <span style={{ color: '#e8e0d0', fontWeight: 600, fontSize: '0.9rem' }}>{item.heading}:</span>{' '}
                  <span style={{ color: '#9aa5b4', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.body}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Bottom link */}
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link href="/" style={{ color: '#c9a84c', fontSize: '0.9rem', textDecoration: 'none', borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: 2 }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
