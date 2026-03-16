import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

// ─── Haversine distance (miles) between two lat/lng points ───────────────────
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Geocode a zip code via Zippopotam.us (free, no key) ─────────────────────
async function geocodeZip(zip) {
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place['place name'],
      state: place['state abbreviation'],
    }
  } catch {
    return null
  }
}

// ─── Style tokens ─────────────────────────────────────────────────────────────
const RED    = '#e63329'
const DARK   = '#1a1a1a'
const BORDER = '#eaeae6'
const MUTED  = '#888'
const FAINT  = '#bbb'
const LIGHT  = '#f5f5f2'

const BADGE_STYLES = {
  coach:   { background: '#e8f2fc', color: '#0c4a8a' },
  team:    { background: '#eaf3de', color: '#285010' },
  roster:  { background: '#fff3e0', color: '#7a4200' },
  tryout:  { background: '#f0eefe', color: '#3d2fa0' },
  pickup:  { background: '#fcebeb', color: '#791f1f' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultCount({ count, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: count > 0 ? RED : '#eaeae6',
      color: count > 0 ? '#fff' : MUTED,
      fontSize: 11, fontWeight: 600,
      minWidth: 22, height: 22, borderRadius: 11,
      padding: '0 6px', marginLeft: 8,
    }}>
      {count}
    </span>
  )
}

function SectionHeader({ title, count, collapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 0 12px', borderBottom: `2px solid ${BORDER}`,
        cursor: 'pointer', userSelect: 'none', marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: DARK }}>
          {title}
        </span>
        <ResultCount count={count} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>{collapsed ? '▼ Show' : '▲ Hide'}</span>
    </div>
  )
}

function CoachCard({ coach, distanceMi }) {
  const specs = Array.isArray(coach.specialty)
    ? coach.specialty
    : (coach.specialty || '').split('|').filter(Boolean)

  return (
    <Link to={`/coaches?select=${coach.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        border: `1px solid ${BORDER}`, borderRadius: 12,
        padding: '14px 16px', background: '#fff',
        transition: 'border-color 0.15s', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 2 }}>{coach.name}</div>
            {coach.facility_name && (
              <div style={{ fontSize: 12, color: MUTED }}>{coach.facility_name}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, ...BADGE_STYLES.coach }}>Coach</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: coach.sport === 'softball' ? '#f0eefe' : '#e8f4ff', color: coach.sport === 'softball' ? '#5b21b6' : '#1d4ed8', textTransform: 'uppercase' }}>
              {coach.sport === 'softball' ? '🥎' : '⚾'} {coach.sport}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
          📍 {[coach.city, coach.county ? `${coach.county} Co.` : null].filter(Boolean).join(', ')}
          {distanceMi != null && (
            <span style={{ marginLeft: 8, color: RED, fontWeight: 500 }}>{Math.round(distanceMi)} mi away</span>
          )}
        </div>

        {specs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {specs.map(s => (
              <span key={s} style={{ background: LIGHT, color: MUTED, fontSize: 11, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{s}</span>
            ))}
          </div>
        )}

        {coach.credentials && (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4, marginBottom: 6 }}>
            {coach.credentials.length > 100 ? coach.credentials.slice(0, 100) + '…' : coach.credentials}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid #f2f2ee`, paddingTop: 9, marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: RED }}>View profile →</span>
          {(coach.price_per_session || coach.price_notes) && (
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
              {coach.price_per_session ? `$${coach.price_per_session}/session` : coach.price_notes}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function TeamCard({ team, distanceMi }) {
  const isOpen   = team.roster_status === 'open' || team.open_spots > 0
  const isTryout = team.tryout_status === 'open' || team.tryout_date

  return (
    <Link to="/teams" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{
        border: `1px solid ${BORDER}`, borderRadius: 12,
        padding: '14px 16px', background: '#fff', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 2 }}>{team.name}</div>
            {team.organization && <div style={{ fontSize: 12, color: MUTED }}>{team.organization}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 12 }}>
            {isOpen && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, ...BADGE_STYLES.roster }}>Open Roster</span>}
            {isTryout && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, ...BADGE_STYLES.tryout }}>Tryouts Open</span>}
            {!isOpen && !isTryout && <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, ...BADGE_STYLES.team }}>Team</span>}
          </div>
        </div>

        <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
          📍 {[team.city, team.county ? `${team.county} Co.` : null].filter(Boolean).join(', ') || 'Location TBD'}
          {distanceMi != null && (
            <span style={{ marginLeft: 8, color: RED, fontWeight: 500 }}>{Math.round(distanceMi)} mi away</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {team.sport && (
            <span style={{ background: LIGHT, color: MUTED, fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>
              {team.sport === 'softball' ? '🥎' : '⚾'} {team.sport}
            </span>
          )}
          {team.age_group && (
            <span style={{ background: LIGHT, color: MUTED, fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{team.age_group}</span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid #f2f2ee`, paddingTop: 9, marginTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: RED }}>View team →</span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ query }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', color: MUTED }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: DARK, marginBottom: 6 }}>
        No results found{query ? ` for "${query}"` : ''}
      </div>
      <div style={{ fontSize: 13 }}>Try broadening your search — remove a filter or increase the radius.</div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Read params from URL
  const [query,       setQuery]       = useState(searchParams.get('q')      || '')
  const [sport,       setSport]       = useState(searchParams.get('sport')  || '')
  const [zip,         setZip]         = useState(searchParams.get('zip')    || '')
  const [listingType, setListingType] = useState(searchParams.get('type')   || '')
  const [ageGroup,    setAgeGroup]    = useState(searchParams.get('age')    || '')
  const [radius,      setRadius]      = useState(Number(searchParams.get('radius')) || 25)

  // Results state
  const [coaches,   setCoaches]   = useState([])
  const [teams,     setTeams]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [geoResult, setGeoResult] = useState(null)
  const [geoError,  setGeoError]  = useState('')

  // Collapse state per section
  const [showCoaches, setShowCoaches] = useState(false)
  const [showTeams,   setShowTeams]   = useState(false)

  // ── Fetch all data whenever URL params change ──────────────────────────────
  useEffect(() => {
    // Sync local state from URL on every navigation
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

      // Geocode zip if provided
      let geo = null
      if (currentZip && currentZip.length === 5) {
        geo = await geocodeZip(currentZip)
        if (!geo) setGeoError(`Couldn't find zip code "${currentZip}" — showing all results.`)
        setGeoResult(geo)
      } else {
        setGeoResult(null)
      }

      // Fetch coaches
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('active', true)
        .in('approval_status', ['approved', 'seeded'])

      // Fetch teams
      const { data: teamData } = await supabase
        .from('travel_teams')
        .select('*')
        .eq('active', true)

      setCoaches(coachData || [])
      setTeams(teamData || [])
      setLoading(false)
    }
    fetchAll()
  }, [searchParams])

  // ── Apply filters ──────────────────────────────────────────────────────────
  function matchesKeyword(item) {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      (item.name         || '').toLowerCase().includes(q) ||
      (item.city         || '').toLowerCase().includes(q) ||
      (item.county       || '').toLowerCase().includes(q) ||
      (item.facility_name|| '').toLowerCase().includes(q) ||
      (item.organization || '').toLowerCase().includes(q) ||
      (item.specialty    || '').toLowerCase().includes(q) ||
      (item.credentials  || '').toLowerCase().includes(q)
    )
  }

  function matchesSport(item) {
    if (!sport) return true
    return (item.sport || '').toLowerCase() === sport.toLowerCase() ||
           (item.sport || '').toLowerCase() === 'both'
  }

  function matchesAge(item) {
    if (!ageGroup) return true
    return (item.age_group || '').toLowerCase().includes(ageGroup.toLowerCase())
  }

  function getDistance(item) {
    if (!geoResult || !item.lat || !item.lng) return null
    return distanceMiles(geoResult.lat, geoResult.lng, item.lat, item.lng)
  }

  function matchesRadius(item) {
    if (!geoResult) return true
    const dist = getDistance(item)
    if (dist === null) return true // no coordinates — include it
    return dist <= radius
  }

  // Build filtered lists
  const filteredCoaches = (listingType && listingType !== 'coach')
    ? []
    : coaches.filter(c =>
        matchesKeyword(c) &&
        matchesSport(c) &&
        matchesRadius(c)
      ).sort((a, b) => {
        const da = getDistance(a)
        const db = getDistance(b)
        if (da == null && db == null) return 0
        if (da == null) return 1
        if (db == null) return -1
        return da - db
      })

  const filteredTeams = (listingType && listingType !== 'team' && listingType !== 'roster')
    ? []
    : teams.filter(t =>
        matchesKeyword(t) &&
        matchesSport(t) &&
        matchesAge(t) &&
        matchesRadius(t)
      ).sort((a, b) => {
        const da = getDistance(a)
        const db = getDistance(b)
        if (da == null && db == null) return 0
        if (da == null) return 1
        if (db == null) return -1
        return da - db
      })

  const totalResults = filteredCoaches.length + filteredTeams.length

  // ── Re-run search ──────────────────────────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query)         params.set('q',      query)
    if (sport)         params.set('sport',  sport)
    if (zip)           params.set('zip',    zip)
    if (listingType)   params.set('type',   listingType)
    if (ageGroup)      params.set('age',    ageGroup)
    if (radius !== 25) params.set('radius', radius)
    navigate(`/search?${params.toString()}`)
  }

  const pillStyle = {
    display: 'flex', alignItems: 'center', gap: 5,
    background: '#fff', border: `1px solid #ddddd8`, borderRadius: 7,
    padding: '5px 11px', fontSize: 12, color: '#444', whiteSpace: 'nowrap',
  }
  const selectStyle = {
    border: 'none', outline: 'none', background: 'none',
    fontSize: 12, color: '#444', cursor: 'pointer', padding: 0,
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 48px', background: '#fff', color: DARK }}>

      {/* ── SEARCH BAR (persistent at top of results page) ────────────────── */}
      <section style={{
        background: '#fff', borderRadius: 14, padding: '20px 24px 16px',
        marginTop: 16, border: `1px solid ${BORDER}`, borderTop: `4px solid ${RED}`,
      }}>
        <form onSubmit={handleSearch}
          style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1.5px solid #d8d8d2`, borderRadius: 10, padding: '0 6px 0 12px', height: 46, gap: 8, marginBottom: 11 }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
            <circle cx="6.5" cy="6.5" r="4.5" stroke={DARK} strokeWidth="1.5" />
            <path d="M10 10L14 14" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search coaches, teams, positions, specialties…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: DARK, background: 'none', minWidth: 0 }}
          />
          <button type="submit"
            style={{ background: RED, color: '#fff', border: 'none', borderRadius: 7, height: 34, padding: '0 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
          >
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <div style={pillStyle}>
            <select value={sport} onChange={e => setSport(e.target.value)} style={selectStyle}>
              <option value="">All sports</option>
              <option value="baseball">Baseball</option>
              <option value="softball">Softball</option>
            </select>
          </div>
          <span style={{ color: '#ccc', fontSize: 12 }}>·</span>
          <div style={pillStyle}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 1C4.067 1 2.5 2.567 2.5 4.5c0 2.776 3.5 6.5 3.5 6.5s3.5-3.724 3.5-6.5C9.5 2.567 7.933 1 6 1z" stroke="#aaa" strokeWidth="1.2" fill="none" />
              <circle cx="6" cy="4.5" r="1" fill="#aaa" />
            </svg>
            <input
              type="text" inputMode="numeric" placeholder="Zip code" maxLength={5}
              value={zip} onChange={e => setZip(e.target.value)}
              style={{ ...selectStyle, width: 68 }}
            />
          </div>
          <span style={{ color: '#ccc', fontSize: 12 }}>·</span>
          <div style={pillStyle}>
            <select value={listingType} onChange={e => setListingType(e.target.value)} style={selectStyle}>
              <option value="">All types</option>
              <option value="coach">Coaches</option>
              <option value="team">Teams</option>
              <option value="roster">Open Rosters</option>
            </select>
          </div>
          <span style={{ color: '#ccc', fontSize: 12 }}>·</span>
          <div style={pillStyle}>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={selectStyle}>
              <option value="">All ages</option>
              {['8U','10U','12U','13U','14U','15U','16U','17U','18U'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <span style={{ color: '#ccc', fontSize: 12 }}>·</span>
          <div style={{ ...pillStyle, gap: 6 }}>
            <span>Within</span>
            <input
              type="range" min={5} max={100} step={5} value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              style={{ width: 72, accentColor: RED, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, fontWeight: 500, color: DARK, minWidth: 32 }}>{radius} mi</span>
          </div>
        </div>
      </section>

      {/* ── RESULTS SUMMARY ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 4px' }}>
        <div style={{ fontSize: 14, color: MUTED }}>
          {loading
            ? 'Searching…'
            : totalResults === 0
            ? 'No results found'
            : <>
                <span style={{ fontWeight: 600, color: DARK }}>{totalResults} result{totalResults !== 1 ? 's' : ''}</span>
                {geoResult && <span> within {radius} mi of {geoResult.city}, {geoResult.state}</span>}
                {!geoResult && zip && !geoError && <span> matching your search</span>}
              </>
          }
        </div>
        <Link to="/" style={{ fontSize: 12, color: RED, textDecoration: 'none', fontWeight: 500 }}>← Back to home</Link>
      </div>

      {geoError && (
        <div style={{ fontSize: 12, color: '#b45309', background: '#fef9ee', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
          ⚠️ {geoError}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
          <div style={{ fontSize: 14 }}>Searching…</div>
        </div>
      )}

      {!loading && totalResults === 0 && (
        <EmptyState query={query} />
      )}

      {/* ── TWO-COLUMN LAYOUT: results + sidebar ──────────────────────────── */}
      {!loading && totalResults > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 22, alignItems: 'start', marginTop: 8 }}>

          {/* Results column */}
          <div>

            {/* COACHES */}
            {filteredCoaches.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader
                  title="Coaches"
                  count={filteredCoaches.length}
                  collapsed={showCoaches}
                  onToggle={() => setShowCoaches(v => !v)}
                />
                {!showCoaches && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {filteredCoaches.map(coach => (
                      <CoachCard
                        key={coach.id}
                        coach={coach}
                        distanceMi={getDistance(coach)}
                      />
                    ))}
                  </div>
                )}
                {!showCoaches && filteredCoaches.length > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Link to={`/coaches${sport ? `?sport=${sport}` : ''}`}
                      style={{ fontSize: 13, fontWeight: 500, color: RED, textDecoration: 'none' }}>
                      View all coaches →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TEAMS */}
            {filteredTeams.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader
                  title="Teams"
                  count={filteredTeams.length}
                  collapsed={showTeams}
                  onToggle={() => setShowTeams(v => !v)}
                />
                {!showTeams && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {filteredTeams.map(team => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        distanceMi={getDistance(team)}
                      />
                    ))}
                  </div>
                )}
                {!showTeams && filteredTeams.length > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <Link to="/teams"
                      style={{ fontSize: 13, fontWeight: 500, color: RED, textDecoration: 'none' }}>
                      View all teams →
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar ads */}
          <aside style={{ width: 200, flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Sidebar · 160×300', example: 'Travel orgs · Academies · County sponsors', minH: 260 },
                { label: 'Sidebar · 160×200', example: 'Local businesses · Equipment shops', minH: 200 },
              ].map((slot, i) => (
                <div key={i} style={{
                  border: '1.5px dashed #d0d0c8', borderRadius: 8, background: '#fafaf8',
                  minHeight: slot.minH, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 8px',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#bbb', textAlign: 'center' }}>{slot.label}</span>
                  <span style={{ fontSize: 10, color: '#ccc', fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5 }}>{slot.example}</span>
                </div>
              ))}
            </div>
          </aside>

        </div>
      )}
    </div>
  )
}
