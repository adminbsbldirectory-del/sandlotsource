import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FeaturedCard from './home/FeaturedCard'
import HomePageAdBand from './home/HomePageAdBand'
import HomePageSectionHeader from './home/HomePageSectionHeader'
import HomePageBand from './home/HomePageBand'
import { SEARCH_RADIUS_OPTIONS } from '../constants/radiusOptions'
import { supabase } from '../supabase.js'


const RED = '#e63329'
const NAVY = '#1b3a5c'
const DARK = '#1a1a1a'
const BORDER = '#e2e0db'
const MUTED = '#6B7280'
const FAINT = '#888'

export default function HomePage() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [sport, setSport] = useState('')
  const [zip, setZip] = useState('')
  const [listingType, setListingType] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [radius, setRadius] = useState(25)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const [featuredCoaches, setFeaturedCoaches] = useState([])
  const [featuredTeams, setFeaturedTeams] = useState([])
  const [urgentPosts, setUrgentPosts] = useState([])
  const [homepageStats, setHomepageStats] = useState({
    coachesCount: 0,
    teamsCount: 0,
    statesCovered: 0,
  })

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
 
    useEffect(() => {
    let cancelled = false

    function normalizeSportValue(value) {
      const raw = String(value || '').trim().toLowerCase()
      if (raw === 'softball') return 'softball'
      if (raw === 'both') return 'both'
      return 'baseball'
    }

    function formatCoachMeta(coach) {
      const specialty = Array.isArray(coach.specialty) && coach.specialty.length
        ? coach.specialty[0]
        : 'General coaching'

      const sportLabel =
        normalizeSportValue(coach.sport) === 'both'
          ? 'Baseball & Softball'
          : normalizeSportValue(coach.sport) === 'softball'
            ? 'Softball'
            : 'Baseball'

      const ageGroups = Array.isArray(coach.age_groups) && coach.age_groups.length
        ? coach.age_groups.join(', ')
        : 'All ages'

      return `${specialty} - ${sportLabel} - ${ageGroups}`
    }

    function formatCoachLocation(coach) {
      return [coach.city, coach.state].filter(Boolean).join(', ') || 'Location not listed'
    }

    function formatTeamMeta(team) {
      const sportLabel =
        normalizeSportValue(team.sport) === 'both'
          ? 'Baseball & Softball'
          : normalizeSportValue(team.sport) === 'softball'
            ? 'Softball'
            : 'Baseball'

      const classLabel = team.classification ? `${team.classification} ${sportLabel}` : `Travel ${sportLabel}`
      const ageLabel = team.age_group || 'All ages'

      return `${classLabel} - ${ageLabel}`
    }

    function formatTeamLocation(team) {
      return [team.city, team.state].filter(Boolean).join(', ') || 'Location not listed'
    }

    function getTeamBadge(team) {
      if (team.tryout_status === 'open') {
        return {
          badge: 'Tryouts Open',
          badgeStyle: { background: '#f0eefe', color: '#3d2fa0' },
        }
      }

      if (team.tryout_status === 'year_round') {
        return {
          badge: 'Year Round',
          badgeStyle: { background: '#e8f2fc', color: '#0c4a8a' },
        }
      }

      return {
        badge: 'Team',
        badgeStyle: { background: '#fff3e0', color: '#7a4200' },
      }
    }

     function formatExpiresLabel(expiresAt) {
      if (!expiresAt) return ''
      const msRemaining = new Date(expiresAt).getTime() - Date.now()
      const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60))
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))

      if (hoursRemaining <= 24) {
        return `Expires in ${Math.max(hoursRemaining, 1)} hr${Math.max(hoursRemaining, 1) !== 1 ? 's' : ''}`
      }

      return `Expires in ${Math.max(daysRemaining, 1)} day${Math.max(daysRemaining, 1) !== 1 ? 's' : ''}`
    }

    function formatUrgentSportLabel(value) {
      const normalized = normalizeSportValue(value)
      if (normalized === 'softball') return 'Softball'
      if (normalized === 'both') return 'Baseball & Softball'
      return 'Baseball'
    }

    function formatUrgentLocation(city, state) {
      return [city, state].filter(Boolean).join(' - ') || 'Location pending'
    }

    function normalizePlayerBoardPost(post) {
      const isPlayerAvailable = post.post_type === 'player_available'
      const ageLabel =
        post.post_type === 'player_available'
          ? post.player_age
            ? `${post.player_age}U`
            : post.age_group || 'Age not listed'
          : post.age_group || 'Age not listed'

      const title = isPlayerAvailable
        ? `${ageLabel} player available`
        : post.team_name
          ? `${post.team_name} needs player`
          : 'Player needed'

      const positionList = isPlayerAvailable
        ? Array.isArray(post.player_position) && post.player_position.length
          ? post.player_position.join(' / ')
          : ''
        : Array.isArray(post.position_needed) && post.position_needed.length
          ? post.position_needed.join(' / ')
          : ''

      return {
        id: `player-${post.id}`,
        postType: isPlayerAvailable ? 'Need team' : 'Need player',
        title,
        meta: [
          positionList,
          formatUrgentLocation(post.city, post.state),
          formatUrgentSportLabel(post.sport),
        ]
          .filter(Boolean)
          .join(' - '),
        expires: formatExpiresLabel(post.expires_at),
        expiresAt: post.expires_at,
        link: '/find',
      }
    }

    function normalizeRosterSpotPost(spot) {
      const positionList =
        Array.isArray(spot.positions_needed) && spot.positions_needed.length
          ? spot.positions_needed.join(' / ')
          : ''

      return {
        id: `roster-${spot.id}`,
        postType: 'Need player',
        title: spot.team_name
          ? `${spot.team_name} needs player`
          : 'Roster spot available',
        meta: [
          spot.age_group || 'Age not listed',
          positionList,
          formatUrgentLocation(spot.city, spot.state),
          formatUrgentSportLabel(spot.sport),
        ]
          .filter(Boolean)
          .join(' - '),
        expires: formatExpiresLabel(spot.expires_at),
        expiresAt: spot.expires_at,
        link: '/find',
      }
    }

    async function loadFeaturedListings() {
      const nowIso = new Date().toISOString()

      const [
        { data: coachRows, error: coachError },
        { data: teamRows, error: teamError },
        { data: playerBoardRows, error: playerBoardError },
        { data: rosterSpotRows, error: rosterSpotError },
        { count: coachesCount, error: coachesCountError },
        { count: teamsCount, error: teamsCountError },
        { data: coachStates, error: coachStatesError },
        { data: teamStates, error: teamStatesError },
        { data: facilityStates, error: facilityStatesError },
      ] = await Promise.all([
                supabase
          .from('coaches')
          .select('id, name, sport, specialty, age_groups, city, state, featured_rank, active, approval_status, featured_status')
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .eq('featured_status', true)
          .order('featured_rank', { ascending: true, nullsFirst: false })
          .limit(2),

        supabase
          .from('travel_teams')
          .select('id, name, sport, classification, age_group, city, state, tryout_status, featured_rank, active, approval_status, featured_status')
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .eq('featured_status', true)
          .order('featured_rank', { ascending: true, nullsFirst: false })
          .limit(2),

        supabase
          .from('player_board')
          .select('id, post_type, sport, player_age, age_group, player_position, position_needed, team_name, city, state, expires_at, created_at, active, approval_status')
          .eq('active', true)
          .in('approval_status', ['pending', 'approved'])
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('roster_spots')
          .select('id, sport, team_name, age_group, positions_needed, city, state, expires_at, created_at, active, approval_status')
          .eq('active', true)
          .in('approval_status', ['pending', 'approved'])
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false })
          .limit(3),

        supabase
          .from('coaches')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded']),

        supabase
          .from('travel_teams')
          .select('*', { count: 'exact', head: true })
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded']),

        supabase
          .from('coaches')
          .select('state')
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .not('state', 'is', null),

        supabase
          .from('travel_teams')
          .select('state')
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .not('state', 'is', null),

        supabase
          .from('facilities')
          .select('state')
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .not('state', 'is', null),
      ])

      if (!cancelled) {
        if (coachError) {
          console.error('HomePage featured coaches load error:', coachError)
          setFeaturedCoaches([])
        } else {
          setFeaturedCoaches(
            (coachRows || []).map((coach) => ({
              id: coach.id,
              type: 'coach',
              name: coach.name,
              meta: formatCoachMeta(coach),
              location: formatCoachLocation(coach),
              distance: 'Featured',
              sport: normalizeSportValue(coach.sport),
              badge: 'Coach',
              badgeStyle: { background: '#e8f2fc', color: '#0c4a8a' },
              link: `/coaches?select=${coach.id}`,
            }))
          )
        }

        if (teamError) {
          console.error('HomePage featured teams load error:', teamError)
          setFeaturedTeams([])
        } else {
          setFeaturedTeams(
            (teamRows || []).map((team) => {
              const badgeInfo = getTeamBadge(team)

              return {
                id: team.id,
                type: 'team',
                name: team.name,
                meta: formatTeamMeta(team),
                location: formatTeamLocation(team),
                distance: 'Featured',
                sport: normalizeSportValue(team.sport),
                badge: badgeInfo.badge,
                badgeStyle: badgeInfo.badgeStyle,
                link: `/teams?select=${team.id}`,
              }
            })
          )
        }

        if (playerBoardError) {
          console.error('HomePage urgent player board load error:', playerBoardError)
        }

        if (rosterSpotError) {
          console.error('HomePage urgent roster spots load error:', rosterSpotError)
        }

        const normalizedUrgentPosts = [
          ...((playerBoardRows || []).map(normalizePlayerBoardPost)),
          ...((rosterSpotRows || []).map(normalizeRosterSpotPost)),
        ]
          .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
          .slice(0, 3)

        setUrgentPosts(normalizedUrgentPosts)

                if (coachesCountError) {
          console.error('HomePage coaches count load error:', coachesCountError)
        }

        if (teamsCountError) {
          console.error('HomePage travel teams count load error:', teamsCountError)
        }

        if (coachStatesError) {
          console.error('HomePage coach states load error:', coachStatesError)
        }

        if (teamStatesError) {
          console.error('HomePage team states load error:', teamStatesError)
        }

        if (facilityStatesError) {
          console.error('HomePage facility states load error:', facilityStatesError)
        }

        const uniqueStates = new Set(
          [...(coachStates || []), ...(teamStates || []), ...(facilityStates || [])]
            .map((row) => String(row.state || '').trim().toUpperCase())
            .filter(Boolean)
        )

        setHomepageStats({
          coachesCount: coachesCount || 0,
          teamsCount: teamsCount || 0,
          statesCovered: uniqueStates.size,
        })
      }
    }

     loadFeaturedListings()

    return () => {
      cancelled = true
    }
  }, [])

  function handleSearch(e) {
    e.preventDefault()

    const params = new URLSearchParams()

    if (query) params.set('q', query)
    if (sport) params.set('sport', sport)
    if (zip) params.set('zip', zip)
    if (listingType) params.set('type', listingType)
    if (ageGroup) params.set('age', ageGroup)
    if (radius !== 25) params.set('radius', radius)

    navigate('/search?' + params.toString())
  }

  const pillStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: '#fff',
    border: '1px solid #ddddd8',
    borderRadius: 10,
    padding: isMobile ? '8px 12px' : '5px 11px',
    fontSize: isMobile ? 14 : 12,
    color: '#444',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
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
  }

  const actionRows = [
    {
      to: '/coaches',
      iconBg: '#fef0ee',
      iconEmoji: String.fromCodePoint(0x1f3af),
      title: 'Find Instruction',
      body: 'Private coaches, hitting labs, pitching specialists, catching coaches, and strength trainers.',
    },
    {
      to: '/facilities',
      iconBg: '#e8f4ff',
      iconEmoji: String.fromCodePoint(0x1f3df),
      title: 'Find a Facility',
      body: 'Training facilities, batting cages, indoor complexes, and practice venues near you.',
    },
    {
      to: '/teams',
      iconBg: '#eaf3de',
      iconEmoji: String.fromCodePoint(0x1f3c6),
      title: 'Find a Team',
      body: 'Travel teams, open rosters, and tryout opportunities by age group and area.',
    },
    {
      to: '/find',
      iconBg: '#fef9ee',
      iconEmoji: String.fromCodePoint(0x26a1),
      title: 'Pickup Help / Looking to Play',
      body: 'Need a player, a team, or a game? Browse or post urgent needs fast.',
    },
  ]

  const howItWorks = [
    {
      n: '01',
      title: 'Enter your ZIP',
      body: "Set your location and how far you're willing to travel.",
    },
    {
      n: '02',
      title: 'Browse listings',
      body: 'Find coaches, teams, facilities, and pickup posts that fit your needs.',
    },
    {
      n: '03',
      title: 'Connect directly',
      body: 'Use the listing details to reach out and get started.',
    },
  ]

  const pageShell = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: isMobile ? '0 0 96px' : '0 0 48px',
    background: '#fff',
    color: DARK,
    overflowX: 'clip',
  }

  const col = {
    padding: isMobile ? '0 12px' : '0 20px',
  }

  const homepageStatsItems = [
    {
      num: `${homepageStats.coachesCount}+`,
      label: 'Coaches listed',
    },
    {
      num: `${homepageStats.teamsCount}+`,
      label: 'Travel teams',
    },
    {
      num: String(homepageStats.statesCovered),
      label: 'States covered',
    },
    {
      num: 'Free',
      label: 'Always free to browse',
    },
  ]

  return (
    <div style={pageShell}>
      {!isMobile && (
        <HomePageAdBand
          slotKey="homepage_top_1_desktop"
          maxWidth={970}
          reservedHeight={90}
          isMobile={isMobile}
          marginTop={16}
        />
      )}

      <div style={{ marginTop: 16 }}>
        <div style={col}>
          <section
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: isMobile ? '20px 14px 16px' : '28px 28px 22px',
              border: '1px solid ' + BORDER,
              borderLeft: '4px solid ' + NAVY,
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? 24 : 28,
                fontWeight: 500,
                color: DARK,
                lineHeight: 1.22,
                margin: '0 0 6px',
              }}
            >
              Find <span style={{ color: NAVY }}>coaches, teams &amp; facilities</span> near you.
            </h1>

            <p
              style={{
                fontSize: isMobile ? 14 : 15,
                color: MUTED,
                marginBottom: 18,
                lineHeight: 1.5,
              }}
            >
              Baseball and softball &mdash; coaches, travel teams, training facilities, open
              rosters, and pickup help all in one place.
            </p>

            <form
              onSubmit={handleSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fff',
                border: '1.5px solid #d8d8d2',
                borderRadius: 10,
                padding: isMobile ? '0 5px 0 10px' : '0 6px 0 14px',
                height: isMobile ? 50 : 48,
                gap: 8,
                marginBottom: 12,
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
                placeholder="Search coaches, teams, facilities, positions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: isMobile ? 16 : 15,
                  color: DARK,
                  background: 'none',
                  minWidth: 0,
                }}
              />

              <button
                type="submit"
                style={{
                  background: NAVY,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  height: isMobile ? 40 : 36,
                  padding: isMobile ? '0 16px' : '0 20px',
                  fontSize: isMobile ? 15 : 14,
                  fontWeight: 600,
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
                gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, minmax(0, 1fr))',
                gap: 10,
                alignItems: 'stretch',
              }}
            >
              <div style={pillStyle}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
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
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.2" fill="none" />
                  <circle cx="6" cy="6" r="1.5" fill="#aaa" />
                </svg>

                <span
                  style={{
                    fontSize: isMobile ? 14 : 12,
                    color: '#888',
                    flexShrink: 0,
                    marginRight: 2,
                  }}
                >
                  Within
                </span>

                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  {SEARCH_RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r} mi
                    </option>
                  ))}
                </select>
              </div>

              <div style={pillStyle}>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  style={selectStyle}
                >
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
                  <option value="coach">Coach</option>
                  <option value="team">Team</option>
                  <option value="facility">Facility</option>
                  <option value="roster">Open Roster</option>
                </select>
              </div>

              <div style={pillStyle}>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">All ages</option>
                  {['8U', '10U', '12U', '13U', '14U', '15U', '16U', '17U', '18U'].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                fontSize: isMobile ? 13 : 12,
                color: MUTED,
                marginTop: 10,
                lineHeight: 1.45,
              }}
            >
              Start with ZIP + distance for the cleanest nearby results. Keyword search is
              optional.
            </div>
          </section>
        </div>

        <div style={{ ...col, marginTop: 28 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: 10,
              background: '#edf2f8',
              borderRadius: 12,
              padding: isMobile ? '14px' : '18px 20px',
            }}
          >
            {homepageStatsItems.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: NAVY }}>{s.num}</div>
                <div style={{ fontSize: isMobile ? 13 : 12, color: MUTED, marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <HomePageBand>
          <div style={col}>
            <HomePageSectionHeader title="How it works" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: isMobile ? 0 : 10,
              }}
            >
              {howItWorks.map((s, idx) => (
                <div
                  key={s.n}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: isMobile ? '14px 4px' : '15px 13px',
                    borderBottom:
                      isMobile && idx !== howItWorks.length - 1 ? '1px solid ' + BORDER : 'none',
                    border: !isMobile ? '1px solid ' + BORDER : 'none',
                    borderRadius: !isMobile ? 12 : 0,
                    background: '#fff',
                  }}
                >
                  <div
                    style={{
                      minWidth: 34,
                      height: 34,
                      borderRadius: 999,
                      background: '#edf2f8',
                      color: NAVY,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {s.n}
                  </div>

                  <div>
                    <h4
                      style={{
                        fontSize: isMobile ? 16 : 14,
                        fontWeight: 600,
                        color: DARK,
                        margin: '0 0 4px',
                      }}
                    >
                      {s.title}
                    </h4>

                    <p
                      style={{
                        fontSize: isMobile ? 13 : 14,
                        color: MUTED,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </HomePageBand>

        <div style={{ ...col, marginTop: 28 }}>
          <HomePageSectionHeader title="What are you looking for?" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 12,
            }}
          >
            {actionRows.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                style={{
                  border: '1px solid ' + BORDER,
                  borderRadius: 14,
                  padding: isMobile ? '16px 14px' : '18px 16px 14px',
                  background: '#fff',
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div
                    style={{
                      width: isMobile ? 44 : 38,
                      height: isMobile ? 44 : 38,
                      borderRadius: 12,
                      background: card.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? 22 : 17,
                      flexShrink: 0,
                    }}
                  >
                    {card.iconEmoji}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: isMobile ? 18 : 15,
                        fontWeight: 600,
                        color: DARK,
                        margin: '0 0 4px',
                      }}
                    >
                      {card.title}
                    </h3>

                    <p
                      style={{
                       fontSize: isMobile ? 13 : 14,
                        color: MUTED,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {card.body}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: isMobile ? 22 : 14,
                    color: RED,
                    flexShrink: 0,
                  }}
                >
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>

        <HomePageAdBand
          slotKey={isMobile ? 'homepage_inline_1_mobile' : 'homepage_inline_1_desktop'}
          maxWidth={isMobile ? 320 : 970}
          reservedHeight={isMobile ? 100 : 250}
          isMobile={isMobile}
          marginTop={24}
        />

        <HomePageBand style={{ marginTop: 28 }}>
          <div style={col}>
            <HomePageSectionHeader
              title="Featured coaches"
              linkTo="/coaches"
              linkLabel="View all →"
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: 10,
              }}
            >
              {featuredCoaches.map((listing) => (
                <FeaturedCard key={listing.id} listing={listing} isMobile={isMobile} />
              ))}
            </div>
          </div>
        </HomePageBand>

        <div style={{ ...col, marginTop: 28 }}>
          <HomePageSectionHeader title="Featured teams" linkTo="/teams" linkLabel="View all →" />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {featuredTeams.map((listing) => (
              <FeaturedCard key={listing.id} listing={listing} isMobile={isMobile} />
            ))}
          </div>
        </div>

        <HomePageBand style={{ marginTop: 28 }}>
          <div style={col}>
            <HomePageSectionHeader
              title="Urgent pickup needs"
              linkTo="/find"
              linkLabel="View all →"
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
             {urgentPosts.length > 0 ? (
              urgentPosts.map((p) => (
                <Link
                  key={p.id}
                  to={p.link}
                  style={{
                    border: '1px solid #f5cfc9',
                    borderRadius: 12,
                    padding: '13px 14px',
                    background: '#fff',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                  }}
                >
                  <span
                    style={{
                      fontSize: isMobile ? 12 : 11,
                      fontWeight: 600,
                      color: '#b93025',
                      background: '#fdf0ee',
                      padding: '2px 7px',
                      borderRadius: 4,
                      display: 'inline-block',
                      marginBottom: 7,
                    }}
                  >
                    {p.postType}
                  </span>

                  <div
                    style={{
                      fontSize: isMobile ? 16 : 15,
                      fontWeight: 600,
                      color: DARK,
                      marginBottom: 4,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.title}
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 14 : 13,
                      color: MUTED,
                      marginBottom: 6,
                    }}
                  >
                    {p.meta}
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 12 : 11,
                      color: FAINT,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: RED,
                        flexShrink: 0,
                      }}
                    />
                    {p.expires}
                  </div>
                </Link>
              ))
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  border: '1px solid #e2e0db',
                  borderRadius: 12,
                  padding: isMobile ? '18px 14px' : '20px 18px',
                  background: '#fff',
                  color: MUTED,
                  fontSize: isMobile ? 14 : 13,
                  lineHeight: 1.5,
                }}
              >
                No active pickup needs at this time.
              </div>
              )}
            </div>
          </div>
        </HomePageBand>

        <div style={{ ...col, marginTop: 24, paddingBottom: 8 }}>
          <section
            style={{
              background: NAVY,
              borderRadius: 14,
              padding: isMobile ? '22px 18px' : '26px 28px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? 18 : 24,
            }}
          >
            <div style={{ maxWidth: isMobile ? '100%' : 420 }}>
              <h2
                style={{
                  fontSize: isMobile ? 22 : 18,
                  fontWeight: 600,
                  color: '#fff',
                  margin: '0 0 8px',
                  lineHeight: 1.2,
                }}
              >
                Are you a coach or team?
              </h2>

              <p
                style={{
                  fontSize: isMobile ? 15 : 14,
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                Add a free listing or claim an existing one to manage your profile.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <Link
                to="/submit"
                style={{
                  background: RED,
                  color: '#fff',
                  borderRadius: 10,
                  padding: isMobile ? '13px 18px' : '9px 20px',
                  fontSize: isMobile ? 16 : 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                Add a listing
              </Link>

              <Link
                to="/claim"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10,
                  padding: isMobile ? '13px 18px' : '9px 20px',
                  fontSize: isMobile ? 16 : 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                Claim a listing
              </Link>
            </div>
          </section>
        </div>

        <HomePageAdBand
          slotKey={isMobile ? 'homepage_footer_1_mobile' : 'homepage_footer_1_desktop'}
          maxWidth={isMobile ? 320 : 970}
          reservedHeight={isMobile ? 100 : 90}
          isMobile={isMobile}
          marginTop={20}
        />
      </div>
    </div>
  )
}