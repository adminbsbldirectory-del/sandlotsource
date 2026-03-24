import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function normalizeUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function normalizeInstagramHandle(value) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://instagram.com/' + trimmed.replace(/^@/, '')
}

function normalizeSportValue(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'baseball' || raw === 'softball' || raw === 'both') return raw
  if (raw.includes('baseball') && raw.includes('softball')) return 'both'
  if (raw.includes('softball')) return 'softball'
  if (raw.includes('baseball')) return 'baseball'
  return raw
}

function getFacilitySport(facility) {
  const raw = facility?.sport_served || facility?.sport || ''
  return normalizeSportValue(raw)
}

function getFacilityTypeLabel(value) {
  const map = {
    park_field: 'Park / Rec Field',
    training_facility: 'Indoor Training Facility',
    private_facility: 'Private Facility',
    travel_team_facility: 'Team Facility',
    school_field: 'School Field',
    other: 'Other',
  }
  return map[value] || value || ''
}

function getSportLabel(sport) {
  if (sport === 'both') return 'Baseball & Softball'
  if (sport === 'softball') return 'Softball'
  if (sport === 'baseball') return 'Baseball'
  return sport || ''
}

function getCoachSpecialties(coach) {
  if (Array.isArray(coach.specialty)) return coach.specialty.filter(Boolean)
  return String(coach.specialty || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

function getCoachLocationLine(coach) {
  const parts = [coach.city, coach.state].filter(Boolean)
  const zip = coach.zip || ''
  if (parts.length === 0 && zip) return zip
  if (parts.length === 0) return ''
  return parts.join(', ') + (zip ? ` ${zip}` : '')
}

function getFacilityLocationLine(facility) {
  const parts = [facility.city, facility.state].filter(Boolean)
  const zip = facility.zip_code || ''
  if (parts.length === 0 && zip) return zip
  if (parts.length === 0) return ''
  return parts.join(', ') + (zip ? ` ${zip}` : '')
}

function CoachCard({ coach, facilityId }) {
  const specialties = getCoachSpecialties(coach)
  const websiteUrl = normalizeUrl(coach.website)
  const instagramUrl = normalizeInstagramHandle(coach.instagram)
  const mapsQuery = encodeURIComponent(coach.address || getCoachLocationLine(coach))

  return (
    <div
      style={{
        border: '1px solid var(--lgray)',
        borderRadius: 'var(--card-radius)',
        background: 'var(--white)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--navy)' }}>
            {coach.name}
          </div>
          {coach.facility_name && (
            <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 3 }}>{coach.facility_name}</div>
          )}
          {(coach.address || getCoachLocationLine(coach)) && (
            <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 6, overflowWrap: 'anywhere' }}>
              📍 {coach.address || getCoachLocationLine(coach)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {coach.sport && (
            <span
              style={{
                background: coach.sport === 'softball' ? '#ede9fe' : '#dbeafe',
                color: coach.sport === 'softball' ? '#6d28d9' : '#1d4ed8',
                fontSize: 10,
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {coach.sport === 'both' ? 'Baseball & Softball' : coach.sport}
            </span>
          )}
          {coach.verified_status && (
            <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}>
              ✓ Verified
            </span>
          )}
          {coach.featured_status && (
            <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}>
              ⭐ Featured
            </span>
          )}
        </div>
      </div>

      {specialties.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {specialties.slice(0, 6).map((item) => (
            <span
              key={item}
              style={{
                background: 'var(--lgray)',
                color: 'var(--gray)',
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 999,
                textTransform: 'capitalize',
              }}
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {coach.bio && (
        <div style={{ fontSize: 13, color: '#444', lineHeight: 1.55, marginTop: 10 }}>
          {coach.bio.length > 240 ? coach.bio.slice(0, 240) + '…' : coach.bio}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 12, minWidth: 0 }}>
        <Link
          to={`/coaches?select=${coach.id}${facilityId ? `&facility=${facilityId}` : ''}`}
          style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
          >
            View Coach →
          </Link>
        {coach.email && (
          <a href={`mailto:${coach.email}`} style={{ color: '#1D4ED8', textDecoration: 'none', fontSize: 13 }}>
            Email
          </a>
        )}
        {coach.phone && (
          <a href={`tel:${String(coach.phone).replace(/\D/g, '')}`} style={{ color: '#1D4ED8', textDecoration: 'none', fontSize: 13 }}>
            Call
          </a>
        )}
        {(coach.address || getCoachLocationLine(coach)) && (
          <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontSize: 13 }}>
            Map
          </a>
        )}
        {websiteUrl && (
          <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontSize: 13 }}>
            Website
          </a>
        )}
        {instagramUrl && (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontSize: 13 }}>
            Instagram
          </a>
        )}
      </div>
    </div>
  )
}

// Groups teams by org_affiliation (or falls back to team name) so that
// Georgia Bombers 13U and 14U appear as one block under "Georgia Bombers".
function groupTeamsByOrg(teams) {
  const map = new Map()
  for (const team of teams) {
    const key = String(team.org_affiliation || team.name || '').trim() || team.name
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(team)
  }
  return Array.from(map.entries()).map(([org, items]) => ({ org, items }))
}

function tryoutBadgeStyle(status) {
  if (status === 'open') return { background: '#DCFCE7', color: '#15803D' }
  if (status === 'year_round') return { background: '#DBEAFE', color: '#1D4ED8' }
  if (status === 'by_invite') return { background: '#FEF3C7', color: '#92400E' }
  return { background: '#F1F5F9', color: '#64748B' }
}

function tryoutLabel(status) {
  if (status === 'open') return 'Tryouts Open'
  if (status === 'year_round') return 'Year Round'
  if (status === 'by_invite') return 'By Invite'
  return 'Closed'
}

function TeamCard({ team, mobile = false }) {
  const teamSearchUrl = '/teams?select=' + team.id
  const metaLine = [
    team.age_group,
    team.sport
      ? (team.sport === 'both'
          ? 'Baseball & Softball'
          : team.sport.charAt(0).toUpperCase() + team.sport.slice(1))
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  if (mobile) {
    return (
      <div
        style={{
          display: 'grid',
          gap: 8,
          padding: '10px 0',
          borderBottom: '1px solid var(--lgray)',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--navy)', lineHeight: 1.3, overflowWrap: 'anywhere' }}>
              {team.name}
            </div>
            {metaLine && (
              <div style={{ fontSize: 12.5, color: 'var(--gray)', marginTop: 2, lineHeight: 1.35 }}>
                {metaLine}
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
              ...tryoutBadgeStyle(team.tryout_status),
            }}
          >
            {tryoutLabel(team.tryout_status)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--gray)' }}>Open team details</div>
          <Link
            to={teamSearchUrl}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#1D4ED8',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '10px 0',
      borderBottom: '1px solid var(--lgray)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', lineHeight: 1.3 }}>
          {team.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
          {metaLine}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          ...tryoutBadgeStyle(team.tryout_status),
        }}>
          {tryoutLabel(team.tryout_status)}
        </span>
        <Link
          to={teamSearchUrl}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#1D4ED8',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View →
        </Link>
      </div>
    </div>
  )
}

export default function FacilityProfile() {
  const { id } = useParams()
  const location = useLocation()
  const [facility, setFacility] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [teams, setTeams] = useState([])
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    let isActive = true

    async function load() {
      setLoading(true)
      setError('')

      const normalizedId = String(id || '').trim()
      if (!normalizedId) {
        if (isActive) {
          setFacility(null)
          setCoaches([])
          setTeams([])
          setError('Facility not found.')
          setLoading(false)
        }
        return
      }

      const [
        { data: facilityData, error: facilityError },
        { data: coachData, error: coachError },
        { data: teamData },
      ] = await Promise.all([
        supabase
          .from('facilities')
          .select('*')
          .eq('id', normalizedId)
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .maybeSingle(),
        supabase
          .from('coaches')
          .select('*')
          .eq('facility_id', normalizedId)
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .order('name'),
        supabase
          .from('travel_teams')
          .select('id, name, facility_name, org_affiliation, age_group, sport, city, state, tryout_status')
          .eq('facility_id', normalizedId)
          .eq('active', true)
          .in('approval_status', ['approved', 'seeded'])
          .order('name'),
      ])

      if (!isActive) return

      if (facilityError) {
        setFacility(null)
        setCoaches([])
        setError('Unable to load facility right now.')
        setLoading(false)
        return
      }

      if (!facilityData) {
        setFacility(null)
        setCoaches([])
        setError('Facility not found.')
        setLoading(false)
        return
      }

      setFacility({ ...facilityData, id: String(facilityData.id) })
      setCoaches((coachData || []).map((coach) => ({
        ...coach,
        id: String(coach.id),
        facility_id: coach.facility_id != null ? String(coach.facility_id).trim() : '',
        lat: facilityData.lat != null ? facilityData.lat : coach.lat,
        lng: facilityData.lng != null ? facilityData.lng : coach.lng,
      })))
      setTeams((teamData || []).map((t) => ({ ...t, id: String(t.id) })))
      if (coachError) {
        setError('Facility loaded, but linked coaches could not be loaded.')
      }
      setLoading(false)
    }

    load()
    return () => {
      isActive = false
    }
  }, [id])

  const websiteUrl = useMemo(() => normalizeUrl(facility?.website), [facility?.website])
  const instagramUrl = useMemo(() => normalizeInstagramHandle(facility?.instagram), [facility?.instagram])
  const facebookUrl = useMemo(() => normalizeUrl(facility?.facebook), [facility?.facebook])
  const locationLine = useMemo(() => (facility ? getFacilityLocationLine(facility) : ''), [facility])
  const amenityList = useMemo(() => (Array.isArray(facility?.amenities) ? facility.amenities.filter(Boolean) : []), [facility])
  const sportLabel = facility ? getSportLabel(getFacilitySport(facility)) : ''
  const mapsQuery = encodeURIComponent(facility?.address || locationLine || facility?.name || '')
  const backHref = `/facilities${location.search || ''}`

  if (loading) {
    return (
      <div className="page-shell" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '14px 10px 26px' : '24px 16px 40px', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div className="card" style={{ padding: 20 }}>Loading facility…</div>
      </div>
    )
  }

  if (!facility) {
    return (
      <div className="page-shell" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '14px 10px 26px' : '24px 16px 40px', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>Facility not found</div>
          <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 8 }}>{error || 'This facility may have been removed or is no longer active.'}</div>
          <div style={{ marginTop: 16 }}>
            <Link to={backHref} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>
              ← Back to Facilities
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell" style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '14px 10px 26px' : '24px 16px 40px', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 18 }}>
        <Link to={backHref} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
          ← Back to Facilities
        </Link>
      </div>

      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, #1e3a8a 100%)',
          color: 'white',
          padding: isMobile ? '16px 14px 14px' : '22px 22px 20px',
          border: 'none',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: isMobile ? 0 : 260 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: isMobile ? 22 : 30, fontWeight: 800, lineHeight: 1.1, overflowWrap: 'anywhere' }}>{facility.name}</div>
            {(facility.address || locationLine) && (
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 10 }}>
                📍 {facility.address || locationLine}
              </div>
            )}
            {facility.facility_type && (
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                {getFacilityTypeLabel(facility.facility_type)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sportLabel && (
              <span style={{ background: 'rgba(255,255,255,0.14)', color: 'white', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {sportLabel}
              </span>
            )}
            {facility.approval_status && (
              <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {facility.approval_status}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: isMobile ? 14 : 18, minWidth: 0 }}>
          <div className="card" style={{ padding: isMobile ? 14 : 18 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Facility Details</div>

            {facility.description && (
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.65, marginBottom: 16 }}>{facility.description}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {facility.address && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginBottom: 4 }}>Address</div>
                  <div style={{ fontSize: 14, color: 'var(--navy)' }}>{facility.address}</div>
                </div>
              )}
              {locationLine && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginBottom: 4 }}>City / State</div>
                  <div style={{ fontSize: 14, color: 'var(--navy)' }}>{locationLine}</div>
                </div>
              )}
              {facility.hours && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginBottom: 4 }}>Hours</div>
                  <div style={{ fontSize: 14, color: 'var(--navy)' }}>{facility.hours}</div>
                </div>
              )}
              {facility.contact_name && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginBottom: 4 }}>Contact</div>
                  <div style={{ fontSize: 14, color: 'var(--navy)' }}>{facility.contact_name}</div>
                </div>
              )}
            </div>

            {amenityList.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginBottom: 8 }}>Amenities</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {amenityList.map((item) => (
                    <span key={item} style={{ background: 'var(--lgray)', color: 'var(--gray)', fontSize: 12, padding: '5px 10px', borderRadius: 999, textTransform: 'capitalize' }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: isMobile ? 14 : 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
                Linked Coaches
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 700 }}>
                {coaches.length} coach{coaches.length !== 1 ? 'es' : ''}
              </div>
            </div>

            {coaches.length === 0 ? (
              <div style={{ border: '1px dashed var(--lgray)', borderRadius: 12, padding: 16, color: 'var(--gray)', fontSize: 14 }}>
                No linked coaches yet for this facility.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {coaches.map((coach) => (
                  <CoachCard key={coach.id} coach={coach} facilityId={facility.id} />
                ))}
              </div>
            )}
          </div>

          {/* Linked Teams — grouped by org so Georgia Bombers 13U + 14U show as one block */}
          <div className="card" style={{ padding: isMobile ? 14 : 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>
                Teams at this Facility
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 700 }}>
                {teams.length} team{teams.length !== 1 ? 's' : ''}
              </div>
            </div>

            {teams.length === 0 ? (
              <div style={{ border: '1px dashed var(--lgray)', borderRadius: 12, padding: 16, color: 'var(--gray)', fontSize: 14 }}>
                No linked teams yet for this facility.
              </div>
            ) : (
              <div>
                {groupTeamsByOrg(teams).map(({ org, items }) => (
                  <div key={org} style={{ marginBottom: 16 }}>
                    {items.length > 1 && (
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)', marginBottom: 4 }}>
                        {org}
                      </div>
                    )}
                    {items.map((team) => (
                      <TeamCard key={team.id} team={team} mobile={isMobile} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: isMobile ? 14 : 18, minWidth: 0 }}>
          <div className="card" style={{ padding: isMobile ? 14 : 18 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Contact & Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(facility.phone || facility.contact_phone) && (
                <a href={'tel:' + String(facility.phone || facility.contact_phone).replace(/\D/g, '')} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>📞 {facility.phone || facility.contact_phone}</a>
              )}
              {facility.contact_phone && facility.phone && facility.contact_phone !== facility.phone && (
                <a href={'tel:' + String(facility.contact_phone).replace(/\D/g, '')} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>📞 {facility.contact_phone}</a>
              )}
              {(facility.contact_email || facility.email) && (
                <a href={`mailto:${facility.contact_email || facility.email}`} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>📧 {facility.contact_email || facility.email}</a>
              )}
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>🌐 Website</a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>📸 Instagram</a>
              )}
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>f Facebook</a>
              )}
              {(facility.address || locationLine) && (
                <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>🗺 Open in Maps</a>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', width: '100%', minWidth: 0 }}>
            <div style={{ padding: '18px 18px 12px' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>Facility Map</div>
            </div>
            {facility.lat != null && facility.lng != null ? (
              <div style={{ height: isMobile ? 220 : 320, width: '100%' }}>
                <MapContainer center={[facility.lat, facility.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[facility.lat, facility.lng]} />
                </MapContainer>
              </div>
            ) : (
              <div style={{ padding: '0 18px 18px', color: 'var(--gray)', fontSize: 14 }}>No map coordinates available for this facility yet.</div>
            )}
          </div>

          {error && error !== 'Facility not found.' && (
            <div className="card" style={{ padding: 16, borderColor: '#FCD34D', background: '#FFFBEB', color: '#92400E' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
