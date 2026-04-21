import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ensureLeafletDefaultMarkerIcons } from '../lib/leafletInit'
import { distanceMiles, geocodeZip } from '../lib/submit/geocode'
import { normalizeSportValue } from '../utils/sportUtils'
import { supabase } from '../supabase.js'
import { DIRECTORY_RADIUS_OPTIONS } from '../constants/directoryRadiusOptions'
import { FEATURED_BADGE_STYLE } from '../constants/featuredBadgeStyle'
import FacilityDesktopRow from './facilities/FacilityDesktopRow.jsx'
import MobileFacilityRow from './facilities/MobileFacilityRow.jsx'
import FacilityPreviewCard from './facilities/FacilityPreviewCard.jsx'
import FacilitiesEmptyState from './facilities/FacilitiesEmptyState.jsx'
import DirectoryAdBand from './ads/DirectoryAdBand.jsx'
import RailAdSlot from './ads/RailAdSlot.jsx'

ensureLeafletDefaultMarkerIcons()

const HEADER_H = 75

const FACILITY_TYPE_OPTIONS = [
  { value: 'all', label: 'All Location Types' },
  { value: 'park_field', label: 'Park / Rec Field' },
  { value: 'training_facility', label: 'Training Facility' },
  { value: 'sports_complex', label: 'Sports Complex' },
  { value: 'travel_team_facility', label: 'Team Facility' },
  { value: 'school_field', label: 'School Field' },
  { value: 'other', label: 'Other' },
]

// Maps URL slugs like "georgia" / "new-jersey" to their state abbreviation.
// Used by location landing pages (/facilities/:state/:city) to pre-seed the state filter.
const STATE_SLUG_TO_ABBR = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new-hampshire': 'NH', 'new-jersey': 'NJ', 'new-mexico': 'NM', 'new-york': 'NY',
  'north-carolina': 'NC', 'north-dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode-island': 'RI', 'south-carolina': 'SC',
  'south-dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west-virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
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
    training_facility: 'Training Facility',
    sports_complex: 'Sports Complex',
    travel_team_facility: 'Team Facility',
    school_field: 'School Field',
    other: 'Other',
  }
  return map[value] || value || ''
}

function getFacilityTypeColor(value) {
  if (value === 'park_field') return '#16A34A'
  if (value === 'training_facility') return '#D42B2B'
  if (value === 'sports_complex') return '#fd5b03'
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

const makeIcon = (facility, selected) => {
  const size = selected ? 38 : 30
  const innerSize = selected ? 30 : 24
  const isFeatured = !!facility.featured_status
  const isApproximate = !selected && ['zip', 'approximate', 'city'].includes(
    (facility.geocode_source || '').toLowerCase()
  )
  // Ring: gold when selected, gray when approximate (not selected), sport-based otherwise
  const ringBg = selected
    ? '#f0a500'
    : isApproximate
    ? '#9CA3AF'
    : getFacilityRingBackground(facility)
  // Gold star badge for featured, rendered outside the rotated shape so it appears upright
  const starBadge = isFeatured
    ? `<div style="position:absolute;top:-4px;right:-4px;width:13px;height:13px;background:#c9a84c;border:1.5px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#7c5800;font-weight:900;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.3);">&#9733;</div>`
    : ''

  return L.divIcon({
    className: '',
    html: `<div style="position:relative;display:inline-block;"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;border-radius:50% 50% 50% 0;background:${ringBg};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"><div style="width:${innerSize}px;height:${innerSize}px;border-radius:50% 50% 50% 0;background:${getFacilityTypeColor(facility.facility_type)};"></div></div>${starBadge}</div>`,
    iconSize: [size, size],
    iconAnchor: [selected ? 19 : 15, selected ? 38 : 30],
    popupAnchor: [0, -30],
  })
}

function getFacilityZip(facility) {
  return facility.zip_code || facility.zip || ''
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

function matchesSportFilter(facilitySport, selectedSport) {
  if (!selectedSport) return true
  if (selectedSport === 'both') return facilitySport === 'both'
  if (selectedSport === 'baseball') return facilitySport === 'baseball' || facilitySport === 'both'
  if (selectedSport === 'softball') return facilitySport === 'softball' || facilitySport === 'both'
  return true
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

function formatFacilityLocation(facility) {
  const cityState = [facility.city, facility.state].filter(Boolean).join(', ')
  const zip = getFacilityZip(facility)
  return [cityState, zip].filter(Boolean).join(' ')
}

export default function Facilities() {
  const rowRefs = useRef({})
  const desktopListRef = useRef(null)
  const mobileListRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()
  // Capture the ?select= param at mount so the seed effect is stable even
  // as setSearchParams rewrites the URL during normal browse interactions.
  const initialSelectParamRef = useRef(String(searchParams.get('select') || ''))
  // Seed geoCenter once per URL-driven selection with no ZIP.
  const hasAutoSeededGeoRef = useRef(false)

  const { state: stateParam, city: cityParam } = useParams()

  // Location landing page context — only set when routed via /facilities/:state/:city.
  const locationState = stateParam
    ? stateParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null
  const locationCity = cityParam
    ? cityParam.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null
  const locationStateAbbr = stateParam ? (STATE_SLUG_TO_ABBR[stateParam.toLowerCase()] || '') : ''

  const initialSport = (() => {
    const raw = String(searchParams.get('sport') || '').trim().toLowerCase()
    return ['baseball', 'softball', 'both'].includes(raw) ? raw : ''
  })()

  const initialFacilityType = (() => {
    const raw = String(searchParams.get('type') || '').trim()
    return FACILITY_TYPE_OPTIONS.some((option) => option.value === raw) ? raw : 'all'
  })()

  // Pre-seed keyword search from city URL param on location pages; fall back to ?q= param.
  const initialSearch = locationCity || String(searchParams.get('q') || '').trim()
  const initialZip = String(searchParams.get('zip') || '').replace(/\D/g, '').slice(0, 5)
  const initialRadiusValue = Number(searchParams.get('radius') || 25)
  const initialRadius = DIRECTORY_RADIUS_OPTIONS.some((option) => option.value === initialRadiusValue) ? initialRadiusValue : 25
  const initialMobileView = searchParams.get('view') === 'map' ? 'map' : 'list'

  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(() => searchParams.get('select') || null)
  const [mapFocus, setMapFocus] = useState(null)
  const [sport, setSport] = useState(initialSport)
  const [facilityType, setFacilityType] = useState(initialFacilityType)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [zip, setZip] = useState(initialZip)
  const [radius, setRadius] = useState(initialRadius)
  const [geoCenter, setGeoCenter] = useState(null)
  const [zipStatus, setZipStatus] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [showMap, setShowMap] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [mobileView, setMobileView] = useState(initialMobileView)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setShowMap(true)
      if (!mobile) setShowMobileFilters(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Set dynamic page title and meta description for location landing pages.
  useEffect(() => {
    if (locationCity && locationState) {
      document.title = `Baseball & Softball Facilities in ${locationCity}, ${locationState} — Sandlot Source`
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content',
        `Browse baseball and softball facilities, training centers, and complexes in ${locationCity}, ${locationState}. Find parks, indoor training facilities, and sports complexes on Sandlot Source.`)
    }
    return () => {
      if (locationCity && locationState) {
        document.title = 'Sandlot Source — Baseball & Softball Coaches, Teams & Rosters'
      }
    }
  }, [locationCity, locationState])

  const applySearch = () => {
    setSearch(searchInput.trim())
    setSelected(null)
  }

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      applySearch()
    }
  }

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
      }

      setLoading(false)
    }

    load()
  }, [])

  useEffect(() => {
    let active = true

    async function hydrateZipSearch() {
      if (initialZip.length !== 5) return
      setZipStatus('loading')
      const geo = await geocodeZip(initialZip)
      if (!active) return
      if (geo) {
        setGeoCenter(geo)
        setZipStatus('ok')
      } else {
        setGeoCenter(null)
        setZipStatus('error')
      }
    }

    hydrateZipSearch()
    return () => {
      active = false
    }
  }, [initialZip])

  useEffect(() => {
    if (!selected || facilities.length === 0) return
    const match = facilities.find((f) => f.id === String(selected))
    if (match?.lat != null && match?.lng != null) {
      setMapFocus({ id: String(selected), lat: match.lat, lng: match.lng, nonce: Date.now() })
    }
  }, [selected, facilities])

  // When the page is reached via ?select=<id> with no ?zip=, seed geoCenter
  // from the selected facility's coordinates so the map and list show results
  // instead of an empty "Start with ZIP" state. Fires once after data loads.
  useEffect(() => {
    const selectId = initialSelectParamRef.current
    if (!selectId) return
    if (initialZip.length === 5) return // ZIP already being geocoded
    if (hasAutoSeededGeoRef.current) return
    if (facilities.length === 0) return

    const match = facilities.find((f) => f.id === selectId)
    if (!match || match.lat == null || match.lng == null) return

    hasAutoSeededGeoRef.current = true
    setGeoCenter({ lat: match.lat, lng: match.lng })
    setZipStatus('ok')
  }, [facilities, initialZip])

  const browseParamsString = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (sport) params.set('sport', sport)
    if (facilityType !== 'all') params.set('type', facilityType)
    if (zip) params.set('zip', zip)
    if (zip || radius !== 25) params.set('radius', String(radius))
    if (selected) params.set('select', selected)
    if (mobileView === 'map') params.set('view', 'map')
    return params.toString()
  }, [search, sport, facilityType, zip, radius, selected, mobileView])

  useEffect(() => {
    const currentParamsString = searchParams.toString()
    if (browseParamsString === currentParamsString) return
    setSearchParams(
      browseParamsString ? new URLSearchParams(browseParamsString) : new URLSearchParams(),
      { replace: true }
    )
  }, [browseParamsString, searchParams, setSearchParams])

  function buildFacilityDetailHref(facilityId) {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (sport) params.set('sport', sport)
    if (facilityType !== 'all') params.set('type', facilityType)
    if (zip) params.set('zip', zip)
    if (zip || radius !== 25) params.set('radius', String(radius))
    if (facilityId) params.set('select', String(facilityId))
    if (mobileView === 'map') params.set('view', 'map')
    const suffix = params.toString()
    return `/facilities/${facilityId}${suffix ? `?${suffix}` : ''}`
  }

  function clearZipFilter() {
    setZip('')
    setGeoCenter(null)
    setZipStatus('')
    setRadius(25)
    setSelected(null)
  }

  async function applyZipSearch() {
    if (zip.length !== 5) {
      setGeoCenter(null)
      setZipStatus(zip ? 'error' : '')
      return false
    }
    const geo = await geocodeZip(zip)
    if (geo) {
      setGeoCenter(geo)
      setZipStatus('ok')
      setSelected(null)
      return true
    }
    setGeoCenter(null)
    setZipStatus('error')
    return false
  }

  async function applyMobileFilters() {
    applySearch()
    if (zip.length === 5) {
      await applyZipSearch()
    } else if (!zip) {
      setGeoCenter(null)
      setZipStatus('')
    } else {
      setGeoCenter(null)
      setZipStatus('error')
    }
    setShowMobileFilters(false)
  }

  function clearAllMobileFilters() {
    setSearchInput('')
    setSearch('')
    setSport('')
    setFacilityType('all')
    clearZipFilter()
    setSelected(null)
  }

  const mobileActiveFilterCount = [sport, facilityType !== 'all' ? facilityType : '', search || searchInput, zipStatus === 'ok' ? zip : '']
  .filter(Boolean)
  .length

  const hasLocationSearch = zipStatus === 'ok' && !!geoCenter
  const hasFilters = !!(sport || search || facilityType !== 'all')
  const filtered = useMemo(() => {
    // On location landing pages (/facilities/:state/:city) allow browsing without a ZIP.
    if (!hasLocationSearch && !locationStateAbbr) return []

    return facilities
      .filter((f) => {
        const facilitySport = getFacilitySport(f)
        if (!matchesSportFilter(facilitySport, sport)) return false
        if (facilityType !== 'all' && (f.facility_type || '') !== facilityType) return false

        // On location pages, filter by state abbreviation (Facilities has no state dropdown).
        if (locationStateAbbr && (f.state || '').toUpperCase() !== locationStateAbbr) return false

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

        if (geoCenter) {
          if (f.lat == null || f.lng == null) return false
          if (distanceMiles(geoCenter.lat, geoCenter.lng, f.lat, f.lng) > radius) return false
        }

        return true
      })
      .sort((a, b) => {
        const aFeatured = !!a.featured_status
        const bFeatured = !!b.featured_status
        if (aFeatured !== bFeatured) return aFeatured ? -1 : 1

        if (geoCenter && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
          const distA = distanceMiles(geoCenter.lat, geoCenter.lng, a.lat, a.lng)
          const distB = distanceMiles(geoCenter.lat, geoCenter.lng, b.lat, b.lng)
          if (distA !== distB) return distA - distB
        }

        return (a.name || '').localeCompare(b.name || '')
      })
  }, [facilities, sport, facilityType, search, geoCenter, radius, hasLocationSearch, locationStateAbbr])

  useEffect(() => {
    if (!selected) return
    const rowEl = rowRefs.current[selected]
    if (!rowEl) return
    const t = setTimeout(() => {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 120)
    return () => clearTimeout(t)
  }, [selected, isMobile])

  const mappable = useMemo(() => filtered.filter((f) => f.lat != null && f.lng != null), [filtered])

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

  return (
    <>
      {locationCity && locationState && (
        <div style={{ padding: isMobile ? '16px 12px 0' : '16px 20px 0', maxWidth: isMobile ? undefined : 1200, margin: isMobile ? undefined : '0 auto' }}>
          <h1 style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, color: '#0d1b2e', margin: 0, lineHeight: 1.2 }}>
            Baseball &amp; Softball Facilities in {locationCity}, {locationState}
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#6B7280', marginTop: 6, marginBottom: 0 }}>
            Browse baseball and softball facilities, training centers, and complexes in your area.
          </p>
        </div>
      )}

      {isMobile ? (
        <div style={{ maxWidth: '100%', width: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
          <div style={{ padding: 12, paddingBottom: 28 }}>
            <div
              style={{
                background: '#fff',
                border: '1px solid rgba(15,23,42,0.08)',
                borderRadius: 20,
                padding: 16,
                boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
                    Facility Directory
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12.5, color: 'var(--gray)' }}>
                    {hasLocationSearch
                      ? `${filtered.length} facilit${filtered.length !== 1 ? 'ies' : 'y'} near you`
                      : 'Choose type and ZIP to browse nearby'}
                  </div>
                </div>
                <a
                  href="/submit"
                  className="add-cta"
                  style={{
                    textDecoration: 'none',
                    borderRadius: 'var(--btn-radius)',
                    background: '#FFFBF0',
                    border: '2px solid #c9a84c',
                    color: '#0d1b2e',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '9px 12px',
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: 'var(--font-head)',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                  }}
                >
                  + Add a Facility
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 14 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={sectionLabel}>Location type</div>
                  <select
                    value={facilityType}
                    onChange={(e) => {
                      setFacilityType(e.target.value)
                      setSelected(null)
                    }}
                    style={{ ...inputStyle, minHeight: 44, fontSize: 14, minWidth: 0 }}
                  >
                    {FACILITY_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={sectionLabel}>ZIP code</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter zip code"
                    maxLength={5}
                    value={zip}
                    onChange={(e) => {
                      const next = e.target.value.replace(/\D/g, '').slice(0, 5)
                      setZip(next)
                      if (next.length < 5) {
                        setGeoCenter(null)
                        setZipStatus('')
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        await applyZipSearch()
                      }
                    }}
                    style={{ ...inputStyle, minHeight: 44, fontSize: 14, minWidth: 0 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'end' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={sectionLabel}>Radius</div>
                    <select
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      style={{ ...inputStyle, minHeight: 44, fontSize: 14, minWidth: 0 }}
                    >
                      {DIRECTORY_RADIUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={applyZipSearch}
                    style={{
                      minHeight: 44,
                      borderRadius: 12,
                      border: 'none',
                      background: 'var(--navy)',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: 'var(--font-head)',
                      padding: '0 14px',
                      whiteSpace: 'nowrap',
                      minWidth: 72,
                    }}
                  >
                    Go
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 6, fontSize: 12, color: zipStatus === 'error' ? 'var(--red)' : 'var(--gray)' }}>
                {zipStatus === 'error'
                  ? 'Enter a valid 5-digit ZIP code.'
                  : hasLocationSearch
                    ? `Showing facilities within ${radius} miles of ${zip}.`
                    : 'Start with your ZIP code so local facilities show first.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileView('list')
                    setSelected(null)
                  }}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border: mobileView === 'list' ? 'none' : '1.5px solid var(--navy)',
                    background: mobileView === 'list' ? 'var(--navy)' : '#fff',
                    color: mobileView === 'list' ? '#fff' : 'var(--navy)',
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: 'var(--font-head)',
                  }}
                >
                  List
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileView('map')
                    setSelected(null)
                  }}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border: mobileView === 'map' ? 'none' : '1.5px solid var(--navy)',
                    background: mobileView === 'map' ? 'var(--navy)' : '#fff',
                    color: mobileView === 'map' ? '#fff' : 'var(--navy)',
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: 'var(--font-head)',
                  }}
                >
                  Map
                </button>

                <button
                  type="button"
                  onClick={() => setShowMobileFilters((prev) => !prev)}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border: '1.5px solid var(--navy)',
                    background: showMobileFilters ? '#EEF2FF' : '#fff',
                    color: 'var(--navy)',
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: 'var(--font-head)',
                    padding: '0 12px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Filters{mobileActiveFilterCount ? ` (${mobileActiveFilterCount})` : ''}
                </button>
              </div>

              {showMobileFilters && (
                <div style={{ marginTop: 14, display: 'grid', gap: 12, borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 14 }}>
                  <div>
                    <div style={sectionLabel}>Search</div>
                    <input
                      placeholder="Name, city, address..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      style={{ ...inputStyle, minHeight: 44, fontSize: 14 }}
                    />
                  </div>

                  <div>
                    <div style={sectionLabel}>Location type</div>
                    <select
                      value={facilityType}
                      onChange={(e) => {
                        setFacilityType(e.target.value)
                        setSelected(null)
                      }}
                      style={{ ...inputStyle, minHeight: 44, fontSize: 14 }}
                    >
                      {FACILITY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={sectionLabel}>Sport</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')}
                        onClick={() => {
                          setSport((s) => (s === 'baseball' ? '' : 'baseball'))
                          setSelected(null)
                        }}
                        style={{ minHeight: 44, fontSize: 12 }}
                      >
                        ⚾ Baseball
                      </button>

                      <button
                        type="button"
                        className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')}
                        onClick={() => {
                          setSport((s) => (s === 'softball' ? '' : 'softball'))
                          setSelected(null)
                        }}
                        style={{ minHeight: 44, fontSize: 12 }}
                      >
                        🥎 Softball
                      </button>

                      <button
                        type="button"
                        className={'pill-toggle ' + (sport === 'both' ? 'active-both' : '')}
                        onClick={() => {
                          setSport((s) => (s === 'both' ? '' : 'both'))
                          setSelected(null)
                        }}
                        style={{
                          gridColumn: '1 / -1',
                          minHeight: 44,
                          fontSize: 12,
                          borderColor: sport === 'both' ? '#C9D4E5' : undefined,
                          background: sport === 'both'
                            ? 'linear-gradient(90deg, #E8EEF8 0%, #E8EEF8 48%, #F3F0D7 52%, #F3F0D7 100%)'
                            : undefined,
                          color: sport === 'both' ? '#173B73' : undefined,
                        }}
                      >
                        ⚾🥎 Baseball &amp; Softball
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={sectionLabel}>Near zip code</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 30004"
                      maxLength={5}
                      value={zip}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 5)
                        setZip(next)
                        if (next.length < 5) {
                          setGeoCenter(null)
                          setZipStatus('')
                        }
                      }}
                      style={{ ...inputStyle, minHeight: 44, fontSize: 14 }}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray)' }}>
                      Use zip + radius so local facilities show first.
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <div style={sectionLabel}>Radius</div>
                      <select
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        style={{ ...inputStyle, minHeight: 44, fontSize: 14 }}
                      >
                        {DIRECTORY_RADIUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {zip.length === 5 && zipStatus === 'error' && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>
                        Could not locate that ZIP code.
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      type="button"
                      onClick={applyMobileFilters}
                      style={{
                        minHeight: 44,
                        borderRadius: 12,
                        border: 'none',
                        background: 'var(--navy)',
                        color: '#fff',
                        fontWeight: 800,
                        fontFamily: 'var(--font-head)',
                      }}
                    >
                      Apply
                    </button>

                    <button
                      type="button"
                      onClick={clearAllMobileFilters}
                      style={{
                        minHeight: 44,
                        borderRadius: 12,
                        border: '1.5px solid #CBD5E1',
                        background: '#fff',
                        color: 'var(--navy)',
                        fontWeight: 800,
                        fontFamily: 'var(--font-head)',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <DirectoryAdBand
              slotKey="facilities_inline_1_mobile"
              maxWidth={320}
              reservedHeight={100}
              isMobile={true}
              marginTop={16}
            />

            <div style={{ marginTop: 16 }}>
              {mobileView === 'map' ? (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(15,23,42,0.08)',
                    borderRadius: 18,
                    padding: 10,
                    boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
                  }}
                >
                  <div style={{ height: 320, overflow: 'hidden', borderRadius: 14 }}>
                    <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <FitBounds facilities={mappable} />
                      {mapFocus?.lat != null && mapFocus?.lng != null && <FlyTo target={mapFocus} />}
                      {mappable.map((f) => (
                        <Marker
                          key={f.id}
                          position={[f.lat, f.lng]}
                          icon={makeIcon(f, false)}
                          eventHandlers={{ click: () => openFacilityById(f.id, 'map') }}
                        >
                          <Popup>
                            <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                              <strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>{f.name}</strong>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                                📍 {[f.city, f.state].filter(Boolean).join(', ')}
                                {getFacilityZip(f) ? ' ' + getFacilityZip(f) : ''}
                              </div>
                              <Link
                                to={buildFacilityDetailHref(f.id)}
                                style={{ display: 'inline-block', marginTop: 8, color: '#1D4ED8', fontWeight: 700, textDecoration: 'none', fontSize: 12 }}
                              >
                                View Facility
                              </Link>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  <div style={{ display: 'flex', gap: 12, padding: '10px 2px 2px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)' }}>
                      Map key
                    </span>
                    {[
                      ['Park / Rec Field', '#16A34A'],
                      ['Training Facility', '#D42B2B'],
                      ['Sports Complex', '#fd5b03'],
                      ['Team Facility', '#1D4ED8'],
                      ['School Field', '#6B7280'],
                      ['Other', '#9A6B2F'],
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
                    {/* Approximate location: gray outer ring instead of white/sport ring */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50% 50% 50% 0',
                          transform: 'rotate(-45deg)',
                          background: '#9CA3AF',
                          border: '2px solid rgba(255,255,255,0.9)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--gray)' }}>Approximate Location</span>
                    </div>
                    {/* Featured: gold star badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 13,
                          height: 13,
                          borderRadius: '50%',
                          background: '#c9a84c',
                          border: '1.5px solid #fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          color: '#7c5800',
                          fontWeight: 900,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                      >
                        ★
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--gray)' }}>Featured</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray)' }}>
                    Tap a pin to open that facility.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
                      Browse facilities
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: 'var(--gray)' }}>
                      {hasLocationSearch
                        ? 'List-first mobile view for easier browsing.'
                        : 'Enter your ZIP code above to load nearby facilities.'}
                    </div>
                  </div>

                  <div ref={mobileListRef} style={{ display: 'grid', gap: 14 }}>
                    {loading && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray)', fontSize: 14 }}>
                        Loading facilities…
                      </div>
                    )}

                    {!loading && filtered.length === 0 && (
                      <FacilitiesEmptyState hasLocationSearch={hasLocationSearch} hasFilters={hasFilters} />
                    )}

                    {!loading && filtered.map((f) => (
                      <div
                        key={f.id}
                        ref={(el) => {
                          if (el) rowRefs.current[f.id] = el
                          else delete rowRefs.current[f.id]
                        }}
                      >
                        <MobileFacilityRow
                          facility={f}
                          distanceMi={getDistance(f)}
                          detailHref={buildFacilityDetailHref(f.id)}
                          sportMeta={getSportBadgeMeta(getFacilitySport(f))}
                          typeLabel={getFacilityTypeLabel(f.facility_type)}
                          locationLine={formatFacilityLocation(f)}
                          amenityLabel={Array.isArray(f.amenities) ? f.amenities.slice(0, 1)[0] || null : null}
                          featuredBadgeStyle={FEATURED_BADGE_STYLE}
                          typeColor={getFacilityTypeColor(f.facility_type)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DirectoryAdBand
              slotKey="facilities_footer_1_mobile"
              maxWidth={320}
              reservedHeight={100}
              isMobile={true}
              marginTop={20}
            />
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff' }}>
          <DirectoryAdBand
            slotKey="facilities_top_1_desktop"
            maxWidth={970}
            reservedHeight={90}
            isMobile={false}
            marginTop={16}
          />

          <div style={{ padding: '16px 14px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: 18, alignItems: 'start', width: '100%' }}>
              <aside
                style={{
                  position: 'sticky',
                  top: HEADER_H + 12,
                  alignSelf: 'start',
                  background: '#F7F5F1',
                  borderRight: '1px solid #eef0f2',
                  zIndex: 2,
                }}
              >
                <div style={{ padding: '10px 12px 8px', background: '#F7F5F1', borderBottom: '1px solid #eef0f2' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 2, lineHeight: 1.1 }}>
                    {hasLocationSearch ? `${filtered.length} facilit${filtered.length !== 1 ? 'ies' : 'y'} near you` : 'Start with ZIP + radius'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.3 }}>
                    {hasLocationSearch
                      ? 'Parks, private facilities, and training locations'
                      : 'Enter a ZIP code to load nearby facilities first.'}
                  </div>
                </div>

                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid #eef0f2', background: '#F7F5F1' }}>
                  <div>
                    <div style={sectionLabel}>ZIP code</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter zip code"
                      maxLength={5}
                      value={zip}
                      onChange={(e) => {
                        const next = e.target.value.replace(/\D/g, '').slice(0, 5)
                        setZip(next)
                        if (next.length < 5) {
                          setGeoCenter(null)
                          setZipStatus('')
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          await applyZipSearch()
                        }
                      }}
                      style={{ ...inputStyle, minHeight: 40 }}
                    />
                  </div>

                  <div>
                    <div style={sectionLabel}>Radius</div>
                    <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ ...inputStyle, minHeight: 40 }}>
                      {DIRECTORY_RADIUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={applyZipSearch}
                    style={{
                      width: '100%',
                      background: 'var(--navy)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.01em',
                      fontFamily: 'var(--font-head)',
                    }}
                  >
                    Show nearby facilities
                  </button>

                  <div style={{ fontSize: 12, color: zipStatus === 'error' ? 'var(--red)' : 'var(--gray)', lineHeight: 1.35 }}>
                    {zipStatus === 'error'
                      ? 'Enter a valid 5-digit ZIP code.'
                      : hasLocationSearch
                        ? `Showing facilities within ${radius} miles of ${zip}.`
                        : 'Enter your ZIP code first so local facilities show before the full directory.'}
                  </div>

                  <div>
                    <div style={sectionLabel}>Search</div>
                    <input
                      placeholder="Name, city, address..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      style={{ ...inputStyle, minHeight: 40 }}
                    />
                  </div>

                  <div>
                    <div style={sectionLabel}>Location type</div>
                    <select
                      value={facilityType}
                      onChange={(e) => {
                        setFacilityType(e.target.value)
                        setSelected(null)
                      }}
                      style={{ ...inputStyle, minHeight: 40 }}
                    >
                      {FACILITY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={sectionLabel}>Sport</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className={'pill-toggle ' + (sport === 'baseball' ? 'active-baseball' : '')}
                        onClick={() => {
                          setSport((s) => (s === 'baseball' ? '' : 'baseball'))
                          setSelected(null)
                        }}
                        style={{ minHeight: 38 }}
                      >
                        ⚾ Baseball
                      </button>

                      <button
                        type="button"
                        className={'pill-toggle ' + (sport === 'softball' ? 'active-softball' : '')}
                        onClick={() => {
                          setSport((s) => (s === 'softball' ? '' : 'softball'))
                          setSelected(null)
                        }}
                        style={{ minHeight: 38 }}
                      >
                        🥎 Softball
                      </button>

                      <button
                        type="button"
                        className={'pill-toggle ' + (sport === 'both' ? 'active-both' : '')}
                        onClick={() => {
                          setSport((s) => (s === 'both' ? '' : 'both'))
                          setSelected(null)
                        }}
                        style={{ gridColumn: '1 / -1', minHeight: 38 }}
                      >
                        ⚾🥎 Baseball &amp; Softball
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={applySearch}
                      style={{
                        flex: 1,
                        background: 'var(--navy)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        fontFamily: 'var(--font-head)',
                      }}
                    >
                      Search
                    </button>

                    <button
                      type="button"
                      onClick={clearZipFilter}
                      style={{
                        flex: 1,
                        background: 'white',
                        color: 'var(--navy)',
                        border: '2px solid var(--lgray)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        fontFamily: 'var(--font-head)',
                      }}
                    >
                      Clear ZIP
                    </button>
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
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-head)',
                        minHeight: 40,
                      }}
                    >
                      {showMap ? 'Hide Map' : 'Show Map'}
                    </button>

                    <a
                      href="/submit"
                      className="add-cta"
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        textDecoration: 'none',
                        padding: '9px 10px',
                        borderRadius: 'var(--btn-radius)',
                        background: '#FFFBF0',
                    border: '2px solid #c9a84c',
                        color: '#0d1b2e',
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: 'var(--font-head)',
                        minHeight: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      + Add a Facility
                    </a>
                  </div>
                </div>

                <div style={{ padding: 12, borderTop: '1px solid #eef0f2', background: '#F7F5F1' }}>
                  <RailAdSlot slotKey="facilities_left_rail_1_desktop" reservedHeight={250} />
                </div>
              </aside>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
                  <main style={{ minWidth: 0 }}>
                    <div style={{ background: '#fff', paddingTop: 8, paddingBottom: 10 }}>
                      {showMap && (
                        <div
                          style={{
                            position: 'sticky',
                            top: HEADER_H + 12,
                            zIndex: 3,
                            background: '#fff',
                            paddingBottom: 10,
                          }}
                        >
                          <div style={{ width: '100%' }}>
                            <div
                              style={{
                                height: 360,
                                width: '100%',
                                overflow: 'hidden',
                                borderRadius: 10,
                                border: '1px solid #eef0f2',
                              }}
                            >
                              <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FitBounds facilities={mappable} />
                                {mapFocus?.lat != null && mapFocus?.lng != null && <FlyTo target={mapFocus} />}
                                {mappable.map((f) => (
                                  <Marker
                                    key={f.id}
                                    position={[f.lat, f.lng]}
                                    icon={makeIcon(f, f.id === selected)}
                                    zIndexOffset={f.id === selected ? 1000 : 0}
                                    eventHandlers={{ click: () => openFacilityById(f.id, 'map') }}
                                  >
                                    <Popup>
                                      <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                                        <strong style={{ fontFamily: 'var(--font-head)', fontSize: 15 }}>{f.name}</strong>
                                        <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                                          📍 {[f.city, f.state].filter(Boolean).join(', ')}
                                          {getFacilityZip(f) ? ' ' + getFacilityZip(f) : ''}
                                        </div>
                                        {f.address && <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>{f.address}</div>}
                                        {getFacilityTypeLabel(f.facility_type) && (
                                          <div style={{ fontSize: 12, marginTop: 2 }}>{getFacilityTypeLabel(f.facility_type)}</div>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => openFacilityById(f.id, 'map')}
                                          style={{
                                            display: 'inline-block',
                                            marginTop: 8,
                                            background: 'var(--navy)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '8px 10px',
                                            fontWeight: 700,
                                            fontSize: 12,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Preview Facility
                                        </button>
                                      </div>
                                    </Popup>
                                  </Marker>
                                ))}
                              </MapContainer>
                            </div>

                            <div style={{ display: 'flex', gap: 12, padding: '8px 2px 0', alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)' }}>
                                Map key
                              </span>
                              {[
                                ['Park / Rec Field', '#16A34A'],
                                ['Training Facility', '#D42B2B'],
                                ['Sports Complex', '#fd5b03'],
                                ['Team Facility', '#1D4ED8'],
                                ['School Field', '#6B7280'],
                                ['Other', '#9A6B2F'],
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
                              {/* Approximate location: gray outer ring */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50% 50% 50% 0',
                                    transform: 'rotate(-45deg)',
                                    background: '#9CA3AF',
                                    border: '2px solid rgba(255,255,255,0.9)',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                  }}
                                />
                                <span style={{ fontSize: 11, color: 'var(--gray)' }}>Approximate Location</span>
                              </div>
                              {/* Featured: gold star badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                  style={{
                                    width: 13,
                                    height: 13,
                                    borderRadius: '50%',
                                    background: '#c9a84c',
                                    border: '1.5px solid #fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 8,
                                    color: '#7c5800',
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    flexShrink: 0,
                                  }}
                                >
                                  ★
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--gray)' }}>Featured</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!showMap && (
                        <div
                          style={{
                            padding: '14px 0 4px',
                            color: 'var(--gray)',
                            fontSize: 13,
                            width: '100%',
                          }}
                        >
                          Map is hidden. Use “Show Map” in the left panel to view facility locations.
                        </div>
                      )}

                      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, letterSpacing: '0.01em', color: 'var(--navy)' }}>
                          {hasLocationSearch ? `${filtered.length} facilit${filtered.length !== 1 ? 'ies' : 'y'}` : 'Nearby facilities will appear here'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray)' }}>
                          {hasLocationSearch
                            ? 'Compact list below. Click a row or pin to preview, then use View Facility for the full page.'
                            : 'Enter a ZIP code and radius first so the list starts with local results.'}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        background: '#fff',
                        borderTop: '1px solid #eef0f2',
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
                            background: '#F7F5F1',
                            borderBottom: '1px solid #eef0f2',
                            position: 'sticky',
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <div style={desktopHeaderCellStyle}>Sport</div>
                          <div style={desktopHeaderCellStyle}>Facility</div>
                          <div style={desktopHeaderCellStyle}>Type</div>
                          <div style={desktopHeaderCellStyle}>Location</div>
                          <div style={{ ...desktopHeaderCellStyle, textAlign: 'right' }}>View</div>
                        </div>

                        {loading && (
                          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray)', fontSize: 14 }}>
                            Loading facilities...
                          </div>
                        )}

                        {!loading && filtered.length === 0 && (
                          <div style={{ padding: '16px 14px' }}>
                            <FacilitiesEmptyState hasLocationSearch={hasLocationSearch} hasFilters={hasFilters} />
                          </div>
                        )}

                        {!loading && filtered.map((f) => {
                          const isSelected = selected === f.id
                          const typeLabel = getFacilityTypeLabel(f.facility_type)
                          const sportMeta = getSportBadgeMeta(getFacilitySport(f))
                          const locationFull = formatFacilityLocation(f)
                          const subtitle = f.address || locationFull || 'Location not listed'

                          return (
                            <div
                              key={f.id}
                              ref={(el) => {
                                if (el) rowRefs.current[f.id] = el
                                else delete rowRefs.current[f.id]
                              }}
                              className="facility-row"
                              style={{
                                borderBottom: '1px solid #eef0f2',
                                background: isSelected ? '#f5f8ff' : '#fff',
                                transition: 'background 0.1s',
                              }}
                            >
                              <FacilityDesktopRow
                                facility={f}
                                isSelected={isSelected}
                                onActivate={() => openFacilityById(f.id, 'list')}
                                onToggle={() => (isSelected ? closeFacilityPreview() : openFacilityById(f.id, 'list'))}
                                sportMeta={sportMeta}
                                typeLabel={typeLabel}
                                locationFull={locationFull}
                                subtitle={subtitle}
                                featuredBadgeStyle={FEATURED_BADGE_STYLE}
                                typeColor={getFacilityTypeColor(f.facility_type)}
                              />
                            </div>
                          )
                        })}
                      </div>

                      {selFacility && (
                        <FacilityPreviewCard
                          facility={selFacility}
                          onClose={closeFacilityPreview}
                          detailHref={buildFacilityDetailHref(selFacility.id)}
                        />
                      )}
                    </div>
                  </main>

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
                      <RailAdSlot slotKey="facilities_right_rail_1_desktop" reservedHeight={250} />
                      <RailAdSlot slotKey="facilities_right_rail_2_desktop" reservedHeight={250} />
                      <RailAdSlot slotKey="facilities_right_rail_3_desktop" reservedHeight={250} />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}