import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
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

function normalizeSportValue(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'baseball' || raw === 'softball' || raw === 'both') return raw
  if (raw.includes('baseball') && raw.includes('softball')) return 'both'
  if (raw.includes('softball')) return 'softball'
  if (raw.includes('baseball')) return 'baseball'
  return ''
}

function getFacilitySport(facility) {
  const primary = normalizeSportValue(facility?.sport)
  const served = normalizeSportValue(facility?.sport_served)
  if (primary) return primary
  return served
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
  if (value === 'other') return '#9A6B2F'
  return '#9A6B2F'
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

function getSportBadgeMeta(sport) {
  if (sport === 'softball') return { bg: '#F3F0D7', color: '#5F5A17', label: 'Softball', border: '#DDD59A' }
  if (sport === 'both') {
    return {
      bg: 'linear-gradient(90deg, #E8EEF8 0%, #E8EEF8 48%, #F3F0D7 52%, #F3F0D7 100%)',
      color: '#173B73',
      label: 'Baseball & Softball',
      border: '#C9D4E5',
    }
  }
  if (sport === 'baseball') return { bg: '#E8EEF8', color: '#173B73', label: 'Baseball', border: '#C7D3E8' }
  return null
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

function FitBounds({ facilities }) {
  const map = useMap()

  useEffect(() => {

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
  }, [facilities, map])

  return null
}

function FlyTo({ target }) {
  const map = useMap()

  useEffect(() => {
    if (target?.lat != null && target?.lng != null) {
      const nextZoom = Math.max(map.getZoom(), 13)
      map.flyTo([target.lat, target.lng], nextZoom, { duration: 0.6 })
    }
  }, [target?.id, target?.nonce, map])

  return null
}

function AdBox({ compact = false }) {
  return (
    <div style={{ background: '#F7F3ED', border: '1px dashed #D8D0C5', borderRadius: 14, padding: compact ? '16px 14px' : '24px 16px', textAlign: 'center', minHeight: compact ? 90 : 150 }}>
      <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: '#7A6B57', fontFamily: 'var(--font-head)', marginBottom: 8 }}>ADVERTISE HERE</div>
      <div style={{ fontSize: compact ? 12 : 14, lineHeight: 1.5, color: '#9A8A75', marginBottom: 10 }}>Reach baseball &amp; softball families</div>
      <a href="mailto:admin.bsbldirectory@gmail.com?subject=Sandlot%20Source%20Ad%20Inquiry" style={{ color: 'var(--red)', fontWeight: 700, fontSize: compact ? 12 : 13, textDecoration: 'none' }}>Contact Us</a>
    </div>
  )
}

function formatFacilityLocation(facility) {
  const cityState = [facility.city, facility.state].filter(Boolean).join(', ')
  const zip = getFacilityZip(facility)
  return [cityState, zip].filter(Boolean).join(' ')
}

function FacilityCard({ facility, selected, onClick, distanceMi }) {
  const amenities = Array.isArray(facility.amenities) ? facility.amenities : []
  const facilityTypeLabel = getFacilityTypeLabel(facility.facility_type)
  const locationFull = formatFacilityLocation(facility)
  const sportMeta = getSportBadgeMeta(getFacilitySport(facility))
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
              <span style={{ background: '#F3F4F6', color: getFacilityTypeColor(facility.facility_type), fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-head)', flexShrink: 0 }}>
                {facilityTypeLabel}
              </span>
            )}
            {sportMeta && (
              <span className="badge" style={{ background: selected ? 'rgba(255,255,255,0.18)' : sportMeta.bg, color: selected ? '#fff' : sportMeta.color }}>
                {sportMeta.label}
              </span>
            )}
          </div>
        </div>

        {amenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
            {amenities.slice(0, 5).map((a) => (
              <span key={a} style={{ background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)', color: selected ? 'white' : 'var(--gray)', fontSize: 11, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>
                {a}
              </span>
            ))}
            {amenities.length > 5 && (
              <span style={{ background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)', color: selected ? 'white' : 'var(--gray)', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
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
              <a href={'tel:' + facility.phone.replace(/\D/g, '')} className="contact-link" onClick={(e) => e.stopPropagation()} style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 13 }}>
                📞 {facility.phone}
              </a>
            )}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="contact-link" onClick={(e) => e.stopPropagation()} style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 13 }}>
                🌐 Website
              </a>
            )}
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="contact-link" onClick={(e) => e.stopPropagation()} style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 13 }}>
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
          <Link to={`/facilities/${facility.id}`} onClick={(e) => e.stopPropagation()} style={{ color: selected ? '#f0a500' : '#1D4ED8', fontSize: 12, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            View Facility →
          </Link>
        </div>
      </div>
    </div>
  )
}

function FacilityPreviewCard({ facility, onClose }) {
  const facilityTypeLabel = getFacilityTypeLabel(facility.facility_type)
  const sportLabel = getSportLabel(getFacilitySport(facility))
  const sportMeta = getSportBadgeMeta(getFacilitySport(facility))
  const typeColor = getFacilityTypeColor(facility.facility_type)
  const amenities = Array.isArray(facility.amenities) ? facility.amenities : []
  const locationLine = formatFacilityLocation(facility)
  const fullAddress = [facility.address, [facility.city, facility.state].filter(Boolean).join(', '), getFacilityZip(facility)].filter(Boolean).join(', ')
  const websiteUrl = normalizeUrl(facility.website)
  const instagramUrl = normalizeInstagramHandle(facility.instagram)
  const facebookUrl = normalizeUrl(facility.facebook)
  const email = facility.contact_email || facility.email
  const phone = facility.phone || facility.contact_phone
  const mapQuery = encodeURIComponent(fullAddress || facility.name)

  return (
    <div style={{ position: 'fixed', top: 128, left: '56%', transform: 'translateX(-50%)', width: 'min(720px, calc(100vw - 48px))', maxHeight: 'calc(100vh - 156px)', overflowY: 'auto', background: 'rgba(255,255,255,0.985)', border: '1px solid rgba(15,23,42,0.10)', borderRadius: 18, boxShadow: '0 22px 56px rgba(15,23,42,0.24)', padding: 18, zIndex: 60, backdropFilter: 'blur(8px)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {sportMeta && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 9px', borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.05em', background: sportMeta.bg, color: sportMeta.color, border: `1px solid ${sportMeta.border}` }}>
                {sportMeta.label}
              </span>
            )}
            {facilityTypeLabel && (
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 9px', borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F3F4F6', color: typeColor, border: '1px solid #E5E7EB' }}>
                {facilityTypeLabel}
              </span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.1 }}>{facility.name}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray)', lineHeight: 1.45 }}>{fullAddress || locationLine || 'Location not listed'}</div>
        </div>

        <button type="button" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid rgba(15,23,42,0.12)', background: '#fff', color: 'var(--gray)', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>×</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 260px)', gap: 14, marginTop: 14 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Facility Details</div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              {sportLabel && <div><strong>Sport:</strong> {sportLabel}</div>}
              {facilityTypeLabel && <div><strong>Type:</strong> {facilityTypeLabel}</div>}
              {facility.hours && <div><strong>Hours:</strong> {facility.hours}</div>}
              {facility.contact_name && <div><strong>Contact:</strong> {facility.contact_name}</div>}
            </div>
          </div>

          {facility.description && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>About Facility</div>
              <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>{facility.description}</div>
            </div>
          )}

          {amenities.length > 0 && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Amenities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {amenities.map((item) => (
                  <span key={item} style={{ background: '#EEF2F7', color: 'var(--navy)', fontSize: 12, padding: '5px 9px', borderRadius: 999, textTransform: 'capitalize' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Contact / Details</div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.75 }}>
              {phone && <div><a href={`tel:${String(phone).replace(/\D/g, '')}`} style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 700 }}>{phone}</a></div>}
              {email && <div><a href={`mailto:${email}`} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>{email}</a></div>}
              {!phone && !email && <div>Contact details not listed.</div>}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Location</div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              <div>{fullAddress || locationLine || 'Location not listed.'}</div>
              {(fullAddress || locationLine) && (
                <a href={`https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>
                  Open in Maps
                </a>
              )}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <Link to={`/facilities/${facility.id}`} onClick={onClose} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>View Facility Page</Link>
              {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>Facility Website</a>}
              {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>Instagram</a>}
              {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>Facebook</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Facilities() {
  const rowRefs = useRef({})
  const desktopListRef = useRef(null)
  const mobileListRef = useRef(null)
  const [searchParams] = useSearchParams()

  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => searchParams.get('select') || null)
  const [mapFocus, setMapFocus] = useState(null)
  const [sport, setSport] = useState('Both')
  const [facilityType, setFacilityType] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [zip, setZip] = useState('')
  const [radius, setRadius] = useState(25)
  const [geoCenter, setGeoCenter] = useState(null)
  const [zipStatus, setZipStatus] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [showMap, setShowMap] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setShowMap(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const applySearch = () => setSearch(searchInput.trim())

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applySearch()
    }
  }

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

  useEffect(() => {
    const selectedFromUrl = searchParams.get('select')
    if (!selectedFromUrl || facilities.length === 0) return
    const match = facilities.find((f) => f.id === String(selectedFromUrl))
    if (match?.lat != null && match?.lng != null) {
      setMapFocus({ id: String(selectedFromUrl), lat: match.lat, lng: match.lng, nonce: Date.now() })
    }
  }, [searchParams, facilities])

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

  useEffect(() => {
    if (!selected) return
    const rowEl = rowRefs.current[selected]
    if (!rowEl) return
    const t = setTimeout(() => {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 120)
    return () => clearTimeout(t)
  }, [selected, isMobile])

  const mappable = filtered.filter((f) => f.lat != null && f.lng != null)

  function getDistance(f) {
    if (!geoCenter || f.lat == null || f.lng == null) return null
    return distanceMiles(geoCenter.lat, geoCenter.lng, f.lat, f.lng)
  }

  const selFacility = selected
    ? filtered.find((f) => f.id === selected) || facilities.find((f) => f.id === selected) || null
    : null

  function openFacilityById(facilityId, source = 'list') {
    const nextId = facilityId != null ? String(facilityId) : null
    if (!nextId) {
      setSelected(null)
      return
    }

    setSelected(nextId)

    if (source === 'map') return

    const match = filtered.find((f) => f.id === nextId) || facilities.find((f) => f.id === nextId)
    if (match?.lat != null && match?.lng != null) {
      setMapFocus({ id: nextId, lat: match.lat, lng: match.lng, nonce: Date.now() })
    }
  }

  function closeFacilityPreview() {
    setSelected(null)
  }

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

  const desktopRowTemplate = '140px minmax(0,1.1fr) 150px minmax(0,1fr) 84px'
  const desktopHeaderCellStyle = {
    fontSize: 10,
    fontWeight: 800,
    color: 'var(--gray)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }

  function EmptyState() {
    const hasFilters = sport !== 'Both' || search || zipStatus === 'ok' || facilityType !== 'all'
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
          <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--lgray)', padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', position: 'sticky', top: HEADER_H, zIndex: 100 }}>
            <button type="button" onClick={() => setShowMap((m) => !m)} style={{ flex: 1, padding: '9px 10px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--navy)', background: showMap ? 'var(--navy)' : 'var(--white)', color: showMap ? 'var(--white)' : 'var(--navy)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40 }}>{showMap ? 'Hide Map' : 'Show Map'}</button>
            <a href="/submit" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '9px 10px', borderRadius: 'var(--btn-radius)', background: 'var(--red)', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+ Add a Facility</a>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
              <input placeholder="Name, city, address..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={onSearchKeyDown} style={inputStyle} />
              <button type="button" onClick={applySearch} style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, minHeight: 40, fontWeight: 700 }}>Search</button>
            </div>
            {showMap && <div style={{ background: 'var(--white)', marginBottom: 14 }}><div style={{ height: 240, overflow: 'hidden', borderRadius: 12 }}><MapContainer center={[33.5, -84.4]} zoom={7} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitBounds facilities={mappable} />{mapFocus?.lat != null && mapFocus?.lng != null && <FlyTo target={mapFocus} />}{mappable.map((f) => <Marker key={f.id} position={[f.lat, f.lng]} icon={makeIcon(f, f.id === selected)} zIndexOffset={f.id === selected ? 1000 : 0} eventHandlers={{ click: () => openFacilityById(f.id, 'map') }}><Popup><div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}><strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>{f.name}</strong><div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>📍 {[f.city, f.state].filter(Boolean).join(', ')}{getFacilityZip(f) ? ' ' + getFacilityZip(f) : ''}</div><Link to={`/facilities/${f.id}`} style={{ display: 'inline-block', marginTop: 8, color: '#1D4ED8', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}>View Facility</Link></div></Popup></Marker>)}</MapContainer></div><div style={{ display: 'flex', gap: 12, padding: '8px 2px 0', alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)' }}>Map key</span>{[['Park / Rec Field', '#16A34A'],['Indoor Training Facility', '#D42B2B'],['Private Facility', '#8B5CF6'],['Team Facility', '#1D4ED8'],['School Field', '#6B7280']].map(([label, color]) => <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: color, border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} /><span style={{ fontSize: 11, color: 'var(--gray)' }}>{label}</span></div>)}</div></div>}
            <div ref={mobileListRef} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>{loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: 14 }}>Loading facilities…</div>}{!loading && filtered.length === 0 && <EmptyState />}{!loading && filtered.map((f) => <div key={f.id} ref={(el) => { if (el) rowRefs.current[f.id] = el; else delete rowRefs.current[f.id] }}><FacilityCard facility={f} selected={selected === f.id} onClick={() => (selected === f.id ? closeFacilityPreview() : openFacilityById(f.id, 'list'))} distanceMi={getDistance(f)} /></div>)}</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 14px 20px', background: 'var(--cream)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 18, alignItems: 'start', width: '100%' }}>
            <aside style={{ position: 'sticky', top: 76, alignSelf: 'start', background: 'var(--white)', borderRight: '1px solid rgba(15,23,42,0.06)', zIndex: 2 }}>
              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--lgray)' }}><div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 2, lineHeight: 1.1 }}>{filtered.length} facilit{filtered.length !== 1 ? 'ies' : 'y'}</div><div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.3 }}>Parks, private facilities, and training locations</div></div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--lgray)', background: 'var(--white)' }}>
                <div><div style={sectionLabel}>Search</div><input placeholder="Name, city, address..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={onSearchKeyDown} style={{ ...inputStyle, minHeight: 40 }} /></div>
                <div><div style={sectionLabel}>Location type</div><select value={facilityType} onChange={(e) => { setFacilityType(e.target.value); setSelected(null) }} style={{ ...inputStyle, minHeight: 40 }}>{FACILITY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                <div><div style={sectionLabel}>Sport</div><div style={{ display: 'flex', gap: 8 }}><button type="button" className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')} onClick={() => { setSport((s) => (s === 'baseball' ? 'Both' : 'baseball')); setSelected(null) }} style={{ flex: 1, minHeight: 38 }}>⚾ Baseball</button><button type="button" className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')} onClick={() => { setSport((s) => (s === 'softball' ? 'Both' : 'softball')); setSelected(null) }} style={{ flex: 1, minHeight: 38 }}>🥎 Softball</button></div></div>
                <div><div style={sectionLabel}>Near zip code</div><input type="text" inputMode="numeric" placeholder="e.g. 30004" maxLength={5} value={zip} onChange={(e) => { const next = e.target.value.replace(/\D/g, '').slice(0, 5); setZip(next); if (next.length < 5) { setGeoCenter(null); setZipStatus('') } }} onBlur={handleZipBlur} style={{ ...inputStyle, minHeight: 40 }} />{zip.length === 5 && zipStatus === 'ok' && <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 4, marginTop:8 }}><span>Radius</span><span style={{ fontWeight: 600, color: 'var(--navy)' }}>{radius} mi</span></div><input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--red)' }} /><button type="button" onClick={clearZipFilter} style={{ marginTop: 8, width: '100%', background: 'white', color: 'var(--navy)', border: '2px solid var(--lgray)', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700 }}>Clear zip filter</button></div>}</div>
                <button type="button" onClick={applySearch} style={{ width: '100%', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>Search</button>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => setShowMap((m) => !m)} style={{ flex: 1, padding: '9px 10px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--navy)', background: showMap ? 'var(--navy)' : 'var(--white)', color: showMap ? 'var(--white)' : 'var(--navy)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40 }}>{showMap ? 'Hide Map' : 'Show Map'}</button><a href="/submit" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '9px 10px', borderRadius: 'var(--btn-radius)', background: 'var(--red)', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+ Add a Facility</a></div>
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--lgray)', background: 'var(--white)' }}><AdBox compact /></div>
            </aside>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 230px', gap: 22, alignItems: 'start' }}>
                <main style={{ minWidth: 0 }}>
                  <div style={{ position: 'sticky', top: 76, zIndex: 1, background: 'var(--page-bg, #f5f3ef)', paddingTop: 8, paddingBottom: 10 }}>
                    {showMap && <div style={{ background: 'var(--white)', width: '100%' }}><div style={{ height: 360, width: '100%', overflow: 'hidden', borderRadius: 14, border: '1px solid rgba(15,23,42,0.06)' }}><MapContainer center={[33.5, -84.4]} zoom={7} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitBounds facilities={mappable} />{mapFocus?.lat != null && mapFocus?.lng != null && <FlyTo target={mapFocus} />}{mappable.map((f) => <Marker key={f.id} position={[f.lat, f.lng]} icon={makeIcon(f, f.id === selected)} zIndexOffset={f.id === selected ? 1000 : 0} eventHandlers={{ click: () => openFacilityById(f.id, 'map') }}><Popup><div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}><strong style={{ fontFamily: 'var(--font-head)', fontSize: 15 }}>{f.name}</strong><div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>📍 {[f.city, f.state].filter(Boolean).join(', ')}{getFacilityZip(f) ? ' ' + getFacilityZip(f) : ''}</div>{f.address && <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{f.address}</div>}{getFacilityTypeLabel(f.facility_type) && <div style={{ fontSize: 12, marginTop: 2 }}>{getFacilityTypeLabel(f.facility_type)}</div>}<button type="button" onClick={() => openFacilityById(f.id, 'map')} style={{ display: 'inline-block', marginTop: 8, background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 10px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Preview Facility</button></div></Popup></Marker>)}</MapContainer></div><div style={{ display: 'flex', gap: 12, padding: '8px 2px 0', alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)' }}>Map key</span>{[['Park / Rec Field', '#16A34A'],['Indoor Training Facility', '#D42B2B'],['Private Facility', '#8B5CF6'],['Team Facility', '#1D4ED8'],['School Field', '#6B7280']].map(([label, color]) => <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: color, border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} /><span style={{ fontSize: 11, color: 'var(--gray)' }}>{label}</span></div>)}</div></div>}
                    {!showMap && <div style={{ background: 'var(--white)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, marginTop: 10, padding: '16px', color: 'var(--gray)', fontSize: 13, width: '100%' }}>Map is hidden. Use “Show Map” in the left panel to view facility locations.</div>}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{filtered.length} Facilit{filtered.length !== 1 ? 'ies' : 'y'}</div><div style={{ fontSize: 12, color: 'var(--gray)' }}>Compact list below. Click a row or pin to preview, then use View Facility for the full page.</div></div>
                  </div>

                  <div style={{ marginTop: 8, background: 'var(--white)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
                    <div ref={desktopListRef} style={{ maxHeight: 'min(560px, calc(100vh - 215px))', overflowY: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: desktopRowTemplate, gap: 10, alignItems: 'center', padding: '11px 14px', background: '#EEF3FA', borderBottom: '1px solid rgba(15,23,42,0.08)', position: 'sticky', top: 0, zIndex: 2 }}>
                        <div style={desktopHeaderCellStyle}>Sport</div>
                        <div style={desktopHeaderCellStyle}>Facility</div>
                        <div style={desktopHeaderCellStyle}>Type</div>
                        <div style={desktopHeaderCellStyle}>Location</div>
                        <div style={{ ...desktopHeaderCellStyle, textAlign: 'right' }}>View</div>
                      </div>

                      {loading && <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray)', fontSize: 14 }}>Loading facilities...</div>}
                      {!loading && filtered.length === 0 && <div style={{ padding: '16px 14px' }}><EmptyState /></div>}
                      {!loading && filtered.map((f) => {
                        const isSelected = selected === f.id
                        const typeLabel = getFacilityTypeLabel(f.facility_type)
                        const sportMeta = getSportBadgeMeta(getFacilitySport(f))
                        const locationFull = formatFacilityLocation(f)
                        const subtitle = f.address || locationFull || 'Location not listed'
                        return (
                          <div key={f.id} ref={(el) => { if (el) rowRefs.current[f.id] = el; else delete rowRefs.current[f.id] }} style={{ borderBottom: '1px solid rgba(15,23,42,0.06)', background: isSelected ? '#FCFCFD' : 'var(--white)' }}>
                            <div onClick={() => openFacilityById(f.id, 'list')} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openFacilityById(f.id, 'list') } }} style={{ display: 'grid', gridTemplateColumns: desktopRowTemplate, gap: 10, alignItems: 'center', padding: '10px 14px', cursor: 'pointer' }}>
                              <div style={{ minWidth: 0 }}>
                                {sportMeta ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', background: sportMeta.bg, color: sportMeta.color, border: `1px solid ${sportMeta.border}` }}>
                                    {sportMeta.label}
                                  </span>
                                ) : <span style={{ fontSize: 12, color: 'var(--gray)' }}>—</span>}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.name}>{f.name}</div>
                                <div style={{ marginTop: 3, fontSize: 11, color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={Array.isArray(f.amenities) ? f.amenities.join(', ') : ''}>{Array.isArray(f.amenities) && f.amenities.length ? f.amenities.slice(0, 3).join(' · ') : 'No amenities listed'}</div>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', background: '#F3F4F6', color: getFacilityTypeColor(f.facility_type), border: '1px solid #E5E7EB' }}>
                                  {typeLabel || 'Other'}
                                </span>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={subtitle}>{subtitle}</div>
                                <div style={{ marginTop: 3, fontSize: 11, color: 'var(--gray)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={locationFull}>{locationFull || 'Location not listed'}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <button type="button" onClick={(event) => { event.stopPropagation(); isSelected ? closeFacilityPreview() : openFacilityById(f.id, 'list') }} style={{ minWidth: 64, padding: '7px 8px', borderRadius: 9, border: '1.5px solid var(--navy)', background: isSelected ? 'var(--navy)' : 'var(--white)', color: isSelected ? 'var(--white)' : 'var(--navy)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-head)' }}>{isSelected ? 'Close' : 'Open'}</button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {selFacility && <FacilityPreviewCard facility={selFacility} onClose={closeFacilityPreview} />}
                  </div>
                </main>
                <aside style={{ position: 'sticky', top: 76, alignSelf: 'start', padding: '8px 0 0 0', width: '230px', justifySelf: 'end' }}><div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><AdBox /><AdBox /><AdBox /></div></aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
