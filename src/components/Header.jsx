const NAV_TABS = [
  { id: 'home',    label: 'Home' },
  { id: 'coaches', label: 'Coaches' },
  { id: 'teams',   label: 'Teams' },
  { id: 'board',   label: 'Find a Player · Find a Team' },
  { id: 'roster',  label: 'Roster Spots' },
  { id: 'claim',   label: 'Claim a Listing' },
  { id: 'submit',  label: '+ Add Listing' },
]

export default function Header({ activeTab, onTabChange }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 900 }}>
      <div style={{ background: 'var(--navy)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

          {/* Logo + tagline row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '14px 0 10px',
          }}>
            <div
              onClick={() => onTabChange('home')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{
                width: 38, height: 38, flexShrink: 0,
                background: 'var(--red)',
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>⚾</div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 28, fontWeight: 900,
                  color: 'var(--white)',
                  letterSpacing: '0.05em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}>
                  Sandlot Source
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11, color: 'var(--gold)',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}>
                  Find coaches. Explore teams. Fill roster spots.
                </div>
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
            {NAV_TABS.map(tab => {
              const isActive = activeTab === tab.id
              const isAdd    = tab.id === 'submit'
              const isRoster = tab.id === 'roster'
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    padding: '9px 16px',
                    fontFamily: 'var(--font-head)',
                    fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '6px 6px 0 0',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                   background: isAdd
  ? (isActive ? 'var(--gold)' : 'rgba(240,165,0,0.18)')
  : isRoster
  ? (isActive ? '#16A34A' : 'rgba(22,163,74,0.25)')
  : (isActive ? 'var(--cream)' : 'rgba(255,255,255,0.08)'),
color: isAdd
  ? (isActive ? 'var(--navy)' : 'var(--gold)')
  : isRoster
  ? 'white'
  : (isActive ? 'var(--navy)' : 'rgba(255,255,255,0.65)'),
borderBottom: isActive
  ? (isRoster ? '3px solid #15803D' : isAdd ? '3px solid var(--gold)' : '3px solid var(--gold)')
  : '3px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </header>
  )
}
