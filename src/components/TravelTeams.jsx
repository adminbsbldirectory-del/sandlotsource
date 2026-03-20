import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'
import TeamProfile from './TeamProfile.jsx'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const PIN_COLORS = {
  team: '#1d6fa4',
  open_roster: '#16a34a',
  tryout: '#f0a500',
}

const STATUS_STYLE = {
  open: { bg: 'var(--open-bg)', color: 'var(--open-text)', label: 'Open Tryouts' },
  closed: { bg: 'var(--closed-bg)', color: 'var(--closed-text)', label: 'Closed' },
  by_invite: { bg: 'var(--urgent-bg)', color: 'var(--urgent-text)', label: 'By Invite' },
  year_round: { bg: '#DBEAFE', color: '#2563EB', label: 'Year Round' },
}

const AGE_OPTIONS = ['All Ages', '7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U']

const US_STATES = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' },
  { abbr: 'AZ', name: 'Arizona' }, { abbr: 'AR', name: 'Arkansas' },
  { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' },
  { abbr: 'FL', name: 'Florida' }, { abbr: 'GA', name: 'Georgia' },
  { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' },
  { abbr: 'IA', name: 'Iowa' }, { abbr: 'KS', name: 'Kansas' },
  { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' },
  { abbr: 'MA', name: 'Massachusetts' }, { abbr: 'MI', name: 'Michigan' },
  { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' },
  { abbr: 'NE', name: 'Nebraska' }, { abbr: 'NV', name: 'Nevada' },
  { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' },
  { abbr: 'NC', name: 'North Carolina' }, { abbr: 'ND', name: 'North Dakota' },
  { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' },
  { abbr: 'RI', name: 'Rhode Island' }, { abbr: 'SC', name: 'South Carolina' },
  { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' },
  { abbr: 'VT', name: 'Vermont' }, { abbr: 'VA', name: 'Virginia' },
  { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' },
]

const STATE_CENTERS = {
  AL: [32.8, -86.8], AK: [64.2, -153.0], AZ: [34.3, -111.1], AR: [34.8, -92.2],
  CA: [36.7, -119.7], CO: [39.0, -105.5], CT: [41.6, -72.7], DE: [39.0, -75.5],
  FL: [27.8, -81.7], GA: [32.6, -83.4], HI: [20.3, -156.4], ID: [44.4, -114.6],
  IL: [40.0, -89.2], IN: [39.8, -86.1], IA: [42.0, -93.5], KS: [38.5, -98.4],
  KY: [37.5, -85.3], LA: [31.1, -91.9], ME: [44.7, -69.4], MD: [39.0, -76.8],
  MA: [42.3, -71.8], MI: [44.3, -85.4], MN: [46.4, -93.1], MS: [32.7, -89.7],
  MO: [38.4, -92.5], MT: [47.0, -110.0], NE: [41.5, -99.9], NV: [39.3, -116.6],
  NH: [43.7, -71.6], NJ: [40.1, -74.5], NM: [34.5, -105.9], NY: [42.9, -75.5],
  NC: [35.5, -79.0], ND: [47.5, -100.5], OH: [40.4, -82.8], OK: [35.6, -97.5],
  OR: [43.9, -120.6], PA: [40.6, -77.2], RI: [41.7, -71.5], SC: [33.8, -81.1],
  SD: [44.4, -100.2], TN: [35.8, -86.4], TX: [31.0, -100.0], UT: [39.3, -111.1],
  VT: [44.1, -72.7], VA: [37.8, -78.2], WA: [47.4, -120.4], WV: [38.6, -80.6],
  WI: [44.3, -89.8], WY: [43.0, -107.6],
}

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:' +
      color +
      ';border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

function teamPinColor(team) {
  if (team.tryout_status === 'open') return PIN_COLORS.tryout
  if (team.roster_status === 'open' || Number(team.open_spots || 0) > 0) return PIN_COLORS.open_roster
  return PIN_COLORS.team
}

async function geocodeZip(zip) {
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    }
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
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeTeamRecord(team, facilityMap = {}) {
  const facility = team.facility_id ? facilityMap[team.facility_id] || null : null
  const facilityLat = facility?.lat != null ? Number(facility.lat) : null
  const facilityLng = facility?.lng != null ? Number(facility.lng) : null
  const teamLat = team.lat != null ? Number(team.lat) : null
  const teamLng = team.lng != null ? Number(team.lng) : null

  return {
    ...team,
    facility,
    facility_name: facility?.name || team.facility_name || '',
    facility_city: facility?.city || '',
    facility_state: facility?.state || '',
    lat: teamLat != null && teamLng != null ? teamLat : facilityLat,
    lng: teamLat != null && teamLng != null ? teamLng : facilityLng,
    display_city: team.city || facility?.city || '',
    display_state: team.state || facility?.state || '',
    practice_city: team.city || '',
    practice_state: team.state || '',
  }
}

function FitBounds({ teams, enabled }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled) return
    const pts = teams.filter((t) => t.lat != null && t.lng != null)
    if (!pts.length) return
    const bounds = L.latLngBounds(pts.map((t) => [t.lat, t.lng]))
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 10 })
  }, [teams, enabled, map])

  return null
}

function UpdateMapView({ center, zoom, enabled }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled || !center) return
    map.setView(center, zoom, { animate: false })
  }, [center, zoom, enabled, map])

  return null
}

function FlyToTeam({ team }) {
  const map = useMap()

  useEffect(() => {
    if (!team || team.lat == null || team.lng == null) return
    map.flyTo([team.lat, team.lng], Math.max(map.getZoom(), 9), { duration: 0.5 })
  }, [team, map])

  return null
}

function MapLegend({ hasPins }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        padding: '6px 10px',
        background: 'var(--white)',
        borderTop: '1px solid var(--lgray)',
        alignItems: 'center',
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
        { color: PIN_COLORS.team, label: 'Team' },
        { color: PIN_COLORS.open_roster, label: 'Open Roster' },
        { color: PIN_COLORS.tryout, label: 'Tryouts Open' },
      ].map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              background: item.color,
              border: '2px solid rgba(255,255,255,0.85)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>{item.label}</span>
        </div>
      ))}

      {!hasPins && (
        <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
          Map pins appear as teams add location data
        </span>
      )}
    </div>
  )
}

function AdBox({ compact = false }) {
  return (
    <div
      style={{
        background: '#F7F3ED',
        border: '1px dashed #D8D0C5',
        borderRadius: 14,
        padding: compact ? '16px 14px' : '24px 16px',
        textAlign: 'center',
        minHeight: compact ? 90 : 150,
      }}
    >
      <div
        style={{
          fontSize: compact ? 13 : 16,
          fontWeight: 700,
          color: '#7A6B57',
          fontFamily: 'var(--font-head)',
          marginBottom: 8,
        }}
      >
        ADVERTISE HERE
      </div>
      <div style={{ fontSize: compact ? 12 : 14, lineHeight: 1.5, color: '#9A8A75', marginBottom: 10 }}>
        Reach baseball &amp; softball families
      </div>
      <a
        href="/contact"
        style={{
          color: 'var(--red)',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: compact ? 12 : 14,
        }}
      >
        Contact Us
      </a>
    </div>
  )
}

function TeamCard({ team, selected, onOpen, onFocusMap }) {
  const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.closed
  const cityState = [team.display_city, team.display_state].filter(Boolean).join(', ')
  const locationFull = team.zip_code ? `${cityState} ${team.zip_code}` : cityState
  const practiceLabel = team.address?.trim() ? team.address.trim() : locationFull

  return (
    <div
      className="card"
      onClick={onOpen}
      style={{
        cursor: 'pointer',
        border: selected ? '2px solid var(--red)' : '1px solid rgba(15,23,42,0.08)',
        boxShadow: selected ? '0 8px 24px rgba(0,0,0,0.10)' : '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="card-body" style={{ padding: '12px 12px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              {team.name}
            </div>

            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
              {practiceLabel ? `📍 Practice: ${practiceLabel}` : '📍 Practice location not listed'}
            </div>

            {team.facility_name && (
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
                {`🏟️ Primary: ${team.facility_name}`}
              </div>
            )}

            {team.classification && (
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
                {`🏅 ${team.classification}`}
              </div>
            )}
          </div>

          <span
            className="badge"
            style={{
              background: statusInfo.bg,
              color: statusInfo.color,
              flexShrink: 0,
            }}
          >
            {statusInfo.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          {team.age_group && (
            <span
              style={{
                background: 'var(--navy)',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 20,
                fontFamily: 'var(--font-head)',
              }}
            >
              {team.age_group}
            </span>
          )}

          <span className={'badge badge-sport-' + (team.sport || 'baseball')}>
            {team.sport}
          </span>

          {team.org_affiliation && (
            <span
              style={{
                background: 'var(--lgray)',
                color: 'var(--gray)',
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 20,
              }}
            >
              {team.org_affiliation}
            </span>
          )}

          {team.classification && (
            <span
              style={{
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 20,
                fontWeight: 700,
              }}
            >
              {team.classification}
            </span>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            style={{
              flex: 1,
              minWidth: 140,
              background: 'var(--navy)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--btn-radius)',
              padding: '9px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-head)',
              letterSpacing: '0.04em',
            }}
          >
            View Details &amp; Claim
          </button>

          {team.lat != null && team.lng != null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onFocusMap()
              }}
              style={{
                background: 'var(--white)',
                color: 'var(--navy)',
                border: '1.5px solid var(--lgray)',
                borderRadius: 'var(--btn-radius)',
                padding: '9px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
              }}
            >
              View on Map
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ hasFilters, stateName, zipActive, radius }) {
  return (
    <div className="empty-state" style={{ margin: 0 }}>
      <h3>{hasFilters ? 'No teams match your filters' : `No teams listed yet${stateName ? ' in ' + stateName : ''}`}</h3>
      <p>
        {zipActive
          ? `No teams found within ${radius} miles. Try increasing the radius or removing the zip filter.`
          : hasFilters
            ? 'Try widening your search — remove a filter or select a different state.'
            : 'Know a travel team in this area? Help grow the directory.'}
      </p>
      {!hasFilters && <a href="/submit">Add a Team Listing</a>}
    </div>
  )
}

export default function TravelTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profileTeam, setProfileTeam] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [showMap, setShowMap] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )
  const [detectingLoc, setDetectingLoc] = useState(true)

  const [sport, setSport] = useState('Both')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [radius, setRadius] = useState(25)
  const [ageGroup, setAgeGroup] = useState('All Ages')
  const [tryoutFilter, setTryoutFilter] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [geoCenter, setGeoCenter] = useState(null)
  const [zipError, setZipError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase())
    }, 250)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    async function detectState() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (res.ok) {
          const data = await res.json()
          setState(data.region_code || '')
        }
      } catch {
        // ignore
      } finally {
        setDetectingLoc(false)
      }
    }
    detectState()
  }, [])

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError('')

      const { data: teamRows, error: teamError } = await supabase
        .from('travel_teams')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['approved', 'seeded'])

      if (teamError) {
        console.error('TravelTeams load error:', teamError)
        setLoadError('Could not load teams.')
        setTeams([])
        setLoading(false)
        return
      }

      const facilityIds = [...new Set((teamRows || []).map((t) => t.facility_id).filter(Boolean))]
      let facilityMap = {}

      if (facilityIds.length > 0) {
        const { data: facilityRows, error: facilityError } = await supabase
          .from('facilities')
          .select('id, name, lat, lng, city, state')
          .in('id', facilityIds)

        if (facilityError) {
          console.error('TravelTeams facility lookup error:', facilityError)
        } else {
          facilityMap = Object.fromEntries((facilityRows || []).map((f) => [f.id, f]))
        }
      }

      const normalized = (teamRows || []).map((team) => normalizeTeamRecord(team, facilityMap))
      setTeams(normalized)
      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    if (!zip || zip.length !== 5) {
      setGeoCenter(null)
      setZipError('')
      return
    }

    let active = true

    geocodeZip(zip).then((geo) => {
      if (!active) return
      if (geo) {
        setGeoCenter(geo)
        setZipError('')
      } else {
        setGeoCenter(null)
        setZipError('Zip not found')
      }
    })

    return () => {
      active = false
    }
  }, [zip])

  const selectedState = useMemo(
    () => US_STATES.find((s) => s.abbr === state),
    [state]
  )

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      const teamState = String(t.display_state || t.state || '').toUpperCase()
      const teamSport = String(t.sport || '').toLowerCase()

      const haystack = [
        t.name,
        t.org_affiliation,
        t.classification,
        t.facility_name,
        t.display_city,
        t.display_state,
        t.city,
        t.state,
        t.zip_code,
        t.age_group,
        t.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      if (sport !== 'Both' && teamSport !== sport && teamSport !== 'both') return false
      if (state && teamState !== state.toUpperCase()) return false
      if (ageGroup !== 'All Ages' && t.age_group !== ageGroup) return false
      if (tryoutFilter !== 'All' && t.tryout_status !== tryoutFilter) return false
      if (searchTerm && !haystack.includes(searchTerm)) return false

      if (geoCenter && t.lat != null && t.lng != null) {
        if (distanceMiles(geoCenter.lat, geoCenter.lng, t.lat, t.lng) > radius) return false
      }

      return true
    })
  }, [teams, sport, state, ageGroup, tryoutFilter, searchTerm, geoCenter, radius])

  const mappable = filtered.filter((t) => t.lat != null && t.lng != null)
  const openTryoutCount = filtered.filter((t) => t.tryout_status === 'open').length

  const hasFilters =
    sport !== 'Both' ||
    !!state ||
    !!zip ||
    ageGroup !== 'All Ages' ||
    tryoutFilter !== 'All' ||
    !!searchTerm

  const mapCenter = geoCenter
    ? [geoCenter.lat, geoCenter.lng]
    : state && STATE_CENTERS[state]
      ? STATE_CENTERS[state]
      : [39.5, -98.35]

  const mapZoom = geoCenter ? 10 : state ? 7 : 4

  const filterSelectStyle = {
    width: '100%',
    padding: '9px 10px',
    borderRadius: 'var(--input-radius)',
    border: '1.5px solid var(--lgray)',
    background: 'var(--white)',
    fontSize: 13,
    color: 'var(--navy)',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    minHeight: 40,
  }

  const sectionLabelStyle = {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--gray)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
  }

  return (
    <div>
      {profileTeam && (
        <TeamProfile
          team={profileTeam}
          onClose={() => setProfileTeam(null)}
          onClaim={(team) => {
            window.location.href =
              'mailto:admin.bsbldirectory@gmail.com?subject=' +
              encodeURIComponent('Claim Request: ' + team.name)
          }}
        />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '300px minmax(0, 1fr)',
          gap: isMobile ? 0 : 18,
          alignItems: 'start',
          width: '100%',
        }}
      >
        <aside
          style={{
            position: isMobile ? 'static' : 'sticky',
            top: isMobile ? 'auto' : 76,
            alignSelf: 'start',
            background: 'var(--white)',
            borderRight: isMobile ? 'none' : '1px solid rgba(15,23,42,0.06)',
            zIndex: 2,
          }}
        >
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--lgray)' }}>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--navy)',
                marginBottom: 2,
                lineHeight: 1.1,
              }}
            >
              {filtered.length} team{filtered.length !== 1 ? 's' : ''}
              {selectedState ? ` in ${selectedState.name}` : ''}
            </div>

            <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.3 }}>
              Travel teams, tryouts, and open roster opportunities
            </div>
          </div>

          <div
            style={{
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              borderBottom: '1px solid var(--lgray)',
              background: 'var(--white)',
            }}
          >
            <div>
              <div style={sectionLabelStyle}>Search</div>
              <input
                type="text"
                placeholder="Team, org, class, facility, city..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 'var(--input-radius)',
                  border: '1.5px solid var(--lgray)',
                  fontSize: 13,
                  color: 'var(--navy)',
                  outline: 'none',
                  background: 'var(--white)',
                  minHeight: 40,
                }}
              />
            </div>

            <div>
              <div style={sectionLabelStyle}>Sport</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')}
                  onClick={() => setSport((s) => (s === 'baseball' ? 'Both' : 'baseball'))}
                  style={{ flex: 1, minHeight: 38 }}
                >
                  ⚾ Baseball
                </button>
                <button
                  type="button"
                  className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')}
                  onClick={() => setSport((s) => (s === 'softball' ? 'Both' : 'softball'))}
                  style={{ flex: 1, minHeight: 38 }}
                >
                  🥎 Softball
                </button>
              </div>
            </div>

            <div>
              <div style={sectionLabelStyle}>State</div>
              <select
                value={state}
                onChange={(e) => {
                  setState(e.target.value)
                  setSelectedTeam(null)
                }}
                style={filterSelectStyle}
              >
                <option value="">All States</option>
                {US_STATES.map((s) => (
                  <option key={s.abbr} value={s.abbr}>
                    {s.name}
                  </option>
                ))}
              </select>
              {detectingLoc && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
                  Detecting your state...
                </div>
              )}
            </div>

            <div>
              <div style={sectionLabelStyle}>Nearby</div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Zip code"
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value.replace(/\D/g, '').slice(0, 5))
                  setSelectedTeam(null)
                }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 'var(--input-radius)',
                  border: '1.5px solid var(--lgray)',
                  fontSize: 13,
                  color: 'var(--navy)',
                  outline: 'none',
                  background: 'var(--white)',
                  minHeight: 40,
                }}
              />

              {zip.length === 5 && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--gray)',
                      marginBottom: 4,
                    }}
                  >
                    <span>Distance</span>
                    <strong style={{ color: 'var(--navy)' }}>{radius} miles</strong>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={radius}
                    onChange={(e) => {
                      setRadius(Number(e.target.value))
                      setSelectedTeam(null)
                    }}
                    style={{ width: '100%', accentColor: 'var(--red)' }}
                  />
                </div>
              )}

              {zipError && (
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--red)' }}>
                  {zipError}
                </div>
              )}
            </div>

            <div>
              <div style={sectionLabelStyle}>Age</div>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                style={filterSelectStyle}
              >
                {AGE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={sectionLabelStyle}>Tryout Status</div>
              <select
                value={tryoutFilter}
                onChange={(e) => setTryoutFilter(e.target.value)}
                style={filterSelectStyle}
              >
                <option value="All">All Tryout Status</option>
                <option value="open">Open Tryouts</option>
                <option value="year_round">Year Round</option>
                <option value="by_invite">By Invite</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
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
                  background: 'var(--red)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'var(--font-head)',
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                + Add a Team
              </a>
            </div>
          </div>

          {!isMobile && (
            <div style={{ padding: 12, borderTop: '1px solid var(--lgray)', background: 'var(--white)' }}>
              <AdBox compact />
            </div>
          )}
        </aside>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: !isMobile ? 'minmax(0, 1fr) 230px' : '1fr',
              gap: isMobile ? 0 : 22,
              alignItems: 'start',
            }}
          >
            <main style={{ minWidth: 0 }}>
              <div
                style={{
                  position: isMobile ? 'static' : 'sticky',
                  top: isMobile ? 'auto' : 76,
                  zIndex: 1,
                  background: 'var(--page-bg, #f5f3ef)',
                  paddingTop: isMobile ? 0 : 8,
                  paddingBottom: 10,
                }}
              >
                {loadError && (
                  <div
                    style={{
                      background: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      borderRadius: 12,
                      marginBottom: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: '#991B1B',
                      fontWeight: 600,
                    }}
                  >
                    {loadError}
                  </div>
                )}

                {showMap && (
                  <div
                    style={{
                      background: 'var(--white)',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        height: isMobile ? 260 : 390,
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: isMobile ? 0 : 14,
                        border: isMobile ? 'none' : '1px solid rgba(15,23,42,0.06)',
                      }}
                    >
                      <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <UpdateMapView
                          center={mapCenter}
                          zoom={mapZoom}
                          enabled={!selectedTeam && mappable.length === 0}
                        />
                        <FitBounds teams={mappable} enabled={!selectedTeam && mappable.length > 0} />
                        <FlyToTeam team={selectedTeam} />

                        {mappable.map((team) => (
                          <Marker
                            key={team.id}
                            position={[team.lat, team.lng]}
                            icon={makeIcon(teamPinColor(team))}
                            eventHandlers={{
                              click: () => {
                                setSelectedTeam(team)
                              },
                            }}
                          >
                            <Popup>
                              <div style={{ fontFamily: 'var(--font-body)', minWidth: 170 }}>
                                <strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>
                                  {team.name}
                                </strong>
                                <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                                  {'📍 ' + [team.display_city, team.display_state].filter(Boolean).join(', ') + (team.zip_code ? ' ' + team.zip_code : '')}
                                </div>
                                {team.facility_name && (
                                  <div style={{ fontSize: 12, marginTop: 3 }}>
                                    {'🏟️ ' + team.facility_name}
                                  </div>
                                )}
                                {team.classification && (
                                  <div style={{ fontSize: 12, marginTop: 3 }}>
                                    {'🏅 ' + team.classification}
                                  </div>
                                )}
                                {team.age_group && (
                                  <div style={{ fontSize: 12, marginTop: 3 }}>
                                    {'🎯 ' + team.age_group + ' · ' + (team.sport || '')}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setProfileTeam(team)}
                                  style={{
                                    marginTop: 8,
                                    width: '100%',
                                    background: 'var(--navy)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  View Details
                                </button>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>

                    <MapLegend hasPins={mappable.length > 0} />
                  </div>
                )}

                {openTryoutCount > 0 && (
                  <div
                    style={{
                      background: 'var(--open-bg)',
                      border: '1px solid var(--open-text)',
                      borderRadius: 12,
                      marginTop: 10,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: 'var(--open-text)',
                      fontWeight: 600,
                      width: '100%',
                    }}
                  >
                    {`✅ ${openTryoutCount} team${openTryoutCount !== 1 ? 's' : ''} currently accepting tryouts${
                      selectedState ? ' in ' + selectedState.name : ''
                    }`}
                  </div>
                )}

                {!showMap && (
                  <div
                    style={{
                      background: 'var(--white)',
                      border: '1px solid rgba(15,23,42,0.06)',
                      borderRadius: 14,
                      marginTop: 10,
                      padding: '16px',
                      color: 'var(--gray)',
                      fontSize: 13,
                      width: '100%',
                    }}
                  >
                    Map is hidden. Use “Show Map” in the left panel to view team locations.
                  </div>
                )}

                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-head)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--navy)',
                    }}
                  >
                    {filtered.length} Team{filtered.length !== 1 ? 's' : ''}
                    {selectedState ? ` in ${selectedState.name}` : ''}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                    Browse teams, tryouts, and roster opportunities
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 6,
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(270px, 1fr))',
                  gap: 14,
                  alignItems: 'stretch',
                }}
              >
                {loading && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 0', color: 'var(--gray)', fontSize: 14 }}>
                    Loading teams...
                  </div>
                )}

                {!loading && filtered.length === 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <EmptyState
                      hasFilters={hasFilters}
                      stateName={selectedState?.name || ''}
                      zipActive={!!geoCenter}
                      radius={radius}
                    />
                  </div>
                )}

                {!loading &&
                  filtered.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      selected={selectedTeam?.id === team.id}
                      onOpen={() => setProfileTeam(team)}
                      onFocusMap={() => {
                        setSelectedTeam(team)
                        setShowMap(true)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    />
                  ))}
              </div>
            </main>

            {!isMobile && (
              <aside
                style={{
                  position: 'sticky',
                  top: 76,
                  alignSelf: 'start',
                  padding: '8px 0 0 0',
                  width: '230px',
                  justifySelf: 'end',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <AdBox />
                  <AdBox />
                  <AdBox />
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
