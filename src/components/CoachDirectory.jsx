import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'
import CoachProfile from './CoachProfile.jsx'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [28,28], iconAnchor: [14,28], popupAnchor: [0,-30],
})

const makeSelectedIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;background:${color};border:4px solid #f0a500;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [38,38], iconAnchor: [19,38], popupAnchor: [0,-40],
})

const PIN_COLORS = {
  coach:        '#e63329',
  facility:     '#1a1a1a',
  team:         '#1d6fa4',
  open_roster:  '#16a34a',
  needs_player: '#ea580c',
  pickup:       '#0891b2',
}

function coachPinColor(coach) {
  if (coach.listing_type === 'facility') return PIN_COLORS.facility
  return PIN_COLORS.coach
}

// US states for the dropdown
const US_STATES = [
  'All States',
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const SPECIALTIES = ['All Specialties','pitching','hitting','catching','fielding','speed']

const DEMO_COACHES = [
  { id:1, name:'David Sopilka',       sport:'baseball', specialty:['catching'], city:'Chamblee',     state:'GA', zip:'30341', facility_name:'El Dojo',                     lat:33.888, lng:-84.299, credentials:'Elite catching coach',                                              price_notes:'1.5 hr sessions',            recommendation_count:5 },
  { id:2, name:'Cristoforo Romano',    sport:'baseball', specialty:['pitching'], city:'Marietta',     state:'GA', zip:'30062', facility_name:'Harrison Park',               lat:33.961, lng:-84.548, credentials:'Former Detroit Tigers & Brewers MiLB coach; Masters Biomechanics', price_per_session:70, price_notes:'$70 cash / $80 Venmo', recommendation_count:8 },
  { id:3, name:'Chris Bootcheck',      sport:'baseball', specialty:['pitching'], city:'Woodstock',    state:'GA', zip:'30189', facility_name:'Auterson Baseball (The Hive)', lat:34.101, lng:-84.519, credentials:'Former MLB pitcher',                                               recommendation_count:6 },
  { id:4, name:'Jagger Iovinelli',     sport:'baseball', specialty:['pitching'], city:'Alpharetta',   state:'GA', zip:'30004', facility_name:'Grit Academy Athletics',      lat:34.075, lng:-84.294, recommendation_count:4 },
  { id:5, name:'Willie Carter',        sport:'baseball', specialty:['hitting'],  city:'Buford',       state:'GA', zip:'30519', facility_name:'WC19 Pro Hit',                lat:34.119, lng:-83.991, credentials:'Former Atlanta Brave',                                             recommendation_count:3 },
  { id:6, name:'Hannah Lane Triplett', sport:'softball', specialty:['pitching'], city:'Watkinsville', state:'GA', zip:'30677', facility_name:'Della Torre Softball',        lat:33.858, lng:-83.416, credentials:'Top-tier softball pitching',                                       recommendation_count:7 },
  { id:7, name:'Jody Wisdom',          sport:'softball', specialty:['pitching','hitting'], city:'Loganville', state:'GA', zip:'30052', lat:33.836, lng:-83.899,              credentials:'Softball legend',                                                         recommendation_count:5 },
  { id:8, name:'Aiden Berggren',       sport:'baseball', specialty:['catching'], city:'Canton',       state:'GA', zip:'30114', lat:34.237, lng:-84.491,                     credentials:'10+ years; 4 years college baseball',                                    recommendation_count:3 },
]

function parseFirstPhone(raw) {
  if (!raw) return null
  return raw.split(/[\/,]/)[0].trim() || null
}

// ── FlyTo: animate map to selected coach ─────────────────
function FlyTo({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 13, { duration: 0.8 })
  }, [lat, lng])
  return null
}

// ── FitBounds: auto-zoom map to all visible pins ──────────
function FitBounds({ coaches }) {
  const map = useMap()
  useEffect(() => {
    const pts = coaches.filter(c => c.lat && c.lng)
    if (pts.length === 0) return
    const bounds = L.latLngBounds(pts.map(c => [c.lat, c.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [coaches])
  return null
}

// ── Rating row ────────────────────────────────────────────
function RatingRow({ coach, selected }) {
  const avg   = parseFloat(coach.rating_average) || 0
  const count = parseInt(coach.review_count) || 0
  const icon  = coach.sport === 'softball' ? '🥎' : '⚾'

  if (count === 0) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6, fontSize:13 }}>
        <span>{icon}</span>
        <span style={{ opacity:0.45, fontSize:12 }}>No reviews yet</span>
      </div>
    )
  }

  const full  = Math.floor(avg)
  const half  = (avg - full) >= 0.3
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6, fontSize:13 }}>
      <span>{icon}</span>
      <span>{icon.repeat(Math.max(0,full))}{half ? '◐' : ''}{empty > 0 ? '○'.repeat(Math.max(0,empty)) : ''}</span>
      <span style={{ fontWeight:700, color: selected ? 'var(--gold)' : 'var(--navy)' }}>{avg.toFixed(1)}</span>
      <span style={{ opacity:0.6, fontSize:12 }}>({count} review{count !== 1 ? 's' : ''})</span>
    </div>
  )
}

// ── Coach card ────────────────────────────────────────────
function CoachCard({ coach, selected, onClick, onViewProfile }) {
  const specs      = Array.isArray(coach.specialty) ? coach.specialty : (coach.specialty||'').split('|').filter(Boolean)
  const firstPhone = parseFirstPhone(coach.phone)

  const cardStyle = selected ? {
    background:'var(--navy)', color:'var(--white)',
    border:'2px solid var(--gold)', borderRadius:'var(--card-radius)',
    cursor:'pointer', transition:'all 0.15s',
    marginBottom:10, display:'flex', flexDirection:'column',
  } : { marginBottom:10, cursor:'pointer' }

  const footerStyle = selected ? {
    padding:'12px 16px',
    borderTop:'1px solid rgba(255,255,255,0.15)',
    background:'rgba(255,255,255,0.05)',
    borderRadius:'0 0 var(--card-radius) var(--card-radius)',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    marginTop:'auto',
  } : undefined

  return (
    <div className={selected ? '' : 'card'} style={cardStyle} onClick={onClick}>

      {/* ── Card body ── */}
      <div className={selected ? '' : 'card-body'} style={selected ? { flex:1, padding:'14px 16px' } : undefined}>

        {/* Name + badges row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, letterSpacing:'0.02em' }}>
              {coach.name}
            </div>
            {(coach.verified_status || coach.featured_status) && (
              <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                {coach.verified_status && (
                  <span className="badge" style={{ background:'#DBEAFE', color:'#1D4ED8' }}>✓ Verified</span>
                )}
                {coach.featured_status && (
                  <span className="badge" style={{ background:'#FEF3C7', color:'#92400E' }}>⭐ Featured</span>
                )}
              </div>
            )}
            {coach.facility_name && (
              <div style={{ fontSize:13, opacity:0.7, marginTop:4 }}>{coach.facility_name}</div>
            )}
            {/* Location: City, State ZIP */}
            <div style={{ fontSize:13, marginTop:4, opacity:0.8 }}>
              📍 {[coach.city, coach.state].filter(Boolean).join(', ')}{coach.zip ? ` ${coach.zip}` : ''}
            </div>
          </div>
          <span
            className={`badge badge-sport-${coach.sport}`}
            style={selected ? { background:'rgba(255,255,255,0.15)', color:'white' } : undefined}
          >
            {coach.sport}
          </span>
        </div>

        <RatingRow coach={coach} selected={selected} />

        {/* Specialty pills */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
          {specs.map(s => (
            <span key={s} style={{
              background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)',
              color:      selected ? 'white' : 'var(--gray)',
              fontSize:11, padding:'2px 8px', borderRadius:20, textTransform:'capitalize',
            }}>{s}</span>
          ))}
        </div>

        {/* Credentials */}
        {coach.credentials && (
          <div style={{ fontSize:12, marginTop:8, opacity:0.75, lineHeight:1.4 }}>
            {coach.credentials.length > 80 ? coach.credentials.slice(0,80)+'…' : coach.credentials}
          </div>
        )}

        {/* Price row */}
<div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, fontSize:12 }}>
  <span style={{ color: selected ? 'var(--gold)' : 'var(--green)', fontWeight:600 }}>
    {coach.price_per_session
      ? '$' + coach.price_per_session + '/session'
      : coach.price_notes
      ? coach.price_notes
      : 'Contact for rates'}
  </span>
  {coach.recommendation_count > 0 && (
    <span style={{ opacity:0.6 }}>
      👍 {coach.recommendation_count} rec{coach.recommendation_count !== 1 ? 's' : ''}
    </span>
  )}
</div>

      {/* Contact links */}
        {(coach.email || firstPhone || coach.website) && (
          <div style={{
            marginTop:10, paddingTop:10,
            borderTop: '1px solid ' + (selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)'),
            display:'flex', flexDirection:'column', gap:3,
          }}>
            {coach.email && (
              <a href={'mailto:' + coach.email} className="contact-link"
                onClick={e => e.stopPropagation()}
                style={{ color: selected ? 'var(--gold)' : '#1D4ED8' }}>
                📧 {coach.email}
              </a>
            )}
            {firstPhone && (
              <a href={'tel:' + firstPhone.replace(/\D/g,'')} className="contact-link"
                onClick={e => e.stopPropagation()}
                style={{ color: selected ? 'var(--gold)' : 'var(--navy)' }}>
                📞 {firstPhone}
              </a>
            )}
            {coach.website && (
              <a href={coach.website.startsWith('http') ? coach.website : 'https://' + coach.website}
                target="_blank" rel="noopener noreferrer" className="contact-link"
                onClick={e => e.stopPropagation()}
                style={{ color: selected ? 'var(--gold)' : '#1D4ED8' }}>
                🌐 Website
              </a>
            )}
          </div>
        )} 
      </div>

      {/* ── Card footer — button always pinned to bottom ── */}
      <div className={selected ? '' : 'card-footer'} style={footerStyle}>
        <button
          onClick={e => { e.stopPropagation(); onViewProfile(coach) }}
          style={{
            width:'100%',
            background: selected ? 'var(--gold)' : 'var(--navy)',
            color:'white', border:'none',
            borderRadius:'var(--btn-radius)',
            padding:'8px 0', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'var(--font-head)', letterSpacing:'0.04em',
          }}
        >
          View Profile & Reviews
        </button>
      </div>
    </div>
  )
}

// ── Map markers ───────────────────────────────────────────
function MapMarkers({ mappable, selected, setSelected }) {
  return mappable.map(coach => {
    const isSelected = coach.id === selected
    return (
      <Marker
        key={coach.id}
        position={[coach.lat, coach.lng]}
        icon={isSelected ? makeSelectedIcon(coachPinColor(coach)) : makeIcon(coachPinColor(coach))}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{ click: () => setSelected(coach.id) }}
      >
        <Popup>
          <div style={{ fontFamily:'var(--font-body)', minWidth:180 }}>
            <strong style={{ fontFamily:'var(--font-head)', fontSize:15 }}>{coach.name}</strong>
            {coach.facility_name && <div style={{ fontSize:12, color:'#666' }}>{coach.facility_name}</div>}
            <div style={{ fontSize:12, marginTop:4 }}>
              📍 {[coach.city, coach.state].filter(Boolean).join(', ')}{coach.zip ? ` ${coach.zip}` : ''}
            </div>
            <div style={{ fontSize:12, marginTop:2 }}>
              🎯 {(Array.isArray(coach.specialty) ? coach.specialty : (coach.specialty||'').split('|').filter(Boolean)).join(', ')}
            </div>
            {coach.price_per_session && (
              <div style={{ fontSize:12, color:'#16A34A', fontWeight:600, marginTop:2 }}>
                ${coach.price_per_session}/session
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    )
  })
}

// ── Map legend ────────────────────────────────────────────
const MAP_LEGEND_ITEMS = [
  { color: PIN_COLORS.coach,        label: 'Coach' },
  { color: PIN_COLORS.facility,     label: 'Facility' },
  { color: PIN_COLORS.team,         label: 'Team' },
  { color: PIN_COLORS.open_roster,  label: 'Open Roster' },
  { color: PIN_COLORS.needs_player, label: 'Needs Player' },
  { color: PIN_COLORS.pickup,       label: 'Player Available' },
]

function MapLegend() {
  return (
    <div style={{
      display:'flex', flexWrap:'wrap', gap:12, padding:'7px 14px',
      background:'var(--white)', borderBottom:'2px solid var(--lgray)', alignItems:'center',
    }}>
      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--gray)', marginRight:2 }}>
        Map key
      </span>
      {MAP_LEGEND_ITEMS.map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{
            width:11, height:11, borderRadius:'50% 50% 50% 0',
            transform:'rotate(-45deg)', background:item.color,
            border:'2px solid rgba(255,255,255,0.8)',
            boxShadow:'0 1px 3px rgba(0,0,0,0.3)', flexShrink:0,
          }} />
          <span style={{ fontSize:11, color:'var(--gray)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function CoachDirectory() {
  const [searchParams] = useSearchParams()

  const [coaches,      setCoaches]      = useState(DEMO_COACHES)
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(() => {
    const id = searchParams.get('select')
    return id ? Number(id) : null
  })
  const [sport,        setSport]        = useState('Both')
  const [specialty,    setSpecialty]    = useState('All Specialties')
  const [state,        setState]        = useState('All States')
  const [search,       setSearch]       = useState('')
  const [profileCoach, setProfileCoach] = useState(null)
  const [showMap,      setShowMap]      = useState(false)
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['approved', 'seeded'])
      if (!error && data && data.length > 0) {
        setCoaches(data)
        const selectId = searchParams.get('select')
        if (selectId) {
          const match = data.find(c => String(c.id) === selectId)
          if (match) setSelected(match.id)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = coaches.filter(c => {
    const specs = Array.isArray(c.specialty) ? c.specialty : (c.specialty||'').split('|').filter(Boolean)
    if (sport !== 'Both' && c.sport !== sport && c.sport !== 'both') return false
    if (specialty !== 'All Specialties' && !specs.includes(specialty)) return false
    if (state !== 'All States' && (c.state||'').toUpperCase() !== state) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(c.name||'').toLowerCase().includes(q) &&
        !(c.city||'').toLowerCase().includes(q) &&
        !(c.facility_name||'').toLowerCase().includes(q) &&
        !(c.zip||'').includes(q)
      ) return false
    }
    return true
  }).sort((a, b) => {
    if (a.id === selected) return -1
    if (b.id === selected) return 1
    return 0
  })

  const mappable = filtered.filter(c => c.lat && c.lng)
  const sel = selected ? coaches.find(c => c.id === selected) : null

  const filterSelectStyle = {
    padding:'8px 12px', borderRadius:'var(--input-radius)',
    border:'1.5px solid var(--lgray)', background:'var(--white)',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  function EmptyState() {
    const hasFilters = sport !== 'Both' || specialty !== 'All Specialties' || state !== 'All States' || search
    return (
      <div className="empty-state">
        <h3>{hasFilters ? 'No coaches match your filters' : 'No coaches listed yet'}</h3>
        <p>
          {hasFilters
            ? 'Try widening your search — remove a filter or search a broader area.'
            : 'Know a great coach? Help us grow the directory.'}
        </p>
        {!hasFilters && <a href="/submit">Add a Coach Listing</a>}
      </div>
    )
  }

  return (
    <>
      {profileCoach && (
        <CoachProfile coach={profileCoach} onClose={() => setProfileCoach(null)} />
      )}

      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

        {/* ── Filter bar ── */}
        <div className="filter-bar">

          {/* Search — name, city, facility, or zip */}
          <input
            placeholder="🔍  Search name, city, facility, or zip..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...filterSelectStyle, flex:1, minWidth:160 }}
          />

          {/* Sport pill toggles */}
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <button
              className={`pill-toggle ${sport === 'baseball' ? 'active-baseball' : ''}`}
              onClick={() => setSport(s => s === 'baseball' ? 'Both' : 'baseball')}
            >
              ⚾ Baseball
            </button>
            <button
              className={`pill-toggle ${sport === 'softball' ? 'active-softball' : ''}`}
              onClick={() => setSport(s => s === 'softball' ? 'Both' : 'softball')}
            >
              🥎 Softball
            </button>
          </div>

          {/* Specialty dropdown */}
          <select value={specialty} onChange={e => setSpecialty(e.target.value)} style={filterSelectStyle}>
            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* State dropdown */}
          <select value={state} onChange={e => setState(e.target.value)} style={filterSelectStyle}>
            {US_STATES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Result count */}
          <span className="result-count">
            {filtered.length} coach{filtered.length !== 1 ? 'es' : ''}
          </span>

          {/* Mobile map toggle */}
          {isMobile && (
            <button
              onClick={() => setShowMap(m => !m)}
              style={{
                padding:'8px 14px', borderRadius:'var(--btn-radius)',
                border:'2px solid var(--navy)',
                background: showMap ? 'var(--navy)' : 'var(--white)',
                color:      showMap ? 'var(--white)' : 'var(--navy)',
                fontSize:13, fontWeight:700,
                fontFamily:'var(--font-head)', whiteSpace:'nowrap',
              }}
            >
              {showMap ? '📋 List' : '🗺 Map'}
            </button>
          )}
        </div>

        {/* ── Mobile layout ── */}
        {isMobile ? (
          <div style={{ flex:1, overflowY:'auto', background:'var(--cream)' }}>
            {showMap && (
              <div style={{ height:240, flexShrink:0 }}>
                <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height:'100%', width:'100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sel?.lat && <FlyTo lat={sel.lat} lng={sel.lng} />}
                  <FitBounds coaches={mappable} />
                  <MapMarkers mappable={mappable} selected={selected} setSelected={setSelected} />
                </MapContainer>
              </div>
            )}
            <div style={{ padding:'12px' }}>
              {loading && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>
                  Loading coaches...
                </div>
              )}
              {!loading && filtered.length === 0 && <EmptyState />}
              {filtered.map(coach => (
                <CoachCard key={coach.id} coach={coach} selected={selected === coach.id}
                  onClick={() => setSelected(selected === coach.id ? null : coach.id)}
                  onViewProfile={setProfileCoach} />
              ))}
            </div>
          </div>

        ) : (
          /* ── Desktop: 3-column layout — list | map | ads ── */
          <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 112px)' }}>

            {/* Left: coach list */}
            <div style={{
              width:400, flexShrink:0, overflowY:'auto',
              padding:'14px', borderRight:'2px solid var(--lgray)',
              background:'var(--cream)',
            }}>
              {loading && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>
                  Loading coaches...
                </div>
              )}
              {!loading && filtered.length === 0 && <EmptyState />}
              {filtered.map(coach => (
                <CoachCard key={coach.id} coach={coach} selected={selected === coach.id}
                  onClick={() => setSelected(selected === coach.id ? null : coach.id)}
                  onViewProfile={setProfileCoach} />
              ))}
            </div>

            {/* Center: map + legend */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
              <MapLegend />
              <div style={{ flex:1, position:'relative' }}>
                {/* Default center = continental US when no state selected */}
                <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height:'100%', width:'100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sel?.lat && <FlyTo lat={sel.lat} lng={sel.lng} />}
                  <FitBounds coaches={mappable} />
                  <MapMarkers mappable={mappable} selected={selected} setSelected={setSelected} />
                </MapContainer>
              </div>
            </div>

            {/* Right: ad column */}
            <div style={{
              width:220, flexShrink:0,
              borderLeft:'2px solid var(--lgray)',
              background:'var(--white)',
              display:'flex', flexDirection:'column',
              gap:16, padding:16, overflowY:'auto',
            }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  border:'2px dashed var(--lgray)', borderRadius:'var(--card-radius)',
                  padding:'16px 12px', textAlign:'center',
                  background:'var(--cream)', minHeight:180,
                  display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:6,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--gray)' }}>
                    Advertise Here
                  </div>
                  <div style={{ fontSize:11, color:'#aaa', lineHeight:1.5 }}>
                    Reach baseball &amp; softball families
                  </div>
                  <a href="mailto:admin.bsbldirectory@gmail.com"
                    style={{ fontSize:11, color:'var(--red)', fontWeight:700, textDecoration:'none', marginTop:4 }}>
                    Contact Us
                  </a>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </>
  )
}
