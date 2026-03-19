import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
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

const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })

const makeSelectedIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;border-radius:50% 50% 50% 0;background:${color};border:4px solid #f0a500;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -40],
  })

const PIN_COLORS = {
  coach: '#e63329',
  facility: '#1a1a1a',
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

function coachPinColor(coach) {
  return coach.listing_type === 'facility' ? PIN_COLORS.facility : PIN_COLORS.coach
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

function FitBounds({ coaches, selectedId }) {
  const map = useMap()

  useEffect(() => {
    if (selectedId) return

    const pts = coaches.filter((c) => c.lat != null && c.lng != null)
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
  }, [coaches, selectedId, map])

  return null
}

function MapMarkers({ mappable, selected, setSelected }) {
  return mappable.map((coach) => {
    const isSelected = coach.id === selected
    const zip = getCoachZip(coach)
    const specs = parseSpecialties(coach.specialty)

    return (
      <Marker
        key={coach.id}
        position={[coach.lat, coach.lng]}
        icon={isSelected ? makeSelectedIcon(coachPinColor(coach)) : makeIcon(coachPinColor(coach))}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{ click: () => setSelected(coach.id) }}
      >
        <Popup>
          <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
            <strong style={{ fontFamily: 'var(--font-head)', fontSize: 15 }}>{coach.name}</strong>
            {coach.facility_name && <div style={{ fontSize: 12, color: '#666' }}>{coach.facility_name}</div>}
            <div style={{ fontSize: 12, marginTop: 4 }}>
              📍 {[coach.city, coach.state].filter(Boolean).join(', ')}
              {zip ? ` ${zip}` : ''}
            </div>
            {specs.length > 0 && <div style={{ fontSize: 12, marginTop: 2 }}>🎯 {specs.join(', ')}</div>}
            {coach.price_per_session && (
              <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>
                ${coach.price_per_session}/session
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    )
  })
}

function RatingRow({ coach, selected }) {
  const avg = parseFloat(coach.rating_average) || 0
  const count = parseInt(coach.review_count, 10) || 0
  const icon = coach.sport === 'softball' ? '🥎' : '⚾'

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

function CoachCard({ coach, selected, onClick, onViewProfile }) {
  const specs = parseSpecialties(coach.specialty)
  const firstPhone = parseFirstPhone(coach.phone)
  const zip = getCoachZip(coach)

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
            className={`badge badge-sport-${coach.sport}`}
            style={selected ? { background: 'rgba(255,255,255,0.15)', color: 'white' } : undefined}
          >
            {coach.sport === 'both' ? 'Baseball & Softball' : coach.sport}
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
        { color: PIN_COLORS.coach, label: 'Coach / Trainer' },
        { color: PIN_COLORS.facility, label: 'Facility' },
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
  const [showMap, setShowMap] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  const selectedFromUrl = searchParams.get('select') || null
  const facilityFromUrl = searchParams.get('facility') || null

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

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

      if (sport !== 'Both' && c.sport !== sport && c.sport !== 'both') return false
      if (specialty !== 'All Specialties' && !specs.includes(specialty)) return false
      if (state !== 'All States' && (c.state || '').toUpperCase() !== state) return false

      if (search) {
        const q = search.toLowerCase()
        if (
          !(c.name || '').toLowerCase().includes(q) &&
          !(c.city || '').toLowerCase().includes(q) &&
          !(c.facility_name || '').toLowerCase().includes(q) &&
          !String(c.zip || '').includes(q)
        ) {
          return false
        }
      }

      return true
    })
  }, [resolvedCoaches, sport, specialty, state, search])

  const filtered = useMemo(() => {
    if (!facilityFromUrl) return baseFiltered
    const normalizedFacilityId = String(facilityFromUrl).trim()
    return baseFiltered.filter((c) => c.facility_id === normalizedFacilityId)
  }, [baseFiltered, facilityFromUrl])

  const mappable = useMemo(() => filtered.filter((c) => c.lat != null && c.lng != null), [filtered])

  const sel = useMemo(() => {
    if (!selected) return null
    return filtered.find((c) => c.id === selected) || resolvedCoaches.find((c) => c.id === selected) || null
  }, [selected, filtered, resolvedCoaches])

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

  return (
    <>
      {profileCoach && <CoachProfile coach={profileCoach} onClose={() => setProfileCoach(null)} />}

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
            <button
              type="button"
              onClick={() => setShowMap((m) => !m)}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: 'var(--btn-radius)',
                border: '1.5px solid var(--navy)',
                background: showMap ? 'var(--navy)' : 'var(--white)',
                color: showMap ? 'var(--white)' : 'var(--navy)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
                minHeight: 40,
              }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>

            <a
              href="/submit"
              style={{
                flex: 1,
                textAlign: 'center',
                textDecoration: 'none',
                padding: '9px 10px',
                borderRadius: 'var(--btn-radius)',
                border: '1.5px solid var(--gold)',
                background: 'var(--gold)',
                color: 'var(--navy)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-head)',
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              + Add a Coach
            </a>
          </div>

          <div style={{ padding: 12 }}>
            {facilityContext && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--lgray)',
                  background: '#f8fafc',
                  color: 'var(--navy)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gray)' }}>
                  Facility context
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{facilityContext.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: 'var(--gray)' }}>
                  Showing only coaches linked to this facility
                </div>
              </div>
            )}

            <div style={{ marginBottom: 10 }}>
              <span style={sectionLabel}>Search</span>
              <input
                placeholder="Name, city, facility, zip..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={inputStyle}
              />
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

            <div style={{ marginBottom: 10 }}>
              <span style={sectionLabel}>Specialty</span>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle}>
                {SPECIALTIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 10 }}>
              <span style={sectionLabel}>State</span>
              <select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>
                {US_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {!loading && filtered.length === 0 && <EmptyState facilityContextName={facilityContext?.name} />}
            {!loading && filtered.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                selected={selected === coach.id}
                onClick={() => setSelected(selected === coach.id ? null : coach.id)}
                onViewProfile={setProfileCoach}
              />
            ))}
          </div>

          {showMap && (
            <div style={{ height: '60vh' }}>
              <MapContainer center={[33.5, -84.2]} zoom={8} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds coaches={mappable} selectedId={selected} />
                {sel && sel.lat != null && sel.lng != null && <FlyTo lat={sel.lat} lng={sel.lng} />}
                <MapMarkers mappable={mappable} selected={selected} setSelected={setSelected} />
              </MapContainer>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            height: `calc(100vh - ${HEADER_H}px)`,
            background: 'var(--cream)',
          }}
        >
          <div
            style={{
              width: 330,
              borderRight: '2px solid var(--lgray)',
              background: 'var(--white)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '12px 12px 0' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>
                {filtered.length} coach{filtered.length !== 1 ? 'es' : ''}
              </div>

              {facilityContext && (
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--lgray)',
                    background: '#f8fafc',
                    color: 'var(--navy)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gray)' }}>
                    Facility context
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{facilityContext.name}</div>
                  <div style={{ fontSize: 12, marginTop: 2, color: 'var(--gray)' }}>
                    Showing only coaches linked to this facility
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <span style={sectionLabel}>Search</span>
                <input
                  placeholder="Name, city, facility, zip..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={inputStyle}
                />
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

              <div style={{ marginBottom: 10 }}>
                <span style={sectionLabel}>Specialty</span>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle}>
                  {SPECIALTIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 10 }}>
                <span style={sectionLabel}>State</span>
                <select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>
                  {US_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
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
                + Add a Coach
              </a>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: 'var(--cream)' }}>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: 14 }}>
                  Loading coaches…
                </div>
              )}
              {!loading && filtered.length === 0 && <EmptyState facilityContextName={facilityContext?.name} />}
              {filtered.map((coach) => (
                <CoachCard
                  key={coach.id}
                  coach={coach}
                  selected={selected === coach.id}
                  onClick={() => setSelected(selected === coach.id ? null : coach.id)}
                  onViewProfile={setProfileCoach}
                />
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <MapLegend />
            <div style={{ flex: 1, position: 'relative' }}>
              <MapContainer center={[33.5, -84.2]} zoom={8} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds coaches={mappable} selectedId={selected} />
                {sel && sel.lat != null && sel.lng != null && <FlyTo lat={sel.lat} lng={sel.lng} />}
                <MapMarkers mappable={mappable} selected={selected} setSelected={setSelected} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
