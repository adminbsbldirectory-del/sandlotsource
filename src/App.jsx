import { useState } from 'react'
import Header from './components/Header.jsx'
import CoachDirectory from './components/CoachDirectory.jsx'
import TravelTeams from './components/TravelTeams.jsx'
import PlayerBoard from './components/PlayerBoard.jsx'

const TABS = [
  { id: 'coaches', label: 'Coach & Facility Finder' },
  { id: 'teams',   label: 'Travel Teams' },
  { id: 'board',   label: 'Player Board' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('coaches')

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Header activeTab={activeTab} tabs={TABS} onTabChange={setActiveTab} />
      <main style={{ flex:1, padding:'0' }}>
        {activeTab === 'coaches' && <CoachDirectory />}
        {activeTab === 'teams'   && <TravelTeams />}
        {activeTab === 'board'   && <PlayerBoard />}
      </main>
      <footer style={{
        background: 'var(--navy)', color: 'rgba(255,255,255,0.5)',
        textAlign: 'center', padding: '16px',
        fontFamily: 'var(--font-body)', fontSize: '13px'
      }}>
        © 2025 GA Coach Finder · North Georgia Baseball & Softball Directory
      </footer>
    </div>
  )
}
