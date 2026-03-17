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

const makeIcon = (selected) => L.divIcon({
  className: '',
  html: '<div style="width:' + (selected ? 34 : 26) + 'px;height:' + (selected ? 34 : 26) + 'px;border-radius:50% 50% 50% 0;background:#1a1a1a;border:' + (selected ? '4px solid #f0a500' : '3px solid white') + ';transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
  iconSize:    [selected ? 34 : 26, selected ? 34 : 26],
  iconAnchor:  [selected ? 17 : 13, selected ? 34 : 26],
  popupAnchor: [0, -30],
})

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
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

// ── FitBounds: auto-zoom to visible pins ──────────────────
function FitBounds({ facilities }) {
  const map = useMap()
  useEffect(() => {
    const pts = facilities.filter(f => f.lat && f.lng)
    if (pts.length === 0) return
    const bounds = L.latLngBounds(pts.map(f => [f.lat, f.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [facilities])
  return null
}

// ── Facility card ─────────────────────────────────────────
function FacilityCard({ facility, selected, onClick, distanceMi }) {
  const amenities   = Array.isArray(facility.amenities) ? facility.amenities : []
  const cityState   = [facility.city, facility.state].filter(Boolean).join(', ')
  const locationFull = facility.zip_code ? cityState + ' ' + facility.zip_code : cityState
  const sportLabel  = facility.sport === 'both' ? 'Baseball & Softball' : (facility.sport || '')
  const sportBg     = facility.sport === 'softball' ? '#7C3AED' : facility.sport === 'both' ? 'var(--navy)' : '#1D4ED8'

  const cardStyle = selected ? {
    background:    '#1a1a1a',
    color:         '#fff',
    border:        '2px solid #f0a500',
    borderRadius:  'var(--card-radius)',
    cursor:        'pointer',
    transition:    'all 0.15s',
    marginBottom:  10,
    display:       'flex',
    flexDirection: 'column',
  } : { marginBottom: 10, cursor: 'pointer' }

  const footerStyle = selected ? {
    padding:        '12px 16px',
    borderTop:      '1px solid rgba(255,255,255,0.15)',
    background:     'rgba(255,255,255,0.05)',
    borderRadius:   '0 0 var(--card-radius) var(--card-radius)',
    marginTop:      'auto',
  } : undefined

  return (
    <div className={selected ? '' : 'card'} style={cardStyle} onClick={onClick}>

      {/* Card body */}
      <div className={selected ? '' : 'card-body'} style={selected ? { flex:1, padding:'14px 16px' } : undefined}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, letterSpacing:'0.02em' }}>
              {facility.name}
            </div>
            <div style={{ fontSize:13, marginTop:4, opacity:0.8 }}>
              {'📍 ' + (locationFull || 'Location not listed')}
              {distanceMi != null && (
                <span style={{ marginLeft:8, color: selected ? '#f0a500' : 'var(--red)', fontWeight:600 }}>
                  {Math.round(distanceMi)} mi
                </span>
              )}
            </div>
            {facility.address && (
              <div style={{ fontSize:12, marginTop:2, opacity:0.6 }}>{facility.address}</div>
            )}
          </div>
          <span style={{
            background: sportBg, color:'white',
            fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20,
            textTransform:'uppercase', letterSpacing:'0.06em',
            fontFamily:'var(--font-head)', flexShrink:0, marginLeft:8,
          }}>
            {sportLabel}
          </span>
        </div>

        {amenities.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
            {amenities.map(a => (
              <span key={a} style={{
                background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)',
                color:      selected ? 'white' : 'var(--gray)',
                fontSize:11, padding:'2px 8px', borderRadius:20, textTransform:'capitalize',
              }}>{a}</span>
            ))}
          </div>
        )}

        {facility.description && (
          <div style={{ fontSize:12, marginTop:8, opacity:0.75, lineHeight:1.4 }}>
            {facility.description.length > 100 ? facility.description.slice(0,100) + '…' : facility.description}
          </div>
        )}

        {/* Contact links */}
        {(facility.phone || facility.website || facility.instagram) && (
          <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap', fontSize:12 }}>
            {facility.phone && (
              <a href={'tel:' + facility.phone.replace(/\D/g,'')}
                className="contact-link"
                onClick={e => e.stopPropagation()}
                style={{ color: selected ? '#f0a500' : '#1D4ED8' }}>
                📞 {facility.phone}
              </a>
            )}
            {facility.website && (
              <a href={facility.website.startsWith('http') ? facility.website : 'https://' + facility.website}
                target="_blank" rel="noopener noreferrer"
                className="contact-link"
                onClick={e => e.stopPropagation()}
                style={{ color: selected ? '#f0a500' : '#1D4ED8' }}>
                🌐 Website
              </a>
            )}
            {facility.instagram && (
              <a href={facility.instagram.startsWith('http') ? facility.instagram : 'https://instagram.com/' + facility.instagram.replace('@','')}
                target="_blank" rel="noopener noreferrer"
                className="contact-link"
                onClick={e => e.stopPropagation()}
                style={{ color: selected ? '#f0a500' : '#1D4ED8' }}>
                📸 {facility.instagram}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className={selected ? '' : 'card-footer'} style={footerStyle}>
        {facility.hours && (
          <div style={{ fontSize:12, opacity: selected ? 0.75 : 1, color: selected ? 'white' : 'var(--gray)' }}>
            🕐 {facility.hours}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Map legend ────────────────────────────────────────────
function MapLegend({ mappable }) {
  return (
    <div style={{ display:'flex', gap:12, padding:'7px 16px', background:'var(--white)', borderBottom:'2px solid var(--lgray)', alignItems:'center' }}>
      <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--gray)' }}>Map key</span>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <div style={{ width:12, height:12, borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)', background:'#1a1a1a', border:'2px solid rgba(255,255,255,0.8)', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
        <span style={{ fontSize:11, color:'var(--gray)' }}>Facility</span>
      </div>
      {mappable.length === 0 && (
        <span style={{ fontSize:11, color:'#aaa', fontStyle:'italic' }}>Map pins appear as facilities add location data</span>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function Facilities() {
  const [facilities, setFacilities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [sport,      setSport]      = useState('Both')
  const [search,     setSearch]     = useState('')
  const [zip,        setZip]        = useState('')
  const [radius,     setRadius]     = useState(25)
  const [geoCenter,  setGeoCenter]  = useState(null)
  const [zipStatus,  setZipStatus]  = useState('')
  const [showMap,    setShowMap]    = useState(false)
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['approved','seeded'])
        .order('name')
      if (!error && data) setFacilities(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleZipBlur() {
    if (!zip || zip.length !== 5) return
    setZipStatus('loading')
    const geo = await geocodeZip(zip)
    if (geo) { setGeoCenter(geo); setZipStatus('ok') }
    else     { setGeoCenter(null); setZipStatus('error') }
  }

  const filtered = facilities.filter(f => {
    if (sport === 'baseball' && f.sport !== 'baseball' && f.sport !== 'both') return false
    if (sport === 'softball' && f.sport !== 'softball' && f.sport !== 'both') return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(f.name||'').toLowerCase().includes(q) &&
        !(f.city||'').toLowerCase().includes(q) &&
        !(f.address||'').toLowerCase().includes(q) &&
        !(f.description||'').toLowerCase().includes(q)
      ) return false
    }
    if (geoCenter && f.lat && f.lng) {
      if (distanceMiles(geoCenter.lat, geoCenter.lng, f.lat, f.lng) > radius) return false
    }
    return true
  }).sort((a, b) => {
    if (a.id === selected) return -1
    if (b.id === selected) return 1
    if (geoCenter && a.lat && b.lat) {
      return distanceMiles(geoCenter.lat, geoCenter.lng, a.lat, a.lng) -
             distanceMiles(geoCenter.lat, geoCenter.lng, b.lat, b.lng)
    }
    return 0
  })

  const mappable = filtered.filter(f => f.lat && f.lng)
  const sel = selected ? facilities.find(f => f.id === selected) : null

  function getDistance(f) {
    if (!geoCenter || !f.lat || !f.lng) return null
    return distanceMiles(geoCenter.lat, geoCenter.lng, f.lat, f.lng)
  }

  const filterSelectStyle = {
    padding:'8px 12px', borderRadius:'var(--input-radius)',
    border:'1.5px solid var(--lgray)', background:'var(--white)',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  function EmptyState() {
    const hasFilters = sport !== 'Both' || search || (zip && geoCenter)
    return (
      <div className="empty-state">
        <h3>{hasFilters ? 'No facilities match your filters' : 'No facilities listed yet'}</h3>
        <p>
          {hasFilters
            ? 'Try widening your search — clear a filter or increase the radius.'
            : 'Know a great training facility? Help us grow the directory.'}
        </p>
        {!hasFilters && <a href="/submit">Add a Facility</a>}
      </div>
    )
  }

  // Shared map JSX — used in both mobile and desktop
  function MapPanel({ height }) {
    return (
      <div style={{ height: height, width:'100%' }}>
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          style={{ height:'100%', width:'100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds facilities={mappable} />
          {mappable.map(f => (
            <Marker
              key={f.id}
              position={[f.lat, f.lng]}
              icon={makeIcon(f.id === selected)}
              zIndexOffset={f.id === selected ? 1000 : 0}
              eventHandlers={{ click: () => setSelected(f.id) }}
            >
              <Popup>
                <div style={{ fontFamily:'var(--font-body)', minWidth:180 }}>
                  <strong style={{ fontFamily:'var(--font-head)', fontSize:15 }}>{f.name}</strong>
                  <div style={{ fontSize:12, color:'#666', marginTop:3 }}>
                    {'📍 ' + [f.city, f.state].filter(Boolean).join(', ') + (f.zip_code ? ' ' + f.zip_code : '')}
                  </div>
                  {f.address && <div style={{ fontSize:12, color:'#888', marginTop:1 }}>{f.address}</div>}
                  {f.sport && <div style={{ fontSize:12, marginTop:2, textTransform:'capitalize' }}>⚾ {f.sport}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column' }}>

      {/* ── Filter bar ── */}
      <div className="filter-bar" style={{ zIndex:500 }}>

        <input
          placeholder="🔍  Search facilities, cities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...filterSelectStyle, flex:1, minWidth:160 }}
        />

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

        {/* Zip + radius */}
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--lgray)', borderRadius:'var(--input-radius)', padding:'5px 10px' }}>
          <span style={{ fontSize:12, color:'var(--gray)' }}>📍</span>
          <input
            type="text" inputMode="numeric" placeholder="Zip" maxLength={5}
            value={zip}
            onChange={e => setZip(e.target.value)}
            onBlur={handleZipBlur}
            style={{ border:'none', background:'none', outline:'none', width:60, fontSize:13, color:'var(--navy)' }}
          />
          {zipStatus === 'ok'      && <span style={{ fontSize:11, color:'#16a34a' }}>✓</span>}
          {zipStatus === 'error'   && <span style={{ fontSize:11, color:'var(--red)' }}>?</span>}
          {zipStatus === 'loading' && <span style={{ fontSize:11, color:'#888' }}>…</span>}
          {zip.length === 5 && zipStatus === 'ok' && (
            <>
              <input
                type="range" min={5} max={100} step={5} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                style={{ width:70, accentColor:'var(--red)' }}
              />
              <span style={{ fontSize:12, fontWeight:600, color:'var(--navy)', minWidth:34 }}>{radius} mi</span>
            </>
          )}
        </div>

        <span className="result-count">
          {filtered.length} facilit{filtered.length !== 1 ? 'ies' : 'y'}
        </span>

        {isMobile && (
          <button onClick={() => setShowMap(m => !m)} style={{
            padding:'8px 14px', borderRadius:'var(--btn-radius)',
            border:'2px solid var(--navy)',
            background: showMap ? 'var(--navy)' : 'var(--white)',
            color:      showMap ? 'var(--white)' : 'var(--navy)',
            fontSize:13, fontWeight:700, cursor:'pointer',
            fontFamily:'var(--font-head)', whiteSpace:'nowrap',
          }}>
            {showMap ? '📋 List' : '🗺️ Map'}
          </button>
        )}
      </div>

      {/* ── Mobile layout ── */}
      {isMobile ? (
        <div style={{ flex:1, overflowY:'auto', background:'var(--cream)' }}>
          {showMap && (
            <>
              <div style={{ borderBottom:'2px solid var(--lgray)' }}>
                <MapPanel height={240} />
              </div>
              <MapLegend mappable={mappable} />
            </>
          )}
          <div style={{ padding:12 }}>
            {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>Loading facilities…</div>}
            {!loading && filtered.length === 0 && <EmptyState />}
            {filtered.map(f => (
              <FacilityCard key={f.id} facility={f} selected={selected === f.id}
                onClick={() => setSelected(selected === f.id ? null : f.id)}
                distanceMi={getDistance(f)} />
            ))}
          </div>
        </div>

      ) : (
        /* ── Desktop: map on top, cards + ads below ── */
        <div style={{ display:'flex', flexDirection:'column' }}>

          <div style={{ width:'100%', borderBottom:'2px solid var(--lgray)' }}>
            <MapPanel height={340} />
          </div>
          <MapLegend mappable={mappable} />

          {/* Cards + ad rail — constrained width */}
          <div style={{ display:'flex', overflow:'hidden' }}>

            <div style={{
              flex:1, overflowY:'auto',
              maxHeight:'calc(100vh - 340px - 108px)',
              padding:16, background:'var(--cream)',
            }}>
              {/* Max-width container prevents cards stretching on wide monitors */}
              <div style={{ maxWidth:800, margin:'0 auto' }}>
                {loading && <div style={{ textAlign:'center', padding:'40px 0', color:'var(--gray)', fontSize:14 }}>Loading facilities…</div>}
                {!loading && filtered.length === 0 && <EmptyState />}
                {filtered.map(f => (
                  <FacilityCard key={f.id} facility={f} selected={selected === f.id}
                    onClick={() => setSelected(selected === f.id ? null : f.id)}
                    distanceMi={getDistance(f)} />
                ))}
              </div>
            </div>

            {/* Ad column */}
            <div style={{
              width:220, flexShrink:0,
              borderLeft:'2px solid var(--lgray)',
              background:'var(--white)',
              display:'flex', flexDirection:'column',
              gap:16, padding:16, overflowY:'auto',
              maxHeight:'calc(100vh - 340px - 108px)',
            }}>
              {[1,2].map(i => (
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
        </div>
      )}
    </div>
  )
}
