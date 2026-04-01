import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ensureLeafletDefaultMarkerIcons } from '../lib/leafletInit'
import { supabase } from '../supabase.js'
import AdSlot from './AdSlot.jsx'
import { POSITIONS_BB, POSITIONS_SB } from '../constants/positionOptions'

ensureLeafletDefaultMarkerIcons()

const HEADER_H = 75

const makeIcon = (color) =>
  L.divIcon({
    className: '',
    html:
      '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:' +
      color +
      ';border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28],
  })

const PIN_COLOR = '#16a34a'
const DEFAULT_CENTER = [39.5, -98.35]
const RADIUS_OPTIONS = [10, 25, 50, 100, 250]

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
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

function haversineMiles(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

const AGE_GROUPS = [
  '6U',
  '7U',
  '8U',
  '9U',
  '10U',
  '11U',
  '12U',
  '13U',
  '14U',
  '15U',
  '16U',
  '17U',
  '18U',
  'High School',
  'College',
  'Adult',
]

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
  color: '#444',
}
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '2px solid var(--lgray)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}
const selectStyle = { ...inputStyle }
const textareaStyle = { ...inputStyle, resize: 'vertical' }

function normalizeLookupText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatSportLabel(value) {
  if (!value) return ''
  if (value === 'both') return 'Baseball & Softball'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getLocationLine(city, state, zipCode) {
  const base = [city, state].filter(Boolean).join(', ')
  return base + (zipCode ? `${base ? ' ' : ''}${zipCode}` : '')
}

function scoreTeamCandidate(row, { teamName, sport, ageGroup, zipCode, state, orgAffiliation }) {
  const normalizedName = normalizeLookupText(teamName)
  const normalizedOrg = normalizeLookupText(orgAffiliation)
  const rowName = normalizeLookupText(row.name)
  const rowOrg = normalizeLookupText(row.org_affiliation)
  const rowSport = String(row.sport || '').toLowerCase()
  const rowState = String(row.state || '').trim().toUpperCase()
  const rowZip = String(row.zip_code || '').trim()
  const rowAge = String(row.age_group || '').trim()

  let score = 0

  if (normalizedName && rowName === normalizedName) score += 8
  else if (normalizedName && (rowName.includes(normalizedName) || normalizedName.includes(rowName))) score += 4

  if (normalizedOrg && rowOrg && rowOrg === normalizedOrg) score += 3
  else if (normalizedOrg && rowOrg && (rowOrg.includes(normalizedOrg) || normalizedOrg.includes(rowOrg))) score += 1

  if (sport && (rowSport === sport || rowSport === 'both')) score += 3
  if (ageGroup && rowAge === ageGroup) score += 2
  if (zipCode && rowZip && rowZip === zipCode) score += 3
  if (state && rowState && rowState === String(state).trim().toUpperCase()) score += 1
  if (row.approval_status === 'approved' || row.approval_status === 'seeded') score += 1
  if (row.active === true) score += 1

  return score
}

async function searchTeamMatches({ teamName, orgAffiliation, sport, ageGroup, zipCode, state }) {
  const normalizedName = normalizeLookupText(teamName)
  const normalizedOrg = normalizeLookupText(orgAffiliation)
  if (!normalizedName || normalizedName.length < 3) return []

  const lookupTerms = Array.from(
    new Set(
      [
        String(teamName || '').trim(),
        normalizedName,
        String(orgAffiliation || '').trim(),
        normalizedOrg,
      ].filter((value) => value && value.length >= 2)
    )
  )

  let candidates = []

  for (const term of lookupTerms.slice(0, 4)) {
    const safeTerm = String(term).replace(/[%_]/g, '').trim()
    if (!safeTerm) continue

    const { data } = await supabase
      .from('travel_teams')
      .select(
        'id, name, sport, age_group, zip_code, city, state, org_affiliation, practice_location_name, facility_id, facility_name, approval_status, active'
      )
      .eq('active', true)
      .in('approval_status', ['approved', 'seeded'])
      .or(`name.ilike.%${safeTerm}%,org_affiliation.ilike.%${safeTerm}%`)
      .limit(20)

    if (Array.isArray(data) && data.length) {
      candidates = candidates.concat(data)
    }
  }

  const deduped = Array.from(new Map(candidates.map((row) => [row.id, row])).values())

  return deduped
    .map((row) => ({
      ...row,
      score: scoreTeamCandidate(row, { teamName, sport, ageGroup, zipCode, state, orgAffiliation }),
    }))
    .filter((row) => row.score >= 6)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return String(a.name || '').localeCompare(String(b.name || ''))
    })
    .slice(0, 4)
}

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <div
      style={{
        background: '#FEE2E2',
        border: '1px solid #F87171',
        borderRadius: 8,
        padding: '10px 14px',
        margin: '12px 0',
        color: '#B91C1C',
        fontSize: 13,
      }}
    >
      {msg}
    </div>
  )
}

function SportBadge({ sport }) {
  const isSoftball = sport === 'softball'
  return (
    <span
      style={{
        background: isSoftball ? '#F5EDFF' : '#E8F0FF',
        color: isSoftball ? '#6D28D9' : '#1D4ED8',
        border: '1px solid ' + (isSoftball ? '#D8B4FE' : '#BFDBFE'),
        fontSize: 10,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 20,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-head)',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {sport}
    </span>
  )
}

function FitBounds({ spots, zipGeo }) {
  const map = useMap()

  useEffect(() => {
    const pts = spots.filter((s) => s.lat && s.lng)
    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts.map((s) => [s.lat, s.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 })
      return
    }
    if (zipGeo?.lat && zipGeo?.lng) {
      map.setView([zipGeo.lat, zipGeo.lng], 10)
    }
  }, [map, spots, zipGeo])

  return null
}

function DaysRemaining({ expiresAt }) {
  if (!expiresAt) return null
  const days = Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
  const tone = days <= 2 ? '#B91C1C' : days <= 5 ? '#92400E' : '#166534'
  const bg = days <= 2 ? '#FEE2E2' : days <= 5 ? '#FEF3C7' : '#DCFCE7'
  const label = days === 0 ? 'Expires today' : `${days} day${days !== 1 ? 's' : ''} left`
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 999,
        background: bg,
        color: tone,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

function InlineMobileAdSlot({ slotKey, marginTop = 16 }) {
  return (
    <div
      style={{
        background: '#F5F4F0',
        borderTop: '1px solid #E2E0DB',
        borderBottom: '1px solid #E2E0DB',
        padding: '16px 0',
        marginTop,
      }}
    >
      <div style={{ padding: '0 12px' }}>
        <div style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}>
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
              minHeight: 100,
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

function SkyscraperAdSlot({ slotKey }) {
  return (
    <div style={{ width: 160, maxWidth: 160 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--gray)',
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

function RosterRow({ spot, isMobile }) {
  const actionLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '100%' : 'auto',
    minHeight: isMobile ? 38 : 'auto',
    padding: isMobile ? '9px 12px' : 0,
    borderRadius: isMobile ? 999 : 0,
    border: isMobile ? '1px solid #CBD5E1' : 'none',
    background: isMobile ? 'white' : 'transparent',
    color: '#1D4ED8',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
    boxSizing: 'border-box',
  }
  const positions = Array.isArray(spot.positions_needed) ? spot.positions_needed : []
  const cityStateZip = getLocationLine(spot.city, spot.state, spot.zip_code)
  const linkedTeam = spot.travel_teams || null
  const linkedTeamUrl = spot.team_id ? '/teams?select=' + spot.team_id : ''
  const facilityUrl = linkedTeam?.facility_id ? '/facilities/' + linkedTeam.facility_id : ''
  const linkedPracticeLocation = linkedTeam?.practice_location_name || ''
  const linkedFacilityName = linkedTeam?.facility_name || ''

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--lgray)',
        borderRadius: 16,
        padding: isMobile ? '14px 14px 12px' : '16px 18px',
        boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(0, 0.95fr)',
          gap: isMobile ? 10 : 16,
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: isMobile ? 16 : 17,
                fontWeight: 800,
                color: 'var(--navy)',
                lineHeight: 1.2,
                minWidth: 0,
                wordBreak: 'break-word',
              }}
            >
              {spot.team_name || 'Open roster spot'}
            </div>
            {spot.team_id && (
              <span
                style={{
                  background: '#F0FDF4',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-head)',
                }}
              >
                Linked Team
              </span>
            )}
            <SportBadge sport={spot.sport} />
            {spot.age_group && (
              <span
                style={{
                  background: '#F8FAFC',
                  color: 'var(--navy)',
                  border: '1px solid #CBD5E1',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-head)',
                }}
              >
                {spot.age_group}
              </span>
            )}
          </div>

          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8, wordBreak: 'break-word' }}>
            {cityStateZip || 'Location pending'}
            {typeof spot.distanceMiles === 'number' && (
              <span style={{ marginLeft: 8, color: '#0F766E', fontWeight: 700 }}>
                {spot.distanceMiles.toFixed(1)} mi away
              </span>
            )}
          </div>

          {spot.org_affiliation && (
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, wordBreak: 'break-word' }}>
              {spot.org_affiliation}
            </div>
          )}

          {(linkedPracticeLocation || linkedFacilityName) && (
            <div
              style={{
                display: 'grid',
                gap: 6,
                marginBottom: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              {linkedPracticeLocation && (
                <div style={{ fontSize: 12, color: '#334155', wordBreak: 'break-word' }}>
                  <strong>Practice:</strong> {linkedPracticeLocation}
                </div>
              )}
              {linkedFacilityName && (
                <div style={{ fontSize: 12, color: '#334155', wordBreak: 'break-word' }}>
                  <strong>Facility:</strong> {linkedFacilityName}
                </div>
              )}
            </div>
          )}

          {positions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {positions.map((pos) => (
                <span
                  key={pos}
                  style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          {spot.description && (
            <div
              style={{
                fontSize: 13,
                color: '#475569',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {spot.description}
            </div>
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            gap: 8,
            textAlign: isMobile ? 'left' : 'right',
            paddingTop: isMobile ? 10 : 0,
            borderTop: isMobile ? '1px solid #E2E8F0' : 'none',
          }}
        >
          <DaysRemaining expiresAt={spot.expires_at} />
          {spot.contact_name && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', wordBreak: 'break-word' }}>
              {spot.contact_name}
            </div>
          )}
          {spot.contact_info && (
            <div style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 700, wordBreak: 'break-word' }}>
              {spot.contact_info}
            </div>
          )}
          {linkedTeamUrl && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? (facilityUrl ? '1fr 1fr' : '1fr') : 'none',
                gap: 10,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'stretch' : 'flex-end',
              }}
            >
              <a href={linkedTeamUrl} style={actionLinkStyle}>
                View Team →
              </a>
              {facilityUrl && (
                <a href={facilityUrl} style={actionLinkStyle}>
                  View Facility →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ZipFieldInline({ value, onChange, onGeocode, required }) {
  const [status, setStatus] = useState('')

  async function handleBlur() {
    if (!value || value.length !== 5) return
    setStatus('loading')
    const geo = await geocodeZip(value)
    if (geo) {
      setStatus('ok')
      onGeocode(geo)
    } else {
      setStatus('error')
      onGeocode(null)
    }
  }

  return (
    <div>
      <label style={labelStyle}>
        Zip Code{required && <RequiredMark />}
        {status === 'loading' && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Checking…</span>
        )}
        {status === 'ok' && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Located</span>
        )}
        {status === 'error' && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--red)' }}>
            Zip not found
          </span>
        )}
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
        onBlur={handleBlur}
        placeholder="e.g. 30114"
        style={inputStyle}
      />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Used to place a map pin</div>
    </div>
  )
}

function RosterForm({ onSubmitted, isMobile }) {
  const gridCols = isMobile ? '1fr' : '1fr 1fr'

  const [form, setForm] = useState({
    sport: 'baseball',
    team_name: '',
    org_affiliation: '',
    age_group: '',
    positions_needed: [],
    city: '',
    state: '',
    zip_code: '',
    lat: null,
    lng: null,
    description: '',
    contact_name: '',
    contact_info: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [matchLoading, setMatchLoading] = useState(false)
  const [teamMatches, setTeamMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [matchChoiceMode, setMatchChoiceMode] = useState('auto')
  const [showOtherMatches, setShowOtherMatches] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleLookupFieldChange(field, value) {
    set(field, value)
    setMatchChoiceMode('auto')
    setShowOtherMatches(false)
  }

  function togglePos(pos) {
    setForm((f) => ({
      ...f,
      positions_needed: f.positions_needed.includes(pos)
        ? f.positions_needed.filter((p) => p !== pos)
        : [...f.positions_needed, pos],
    }))
  }

  function handleGeocode(geo) {
    if (geo) {
      setForm((f) => ({
        ...f,
        lat: geo.lat,
        lng: geo.lng,
        city: f.city || geo.city,
        state: geo.state || f.state,
      }))
      setMatchChoiceMode('auto')
      setShowOtherMatches(false)
    } else {
      setForm((f) => ({ ...f, lat: null, lng: null, state: '' }))
      setMatchChoiceMode('auto')
      setShowOtherMatches(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadMatches() {
      const normalizedName = normalizeLookupText(form.team_name)
      if (!normalizedName || normalizedName.length < 3) {
        setTeamMatches([])
        setSelectedMatchId(null)
        setMatchLoading(false)
        return
      }

      setMatchLoading(true)
      const matches = await searchTeamMatches({
        teamName: form.team_name,
        orgAffiliation: form.org_affiliation,
        sport: form.sport,
        ageGroup: form.age_group,
        zipCode: form.zip_code,
        state: form.state,
      })

      if (cancelled) return
      setTeamMatches(matches)
      setMatchLoading(false)

      if (matchChoiceMode === 'auto') {
        setSelectedMatchId(matches[0]?.score >= 10 ? matches[0].id : null)
      } else if (matchChoiceMode === 'linked') {
        const stillThere = matches.some((row) => row.id === selectedMatchId)
        if (!stillThere) {
          setMatchChoiceMode('auto')
          setSelectedMatchId(matches[0]?.score >= 10 ? matches[0].id : null)
        }
      }
    }

    const timer = setTimeout(loadMatches, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [form.team_name, form.org_affiliation, form.sport, form.age_group, form.zip_code, form.state, matchChoiceMode, selectedMatchId])

  function validate() {
    if (!form.sport) return 'Sport is required.'
    if (!form.age_group) return 'Age group is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.contact_info.trim()) return 'Contact info is required.'
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setError('')
    setSubmitting(true)

    const selectedMatch =
      matchChoiceMode === 'standalone'
        ? null
        : teamMatches.find((row) => row.id === selectedMatchId) || (teamMatches[0]?.score >= 10 ? teamMatches[0] : null)

    const payload = {
      sport: form.sport,
      team_name: form.team_name.trim() || null,
      org_affiliation: form.org_affiliation.trim() || null,
      age_group: form.age_group,
      positions_needed: form.positions_needed,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip_code: form.zip_code || null,
      lat: form.lat || null,
      lng: form.lng || null,
      team_id: selectedMatch?.id || null,
      commitment: 'full_season',
      description: form.description.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_info: form.contact_info.trim(),
      active: true,
      approval_status: 'pending',
      source: 'website_form',
      last_confirmed_at: new Date().toISOString(),
    }

    const { error: sbError } = await supabase.from('roster_spots').insert(payload)
    setSubmitting(false)

    if (sbError) {
      setError('Submission error: ' + (sbError.message || 'Please try again.'))
    } else {
      onSubmitted({
        matchedTeam: selectedMatch,
        postedStandalone: matchChoiceMode === 'standalone' || !selectedMatch,
      })
    }
  }

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB
  const selectedMatch = teamMatches.find((row) => row.id === selectedMatchId) || null
  const showCollapsedMatchChoices = isMobile && !!selectedMatch && teamMatches.length > 1 && !showOtherMatches

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '2px solid var(--lgray)',
        padding: isMobile ? '18px 12px' : '28px 24px',
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-head)',
          fontSize: isMobile ? 18 : 20,
          fontWeight: 800,
          color: 'var(--navy)',
          marginBottom: 20,
        }}
      >
        Post a Roster Spot
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Sport <RequiredMark />
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['baseball', 'softball'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                handleLookupFieldChange('sport', s)
                set('positions_needed', [])
              }}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'var(--lgray)',
                background: form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'white',
                color: form.sport === s ? 'white' : 'var(--navy)',
                fontWeight: 600,
                fontSize: 13,
                textTransform: 'capitalize',
                fontFamily: 'var(--font-body)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Team Name</label>
          <input
            value={form.team_name}
            onChange={(e) => handleLookupFieldChange('team_name', e.target.value)}
            placeholder="e.g. Cherokee Nationals"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 1.45 }}>
            We will suggest similar Sandlot Source team listings so players and parents can research the team more easily.
          </div>
        </div>
        <div>
          <label style={labelStyle}>Org Affiliation</label>
          <input
            value={form.org_affiliation}
            onChange={(e) => handleLookupFieldChange('org_affiliation', e.target.value)}
            placeholder="e.g. USSSA, PGF, Perfect Game"
            style={inputStyle}
          />
        </div>
      </div>

      {(matchLoading || teamMatches.length > 0 || matchChoiceMode === 'standalone') && (
        <div
          style={{
            marginBottom: 14,
            padding: isMobile ? '12px 12px 10px' : '14px 14px 12px',
            borderRadius: 12,
            border: '1px solid ' + (selectedMatch ? '#BBF7D0' : '#E2E8F0'),
            background: selectedMatch ? '#F0FDF4' : '#F8FAFC',
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Existing Team Match
            </div>
            {matchLoading && <div style={{ fontSize: 12, color: '#64748B' }}>Checking existing team listings…</div>}
            {!matchLoading && selectedMatch && (
              <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Linked for added team context</div>
            )}
            {!matchLoading && matchChoiceMode === 'standalone' && (
              <div style={{ fontSize: 12, color: '#64748B' }}>Posting as a standalone roster spot</div>
            )}
          </div>

          {!matchLoading && selectedMatch && (
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{selectedMatch.name}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#DCFCE7', color: '#166534' }}>
                  Suggested Match
                </span>
                {selectedMatch.age_group && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#E2E8F0', color: '#334155' }}>
                    {selectedMatch.age_group}
                  </span>
                )}
                {selectedMatch.sport && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: '#DBEAFE', color: '#1D4ED8' }}>
                    {formatSportLabel(selectedMatch.sport)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#475569', wordBreak: 'break-word' }}>
                {getLocationLine(selectedMatch.city, selectedMatch.state, selectedMatch.zip_code) || 'Location pending'}
                {selectedMatch.org_affiliation ? ` · ${selectedMatch.org_affiliation}` : ''}
              </div>
              {(selectedMatch.practice_location_name || selectedMatch.facility_name) && (
                <div style={{ fontSize: 12, color: '#334155', wordBreak: 'break-word' }}>
                  {selectedMatch.practice_location_name ? `Practice: ${selectedMatch.practice_location_name}` : ''}
                  {selectedMatch.practice_location_name && selectedMatch.facility_name ? ' · ' : ''}
                  {selectedMatch.facility_name ? `Facility: ${selectedMatch.facility_name}` : ''}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, max-content)', gap: 10, marginTop: 2, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMatchChoiceMode('linked')
                    setSelectedMatchId(selectedMatch.id)
                  }}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    background: '#166534',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-head)',
                  }}
                >
                  Link This Team
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMatchChoiceMode('standalone')
                    setSelectedMatchId(null)
                  }}
                  style={{
                    border: '1px solid #CBD5E1',
                    borderRadius: 999,
                    background: 'white',
                    color: 'var(--navy)',
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-head)',
                  }}
                >
                  Keep Standalone
                </button>
                <a
                  href={'/teams?select=' + selectedMatch.id}
                  style={{
                    color: '#1D4ED8',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    alignSelf: 'center',
                    textAlign: isMobile ? 'center' : 'left',
                    padding: isMobile ? '10px 12px' : 0,
                    borderRadius: isMobile ? 999 : 0,
                    border: isMobile ? '1px solid #CBD5E1' : 'none',
                    background: isMobile ? 'white' : 'transparent',
                  }}
                >
                  Preview Team →
                </a>
              </div>
            </div>
          )}

          {!matchLoading && teamMatches.length > 1 && showCollapsedMatchChoices && (
            <button
              type="button"
              onClick={() => setShowOtherMatches(true)}
              style={{
                justifySelf: 'start',
                border: '1px solid #CBD5E1',
                borderRadius: 999,
                background: 'white',
                color: 'var(--navy)',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
              }}
            >
              Change team match
            </button>
          )}

          {!matchLoading && teamMatches.length > 1 && !showCollapsedMatchChoices && (
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Other possible matches</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {teamMatches
                  .filter((row) => row.id !== selectedMatchId)
                  .slice(0, 3)
                  .map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => {
                        setMatchChoiceMode('linked')
                        setSelectedMatchId(row.id)
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #DCE7F3',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', wordBreak: 'break-word' }}>{row.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B', wordBreak: 'break-word' }}>
                          {[row.age_group, formatSportLabel(row.sport), getLocationLine(row.city, row.state, row.zip_code)].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <span style={{ color: '#1D4ED8', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>Use</span>
                    </button>
                  ))}
              </div>
              {isMobile && selectedMatch && (
                <button
                  type="button"
                  onClick={() => setShowOtherMatches(false)}
                  style={{
                    justifySelf: 'start',
                    marginTop: 2,
                    background: 'none',
                    border: 'none',
                    color: '#1D4ED8',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'var(--font-head)',
                  }}
                >
                  Hide other matches
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>
            Age Group <RequiredMark />
          </label>
          <select value={form.age_group} onChange={(e) => handleLookupFieldChange('age_group', e.target.value)} style={selectStyle}>
            <option value="">Select</option>
            {AGE_GROUPS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Canton" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 12, marginBottom: 14 }}>
        <ZipFieldInline value={form.zip_code} onChange={(v) => handleLookupFieldChange('zip_code', v)} onGeocode={handleGeocode} required />
        <div>
          <label style={labelStyle}>State</label>
          <input value={form.state} readOnly placeholder="Auto-filled from zip" style={{ ...inputStyle, background: '#F8FAFC' }} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Position(s) Needed</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {positions.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => togglePos(pos)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: form.positions_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                background: form.positions_needed.includes(pos) ? 'var(--navy)' : 'white',
                color: form.positions_needed.includes(pos) ? 'white' : 'var(--navy)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
              }}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Skill level expected, practice schedule, tournament schedule..."
          style={textareaStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: isMobile ? 10 : 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Contact Name</label>
          <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Coach or contact person" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>
            Contact Info <RequiredMark />
          </label>
          <input value={form.contact_info} onChange={(e) => set('contact_info', e.target.value)} placeholder="Email, phone, or Instagram" style={inputStyle} />
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Visible publicly. Expires after 15 days.</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        Roster spots are reviewed before going live and expire after <strong>15 days</strong>. Fields marked{' '}
        <span style={{ color: 'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          background: 'var(--red)',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          padding: '12px 32px',
          fontFamily: 'var(--font-head)',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          opacity: submitting ? 0.7 : 1,
          cursor: submitting ? 'not-allowed' : 'pointer',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {submitting ? 'Posting…' : 'Post Roster Spot'}
      </button>
    </div>
  )
}

export default function RosterSpots() {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('browse')
  const [sport, setSport] = useState('Both')
  const [ageGroup, setAgeGroup] = useState('All Ages')
  const [zipCode, setZipCode] = useState('')
  const [radiusMiles, setRadiusMiles] = useState(25)
  const [zipGeo, setZipGeo] = useState(null)
  const [zipState, setZipState] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [zipStatus, setZipStatus] = useState('idle')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [submittedInfo, setSubmittedInfo] = useState(null)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const urlSport = params.get('sport')
    const urlAge = params.get('age')
    const urlZip = params.get('zip')
    const urlRadius = params.get('radius')
    const urlMap = params.get('map')

    if (urlSport && ['Both', 'baseball', 'softball'].includes(urlSport)) setSport(urlSport)
    if (urlAge && ['All Ages', ...AGE_GROUPS].includes(urlAge)) setAgeGroup(urlAge)
    if (urlZip) setZipCode(urlZip.replace(/\D/g, '').slice(0, 5))
    if (urlRadius && RADIUS_OPTIONS.includes(Number(urlRadius))) setRadiusMiles(Number(urlRadius))
    if (urlMap === '1') setShowMap(true)
  }, [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('roster_spots')
        .select(`*, travel_teams (id, name, city, state, zip_code, practice_location_name, facility_id, facility_name)`)
        .eq('active', true)
        .in('approval_status', ['pending', 'approved'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      if (!error && data) setSpots(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function resolveZip() {
      if (!zipCode || zipCode.length !== 5) {
        setZipGeo(null)
        setZipState('')
        setZipStatus(zipCode ? 'partial' : 'idle')
        return
      }

      setZipStatus('loading')
      const geo = await geocodeZip(zipCode)
      if (cancelled) return

      if (geo) {
        setZipGeo(geo)
        setZipState(geo.state || '')
        setZipStatus('ready')
      } else {
        setZipGeo(null)
        setZipState('')
        setZipStatus('error')
      }
    }

    resolveZip()
    return () => {
      cancelled = true
    }
  }, [zipCode])

  useEffect(() => {
    if (typeof window === 'undefined' || view !== 'browse') return

    const params = new URLSearchParams()
    if (sport !== 'Both') params.set('sport', sport)
    if (ageGroup !== 'All Ages') params.set('age', ageGroup)
    if (zipCode) params.set('zip', zipCode)
    if (radiusMiles !== 25) params.set('radius', String(radiusMiles))
    if (showMap) params.set('map', '1')

    const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState({}, '', next)
  }, [sport, ageGroup, zipCode, radiusMiles, showMap, view])

  const hasLocalSearch = zipCode.length === 5 && !!zipGeo

  const filtered = useMemo(() => {
    const base = spots.filter((spot) => {
      if (sport !== 'Both' && spot.sport !== sport) return false
      if (ageGroup !== 'All Ages' && spot.age_group !== ageGroup) return false
      return true
    })

    if (!hasLocalSearch) return []

    return base
      .map((spot) => {
        if (!spot.lat || !spot.lng || !zipGeo?.lat || !zipGeo?.lng) return null
        const distanceMiles = haversineMiles(zipGeo.lat, zipGeo.lng, spot.lat, spot.lng)
        if (distanceMiles > radiusMiles) return null
        return { ...spot, distanceMiles }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.distanceMiles !== b.distanceMiles) return a.distanceMiles - b.distanceMiles
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [spots, sport, ageGroup, hasLocalSearch, zipGeo, radiusMiles])

  const mappable = filtered.filter((spot) => spot.lat && spot.lng)

  const showSearchPrompt = !hasLocalSearch && view === 'browse'
  const hasNoResults = hasLocalSearch && !loading && filtered.length === 0

  const fieldShell = {
    display: 'grid',
    gap: 6,
    minWidth: 0,
  }

  const filterInput = {
    width: '100%',
    height: 42,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1.5px solid var(--lgray)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    color: 'var(--navy)',
    boxSizing: 'border-box',
    background: '#fff',
    outline: 'none',
  }

  const filterLabel = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#64748B',
  }

  function handleResetFilters() {
    setSport('Both')
    setAgeGroup('All Ages')
    setZipCode('')
    setRadiusMiles(25)
    setZipGeo(null)
    setZipState('')
    setZipStatus('idle')
    setShowMap(false)
  }

  if (view === 'submitted') {
    return (
      <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ background: '#DCFCE7', border: '2px solid #16A34A', borderRadius: 12, padding: '32px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: '#15803D', marginBottom: 8 }}>
            Roster Spot Posted!
          </div>
          <div style={{ fontSize: 14, color: '#166534', marginBottom: 10 }}>
            Your listing will appear here once reviewed. It will stay active for 15 days.
          </div>
          {submittedInfo?.matchedTeam && (
            <div style={{ fontSize: 13, color: '#166534', marginBottom: 16, lineHeight: 1.5 }}>
              Linked to existing team listing: <strong>{submittedInfo.matchedTeam.name}</strong>
              {(submittedInfo.matchedTeam.practice_location_name || submittedInfo.matchedTeam.facility_name) && (
                <span>
                  {' '}· {submittedInfo.matchedTeam.practice_location_name || submittedInfo.matchedTeam.facility_name}
                </span>
              )}
            </div>
          )}
          {submittedInfo?.postedStandalone && !submittedInfo?.matchedTeam && (
            <div style={{ fontSize: 13, color: '#166534', marginBottom: 16 }}>
              Posted as a standalone roster spot with no team link selected.
            </div>
          )}
          <button
            type="button"
            onClick={() => setView('browse')}
            style={{
              background: 'var(--navy)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontFamily: 'var(--font-head)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Back to Roster Spots
          </button>
        </div>
      </div>
    )
  }

  if (view === 'post') {
    return (
      <div style={{ padding: isMobile ? '16px 12px' : '32px 20px', overflowX: 'clip' }}>
        <div style={{ maxWidth: 720, width: '100%', margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => setView('browse')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--navy)',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'var(--font-head)',
              marginBottom: 20,
              display: 'block',
            }}
          >
            ← Back to Roster Spots
          </button>
          <RosterForm onSubmitted={(info) => { setSubmittedInfo(info || null); setView('submitted') }} isMobile={isMobile} />
        </div>
      </div>
    )
  }

  const browseContent = (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          background: 'var(--cream)',
          borderBottom: '2px solid var(--lgray)',
          padding: isMobile ? '18px 14px 16px' : '22px 24px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: isMobile ? 22 : 26,
                fontWeight: 800,
                color: 'var(--navy)',
                marginBottom: 4,
                lineHeight: 1.1,
              }}
            >
              Open Roster Spots
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
              Local-first search for travel teams looking for full-season players. Posts expire after 15 days.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'minmax(190px, 220px) minmax(150px, 170px) minmax(120px, 150px) minmax(150px, 180px) minmax(150px, 180px) auto auto',
              gap: 10,
              alignItems: 'end',
            }}
          >
            <div style={fieldShell}>
              <label style={filterLabel}>Near Zip Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="Zip code"
                style={filterInput}
              />
            </div>

            <div style={fieldShell}>
              <label style={filterLabel}>Distance</label>
              <select value={radiusMiles} onChange={(e) => setRadiusMiles(Number(e.target.value))} style={filterInput}>
                {RADIUS_OPTIONS.map((miles) => (
                  <option key={miles} value={miles}>
                    Up to {miles} miles
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldShell}>
              <label style={filterLabel}>State</label>
              <input value={zipState} readOnly placeholder="Auto" style={{ ...filterInput, background: '#F8FAFC' }} />
            </div>

            <div style={fieldShell}>
              <label style={filterLabel}>Sport</label>
              <select value={sport} onChange={(e) => setSport(e.target.value)} style={filterInput}>
                <option value="Both">Baseball &amp; Softball</option>
                <option value="baseball">Baseball</option>
                <option value="softball">Softball</option>
              </select>
            </div>

            <div style={fieldShell}>
              <label style={filterLabel}>Age Group</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={filterInput}>
                <option value="All Ages">All Ages</option>
                {AGE_GROUPS.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowMap((m) => !m)}
              style={{
                height: 42,
                padding: '0 14px',
                borderRadius: 'var(--btn-radius)',
                border: '1.5px solid var(--navy)',
                background: showMap ? 'var(--navy)' : 'white',
                color: showMap ? 'white' : 'var(--navy)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
                whiteSpace: 'nowrap',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>

            <button
              type="button"
              onClick={() => setView('post')}
              style={{
                height: 42,
                padding: '0 16px',
                borderRadius: 'var(--btn-radius)',
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              + Post a Roster Spot
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 8,
              alignItems: 'center',
              fontSize: 12,
            }}
          >
            <div style={{ color: '#64748B' }}>
              {zipStatus === 'loading' && 'Looking up ZIP…'}
              {zipStatus === 'error' && 'ZIP not found. Please check the code and try again.'}
              {zipStatus === 'partial' && 'Enter a full 5-digit ZIP to search nearby roster spots.'}
              {zipStatus === 'idle' && 'Start with a ZIP, then refine by distance, sport, or age group.'}
              {hasLocalSearch && !loading && `${filtered.length} roster spot${filtered.length !== 1 ? 's' : ''} within ${radiusMiles} miles of ${zipCode}.`}
              {hasLocalSearch && loading && 'Loading roster spots…'}
            </div>
            {(sport !== 'Both' || ageGroup !== 'All Ages' || zipCode || radiusMiles !== 25 || showMap) && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-head)',
                  padding: 0,
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {showMap && hasLocalSearch && (
        <div style={{ padding: isMobile ? '14px 14px 0' : '18px 24px 0' }}>
          <div style={{ height: isMobile ? 220 : 320, width: '100%', border: '1px solid var(--lgray)', borderRadius: 16, overflow: 'hidden' }}>
            <MapContainer center={zipGeo ? [zipGeo.lat, zipGeo.lng] : DEFAULT_CENTER} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds spots={mappable} zipGeo={zipGeo} />
              {mappable.map((spot) => (
                <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={makeIcon(PIN_COLOR)}>
                  <Popup>
                    <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                      <strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>
                        {spot.team_name || 'Open Roster'}
                      </strong>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                        {[spot.city, spot.state].filter(Boolean).join(', ')}
                        {spot.zip_code ? ` ${spot.zip_code}` : ''}
                      </div>
                      {spot.age_group && (
                        <div style={{ fontSize: 12, marginTop: 2 }}>
                          {spot.age_group} · {spot.sport}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {isMobile && (
        <InlineMobileAdSlot slotKey="roster_spots_inline_1_mobile" marginTop={14} />
      )}

      <div style={{ padding: isMobile ? '14px' : '18px 24px 28px' }}>
        {showSearchPrompt && !loading && (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--lgray)',
              borderRadius: 16,
              padding: isMobile ? '20px 16px' : '24px 22px',
              textAlign: 'center',
              color: '#475569',
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
              Enter a ZIP to browse nearby roster spots
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              This page now starts local-first. Add a ZIP and distance to see active roster needs near you.
            </div>
          </div>
        )}

        {hasNoResults && (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--lgray)',
              borderRadius: 16,
              padding: isMobile ? '20px 16px' : '24px 22px',
              textAlign: 'center',
              color: '#475569',
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
              No open roster spots matched this area
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
              Try a larger radius or post a roster spot for your team.
            </div>
            <button
              type="button"
              onClick={() => setView('post')}
              style={{
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontFamily: 'var(--font-head)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Post a Roster Spot
            </button>
          </div>
        )}

        {hasLocalSearch && filtered.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((spot) => (
              <RosterRow key={spot.id} spot={spot} isMobile={isMobile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ overflowX: 'clip', background: isMobile ? undefined : 'var(--cream)' }}>
      {isMobile ? (
        browseContent
      ) : (
        <div style={{ padding: '18px 14px 28px' }}>
          <div
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '160px minmax(0, 1fr) 160px',
              gap: 18,
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
              <SkyscraperAdSlot slotKey="roster_spots_left_rail_1_desktop" />
            </aside>

            <main style={{ minWidth: 0 }}>{browseContent}</main>

            <aside
              style={{
                position: 'sticky',
                top: HEADER_H + 12,
                alignSelf: 'start',
                width: 160,
                justifySelf: 'end',
              }}
            >
              <SkyscraperAdSlot slotKey="roster_spots_right_rail_1_desktop" />
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}