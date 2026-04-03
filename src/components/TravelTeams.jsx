import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ensureLeafletDefaultMarkerIcons } from '../lib/leafletInit'
import { geocodeZip, distanceMiles } from '../lib/submit/geocode.js'
import { supabase } from '../supabase.js'
import TeamProfile from './TeamProfile.jsx'
import AdSlot from './AdSlot.jsx'
import { US_STATES } from '../constants/usStates'
import { TEAM_AGE_GROUPS } from '../constants/teamAgeGroups'
import { normalizeSportValue } from '../utils/sportUtils.js'
import TeamCard from './teams/TeamCard.jsx'
import TeamPreviewCard from './teams/TeamPreviewCard.jsx'
import TeamDesktopRow from './teams/TeamDesktopRow.jsx'

ensureLeafletDefaultMarkerIcons()

const HEADER_H = 75

const PIN_COLORS = {
  baseball: '#2563EB',
  softball: '#FACC15',
  both: 'conic-gradient(#2563EB 0deg 180deg, #FACC15 180deg 360deg)',
}

const STATUS_STYLE = {
  open: { bg: '#DCFCE7', color: '#15803D', label: 'Open Tryouts' },
  closed: { bg: '#FEE2E2', color: '#B91C1C', label: 'Closed' },
  by_invite: { bg: '#FEF3C7', color: '#B45309', label: 'By Invite' },
  year_round: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Year Round' },
  unknown: { bg: '#F3F4F6', color: '#4B5563', label: 'Status Unknown' },
}

const AGE_OPTIONS = ['All Ages', ...TEAM_AGE_GROUPS]

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

const STATE_NAME_TO_ABBR = Object.fromEntries(
  US_STATES.flatMap((s) => [
    [s.abbr, s.abbr],
    [s.name.toUpperCase(), s.abbr],
  ])
)

function normalizeStateValue(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  return STATE_NAME_TO_ABBR[upper] || upper
}

function makeIcon(background) {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:' +
      background +
      ';border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

function teamPinColor(team) {
  const sport = normalizeSportValue(team.sport)
  if (sport === 'softball') return PIN_COLORS.softball
  if (sport === 'both') return PIN_COLORS.both
  return PIN_COLORS.baseball
}

function getSportChipStyle(sport) {
  const normalized = normalizeSportValue(sport)
  if (normalized === 'softball') {
    return { background: '#F3F0D7', color: '#5F5A17', border: '1px solid #DDD59A' }
  }
  if (normalized === 'both') {
    return { background: '#E7EEF9', color: '#1D3E73', border: '1px solid #C8D5E8' }
  }
  return { background: '#E8EEF8', color: '#173B73', border: '1px solid #C7D3E8' }
}

function getStatusChipStyle(status) {
  const info = STATUS_STYLE[status] || STATUS_STYLE.unknown
  return { background: info.bg, color: info.color, label: info.label }
}

function getTeamZip(team) {
  return team.zip_code || team.zip || ''
}

function formatTryoutDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTeamLocation(team) {
  const locationParts = [team.display_city, team.display_state].filter(Boolean)
  const line = locationParts.join(', ')
  return [line, getTeamZip(team)].filter(Boolean).join(' ')
}

function formatPracticeLocation(team) {
  const cityState = [team.display_city, team.display_state].filter(Boolean).join(', ')
  const full = [team.address, cityState, getTeamZip(team)].filter(Boolean).join(', ')
  return full || [team.practice_location_name, cityState].filter(Boolean).join(' · ') || cityState || ''
}

function normalizeUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
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
    facility_address: facility?.address || '',
    facility_zip: facility?.zip_code || '',
    facility_website: facility?.website || '',
    state_abbr: normalizeStateValue(team.state || facility?.state || ''),
    facility_state_abbr: normalizeStateValue(facility?.state || ''),
    lat: teamLat != null && teamLng != null ? teamLat : facilityLat,
    lng: teamLat != null && teamLng != null ? teamLng : facilityLng,
    display_city: team.city || facility?.city || '',
    display_state: team.state || facility?.state || '',
    practice_city: team.city || '',
    practice_state: team.state || '',
  }
}

function FitBounds({ teams, enabled, maxZoom = 10 }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled) return
    const pts = teams.filter((t) => t.lat != null && t.lng != null)
    if (!pts.length) return
    const bounds = L.latLngBounds(pts.map((t) => [t.lat, t.lng]))
    map.fitBounds(bounds, { padding: [28, 28], maxZoom })
  }, [teams, enabled, maxZoom, map])

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
        { color: PIN_COLORS.baseball, label: 'Baseball Team' },
        { color: PIN_COLORS.softball, label: 'Softball Team' },
        { color: PIN_COLORS.both, label: 'Baseball & Softball' },
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

function DirectoryAdBand({ slotKey, maxWidth, reservedHeight, isMobile, marginTop = 24 }) {
  return (
    <div
      style={{
        background: '#F5F4F0',
        borderTop: '1px solid #E2E0DB',
        borderBottom: '1px solid #E2E0DB',
        padding: isMobile ? '16px 0' : '18px 0',
        marginTop,
      }}
    >
      <div style={{ padding: isMobile ? '0 12px' : '0 14px' }}>
        <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--gray)',
              margin: '0 0 8px 2px',
            }}
          >
            Sponsored
          </div>

          <div
            style={{
              minHeight: reservedHeight,
              background: '#fff',
              border: '1px solid #E2E0DB',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <AdSlot slotKey={slotKey} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RailAdSlot({ slotKey, reservedHeight = 250 }) {
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--gray)',
          margin: '0 0 8px 2px',
        }}
      >
        Sponsored
      </div>

      <div
        style={{
          minHeight: reservedHeight,
          background: '#fff',
          border: '1px solid #E2E0DB',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
        }}
      >
        <AdSlot slotKey={slotKey} />
      </div>
    </div>
  )
}


function EmptyState({ hasFilters, stateName, zipActive, radius }) {
  if (!zipActive) {
    return (
      <div className="empty-state" style={{ margin: 0 }}>
        <h3>Start with your ZIP code</h3>
        <p>Enter a ZIP code and choose a radius to see nearby teams first.</p>
      </div>
    )
  }

  return (
    <div className="empty-state" style={{ margin: 0 }}>
      <h3>{hasFilters ? 'No teams match your filters' : `No teams listed yet${stateName ? ' in ' + stateName : ''}`}</h3>
      <p>
        {zipActive
          ? `No teams found within ${radius} miles. Try increasing the radius or removing a filter.`
          : hasFilters
            ? 'Try widening your search — remove a filter or select a different state.'
            : 'Know a travel team in this area? Help grow the directory.'}
      </p>
      {!hasFilters && <a href="/submit">Add a Team Listing</a>}
    </div>
  )
}


export default function TravelTeams() {
  const rowRefs = useRef({})
  const [searchParams] = useSearchParams()
  const popupRefs = useRef({})
  const desktopListRef = useRef(null)
  const mobileListRef = useRef(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [profileTeam, setProfileTeam] = useState(null)
  const [selectedTeamId, setSelectedTeamId] = useState(() => searchParams.get('select') || null)

  const closeAllPopups = () => {
    Object.values(popupRefs.current).forEach((popup) => {
      try {
        popup?.remove && popup.remove()
      } catch {
        // ignore
      }
    })
  }

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [showMap, setShowMap] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )
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

  const applySearch = () => setSearchTerm(searchInput.trim().toLowerCase())

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applySearch()
    }
  }

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setShowMap(true)
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
        .select('id, name, sport, org_affiliation, classification, age_group, practice_location_name, city, state, zip_code, lat, lng, address, facility_id, facility_name, contact_name, contact_email, contact_phone, website, tryout_status, tryout_date, tryout_notes, description, submission_notes, approval_status, source, verified_status, active')
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
          .select('id, name, lat, lng, city, state, address, zip_code, website')
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
        setState(geo.state || '')
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

  const hasLocationSearch = !!geoCenter

  const filtered = useMemo(() => {
    if (!hasLocationSearch) {
      const selectedSeed = selectedTeamId ? teams.find((team) => team.id === selectedTeamId) : null
      return selectedSeed ? [selectedSeed] : []
    }

    return teams.filter((t) => {
      const teamState = normalizeStateValue(t.display_state || t.state || t.facility_state)
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
  }, [teams, sport, state, ageGroup, tryoutFilter, searchTerm, geoCenter, radius, hasLocationSearch, selectedTeamId])

  useEffect(() => {
    if (!selectedTeamId) return
    const rowEl = rowRefs.current[selectedTeamId]
    if (!rowEl) return
    const t = setTimeout(() => {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 120)
    return () => clearTimeout(t)
  }, [selectedTeamId, isMobile])

  const selectedTeam = useMemo(() => {
    return filtered.find((team) => team.id === selectedTeamId) || teams.find((team) => team.id === selectedTeamId) || null
  }, [filtered, teams, selectedTeamId])

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

  const mapZoom = geoCenter ? (isMobile ? 9 : 10) : state ? (isMobile ? 6 : 7) : 4

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

  const desktopRowTemplate = '110px minmax(0,1.15fr) minmax(0,1fr) 150px 150px 84px'
  const desktopHeaderCellStyle = {
    fontSize: 10,
    fontWeight: 800,
    color: 'var(--gray)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
  
  const previewStatusInfo = selectedTeam ? (STATUS_STYLE[selectedTeam.tryout_status] || STATUS_STYLE.unknown) : null
  const previewSportChip = selectedTeam ? getSportChipStyle(selectedTeam.sport) : null
  const previewLocationLine = selectedTeam ? formatTeamLocation(selectedTeam) : ''
  const previewPracticeLocation = selectedTeam ? formatPracticeLocation(selectedTeam) : ''
  const previewFacilityLocation = selectedTeam
    ? [selectedTeam.facility_address, [selectedTeam.facility_city, selectedTeam.facility_state].filter(Boolean).join(', '), selectedTeam.facility_zip].filter(Boolean).join(', ')
    : ''
  const previewFacilityWebsite = selectedTeam ? normalizeUrl(selectedTeam.facility_website) : null
  const previewTeamWebsite = selectedTeam ? normalizeUrl(selectedTeam.website) : null
  const previewTryoutDate = selectedTeam ? formatTryoutDate(selectedTeam.tryout_date) : null
  const previewPracticeMapQuery = encodeURIComponent(previewPracticeLocation || '')
  const previewSportLabel = selectedTeam
    ? (normalizeSportValue(selectedTeam.sport) === 'both' ? 'Baseball & Softball' : selectedTeam.sport)
    : ''

  return (
    <div style={!isMobile ? { background: 'var(--cream)' } : undefined}>
      {profileTeam && (
        <TeamProfile
          team={profileTeam}
          onClose={() => setProfileTeam(null)}
          onClaim={(team) => {
            const params = new URLSearchParams({
              listingId: team.id || '',
              listingType: 'team',
              listingName: team.name || '',
              city: team.display_city || team.city || '',
              requestKind: 'claim',
              requestedChange: 'Claim this listing',
            })

            window.location.href = '/claim?' + params.toString()
          }}
        />
      )}

      {!isMobile && (
        <DirectoryAdBand
          slotKey="teams_top_1_desktop"
          maxWidth={970}
          reservedHeight={90}
          isMobile={false}
          marginTop={16}
        />
      )}

      <div style={{ padding: isMobile ? 0 : '16px 14px 20px' }}>
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
              top: isMobile ? 'auto' : HEADER_H + 12,
              alignSelf: 'start',
              background: 'var(--white)',
              borderRight: isMobile ? 'none' : '1px solid rgba(15,23,42,0.06)',
              zIndex: 4,
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
                {hasLocationSearch ? `${filtered.length} team${filtered.length !== 1 ? 's' : ''}${selectedState ? ` in ${selectedState.name}` : ''}` : 'Start with ZIP + radius'}
              </div>

              <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.3 }}>
                Enter a ZIP code to load nearby teams first.
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
                <div style={sectionLabelStyle}>Near Zip Code</div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Zip code"
                  value={zip}
                  onChange={(e) => {
                    const nextZip = e.target.value.replace(/\D/g, '').slice(0, 5)
                    setZip(nextZip)
                    setSelectedTeamId(null)
                    if (nextZip.length < 5) {
                      setGeoCenter(null)
                      setZipError('')
                      setState('')
                    }
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
                        setSelectedTeamId(null)
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

                <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.4 }}>
                  {hasLocationSearch ? `Showing teams within ${radius} miles of ${zip}.` : 'Use ZIP + radius so nearby teams show first.'}
                </div>
              </div>

              <div>
                <div style={sectionLabelStyle}>State</div>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value)
                    setSelectedTeamId(null)
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
                <div style={sectionLabelStyle}>Search</div>
                <input
                  type="text"
                  placeholder="Team, org, class, facility, city..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={onSearchKeyDown}
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

              <button type="button" onClick={applySearch} style={{ width: '100%', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>
                Search
              </button>

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
                <RailAdSlot slotKey="teams_left_rail_1_desktop" reservedHeight={250} />
              </div>
            )}
          </aside>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: !isMobile ? 'minmax(0, 1fr) 300px' : '1fr',
                gap: isMobile ? 0 : 22,
                alignItems: 'start',
              }}
            >
              <main style={{ minWidth: 0 }}>
                <div
                  style={{
                    position: 'static',
                    zIndex: 0,
                    background: 'var(--page-bg, #f5f3ef)',
                    paddingTop: isMobile ? 0 : 8,
                    paddingBottom: isMobile ? 6 : 10,
                    overflowX: 'clip',
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
                          height: isMobile ? 260 : 360,
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
                          <FitBounds teams={mappable} enabled={mappable.length > 0} maxZoom={isMobile ? 9 : 10} />
                          <FlyToTeam team={selectedTeam} />

                          {mappable.map((team) => (
                            <Marker
                              key={team.id}
                              position={[team.lat, team.lng]}
                              icon={makeIcon(teamPinColor(team))}
                              eventHandlers={{
                                click: () => {
                                  setSelectedTeamId(team.id)
                                },
                              }}
                            >
                              <Popup
                                ref={(el) => {
                                  if (el) popupRefs.current[team.id] = el
                                  else delete popupRefs.current[team.id]
                                }}
                              >
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
                                    onClick={() => { closeAllPopups(); setSelectedTeamId(team.id) }}
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
                                    Preview Team
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
                      {`✅ ${openTryoutCount} team${openTryoutCount !== 1 ? 's' : ''} currently accepting tryouts${selectedState ? ' in ' + selectedState.name : ''}`}
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

                  {isMobile && (
                    <DirectoryAdBand
                      slotKey="teams_inline_1_mobile"
                      maxWidth={320}
                      reservedHeight={100}
                      isMobile={true}
                      marginTop={16}
                    />
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
                      {hasLocationSearch ? `${filtered.length} Team${filtered.length !== 1 ? 's' : ''}${selectedState ? ` in ${selectedState.name}` : ''}` : 'Browse nearby teams'}
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                      {hasLocationSearch ? 'Compact list below. Click a row or pin to preview, then use View Team for full details.' : 'Enter your ZIP code above to load teams near you first.'}
                    </div>
                  </div>
                </div>

                {isMobile ? (
  <div
    ref={mobileListRef}
    style={{
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 14,
      alignItems: 'stretch',
    }}
  >
    {loading && (
      <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray)', fontSize: 14 }}>
        Loading teams...
      </div>
    )}

    {!loading && filtered.length === 0 && (
      <EmptyState
        hasFilters={hasFilters}
        stateName={selectedState?.name || ''}
        zipActive={!!geoCenter}
        radius={radius}
      />
    )}

    {!loading &&
      filtered.map((team) => {
        const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.unknown
        const cityState = [team.display_city, team.display_state].filter(Boolean).join(', ')
        const locationFull = getTeamZip(team) ? `${cityState} ${getTeamZip(team)}` : cityState
        const practiceLabel = team.practice_location_name
          ? [team.practice_location_name, team.address?.trim() || ''].filter(Boolean).join(' · ')
          : team.address?.trim()
            ? team.address.trim()
            : locationFull
        const sportLabel =
          normalizeSportValue(team.sport) === 'both' ? 'Baseball & Softball' : (team.sport || 'Baseball')

        return (
          <div
            key={team.id}
            ref={(el) => {
              if (el) rowRefs.current[team.id] = el
              else delete rowRefs.current[team.id]
            }}
          >
            <TeamCard
              team={team}
              selected={selectedTeamId === team.id}
              mobile
              onOpen={() => setProfileTeam(team)}
              onFocusMap={() => {
                closeAllPopups()
                setSelectedTeamId(team.id)
                setShowMap(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              statusInfo={statusInfo}
              locationFull={locationFull}
              practiceLabel={practiceLabel}
              sportLabel={sportLabel}
            />
          </div>
        )
      })}
  </div>
) : (
  <div
    style={{
      marginTop: 8,
      background: 'var(--white)',
      border: '1px solid rgba(15,23,42,0.06)',
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <div ref={desktopListRef} style={{ maxHeight: 'min(560px, calc(100vh - 215px))', overflowY: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: desktopRowTemplate,
          gap: 10,
          alignItems: 'center',
          padding: '11px 14px',
          background: '#EEF3FA',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 4,
        }}
      >
        <div style={desktopHeaderCellStyle}>Sport</div>
        <div style={desktopHeaderCellStyle}>Team</div>
        <div style={desktopHeaderCellStyle}>Facility</div>
        <div style={desktopHeaderCellStyle}>Age / Level</div>
        <div style={desktopHeaderCellStyle}>Tryouts</div>
        <div style={{ ...desktopHeaderCellStyle, textAlign: 'right' }}>View</div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '26px 0', color: 'var(--gray)', fontSize: 14 }}>
          Loading teams...
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ padding: '16px 14px' }}>
          <EmptyState
            hasFilters={hasFilters}
            stateName={selectedState?.name || ''}
            zipActive={!!geoCenter}
            radius={radius}
          />
        </div>
      )}

            {!loading &&
        filtered.map((team) => {
          const isSelected = selectedTeamId === team.id
          const statusMeta = getStatusChipStyle(team.tryout_status)
          const sportChip = getSportChipStyle(team.sport)
          const practiceLine = formatPracticeLocation(team)
          const teamLine = formatTeamLocation(team)
          const tryoutDate = formatTryoutDate(team.tryout_date)
          const sportLabel =
            normalizeSportValue(team.sport) === 'both' ? 'Both' : team.sport

          return (
            <TeamDesktopRow
              key={team.id}
              team={{ ...team, sportLabel }}
              isSelected={isSelected}
              statusMeta={statusMeta}
              sportChip={sportChip}
              practiceLine={practiceLine}
              teamLine={teamLine}
              tryoutDate={tryoutDate}
              setRowRef={(el) => {
                if (el) rowRefs.current[team.id] = el
                else delete rowRefs.current[team.id]
              }}
              onSelect={() => setSelectedTeamId(team.id)}
              onToggle={() => setSelectedTeamId(isSelected ? null : team.id)}
            />
          )
        })}
    </div>

    {selectedTeam && (
  <TeamPreviewCard
    team={selectedTeam}
    onClose={() => setSelectedTeamId(null)}
    onOpenFull={() => {
      const current = selectedTeam
      setSelectedTeamId(null)
      setTimeout(() => setProfileTeam(current), 0)
    }}
    statusInfo={previewStatusInfo}
    sportChip={previewSportChip}
    locationLine={previewLocationLine}
    practiceLocation={previewPracticeLocation}
    facilityLocation={previewFacilityLocation}
    facilityWebsite={previewFacilityWebsite}
    teamWebsite={previewTeamWebsite}
    tryoutDate={previewTryoutDate}
    practiceMapQuery={previewPracticeMapQuery}
    sportLabel={previewSportLabel}
  />
)}
  </div>
)}

{isMobile && (
  <DirectoryAdBand
    slotKey="teams_footer_1_mobile"
    maxWidth={320}
    reservedHeight={100}
    isMobile={true}
    marginTop={20}
  />
)}
              </main>

              {!isMobile && (
                <aside
                  style={{
                    position: 'sticky',
                    top: HEADER_H + 12,
                    alignSelf: 'start',
                    padding: '8px 0 0 0',
                    width: '300px',
                    justifySelf: 'end',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <RailAdSlot slotKey="teams_right_rail_1_desktop" reservedHeight={250} />
                    <RailAdSlot slotKey="teams_right_rail_2_desktop" reservedHeight={250} />
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}