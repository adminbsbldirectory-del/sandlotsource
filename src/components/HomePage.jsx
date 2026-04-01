import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdSlot from './AdSlot'
import { SEARCH_RADIUS_OPTIONS } from '../constants/radiusOptions'

const FEATURED_LISTINGS = [
  {
    id: 1,
    type: 'coach',
    name: 'Mike Torres',
    meta: 'Pitching - Baseball - Ages 10-18',
    location: 'Roswell, GA',
    distance: '8 mi',
    sport: 'baseball',
    badge: 'Coach',
    badgeStyle: { background: '#e8f2fc', color: '#0c4a8a' },
    link: '/coaches',
  },
  {
    id: 2,
    type: 'team',
    name: 'North Georgia Elite 13U',
    meta: 'Travel Baseball - 13U',
    location: 'Alpharetta, GA',
    distance: '12 mi',
    sport: 'baseball',
    badge: 'Open Roster',
    badgeStyle: { background: '#fff3e0', color: '#7a4200' },
    link: '/teams',
  },
  {
    id: 3,
    type: 'coach',
    name: 'Sarah Kim',
    meta: 'Hitting - Softball - All ages',
    location: 'Marietta, GA',
    distance: '14 mi',
    sport: 'softball',
    badge: 'Coach',
    badgeStyle: { background: '#e8f2fc', color: '#0c4a8a' },
    link: '/coaches',
  },
  {
    id: 4,
    type: 'team',
    name: 'Cherokee 14U Gold',
    meta: 'Travel Baseball - 14U',
    location: 'Canton, GA',
    distance: '18 mi',
    sport: 'baseball',
    badge: 'Tryouts Open',
    badgeStyle: { background: '#f0eefe', color: '#3d2fa0' },
    link: '/teams',
  },
]

const URGENT_POSTS = [
  {
    id: 1,
    postType: 'Need player',
    title: 'Catcher needed - Sun 3/17',
    meta: '12U - Alpharetta - Baseball',
    expires: 'Expires in 18 hrs',
  },
  {
    id: 2,
    postType: 'Need team',
    title: 'Two 14U players available',
    meta: 'P / OF - Marietta - Baseball',
    expires: 'Expires in 2 days',
  },
  {
    id: 3,
    postType: 'Need player',
    title: 'Utility player needed ASAP',
    meta: '10U - Kennesaw - Softball',
    expires: 'Expires in 3 days',
  },
]

const SPORT_LABEL = {
  baseball: 'Baseball',
  softball: 'Softball',
}

const RED = '#e63329'
const NAVY = '#1b3a5c'
const DARK = '#1a1a1a'
const LIGHT = '#f5f4f0'
const BORDER = '#e2e0db'
const MUTED = '#888'
const FAINT = '#bbb'



function Band({ children, style }) {
  return (
    <div
      style={{
        background: LIGHT,
        borderTop: '1px solid ' + BORDER,
        borderBottom: '1px solid ' + BORDER,
        padding: '24px 0',
        marginTop: 24,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: NAVY,
        }}
      >
        {title}
      </span>

      {linkTo && (
        <Link
          to={linkTo}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: RED,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {linkLabel || 'View all'}
        </Link>
      )}
    </div>
  )
}

function FeaturedCard({ listing, isMobile }) {
  return (
    <Link
      to={listing.link}
      style={{
        border: '1px solid ' + BORDER,
        borderRadius: 12,
        padding: isMobile ? '12px 14px' : '14px 15px',
        background: '#fff',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 4,
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 16 : 14,
            fontWeight: 600,
            color: DARK,
            lineHeight: 1.28,
          }}
        >
          {listing.name}
        </span>

        <span
          style={{
            fontSize: isMobile ? 11 : 10,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...listing.badgeStyle,
          }}
        >
          {listing.badge}
        </span>
      </div>

      <div style={{ fontSize: isMobile ? 14 : 12, color: '#777', marginBottom: 3 }}>
        {listing.meta}
      </div>

      <div
        style={{
          fontSize: isMobile ? 12 : 11,
          color: FAINT,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#ddd',
            flexShrink: 0,
          }}
        />
        {listing.location} &middot; {listing.distance}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #f2f2ee',
          paddingTop: 8,
        }}
      >
        <span style={{ fontSize: isMobile ? 13 : 12, fontWeight: 600, color: RED }}>
          {listing.type === 'coach' ? 'View profile' : 'View team'} &rarr;
        </span>
        <span style={{ fontSize: isMobile ? 12 : 10, color: FAINT }}>
          {SPORT_LABEL[listing.sport]}
        </span>
      </div>
    </Link>
  )
}

function HomePageAdBand({ slotKey, maxWidth, reservedHeight, isMobile, marginTop = 24 }) {
  return (
    <div
      style={{
        background: LIGHT,
        borderTop: '1px solid ' + BORDER,
        borderBottom: '1px solid ' + BORDER,
        padding: isMobile ? '16px 0' : '18px 0',
        marginTop,
      }}
    >
      <div style={{ padding: isMobile ? '0 12px' : '0 20px' }}>
        <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: '0 0 8px 2px',
            }}
          >
            Sponsored
          </div>

          <div
            style={{
              minHeight: reservedHeight,
              background: '#fff',
              border: '1px solid ' + BORDER,
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

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  const featuredCoaches = useMemo(
    () => FEATURED_LISTINGS.filter((l) => l.type === 'coach').slice(0, 2),
    []
  )

  const featuredTeams = useMemo(
    () => FEATURED_LISTINGS.filter((l) => l.type === 'team').slice(0, 2),
    []
  )

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

        <Band>
          <div style={col}>
            <SectionHeader title="How it works" />

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
                        fontSize: isMobile ? 16 : 13,
                        fontWeight: 600,
                        color: DARK,
                        margin: '0 0 4px',
                      }}
                    >
                      {s.title}
                    </h4>

                    <p
                      style={{
                        fontSize: isMobile ? 13 : 11,
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
        </Band>

        <div style={{ ...col, marginTop: 28 }}>
          <SectionHeader title="What are you looking for?" />

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
                        fontSize: isMobile ? 18 : 14,
                        fontWeight: 600,
                        color: DARK,
                        margin: '0 0 4px',
                      }}
                    >
                      {card.title}
                    </h3>

                    <p
                      style={{
                        fontSize: isMobile ? 13 : 12,
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

        <Band style={{ marginTop: 28 }}>
          <div style={col}>
            <SectionHeader title="Featured coaches" linkTo="/coaches" linkLabel="View all →" />

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
        </Band>

        <div style={{ ...col, marginTop: 28 }}>
          <SectionHeader title="Featured teams" linkTo="/teams" linkLabel="View all →" />

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

        <Band style={{ marginTop: 28 }}>
          <div style={col}>
            <SectionHeader title="Urgent pickup needs" linkTo="/find" linkLabel="View all →" />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {URGENT_POSTS.map((p) => (
                <Link
                  key={p.id}
                  to="/find"
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
                      fontSize: isMobile ? 12 : 10,
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
                      fontSize: isMobile ? 16 : 13,
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
                      fontSize: isMobile ? 14 : 11,
                      color: MUTED,
                      marginBottom: 6,
                    }}
                  >
                    {p.meta}
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 12 : 10,
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
              ))}
            </div>
          </div>
        </Band>

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
            {[
              { num: '200+', label: 'Coaches listed' },
              { num: '80+', label: 'Travel teams' },
              { num: '15', label: 'Counties covered' },
              { num: 'Free', label: 'Always free to browse' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: NAVY }}>{s.num}</div>
                <div style={{ fontSize: isMobile ? 13 : 11, color: MUTED, marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

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
                  fontSize: isMobile ? 15 : 13,
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
                  fontSize: isMobile ? 16 : 13,
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
                  fontSize: isMobile ? 16 : 13,
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