import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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
const POSITIONS_BB = ['Pitcher', 'Catcher', '1B', '2B', '3B', 'Shortstop', 'Outfield', 'Utility']
const POSITIONS_SB = ['Pitcher', 'Catcher', '1B', '2B', '3B', 'Shortstop', 'Outfield', 'Utility']

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

function RosterRow({ spot, isMobile }) {
  const positions = Array.isArray(spot.positions_needed) ? spot.positions_needed : []
  const cityStateZip = [spot.city, spot.state].filter(Boolean).join(', ') + (spot.zip_code ? ` ${spot.zip_code}` : '')

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

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
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
    } else {
      setForm((f) => ({ ...f, lat: null, lng: null, state: '' }))
    }
  }

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

    if (sbError) setError('Submission error: ' + (sbError.message || 'Please try again.'))
    else onSubmitted()
  }

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '2px solid var(--lgray)',
        padding: isMobile ? '20px 16px' : '28px 24px',
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-head)',
          fontSize: 20,
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
                set('sport', s)
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

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Team Name</label>
          <input
            value={form.team_name}
            onChange={(e) => set('team_name', e.target.value)}
            placeholder="e.g. Cherokee Nationals"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Org Affiliation</label>
          <input
            value={form.org_affiliation}
            onChange={(e) => set('org_affiliation', e.target.value)}
            placeholder="e.g. USSSA, PGF, Perfect Game"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>
            Age Group <RequiredMark />
          </label>
          <select value={form.age_group} onChange={(e) => set('age_group', e.target.value)} style={selectStyle}>
            <option value="">Select</option>
            {AGE_GROUPS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="e.g. Canton"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, marginBottom: 14 }}>
        <ZipFieldInline value={form.zip_code} onChange={(v) => set('zip_code', v)} onGeocode={handleGeocode} required />
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

      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Contact Name</label>
          <input
            value={form.contact_name}
            onChange={(e) => set('contact_name', e.target.value)}
            placeholder="Coach or contact person"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Contact Info <RequiredMark />
          </label>
          <input
            value={form.contact_info}
            onChange={(e) => set('contact_info', e.target.value)}
            placeholder="Email, phone, or Instagram"
            style={inputStyle}
          />
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
        .select('*')
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
          <div style={{ fontSize: 14, color: '#166534', marginBottom: 20 }}>
            Your listing will appear here once reviewed. It will stay active for 15 days.
          </div>
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
      <div style={{ padding: isMobile ? '20px 14px' : '32px 20px', overflowX: 'clip' }}>
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
        <RosterForm onSubmitted={() => setView('submitted')} isMobile={isMobile} />
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'clip' }}>
      <div
        style={{
          background: 'var(--cream)',
          borderBottom: '2px solid var(--lgray)',
          padding: isMobile ? '18px 14px 16px' : '22px 24px 20px',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: isMobile ? 24 : 26,
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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '14px 14px 0' : '18px 24px 0' }}>
          <div style={{ height: isMobile ? 240 : 320, width: '100%', border: '1px solid var(--lgray)', borderRadius: 16, overflow: 'hidden' }}>
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

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '14px' : '18px 24px 28px' }}>
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
}
