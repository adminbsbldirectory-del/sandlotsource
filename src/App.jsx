import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { useEffect, useLayoutEffect, useState } from 'react'
import Header from './components/Header.jsx'
import HomePage from './components/HomePage.jsx'
import CoachDirectory from './components/CoachDirectory.jsx'
import TravelTeams from './components/TravelTeams.jsx'
import PlayerBoard from './components/PlayerBoard.jsx'
import CoachSubmitForm from './components/CoachSubmitForm.jsx'
import ClaimListing from './components/ClaimListing.jsx'
import RosterSpots from './components/RosterSpots.jsx'
import SearchResults from './components/SearchResults.jsx'
import Facilities from './components/Facilities.jsx'
import FacilityProfile from './components/FacilityProfile.jsx'
import AdminGeocode from './components/AdminGeocode.jsx'
import LegalPage from './components/LegalPage.jsx'
import AdminPage from './components/AdminPage.jsx'

const BORDER = '#eaeae6'
const FAINT = '#bbb'
const RED = '#e63329'
const DARK = '#1a1a1a'


function ScrollToTop() {
  const location = useLocation()

  useLayoutEffect(() => {
    if (location.hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search])

  return null
}

function SiteFooter() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const footerColumns = [
    {
      heading: 'Directory',
      links: [
        { label: 'Coaches', to: '/coaches' },
        { label: 'Teams', to: '/teams' },
        { label: 'Facilities', to: '/facilities' },
        { label: 'Open Rosters', to: '/roster' },
        { label: 'Pickup Board', to: '/find' },
      ],
    },
    {
      heading: 'Listings',
      links: [
        { label: 'Add a Listing', to: '/submit' },
        { label: 'Claim a Listing', to: '/claim' },
        { label: 'About', to: '/legal#about' },
        { label: 'Contact', href: 'mailto:admin@sandlotsource.com' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', to: '/legal#privacy' },
        { label: 'Terms of Use', to: '/legal#terms' },
        { label: 'Disclaimer', to: '/legal#disclaimer' },
      ],
    },
  ]

  return (
    <footer
      style={{
        background: '#fff',
        borderTop: '1px solid ' + BORDER,
        padding: isMobile ? '24px 14px 0' : '28px 20px 0',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1.5fr 1fr 1fr 1fr',
            gap: isMobile ? 18 : 24,
            paddingBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: isMobile ? 11 : 13,
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: DARK,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 8,
              }}
            >
              <span style={{ color: RED }}>◆</span> SANDLOT SOURCE
            </div>
            <p style={{ fontSize: isMobile ? 11 : 12, color: '#aaa', lineHeight: 1.65, margin: 0 }}>
              Baseball &amp; softball coaches, teams, and roster connections — free to browse, anywhere in the country.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h5
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: FAINT,
                  margin: '0 0 10px',
                }}
              >
                {col.heading}
              </h5>
              {col.links.map((link) =>
                link.href ? (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{ display: 'block', fontSize: isMobile ? 11 : 12, color: '#777', textDecoration: 'none', marginBottom: 6 }}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    style={{ display: 'block', fontSize: isMobile ? 11 : 12, color: '#777', textDecoration: 'none', marginBottom: 6 }}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px solid ' + BORDER,
            padding: '14px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 6 : 0,
          }}
        >
          <span style={{ fontSize: 11, color: FAINT }}>
            © {new Date().getFullYear()} Sandlot Source. All rights reserved.
          </span>
          <span style={{ fontSize: 11, color: FAINT }}>
            Baseball &amp; Softball Directory
          </span>
        </div>
      </div>
    </footer>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const location = useLocation()

  // Admin routes — no header or footer
  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/geocode" element={<AdminGeocode />} />
      </Routes>
    )
  }

  // Public routes — with header and footer
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage onNavigate={(id) => navigate(id === 'home' ? '/' : '/' + id)} />
            }
          />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/coaches" element={<CoachDirectory />} />
          <Route path="/teams" element={<TravelTeams />} />
          <Route path="/facilities" element={<Facilities />} />
          <Route path="/facilities/:id" element={<FacilityProfile />} />
          <Route path="/find" element={<PlayerBoard />} />
          <Route path="/roster" element={<RosterSpots />} />
          <Route path="/submit" element={<CoachSubmitForm />} />
          <Route path="/claim" element={<ClaimListing />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', overflowX: 'clip' }}>
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
