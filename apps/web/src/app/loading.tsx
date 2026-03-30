export default function Loading() {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        .chess-spinner { animation: spin 0.9s linear infinite; }
        .crown-pulse  { animation: pulse 1.4s ease-in-out infinite; }
      `}</style>
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
        <div className="crown-pulse" style={{ fontSize: '3rem', color: '#c9a84c', filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.6))', lineHeight: 1 }}>♛</div>
        <div className="chess-spinner" style={{ width: 40, height: 40, border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#c9a84c', borderRadius: '50%' }} />
        <span style={{ color: '#c9a84c', fontFamily: 'Georgia, serif', fontSize: '0.95rem', letterSpacing: '0.1em' }}>Loading...</span>
      </div>
    </>
  )
}
