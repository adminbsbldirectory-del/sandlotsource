import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { SEARCH_RADIUS_OPTIONS } from '../constants/radiusOptions'
import { geocodeZip, distanceMiles } from '../lib/submit/geocode.js'
import SearchResultsContent from './search/SearchResultsContent'
import AdSlot from './AdSlot.jsx'


// ─── Style tokens ─────────────────────────────────────────
const RED = 'var(--navy)'
const DARK = '#1a1a1a'
const MUTED = '#888'
const HEADER_H = 75

// ─── Skyscraper ad rail ───────────────────────────────────
function SkyscraperAdSlot({ slotKey }) {
  return (
    <div style={{ width: 160, maxWidth: 160 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#bbb',
          margin: '0 0 8px 2px',
          textAlign: 'left',
        }}
      >
        Sponsored
      </div>
      <div
        style={{
          width: 160,
          minWidth: 160,
          maxWidth: 160,
          minHeight: 600,
          overflow: 'hidden',
        }}
      >
        <AdSlot slotKey={slotKey} />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────
export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [sport, setSport] = useState(searchParams.get('sport') || '')
  const [zip, setZip] = useState(searchParams.get('zip') || '')
  const [listingType, setListingType] = useState(searchParams.get('type') || '')
  const [ageGroup, setAgeGroup] = useState(searchParams.get('age') || '')
  const [radius, setRadius] = useState(Number(searchParams.get('radius')) || 25)

  const [coaches, setCoaches] = useState([])
  const [teams, setTeams] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [geoResult, setGeoResult] = useState(null)
  const [geoError, setGeoError] = useState('')

  const [coachesCollapsed, setCoachesCollapsed] = useState(false)
  const [teamsCollapsed, setTeamsCollapsed] = useState(false)
  const [facilitiesCollapsed, setFacilitiesCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [resultView, setResultView] = useState('list')

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
    setSport(searchParams.get('sport') || '')
    setZip(searchParams.get('zip') || '')
    setListingType(searchParams.get('type') || '')
    setAgeGroup(searchParams.get('age') || '')
    setRadius(Number(searchParams.get('radius')) || 25)

    const currentZip = searchParams.get('zip') || ''

    async function fetchAll() {
      setLoading(true)
      setGeoError('')

      let geo = null
      if (currentZip && currentZip.length === 5) {
        geo = await geocodeZip(currentZip)
        if (!geo) {
          setGeoError(`Couldn't find zip code "${currentZip}" — showing all results.`)
        }
        setGeoResult(geo)
      } else {
        setGeoResult(null)
      }

      const [{ data: coachData }, { data: teamData }, { data: facilityData }] =
        await Promise.all([
          supabase
            .from('coaches')
            .select('*')
            .eq('active', true)
            .in('approval_status', ['approved', 'seeded']),
          supabase
            .from('travel_teams')
            .select('*')
            .eq('active', true)
            .in('approval_status', ['approved', 'seeded']),
          supabase
            .from('facilities')
            .select('*')
            .eq('active', true)
            .in('approval_status', ['approved', 'seeded']),
        ])

      setCoaches(coachData || [])
      setTeams(teamData || [])
      setFacilities(facilityData || [])
      setLoading(false)
    }

    fetchAll()
  }, [searchParams])

  function matchesKeyword(item) {
    if (!query) return true

    const q = query.toLowerCase()
    const specialtyStr = Array.isArray(item.specialty)
      ? item.specialty.join(' ')
      : item.specialty || ''

    return (
      (item.name || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q) ||
      (item.state || '').toLowerCase().includes(q) ||
      (item.county || '').toLowerCase().includes(q) ||
      (item.facility_name || '').toLowerCase().includes(q) ||
      (item.org_affiliation || '').toLowerCase().includes(q) ||
      (item.organization || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      specialtyStr.toLowerCase().includes(q) ||
      (item.credentials || '').toLowerCase().includes(q)
    )
  }

  function matchesSport(item) {
    if (!sport) return true
    const s = (item.sport || '').toLowerCase()
    return s === sport.toLowerCase() || s === 'both'
  }

  function matchesAge(item) {
    if (!ageGroup) return true
    return (item.age_group || '').toLowerCase().includes(ageGroup.toLowerCase())
  }

  function getDistance(item) {
    if (!geoResult || item.lat == null || item.lng == null) return null
    return distanceMiles(geoResult.lat, geoResult.lng, item.lat, item.lng)
  }

  function matchesRadius(item) {
    if (!geoResult) return true
    const dist = getDistance(item)
    if (dist == null) return false
    return dist <= radius
  }

  function sortByDistance(list) {
    return [...list].sort((a, b) => {
      const da = getDistance(a)
      const db = getDistance(b)
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      return da - db
    })
  }

  const filteredCoaches =
    listingType && listingType !== 'coach'
      ? []
      : sortByDistance(
          coaches.filter(
            (c) => matchesKeyword(c) && matchesSport(c) && matchesRadius(c)
          )
        )

  const filteredTeams =
    listingType && listingType !== 'team' && listingType !== 'roster'
      ? []
      : sortByDistance(
          teams.filter(
            (t) =>
              matchesKeyword(t) &&
              matchesSport(t) &&
              matchesAge(t) &&
              matchesRadius(t)
          )
        )

  const filteredFacilities =
    listingType && listingType !== 'facility'
      ? []
      : sortByDistance(
          facilities.filter(
            (f) => matchesKeyword(f) && matchesSport(f) && matchesRadius(f)
          )
        )

  const totalResults =
    filteredCoaches.length + filteredTeams.length + filteredFacilities.length

  const isSingleTypeMapEligible =
    listingType === 'coach' ||
    listingType === 'team' ||
    listingType === 'facility'

  useEffect(() => {
    if (!isSingleTypeMapEligible && resultView !== 'list') {
      setResultView('list')
    }
  }, [isSingleTypeMapEligible, resultView])

  function buildDirectoryQuery(extra = {}) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (zip) params.set('zip', zip)
  if (radius) params.set('radius', String(radius))
  if (sport) params.set('sport', sport)
  if (ageGroup) params.set('age', ageGroup)

  Object.entries(extra).forEach(([key, value]) => {
    if (value == null || value === '') return
    params.set(key, String(value))
  })

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

  const coachBrowseLink = `/coaches${buildDirectoryQuery()}`
  const teamBrowseLink = `/teams${buildDirectoryQuery()}`
  const facilityBrowseLink = `/facilities${buildDirectoryQuery()}`

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (sport) params.set('sport', sport)
    if (zip) params.set('zip', zip)
    if (listingType) params.set('type', listingType)
    if (ageGroup) params.set('age', ageGroup)
    if (radius !== 25) params.set('radius', String(radius))
    navigate(`/search?${params.toString()}`)
  }

  const pillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fff',
    border: '1px solid #eef0f2',
    borderRadius: 10,
    padding: isMobile ? '10px 12px' : '8px 11px',
    fontSize: isMobile ? 14 : 12,
    color: '#444',
    minHeight: isMobile ? 48 : 42,
    width: '100%',
  }

  const selectStyle = {
    border: 'none',
    outline: 'none',
    background: 'none',
    fontSize: isMobile ? 14 : 12,
    color: '#444',
    cursor: 'pointer',
    padding: 0,
    width: '100%',
    minWidth: 0,
  }

  const innerContent = (
    <>
      <section
        style={{
          background: '#F7F5F1',
          borderTop: '1px solid #ede9e3',
          borderBottom: '1px solid #ede9e3',
          padding: isMobile ? '16px 14px 14px' : '20px 24px 16px',
          marginTop: 16,
        }}
      >
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#fff',
            border: '1px solid #eef0f2',
            borderRadius: 10,
            padding: isMobile ? '0 5px 0 10px' : '0 6px 0 12px',
            height: isMobile ? 50 : 46,
            gap: 8,
            marginBottom: 11,
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0, opacity: 0.35 }}
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke={DARK} strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" />
          </svg>

          <input
            type="text"
            placeholder="Search coaches, teams, facilities, positions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: isMobile ? 15 : 14,
              color: DARK,
              background: 'none',
              minWidth: 0,
            }}
          />

          <button
            type="submit"
            style={{
              background: RED,
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              height: isMobile ? 40 : 34,
              padding: isMobile ? '0 16px' : '0 18px',
              fontSize: isMobile ? 14 : 13,
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Search
          </button>
        </form>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr 1fr'
              : 'minmax(150px, 1.15fr) minmax(150px, 1fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(140px, 1fr)',
            gap: 10,
            alignItems: 'stretch',
          }}
        >
          <div style={pillStyle}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <path
                d="M6 1C4.067 1 2.5 2.567 2.5 4.5c0 2.776 3.5 6.5 3.5 6.5s3.5-3.724 3.5-6.5C9.5 2.567 7.933 1 6 1z"
                stroke="#aaa"
                strokeWidth="1.2"
                fill="none"
              />
              <circle cx="6" cy="4.5" r="1" fill="#aaa" />
            </svg>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Near zip code"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              style={selectStyle}
            />
          </div>

          <div style={pillStyle}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.2" fill="none" />
              <circle cx="6" cy="6" r="1.5" fill="#aaa" />
            </svg>
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={selectStyle}>
              {SEARCH_RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  Up to {r} miles
                </option>
              ))}
            </select>
          </div>

          <div style={pillStyle}>
            <select value={sport} onChange={(e) => setSport(e.target.value)} style={selectStyle}>
              <option value="">All sports</option>
              <option value="baseball">Baseball</option>
              <option value="softball">Softball</option>
            </select>
          </div>

          <div style={pillStyle}>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              style={selectStyle}
            >
              <option value="">All types</option>
              <option value="coach">Coaches</option>
              <option value="team">Teams</option>
              <option value="facility">Facilities</option>
              <option value="roster">Open Rosters</option>
            </select>
          </div>

          <div style={pillStyle}>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              style={selectStyle}
            >
              <option value="">All ages</option>
              {['7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U'].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ fontSize: 12, color: MUTED, marginTop: 10, lineHeight: 1.45 }}>
          Start with ZIP + distance to keep results local, then narrow by sport or listing type.
        </div>
      </section>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 8 : 16,
          margin: '20px 0 4px',
        }}
      >
        <div style={{ fontSize: 14, color: MUTED }}>
          {loading ? (
            'Searching…'
          ) : totalResults === 0 ? (
            'No results found'
          ) : (
            <>
              <span style={{ fontWeight: 600, color: DARK }}>
                {totalResults} result{totalResults !== 1 ? 's' : ''}
              </span>
              {geoResult && (
                <span>
                  {' '}
                  within {radius} mi of {geoResult.city}, {geoResult.state}
                </span>
              )}
              {!geoResult && zip && !geoError && <span> matching your search</span>}
            </>
          )}
        </div>

        <Link
          to="/"
          style={{
            fontSize: 12,
            color: RED,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          ← Back to home
        </Link>
      </div>

      {geoError && (
        <div
          style={{
            fontSize: 12,
            color: '#b45309',
            background: '#fef9ee',
            border: '1px solid #fde68a',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
          }}
        >
          ⚠️ {geoError}
        </div>
      )}

      <SearchResultsContent
        loading={loading}
        totalResults={totalResults}
        query={query}
        isMobile={isMobile}
        filteredCoaches={filteredCoaches}
        filteredTeams={filteredTeams}
        filteredFacilities={filteredFacilities}
        coachesCollapsed={coachesCollapsed}
        teamsCollapsed={teamsCollapsed}
        facilitiesCollapsed={facilitiesCollapsed}
        onToggleCoaches={() => setCoachesCollapsed((v) => !v)}
        onToggleTeams={() => setTeamsCollapsed((v) => !v)}
        onToggleFacilities={() => setFacilitiesCollapsed((v) => !v)}
        getDistance={getDistance}
        buildDirectoryQuery={buildDirectoryQuery}
        coachBrowseLink={coachBrowseLink}
        teamBrowseLink={teamBrowseLink}
        facilityBrowseLink={facilityBrowseLink}
        resultView={resultView}
        setResultView={setResultView}
        isSingleTypeMapEligible={isSingleTypeMapEligible}
        listingType={listingType}
        zip={zip}
        geoResult={geoResult}
      />
    </>
  )

  return (
    <div style={{ overflowX: 'clip', background: '#fff', color: DARK }}>
      {isMobile ? (
        <div style={{ padding: '0 12px 96px' }}>
          {innerContent}
        </div>
      ) : (
        <div style={{ padding: '12px 14px 48px' }}>
          <div
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '160px minmax(0, 1fr) 160px',
              gap: 28,
              alignItems: 'start',
            }}
          >
            <aside
              style={{
                position: 'sticky',
                top: HEADER_H + 12,
                alignSelf: 'start',
                width: 160,
                justifySelf: 'start',
              }}
            >
              <SkyscraperAdSlot slotKey="search_results_left_rail_1_desktop" />
            </aside>

            <main style={{ minWidth: 0, padding: '0 12px' }}>
              {innerContent}
            </main>

            <aside
              style={{
                position: 'sticky',
                top: HEADER_H + 12,
                alignSelf: 'start',
                width: 160,
                justifySelf: 'end',
              }}
            >
              <SkyscraperAdSlot slotKey="search_results_right_rail_1_desktop" />
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}