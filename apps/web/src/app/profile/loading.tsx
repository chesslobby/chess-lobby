export default function ProfileLoading() {
  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { from{background-position:-200% 0}to{background-position:200% 0} }
        .p-spinner { animation: spin 0.9s linear infinite; }
        .p-shimmer { background: linear-gradient(90deg,#111e35 25%,#1a2e4a 50%,#111e35 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:6px; }
      `}</style>
      <div style={{ background: '#0a1628', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Header skeleton */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="p-shimmer" style={{ width: 80, height: 80, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="p-shimmer" style={{ width: 160, height: 24 }} />
              <div className="p-shimmer" style={{ width: 220, height: 16 }} />
              <div className="p-shimmer" style={{ width: 120, height: 16 }} />
            </div>
          </div>
          {/* Stats skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                <div className="p-shimmer" style={{ width: 48, height: 32 }} />
                <div className="p-shimmer" style={{ width: 80, height: 14 }} />
              </div>
            ))}
          </div>
          {/* Loading */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
            <div className="p-spinner" style={{ width: 36, height: 36, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%' }} />
            <span style={{ color: '#4a5568', fontFamily: 'Georgia, serif' }}>Loading profile...</span>
          </div>
        </div>
      </div>
    </>
  )
}
