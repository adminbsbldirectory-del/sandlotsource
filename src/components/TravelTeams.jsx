import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'
import TeamProfile from './TeamProfile.jsx'

const DEMO_TEAMS = [
  { id:1, name:'North Georgia Nationals', sport:'baseball', org_affiliation:'USSSA', age_group:'12U', city:'Alpharetta', county:'Fulton', tryout_status:'open', tryout_date:'2025-04-15', tryout_notes:'Tryouts at Wills Park', contact_name:'Coach Miller', contact_phone:'770-555-0101' },
  { id:2, name:'Cherokee Crush', sport:'softball', org_affiliation:'PGF', age_group:'14U', city:'Canton', county:'Cherokee', tryout_status:'open', tryout_date:'2025-04-20', tryout_notes:'Contact coach for location', contact_name:'Coach Davis' },
  { id:3, name:'East Cobb Astros', sport:'baseball', org_affiliation:'Perfect Game', age_group:'13U', city:'Marietta', county:'Cobb', tryout_status:'closed', contact_name:'Coach Johnson' },
  { id:4, name:'Forsyth Fire', sport:'softball', org_affiliation:'USSSA', age_group:'10U', city:'Cumming', county:'Forsyth', tryout_status:'year_round', contact_name:'Coach Williams', contact_phone:'678-555-0202' },
  { id:5, name:'Gwinnett Grizzlies', sport:'baseball', org_affiliation:'USSSA', age_group:'10U', city:'Buford', county:'Gwinnett', tryout_status:'by_invite', description:'Elite travel program; players recommended by coaches only' },
]

const REGIONS = {
  'North Georgia': [
    'Barrow','Banks','Cherokee','Clarke','Cobb','Dawson','DeKalb','Fannin','Forsyth',
    'Franklin','Gilmer','Gordon','Gwinnett','Habersham','Hall','Hart','Jackson',
    'Lumpkin','Madison','Murray','Oconee','Pickens','Rabun','Stephens','Towns',
    'Union','Walker','Walton','White','Whitfield','Fulton',
  ],
  'Middle Georgia': [
    'Baldwin','Bibb','Butts','Carroll','Catoosa','Chattooga','Clayton','Coweta',
    'Douglas','Elbert','Fayette','Floyd','Greene','Haralson','Harris','Heard',
    'Henry','Jasper','Jones','Lamar','Lincoln','McDuffie','Meriwether','Monroe',
    'Morgan','Newton','Oglethorpe','Paulding','Pike','Putnam','Rockdale',
    'Spalding','Taliaferro','Troup','Upson','Warren','Wilkes',
  ],
  'South Georgia': [
    'Appling','Atkinson','Bacon','Baker','Ben Hill','Berrien','Brantley','Brooks',
    'Bryan','Bulloch','Burke','Calhoun','Camden','Candler','Charlton','Chatham',
    'Clay','Clinch','Coffee','Colquitt','Columbia','Cook','Crisp','Decatur',
    'Dodge','Dooly','Dougherty','Early','Echols','Emanuel','Evans','Glynn',
    'Grady','Irwin','Jeff Davis','Jefferson','Jenkins','Johnson','Lanier',
    'Laurens','Lee','Liberty','Long','Lowndes','Macon','Marion','Miller',
    'Mitchell','Montgomery','Pierce','Pulaski','Quitman','Randolph','Richmond',
    'Schley','Screven','Seminole','Stewart','Sumter','Tattnall','Taylor',
    'Telfair','Terrell','Thomas','Tift','Toombs','Treutlen','Turner','Twiggs',
    'Ware','Washington','Wayne','Webster','Wheeler','Wilcox','Wilkinson','Worth',
  ],
}

const STATUS_STYLE = {
  open:       { bg:'#DCFCE7', color:'#16A34A', label:'Open Tryouts' },
  closed:     { bg:'#FEE2E2', color:'#DC2626', label:'Closed' },
  by_invite:  { bg:'#FEF3C7', color:'#D97706', label:'By Invite' },
  year_round: { bg:'#DBEAFE', color:'#2563EB', label:'Year Round' },
}

export default function TravelTeams() {
  const [teams, setTeams] = useState(DEMO_TEAMS)
  const [sport, setSport] = useState('Both')
  const [ageGroup, setAgeGroup] = useState('All Ages')
  const [tryoutFilter, setTryoutFilter] = useState('All')
  const [region, setRegion] = useState('All Regions')
  const [county, setCounty] = useState('All Counties')
  const [loading, setLoading] = useState(true)
  const [profileTeam, setProfileTeam] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('travel_teams').select('*').eq('active', true)
      if (!error && data && data.length > 0) setTeams(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = teams.filter(t => {
    if (sport !== 'Both' && t.sport !== sport && t.sport !== 'both') return false
    if (ageGroup !== 'All Ages' && t.age_group !== ageGroup) return false
    if (tryoutFilter !== 'All' && t.tryout_status !== tryoutFilter) return false
    if (region !== 'All Regions' && county === 'All Counties') {
      if (!REGIONS[region].map(r => r.toLowerCase()).includes((t.county||'').toLowerCase())) return false
    }
    if (county !== 'All Counties' && (t.county||'').toLowerCase() !== county.toLowerCase()) return false
    return true
  })

  const countyOptions = region === 'All Regions'
    ? ['All Counties']
    : ['All Counties', ...(REGIONS[region] || []).sort()]

  const filterStyle = {
    padding:'8px 12px', borderRadius:8,
    border:'2px solid var(--lgray)', background:'white',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  return (
    <div>
      {profileTeam && (
        <TeamProfile
          team={profileTeam}
          onClose={() => setProfileTeam(null)}
          onClaim={(team) => {
            // Future: navigate to claim flow with team pre-filled
            window.location.href = `mailto:admin.bsbldirectory@gmail.com?subject=Claim Request: ${encodeURIComponent(team.name)}`
          }}
        />
      )}
      {/* Filter bar */}
      <div style={{
        background:'var(--white)', borderBottom:'2px solid var(--lgray)',
        padding:'12px 24px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
      }}>
        <select value={sport} onChange={e => setSport(e.target.value)} style={filterStyle}>
          <option>Both</option><option>baseball</option><option>softball</option>
        </select>
        <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={filterStyle}>
          {['All Ages','8U','9U','10U','11U','12U','13U','14U','15U','16U','18U'].map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={tryoutFilter} onChange={e => setTryoutFilter(e.target.value)} style={filterStyle}>
          <option value="All">All Tryout Status</option>
          <option value="open">Open Tryouts</option>
          <option value="year_round">Year Round</option>
          <option value="by_invite">By Invite</option>
          <option value="closed">Closed</option>
        </select>
        <select value={region} onChange={e => { setRegion(e.target.value); setCounty('All Counties') }} style={filterStyle}>
          <option>All Regions</option>
          {Object.keys(REGIONS).map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={county} onChange={e => setCounty(e.target.value)}
          style={{ ...filterStyle, opacity: region === 'All Regions' ? 0.6 : 1 }}
          disabled={region === 'All Regions'}>
          {countyOptions.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--gray)' }}>{filtered.length} team{filtered.length !== 1 ? 's':''}</span>
      </div>

      {/* Open tryouts banner */}
      {filtered.some(t => t.tryout_status === 'open') && (
        <div style={{
          background:'#DCFCE7', borderBottom:'2px solid #16A34A',
          padding:'10px 24px', fontSize:13, color:'#15803D', fontWeight:600,
        }}>
          ✅ {filtered.filter(t => t.tryout_status === 'open').length} team{filtered.filter(t => t.tryout_status === 'open').length !== 1 ? 's' : ''} currently accepting tryouts
        </div>
      )}

      {/* Team grid */}
      <div style={{
        padding:'24px', display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',
        gap:16, maxWidth:1200, margin:'0 auto',
      }}>
        {filtered.map(team => {
          const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.closed
          return (
            <div key={team.id} onClick={() => setProfileTeam(team)} style={{
              background:'var(--white)', borderRadius:12,
              border:'2px solid var(--lgray)', padding:'18px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
              cursor:'pointer', transition:'box-shadow 0.15s, border-color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor='var(--navy)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor='var(--lgray)' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{
                    fontFamily:'var(--font-head)', fontSize:18, fontWeight:700,
                    letterSpacing:'0.02em',
                  }}>{team.name}</div>
                  <div style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>
                    📍 {[team.city, team.county ? team.county+' Co.' : null].filter(Boolean).join(', ')}
                  </div>
                </div>
                <span style={{
                  background: statusInfo.bg, color: statusInfo.color,
                  fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20,
                  whiteSpace:'nowrap', fontFamily:'var(--font-head)',
                  textTransform:'uppercase', letterSpacing:'0.05em',
                }}>{statusInfo.label}</span>
              </div>

              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                {team.age_group && (
                  <span style={{ background:'var(--navy)', color:'white', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)' }}>
                    {team.age_group}
                  </span>
                )}
                <span style={{
                  background: team.sport === 'softball' ? '#7C3AED' : '#1D4ED8',
                  color:'white', fontSize:11, fontWeight:700,
                  padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)',
                  textTransform:'uppercase',
                }}>{team.sport}</span>
                {team.org_affiliation && (
                  <span style={{ background:'var(--lgray)', color:'var(--gray)', fontSize:11, padding:'2px 8px', borderRadius:20 }}>
                    {team.org_affiliation}
                  </span>
                )}
              </div>

              {team.tryout_status === 'open' && team.tryout_date && (
                <div style={{
                  marginTop:10, padding:'8px 12px', borderRadius:8,
                  background:'#DCFCE7', color:'#15803D', fontSize:13, fontWeight:600,
                }}>
                  🗓️ Tryouts: {new Date(team.tryout_date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
                  {team.tryout_notes && <div style={{ fontWeight:400, marginTop:2 }}>{team.tryout_notes}</div>}
                </div>
              )}

              {team.description && (
                <div style={{ fontSize:13, color:'var(--gray)', marginTop:10, lineHeight:1.5 }}>{team.description}</div>
              )}

              {(team.contact_name || team.contact_phone || team.contact_email) && (
                <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--lgray)', fontSize:13 }}>
                  {team.contact_name && (
                    <div style={{ fontWeight:600, color:'var(--navy)' }}>📞 {team.contact_name}</div>
                  )}
                  {team.contact_phone && (
                    <div style={{ marginTop:2 }}>
                      <a href={`tel:${team.contact_phone.replace(/\D/g,'')}`}
                        onClick={e => e.stopPropagation()}
                        style={{ color:'var(--navy)', textDecoration:'none', fontWeight:600 }}>
                        {team.contact_phone}
                      </a>
                    </div>
                  )}
                  {team.contact_email && (
                    <div style={{ marginTop:2 }}>
                      <a href={`mailto:${team.contact_email}`}
                        onClick={e => e.stopPropagation()}
                        style={{ color:'#1D4ED8', textDecoration:'none', fontWeight:600 }}>
                        {team.contact_email}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={e => { e.stopPropagation(); setProfileTeam(team) }}
                style={{
                  marginTop:12, width:'100%',
                  background:'var(--navy)', color:'white',
                  border:'none', borderRadius:7,
                  padding:'8px 0', fontSize:13, fontWeight:700,
                  cursor:'pointer', fontFamily:'var(--font-head)', letterSpacing:'0.04em',
                }}
              >
                View Details & Claim
              </button>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--gray)' }}>
          No teams match your filters.
        </div>
      )}
    </div>
  )
}
