import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const HEADER_H = 75

const FACILITY_TYPE_OPTIONS = [
  { value: 'all', label: 'All Location Types' },
  { value: 'park_field', label: 'Park / Rec Field' },
  { value: 'training_facility', label: 'Indoor Training Facility' },
  { value: 'private_facility', label: 'Private Facility' },
  { value: 'travel_team_facility', label: 'Team Facility' },
  { value: 'school_field', label: 'School Field' },
  { value: 'other', label: 'Other' },
]

function getFacilitySport(facility) {
  return facility?.sport_served || facility?.sport || ''
}

function getFacilityTypeLabel(value) {
  const map = {
    park_field: 'Park / Rec Field',
    training_facility: 'Indoor Training Facility',
    private_facility: 'Private Facility',
    travel_team_facility: 'Team Facility',
    school_field: 'School Field',
    other: 'Other',
  }
  return map[value] || value || ''
}

function getFacilityTypeColor(value) {
  if (value === 'park_field') return '#16A34A'
  if (value === 'training_facility') return '#D42B2B'
  if (value === 'private_facility') return '#8B5CF6'
  if (value === 'travel_team_facility') return '#1D4ED8'
  if (value === 'school_field') return '#6B7280'
  return '#1a1a1a'
}

function getFacilityRingBackground(facility) {
  const sport = getFacilitySport(facility)
  if (sport === 'softball') return '#FACC15'
  if (sport === 'both') return 'conic-gradient(#ffffff 0deg 180deg, #FACC15 180deg 360deg)'
  return '#ffffff'
}

const makeIcon = (facility, selected) =>
  L.divIcon({
    className: '',
    html: `<div style="width:${selected ? 38 : 30}px;height:${selected ? 38 : 30}px;display:flex;align-items:center;justify-content:center;border-radius:50% 50% 50% 0;background:${selected ? '#f0a500' : getFacilityRingBackground(facility)};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"><div style="width:${selected ? 30 : 24}px;height:${selected ? 30 : 24}px;border-radius:50% 50% 50% 0;background:${getFacilityTypeColor(facility.facility_type)};"></div></div>`,
    iconSize: [selected ? 38 : 30, selected ? 38 : 30],
    iconAnchor: [selected ? 19 : 15, selected ? 38 : 30],
    popupAnchor: [0, -30],
  })

function getFacilityZip(facility) {
  return facility.zip_code || facility.zip || ''
}

function normalizeUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function normalizeInstagramHandle(value) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://instagram.com/' + trimmed.replace(/^@/, '')
}

function getSportLabel(sport) {
  if (sport === 'both') return 'Baseball & Softball'
  if (sport === 'softball') return 'Softball'
  if (sport === 'baseball') return 'Baseball'
  return sport || ''
}

function getSportBadgeColor(sport) {
  if (sport === 'softball') return '#7C3AED'
  if (sport === 'both') return '#DCEAFE'
  return '#1D4ED8'
}

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) }
  } catch {
    return null
  }
}

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function FitBounds({ facilities, selectedId }) {
  const map = useMap()

  useEffect(() => {
    if (selectedId) return

    const pts = facilities.filter((f) => f.lat != null && f.lng != null)
    if (pts.length === 0) return

    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 12)
      return
    }

    const bounds = L.latLngBounds(pts.map((f) => [f.lat, f.lng]))
    const t = setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
    }, 50)

    return () => clearTimeout(t)
  }, [facilities, selectedId, map])

  return null
}

function FlyTo({ lat, lng }) {
  const map = useMap()

  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 13, { duration: 0.6 })
    }
  }, [lat, lng, map])

  return null
}

function FacilityCard({ facility, selected, onClick, distanceMi }) {
  const amenities = Array.isArray(facility.amenities) ? facility.amenities : []
  const facilityTypeLabel = getFacilityTypeLabel(facility.facility_type)
  const zip = getFacilityZip(facility)
  const cityState = [facility.city, facility.state].filter(Boolean).join(', ')
  const locationFull = zip ? cityState + ' ' + zip : cityState
  const sportLabel = getSportLabel(getFacilitySport(facility))
  const sportBg = getSportBadgeColor(getFacilitySport(facility))
  const websiteUrl = normalizeUrl(facility.website)
  const instagramUrl = normalizeInstagramHandle(facility.instagram)

  const cardStyle = selected
    ? {
        background: '#1a1a1a',
        color: '#fff',
        border: '2px solid #f0a500',
        borderRadius: 'var(--card-radius)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
      }
    : { marginBottom: 10, cursor: 'pointer' }

  const footerStyle = selected
    ? {
        padding: '10px 14px',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0 0 var(--card-radius) var(--card-radius)',
        marginTop: 'auto',
      }
    : undefined

  return (
    <div className={selected ? '' : 'card'} style={cardStyle} onClick={onClick}>
      <div className={selected ? '' : 'card-body'} style={selected ? { flex: 1, padding: '14px 16px' } : undefined}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, letterSpacing: '0.02em' }}>
              {facility.name}
            </div>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
              📍 {locationFull || 'Location not listed'}
              {distanceMi != null && (
                <span style={{ marginLeft: 8, color: selected ? '#f0a500' : 'var(--red)', fontWeight: 600 }}>
                  {Math.round(distanceMi)} mi
                </span>
              )}
            </div>
            {facility.address && <div style={{ fontSize: 12, marginTop: 2, opacity: 0.6 }}>{facility.address}</div>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 8 }}>
            {facilityTypeLabel && (
              <span
                style={{
                  background: '#F3F4F6',
                  color: getFacilityTypeColor(facility.facility_type),
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-head)',
                  flexShrink: 0,
                }}
              >
                {facilityTypeLabel}
              </span>
            )}
            {sportLabel && (
              <span
                style={{
                  background: sportBg,
                  color: getFacilitySport(facility) === 'both' ? '#1E3A8A' : 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-head)',
                  flexShrink: 0,
                }}
              >
                {sportLabel}
              </span>
            )}
          </div>
        </div>

        {amenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {amenities.slice(0, 5).map((a) => (
              <span
                key={a}
                style={{
                  background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)',
                  color: selected ? 'white' : 'var(--gray)',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                  textTransform: 'capitalize',
                }}
              >
                {a}
              </span>
            ))}
            {amenities.length > 5 && (
              <span
                style={{
                  background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)',
                  color: selected ? 'white' : 'var(--gray)',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                +{amenities.length - 5} more
              </span>
            )}
          </div>
        )}

        {facility.description && (
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75, lineHeight: 1.4 }}>
            {facility.description.length > 100 ? facility.description.slice(0, 100) + '…' : facility.description}
          </div>
        )}

        {(facility.phone || websiteUrl || instagramUrl) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            {facility.phone && (
              <a
                href={'tel:' + facility.phone.replace(/\D/g, '')}
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 13 }}
              >
                📞 {facility.phone}
              </a>
            )}
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 13 }}
              >
                🌐 Website
              </a>
            )}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 13 }}
              >
                📸 {facility.instagram}
              </a>
            )}
          </div>
        )}
      </div>

      <div className={selected ? '' : 'card-footer'} style={footerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {facility.hours ? (
            <div style={{ fontSize: 12, opacity: selected ? 0.75 : 1, color: selected ? 'white' : 'var(--gray)' }}>
              🕐 {facility.hours}
            </div>
          ) : <span />}
          <Link
            to={`/facilities/${facility.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              color: selected ? '#f0a500' : '#1D4ED8',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            View Facility →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Facilities() {
  const [searchParams] = useSearchParams()

  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => searchParams.get('select') || null)
  const [sport, setSport] = useState('Both')
  const [facilityType, setFacilityType] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [zip, setZip] = useState('')
  const [radius, setRadius] = useState(25)
  const [geoCenter, setGeoCenter] = useState(null)
  const [zipStatus, setZipStatus] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const selectedFromUrl = searchParams.get('select') || null
    setSelected(selectedFromUrl)
  }, [searchParams])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['approved', 'seeded'])
        .order('name')

      if (!error && data) {
        const normalized = data.map((f) => ({ ...f, id: String(f.id) }))
        setFacilities(normalized)

        const selectedFromUrl = searchParams.get('select')
        if (selectedFromUrl && normalized.some((f) => f.id === selectedFromUrl)) {
          setSelected(selectedFromUrl)
        }
      }

      setLoading(false)
    }

    load()
  }, [searchParams])

  async function handleZipBlur() {
    if (!zip || zip.length !== 5) return
    setZipStatus('loading')
    const geo = await geocodeZip(zip)
    if (geo) {
      setGeoCenter(geo)
      setZipStatus('ok')
    } else {
      setGeoCenter(null)
      setZipStatus('error')
    }
  }

  function clearZipFilter() {
    setZip('')
    setGeoCenter(null)
    setZipStatus('')
    setRadius(25)
  }

  const filtered = useMemo(() => {
    return facilities
      .filter((f) => {
        const facilitySport = getFacilitySport(f)
        if (sport === 'baseball' && facilitySport !== 'baseball' && facilitySport !== 'both') return false
        if (sport === 'softball' && facilitySport !== 'softball' && facilitySport !== 'both') return false
        if (facilityType !== 'all' && (f.facility_type || '') !== facilityType) return false

        if (search) {
          const q = search.toLowerCase()
          if (
            !(f.name || '').toLowerCase().includes(q) &&
            !(f.city || '').toLowerCase().includes(q) &&
            !(f.address || '').toLowerCase().includes(q) &&
            !(f.description || '').toLowerCase().includes(q)
          ) {
            return false
          }
        }

        if (geoCenter && f.lat != null && f.lng != null) {
          if (distanceMiles(geoCenter.lat, geoCenter.lng, f.lat, f.lng) > radius) return false
        }

        return true
      })
      .sort((a, b) => {
        if (geoCenter && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
          return (
            distanceMiles(geoCenter.lat, geoCenter.lng, a.lat, a.lng) -
            distanceMiles(geoCenter.lat, geoCenter.lng, b.lat, b.lng)
          )
        }
        return 0
      })
  }, [facilities, sport, facilityType, search, geoCenter, radius])

  const mappable = filtered.filter((f) => f.lat != null && f.lng != null)

  function getDistance(f) {
    if (!geoCenter || f.lat == null || f.lng == null) return null
    return distanceMiles(geoCenter.lat, geoCenter.lng, f.lat, f.lng)
  }

  const selFacility = selected
    ? filtered.find((f) => f.id === selected) || facilities.find((f) => f.id === selected) || null
    : null

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 'var(--input-radius)',
    border: '1.5px solid var(--lgray)',
    background: 'var(--white)',
    fontSize: 13,
    color: 'var(--navy)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--gray)',
    marginBottom: 6,
    display: 'block',
  }

  function EmptyState() {
    const hasFilters = sport !== 'Both' || search || zipStatus === 'ok'
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

  return (
    <>
      {isMobile ? (
        <div>
          <div
            style={{
              background: 'var(--white)',
              borderBottom: '2px solid var(--lgray)',
              padding: '10px 12px',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              position: 'sticky',
              top: HEADER_H,
              zIndex: 100,
            }}
          >
            <input
              placeholder="🔍 Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ ...inputStyle, flex: 1, minWidth: 120 }}
            />
            <button
              type="button"
              className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')}
              onClick={() => setSport((s) => (s === 'baseball' ? 'Both' : 'baseball'))}
            >
              ⚾
            </button>
            <button
              type="button"
              className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')}
              onClick={() => setSport((s) => (s === 'softball' ? 'Both' : 'softball'))}
            >
              🥎
            </button>
            <select
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value)}
              style={{ ...inputStyle, minWidth: 160, flex: '0 0 160px' }}
            >
              {FACILITY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 12, color: 'var(--gray)', whiteSpace: 'nowrap' }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ height: 220, borderBottom: '2px solid var(--lgray)' }}>
            <MapContainer center={[33.5, -84.4]} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds facilities={mappable} selectedId={selected} />
              {selFacility?.lat != null && selFacility?.lng != null && (
                <FlyTo lat={selFacility.lat} lng={selFacility.lng} />
              )}
              {mappable.map((f) => (
                <Marker
                  key={f.id}
                  position={[f.lat, f.lng]}
                  icon={makeIcon(f, f.id === selected)}
                  zIndexOffset={f.id === selected ? 1000 : 0}
                  eventHandlers={{ click: () => setSelected(f.id) }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'var(--font-body)', minWidth: 160 }}>
                      <strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>{f.name}</strong>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                        📍 {[f.city, f.state].filter(Boolean).join(', ')}
                        {getFacilityZip(f) ? ' ' + getFacilityZip(f) : ''}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div style={{ padding: '12px', background: 'var(--cream)' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: 14 }}>
                Loading facilities…
              </div>
            )}
            {!loading && filtered.length === 0 && <EmptyState />}
            {filtered.map((f) => (
              <FacilityCard
                key={f.id}
                facility={f}
                selected={selected === f.id}
                onClick={() => setSelected(selected === f.id ? null : f.id)}
                distanceMi={getDistance(f)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '16px 14px 20px',
            background: 'var(--cream)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '300px minmax(0, 1fr) 200px',
              gap: 22,
              alignItems: 'start',
            }}
          >
            <aside
              style={{
                position: 'sticky',
                top: 84,
                alignSelf: 'start',
                background: 'var(--white)',
                border: '1px solid rgba(15,23,42,0.08)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 14px 12px',
                  background: 'var(--white)',
                  borderBottom: '1px solid var(--lgray)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>
                  {loading ? 'Loading…' : filtered.length + ' facilit' + (filtered.length !== 1 ? 'ies' : 'y')}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <span style={sectionLabel}>Search</span>
                  <input
                    placeholder="Name, city, address..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <span style={sectionLabel}>Location type</span>
                  <select value={facilityType} onChange={(e) => setFacilityType(e.target.value)} style={inputStyle}>
                    {FACILITY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <span style={sectionLabel}>Sport</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <button
                      type="button"
                      className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')}
                      onClick={() => setSport((s) => (s === 'baseball' ? 'Both' : 'baseball'))}
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      ⚾ Baseball
                    </button>
                    <button
                      type="button"
                      className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')}
                      onClick={() => setSport((s) => (s === 'softball' ? 'Both' : 'softball'))}
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                    >
                      🥎 Softball
                    </button>
                  </div>
                </div>

                <div>
                  <span style={sectionLabel}>Near zip code</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: zip.length === 5 && zipStatus === 'ok' ? 10 : 0,
                    }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 30004"
                      maxLength={5}
                      value={zip}
                      onChange={(e) => {
                        const next = e.target.value
                        setZip(next)
                        if (next.length < 5) {
                          setGeoCenter(null)
                          setZipStatus('')
                        }
                      }}
                      onBlur={handleZipBlur}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {zipStatus === 'ok' && (
                      <span style={{ fontSize: 12, color: '#16a34a', flexShrink: 0 }}>✓</span>
                    )}
                    {zipStatus === 'error' && (
                      <span style={{ fontSize: 12, color: 'var(--red)', flexShrink: 0 }}>?</span>
                    )}
                    {zipStatus === 'loading' && (
                      <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>…</span>
                    )}
                  </div>

                  {zip.length === 5 && zipStatus === 'ok' && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 12,
                          color: 'var(--gray)',
                          marginBottom: 4,
                        }}
                      >
                        <span>Radius</span>
                        <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{radius} mi</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--red)' }}
                      />
                      <button
                        type="button"
                        onClick={clearZipFilter}
                        style={{
                          marginTop: 8,
                          width: '100%',
                          background: 'white',
                          color: 'var(--navy)',
                          border: '2px solid var(--lgray)',
                          borderRadius: 8,
                          padding: '7px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Clear zip filter
                      </button>
                    </div>
                  )}
                </div>

                <a
                  href="/submit"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    background: 'var(--red)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: 'var(--btn-radius)',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-head)',
                    letterSpacing: '0.04em',
                    marginTop: 10,
                  }}
                >
                  + Add a Facility
                </a>
              </div>

              <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', padding: '12px', background: 'var(--cream)' }}>
                {loading && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: 14 }}>
                    Loading facilities…
                  </div>
                )}
                {!loading && filtered.length === 0 && <EmptyState />}
                {filtered.map((f) => (
                  <FacilityCard
                    key={f.id}
                    facility={f}
                    selected={selected === f.id}
                    onClick={() => setSelected(selected === f.id ? null : f.id)}
                    distanceMi={getDistance(f)}
                  />
                ))}
              </div>
            </aside>

            <main style={{ minWidth: 0 }}>
              <div
                style={{
                  position: 'sticky',
                  top: 76,
                  zIndex: 1,
                  background: 'var(--cream)',
                  paddingTop: 8,
                  paddingBottom: 10,
                }}
              >
                <div style={{ background: 'var(--white)', width: '100%' }}>
                  <div
                    style={{
                      height: 390,
                      width: '100%',
                      overflow: 'hidden',
                      borderRadius: 14,
                      border: '1px solid rgba(15,23,42,0.06)',
                    }}
                  >
                    <MapContainer center={[33.5, -84.4]} zoom={7} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <FitBounds facilities={mappable} selectedId={selected} />
                      {selFacility?.lat != null && selFacility?.lng != null && (
                        <FlyTo lat={selFacility.lat} lng={selFacility.lng} />
                      )}
                      {mappable.map((f) => (
                        <Marker
                          key={f.id}
                          position={[f.lat, f.lng]}
                          icon={makeIcon(f, f.id === selected)}
                          zIndexOffset={f.id === selected ? 1000 : 0}
                          eventHandlers={{ click: () => setSelected(f.id) }}
                        >
                          <Popup>
                            <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                              <strong style={{ fontFamily: 'var(--font-head)', fontSize: 15 }}>{f.name}</strong>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                                📍 {[f.city, f.state].filter(Boolean).join(', ')}
                                {getFacilityZip(f) ? ' ' + getFacilityZip(f) : ''}
                              </div>
                              {f.address && <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{f.address}</div>}
                              {getFacilityTypeLabel(f.facility_type) && <div style={{ fontSize: 12, marginTop: 2 }}>{getFacilityTypeLabel(f.facility_type)}</div>}
                              {getFacilitySport(f) && <div style={{ fontSize: 12, marginTop: 2 }}>{getSportLabel(getFacilitySport(f))}</div>}
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '8px 2px 0',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: 'var(--gray)',
                      }}
                    >
                      Map key
                    </span>
                    {[
                      ['Park / Rec Field', '#16A34A'],
                      ['Indoor Training Facility', '#D42B2B'],
                      ['Private Facility', '#8B5CF6'],
                      ['Team Facility', '#1D4ED8'],
                      ['School Field', '#6B7280'],
                    ].map(([label, color]) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50% 50% 50% 0',
                            transform: 'rotate(-45deg)',
                            background: color,
                            border: '2px solid rgba(255,255,255,0.9)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--gray)' }}>{label}</span>
                      </div>
                    ))}
                    {mappable.length === 0 && (
                      <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
                        Map pins appear as facilities add location data
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </main>

            <aside
              style={{
                position: 'sticky',
                top: 84,
                alignSelf: 'start',
                width: 200,
              }}
            >
              <div
                style={{
                  background: 'var(--white)',
                  border: '1px solid rgba(15,23,42,0.08)',
                  borderRadius: 14,
                  padding: 16,
                  display: 'grid',
                  gap: 16,
                }}
              >
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      border: '2px dashed var(--lgray)',
                      borderRadius: 'var(--card-radius)',
                      padding: '16px 12px',
                      textAlign: 'center',
                      background: 'var(--cream)',
                      minHeight: 160,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--gray)',
                      }}
                    >
                      Advertise Here
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>
                      Reach baseball &amp; softball families
                    </div>
                    <a
                      href="mailto:admin.bsbldirectory@gmail.com"
                      style={{
                        fontSize: 11,
                        color: 'var(--red)',
                        fontWeight: 700,
                        textDecoration: 'none',
                        marginTop: 4,
                      }}
                    >
                      Contact Us
                    </a>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  )
}
