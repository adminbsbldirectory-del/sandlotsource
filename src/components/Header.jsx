const NAV_TABS = [
  { id: 'home',    label: 'Home' },
  { id: 'coaches', label: 'Coaches' },
  { id: 'teams',   label: 'Teams' },
  { id: 'board',   label: 'Player Needs' },
  { id: 'submit',  label: '+ Add Listing' },
]

export default function Header({ activeTab, onTabChange }) {
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 900 }}>
      <div style={{ background: 'var(--navy)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>

          {/* Logo + tagline row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 0 8px',
          }}>
            {/* Logo image */}
            <img
              src="/logo.png"
              alt="Sandlot Source"
              onClick={() => onTabChange('home')}
              style={{
                height: 52, width: 'auto',
                cursor: 'pointer',
                display: 'block',
                // PNG is transparent — shows perfectly on navy
              }}
            />

            {/* Tagline — hidden on mobile via CSS class */}
            <div className="header-tagline" style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              textAlign: 'right',
              lineHeight: 1.5,
            }}>
              North Georgia<br />Baseball & Softball
            </div>
          </div>

          {/* Nav tabs */}
          <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
            {NAV_TABS.map(tab => {
              const isActive = activeTab === tab.id
              const isAdd = tab.id === 'submit'
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
                      : (isActive ? 'var(--cream)' : 'rgba(255,255,255,0.08)'),
                    color: isAdd
                      ? (isActive ? 'var(--navy)' : 'var(--gold)')
                      : (isActive ? 'var(--navy)' : 'rgba(255,255,255,0.65)'),
                    borderBottom: isActive ? '3px solid var(--gold)' : '3px solid transparent',
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
