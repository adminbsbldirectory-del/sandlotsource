import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

const HEADER_H = 75

function sportPinBackground(value) {
  const sport = normalizeSportValue(value)
  if (sport === 'softball') return '#FACC15'
  if (sport === 'both') return 'conic-gradient(#2563EB 0deg 180deg, #FACC15 180deg 360deg)'
  return '#2563EB'
}

function makePinIcon(background, selected = false) {
  const size = selected ? 38 : 30
  const inner = selected ? 30 : 22
  const border = selected ? '#F0A500' : '#FFFFFF'
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${background};border:4px solid ${border};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.32);display:flex;align-items:center;justify-content:center;"><div style="width:${inner}px;height:${inner}px;border-radius:50%;background:rgba(255,255,255,0.18);"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 8],
  })
}

const SPECIALTIES = [
  'All Specialties',
  'Pitching',
  'Hitting',
  'Catching',
  'Fielding',
  'Strength / Conditioning',
]

const US_STATES = [
  'All States',
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY',
]

function normalizeSportValue(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'baseball' || raw === 'softball' || raw === 'both') return raw
  if (raw.includes('baseball') && raw.includes('softball')) return 'both'
  if (raw.includes('softball')) return 'softball'
  if (raw.includes('baseball')) return 'baseball'
  return raw
}

function getSportBadgeMeta(value) {
  const sport = normalizeSportValue(value)
  if (sport === 'both') return { key: 'both', label: 'Baseball & Softball', bg: '#DCEAFE', color: '#1E3A8A' }
  if (sport === 'softball') return { key: 'softball', label: 'Softball', bg: '#F5E79E', color: '#7A4E00' }
  return { key: 'baseball', label: 'Baseball', bg: '#DBEAFE', color: '#1D4ED8' }
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

function parseFirstPhone(raw) {
  if (!raw) return null
  return raw.split(/[\/,]/)[0].trim() || null
}

function parseSpecialties(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value)
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function getCoachZip(coach) {
  return coach.zip || coach.zip_code || ''
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeCoach(coach) {
  return {
    ...coach,
    id: coach.id == null ? '' : String(coach.id).trim(),
    facility_id: coach.facility_id == null ? null : String(coach.facility_id).trim(),
    lat: toNumber(coach.lat ?? coach.latitude),
    lng: toNumber(coach.lng ?? coach.longitude),
    zip: coach.zip || coach.zip_code || '',
    specialty: parseSpecialties(coach.specialty),
  }
}

function normalizeFacility(facility) {
  return {
    ...facility,
    id: facility.id == null ? '' : String(facility.id).trim(),
    lat: toNumber(facility.lat),
    lng: toNumber(facility.lng),
    zip: facility.zip_code || '',
  }
}

function FlyTo({ lat, lng }) {
  const map = useMap()

  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 13, { duration: 0.8 })
    }
  }, [lat, lng, map])

  return null
}

function FitBounds({ points, selectedId }) {
  const map = useMap()

  useEffect(() => {
    if (selectedId) return

    const pts = (points || []).filter((c) => c.lat != null && c.lng != null)
    if (pts.length === 0) return

    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 12)
      return
    }

    const bounds = L.latLngBounds(pts.map((c) => [c.lat, c.lng]))
    const t = setTimeout(() => {
      map.invalidateSize()
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }, 50)

    return () => clearTimeout(t)
  }, [points, selectedId, map])

  return null
}

function aggregateSportValue(items) {
  const sports = new Set((items || []).map((item) => normalizeSportValue(item.sport)).filter(Boolean))
  if (sports.has('both') || (sports.has('baseball') && sports.has('softball'))) return 'both'
  if (sports.has('softball')) return 'softball'
  return 'baseball'
}

function buildMarkerGroups(coaches) {
  const map = new Map()

  for (const coach of coaches || []) {
    if (coach.lat == null || coach.lng == null) continue

    const key = coach.facility_id
      ? `facility:${coach.facility_id}`
      : `coord:${coach.lat}:${coach.lng}`

    if (!map.has(key)) {
      map.set(key, {
        key,
        id: coach.facility_id || coach.id,
        lat: coach.lat,
        lng: coach.lng,
        facility_id: coach.facility_id || null,
        facility_name: coach.facility_name || '',
        city: coach.city || '',
        state: coach.state || '',
        zip: getCoachZip(coach),
        coaches: [],
      })
    }

    map.get(key).coaches.push(coach)
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    sport: aggregateSportValue(group.coaches),
  }))
}


function MapMarkers({ groups, selected, setSelected }) {
  return groups.map((group) => {
    const selectedCoach = group.coaches.find((coach) => coach.id === selected) || null
    const primaryCoach = selectedCoach || group.coaches[0]
    const isSelected = !!selectedCoach
    const locationLine = [group.city, group.state].filter(Boolean).join(', ')

    return (
      <Marker
        key={group.key}
        position={[group.lat, group.lng]}
        icon={makePinIcon(sportPinBackground(group.sport), isSelected)}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{ click: () => setSelected(primaryCoach.id) }}
      >
        <Popup>
          <div style={{ fontFamily: 'var(--font-body)', minWidth: 220 }}>
            <strong style={{ fontFamily: 'var(--font-head)', fontSize: 15 }}>
              {group.facility_name || primaryCoach.name}
            </strong>
            {locationLine && (
              <div style={{ fontSize: 12, marginTop: 4 }}>
                📍 {locationLine}
                {group.zip ? ` ${group.zip}` : ''}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#666', marginTop: 6, fontWeight: 700 }}>
              {group.coaches.length} coach{group.coaches.length !== 1 ? 'es' : ''} at this location
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {group.coaches.map((coach) => {
                const specs = parseSpecialties(coach.specialty)
                const active = coach.id === selected
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => setSelected(coach.id)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: active ? '2px solid var(--gold)' : '1px solid #E5E7EB',
                      background: active ? 'var(--navy)' : '#fff',
                      color: active ? '#fff' : 'var(--navy)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{coach.name}</div>
                    {specs.length > 0 && (
                      <div style={{ fontSize: 11, marginTop: 2, opacity: active ? 0.92 : 0.72 }}>
                        {specs.join(', ')}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Popup>
      </Marker>
    )
  })
}

function RatingRow({ coach, selected }) {
  const avg = parseFloat(coach.rating_average) || 0
  const count = parseInt(coach.review_count, 10) || 0
  const icon = normalizeSportValue(coach.sport) === 'softball' ? '🥎' : '⚾'

  if (count === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 13 }}>
        <span>{icon}</span>
        <span style={{ opacity: 0.45, fontSize: 12 }}>No reviews yet</span>
      </div>
    )
  }

  const full = Math.floor(avg)
  const half = avg - full >= 0.3
  const empty = 5 - full - (half ? 1 : 0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 13 }}>
      <span>{icon}</span>
      <span>
        {icon.repeat(Math.max(0, full))}
        {half ? '◐' : ''}
        {empty > 0 ? '○'.repeat(Math.max(0, empty)) : ''}
      </span>
      <span style={{ fontWeight: 700, color: selected ? 'var(--gold)' : 'var(--navy)' }}>{avg.toFixed(1)}</span>
      <span style={{ opacity: 0.6, fontSize: 12 }}>({count} review{count !== 1 ? 's' : ''})</span>
    </div>
  )
}

function CoachCard({ coach, selected, onClick, onViewProfile, distanceMi }) {
  const specs = parseSpecialties(coach.specialty)
  const firstPhone = parseFirstPhone(coach.phone)
  const zip = getCoachZip(coach)
  const sportBadge = getSportBadgeMeta(coach.sport)

  const cardStyle = selected
    ? {
        background: 'var(--navy)',
        color: 'var(--white)',
        border: '2px solid var(--gold)',
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
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0 0 var(--card-radius) var(--card-radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
      }
    : undefined

  return (
    <div className={selected ? '' : 'card'} style={cardStyle} onClick={onClick}>
      <div className={selected ? '' : 'card-body'} style={selected ? { flex: 1, padding: '14px 16px' } : undefined}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, letterSpacing: '0.02em' }}>
              {coach.name}
            </div>

            {(coach.verified_status || coach.featured_status) && (
              <div style={{ display: 'flex', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                {coach.verified_status && (
                  <span className="badge" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                    ✓ Verified
                  </span>
                )}
                {coach.featured_status && (
                  <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
                    ⭐ Featured
                  </span>
                )}
              </div>
            )}

            {coach.facility_name && <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{coach.facility_name}</div>}

            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
              📍 {[coach.city, coach.state].filter(Boolean).join(', ')}
              {zip ? ` ${zip}` : ''}
            </div>
          </div>

          <span
            style={selected ? {
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-head)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            } : {
              background: sportBadge.bg,
              color: sportBadge.color,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-head)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {sportBadge.label}
          </span>
        </div>

        <RatingRow coach={coach} selected={selected} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {specs.map((s) => (
            <span
              key={s}
              style={{
                background: selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)',
                color: selected ? 'white' : 'var(--gray)',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
                textTransform: 'capitalize',
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {coach.credentials && (
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75, lineHeight: 1.4 }}>
            {coach.credentials.length > 80 ? coach.credentials.slice(0, 80) + '…' : coach.credentials}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 12 }}>
          <span style={{ color: selected ? 'var(--gold)' : 'var(--green)', fontWeight: 600 }}>
            {coach.price_per_session
              ? '$' + coach.price_per_session + '/session'
              : coach.price_notes
                ? coach.price_notes
                : 'Contact for rates'}
          </span>
          {coach.recommendation_count > 0 && (
            <span style={{ opacity: 0.6 }}>
              👍 {coach.recommendation_count} rec{coach.recommendation_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {(coach.email || firstPhone || coach.website) && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid ' + (selected ? 'rgba(255,255,255,0.15)' : 'var(--lgray)'),
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {coach.email && (
              <a
                href={'mailto:' + coach.email}
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{ color: selected ? 'var(--gold)' : '#1D4ED8' }}
              >
                📧 {coach.email}
              </a>
            )}
            {firstPhone && (
              <a
                href={'tel:' + firstPhone.replace(/\D/g, '')}
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{ color: selected ? 'var(--gold)' : 'var(--navy)' }}
              >
                📞 {firstPhone}
              </a>
            )}
            {coach.website && (
              <a
                href={coach.website.startsWith('http') ? coach.website : 'https://' + coach.website}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{ color: selected ? 'var(--gold)' : '#1D4ED8' }}
              >
                🌐 Website
              </a>
            )}
          </div>
        )}
      </div>

      <div className={selected ? '' : 'card-footer'} style={footerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onViewProfile(coach)
          }}
          style={{
            width: '100%',
            background: selected ? 'var(--gold)' : 'var(--navy)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--btn-radius)',
            padding: '8px 0',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-head)',
            letterSpacing: '0.04em',
          }}
        >
          View Profile &amp; Reviews
        </button>
      </div>
    </div>
  )
}

function MapLegend() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: '6px 14px',
        background: 'var(--white)',
        borderBottom: '1px solid var(--lgray)',
        alignItems: 'center',
        flexShrink: 0,
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
        { color: '#2563EB', label: 'Baseball Coach' },
        { color: '#FACC15', label: 'Softball Coach' },
        { color: 'conic-gradient(#2563EB 0deg 180deg, #FACC15 180deg 360deg)', label: 'Baseball & Softball' },
      ].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 11,
              height: 11,
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: item.color,
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function AdBox({ compact = false }) {
  return (
    <div style={{ background: '#F7F3ED', border: '1px dashed #D8D0C5', borderRadius: 14, padding: compact ? '16px 14px' : '24px 16px', textAlign: 'center', minHeight: compact ? 90 : 150 }}>
      <div style={{ fontSize: compact ? 13 : 16, fontWeight: 700, color: '#7A6B57', fontFamily: 'var(--font-head)', marginBottom: 8 }}>ADVERTISE HERE</div>
      <div style={{ fontSize: compact ? 12 : 14, lineHeight: 1.5, color: '#9A8A75', marginBottom: 10 }}>Reach baseball &amp; softball families</div>
      <a href="mailto:admin@sandlotsource.com?subject=Sandlot%20Source%20Ad%20Inquiry" style={{ color: 'var(--red)', fontWeight: 700, fontSize: compact ? 12 : 13, textDecoration: 'none' }}>Contact Us</a>
    </div>
  )
}

function EmptyState({ facilityContextName }) {
  return (
    <div className="empty-state">
      <h3>{facilityContextName ? 'No linked coaches found' : 'No coaches match your filters'}</h3>
      <p>
        {facilityContextName
          ? `We couldn’t find approved active coaches linked to ${facilityContextName}.`
          : 'Try changing your search or clearing one of the filters.'}
      </p>
    </div>
  )
}

export default function CoachDirectory() {
  const [searchParams] = useSearchParams()

  const [coaches, setCoaches] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => searchParams.get('select') || null)
  const [sport, setSport] = useState('Both')
  const [specialty, setSpecialty] = useState('All Specialties')
  const [state, setState] = useState('All States')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [profileCoach, setProfileCoach] = useState(null)
  const [showMap, setShowMap] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [zip, setZip] = useState('')
  const [geoCenter, setGeoCenter] = useState(null)
  const [zipStatus, setZipStatus] = useState('')
  const [radius, setRadius] = useState(25)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  const selectedFromUrl = searchParams.get('select') || null
  const facilityFromUrl = searchParams.get('facility') || null

  const desktopListRef = useRef(null)
  const mobileListRef = useRef(null)
  const coachCardRefs = useRef({})
  const lastAutoScrolledKey = useRef('')
  const userInteractedWithList = useRef(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const applySearch = () => setSearch(searchInput.trim())

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applySearch()
    }
  }

  async function handleZipBlur() {
    if (zip.length !== 5) {
      setGeoCenter(null)
      setZipStatus('')
      return
    }

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

  useEffect(() => {
    setSelected(selectedFromUrl)
  }, [selectedFromUrl])

  useEffect(() => {
    async function load() {
      const [{ data: coachData, error: coachError }, { data: facilityData, error: facilityError }] =
        await Promise.all([
          supabase
            .from('coaches')
            .select('*')
            .eq('active', true)
            .in('approval_status', ['approved', 'seeded']),
          supabase
            .from('facilities')
            .select('id, name, lat, lng, address, city, state, zip_code')
            .eq('active', true)
            .in('approval_status', ['approved', 'seeded']),
        ])

      const normalizedCoachesLoaded = !coachError && coachData ? coachData.map(normalizeCoach) : []
      const normalizedFacilitiesLoaded = !facilityError && facilityData ? facilityData.map(normalizeFacility) : []

      setCoaches(normalizedCoachesLoaded)
      setFacilities(normalizedFacilitiesLoaded)

      if (selectedFromUrl) {
        const match = normalizedCoachesLoaded.find((c) => c.id === selectedFromUrl)
        if (match) setSelected(match.id)
      }

      setLoading(false)
    }

    load()
  }, [selectedFromUrl])

  const facilityMap = useMemo(() => {
    const map = new Map()
    for (const facility of facilities) {
      map.set(facility.id, facility)
    }
    return map
  }, [facilities])

  const facilityContext = useMemo(() => {
    if (!facilityFromUrl) return null
    return facilityMap.get(String(facilityFromUrl).trim()) || null
  }, [facilityFromUrl, facilityMap])

  const resolvedCoaches = useMemo(() => {
    return coaches.map((coach) => {
      if (!coach.facility_id) return coach

      const linkedFacility = facilityMap.get(coach.facility_id)
      if (!linkedFacility) return coach
      if (linkedFacility.lat == null || linkedFacility.lng == null) return coach

      return {
        ...coach,
        lat: linkedFacility.lat,
        lng: linkedFacility.lng,
        coord_source: 'facility',
      }
    })
  }, [coaches, facilityMap])

  const baseFiltered = useMemo(() => {
    return resolvedCoaches.filter((c) => {
      const specs = c.specialty || []

      const normalizedSport = normalizeSportValue(c.sport)
      if (sport !== 'Both' && normalizedSport !== sport && normalizedSport !== 'both') return false
      if (specialty !== 'All Specialties' && !specs.includes(specialty)) return false
      if (state !== 'All States' && (c.state || '').toUpperCase() !== state) return false

      if (search) {
        const q = search.toLowerCase()
        if (
          !(c.name || '').toLowerCase().includes(q) &&
          !(c.city || '').toLowerCase().includes(q) &&
          !(c.facility_name || '').toLowerCase().includes(q) &&
          !String(c.zip || c.zip_code || '').includes(q)
        ) {
          return false
        }
      }

      if (geoCenter && c.lat != null && c.lng != null) {
        if (distanceMiles(geoCenter.lat, geoCenter.lng, c.lat, c.lng) > radius) return false
      }

      return true
    })
  }, [resolvedCoaches, sport, specialty, state, search, geoCenter, radius])

  const filtered = useMemo(() => {
    if (!facilityFromUrl) return baseFiltered
    const normalizedFacilityId = String(facilityFromUrl).trim()
    return baseFiltered.filter((c) => c.facility_id === normalizedFacilityId)
  }, [baseFiltered, facilityFromUrl])

  const displayedCoaches = useMemo(() => {
    if (!selected) return filtered

    const idx = filtered.findIndex((c) => c.id === selected)
    if (idx <= 0) return filtered

    const next = [...filtered]
    const [selectedCoach] = next.splice(idx, 1)
    next.unshift(selectedCoach)
    return next
  }, [filtered, selected])

  const mappable = useMemo(() => filtered.filter((c) => c.lat != null && c.lng != null), [filtered])
  const markerGroups = useMemo(() => buildMarkerGroups(mappable), [mappable])

  function getDistance(coach) {
    if (!geoCenter || coach.lat == null || coach.lng == null) return null
    return distanceMiles(geoCenter.lat, geoCenter.lng, coach.lat, coach.lng)
  }

  const sel = useMemo(() => {
    if (!selected) return null
    return filtered.find((c) => c.id === selected) || resolvedCoaches.find((c) => c.id === selected) || null
  }, [selected, filtered, resolvedCoaches])

  useEffect(() => {
    userInteractedWithList.current = false
  }, [selectedFromUrl, facilityFromUrl])

  useEffect(() => {
    if (loading || !selected) return

    const selectedVisible = displayedCoaches.some((c) => c.id === selected)
    if (!selectedVisible) return

    const listEl = isMobile ? mobileListRef.current : desktopListRef.current
    const cardEl = coachCardRefs.current[selected]
    if (!listEl || !cardEl) return

    const scrollKey = [
      selected,
      facilityFromUrl || '',
      search || '',
      sport,
      specialty,
      state,
      isMobile ? 'mobile' : 'desktop',
    ].join('|')

    const shouldForceScroll =
      selected === selectedFromUrl ||
      !!facilityFromUrl

    if (!shouldForceScroll) return

    if (lastAutoScrolledKey.current === scrollKey && userInteractedWithList.current) return

    const run = () => {
      if (typeof cardEl.scrollIntoView === 'function') {
        cardEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        })
      }
      lastAutoScrolledKey.current = scrollKey
    }

    const t = setTimeout(run, 120)
    return () => clearTimeout(t)
  }, [
    loading,
    selected,
    selectedFromUrl,
    facilityFromUrl,
    displayedCoaches,
    isMobile,
    search,
    sport,
    specialty,
    state,
  ])

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

  const setCardRef = (id) => (node) => {
    if (node) {
      coachCardRefs.current[id] = node
    } else {
      delete coachCardRefs.current[id]
    }
  }

  const handleSelectCoach = (coachId) => {
    userInteractedWithList.current = true
    setSelected((prev) => (prev === coachId ? null : coachId))
  }

  const handleListInteraction = () => {
    userInteractedWithList.current = true
  }

  return (
    <>
      {profileCoach && <CoachProfile coach={profileCoach} onClose={() => setProfileCoach(null)} />}

      {isMobile ? (
        <div>
          <div style={{ background: 'var(--white)', borderBottom: '2px solid var(--lgray)', padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', position: 'sticky', top: HEADER_H, zIndex: 100 }}>
            <button type="button" onClick={() => setShowMap((m) => !m)} style={{ flex: 1, padding: '9px 10px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--navy)', background: showMap ? 'var(--navy)' : 'var(--white)', color: showMap ? 'var(--white)' : 'var(--navy)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40 }}>{showMap ? 'Hide Map' : 'Show Map'}</button>
            <a href="/submit" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '9px 10px', borderRadius: 'var(--btn-radius)', background: 'var(--red)', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+ Add a Coach</a>
          </div>
          <div style={{ padding: 12 }}>
            <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
              <div>
                <span style={sectionLabel}>Search</span>
                <input placeholder="Name, city, facility, zip..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={onSearchKeyDown} style={inputStyle} />
              </div>
              <button type="button" onClick={applySearch} style={{ background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, minHeight: 40, fontWeight: 700 }}>Search</button>
            </div>
            {showMap && <div style={{ background: 'var(--white)', marginBottom: 14 }}><div style={{ height: 260, overflow: 'hidden', borderRadius: 12 }}><MapContainer center={[33.5, -84.2]} zoom={8} style={{ height: '100%', width: '100%' }}><TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitBounds points={markerGroups} selectedId={selected} />{sel && sel.lat != null && sel.lng != null && <FlyTo lat={sel.lat} lng={sel.lng} />}<MapMarkers groups={markerGroups} selected={selected} setSelected={setSelected} /></MapContainer></div><MapLegend /></div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
              {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: 14 }}>Loading coaches…</div>}
              {!loading && displayedCoaches.length === 0 && <EmptyState facilityContextName={facilityContext?.name} />}
              {!loading && displayedCoaches.map((coach) => <div key={coach.id} ref={setCardRef(coach.id)}><CoachCard coach={coach} selected={selected === coach.id} onClick={() => handleSelectCoach(coach.id)} onViewProfile={setProfileCoach} distanceMi={getDistance(coach)} /></div>)}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 14px 20px', background: 'var(--cream)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 18, alignItems: 'start', width: '100%' }}>
            <aside style={{ position: 'sticky', top: 76, alignSelf: 'start', background: 'var(--white)', borderRight: '1px solid rgba(15,23,42,0.06)', zIndex: 2 }}>
              <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--lgray)' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 2, lineHeight: 1.1 }}>{displayedCoaches.length} coach{displayedCoaches.length !== 1 ? 'es' : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.3 }}>Private instructors, team coaches, and trainers</div>
              </div>
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--lgray)', background: 'var(--white)' }}>
                {facilityContext && <div style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--lgray)', background: '#f8fafc', color: 'var(--navy)' }}><div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gray)' }}>Facility context</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{facilityContext.name}</div><div style={{ fontSize: 12, marginTop: 2, color: 'var(--gray)' }}>Showing only coaches linked to this facility</div><div style={{ marginTop: 8 }}><Link to={`/facilities/${facilityContext.id}`} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>← Back to Facility</Link></div></div>}
                <div><div style={sectionLabel}>Search</div><input placeholder="Name, city, facility, zip..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={onSearchKeyDown} style={{ ...inputStyle, minHeight: 40 }} /></div>
                <div><div style={sectionLabel}>Sport</div><div style={{ display: 'flex', gap: 8 }}><button type="button" className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')} onClick={() => setSport((s) => (s === 'baseball' ? 'Both' : 'baseball'))} style={{ flex: 1, minHeight: 38 }}>⚾ Baseball</button><button type="button" className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')} onClick={() => setSport((s) => (s === 'softball' ? 'Both' : 'softball'))} style={{ flex: 1, minHeight: 38 }}>🥎 Softball</button></div></div>
                <div><div style={sectionLabel}>Specialty</div><select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ ...inputStyle, minHeight: 40 }}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><div style={sectionLabel}>State</div><select value={state} onChange={(e) => setState(e.target.value)} style={{ ...inputStyle, minHeight: 40 }}>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><div style={sectionLabel}>Near zip code</div><input type="text" inputMode="numeric" placeholder="e.g. 30004" maxLength={5} value={zip} onChange={(e) => { const next = e.target.value.replace(/\D/g, '').slice(0, 5); setZip(next); if (next.length < 5) { setGeoCenter(null); setZipStatus('') } }} onBlur={handleZipBlur} style={{ ...inputStyle, minHeight: 40 }} />{zip.length === 5 && zipStatus === 'ok' && <div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray)', marginBottom: 4, marginTop:8 }}><span>Radius</span><span style={{ fontWeight: 600, color: 'var(--navy)' }}>{radius} mi</span></div><input type="range" min={5} max={100} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--red)' }} /><button type="button" onClick={clearZipFilter} style={{ marginTop: 8, width: '100%', background: 'white', color: 'var(--navy)', border: '2px solid var(--lgray)', borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 700 }}>Clear zip filter</button></div>}</div>
                <button type="button" onClick={applySearch} style={{ width: '100%', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>Search</button>
                <div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={() => setShowMap((m) => !m)} style={{ flex: 1, padding: '9px 10px', borderRadius: 'var(--btn-radius)', border: '1.5px solid var(--navy)', background: showMap ? 'var(--navy)' : 'var(--white)', color: showMap ? 'var(--white)' : 'var(--navy)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40 }}>{showMap ? 'Hide Map' : 'Show Map'}</button><a href="/submit" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', padding: '9px 10px', borderRadius: 'var(--btn-radius)', background: 'var(--red)', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+ Add a Coach</a></div>
              </div>
              <div style={{ padding: 12, borderTop: '1px solid var(--lgray)', background: 'var(--white)' }}><AdBox compact /></div>
            </aside>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 230px', gap: 22, alignItems: 'start' }}>
                <main style={{ minWidth: 0 }}>
                  <div style={{ position: 'sticky', top: 76, zIndex: 1, background: 'var(--page-bg, #f5f3ef)', paddingTop: 8, paddingBottom: 10 }}>
                    {showMap && <div style={{ background: 'var(--white)', width: '100%' }}><div style={{ height: 390, width: '100%', overflow: 'hidden', borderRadius: 14, border: '1px solid rgba(15,23,42,0.06)' }}><MapContainer center={[33.5, -84.2]} zoom={8} style={{ height: '100%', width: '100%' }}><TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><FitBounds points={markerGroups} selectedId={selected} />{sel && sel.lat != null && sel.lng != null && <FlyTo lat={sel.lat} lng={sel.lng} />}<MapMarkers groups={markerGroups} selected={selected} setSelected={setSelected} /></MapContainer></div><MapLegend /></div>}
                    {!showMap && <div style={{ background: 'var(--white)', border: '1px solid rgba(15,23,42,0.06)', borderRadius: 14, marginTop: 10, padding: '16px', color: 'var(--gray)', fontSize: 13, width: '100%' }}>Map is hidden. Use “Show Map” in the left panel to view coach locations.</div>}
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{displayedCoaches.length} Coach{displayedCoaches.length !== 1 ? 'es' : ''}</div><div style={{ fontSize: 12, color: 'var(--gray)' }}>Browse instructors, trainers, and team coaches</div></div>
                  </div>
                  <div ref={desktopListRef} onWheel={handleListInteraction} style={{ marginTop: 6, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14, alignItems: 'stretch' }}>
                    {loading && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 0', color: 'var(--gray)', fontSize: 14 }}>Loading coaches...</div>}
                    {!loading && displayedCoaches.length === 0 && <div style={{ gridColumn: '1 / -1' }}><EmptyState facilityContextName={facilityContext?.name} /></div>}
                    {!loading && displayedCoaches.map((coach) => <div key={coach.id} ref={setCardRef(coach.id)}><CoachCard coach={coach} selected={selected === coach.id} onClick={() => handleSelectCoach(coach.id)} onViewProfile={setProfileCoach} distanceMi={getDistance(coach)} /></div>)}
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
