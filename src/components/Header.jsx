import { useNavigate, useLocation } from 'react-router-dom'

const NAV_TABS = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'coaches', label: 'Coaches', path: '/coaches' },
  { id: 'teams', label: 'Teams', path: '/teams' },
  { id: 'facilities', label: 'Facilities', path: '/facilities' },
  { id: 'board', label: 'Pickup Needed · Pickup Wanted', path: '/find' },
  { id: 'roster', label: 'Open Roster Spots', path: '/roster' },
  { id: 'claim', label: 'Claim a Listing', path: '/claim' },
  { id: 'submit', label: '+ Add Listing', path: '/submit' },
]

function getActiveTab(pathname) {
  const match = NAV_TABS.find((tab) => {
    if (tab.path === '/') return pathname === '/'
    return pathname === tab.path || pathname.startsWith(tab.path + '/')
  })

  return match?.id || 'home'
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = getActiveTab(location.pathname)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        background: '#fff',
        borderBottom: '3px solid #e63329',
        boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0 0',
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="Sandlot Source"
              style={{
                height: 56,
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </button>

          <div
            style={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-end',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              const isAdd = tab.id === 'submit'
              const isRoster = tab.id === 'roster'

              let bg
              let color
              let borderBottom

              if (isAdd) {
                bg = isActive ? '#b07d00' : 'rgba(240,165,0,0.12)'
                color = isActive ? '#fff' : '#b07d00'
                borderBottom = isActive ? '3px solid #b07d00' : '3px solid transparent'
              } else if (isRoster) {
                bg = isActive ? '#15803d' : 'rgba(22,163,74,0.1)'
                color = isActive ? '#fff' : '#15803d'
                borderBottom = isActive ? '3px solid #15803d' : '3px solid transparent'
              } else {
                bg = isActive ? '#1a1a1a' : 'transparent'
                color = isActive ? '#fff' : '#555'
                borderBottom = isActive ? '3px solid #1a1a1a' : '3px solid transparent'
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.path)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    border: 'none',
                    borderRadius: '6px 6px 0 0',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    background: bg,
                    color,
                    borderBottom,
                    flexShrink: 0,
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
