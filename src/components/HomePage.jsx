import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdSlot from './AdSlot'

// ─── Sample data ──────────────────────────────────────────────────────────────
// TODO: Replace with live Supabase queries once zip/radius search is wired up.

const FEATURED_LISTINGS = [
  { id: 1, type: 'coach', name: 'Mike Torres',           meta: 'Pitching · Baseball · Ages 10–18', location: 'Roswell, GA',    distance: '8 mi',  sport: 'baseball', badge: 'Coach',        badgeStyle: { background: '#e8f2fc', color: '#0c4a8a' }, link: '/coaches' },
  { id: 2, type: 'team',  name: 'North Georgia Elite 13U', meta: 'Travel Baseball · 13U',          location: 'Alpharetta, GA', distance: '12 mi', sport: 'baseball', badge: 'Open Roster',  badgeStyle: { background: '#fff3e0', color: '#7a4200' }, link: '/teams' },
  { id: 3, type: 'coach', name: 'Sarah Kim',             meta: 'Hitting · Softball · All ages',    location: 'Marietta, GA',   distance: '14 mi', sport: 'softball', badge: 'Coach',        badgeStyle: { background: '#e8f2fc', color: '#0c4a8a' }, link: '/coaches' },
  { id: 4, type: 'team',  name: 'Cherokee 14U Gold',     meta: 'Travel Baseball · 14U',            location: 'Canton, GA',     distance: '18 mi', sport: 'baseball', badge: 'Tryouts Open', badgeStyle: { background: '#f0eefe', color: '#3d2fa0' }, link: '/teams' },
]

const URGENT_POSTS = [
  { id: 1, postType: 'Need player', title: 'Catcher needed — Sun 3/17',   meta: '12U · Alpharetta · Baseball', expires: 'Expires in 18 hrs' },
  { id: 2, postType: 'Need team',   title: 'Two 14U players available',   meta: 'P / OF · Marietta · Baseball', expires: 'Expires in 2 days' },
  { id: 3, postType: 'Need player', title: 'Utility player needed ASAP',  meta: '10U · Kennesaw · Softball',   expires: 'Expires in 3 days' },
]

const SPORT_ICON = { baseball: '⚾', softball: '🥎' }

// ─── Shared style tokens ──────────────────────────────────────────────────────
const RED    = '#e63329'
const DARK   = '#1a1a1a'
const LIGHT  = '#f5f5f2'
const BORDER = '#eaeae6'
const MUTED  = '#888'
const FAINT  = '#bbb'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, margin: '26px 0 0' }} />
}

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#999' }}>
        {title}
      </span>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: 12, fontWeight: 500, color: RED, textDecoration: 'none' }}>
          {linkLabel || 'View all →'}
        </Link>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()

  const [query,       setQuery]       = useState('')
  const [sport,       setSport]       = useState('')
  const [zip,         setZip]         = useState('')
  const [listingType, setListingType] = useState('')
  const [ageGroup,    setAgeGroup]    = useState('')
  const [radius,      setRadius]      = useState(25)

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query)       params.set('q',      query)
    if (sport)       params.set('sport',  sport)
    if (zip)         params.set('zip',    zip)
    if (listingType) params.set('type',   listingType)
    if (ageGroup)    params.set('age',    ageGroup)
    if (radius !== 25) params.set('radius', radius)
    navigate(`/coaches?${params.toString()}`)
  }

  // ── Pill / filter styles
  const pillStyle = {
    display: 'flex', alignItems: 'center', gap: 5,
    background: '#fff', border: `1px solid #ddddd8`, borderRadius: 7,
    padding: '5px 11px', fontSize: 12, color: '#444',
    whiteSpace: 'nowrap', cursor: 'pointer',
  }
  const selectStyle = { border: 'none', outline: 'none', background: 'none', fontSize: 12, color: '#444', cursor: 'pointer', padding: 0 }
  const sepStyle = { color: '#ccc', fontSize: 12, flexShrink: 0 }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 48px', background: '#fff', color: DARK }}>

      {/* ── AD: Top leaderboard ───────────────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <AdSlot position="leaderboard-top" />
      </div>

      {/* ── SEARCH HERO ───────────────────────────────────────────────────── */}
      <section style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 22px', marginTop: 16, borderTop: `4px solid ${RED}`, border: `1px solid ${BORDER}`, borderTopWidth: 4, borderTopColor: RED }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: DARK, lineHeight: 1.22, margin: '0 0 6px' }}>
          Find{' '}
          <span style={{ color: RED }}>coaches, teams</span>
          {' '}&amp; roster openings.
        </h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 18, lineHeight: 1.5 }}>
          Baseball and softball — coaches, travel teams, open rosters, and pickup help near you.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1.5px solid #d8d8d2`, borderRadius: 10, padding: '0 6px 0 14px', height: 48, gap: 8, marginBottom: 12 }}
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
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, color: DARK, background: 'none', minWidth: 0 }}
          />
          <button
            type="submit"
            style={{ background: RED, color: '#fff', border: 'none', borderRadius: 7, height: 36, padding: '0 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
          >
            Search
          </button>
        </form>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <div style={pillStyle}>
            <select value={sport} onChange={e => setSport(e.target.value)} style={selectStyle}>
              <option value="">All sports</option>
              <option value="baseball">Baseball</option>
              <option value="softball">Softball</option>
            </select>
          </div>
          <span style={sepStyle}>·</span>
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
          <span style={sepStyle}>·</span>
          <div style={pillStyle}>
            <select value={listingType} onChange={e => setListingType(e.target.value)} style={selectStyle}>
              <option value="">All types</option>
              <option value="coach">Coach</option>
              <option value="team">Team</option>
              <option value="roster">Open Roster</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>
          <span style={sepStyle}>·</span>
          <div style={pillStyle}>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={selectStyle}>
              <option value="">All ages</option>
              {['8U','10U','12U','13U','14U','15U','16U','17U','18U'].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <span style={sepStyle}>·</span>
          <div style={{ ...pillStyle, gap: 6 }}>
            <span style={{ fontSize: 12, color: '#444' }}>Within</span>
            <input
              type="range" min={5} max={100} step={5} value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              style={{ width: 72, accentColor: RED, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, fontWeight: 500, color: DARK, minWidth: 32 }}>{radius} mi</span>
          </div>
        </div>
      </section>

      {/* ── PATHWAYS ──────────────────────────────────────────────────────── */}
      <section style={{ marginTop: 26 }}>
        <SectionHeader title="What are you looking for?" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { to: '/coaches', icon: '🎯', iconBg: '#fef0ee', title: 'Find Instruction', body: 'Private coaches, hitting labs, pitching specialists, catching coaches, and strength trainers.', cta: 'Browse coaches →' },
            { to: '/teams',   icon: '🏆', iconBg: '#eaf3de', title: 'Find a Team',       body: 'Travel teams, open rosters, and tryout opportunities by age group and area.',                  cta: 'Browse teams →' },
            { to: '/find',    icon: '⚡', iconBg: '#fef9ee', title: 'Pickup Help',       body: 'Need a player this weekend? Looking for a game? Post or browse urgent needs fast.',            cta: 'View pickup board →' },
          ].map(card => (
            <Link key={card.to} to={card.to} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 16px 14px', background: '#fff', textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>
                {card.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: DARK, marginBottom: 5 }}>{card.title}</h3>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginBottom: 10 }}>{card.body}</p>
              <span style={{ fontSize: 12, fontWeight: 500, color: RED }}>{card.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── TWO-COLUMN: listings + sidebar ads ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 22, alignItems: 'start', marginTop: 26 }}>

        {/* Main column */}
        <div style={{ minWidth: 0 }}>
          <SectionHeader title="Featured near you" linkTo="/coaches" linkLabel="View all →" />

          {/* Featured listing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FEATURED_LISTINGS.map(l => (
              <Link key={l.id} to={l.link} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 15px', background: '#fff', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: DARK, lineHeight: 1.3 }}>{l.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8, ...l.badgeStyle }}>{l.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: '#777', marginBottom: 3 }}>{l.meta}</div>
                <div style={{ fontSize: 11, color: FAINT, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ddd', flexShrink: 0 }} />
                  {l.location} · {l.distance}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid #f2f2ee`, paddingTop: 9 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: RED }}>{l.type === 'coach' ? 'View profile' : 'View team'} →</span>
                  <span style={{ fontSize: 10, color: FAINT }}>{SPORT_ICON[l.sport]} {l.sport.charAt(0).toUpperCase() + l.sport.slice(1)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* AD: Inline rectangle */}
          <div style={{ marginTop: 16 }}>
            <AdSlot position="inline-rectangle" />
          </div>

          {/* Urgent pickup posts */}
          <div style={{ marginTop: 20 }}>
            <SectionHeader title="Urgent pickup needs" linkTo="/find" linkLabel="View all →" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {URGENT_POSTS.map(p => (
                <Link key={p.id} to="/find" style={{ border: '1px solid #f5cfc9', borderRadius: 12, padding: '13px 14px', background: '#fff', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <span style={{ fontSize: 10, fontWeight: 500, color: '#b93025', background: '#fdf0ee', padding: '2px 7px', borderRadius: 4, display: 'inline-block', marginBottom: 7 }}>
                    {p.postType}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 500, color: DARK, marginBottom: 4, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>{p.meta}</div>
                  <div style={{ fontSize: 10, color: FAINT, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: RED, flexShrink: 0 }} />
                    {p.expires}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar ad column */}
        <aside style={{ width: 190, flexShrink: 0 }}>
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AdSlot position="sidebar-half-page" />
            <AdSlot position="sidebar-square" />
          </div>
        </aside>
      </div>

      <Divider />

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section style={{ marginTop: 26 }}>
        <SectionHeader title="How it works" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { n: '01', title: 'Enter your zip',  body: "Set your location and how far you're willing to travel." },
            { n: '02', title: 'Browse listings', body: 'Filter by sport, age group, listing type, and specialty.' },
            { n: '03', title: 'Connect directly', body: 'Contact coaches, teams, or families through their listing.' },
            { n: '04', title: 'Add your listing', body: 'Coaches and teams can submit a free listing in minutes.' },
          ].map(s => (
            <div key={s.n} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '15px 13px' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: RED, letterSpacing: '0.05em', marginBottom: 7 }}>{s.n}</div>
              <h4 style={{ fontSize: 13, fontWeight: 500, color: DARK, marginBottom: 5 }}>{s.title}</h4>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
      <section style={{ marginTop: 26 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: LIGHT, borderRadius: 12, padding: '18px 20px' }}>
          {[
            { num: '200+', label: 'Coaches listed' },
            { num: '80+',  label: 'Travel teams' },
            { num: '15',   label: 'Counties covered' },
            { num: 'Free', label: 'Always free to browse' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 500, color: DARK }}>{s.num}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AD: Pre-footer leaderboard ────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <AdSlot position="leaderboard-prefooter" />
      </div>

      {/* ── CTA BLOCK ─────────────────────────────────────────────────────── */}
      <section style={{ background: DARK, borderRadius: 14, padding: '26px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginTop: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 5 }}>Are you a coach or team?</h2>
          <p style={{ fontSize: 13, color: MUTED }}>Add a free listing or claim an existing one to manage your profile.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Link to="/submit" style={{ background: RED, color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Add a listing
          </Link>
          <Link to="/claim" style={{ background: 'transparent', color: '#fff', border: '1px solid #444', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Claim a listing
          </Link>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ marginTop: 30, borderTop: `1px solid ${BORDER}`, paddingTop: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 24, paddingBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', color: DARK, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
              <span style={{ color: RED }}>◆</span> SANDLOT SOURCE
            </div>
            <p style={{ fontSize: 12, color: '#aaa', lineHeight: 1.65 }}>
              Baseball &amp; softball coaches, teams, and roster connections — free to browse, anywhere in the country.
            </p>
          </div>
          {[
            { heading: 'Directory', links: [{ label: 'Coaches', to: '/coaches' }, { label: 'Teams', to: '/teams' }, { label: 'Open Rosters', to: '/roster' }, { label: 'Pickup Board', to: '/find' }] },
            { heading: 'Listings',  links: [{ label: 'Add a Listing', to: '/submit' }, { label: 'Claim a Listing', to: '/claim' }, { label: 'About', to: '/about' }, { label: 'Contact', href: 'mailto:admin.bsbldirectory@gmail.com' }] },
            { heading: 'Legal',     links: [{ label: 'Privacy Policy', to: '/privacy' }, { label: 'Terms of Use', to: '/terms' }, { label: 'Disclaimer', to: '/disclaimer' }] },
          ].map(col => (
            <div key={col.heading}>
              <h5 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: FAINT, marginBottom: 10 }}>{col.heading}</h5>
              {col.links.map(l => l.href
                ? <a key={l.label} href={l.href} style={{ display: 'block', fontSize: 12, color: '#777', textDecoration: 'none', marginBottom: 6 }}>{l.label}</a>
                : <Link key={l.label} to={l.to} style={{ display: 'block', fontSize: 12, color: '#777', textDecoration: 'none', marginBottom: 6 }}>{l.label}</Link>
              )}
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: FAINT }}>© {new Date().getFullYear()} Sandlot Source. All rights reserved.</span>
          <span style={{ fontSize: 11, color: FAINT }}>Baseball &amp; Softball Directory</span>
        </div>
      </footer>

    </div>
  )
}
