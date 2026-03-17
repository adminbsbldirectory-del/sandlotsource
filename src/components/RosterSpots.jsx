import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) => L.divIcon({
  className: '',
  html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:' + color + ';border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  iconSize: [26,26], iconAnchor: [13,26], popupAnchor: [0,-28],
})

const PIN_COLOR = '#16a34a'

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude), city: place['place name'] }
  } catch { return null }
}

const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','High School','College','Adult']
const POSITIONS_BB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']
const POSITIONS_SB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']

const labelStyle  = { fontSize:12, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6, color:'#444' }
const inputStyle  = { width:'100%', padding:'9px 12px', borderRadius:8, border:'2px solid var(--lgray)', fontSize:14, fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box', background:'#fff' }
const selectStyle = { ...inputStyle }
const textareaStyle = { ...inputStyle, resize:'vertical' }

function RequiredMark() { return <span style={{ color:'var(--red)' }}> *</span> }

function FieldError({ msg }) {
  if (!msg) return null
  return <div style={{ background:'#FEE2E2', border:'1px solid #F87171', borderRadius:8, padding:'10px 14px', margin:'12px 0', color:'#B91C1C', fontSize:13 }}>{msg}</div>
}

function SportBadge({ sport }) {
  return (
    <span style={{ background: sport === 'softball' ? '#7C3AED' : '#1D4ED8', color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, textTransform:'uppercase', fontFamily:'var(--font-head)', letterSpacing:'0.06em' }}>
      {sport}
    </span>
  )
}

function ZipFieldInline({ value, onChange, onGeocode, required }) {
  const [status, setStatus] = useState('')
  async function handleBlur() {
    if (!value || value.length !== 5) return
    setStatus('loading')
    const geo = await geocodeZip(value)
    if (geo) { setStatus('ok');    onGeocode(geo) }
    else      { setStatus('error'); onGeocode(null) }
  }
  return (
    <div>
      <label style={labelStyle}>
        Zip Code{required && <span style={{ color:'var(--red)' }}> *</span>}
        {status === 'loading' && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#888' }}>Checking…</span>}
        {status === 'ok'      && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#16a34a' }}>✓ Located</span>}
        {status === 'error'   && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'var(--red)' }}>Zip not found</span>}
      </label>
      <input type="text" inputMode="numeric" maxLength={5} value={value}
        onChange={e => onChange(e.target.value)} onBlur={handleBlur}
        placeholder="e.g. 30114" style={inputStyle} />
      <div style={{ fontSize:11, color:'#888', marginTop:3 }}>Used to place a map pin</div>
    </div>
  )
}

// ── FitBounds ─────────────────────────────────────────────
function FitBounds({ spots }) {
  const map = useMap()
  useEffect(() => {
    const pts = spots.filter(s => s.lat && s.lng)
    if (pts.length === 0) return
    const bounds = L.latLngBounds(pts.map(s => [s.lat, s.lng]))
    map.fitBounds(bounds, { padding:[40,40], maxZoom:13 })
  }, [spots])
  return null
}

// ── Days remaining helper ─────────────────────────────────
function DaysRemaining({ expiresAt }) {
  if (!expiresAt) return null
  const days = Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
  const cls = days <= 2 ? 'urgent' : days <= 5 ? 'soon' : 'ok'
  const label = days === 0 ? 'Expires today' : days + ' day' + (days !== 1 ? 's' : '') + ' left'
  return (
    <div className={'days-remaining ' + cls} style={{ textAlign:'right', marginTop:8 }}>
      {label}
    </div>
  )
}

// ── Roster card ───────────────────────────────────────────
function RosterCard({ spot }) {
  const positions  = Array.isArray(spot.positions_needed) ? spot.positions_needed : []
  const cityState  = [spot.city, spot.state].filter(Boolean).join(', ')

  return (
    <div className="card">
      <div className="card-body">

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, color:'var(--navy)', marginBottom:4 }}>
              {spot.team_name || 'Team Name TBD'}
            </div>
            <div style={{ fontSize:13, color:'var(--gray)' }}>
              {cityState ? '📍 ' + cityState : ''}
              {spot.zip_code ? ' ' + spot.zip_code : ''}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
            <SportBadge sport={spot.sport} />
            {spot.age_group && (
              <span style={{ background:'var(--navy)', color:'white', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, fontFamily:'var(--font-head)' }}>
                {spot.age_group}
              </span>
            )}
          </div>
        </div>

        {spot.org_affiliation && (
          <div style={{ fontSize:12, color:'var(--gray)', marginBottom:8 }}>🏆 {spot.org_affiliation}</div>
        )}

        {positions.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--navy)', marginRight:2 }}>Needs:</span>
            {positions.map(p => (
              <span key={p} style={{ background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, textTransform:'capitalize' }}>{p}</span>
            ))}
          </div>
        )}

        <div style={{ marginBottom:10 }}>
          <span style={{ background:'#DCFCE7', color:'#15803D', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>📅 Full Season</span>
        </div>

        {spot.description && (
          <div style={{ fontSize:13, color:'#555', lineHeight:1.5, marginBottom:10 }}>{spot.description}</div>
        )}

        <div style={{ paddingTop:12, borderTop:'1px solid var(--lgray)', fontSize:13 }}>
          {spot.contact_name && (
            <div style={{ fontWeight:600, color:'var(--navy)', marginBottom:3 }}>👤 {spot.contact_name}</div>
          )}
          <div style={{ color:'#1D4ED8', fontWeight:600 }}>📬 {spot.contact_info}</div>
        </div>

        <DaysRemaining expiresAt={spot.expires_at} />
      </div>
    </div>
  )
}

// ── Roster form ───────────────────────────────────────────
function RosterForm({ onSubmitted }) {
  const [form, setForm] = useState({
    sport: 'baseball', team_name: '', org_affiliation: '',
    age_group: '', positions_needed: [],
    city: '', zip_code: '', lat: null, lng: null,
    description: '', contact_info: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function togglePos(pos) {
    setForm(f => ({
      ...f,
      positions_needed: f.positions_needed.includes(pos)
        ? f.positions_needed.filter(p => p !== pos)
        : [...f.positions_needed, pos],
    }))
  }

  function handleGeocode(geo) {
    if (geo) setForm(f => ({ ...f, lat: geo.lat, lng: geo.lng, city: f.city || geo.city }))
    else setForm(f => ({ ...f, lat: null, lng: null }))
  }

  function validate() {
    if (!form.sport)               return 'Sport is required.'
    if (!form.age_group)           return 'Age group is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.contact_info.trim()) return 'Contact info is required.'
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const payload = {
      sport:            form.sport,
      team_name:        form.team_name.trim() || null,
      org_affiliation:  form.org_affiliation.trim() || null,
      age_group:        form.age_group,
      positions_needed: form.positions_needed,
      city:             form.city.trim(),
      zip_code:         form.zip_code || null,
      lat:              form.lat || null,
      lng:              form.lng || null,
      commitment:       'full_season',
      description:      form.description.trim() || null,
      contact_info:     form.contact_info.trim(),
      active:           true,
      approval_status:  'pending',
      source:           'website_form',
      last_confirmed_at: new Date().toISOString(),
    }

    const { error: sbError } = await supabase.from('roster_spots').insert(payload)
    setSubmitting(false)
    if (sbError) {
      setError('Submission error: ' + (sbError.message || 'Please try again.'))
    } else {
      onSubmitted()
    }
  }

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB

  return (
    <div style={{ background:'white', borderRadius:12, border:'2px solid var(--lgray)', padding:'28px 24px', maxWidth:680, margin:'0 auto' }}>
      <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:800, color:'var(--navy)', marginBottom:20 }}>
        Post a Roster Spot
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display:'flex', gap:8 }}>
          {['baseball','softball'].map(s => (
            <button key={s} onClick={() => { set('sport', s); set('positions_needed', []) }} style={{
              padding:'8px 18px', borderRadius:8, border:'2px solid', cursor:'pointer',
              borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'var(--lgray)',
              background:  form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'white',
              color:       form.sport === s ? 'white' : 'var(--navy)',
              fontWeight:600, fontSize:13, textTransform:'capitalize', fontFamily:'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div>
          <label style={labelStyle}>Team Name</label>
          <input value={form.team_name} onChange={e => set('team_name', e.target.value)} placeholder="e.g. Cherokee Nationals" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Org Affiliation</label>
          <input value={form.org_affiliation} onChange={e => set('org_affiliation', e.target.value)} placeholder="e.g. USSSA, PGF, Perfect Game" style={inputStyle} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div>
          <label style={labelStyle}>Age Group <RequiredMark /></label>
          <select value={form.age_group} onChange={e => set('age_group', e.target.value)} style={selectStyle}>
            <option value="">Select</option>
            {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Canton" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <ZipFieldInline value={form.zip_code} onChange={v => set('zip_code', v)} onGeocode={handleGeocode} required />
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Position(s) Needed</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {positions.map(pos => (
            <button key={pos} onClick={() => togglePos(pos)} style={{
              padding:'5px 12px', borderRadius:20, border:'2px solid', cursor:'pointer',
              borderColor: form.positions_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
              background:  form.positions_needed.includes(pos) ? 'var(--navy)' : 'white',
              color:       form.positions_needed.includes(pos) ? 'white' : 'var(--navy)',
              fontSize:12, fontFamily:'var(--font-body)',
            }}>{pos}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} placeholder="Skill level expected, practice schedule, tournament schedule..."
          style={textareaStyle} />
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Contact Info <RequiredMark /></label>
        <input value={form.contact_info} onChange={e => set('contact_info', e.target.value)}
          placeholder="Email, phone, or Instagram" style={inputStyle} />
        <div style={{ fontSize:11, color:'#888', marginTop:3 }}>Visible publicly. Expires after 15 days.</div>
      </div>

      <div style={{ fontSize:11, color:'var(--gray)', marginBottom:12 }}>
        Roster spots are reviewed before going live and expire after <strong>15 days</strong>. Fields marked <span style={{ color:'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background:'var(--red)', color:'white', border:'none',
        borderRadius:8, padding:'12px 32px',
        fontFamily:'var(--font-head)', fontSize:16, fontWeight:700,
        letterSpacing:'0.04em', textTransform:'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Posting…' : 'Post Roster Spot'}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function RosterSpots() {
  const [spots,    setSpots]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState('browse')
  const [sport,    setSport]    = useState('Both')
  const [ageGroup, setAgeGroup] = useState('All Ages')
  const [showMap,  setShowMap]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('roster_spots')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['pending','approved'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (!error && data) setSpots(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = spots.filter(s => {
    if (sport !== 'Both' && s.sport !== sport) return false
    if (ageGroup !== 'All Ages' && s.age_group !== ageGroup) return false
    return true
  })

  const mappable = filtered.filter(s => s.lat && s.lng)

  const filterSelectStyle = {
    padding:'8px 12px', borderRadius:'var(--input-radius)',
    border:'1.5px solid var(--lgray)', background:'var(--white)',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  if (view === 'submitted') {
    return (
      <div style={{ maxWidth:680, margin:'60px auto', padding:'0 20px', textAlign:'center' }}>
        <div style={{ background:'#DCFCE7', border:'2px solid #16A34A', borderRadius:12, padding:'32px 24px' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
          <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, color:'#15803D', marginBottom:8 }}>Roster Spot Posted!</div>
          <div style={{ fontSize:14, color:'#166534', marginBottom:20 }}>Your listing will appear here once reviewed. It will stay active for 15 days.</div>
          <button onClick={() => setView('browse')} style={{ background:'var(--navy)', color:'white', border:'none', borderRadius:8, padding:'10px 24px', fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, cursor:'pointer' }}>
            Back to Roster Spots
          </button>
        </div>
      </div>
    )
  }

  if (view === 'post') {
    return (
      <div style={{ padding:'32px 20px' }}>
        <button onClick={() => setView('browse')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--navy)', fontWeight:700, fontSize:13, fontFamily:'var(--font-head)', marginBottom:20, display:'block' }}>
          ← Back to Roster Spots
        </button>
        <RosterForm onSubmitted={() => setView('submitted')} />
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="filter-bar">

        {/* Sport pill toggles */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button
            className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')}
            onClick={() => setSport(s => s === 'baseball' ? 'Both' : 'baseball')}
          >
            ⚾ Baseball
          </button>
          <button
            className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')}
            onClick={() => setSport(s => s === 'softball' ? 'Both' : 'softball')}
          >
            🥎 Softball
          </button>
        </div>

        <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={filterSelectStyle}>
          {['All Ages', ...AGE_GROUPS].map(a => <option key={a}>{a}</option>)}
        </select>

        <span style={{ fontSize:13, color:'var(--gray)', flex:1 }}>
          {loading ? 'Loading…' : filtered.length + ' roster spot' + (filtered.length !== 1 ? 's' : '') + ' open'}
        </span>

        <button onClick={() => setShowMap(m => !m)} style={{
          padding:'8px 14px', borderRadius:'var(--btn-radius)',
          border:'2px solid var(--navy)',
          background: showMap ? 'var(--navy)' : 'white',
          color:      showMap ? 'white' : 'var(--navy)',
          fontSize:13, fontWeight:700, cursor:'pointer',
          fontFamily:'var(--font-head)', whiteSpace:'nowrap',
        }}>
          {showMap ? '📋 List' : '🗺️ Map'}
        </button>

        <button onClick={() => setView('post')} style={{
          padding:'9px 18px', borderRadius:'var(--btn-radius)',
          background:'var(--red)', color:'white', border:'none',
          cursor:'pointer', fontFamily:'var(--font-head)',
          fontSize:13, fontWeight:700, letterSpacing:'0.04em',
        }}>
          + Post a Roster Spot
        </button>
      </div>

      {/* Map */}
      {showMap && (
        <div>
          <div style={{ height:320, width:'100%', borderBottom:'2px solid var(--lgray)' }}>
            <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height:'100%', width:'100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds spots={mappable} />
              {mappable.map(spot => (
                <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={makeIcon(PIN_COLOR)}>
                  <Popup>
                    <div style={{ fontFamily:'var(--font-body)', minWidth:160 }}>
                      <strong style={{ fontFamily:'var(--font-head)', fontSize:14 }}>{spot.team_name || 'Open Roster'}</strong>
                      <div style={{ fontSize:12, color:'#666', marginTop:3 }}>
                        {'📍 ' + [spot.city, spot.state].filter(Boolean).join(', ') + (spot.zip_code ? ' ' + spot.zip_code : '')}
                      </div>
                      {spot.age_group && (
                        <div style={{ fontSize:12, marginTop:2 }}>{'🎯 ' + spot.age_group + ' · ' + spot.sport}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div style={{ display:'flex', gap:12, padding:'7px 16px', background:'#fff', borderBottom:'2px solid var(--lgray)', alignItems:'center' }}>
            <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--gray)' }}>Map key</span>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:12, height:12, borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)', background:PIN_COLOR, border:'2px solid rgba(255,255,255,0.8)', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
              <span style={{ fontSize:11, color:'var(--gray)' }}>Open Roster</span>
            </div>
            {mappable.length === 0 && <span style={{ fontSize:11, color:'#aaa', fontStyle:'italic' }}>Map pins appear as listings add zip codes</span>}
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ background:'var(--cream)', borderBottom:'2px solid var(--lgray)', padding:'20px 24px' }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color:'var(--navy)', marginBottom:4 }}>Roster Spots Open</div>
        <div style={{ fontSize:13, color:'var(--gray)' }}>Travel teams looking for full-season players. Posts expire after 15 days.</div>
      </div>

      {/* Cards grid */}
      <div style={{ padding:'24px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16, maxWidth:1200, margin:'0 auto', alignItems:'stretch' }}>
        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn:'1/-1' }}>
            <h3>No roster spots open right now</h3>
            <p>Be the first to post one for your team.</p>
            <button onClick={() => setView('post')}>Post a Roster Spot</button>
          </div>
        )}
        {filtered.map(spot => <RosterCard key={spot.id} spot={spot} />)}
      </div>
    </div>
  )
}
