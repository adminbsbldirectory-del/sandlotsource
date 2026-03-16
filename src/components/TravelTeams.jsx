import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'
import TeamProfile from './TeamProfile.jsx'

// ── Leaflet icon fix ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -28],
})

// ── Pin colors ───────────────────────────────────────────────────────────────
const PIN_COLORS = {
  team:        '#1d6fa4',
  open_roster: '#16a34a',
  tryout:      '#f0a500',
}

function teamPinColor(team) {
  if (team.tryout_status === 'open') return PIN_COLORS.tryout
  if (team.roster_status === 'open' || team.open_spots > 0) return PIN_COLORS.open_roster
  return PIN_COLORS.team
}

// ── All 50 states ────────────────────────────────────────────────────────────
const US_STATES = [
  { abbr: 'AL', name: 'Alabama' },    { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' },    { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' },{ abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' },    { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' },     { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' },   { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' },       { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' },   { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' },      { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' },{ abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' },  { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' },   { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' },   { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' },{ abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' },{ abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' },       { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' },     { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' },{ abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' },{ abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' },      { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' },    { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' },  { abbr: 'WY', name: 'Wyoming' },
]

// ── Geocode zip ──────────────────────────────────────────────────────────────
async function geocodeZip(zip) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) }
  } catch { return null }
}

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── Status badge config ──────────────────────────────────────────────────────
const STATUS_STYLE = {
  open:       { bg:'#DCFCE7', color:'#16A34A', label:'Open Tryouts' },
  closed:     { bg:'#FEE2E2', color:'#DC2626', label:'Closed' },
  by_invite:  { bg:'#FEF3C7', color:'#D97706', label:'By Invite' },
  year_round: { bg:'#DBEAFE', color:'#2563EB', label:'Year Round' },
}

const AGE_OPTIONS = ['All Ages','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U']

// ── Map center by state abbr (approximate) ───────────────────────────────────
const STATE_CENTERS = {
  GA:[32.5,-83.5], FL:[27.8,-81.7], AL:[32.8,-86.8], TN:[35.8,-86.4],
  SC:[33.8,-81.1], NC:[35.5,-79.0], TX:[31.0,-100.0], CA:[36.7,-119.7],
  NY:[42.9,-75.5], FL:[27.8,-81.7],
}

export default function TravelTeams() {
  const [teams,        setTeams]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [profileTeam,  setProfileTeam]  = useState(null)
  const [showMap,      setShowMap]      = useState(false)
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768)
  const [detectingLoc, setDetectingLoc] = useState(true)

  // Filters
  const [state,         setState]         = useState('')
  const [sport,         setSport]         = useState('Both')
  const [ageGroup,      setAgeGroup]      = useState('All Ages')
  const [tryoutFilter,  setTryoutFilter]  = useState('All')
  const [zip,           setZip]           = useState('')
  const [radius,        setRadius]        = useState(25)
  const [geoCenter,     setGeoCenter]     = useState(null)
  const [zipError,      setZipError]      = useState('')

  // Detect state from IP on load
  useEffect(() => {
    async function detectState() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (res.ok) {
          const data = await res.json()
          if (data.region_code) setState(data.region_code)
          else setState('GA') // fallback
        } else {
          setState('GA')
        }
      } catch {
        setState('GA')
      } finally {
        setDetectingLoc(false)
      }
    }
    detectState()
  }, [])

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Fetch teams
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('travel_teams')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['approved', 'seeded'])
      if (!error && data) setTeams(data)
      setLoading(false)
    }
    load()
  }, [])

  // Geocode zip when changed
  useEffect(() => {
    if (!zip || zip.length !== 5) { setGeoCenter(null); setZipError(''); return }
    geocodeZip(zip).then(geo => {
      if (geo) { setGeoCenter(geo); setZipError('') }
      else setZipError('Zip not found')
    })
  }, [zip])

  // Filter logic
  const filtered = teams.filter(t => {
    // State filter — match on state column, fallback: if team has no state, treat as GA
    const teamState = (t.state || 'GA').toUpperCase()
    if (state && teamState !== state.toUpperCase()) return false
    if (sport !== 'Both' && t.sport !== sport && t.sport !== 'both') return false
    if (ageGroup !== 'All Ages' && t.age_group !== ageGroup) return false
    if (tryoutFilter !== 'All' && t.tryout_status !== tryoutFilter) return false
    // Zip radius filter (only when geo is available and team has coordinates)
    if (geoCenter && t.lat && t.lng) {
      const dist = distanceMiles(geoCenter.lat, geoCenter.lng, t.lat, t.lng)
      if (dist > radius) return false
    }
    return true
  })

  const mappable = filtered.filter(t => t.lat && t.lng)
  const selectedState = US_STATES.find(s => s.abbr === state)
  const mapCenter = geoCenter
    ? [geoCenter.lat, geoCenter.lng]
    : (STATE_CENTERS[state] || [32.5, -83.5])

  const filterStyle = {
    padding:'7px 11px', borderRadius:8,
    border:'2px solid var(--lgray)', background:'white',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  // ── Map legend ──────────────────────────────────────────────────────────────
  const mapLegend = (
    <div style={{ display:'flex', flexWrap:'wrap', gap:12, padding:'7px 16px', background:'#fff', borderBottom:'2px solid var(--lgray)', alignItems:'center' }}>
      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--gray)' }}>Map key</span>
      {[
        { color: PIN_COLORS.team,        label: 'Team' },
        { color: PIN_COLORS.open_roster, label: 'Open Roster' },
        { color: PIN_COLORS.tryout,      label: 'Tryouts Open' },
      ].map(item => (
        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:12, height:12, borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)', background:item.color, border:'2px solid rgba(255,255,255,0.8)', boxShadow:'0 1px 3px rgba(0,0,0,0.3)', flexShrink:0 }} />
          <span style={{ fontSize:11, color:'var(--gray)' }}>{item.label}</span>
        </div>
      ))}
      {mappable.length === 0 && (
        <span style={{ fontSize:11, color:'#aaa', fontStyle:'italic' }}>Map pins appear as teams add location data</span>
      )}
    </div>
  )

  // ── Map panel ───────────────────────────────────────────────────────────────
  const mapPanel = (
    <div style={{ height: isMobile ? 240 : 340, width:'100%' }}>
      <MapContainer center={mapCenter} zoom={geoCenter ? 10 : 7} style={{ height:'100%', width:'100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mappable.map(team => (
          <Marker
            key={team.id}
            position={[team.lat, team.lng]}
            icon={makeIcon(teamPinColor(team))}
            eventHandlers={{ click: () => setProfileTeam(team) }}
          >
            <Popup>
              <div style={{ fontFamily:'var(--font-body)', minWidth:160 }}>
                <strong style={{ fontFamily:'var(--font-head)', fontSize:14 }}>{team.name}</strong>
                <div style={{ fontSize:12, color:'#666', marginTop:3 }}>📍 {[team.city, team.county].filter(Boolean).join(', ')}</div>
                {team.age_group && <div style={{ fontSize:12, marginTop:2 }}>🎯 {team.age_group} · {team.sport}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )

  return (
    <div>
      {profileTeam && (
        <TeamProfile
          team={profileTeam}
          onClose={() => setProfileTeam(null)}
          onClaim={(team) => {
            window.location.href = `mailto:admin.bsbldirectory@gmail.com?subject=Claim Request: ${encodeURIComponent(team.name)}`
          }}
        />
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background:'var(--white)', borderBottom:'2px solid var(--lgray)',
        padding:'12px 20px', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center',
        position:'sticky', top:0, zIndex:500,
      }}>

        {/* State — primary gate */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'var(--navy)', whiteSpace:'nowrap' }}>State</label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            style={{ ...filterStyle, fontWeight: state ? 600 : 400, minWidth: 140 }}
          >
            <option value="">All States</option>
            {US_STATES.map(s => (
              <option key={s.abbr} value={s.abbr}>{s.name}</option>
            ))}
          </select>
          {detectingLoc && <span style={{ fontSize:11, color:'#aaa' }}>Detecting…</span>}
        </div>

        <div style={{ width:1, height:28, background:'var(--lgray)', flexShrink:0 }} />

        <select value={sport} onChange={e => setSport(e.target.value)} style={filterStyle}>
          <option>Both</option><option>baseball</option><option>softball</option>
        </select>

        <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={filterStyle}>
          {AGE_OPTIONS.map(a => <option key={a}>{a}</option>)}
        </select>

        <select value={tryoutFilter} onChange={e => setTryoutFilter(e.target.value)} style={filterStyle}>
          <option value="All">All Tryout Status</option>
          <option value="open">Open Tryouts</option>
          <option value="year_round">Year Round</option>
          <option value="by_invite">By Invite</option>
          <option value="closed">Closed</option>
        </select>

        {/* Zip + radius */}
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--lgray)', borderRadius:8, padding:'5px 10px' }}>
          <input
            type="text" inputMode="numeric" placeholder="Zip" maxLength={5}
            value={zip} onChange={e => setZip(e.target.value)}
            style={{ border:'none', background:'none', outline:'none', width:60, fontSize:13, color:'var(--navy)' }}
          />
          {zip.length === 5 && (
            <>
              <span style={{ fontSize:12, color:'var(--gray)' }}>·</span>
              <input
                type="range" min={5} max={100} step={5} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                style={{ width:70, accentColor:'var(--red)' }}
              />
              <span style={{ fontSize:12, fontWeight:600, color:'var(--navy)', minWidth:34 }}>{radius} mi</span>
            </>
          )}
          {zipError && <span style={{ fontSize:11, color:'var(--red)' }}>{zipError}</span>}
        </div>

        <span style={{ fontSize:13, color:'var(--gray)', whiteSpace:'nowrap', marginLeft:'auto' }}>
          {filtered.length} team{filtered.length !== 1 ? 's' : ''}
          {selectedState ? ` in ${selectedState.name}` : ''}
        </span>

        {/* Map toggle */}
        <button onClick={() => setShowMap(m => !m)} style={{
          padding:'7px 14px', borderRadius:8,
          border:'2px solid var(--navy)',
          background: showMap ? 'var(--navy)' : 'white',
          color: showMap ? 'white' : 'var(--navy)',
          fontSize:13, fontWeight:700, cursor:'pointer',
          fontFamily:'var(--font-head)', whiteSpace:'nowrap',
        }}>
          {showMap ? '📋 List' : '🗺️ Map'}
        </button>
      </div>

      {/* ── No state selected prompt ─────────────────────────────────────────── */}
      {!state && !detectingLoc && (
        <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--gray)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📍</div>
          <div style={{ fontSize:16, fontWeight:600, color:'var(--navy)', marginBottom:8 }}>Select your state to find teams</div>
          <div style={{ fontSize:13 }}>Choose a state from the dropdown above to browse teams in your area.</div>
        </div>
      )}

      {/* ── Map (when toggled on) ─────────────────────────────────────────────── */}
      {showMap && state && (
        <div>
          <div style={{ borderBottom:'2px solid var(--lgray)' }}>{mapPanel}</div>
          {mapLegend}
        </div>
      )}

      {/* ── Open tryouts banner ───────────────────────────────────────────────── */}
      {state && filtered.some(t => t.tryout_status === 'open') && (
        <div style={{ background:'#DCFCE7', borderBottom:'2px solid #16A34A', padding:'10px 20px', fontSize:13, color:'#15803D', fontWeight:600 }}>
          ✅ {filtered.filter(t => t.tryout_status === 'open').length} team{filtered.filter(t => t.tryout_status === 'open').length !== 1 ? 's' : ''} currently accepting tryouts
          {selectedState ? ` in ${selectedState.name}` : ''}
        </div>
      )}

      {/* ── Team grid ─────────────────────────────────────────────────────────── */}
      {state && (
        <div style={{
          padding:'20px', display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
          gap:14, maxWidth:1200, margin:'0 auto',
        }}>
          {loading && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'48px 0', color:'var(--gray)', fontSize:14 }}>
              Loading teams…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'48px 0', color:'var(--gray)' }}>
              <div style={{ fontSize:20, marginBottom:8 }}>No teams found</div>
              <div style={{ fontSize:13 }}>
                {geoCenter
                  ? `No teams within ${radius} miles. Try increasing the radius or removing the zip filter.`
                  : `No teams match your filters${selectedState ? ` in ${selectedState.name}` : ''}.`
                }
              </div>
            </div>
          )}
          {!loading && filtered.map(team => {
            const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.closed
            return (
              <div key={team.id} onClick={() => setProfileTeam(team)} style={{
                background:'var(--white)', borderRadius:12,
                border:'2px solid var(--lgray)', padding:'16px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                cursor:'pointer', transition:'box-shadow 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor='var(--navy)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor='var(--lgray)' }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, letterSpacing:'0.02em' }}>{team.name}</div>
                    <div style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>
                      📍 {[team.city, team.county ? team.county+' Co.' : null, team.state].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <span style={{
                    background: statusInfo.bg, color: statusInfo.color,
                    fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:20,
                    whiteSpace:'nowrap', fontFamily:'var(--font-head)',
                    textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0, marginLeft:8,
                  }}>{statusInfo.label}</span>
                </div>

                <div style={{ display:'flex', gap:7, marginTop:10, flexWrap:'wrap' }}>
                  {team.age_group && (
                    <span style={{ background:'var(--navy)', color:'white', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)' }}>{team.age_group}</span>
                  )}
                  <span style={{ background: team.sport === 'softball' ? '#7C3AED' : '#1D4ED8', color:'white', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)', textTransform:'uppercase' }}>{team.sport}</span>
                  {team.org_affiliation && (
                    <span style={{ background:'var(--lgray)', color:'var(--gray)', fontSize:11, padding:'2px 8px', borderRadius:20 }}>{team.org_affiliation}</span>
                  )}
                </div>

                {team.tryout_status === 'open' && team.tryout_date && (
                  <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8, background:'#DCFCE7', color:'#15803D', fontSize:13, fontWeight:600 }}>
                    🗓️ Tryouts: {new Date(team.tryout_date).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
                    {team.tryout_notes && <div style={{ fontWeight:400, marginTop:2 }}>{team.tryout_notes}</div>}
                  </div>
                )}

                {team.description && (
                  <div style={{ fontSize:13, color:'var(--gray)', marginTop:8, lineHeight:1.5 }}>
                    {team.description.length > 120 ? team.description.slice(0,120)+'…' : team.description}
                  </div>
                )}

                {(team.contact_name || team.contact_phone || team.contact_email) && (
                  <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--lgray)', fontSize:13 }}>
                    {team.contact_name && <div style={{ fontWeight:600, color:'var(--navy)' }}>📞 {team.contact_name}</div>}
                    {team.contact_phone && (
                      <a href={`tel:${team.contact_phone.replace(/\D/g,'')}`} onClick={e => e.stopPropagation()}
                        style={{ display:'block', color:'var(--navy)', textDecoration:'none', fontWeight:600, marginTop:2 }}>
                        {team.contact_phone}
                      </a>
                    )}
                    {team.contact_email && (
                      <a href={`mailto:${team.contact_email}`} onClick={e => e.stopPropagation()}
                        style={{ display:'block', color:'#1D4ED8', textDecoration:'none', fontWeight:600, marginTop:2 }}>
                        {team.contact_email}
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={e => { e.stopPropagation(); setProfileTeam(team) }}
                  style={{
                    marginTop:12, width:'100%', background:'var(--navy)', color:'white',
                    border:'none', borderRadius:7, padding:'8px 0', fontSize:13, fontWeight:700,
                    cursor:'pointer', fontFamily:'var(--font-head)', letterSpacing:'0.04em',
                  }}
                >
                  View Details &amp; Claim
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
