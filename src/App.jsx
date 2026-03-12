import { useState } from 'react'
import Header from './components/Header.jsx'
import HomePage from './components/HomePage.jsx'
import CoachDirectory from './components/CoachDirectory.jsx'
import TravelTeams from './components/TravelTeams.jsx'
import PlayerBoard from './components/PlayerBoard.jsx'
import CoachSubmitForm from './components/CoachSubmitForm.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={{ flex:1 }}>
        {activeTab === 'home'    && <HomePage onNavigate={setActiveTab} />}
        {activeTab === 'coaches' && <CoachDirectory />}
        {activeTab === 'teams'   && <TravelTeams />}
        {activeTab === 'board'   && <PlayerBoard />}
        {activeTab === 'submit'  && <CoachSubmitForm />}
      </main>
      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.45)',
        textAlign: 'center', padding: '16px 20px',
        fontFamily: 'var(--font-body)', fontSize: '13px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        © 2025 Sandlot Source · North Georgia Baseball & Softball Directory ·{' '}
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>sandlotsource.com</span>
      </footer>
    </div>
  )
}
