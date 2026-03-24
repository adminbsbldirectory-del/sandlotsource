import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabase.js'
import DuplicateWarning from './DuplicateWarning.jsx'

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
      state: normalizeStateValue(place['state abbreviation'] || place['state']),
    }
  } catch {
    return null
  }
}

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getResolvedCity(addr = {}) {
  return addr.municipality || addr.suburb || addr.city || addr.town || addr.village || addr.hamlet || null
}

function getResolvedState(addr = {}) {
  return normalizeStateValue(addr.state_code || addr.state || null) || null
}

function normalizeZipCode(value) {
  const match = String(value || '').match(/\b\d{5}\b/)
  return match ? match[0] : ''
}

function normalizeStateValue(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) return upper

  const map = {
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA', COLORADO: 'CO',
    CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID',
    ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA', KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA',
    MAINE: 'ME', MARYLAND: 'MD', MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
    MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH',
    OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA',
    WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY',
  }

  return map[upper] || upper
}

function normalizeStreetForGeocode(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  return raw
    .replace(/,\s*(ste|suite|unit|#|bldg|building|fl|floor)\b.*$/i, '')
    .replace(/\s+(ste|suite|unit|#|bldg|building|fl|floor)\b.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

async function geocodeAddress(address, city, state, zip) {
  const rawStreet = String(address || '').trim()
  if (!rawStreet) return null

  const street = normalizeStreetForGeocode(rawStreet) || rawStreet
  const zipGeo = zip && zip.length === 5 ? await geocodeZip(zip) : null
  const streetVariants = Array.from(new Set([street, rawStreet].filter(Boolean)))
  const queries = Array.from(new Set(streetVariants.flatMap((streetLine) => [
    [streetLine, zip].filter(Boolean).join(', '),
    [streetLine, normalizeStateValue(state), zip].filter(Boolean).join(', '),
    [streetLine, city, normalizeStateValue(state)].filter(Boolean).join(', '),
    [streetLine, city, normalizeStateValue(state), zip].filter(Boolean).join(', '),
  ].filter(Boolean))))

  const candidates = []

  for (const query of queries) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('countrycodes', 'us')
      url.searchParams.set('limit', '5')
      url.searchParams.set('q', query)

      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      })
      if (!res.ok) continue
      const data = await res.json()
      for (const row of Array.isArray(data) ? data : []) {
        const lat = parseFloat(row.lat)
        const lng = parseFloat(row.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

        const addr = row.address || {}
        let score = 0
        if (addr.house_number) score += 6
        if (addr.road) score += 5
        if (zip && String(addr.postcode || '').includes(zip)) score += 6
        const cityNeedle = String(city || '').trim().toLowerCase()
        const cityHay = [addr.city, addr.town, addr.village, addr.hamlet, row.display_name].filter(Boolean).join(' ').toLowerCase()
        if (cityNeedle && cityHay.includes(cityNeedle)) score += 4
        if (state && String(addr.state || addr.state_code || row.display_name || '').toLowerCase().includes(String(state).toLowerCase())) score += 3
        if (zipGeo) {
          const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)
          score -= Math.min(dist, 25) / 2
          if (dist > 20) score -= 10
        }

        candidates.push({
          lat,
          lng,
          score,
          city: getResolvedCity(addr),
          state: getResolvedState(addr),
          zip_code: normalizeZipCode(addr.postcode || zip),
        })
      }
      if (candidates.length) break
    } catch (err) {
      console.error('Geocode error', err)
    }
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return {
    lat: candidates[0].lat,
    lng: candidates[0].lng,
    city: candidates[0].city || String(city || '').trim() || null,
    state: normalizeStateValue(candidates[0].state || state) || null,
    zip_code: candidates[0].zip_code || normalizeZipCode(zip) || null,
  }
}

async function resolveBestLocation(address, city, state, zip) {
  const street = String(address || '').trim()
  if (street) {
    const exact = await geocodeAddress(street, city, state, zip)
    if (exact) return { ...exact, source: 'address' }
  }

  const zipGeo = await geocodeZip(String(zip || '').trim())
  if (zipGeo) {
    return {
      lat: zipGeo.lat,
      lng: zipGeo.lng,
      city: String(city || '').trim() || zipGeo.city || null,
      state: normalizeStateValue(state) || zipGeo.state || null,
      zip_code: normalizeZipCode(zip) || null,
      source: 'zip',
    }
  }

  return null
}

function hasLocationContext(city, state, zip) {
  const cleanZip = normalizeZipCode(zip)
  if (cleanZip && cleanZip.length === 5) return true
  return Boolean(String(city || '').trim() && normalizeStateValue(state))
}

function applyResolvedCoordsPreservingLocality(current, resolved, options = {}) {
  if (!resolved) return { ...current }
  const preserveLocality = options.preserveLocality !== false
  const next = {
    ...current,
    lat: resolved.lat,
    lng: resolved.lng,
  }

  if (preserveLocality) {
    next.city = String(current.city || '').trim() || resolved.city || ''
    next.state = normalizeStateValue(current.state) || normalizeStateValue(resolved.state) || ''
    next.zip_code = normalizeZipCode(current.zip_code) || normalizeZipCode(resolved.zip_code) || ''
    return next
  }

  next.city = resolved.city || String(current.city || '').trim() || ''
  next.state = normalizeStateValue(resolved.state || current.state) || ''
  next.zip_code = normalizeZipCode(resolved.zip_code) || normalizeZipCode(current.zip_code) || ''
  return next
}

function applyResolvedFacilityCoordsPreservingLocality(current, resolved) {
  if (!resolved) return { ...current }
  return {
    ...current,
    facility_lat: resolved.lat,
    facility_lng: resolved.lng,
    facility_city: String(current.facility_city || '').trim() || resolved.city || '',
    facility_state: normalizeStateValue(current.facility_state) || normalizeStateValue(resolved.state) || '',
    facility_zip_code: normalizeZipCode(current.facility_zip_code) || normalizeZipCode(resolved.zip_code) || '',
  }
}

function normalizeFacilityName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bhs\b/g, ' high school ')
    .replace(/\bh\.?s\.?\b/g, ' high school ')
    .replace(/\bms\b/g, ' middle school ')
    .replace(/\brec\b/g, ' recreation ')
    .replace(/\bctr\b/g, ' center ')
    .replace(/\bath\b/g, ' athletics ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAddress(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\b/g, ' street ')
    .replace(/\brd\b/g, ' road ')
    .replace(/\bave\b/g, ' avenue ')
    .replace(/\bdr\b/g, ' drive ')
    .replace(/\bln\b/g, ' lane ')
    .replace(/\bblvd\b/g, ' boulevard ')
    .replace(/\bct\b/g, ' court ')
    .replace(/\bcir\b/g, ' circle ')
    .replace(/\bpkwy\b/g, ' parkway ')
    .replace(/\bhwy\b/g, ' highway ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizedTokens(value) {
  return Array.from(new Set(String(value || '').split(' ').filter(Boolean)))
}

function tokenSimilarity(a, b) {
  const aTokens = normalizedTokens(a)
  const bTokens = normalizedTokens(b)
  if (!aTokens.length || !bTokens.length) return 0

  const bSet = new Set(bTokens)
  const overlap = aTokens.filter((token) => bSet.has(token)).length
  return overlap / Math.max(aTokens.length, bTokens.length)
}

function scoreFacilityCandidate(input, row) {
  const inputName = normalizeFacilityName(input.facilityName)
  const rowName = normalizeFacilityName(row.name)
  const inputAddress = normalizeAddress(input.address)
  const rowAddress = normalizeAddress(row.address)
  const inputCity = String(input.city || '').trim().toLowerCase()
  const rowCity = String(row.city || '').trim().toLowerCase()
  const inputState = String(input.state || '').trim().toLowerCase()
  const rowState = String(row.state || '').trim().toLowerCase()
  const inputZip = String(input.zipCode || '').trim()
  const rowZip = String(row.zip_code || '').trim()

  const exactAddress = !!inputAddress && !!rowAddress && inputAddress === rowAddress
  const sameCity = !!inputCity && !!rowCity && inputCity === rowCity
  const sameState = !!inputState && !!rowState && inputState === rowState
  const sameCityState = sameCity && sameState
  const sameZip = !!inputZip && !!rowZip && inputZip === rowZip
  const exactName = !!inputName && !!rowName && inputName === rowName
  const containsName =
    !!inputName &&
    !!rowName &&
    (inputName.includes(rowName) || rowName.includes(inputName))
  const nameSimilarity = inputName && rowName ? Math.max(tokenSimilarity(inputName, rowName), containsName ? 0.92 : 0) : 0

  let score = nameSimilarity
  if (exactAddress) score = Math.max(score, 0.99)
  if (exactName && sameZip) score = Math.max(score, 0.96)
  if (nameSimilarity >= 0.82 && sameZip) score = Math.max(score, 0.93)
  if (nameSimilarity >= 0.72 && sameCityState) score = Math.max(score, 0.82)

  let matchType = null
  if (exactAddress || (exactName && sameZip) || (nameSimilarity >= 0.82 && sameZip)) {
    matchType = 'strong'
  } else if (nameSimilarity >= 0.72 && sameCityState) {
    matchType = 'soft'
  }

  if (!matchType) return null

  const reasons = []
  if (exactAddress) reasons.push('same address')
  if (sameZip) reasons.push('same zip')
  if (sameCityState) reasons.push('same city/state')
  if (exactName) reasons.push('same normalized name')
  else if (nameSimilarity >= 0.72) reasons.push('similar name')

  return {
    ...row,
    score,
    matchType,
    reasons,
    address: row.address || null,
  }
}

async function searchFacilityCandidates({ facilityName, address, city, state, zipCode }) {
  const trimmedName = String(facilityName || '').trim()
  const trimmedAddress = String(address || '').trim()
  const trimmedCity = String(city || '').trim()
  const trimmedState = String(state || '').trim()
  const trimmedZip = String(zipCode || '').trim()

  if (!trimmedName && !trimmedAddress) return []

  const map = new Map()
  const addRows = (rows) => {
    for (const row of rows || []) {
      if (row?.id && !map.has(row.id)) map.set(row.id, row)
    }
  }

  if (trimmedZip) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, name, address, city, state, zip_code, lat, lng')
      .eq('zip_code', trimmedZip)
      .limit(25)

    if (error) throw error
    addRows(data)
  }

  if (trimmedCity && trimmedState) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, name, address, city, state, zip_code, lat, lng')
      .ilike('city', trimmedCity)
      .eq('state', trimmedState)
      .limit(40)

    if (error) throw error
    addRows(data)
  }

  if (trimmedName) {
    const firstToken = normalizeFacilityName(trimmedName).split(' ')[0]
    if (firstToken) {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, address, city, state, zip_code, lat, lng')
        .ilike('name', `%${firstToken}%`)
        .limit(40)

      if (error) throw error
      addRows(data)
    }
  }

  const scored = Array.from(map.values())
    .map((row) => scoreFacilityCandidate({
      facilityName: trimmedName,
      address: trimmedAddress,
      city: trimmedCity,
      state: trimmedState,
      zipCode: trimmedZip,
    }, row))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return scored
}

async function findMatchingFacility({ facilityName, address, city, state, zipCode }) {
  const matches = await searchFacilityCandidates({ facilityName, address, city, state, zipCode })
  return matches.find((match) => match.matchType === 'strong') || null
}

function useFacilityDuplicateCheck({ facilityName, address, city, state, zipCode, enabled = true }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setMatches([])
      setLoading(false)
      return
    }

    const trimmedName = String(facilityName || '').trim()
    const trimmedAddress = String(address || '').trim()

    if (!trimmedName && !trimmedAddress) {
      setMatches([])
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const nextMatches = await searchFacilityCandidates({ facilityName, address, city, state, zipCode })
        if (!cancelled) setMatches(nextMatches)
      } catch (err) {
        console.error('Facility duplicate lookup error', err)
        if (!cancelled) setMatches([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [facilityName, address, city, state, zipCode, enabled])

  return { matches, loading }
}


function appendLabeledNote(existingNotes, label, value) {
  const trimmedValue = String(value || '').trim()
  if (!trimmedValue) return String(existingNotes || '').trim() || null
  const current = String(existingNotes || '').trim()
  const line = `${label}: ${trimmedValue}`
  if (!current) return line
  if (current.includes(line)) return current
  return `${line}
${current}`
}

function applyExistingFacilityToCoachForm(form, match) {
  return {
    ...form,
    facility_name: match.name || form.facility_name,
    address: match.address || form.address,
    city: match.city || form.city,
    state: match.state || form.state,
    zip_code: match.zip_code || form.zip_code,
    lat: match.lat != null ? match.lat : form.lat,
    lng: match.lng != null ? match.lng : form.lng,
  }
}

function applyExistingFacilityToTeamForm(form, match) {
  return {
    ...form,
    facility_name: match.name || form.facility_name,
    facility_address: match.address || form.facility_address,
    facility_city: match.city || form.facility_city,
    facility_state: match.state || form.facility_state,
    facility_zip_code: match.zip_code || form.facility_zip_code,
    facility_lat: match.lat != null ? match.lat : form.facility_lat,
    facility_lng: match.lng != null ? match.lng : form.facility_lng,
  }
}

function shouldResetAcceptedFacility(field, value, currentValue, identityFields) {
  return identityFields.includes(field) && String(currentValue ?? '') !== String(value ?? '')
}

async function findOrCreateFacilityFromCoach(form, selectedExistingFacilityId = null) {
  const facilityName = form.facility_name.trim()
  if (!facilityName) return null
  if (selectedExistingFacilityId) return selectedExistingFacilityId

  const existing = await findMatchingFacility({
    facilityName,
    address: form.address,
    city: form.city,
    state: form.state,
    zipCode: form.zip_code,
  })

  if (existing) return existing.id

  const facilityPayload = {
    name: facilityName,
    sport: form.sport || null,
    sport_served: form.sport || null,
    city: form.city.trim() || null,
    state: normalizeStateValue(form.state) || null,
    zip_code: form.zip_code || null,
    lat: form.lat != null ? parseFloat(form.lat) : null,
    lng: form.lng != null ? parseFloat(form.lng) : null,
    address: form.address.trim() || null,
    website: form.website.trim() || null,
    instagram: form.instagram.trim() || null,
    facebook: form.facebook.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    contact_name: form.name.trim() || null,
    contact_email: form.email.trim() || null,
    contact_phone: form.phone.trim() || null,
    submission_notes: 'Auto-created from coach submission',
    source: 'coach_submission_auto_create',
    approval_status: 'pending',
    active: true,
  }

  const { data, error } = await supabase
    .from('facilities')
    .insert([facilityPayload])
    .select('id')
    .single()

  if (error) throw error
  return data?.id || null
}

// findOrCreateFacilityFromTeam removed — teams now link to existing facilities
// via checkbox + live search. Facility records are only created through the
// dedicated Facility tab, never auto-created from team submissions.

function parseAgeGroupsInput(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

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

const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','High School','College','Adult']
const POSITIONS_BB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']
const POSITIONS_SB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']
const COACH_SPECIALTIES = ['Pitching','Hitting','Catching','Fielding','Strength / Conditioning']
const US_STATE_ABBRS = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const TEAM_SANCTION_OPTIONS = [
  'USSSA',
  'Perfect Game',
  'PGF',
  'USA Softball',
  'USFA',
  'Top Gun',
  'Triple Crown',
  'Independent',
  'Other',
]

const TEAM_CLASSIFICATION_OPTIONS = {
  baseball: ['A', 'AA', 'AAA', 'Majors', 'Open'],
  softball: ['A', 'B', 'C', 'Open'],
}

const FACILITY_TYPE_OPTIONS = [
  { value: 'park_field', label: 'Park / Rec Field' },
  { value: 'training_facility', label: 'Training Facility' },
  { value: 'travel_team_facility', label: 'Travel Team Facility' },
  { value: 'school_field', label: 'School Field' },
  { value: 'other', label: 'Other' },
]

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: '#FEE2E2', border: '1px solid #F87171', borderRadius: 8, padding: '10px 14px', margin: '12px 0', color: '#B91C1C', fontSize: 13 }}>
      {msg}
    </div>
  )
}

function SuccessBanner({ message }) {
  return (
    <div style={{ background: '#DCFCE7', border: '2px solid #16A34A', borderRadius: 10, padding: '20px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#15803D', marginBottom: 6 }}>
        Submitted!
      </div>
      <div style={{ fontSize: 14, color: '#166534' }}>{message}</div>
    </div>
  )
}

function ZipField({ value, onChange, onGeocode, label, hint, required }) {
  const [status, setStatus] = useState('')
  const lastLookupRef = useRef('')

  const cleanedValue = String(value || '').replace(/\D/g, '').slice(0, 5)

  useEffect(() => {
    let cancelled = false

    async function runLookup() {
      if (cleanedValue.length !== 5) {
        if (cleanedValue.length === 0) setStatus('')
        return
      }
      if (lastLookupRef.current === cleanedValue) return
      lastLookupRef.current = cleanedValue
      setStatus('loading')
      const geo = await geocodeZip(cleanedValue)
      if (cancelled) return
      if (geo) {
        setStatus('ok')
        onGeocode(geo)
      } else {
        setStatus('error')
        onGeocode(null)
      }
    }

    runLookup()
    return () => {
      cancelled = true
    }
  }, [cleanedValue, onGeocode])

  function updateZip(nextValue) {
    const digits = String(nextValue || '').replace(/\D/g, '').slice(0, 5)
    if (digits.length < 5) {
      lastLookupRef.current = ''
      if (!digits) setStatus('')
    }
    onChange(digits)
  }

  async function handleBlur() {
    if (cleanedValue.length !== 5) return
    if (lastLookupRef.current !== cleanedValue) {
      setStatus('loading')
      const geo = await geocodeZip(cleanedValue)
      lastLookupRef.current = cleanedValue
      if (geo) {
        setStatus('ok')
        onGeocode(geo)
      } else {
        setStatus('error')
        onGeocode(null)
      }
    }
  }

  return (
    <div>
      <label style={labelStyle}>
        {label || 'Zip Code'}
        {required && <span style={{ color: 'var(--red)' }}> *</span>}
        {status === 'loading' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Checking…</span>}
        {status === 'ok' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Located</span>}
        {status === 'error' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--red)' }}>Zip not found</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={cleanedValue}
        onChange={(e) => updateZip(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          updateZip(e.clipboardData.getData('text'))
        }}
        onBlur={handleBlur}
        placeholder="e.g. 30076"
        style={inputStyle}
      />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{hint || 'Used to place a map pin'}</div>
    </div>
  )
}

const TRAVEL_OPTIONS = [
  { value: 10, label: 'Up to 10 miles' },
  { value: 25, label: 'Up to 25 miles' },
  { value: 50, label: 'Up to 50 miles' },
  { value: 75, label: 'Up to 75 miles' },
  { value: 100, label: 'Up to 100 miles' },
  { value: 150, label: 'Up to 150 miles' },
  { value: 999, label: 'Anywhere' },
]

function DistanceSlider({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>Willing to Travel</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} style={selectStyle}>
        {TRAVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SocialInput({ prefix, value, onChange, placeholder }) {
  return (
    <div className="input-prefix-wrap">
      <span className="input-prefix">{prefix}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

// ── FACILITY SEARCH SELECT ────────────────────────────────
// Shared component used by TeamForm and CoachForm.
// Renders a live-search input querying approved facilities
// from Supabase. On selection stores id + display name.
function FacilitySearchSelect({ selectedFacility, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const trimmed = String(query || '').trim()
    if (!trimmed) {
      setResults([])
      setShowResults(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('facilities')
          .select('id, name, city, state, zip_code, address')
          .ilike('name', '%' + trimmed + '%')
          .in('approval_status', ['approved', 'seeded'])
          .eq('active', true)
          .order('name')
          .limit(8)
        if (!cancelled) {
          setResults(data || [])
          setShowResults(true)
          setSearching(false)
        }
      } catch {
        if (!cancelled) { setResults([]); setSearching(false) }
      }
    }, 280)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedFacility) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#EFF6FF',
        border: '2px solid #BFDBFE',
        borderRadius: 8,
        padding: '10px 14px',
        gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{selectedFacility.name}</div>
          {(selectedFacility.city || selectedFacility.state) && (
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              {[selectedFacility.city, selectedFacility.state].filter(Boolean).join(', ')}
              {selectedFacility.zip_code ? ' ' + selectedFacility.zip_code : ''}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gray)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            padding: '4px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
          }}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowResults(true) }}
          placeholder="Search by facility name…"
          style={{ ...inputStyle, paddingRight: 36 }}
        />
        {searching && (
          <span style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)', fontSize: 11, color: '#888',
          }}>
            Searching…
          </span>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#fff',
          border: '2px solid var(--lgray)',
          borderRadius: 8,
          marginTop: 4,
          zIndex: 50,
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          {results.map((f, idx) => (
            <button
              key={f.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(f)
                setQuery('')
                setResults([])
                setShowResults(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: idx < results.length - 1 ? '1px solid var(--lgray)' : 'none',
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>{f.name}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                {[f.city, f.state].filter(Boolean).join(', ')}
                {f.zip_code ? ' · ' + f.zip_code : ''}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !searching && String(query || '').trim().length > 1 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '2px solid var(--lgray)', borderRadius: 8,
          marginTop: 4, zIndex: 50, padding: '12px 14px',
          fontSize: 13, color: 'var(--gray)',
        }}>
          No facilities found. If it doesn't exist yet, leave unchecked and submit a facility listing separately.
        </div>
      )}
    </div>
  )
}

// ── COACH FORM ────────────────────────────────────────────
// ── COACH FORM ────────────────────────────────────────────
function CoachForm({ isMobile }) {
  const g2 = isMobile ? '1fr' : '1fr 1fr'
  const g3 = isMobile ? '1fr' : '1fr 1fr 1fr'

  const [form, setForm] = useState({
    name: '',
    sport: 'baseball',
    specialty: [],
    city: '',
    state: '',
    zip_code: '',
    lat: null,
    lng: null,
    address: '',
    facility_name: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    credentials: '',
    bio: '',
    age_groups: '',
    skill_level: '',
    price_per_session: '',
    price_notes: '',
    contact_role: '',
    submission_notes: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [addrStatus, setAddrStatus] = useState('')
  const [selectedFacilityMatch, setSelectedFacilityMatch] = useState(null)
  const [selectedFacilityId, setSelectedFacilityId] = useState(null)
  const [allowCreateNewFacility, setAllowCreateNewFacility] = useState(false)

  const { matches: facilityMatches, loading: facilityMatchLoading } = useFacilityDuplicateCheck({
    facilityName: form.facility_name,
    address: form.address,
    city: form.city,
    state: form.state,
    zipCode: form.zip_code,
  })

  const visibleFacilityMatches = useMemo(() => {
    if (allowCreateNewFacility || selectedFacilityMatch) return []
    return facilityMatches
  }, [facilityMatches, allowCreateNewFacility, selectedFacilityMatch])

  function set(field, value) {
    const facilityIdentityFields = ['facility_name', 'address', 'city', 'state', 'zip_code']
    setError('')
    setForm((f) => {
      const shouldReset = shouldResetAcceptedFacility(field, value, f[field], facilityIdentityFields)
      if (shouldReset) {
        setAllowCreateNewFacility(false)
        setSelectedFacilityMatch(null)
        setSelectedFacilityId(null)
      }
      return { ...f, [field]: value }
    })
  }

  function toggleSpecialty(v) {
    setForm((f) => ({
      ...f,
      specialty: f.specialty.includes(v)
        ? f.specialty.filter((s) => s !== v)
        : [...f.specialty, v],
    }))
  }

  function handleZipGeocode(geo) {
    if (geo) {
      setForm((f) => ({
        ...f,
        lat: f.lat || geo.lat,
        lng: f.lng || geo.lng,
        city: geo.city || f.city,
        state: normalizeStateValue(geo.state) || normalizeStateValue(f.state) || '',
      }))
    }
  }

  async function handleAddressBlur() {
    if (!String(form.address || '').trim()) {
      setAddrStatus('')
      return
    }

    if (!hasLocationContext(form.city, form.state, form.zip_code)) {
      setAddrStatus('needs_location')
      return
    }

    setAddrStatus('locating')
    const resolved = await resolveBestLocation(form.address, form.city, form.state, form.zip_code)
    if (!resolved) {
      setAddrStatus('')
      return
    }

    setForm((f) => ({
      ...f,
      lat: resolved.lat,
      lng: resolved.lng,
      city: f.city || resolved.city || '',
      state: normalizeStateValue(f.state || resolved.state) || '',
      zip_code: f.zip_code || resolved.zip_code || '',
    }))

    setAddrStatus(resolved.source === 'address' ? 'found' : 'fallback')
  }
  
  function validate() {
    if (!form.name.trim()) return 'Coach / trainer name is required.'
    if (!form.sport) return 'Sport is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.facility_name.trim()) return 'Facility name is required.'
    if (!form.contact_role.trim()) return 'Your role is required.'
    if (!form.email.trim() && !form.phone.trim()) return 'At least one of email or phone is required.'
    return ''
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault()

    const err = validate()
    if (err) {
      setError(err)
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const blockingMatches = facilityMatches.filter((match) => match.id !== selectedFacilityMatch?.id)
      if (!allowCreateNewFacility && !selectedFacilityMatch && blockingMatches.length > 0) {
        setError('Possible existing facility found. Please review the suggestion below before submitting.')
        setSubmitting(false)
        return
      }

      let resolvedForm = { ...form }
      // Only geocode on submit if coordinates not already set from form interaction
      if (resolvedForm.lat == null || resolvedForm.lng == null) {
        const resolvedLocation = await resolveBestLocation(form.address, form.city, form.state, form.zip_code)
        if (resolvedLocation) {
          resolvedForm = applyResolvedCoordsPreservingLocality(resolvedForm, resolvedLocation)
        }
      }

      // Use the matched facility ID if the user accepted an existing match.
      // Do NOT auto-create facility records from coach submissions.
      const facilityId = selectedFacilityMatch?.id || null

      const payload = {
        name: form.name.trim(),
        sport: form.sport,
        specialty: form.specialty.length ? form.specialty : null,
        city: resolvedForm.city.trim() || null,
        state: resolvedForm.state || null,
        zip: resolvedForm.zip_code || null,
        lat: resolvedForm.lat != null ? parseFloat(resolvedForm.lat) : null,
        lng: resolvedForm.lng != null ? parseFloat(resolvedForm.lng) : null,
        address: resolvedForm.address.trim() || null,
        facility_name: resolvedForm.facility_name.trim(),
        facility_id: facilityId,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        credentials: form.credentials.trim() || null,
        bio: form.bio.trim() || null,
        age_groups: parseAgeGroupsInput(form.age_groups),
        skill_level: form.skill_level || null,
        price_per_session: form.price_per_session ? parseFloat(form.price_per_session) : null,
        price_notes: form.price_notes.trim() || null,
        contact_role: form.contact_role.trim(),
        submission_notes: form.submission_notes.trim() || null,
        approval_status: 'pending',
        source: 'website_form',
        active: true,
        verified_status: false,
      }

      const { error: sbError } = await supabase.from('coaches').insert([payload])
      if (sbError) throw sbError

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return <SuccessBanner message="Your coach profile has been submitted for review. We'll have it live within a few days." />
  }

  return (
    <div>
      <DuplicateWarning
        matches={visibleFacilityMatches}
        loading={facilityMatchLoading}
        mode="facility"
        selectedId={selectedFacilityMatch?.id || null}
        onUseExisting={(match) => {
          setSelectedFacilityMatch(match)
          setSelectedFacilityId(match.id || null)
          setAllowCreateNewFacility(false)
          setForm((f) => applyExistingFacilityToCoachForm(f, match))
          setError('')
        }}
        onCreateNewAnyway={() => {
          setSelectedFacilityMatch(null)
          setSelectedFacilityId(null)
          setAllowCreateNewFacility(true)
          setError('')
        }}
        onDismiss={() => {
          setSelectedFacilityMatch(null)
          setSelectedFacilityId(null)
          setAllowCreateNewFacility(true)
          setError('')
        }}
      />

      <div className="form-section">
        <div className="form-section-title">1. The Basics</div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Sport <RequiredMark /></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['baseball', 'softball', 'both'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('sport', s)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '2px solid',
                  cursor: 'pointer',
                  borderColor: form.sport === s ? 'var(--navy)' : 'var(--lgray)',
                  background: form.sport === s ? 'var(--navy)' : 'white',
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

        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Coach / Trainer Name <RequiredMark /></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Facility / Business Name <RequiredMark /></label>
            <input value={form.facility_name} onChange={(e) => set('facility_name', e.target.value)} placeholder="e.g. El Dojo, GrandSlam" style={inputStyle} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
              We will suggest an existing facility if one already looks like a match.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>
            Street Address
            {addrStatus === 'locating' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Locating…</span>}
            {addrStatus === 'found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Pin placed at address</span>}
            {addrStatus === 'fallback' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Address not found — using zip pin</span>}
            {addrStatus === 'needs_location' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Enter zip or city/state first</span>}
          </label>
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            onBlur={handleAddressBlur}
            placeholder="Optional street address for more accurate map placement"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
          <ZipField value={form.zip_code} onChange={(v) => set('zip_code', v)} onGeocode={handleZipGeocode} required hint="Enter zip first to auto-fill city and state" />
          <div>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Auto-filled from zip" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <select value={form.state} onChange={(e) => set('state', e.target.value)} style={selectStyle}>
              <option value="">Select</option>
              {US_STATE_ABBRS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">2. Professional Specs</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Specialty</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {COACH_SPECIALTIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleSpecialty(item)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '2px solid',
                  cursor: 'pointer',
                  borderColor: form.specialty.includes(item) ? 'var(--navy)' : 'var(--lgray)',
                  background: form.specialty.includes(item) ? 'var(--navy)' : 'white',
                  color: form.specialty.includes(item) ? 'white' : 'var(--navy)',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Credentials / Background</label>
          <input value={form.credentials} onChange={(e) => set('credentials', e.target.value)} placeholder="e.g. Former MiLB pitcher, Masters in Biomechanics" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Bio / Description</label>
          <textarea value={form.bio} onChange={(e) => set('bio', e.target.value)} rows={3} placeholder="Tell families about your coaching style, experience, and approach..." style={textareaStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Age Groups Served</label>
            <input value={form.age_groups} onChange={(e) => set('age_groups', e.target.value)} placeholder="e.g. 10U, 12U, 14U" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Skill Level</label>
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} style={selectStyle}>
              <option value="">All levels</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Elite / Travel</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 0 }}>
          <div>
            <label style={labelStyle}>Price Per Session ($)</label>
            <input type="number" min="0" value={form.price_per_session} onChange={(e) => set('price_per_session', e.target.value)} placeholder="e.g. 70" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Price Notes</label>
            <input value={form.price_notes} onChange={(e) => set('price_notes', e.target.value)} placeholder="e.g. Group rates available" style={inputStyle} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">3. Contact &amp; Social</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Your Role <RequiredMark /></label>
          <input value={form.contact_role} onChange={(e) => set('contact_role', e.target.value)} placeholder="e.g. Coach (self), Facility Owner, Parent submitting for coach" style={inputStyle} />
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Helps us understand your relationship to this listing</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="coach@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. 770-555-0100" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <SocialInput prefix="@" value={form.instagram} onChange={(v) => set('instagram', v)} placeholder="handle" />
          </div>
          <div>
            <label style={labelStyle}>Facebook</label>
            <SocialInput prefix="facebook.com/" value={form.facebook} onChange={(v) => set('facebook', v)} placeholder="page name" />
          </div>
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Submission Notes</label>
          <textarea value={form.submission_notes} onChange={(e) => set('submission_notes', e.target.value)} rows={2} placeholder="Anything else we should know when reviewing this listing?" style={textareaStyle} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
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
        {submitting ? 'Submitting…' : 'Submit Coach Profile'}
      </button>
    </div>
  )
}

// ── TEAM FORM ─────────────────────────────────────────────
function TeamForm({ isMobile }) {
  const g2 = isMobile ? '1fr' : '1fr 1fr'
  const g3 = isMobile ? '1fr' : '1fr 1fr 1fr'

  const [form, setForm] = useState({
    name: '',
    sport: 'baseball',
    org_affiliation: '',
    classification: '',
    age_group: '',
    practice_location_name: '',
    city: '',
    state: '',
    zip_code: '',
    lat: null,
    lng: null,
    address: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    tryout_status: 'closed',
    tryout_date: '',
    tryout_notes: '',
    description: '',
    submission_notes: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [addrStatus, setAddrStatus] = useState('')
  // Facility association — checkbox + selected facility record
  const [linkToFacility, setLinkToFacility] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)

  function set(field, value) {
    setError('')
    setForm((f) => ({ ...f, [field]: value }))
  }

  const classificationOptions =
    TEAM_CLASSIFICATION_OPTIONS[form.sport] || TEAM_CLASSIFICATION_OPTIONS.baseball

  function handleGeocode(geo) {
    if (geo) {
      setForm((f) => ({
        ...f,
        lat: geo.lat,
        lng: geo.lng,
        city: geo.city || f.city,
        state: normalizeStateValue(geo.state) || normalizeStateValue(f.state) || '',
      }))
    } else {
      setForm((f) => ({ ...f, lat: null, lng: null }))
    }
  }

  async function handlePracticeAddressBlur() {
    if (!String(form.address || '').trim()) {
      setAddrStatus('')
      return
    }

    if (!hasLocationContext(form.city, form.state, form.zip_code)) {
      setAddrStatus('needs_location')
      return
    }

    setAddrStatus('locating')
    const resolved = await resolveBestLocation(form.address, form.city, form.state, form.zip_code)
    if (!resolved) {
      setAddrStatus('')
      return
    }

    setForm((f) => ({
      ...f,
      lat: resolved.lat,
      lng: resolved.lng,
      city: f.city || resolved.city || '',
      state: normalizeStateValue(f.state || resolved.state) || '',
      zip_code: f.zip_code || resolved.zip_code || '',
    }))

    setAddrStatus(resolved.source === 'address' ? 'found' : 'fallback')
  }

  function validate() {
    if (!form.name.trim()) return 'Team name is required.'
    if (!form.sport) return 'Sport is required.'
    if (!form.age_group) return 'Age group is required.'
    if (!form.address.trim()) return 'Practice street address is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Practice zip code is required.'
    if (!form.contact_name.trim()) return 'Contact name is required.'
    if (!form.contact_email.trim() && !form.contact_phone.trim()) {
      return 'At least one of contact email or phone is required.'
    }
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

    try {
      let resolvedForm = { ...form }
      if (resolvedForm.lat == null || resolvedForm.lng == null) {
        const practiceLocation = await resolveBestLocation(form.address, form.city, form.state, form.zip_code)
        if (practiceLocation) {
          resolvedForm = applyResolvedCoordsPreservingLocality(resolvedForm, practiceLocation)
        }
      }

      // facility_id comes directly from the search selection — no auto-create
      const facilityId = selectedFacility?.id || null

      const finalLat = resolvedForm.lat != null ? parseFloat(resolvedForm.lat) : null
      const finalLng = resolvedForm.lng != null ? parseFloat(resolvedForm.lng) : null

      const payload = {
        name: resolvedForm.name.trim(),
        sport: resolvedForm.sport,
        org_affiliation: resolvedForm.org_affiliation || null,
        classification: resolvedForm.classification || null,
        age_group: resolvedForm.age_group,
        practice_location_name: resolvedForm.practice_location_name.trim() || null,
        city: resolvedForm.city.trim(),
        state: normalizeStateValue(resolvedForm.state),
        zip_code: resolvedForm.zip_code || null,
        lat: finalLat,
        lng: finalLng,
        address: resolvedForm.address.trim() || null,

        facility_id: facilityId,
        facility_name: selectedFacility?.name || null,

        contact_name: resolvedForm.contact_name.trim(),
        contact_email: resolvedForm.contact_email.trim() || null,
        contact_phone: resolvedForm.contact_phone.trim() || null,
        website: resolvedForm.website.trim() || null,
        tryout_status: resolvedForm.tryout_status || 'closed',
        tryout_date: resolvedForm.tryout_date || null,
        tryout_notes: resolvedForm.tryout_notes.trim() || null,
        description: resolvedForm.description.trim() || null,
        submission_notes: appendLabeledNote(resolvedForm.submission_notes, 'Practice Location Name', resolvedForm.practice_location_name),
        approval_status: 'pending',
        source: 'website_form',
        active: true,
      }

      const { error: sbError } = await supabase.from('travel_teams').insert([payload])
      if (sbError) throw sbError

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  
  if (submitted) {
    return <SuccessBanner message="Your travel team has been submitted for review. We'll have it live within a few days." />
  }

  return (
    <div>

      <div className="form-section">
        <div className="form-section-title">1. The Basics</div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Sport <RequiredMark /></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['baseball', 'softball'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('sport', s)}
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

       <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
  <div>
    <label style={labelStyle}>Team Name <RequiredMark /></label>
    <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Cherokee Nationals 12U" style={inputStyle} />
  </div>
  <div>
    <label style={labelStyle}>Age Group <RequiredMark /></label>
    <select value={form.age_group} onChange={(e) => set('age_group', e.target.value)} style={selectStyle}>
      <option value="">Select</option>
      {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
    </select>
  </div>
</div>

<div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
  <div>
    <label style={labelStyle}>Sanctioning Body / League</label>
    <select value={form.org_affiliation} onChange={(e) => set('org_affiliation', e.target.value)} style={selectStyle}>
      <option value="">Select</option>
      {TEAM_SANCTION_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
  <div>
    <label style={labelStyle}>Team Classification</label>
    <select value={form.classification} onChange={(e) => set('classification', e.target.value)} style={selectStyle}>
      <option value="">Select</option>
      {classificationOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
</div>

<div style={{
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '12px 14px',
  marginBottom: 14,
  fontSize: 12,
  color: 'var(--gray)',
  lineHeight: 1.5,
}}>
  Use this section for the team-specific field or practice location families should expect most often. This location drives the team map pin.
</div>

<div style={{ marginBottom: 14 }}>
  <label style={labelStyle}>Practice Location Name</label>
  <input
    value={form.practice_location_name}
    onChange={(e) => set('practice_location_name', e.target.value)}
    placeholder="e.g. Brook Run Park, Ninth Inning Baseball, Wills Park Field 3"
    style={inputStyle}
  />
</div>

<div style={{ marginBottom: 14 }}>
  <label style={labelStyle}>
    Practice Street Address <RequiredMark />
    {addrStatus === 'locating' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Locating…</span>}
    {addrStatus === 'found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Pin placed at address</span>}
    {addrStatus === 'fallback' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Address not found — using zip pin</span>}
  </label>
  <input value={form.address} onChange={(e) => set('address', e.target.value)} onBlur={handlePracticeAddressBlur} placeholder="Required field or park address" style={inputStyle} />
</div>

<div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
  <ZipField value={form.zip_code} onChange={(v) => set('zip_code', v)} onGeocode={handleGeocode} required hint="Enter zip first to auto-fill city and state" />
  <div>
    <label style={labelStyle}>Practice City</label>
    <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Auto-filled from zip" style={inputStyle} />
  </div>
  <div>
    <label style={labelStyle}>Practice State</label>
    <select value={form.state} onChange={(e) => set('state', e.target.value)} style={selectStyle}>
      <option value="">Select</option>
      {US_STATE_ABBRS.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
</div>
      </div>

      <div className="form-section">
        <div className="form-section-title">2. Primary / Home Facility</div>

        <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 14 }}>
          Does this team train or operate out of a dedicated facility? (e.g. Georgia Bombers → Grand Slam Johns Creek)
          If not, leave this unchecked — independent teams that use parks or rotate fields don't need one.
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
          <input
            type="checkbox"
            checked={linkToFacility}
            onChange={(e) => {
              setLinkToFacility(e.target.checked)
              if (!e.target.checked) setSelectedFacility(null)
            }}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--navy)' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
            This team is associated with an existing facility
          </span>
        </label>

        {linkToFacility && (
          <div>
            <label style={labelStyle}>Search for facility</label>
            <FacilitySearchSelect
              selectedFacility={selectedFacility}
              onSelect={(f) => setSelectedFacility(f)}
              onClear={() => setSelectedFacility(null)}
            />
            <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
              Only approved facilities appear in search. If yours isn't listed yet, submit it separately via the Facility tab — then come back and link your team.
            </div>
          </div>
        )}
      </div>


      <div className="form-section">
        <div className="form-section-title">3. Tryout Info</div>
        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Tryout Status</label>
            <select value={form.tryout_status} onChange={(e) => set('tryout_status', e.target.value)} style={selectStyle}>
              <option value="closed">Closed / Unknown</option>
              <option value="open">Open</option>
              <option value="year_round">Year Round</option>
              <option value="by_invite">By Invite Only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tryout Date</label>
            <input type="date" value={form.tryout_date} onChange={(e) => set('tryout_date', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Tryout Notes</label>
          <input value={form.tryout_notes} onChange={(e) => set('tryout_notes', e.target.value)} placeholder="e.g. Bring your own helmet. Arrive 15 min early." style={inputStyle} />
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Team Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Tell players and families about your program..." style={textareaStyle} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">3. Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Contact Name <RequiredMark /></label>
            <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
            <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="coach@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Phone</label>
            <input type="tel" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 0 }}>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Submission Notes</label>
            <input value={form.submission_notes} onChange={(e) => set('submission_notes', e.target.value)} placeholder="Anything else we should know?" style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
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
        {submitting ? 'Submitting…' : 'Submit Travel Team'}
      </button>
    </div>
  )
}

// ── PLAYER FORM ───────────────────────────────────────────
function PlayerForm({ isMobile }) {
  const g2 = isMobile ? '1fr' : '1fr 1fr'
  const [postType, setPostType] = useState('player_needed')

  const [form, setForm] = useState({
    sport: 'baseball',
    age_group: '',
    team_name: '',
    position_needed: [],
    city: '',
    zip_code: '',
    lat: null,
    lng: null,
    location_name: '',
    event_date: '',
    player_age: '',
    player_position: [],
    player_description: '',
    contact_info: '',
    additional_notes: '',
    distance_travel: 25,
    bats: '',
    throws: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function togglePos(pos, field) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(pos)
        ? f[field].filter((p) => p !== pos)
        : [...f[field], pos],
    }))
  }

  function handleGeocode(geo) {
    if (geo) {
      setForm((f) => ({ ...f, lat: geo.lat, lng: geo.lng, city: f.city || geo.city }))
    } else {
      setForm((f) => ({ ...f, lat: null, lng: null }))
    }
  }

  function validate() {
    if (!form.sport) return 'Sport is required.'
    if (postType === 'player_needed') {
      if (!form.age_group) return 'Age group is required.'
      if (form.position_needed.length === 0) return 'Select at least one position needed.'
      if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
      if (!form.location_name.trim()) return 'Game / Tournament location is required.'
      if (!form.event_date) return 'Event date is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    } else {
      if (!form.player_age.toString().trim()) return 'Player age is required.'
      if (form.player_position.length === 0) return 'Select at least one position.'
      if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    }
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

    try {
      const travelNote = 'Willing to travel: ' + (form.distance_travel === 999 ? 'Anywhere' : 'up to ' + form.distance_travel + ' miles')
      const notesWithTravel = postType === 'player_available'
        ? [travelNote, form.additional_notes.trim()].filter(Boolean).join('\n')
        : form.additional_notes.trim() || null

      const payload = {
        post_type: postType,
        sport: form.sport,
        city: form.city.trim() || null,
        zip_code: form.zip_code || null,
        lat: form.lat != null ? parseFloat(form.lat) : null,
        lng: form.lng != null ? parseFloat(form.lng) : null,
        contact_info: form.contact_info.trim(),
        additional_notes: notesWithTravel,
        active: true,
        approval_status: 'pending',
        source: 'website_form',
        last_confirmed_at: new Date().toISOString(),
        ...(postType === 'player_needed'
          ? {
              age_group: form.age_group,
              team_name: form.team_name.trim() || null,
              position_needed: form.position_needed,
              location_name: form.location_name.trim(),
              event_date: form.event_date,
            }
          : {
              player_age: form.player_age ? parseInt(form.player_age, 10) : null,
              age_group: form.age_group || null,
              player_position: form.player_position,
              player_description: form.player_description.trim() || null,
              bats: form.bats || null,
              throws: form.throws || null,
            }),
      }

      const { error: sbError } = await supabase.from('player_board').insert([payload])
      if (sbError) throw sbError

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB

  if (submitted) {
    return <SuccessBanner message="Your post has been submitted and will appear on the Player Board once reviewed. Posts expire in 4 days." />
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['player_needed','⚾ Player Needed'],['player_available','🧢 Player Available']].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              setPostType(val)
              setForm((f) => ({
                ...f,
                age_group: '',
                team_name: '',
                position_needed: [],
                location_name: '',
                event_date: '',
                player_age: '',
                player_position: [],
                player_description: '',
                distance_travel: 25,
                bats: '',
                throws: '',
              }))
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              border: '2px solid',
              cursor: 'pointer',
              borderColor: postType === val ? 'var(--navy)' : 'var(--lgray)',
              background: postType === val ? 'var(--navy)' : 'white',
              color: postType === val ? 'white' : 'var(--navy)',
              fontWeight: 600,
              fontSize: 14,
              fontFamily: 'var(--font-body)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['baseball','softball'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('sport', s)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'var(--lgray)',
                background: form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'white',
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

      {postType === 'player_needed' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Age Group <RequiredMark /></label>
              <select value={form.age_group} onChange={(e) => set('age_group', e.target.value)} style={selectStyle}>
                <option value="">Select</option>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Team Name</label>
              <input value={form.team_name} onChange={(e) => set('team_name', e.target.value)} placeholder="e.g. Cherokee Nationals" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Position(s) Needed <RequiredMark /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {positions.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePos(pos, 'position_needed')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: '2px solid',
                    cursor: 'pointer',
                    borderColor: form.position_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                    background: form.position_needed.includes(pos) ? 'var(--navy)' : 'white',
                    color: form.position_needed.includes(pos) ? 'white' : 'var(--navy)',
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
            <label style={labelStyle}>Game / Tournament Location <RequiredMark /></label>
            <input value={form.location_name} onChange={(e) => set('location_name', e.target.value)} placeholder="e.g. Wills Park Field 3, Seckinger High School" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Event Date <RequiredMark /></label>
              <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Auto-filled from zip" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <ZipField value={form.zip_code} onChange={(v) => set('zip_code', v)} onGeocode={handleGeocode} required hint="Enter zip first to auto-fill city for area matching" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={(e) => set('additional_notes', e.target.value)} rows={3} placeholder="Practice schedule, skill level expected, tryout info..." style={textareaStyle} />
          </div>
        </>
      )}

      {postType === 'player_available' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Player Age <RequiredMark /></label>
              <input type="number" min="6" max="99" value={form.player_age} onChange={(e) => set('player_age', e.target.value)} placeholder="e.g. 12" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Age Group</label>
              <select value={form.age_group} onChange={(e) => set('age_group', e.target.value)} style={selectStyle}>
                <option value="">Select</option>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Position(s) <RequiredMark /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {positions.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePos(pos, 'player_position')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: '2px solid',
                    cursor: 'pointer',
                    borderColor: form.player_position.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                    background: form.player_position.includes(pos) ? 'var(--navy)' : 'white',
                    color: form.player_position.includes(pos) ? 'white' : 'var(--navy)',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Bats</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['R','L','S'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('bats', form.bats === v ? '' : v)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 8,
                      border: '2px solid',
                      cursor: 'pointer',
                      borderColor: form.bats === v ? 'var(--navy)' : 'var(--lgray)',
                      background: form.bats === v ? 'var(--navy)' : 'white',
                      color: form.bats === v ? 'white' : 'var(--navy)',
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {v === 'S' ? 'Switch' : v === 'R' ? 'Right' : 'Left'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Throws</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['R','L'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('throws', form.throws === v ? '' : v)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 8,
                      border: '2px solid',
                      cursor: 'pointer',
                      borderColor: form.throws === v ? 'var(--navy)' : 'var(--lgray)',
                      background: form.throws === v ? 'var(--navy)' : 'white',
                      color: form.throws === v ? 'white' : 'var(--navy)',
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {v === 'R' ? 'Right' : 'Left'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <ZipField value={form.zip_code} onChange={(v) => set('zip_code', v)} onGeocode={handleGeocode} required hint="Enter zip first to auto-fill city" />
          </div>

          <DistanceSlider value={form.distance_travel} onChange={(v) => set('distance_travel', v)} />

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Auto-filled from zip" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.player_description} onChange={(e) => set('player_description', e.target.value)} rows={3} placeholder="Age, skill level, what you're looking for in a team..." style={textareaStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={(e) => set('additional_notes', e.target.value)} rows={2} placeholder="Any other details..." style={textareaStyle} />
          </div>
        </>
      )}

      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Contact Info <RequiredMark /></label>
        <input value={form.contact_info} onChange={(e) => set('contact_info', e.target.value)} placeholder="Email, phone, or Instagram handle" style={inputStyle} />
        <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>Visible publicly. Posts expire after 4 days.</div>
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
          marginTop: 8,
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
        {submitting ? 'Posting…' : 'Submit Post'}
      </button>
    </div>
  )
}

// ── FACILITY FORM ─────────────────────────────────────────
function FacilityForm({ isMobile }) {
  const g2 = isMobile ? '1fr' : '1fr 1fr'
  const g3 = isMobile ? '1fr' : '1fr 1fr 1fr'

  const AMENITY_OPTIONS = ['Batting Cages','Pitching Mounds','Turf Infield','HitTrax','Rapsodo','Video Analysis','Weight Room','Bullpen','Indoor Facility','Outdoor Fields','Lights','Restrooms','Parking','Concessions']

  const [form, setForm] = useState({
    name: '',
    facility_type: '',
    sport: 'both',
    city: '',
    state: '',
    zip_code: '',
    lat: null,
    lng: null,
    address: '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    facebook: '',
    amenities: [],
    description: '',
    hours: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    submission_notes: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [addrStatus, setAddrStatus] = useState('')
  const [selectedFacilityMatch, setSelectedFacilityMatch] = useState(null)
  const [selectedFacilityId, setSelectedFacilityId] = useState(null)
  const [allowCreateNewFacility, setAllowCreateNewFacility] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const { matches: facilityMatches, loading: facilityMatchLoading } = useFacilityDuplicateCheck({
    facilityName: form.name,
    address: form.address,
    city: form.city,
    state: form.state,
    zipCode: form.zip_code,
  })

  const visibleFacilityMatches = useMemo(() => {
    if (allowCreateNewFacility || selectedFacilityMatch) return []
    return facilityMatches
  }, [facilityMatches, allowCreateNewFacility, selectedFacilityMatch])

  function set(field, value) {
    const facilityIdentityFields = ['name', 'address', 'city', 'state', 'zip_code']
    setError('')
    setForm((f) => {
      const shouldReset = shouldResetAcceptedFacility(field, value, f[field], facilityIdentityFields)
      if (shouldReset) {
        setAllowCreateNewFacility(false)
        setSelectedFacilityMatch(null)
        setSelectedFacilityId(null)
      }
      return { ...f, [field]: value }
    })
  }

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }))
  }

  function handleZipGeocode(geo) {
    if (geo) {
      setForm((f) => ({
        ...f,
        lat: f.lat || geo.lat,
        lng: f.lng || geo.lng,
        city: geo.city || f.city,
        state: normalizeStateValue(geo.state) || normalizeStateValue(f.state) || '',
      }))
    }
  }

  async function handleAddressBlur() {
    if (!String(form.address || '').trim()) {
      setAddrStatus('')
      return
    }

    if (!hasLocationContext(form.city, form.state, form.zip_code)) {
      setAddrStatus('needs_location')
      return
    }

    setAddrStatus('locating')
    const resolved = await resolveBestLocation(form.address, form.city, form.state, form.zip_code)
    if (!resolved) {
      setAddrStatus('')
      return
    }

    setForm((f) => ({
      ...f,
      lat: resolved.lat,
      lng: resolved.lng,
      city: f.city || resolved.city || '',
      state: normalizeStateValue(f.state || resolved.state) || '',
      zip_code: f.zip_code || resolved.zip_code || '',
    }))

    setAddrStatus(resolved.source === 'address' ? 'found' : 'fallback')
  }

  function validate() {
    if (!form.name.trim()) return 'Facility name is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.contact_name.trim()) return 'Contact name is required.'
    if (!form.contact_email.trim() && !form.contact_phone.trim()) return 'At least one of contact email or phone is required.'
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }

    const blockingMatches = facilityMatches.filter((match) => match.id !== selectedFacilityMatch?.id)
    if (!allowCreateNewFacility && !selectedFacilityMatch && blockingMatches.length > 0) {
      setError('Possible existing facility found. Please review the suggestion below before submitting.')
      return
    }

    if (selectedFacilityMatch) {
      setSubmitted(true)
      setSuccessMessage('We found an existing facility and reused it. No duplicate facility was created.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      let resolvedForm = { ...form }
      // Only geocode on submit if coordinates not already set from form interaction
      if (resolvedForm.lat == null || resolvedForm.lng == null) {
        const resolvedLocation = await resolveBestLocation(form.address, form.city, form.state, form.zip_code)
        if (resolvedLocation) {
          resolvedForm = applyResolvedCoordsPreservingLocality(resolvedForm, resolvedLocation)
        }
      }

      const payload = {
        name: resolvedForm.name.trim(),
        facility_type: resolvedForm.facility_type || null,
        sport: resolvedForm.sport,
        sport_served: resolvedForm.sport,
        city: resolvedForm.city.trim() || null,
        state: resolvedForm.state || null,
        zip_code: resolvedForm.zip_code || null,
        lat: resolvedForm.lat != null ? parseFloat(resolvedForm.lat) : null,
        lng: resolvedForm.lng != null ? parseFloat(resolvedForm.lng) : null,
        address: resolvedForm.address.trim() || null,
        phone: resolvedForm.phone.trim() || null,
        email: resolvedForm.email.trim() || null,
        website: resolvedForm.website.trim() || null,
        instagram: resolvedForm.instagram.trim() || null,
        facebook: resolvedForm.facebook.trim() || null,
        amenities: resolvedForm.amenities.length > 0 ? resolvedForm.amenities : null,
        description: resolvedForm.description.trim() || null,
        hours: resolvedForm.hours.trim() || null,
        contact_name: resolvedForm.contact_name.trim(),
        contact_email: resolvedForm.contact_email.trim() || null,
        contact_phone: resolvedForm.contact_phone.trim() || null,
        submission_notes: appendLabeledNote(resolvedForm.submission_notes, 'Practice Location Name', resolvedForm.practice_location_name),
        approval_status: 'pending',
        source: 'website_form',
        active: true,
      }

      const { error: sbError } = await supabase.from('facilities').insert([payload])
      if (sbError) throw sbError

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return <SuccessBanner message={successMessage || "Your facility has been submitted for review. We'll have it live within a few days."} />
  }

  return (
    <div>
      <DuplicateWarning
        matches={visibleFacilityMatches}
        loading={facilityMatchLoading}
        mode="facility"
        selectedId={selectedFacilityMatch?.id || null}
        onUseExisting={(match) => {
          setSelectedFacilityMatch(match)
          setSelectedFacilityId(match.id || null)
          setAllowCreateNewFacility(false)
          setForm((f) => ({
            ...f,
            name: match.name || f.name,
            address: match.address || f.address,
            city: match.city || f.city,
            state: match.state || f.state,
            zip_code: match.zip_code || f.zip_code,
            lat: match.lat != null ? match.lat : f.lat,
            lng: match.lng != null ? match.lng : f.lng,
          }))
          setError('')
        }}
        onCreateNewAnyway={() => {
          setSelectedFacilityMatch(null)
          setSelectedFacilityId(null)
          setAllowCreateNewFacility(true)
          setError('')
        }}
        onDismiss={() => {
          setSelectedFacilityMatch(null)
          setSelectedFacilityId(null)
          setAllowCreateNewFacility(true)
          setError('')
        }}
      />

      <div className="form-section">
        <div className="form-section-title">1. The Basics</div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Sport <RequiredMark /></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['baseball','softball','both'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('sport', s)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '2px solid',
                  cursor: 'pointer',
                  borderColor: form.sport === s ? 'var(--navy)' : 'var(--lgray)',
                  background: form.sport === s ? 'var(--navy)' : 'white',
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

        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Facility Name <RequiredMark /></label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Grit Academy Athletics" style={inputStyle} />
            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
              We will suggest an existing facility when the name or address looks close to one already on the site.
            </div>
          </div>
          <div>
            <label style={labelStyle}>Facility Type</label>
            <select value={form.facility_type} onChange={(e) => set('facility_type', e.target.value)} style={selectStyle}>
              <option value="">Select type</option>
              {FACILITY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>
            Street Address
            {addrStatus === 'locating' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Locating…</span>}
            {addrStatus === 'found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Pin placed at address</span>}
            {addrStatus === 'fallback' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Address not found — using zip pin</span>}
            {addrStatus === 'needs_location' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Enter zip or city/state first</span>}
          </label>
          <input value={form.address} onChange={(e) => set('address', e.target.value)} onBlur={handleAddressBlur} placeholder="e.g. 5735 North Commerce Court" style={inputStyle} />
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Enter address then tab out to place an accurate map pin</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 0 }}>
          <ZipField value={form.zip_code} onChange={(v) => set('zip_code', v)} onGeocode={handleZipGeocode} required hint="Enter zip first to auto-fill city and state" />
          <div>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Auto-filled from zip" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>State</label>
            <select value={form.state} onChange={(e) => set('state', e.target.value)} style={selectStyle}>
              <option value="">Select</option>
              {US_STATE_ABBRS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">2. Amenities &amp; Details</div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Amenities / Features</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: '2px solid',
                  cursor: 'pointer',
                  borderColor: form.amenities.includes(a) ? 'var(--navy)' : 'var(--lgray)',
                  background: form.amenities.includes(a) ? 'var(--navy)' : 'white',
                  color: form.amenities.includes(a) ? 'white' : 'var(--navy)',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Tell families what makes your facility special..." style={textareaStyle} />
        </div>

        <div style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Hours of Operation</label>
          <input value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="e.g. Mon-Fri 4-9pm, Sat 8am-5pm" style={inputStyle} />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">3. Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Facility Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Facility Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@facility.com" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <SocialInput prefix="@" value={form.instagram} onChange={(v) => set('instagram', v)} placeholder="handle" />
          </div>
          <div>
            <label style={labelStyle}>Facebook</label>
            <SocialInput prefix="facebook.com/" value={form.facebook} onChange={(v) => set('facebook', v)} placeholder="page name" />
          </div>
        </div>

        <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '14px', border: '1px solid var(--lgray)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Your Contact Info (not public)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12 }}>
            <div>
              <label style={labelStyle}>Your Name <RequiredMark /></label>
              <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
              <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Phone</label>
              <input type="tel" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Submission Notes</label>
        <textarea value={form.submission_notes} onChange={(e) => set('submission_notes', e.target.value)} rows={2} placeholder="Anything else we should know?" style={textareaStyle} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
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
        {submitting ? 'Submitting…' : 'Submit Facility'}
      </button>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────
const TABS = [
  { id: 'coach', label: '⚾ Coach Profile' },
  { id: 'team', label: '🏆 Travel Team' },
  { id: 'player', label: '📋 Player Board' },
  { id: 'roster', label: '🔖 Roster Spot' },
  { id: 'facility', label: '🏟️ Facility' },
]

export default function CoachSubmitForm() {
  const [activeTab, setActiveTab] = useState('coach')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: isMobile ? '24px 14px' : '32px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
          Add a Listing
        </div>
        <div style={{ fontSize: 14, color: 'var(--gray)' }}>All submissions are reviewed before going live. Free to list.</div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid var(--lgray)', paddingBottom: 0, flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const tabStyle = {
            padding: isMobile ? '8px 10px' : '10px 16px',
            fontFamily: 'var(--font-head)',
            fontSize: isMobile ? 11 : 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            border: 'none',
            borderBottom: activeTab === tab.id ? '3px solid var(--red)' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === tab.id ? 'var(--red)' : 'var(--gray)',
            cursor: 'pointer',
            marginBottom: -2,
          }

          if (tab.id === 'roster') {
            return (
              <button
                key="roster"
                type="button"
                onClick={() => { window.location.href = '/roster' }}
                style={{ ...tabStyle, color: 'var(--gray)' }}
              >
                {tab.label}
              </button>
            )
          }

          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={tabStyle}>
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '2px solid var(--lgray)', padding: isMobile ? '20px 16px' : '28px 24px' }}>
        {activeTab === 'coach' && <CoachForm isMobile={isMobile} />}
        {activeTab === 'team' && <TeamForm isMobile={isMobile} />}
        {activeTab === 'player' && <PlayerForm isMobile={isMobile} />}
        {activeTab === 'facility' && <FacilityForm isMobile={isMobile} />}
      </div>
    </div>
  )
}
