export default function Header({ activeTab, tabs, onTabChange }) {
  return (
    <header>
      {/* Top bar */}
      <div style={{
        background: 'var(--navy)',
        padding: '16px 24px 0',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Logo row */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{
              width:44, height:44, borderRadius:'50%',
              background: 'var(--red)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize:22 }}>⚾</span>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-head)',
                fontSize: 28, fontWeight: 800,
                color: 'var(--white)',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}>
                GA COACH FINDER
              </div>
              <div style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12, color: 'var(--gold)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                North Georgia Baseball & Softball
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:4 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-head)',
                  fontSize: 15, fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: activeTab === tab.id ? 'var(--cream)' : 'rgba(255,255,255,0.1)',
                  color: activeTab === tab.id ? 'var(--navy)' : 'rgba(255,255,255,0.7)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
