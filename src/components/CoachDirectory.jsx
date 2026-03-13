import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'
import CoachProfile from './CoachProfile.jsx'

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

// ── Region → County map covering all of Georgia ──────────────────────────────
const REGIONS = {
  'North Georgia': [
    'Barrow','Banks','Cherokee','Clarke','Cobb','Dawson','DeKalb','Fannin','Forsyth',
    'Franklin','Gilmer','Gordon','Gwinnett','Habersham','Hall','Hart','Jackson',
    'Lumpkin','Madison','Murray','Oconee','Pickens','Rabun','Stephens','Towns',
    'Union','Walker','Walton','White','Whitfield',
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

const REGION_NAMES = ['All Regions', ...Object.keys(REGIONS)]
const ALL_COUNTIES_SORTED = Object.values(REGIONS).flat().sort()

const SPECIALTIES = ['All Specialties','pitching','hitting','catching','fielding','speed']
const SPORTS = ['Both','baseball','softball']

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

function parseFirstPhone(raw) {
  if (!raw) return null
  return raw.split(/[\/,]/)[0].trim() || null
}

function RatingRow({ coach, selected }) {
  const avg = parseFloat(coach.rating_average) || 0
  const count = parseInt(coach.review_count) || 0
  if (count === 0) return null
  const icon = coach.sport === 'softball' ? '🥎' : '⚾'
  const full = Math.floor(avg)
  const half = (avg - full) >= 0.3
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6, fontSize:13 }}>
      <span>{icon.repeat(Math.max(0,full))}{half ? '◐' : ''}{empty > 0 ? '○'.repeat(Math.max(0,empty)) : ''}</span>
      <span style={{ fontWeight:700, color: selected ? 'var(--gold)' : 'var(--navy)' }}>{avg.toFixed(1)}</span>
      <span style={{ opacity:0.6, fontSize:12 }}>({count} review{count !== 1 ? 's' : ''})</span>
    </div>
  )
}

function CoachCard({ coach, selected, onClick, onViewProfile }) {
  const tierColor = TIER_COLORS[coach.tier] || TIER_COLORS.local
  const specs = Array.isArray(coach.specialty) ? coach.specialty : (coach.specialty||'').split('|').filter(Boolean)
  const firstPhone = parseFirstPhone(coach.phone)

  return (
    <div onClick={onClick} style={{
      background: selected ? 'var(--navy)' : 'var(--white)',
      color: selected ? 'var(--white)' : 'var(--navy)',
      border: `2px solid ${selected ? 'var(--gold)' : 'var(--lgray)'}`,
      borderRadius: 10, padding: '14px 16px',
      cursor: 'pointer', transition: 'all 0.15s', marginBottom: 10,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, letterSpacing:'0.02em' }}>{coach.name}</div>
          {(coach.verified_status || coach.featured_status) && (
            <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
              {coach.verified_status && (
                <span style={{ background:'#DBEAFE', color:'#1D4ED8', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)', letterSpacing:'0.04em' }}>✓ Verified</span>
              )}
              {coach.featured_status && (
                <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)', letterSpacing:'0.04em' }}>⭐ Featured</span>
              )}
            </div>
          )}
          {coach.facility_name && <div style={{ fontSize:13, opacity:0.7, marginTop:4 }}>{coach.facility_name}</div>}
          <div style={{ fontSize:13, marginTop:4, opacity:0.8 }}>
            📍 {[coach.city, coach.county ? coach.county+' Co.' : null].filter(Boolean).join(', ')}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <span style={{ background:tierColor, color:'white', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-head)' }}>{coach.tier}</span>
          <span style={{ background: coach.sport==='softball' ? '#7C3AED' : '#1D4ED8', color:'white', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-head)' }}>{coach.sport}</span>
        </div>
      </div>

      <RatingRow coach={coach} selected={selected} />

      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
        {specs.map(s => (
          <span key={s} style={{ background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)', color: selected ? 'white' : 'var(--gray)', fontSize:11, padding:'2px 8px', borderRadius:20, textTransform:'capitalize' }}>{s}</span>
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

      {(coach.email || firstPhone || coach.website) && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)'}`, fontSize:12, display:'flex', flexDirection:'column', gap:3 }}>
          {coach.email && (
            <a href={`mailto:${coach.email}`} onClick={e => e.stopPropagation()}
              style={{ color: selected ? 'var(--gold)' : '#1D4ED8', textDecoration:'none', fontWeight:600 }}>📧 {coach.email}</a>
          )}
          {firstPhone && (
            <a href={`tel:${firstPhone.replace(/\D/g,'')}`} onClick={e => e.stopPropagation()}
              style={{ color: selected ? 'var(--gold)' : 'var(--navy)', textDecoration:'none', fontWeight:600 }}>📞 {firstPhone}</a>
          )}
          {coach.website && (
            <a href={coach.website.startsWith('http') ? coach.website : `https://${coach.website}`}
              target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ color: selected ? 'var(--gold)' : '#1D4ED8', textDecoration:'none', fontWeight:600 }}>🌐 Website</a>
          )}
        </div>
      )}

      <button onClick={e => { e.stopPropagation(); onViewProfile(coach) }} style={{
        marginTop:12, width:'100%',
        background: selected ? 'var(--gold)' : 'var(--navy)',
        color:'white', border:'none', borderRadius:7,
        padding:'8px 0', fontSize:13, fontWeight:700,
        cursor:'pointer', fontFamily:'var(--font-head)', letterSpacing:'0.04em',
      }}>
        View Profile & Reviews
      </button>
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
  const [region, setRegion] = useState('All Regions')
  const [county, setCounty] = useState('All Counties')
  const [search, setSearch] = useState('')
  const [profileCoach, setProfileCoach] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('coaches').select('*').eq('active', true)
      if (!error && data && data.length > 0) setCoaches(data)
      setLoading(false)
    }
    load()
  }, [])

  function handleRegionChange(r) {
    setRegion(r)
    setCounty('All Counties')
  }

  const countyOptions = region === 'All Regions'
    ? ['All Counties', ...ALL_COUNTIES_SORTED]
    : ['All Counties', ...(REGIONS[region] || []).sort()]

  const filtered = coaches.filter(c => {
    const specs = Array.isArray(c.specialty) ? c.specialty : (c.specialty||'').split('|').filter(Boolean)
    if (sport !== 'Both' && c.sport !== sport && c.sport !== 'both') return false
    if (specialty !== 'All Specialties' && !specs.includes(specialty)) return false
    if (region !== 'All Regions' && county === 'All Counties') {
      if (!REGIONS[region].map(r => r.toLowerCase()).includes((c.county||'').toLowerCase())) return false
    }
    if (county !== 'All Counties' && (c.county||'').toLowerCase() !== county.toLowerCase()) return false
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

  const mapPanel = (
    <div style={{ position:'relative', height: isMobile ? 280 : '100%', width:'100%' }}>
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
      {/* Default zoom to all GA when All Regions, zoom to North GA otherwise */}
      <MapContainer
        center={region === 'All Regions' ? [32.5, -83.5] : [34.05, -84.25]}
        zoom={region === 'All Regions' ? 7 : 9}
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
            <Marker key={coach.id} position={[coach.lat, coach.lng]}
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
  )

  return (
    <>
      {profileCoach && (
        <CoachProfile coach={profileCoach} onClose={() => setProfileCoach(null)} />
      )}

      <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 108px)' }}>

        {/* ── Filter Bar ── */}
        <div style={{
          background:'var(--white)', borderBottom:'2px solid var(--lgray)',
          padding:'12px 16px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
          position:'sticky', top:0, zIndex:500,
        }}>
          <input
            placeholder="🔍  Search coaches, facilities, cities..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...filterStyle, flex:1, minWidth:160 }}
          />
          <select value={sport} onChange={e => setSport(e.target.value)} style={filterStyle}>
            {SPORTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={filterStyle}>
            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Region then County — county dims until region is picked */}
          <select value={region} onChange={e => handleRegionChange(e.target.value)} style={filterStyle}>
            {REGION_NAMES.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={county} onChange={e => setCounty(e.target.value)}
            style={{ ...filterStyle, opacity: region === 'All Regions' ? 0.6 : 1 }}>
            {countyOptions.map(c => <option key={c}>{c}</option>)}
          </select>

          <span style={{ fontSize:13, color:'var(--gray)', whiteSpace:'nowrap' }}>
            {filtered.length} coach{filtered.length !== 1 ? 'es':''}
          </span>

          {isMobile && (
            <button onClick={() => setShowMap(m => !m)} style={{
              padding:'8px 14px', borderRadius:8, border:'2px solid var(--navy)',
              background: showMap ? 'var(--navy)' : 'white',
              color: showMap ? 'white' : 'var(--navy)',
              fontSize:13, fontWeight:700, cursor:'pointer',
              fontFamily:'var(--font-head)', whiteSpace:'nowrap',
            }}>
              {showMap ? '📋 List' : '🗺 Map'}
            </button>
          )}
        </div>

        {isMobile ? (
          <div style={{ flex:1, overflowY:'auto', background:'var(--cream)' }}>
            {showMap && <div style={{ height:280, flexShrink:0 }}>{mapPanel}</div>}
            <div style={{ padding:'12px' }}>
              {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>Loading coaches...</div>}
              {!loading && filtered.length === 0 && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>No coaches match your filters.</div>}
              {filtered.map(coach => (
                <CoachCard key={coach.id} coach={coach} selected={selected === coach.id}
                  onClick={() => setSelected(selected === coach.id ? null : coach.id)}
                  onViewProfile={setProfileCoach} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
            <div style={{ width:380, flexShrink:0, overflowY:'auto', padding:'16px', borderRight:'2px solid var(--lgray)', background:'var(--cream)' }}>
              {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>Loading coaches...</div>}
              {!loading && filtered.length === 0 && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>No coaches match your filters.</div>}
              {filtered.map(coach => (
                <CoachCard key={coach.id} coach={coach} selected={selected === coach.id}
                  onClick={() => setSelected(selected === coach.id ? null : coach.id)}
                  onViewProfile={setProfileCoach} />
              ))}
            </div>
            <div style={{ flex:1, position:'relative', minWidth:0 }}>{mapPanel}</div>
          </div>
        )}
      </div>
    </>
  )
}
