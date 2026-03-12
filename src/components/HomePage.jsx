import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const DEMO_FEATURED_COACHES = [
  { id:1, name:'David Sopilka', sport:'baseball', specialty:['catching'], city:'Chamblee', county:'DeKalb', facility_name:'El Dojo', tier:'elite', credentials:'Elite catching development' },
  { id:2, name:'Cristoforo Romano', sport:'baseball', specialty:['pitching'], city:'Marietta', county:'Cobb', facility_name:'Harrison Park', tier:'elite', credentials:'Former Detroit Tigers & Brewers MiLB, Masters Biomechanics', price_per_session:70 },
  { id:3, name:'Hannah Lane Triplett', sport:'softball', specialty:['pitching'], city:'Watkinsville', county:'Oconee', facility_name:'Della Torre Softball', tier:'elite', credentials:'Top-tier softball pitching coach' },
]

const DEMO_FEATURED_TEAMS = [
  { id:1, name:'North Georgia Nationals', sport:'baseball', age_group:'12U', city:'Alpharetta', org_affiliation:'USSSA', tryout_status:'open' },
  { id:2, name:'Cherokee Crush', sport:'softball', age_group:'14U', city:'Canton', org_affiliation:'PGF', tryout_status:'open' },
  { id:3, name:'East Cobb Astros', sport:'baseball', age_group:'13U', city:'Marietta', org_affiliation:'Perfect Game', tryout_status:'closed' },
]

const DEMO_RECENT_POSTS = [
  { id:1, post_type:'team_need', sport:'baseball', team_name:'Cherokee Nationals 10U', age_group:'10U', position_needed:['catcher','shortstop'], city:'Canton', created_at:'2025-03-10' },
  { id:2, post_type:'player_available', sport:'softball', player_age:14, player_position:['pitcher'], city:'Woodstock', created_at:'2025-03-09' },
  { id:3, post_type:'team_need', sport:'softball', team_name:'Forsyth Fire 12U', age_group:'12U', position_needed:['pitcher'], city:'Cumming', created_at:'2025-03-08' },
]

const TIER_COLORS = { elite:'#D42B2B', strong:'#F0A500', local:'#0B1F3A', budget:'#6B7280' }
const STATUS_STYLE = {
  open:       { bg:'#DCFCE7', color:'#16A34A', label:'Open Tryouts' },
  closed:     { bg:'#FEE2E2', color:'#DC2626', label:'Closed' },
  by_invite:  { bg:'#FEF3C7', color:'#D97706', label:'By Invite' },
  year_round: { bg:'#DBEAFE', color:'#2563EB', label:'Year Round' },
}

function AdBanner({ label = 'Your Ad Here', height = 90 }) {
  return (
    <div style={{
      width: '100%', height,
      background: 'repeating-linear-gradient(45deg, #f0f0f0 0px, #f0f0f0 10px, #fafafa 10px, #fafafa 20px)',
      border: '2px dashed #d1d5db',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: '#9ca3af' }}>Advertise your baseball or softball business here</span>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-head)',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--gold)',
      marginBottom: 6,
    }}>{children}</div>
  )
}

function SectionHeading({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-head)',
      fontSize: 26, fontWeight: 800, color: 'var(--navy)',
      letterSpacing: '0.02em', lineHeight: 1.1,
      marginBottom: 20,
    }}>{children}</div>
  )
}

function SportBadge({ sport }) {
  return (
    <span style={{
      background: sport === 'softball' ? '#7C3AED' : '#1D4ED8',
      color: 'white', fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      fontFamily: 'var(--font-head)',
    }}>{sport}</span>
  )
}

export default function HomePage({ onNavigate }) {
  const [coaches, setCoaches] = useState(DEMO_FEATURED_COACHES)
  const [teams, setTeams] = useState(DEMO_FEATURED_TEAMS)
  const [posts, setPosts] = useState([])

  useEffect(() => {
    async function load() {
      const [coachRes, teamRes, postRes] = await Promise.all([
        supabase.from('coaches').select('*').eq('active', true).eq('tier', 'elite').limit(3),
        supabase.from('travel_teams').select('*').limit(3),
        supabase.from('player_board').select('*').eq('active', true).order('created_at', { ascending: false }).limit(3),
      ])
      if (!coachRes.error && coachRes.data?.length) setCoaches(coachRes.data)
      if (!teamRes.error && teamRes.data?.length) setTeams(teamRes.data)
      if (!postRes.error && postRes.data?.length) setPosts(postRes.data)
    }
    load()
  }, [])

  const openTryouts = teams.filter(t => t.tryout_status === 'open').length

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>

      {/* ── TOP HORIZONTAL BANNER AD ─────────────────────── */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--lgray)', padding: '10px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <AdBanner label="Top Banner — 728×90 Ad Space" height={72} />
        </div>
      </div>

      {/* ── HERO SECTION ─────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #162d52 60%, #1a3560 100%)',
        padding: '52px 20px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle background texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          {/* Brand badge in hero */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 40,
            padding: '8px 20px',
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 20 }}>⚾</span>
            <span style={{
              fontFamily: 'var(--font-head)',
              fontSize: 22, fontWeight: 900,
              color: 'var(--white)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>Sandlot Source</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)',
            fontSize: 'clamp(32px, 6vw, 58px)',
            fontWeight: 900, color: 'var(--white)',
            letterSpacing: '0.02em', lineHeight: 1.05,
            marginBottom: 18,
          }}>
            Your local baseball<br />& softball source.
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 17, color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.6, maxWidth: 560, margin: '0 auto 32px',
          }}>
            Find coaches, explore travel teams, and connect players with roster spots —
            all in one place for North Georgia families.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('coaches')} style={{
              background: 'var(--red)', color: 'white',
              border: 'none', borderRadius: 8,
              padding: '13px 26px',
              fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}>
              ⚾ Find Coaches
            </button>
            <button onClick={() => onNavigate('teams')} style={{
              background: 'rgba(255,255,255,0.12)', color: 'white',
              border: '2px solid rgba(255,255,255,0.3)', borderRadius: 8,
              padding: '13px 26px',
              fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
              Browse Teams
            </button>
            <button onClick={() => onNavigate('board')} style={{
              background: 'rgba(240,165,0,0.15)', color: 'var(--gold)',
              border: '2px solid rgba(240,165,0,0.4)', borderRadius: 8,
              padding: '13px 26px',
              fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}>
              Post Player Need
            </button>
          </div>

          {/* Quick trust stats */}
          <div style={{
            display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap',
            marginTop: 36, paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[
              { n: '33+', label: 'Coaches Listed' },
              { n: '371+', label: 'Travel Teams' },
              { n: openTryouts || '5+', label: 'Open Tryouts' },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── OPEN TRYOUTS BANNER ───────────────────────────── */}
      {openTryouts > 0 && (
        <div
          onClick={() => onNavigate('teams')}
          style={{
            background: '#DCFCE7', borderBottom: '2px solid #16A34A',
            padding: '10px 20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: '#15803D', fontWeight: 700 }}>
            ✅ {openTryouts} team{openTryouts !== 1 ? 's' : ''} currently accepting tryouts
          </span>
          <span style={{ fontSize: 12, color: '#15803D' }}>→ View open tryouts</span>
        </div>
      )}

      {/* ── MAIN CONTENT + SIDEBAR ───────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* ── LEFT: 3 LANES ──────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── LANE 1: Featured Coaches ──────────────────── */}
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Featured Coaches</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <SectionHeading>Find a Coach</SectionHeading>
              <button onClick={() => onNavigate('coaches')} style={{
                background: 'none', border: 'none', color: 'var(--red)',
                fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                whiteSpace: 'nowrap', paddingBottom: 20,
              }}>View All →</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {coaches.map(coach => {
                const specs = Array.isArray(coach.specialty) ? coach.specialty : (coach.specialty||'').split('|').filter(Boolean)
                const tierColor = TIER_COLORS[coach.tier] || TIER_COLORS.local
                return (
                  <div key={coach.id} onClick={() => onNavigate('coaches')} style={{
                    background: 'var(--white)', borderRadius: 10,
                    border: '2px solid var(--lgray)',
                    padding: '16px', cursor: 'pointer',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = tierColor; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lgray)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700 }}>{coach.name}</div>
                        {coach.facility_name && <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{coach.facility_name}</div>}
                        <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>📍 {coach.city}{coach.county ? `, ${coach.county}` : ''}</div>
                      </div>
                      <span style={{ background: tierColor, color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-head)', whiteSpace: 'nowrap' }}>{coach.tier}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      <SportBadge sport={coach.sport} />
                      {specs.map(s => (
                        <span key={s} style={{ background: 'var(--lgray)', color: 'var(--gray)', fontSize: 10, padding: '2px 7px', borderRadius: 20, textTransform: 'capitalize' }}>{s}</span>
                      ))}
                    </div>
                    {coach.credentials && (
                      <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.4 }}>
                        {coach.credentials.length > 70 ? coach.credentials.slice(0, 70) + '…' : coach.credentials}
                      </div>
                    )}
                    {coach.price_per_session && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>${coach.price_per_session}/session</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Internal promo — placeholder for future featured listing upsell */}
            <div onClick={() => onNavigate('submit')} style={{
              marginTop: 14,
              background: 'linear-gradient(90deg, #0B1F3A 0%, #162d52 100%)',
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'white' }}>Are you a coach?</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Add your profile and get discovered by local families.</div>
              </div>
              <span style={{ background: 'var(--gold)', color: 'var(--navy)', fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                Get Listed →
              </span>
            </div>
          </section>

          {/* ── MID-PAGE AD ───────────────────────────────── */}
          <div style={{ marginBottom: 48 }}>
            <AdBanner label="Mid-Page Banner — 728×90 Ad Space" height={90} />
          </div>

          {/* ── LANE 2: Travel Teams ──────────────────────── */}
          <section style={{ marginBottom: 48 }}>
            <SectionLabel>Travel Teams</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <SectionHeading>Explore Teams</SectionHeading>
              <button onClick={() => onNavigate('teams')} style={{
                background: 'none', border: 'none', color: 'var(--red)',
                fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                whiteSpace: 'nowrap', paddingBottom: 20,
              }}>View All →</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {teams.map(team => {
                const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.closed
                return (
                  <div key={team.id} onClick={() => onNavigate('teams')} style={{
                    background: 'var(--white)', borderRadius: 10,
                    border: '2px solid var(--lgray)', padding: '16px', cursor: 'pointer',
                    transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lgray)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, flex: 1 }}>{team.name}</div>
                      <span style={{ background: statusInfo.bg, color: statusInfo.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', fontFamily: 'var(--font-head)', textTransform: 'uppercase', marginLeft: 8 }}>{statusInfo.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>📍 {team.city}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <SportBadge sport={team.sport} />
                      {team.age_group && <span style={{ background: 'var(--navy)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-head)' }}>{team.age_group}</span>}
                      {team.org_affiliation && <span style={{ background: 'var(--lgray)', color: 'var(--gray)', fontSize: 10, padding: '2px 7px', borderRadius: 20 }}>{team.org_affiliation}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div onClick={() => onNavigate('submit')} style={{
              marginTop: 14,
              background: 'linear-gradient(90deg, #0B1F3A 0%, #162d52 100%)',
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: 'white' }}>Running a travel team?</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Get your team in front of players looking for a spot.</div>
              </div>
              <span style={{ background: 'var(--gold)', color: 'var(--navy)', fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 6, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                List Your Team →
              </span>
            </div>
          </section>

          {/* ── LANE 3: Player Needs ──────────────────────── */}
          <section style={{ marginBottom: 40 }}>
            <SectionLabel>Player Board</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <SectionHeading>Recent Player Needs</SectionHeading>
              <button onClick={() => onNavigate('board')} style={{
                background: 'none', border: 'none', color: 'var(--red)',
                fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer',
                whiteSpace: 'nowrap', paddingBottom: 20,
              }}>View All →</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {posts.map(post => {
                const isPlayer = post.post_type === 'player_available'
                const positions = isPlayer
                  ? (Array.isArray(post.player_position) ? post.player_position : [])
                  : (Array.isArray(post.position_needed) ? post.position_needed : [])
                return (
                  <div key={post.id} onClick={() => onNavigate('board')} style={{
                    background: 'var(--white)', borderRadius: 10,
                    border: `2px solid ${isPlayer ? '#DBEAFE' : '#FEF3C7'}`,
                    padding: '14px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'box-shadow 0.15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <div style={{
                      width: 40, height: 40, flexShrink: 0, borderRadius: 8,
                      background: isPlayer ? '#DBEAFE' : '#FEF3C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {isPlayer ? '🧢' : '⚾'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>
                        {isPlayer
                          ? `${post.player_age ? post.player_age + 'U ' : ''}Player — ${post.city}`
                          : `${post.team_name || 'Team'} ${post.age_group ? `· ${post.age_group}` : ''}`
                        }
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
                        {isPlayer ? 'Looking for a team' : `📍 ${post.city} · Seeking player`}
                        {positions.length > 0 && ` · ${positions.join(', ')}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <SportBadge sport={post.sport} />
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => onNavigate('board')} style={{
              marginTop: 14, width: '100%',
              background: 'var(--red)', color: 'white',
              border: 'none', borderRadius: 8,
              padding: '12px', cursor: 'pointer',
              fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              + Post a Player Need
            </button>
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────── */}
        <div style={{ width: 260, flexShrink: 0 }}>

          {/* Sidebar Ad */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--lgray)',
            borderRadius: 10, overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{ padding: '10px 14px', background: 'var(--lgray)', fontSize: 10, fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Featured Partner
            </div>
            <div style={{ padding: 14 }}>
              <AdBanner label="Sidebar — 300×250 Ad Space" height={200} />
            </div>
          </div>

          {/* Trust box */}
          <div style={{
            background: 'var(--white)', border: '2px solid var(--lgray)',
            borderRadius: 10, padding: '18px', marginBottom: 20,
          }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--navy)' }}>
              About Sandlot Source
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.6, marginBottom: 0 }}>
              Locally built for North Georgia baseball & softball families.
              Community-driven listings for coaches, travel teams, and player needs — no paywalls, no gatekeeping.
            </p>
          </div>

          {/* Quick links */}
          <div style={{
            background: 'var(--white)', border: '2px solid var(--lgray)',
            borderRadius: 10, overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{ padding: '10px 14px', background: 'var(--navy)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Quick Links
            </div>
            {[
              { label: '⚾ Find a Coach', tab: 'coaches' },
              { label: '🏆 Browse Teams', tab: 'teams' },
              { label: '📋 Player Board', tab: 'board' },
              { label: '+ Add a Listing', tab: 'submit' },
            ].map(({ label, tab }) => (
              <button key={tab} onClick={() => onNavigate(tab)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', border: 'none',
                borderBottom: '1px solid var(--lgray)',
                background: 'white', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--navy)',
                transition: 'background 0.1s',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Second sidebar ad */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--lgray)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 14px', background: 'var(--lgray)', fontSize: 10, fontWeight: 700, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Sponsor This Spot
            </div>
            <div style={{ padding: 14 }}>
              <AdBanner label="Sidebar — 300×250 Ad Space" height={180} />
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER TRUST BAR ─────────────────────────────── */}
      <div style={{
        background: 'var(--white)', borderTop: '2px solid var(--lgray)',
        padding: '20px', textAlign: 'center',
        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray)',
      }}>
        Sandlot Source is a community directory for North Georgia baseball & softball —
        built by local parents, for local families. Listings updated regularly.
      </div>
    </div>
  )
}
