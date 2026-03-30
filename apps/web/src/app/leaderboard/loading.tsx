export default function LeaderboardLoading() {
  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { from{background-position:-200% 0}to{background-position:200% 0} }
        .lb-spinner { animation: spin 0.9s linear infinite; }
        .lb-shimmer { background: linear-gradient(90deg,#111e35 25%,#1a2e4a 50%,#111e35 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
      `}</style>
      <div style={{ background: '#0a1628', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="lb-shimmer" style={{ width: 36, height: 36, borderRadius: '50%' }} />
            <div className="lb-shimmer" style={{ width: 180, height: 32 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem' }}>
            <div className="lb-spinner" style={{ width: 44, height: 44, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%' }} />
            <span style={{ color: '#4a5568', fontFamily: 'Georgia, serif' }}>Loading leaderboard...</span>
          </div>
        </div>
      </div>
    </>
  )
}
