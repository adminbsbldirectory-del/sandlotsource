import { useEffect, useState } from 'react'
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

function getTabStyles(tabId, isActive) {
  const isAdd = tabId === 'submit'
  const isRoster = tabId === 'roster'

  if (isAdd) {
    return {
      background: isActive ? '#b07d00' : 'rgba(240,165,0,0.12)',
      color: isActive ? '#fff' : '#b07d00',
      borderBottom: isActive ? '3px solid #b07d00' : '3px solid transparent',
    }
  }

  if (isRoster) {
    return {
      background: isActive ? '#15803d' : 'rgba(22,163,74,0.1)',
      color: isActive ? '#fff' : '#15803d',
      borderBottom: isActive ? '3px solid #15803d' : '3px solid transparent',
    }
  }

  return {
    background: isActive ? '#1a1a1a' : 'transparent',
    color: isActive ? '#fff' : '#555',
    borderBottom: isActive ? '3px solid #1a1a1a' : '3px solid transparent',
  }
}

function NavButton({ tab, isActive, onClick, mobile = false }) {
  const styles = getTabStyles(tab.id, isActive)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      style={
        mobile
          ? {
              width: '100%',
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              whiteSpace: 'normal',
              textAlign: 'left',
              transition: 'all 0.15s',
              background: styles.background,
              color: styles.color,
            }
          : {
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
              background: styles.background,
              color: styles.color,
              borderBottom: styles.borderBottom,
              flexShrink: 0,
            }
      }
    >
      {tab.label}
    </button>
  )
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  )
  const [menuOpen, setMenuOpen] = useState(false)

  const activeTab = getActiveTab(location.pathname)

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      if (!mobile) setMenuOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  function handleNavigate(path) {
    navigate(path)
    setMenuOpen(false)
  }

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
            padding: isMobile ? '8px 0' : '10px 0',
            gap: 16,
            minHeight: isMobile ? 60 : 72,
          }}
        >
          <button
            type="button"
            onClick={() => handleNavigate('/')}
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
                height: isMobile ? 46 : 56,
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </button>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              style={{
                border: '2px solid var(--lgray)',
                background: '#fff',
                color: '#1a1a1a',
                borderRadius: 10,
                padding: '9px 11px',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ☰
            </button>
          ) : (
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
              {NAV_TABS.map((tab) => (
                <NavButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => handleNavigate(tab.path)}
                />
              ))}
            </div>
          )}
        </div>

        {isMobile && menuOpen && (
          <div style={{ padding: '0 0 12px' }}>
            <div
              style={{
                display: 'grid',
                gap: 8,
                borderTop: '1px solid var(--lgray)',
                paddingTop: 10,
                background: '#fff',
              }}
            >
              {NAV_TABS.map((tab) => (
                <NavButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => handleNavigate(tab.path)}
                  mobile
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
