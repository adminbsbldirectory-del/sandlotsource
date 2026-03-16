import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import HomePage from './components/HomePage.jsx'
import CoachDirectory from './components/CoachDirectory.jsx'
import TravelTeams from './components/TravelTeams.jsx'
import PlayerBoard from './components/PlayerBoard.jsx'
import CoachSubmitForm from './components/CoachSubmitForm.jsx'
import ClaimListing from './components/ClaimListing.jsx'
import RosterSpots from './components/RosterSpots.jsx'
import SearchResults from './components/SearchResults.jsx'

// Inner component so useNavigate works inside BrowserRouter
function AppRoutes() {
  const navigate = useNavigate()
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"          element={<HomePage onNavigate={(id) => navigate(id === 'home' ? '/' : `/${id}`)} />} />
          <Route path="/search"    element={<SearchResults />} />
          <Route path="/coaches"   element={<CoachDirectory />} />
          <Route path="/teams"     element={<TravelTeams />} />
          <Route path="/find"      element={<PlayerBoard />} />
          <Route path="/roster"    element={<RosterSpots />} />
          <Route path="/submit"    element={<CoachSubmitForm />} />
          <Route path="/claim"     element={<ClaimListing />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.45)',
        textAlign: 'center', padding: '16px 20px',
        fontFamily: 'var(--font-body)', fontSize: '13px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        © 2025 Sandlot Source · Baseball &amp; Softball Directory ·{' '}
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>sandlotsource.com</span>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
