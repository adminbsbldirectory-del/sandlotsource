import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid white;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
})

const TIER_COLORS = {
  elite:  '#D42B2B',
  strong: '#F0A500',
  local:  '#0B1F3A',
  budget: '#6B7280',
}

const COUNTIES = ['All Counties','Cherokee','Cobb','DeKalb','Forsyth','Fulton','Gwinnett','Hall','Barrow','Oconee','Walton']
const SPECIALTIES = ['All Specialties','pitching','hitting','catching','fielding','speed']
const SPORTS = ['Both','baseball','softball']

// Fallback demo data shown before DB is populated
const DEMO_COACHES = [
  { id:1, name:'David Sopilka', sport:'baseball', specialty:['catching'], city:'Chamblee', county:'DeKalb', facility_name:'El Dojo', tier:'elite', lat:33.888, lng:-84.299, credentials:'Elite catching coach', price_notes:'1.5 hr sessions', recommendation_count:5 },
  { id:2, name:'Cristoforo Romano', sport:'baseball', specialty:['pitching'], city:'Marietta', county:'Cobb', facility_name:'Harrison Park', tier:'elite', lat:33.961, lng:-84.548, credentials:'Former Detroit Tigers & Brewers MiLB coach; Masters Biomechanics', price_per_session:70, price_notes:'$70 cash / $80 Venmo', recommendation_count:8 },
  { id:3, name:'Chris Bootcheck', sport:'baseball', specialty:['pitching'], city:'Woodstock', county:'Cherokee', facility_name:'Auterson Baseball (The Hive)', tier:'elite', lat:34.101, lng:-84.519, credentials:'Former MLB pitcher', recommendation_count:6 },
  { id:4, name:'Jagger Iovinelli', sport:'baseball', specialty:['pitching'], city:'Alpharetta', county:'Fulton', facility_name:'Grit Academy Athletics', tier:'strong', lat:34.075, lng:-84.294, recommendation_count:4 },
  { id:5, name:'Willie Carter', sport:'baseball', specialty:['hitting'], city:'Buford', county:'Gwinnett', facility_name:'WC19 Pro Hit', tier:'elite', lat:34.119, lng:-83.991, credentials:'Former Atlanta Brave', recommendation_count:3 },
  { id:6, name:'Hannah Lane Triplett', sport:'softball', specialty:['pitching'], city:'Watkinsville', county:'Oconee', facility_name:'Della Torre Softball', tier:'elite', lat:33.858, lng:-83.416, credentials:'Top-tier softball pitching', recommendation_count:7 },
  { id:7, name:'Jody Wisdom', sport:'softball', specialty:['pitching','hitting'], city:'Loganville', county:'Walton', tier:'elite', lat:33.836, lng:-83.899, credentials:'Softball legend', recommendation_count:5 },
  { id:8, name:'Aiden Berggren', sport:'baseball', specialty:['catching'], city:'Canton', county:'Cherokee', tier:'strong', lat:34.237, lng:-84.491, credentials:'10+ years; 4 years college baseball', recommendation_count:3 },
]

function CoachCard({ coach, selected, onClick }) {
  const tierColor = TIER_COLORS[coach.tier] || TIER_COLORS.local
  const specs = Array.isArray(coach.specialty) ? coach.specialty : (coach.specialty||'').split('|').filter(Boolean)

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'var(--navy)' : 'var(--white)',
        color: selected ? 'var(--white)' : 'var(--navy)',
        border: `2px solid ${selected ? 'var(--gold)' : 'var(--lgray)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 10,
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 17, fontWeight: 700,
            letterSpacing: '0.02em',
          }}>{coach.name}</div>
          {coach.facility_name && (
            <div style={{ fontSize:13, opacity:0.7, marginTop:2 }}>{coach.facility_name}</div>
          )}
          <div style={{ fontSize:13, marginTop:4, opacity:0.8 }}>
            📍 {[coach.city, coach.county ? coach.county+' Co.' : null].filter(Boolean).join(', ')}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <span style={{
            background: tierColor, color:'white',
            fontSize:10, fontWeight:700,
            padding:'2px 7px', borderRadius:20,
            textTransform:'uppercase', letterSpacing:'0.06em',
            fontFamily:'var(--font-head)',
          }}>{coach.tier}</span>
          <span style={{
            background: coach.sport === 'softball' ? '#7C3AED' : '#1D4ED8',
            color:'white', fontSize:10, fontWeight:700,
            padding:'2px 7px', borderRadius:20,
            textTransform:'uppercase', letterSpacing:'0.06em',
            fontFamily:'var(--font-head)',
          }}>{coach.sport}</span>
        </div>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
        {specs.map(s => (
          <span key={s} style={{
            background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)',
            color: selected ? 'white' : 'var(--gray)',
            fontSize:11, padding:'2px 8px', borderRadius:20,
            textTransform:'capitalize',
          }}>{s}</span>
        ))}
      </div>

      {coach.credentials && (
        <div style={{ fontSize:12, marginTop:8, opacity:0.75, lineHeight:1.4 }}>
          {coach.credentials.length > 80 ? coach.credentials.slice(0,80)+'…' : coach.credentials}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12 }}>
        {coach.price_per_session
          ? <span style={{ color: selected ? 'var(--gold)' : 'var(--green)', fontWeight:600 }}>${coach.price_per_session}/session</span>
          : coach.price_notes
          ? <span style={{ color: selected ? 'var(--gold)' : 'var(--green)', fontWeight:600 }}>{coach.price_notes}</span>
          : <span style={{ opacity:0.5 }}>Price TBD</span>
        }
        {coach.recommendation_count > 0 && (
          <span style={{ opacity:0.6 }}>👍 {coach.recommendation_count} rec{coach.recommendation_count !== 1 ? 's':''}</span>
        )}
      </div>
    </div>
  )
}

function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 14, { duration: 0.8 })
  }, [lat, lng])
  return null
}

export default function CoachDirectory() {
  const [coaches, setCoaches] = useState(DEMO_COACHES)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [sport, setSport] = useState('Both')
  const [specialty, setSpecialty] = useState('All Specialties')
  const [county, setCounty] = useState('All Counties')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('coaches').select('*').eq('active', true)
      if (!error && data && data.length > 0) setCoaches(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = coaches.filter(c => {
    const specs = Array.isArray(c.specialty) ? c.specialty : (c.specialty||'').split('|').filter(Boolean)
    if (sport !== 'Both' && c.sport !== sport && c.sport !== 'both') return false
    if (specialty !== 'All Specialties' && !specs.includes(specialty)) return false
    if (county !== 'All Counties' && c.county !== county) return false
    if (search) {
      const q = search.toLowerCase()
      if (!(c.name||'').toLowerCase().includes(q) &&
          !(c.city||'').toLowerCase().includes(q) &&
          !(c.facility_name||'').toLowerCase().includes(q)) return false
    }
    return true
  })

  const mappable = filtered.filter(c => c.lat && c.lng)
  const sel = selected ? coaches.find(c => c.id === selected) : null

  const filterStyle = {
    padding:'8px 12px', borderRadius:8,
    border:'2px solid var(--lgray)', background:'white',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)' }}>
      {/* Filter Bar */}
      <div style={{
        background:'var(--white)', borderBottom:'2px solid var(--lgray)',
        padding:'12px 24px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
      }}>
        <input
          placeholder="🔍  Search coaches, facilities, cities..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...filterStyle, flex:1, minWidth:200 }}
        />
        <select value={sport} onChange={e => setSport(e.target.value)} style={filterStyle}>
          {SPORTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={filterStyle}>
          {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={county} onChange={e => setCounty(e.target.value)} style={filterStyle}>
          {COUNTIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize:13, color:'var(--gray)', whiteSpace:'nowrap' }}>
          {filtered.length} coach{filtered.length !== 1 ? 'es':''}
        </span>
      </div>

      {/* Main Layout */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Left panel: list */}
        <div style={{
          width:380, flexShrink:0,
          overflowY:'auto', padding:'16px',
          borderRight:'2px solid var(--lgray)',
          background:'var(--cream)',
        }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>
              Loading coaches...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>
              No coaches match your filters.
            </div>
          )}
          {filtered.map(coach => (
            <CoachCard
              key={coach.id}
              coach={coach}
              selected={selected === coach.id}
              onClick={() => setSelected(selected === coach.id ? null : coach.id)}
            />
          ))}
        </div>

        {/* Right: map */}
        <div style={{ flex:1, position:'relative' }}>
          {/* Legend */}
          <div style={{
            position:'absolute', top:12, right:12, zIndex:1000,
            background:'white', borderRadius:10, padding:'10px 14px',
            boxShadow:'0 2px 12px rgba(0,0,0,0.12)',
            fontSize:12, fontFamily:'var(--font-body)',
          }}>
            {Object.entries(TIER_COLORS).map(([tier, color]) => (
              <div key={tier} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:color }} />
                <span style={{ textTransform:'capitalize', color:'var(--navy)' }}>{tier}</span>
              </div>
            ))}
          </div>

          <MapContainer
            center={[34.05, -84.25]}
            zoom={9}
            style={{ height:'100%', width:'100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {sel && sel.lat && <FlyTo lat={sel.lat} lng={sel.lng} />}
            {mappable.map(coach => {
              const specs = Array.isArray(coach.specialty) ? coach.specialty : (coach.specialty||'').split('|').filter(Boolean)
              return (
                <Marker
                  key={coach.id}
                  position={[coach.lat, coach.lng]}
                  icon={makeIcon(TIER_COLORS[coach.tier] || TIER_COLORS.local)}
                  eventHandlers={{ click: () => setSelected(coach.id) }}
                >
                  <Popup>
                    <div style={{ fontFamily:'var(--font-body)', minWidth:180 }}>
                      <strong style={{ fontFamily:'var(--font-head)', fontSize:15 }}>{coach.name}</strong>
                      {coach.facility_name && <div style={{ fontSize:12, color:'#666' }}>{coach.facility_name}</div>}
                      <div style={{ fontSize:12, marginTop:4 }}>📍 {coach.city}{coach.county ? `, ${coach.county}` : ''}</div>
                      <div style={{ fontSize:12, marginTop:2 }}>🎯 {specs.join(', ')}</div>
                      {coach.price_per_session && <div style={{ fontSize:12, color:'#16A34A', fontWeight:600, marginTop:2 }}>${coach.price_per_session}/session</div>}
                      {coach.credentials && <div style={{ fontSize:11, color:'#666', marginTop:4 }}>{coach.credentials.slice(0,100)}</div>}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
