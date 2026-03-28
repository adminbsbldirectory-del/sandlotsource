import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabase.js'
import DuplicateWarning from './DuplicateWarning.jsx'
import ZipField from './submit/ZipField.jsx'
import FacilitySearchSelect from './submit/FacilitySearchSelect.jsx'
import CoachContactSocialSection from './submit/CoachContactSocialSection.jsx'
import SocialInput from './submit/SocialInput.jsx'
import FacilityContactSection from './submit/FacilityContactSection.jsx'
import TeamTryoutInfoSection from './submit/TeamTryoutInfoSection.jsx'
import TeamContactSection from './submit/TeamContactSection.jsx'
import FacilityAmenitiesDetailsSection from './submit/FacilityAmenitiesDetailsSection.jsx'
import CoachProfessionalSpecsSection from './submit/CoachProfessionalSpecsSection.jsx'
import FacilityBasicsSection from './submit/FacilityBasicsSection.jsx'
import CoachBasicsSection from './submit/CoachBasicsSection.jsx'
import TeamBasicsSection from './submit/TeamBasicsSection.jsx'
import TeamFacilitySection from './submit/TeamFacilitySection.jsx'

import {
  applyResolvedCoordsPreservingLocality,
  applyResolvedFacilityCoordsPreservingLocality,
  applyZipLookupLocality,
  distanceMiles,
  finalizeListingLocation,
  geocodeAddress,
  geocodeZip,
  getResolvedCity,
  getResolvedState,
  hasLocationContext,
  normalizeStateValue,
  normalizeStreetForGeocode,
  normalizeZipCode,
  resolveBestLocation,
} from '../lib/submit/geocode.js'

const BLOCKED_GEOCODE_ERROR_PREFIX = 'We could not confidently place that street address.'

function isBlockedGeocodeFailure(message) {
  return String(message || '').includes(BLOCKED_GEOCODE_ERROR_PREFIX)
}

async function notifyBlockedGeocodeSubmit(payload) {
  try {
    await fetch('/api/notify-blocked-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (err) {
    console.error('Blocked geocode notification failed', err)
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


async function createPendingFacilityRecord({ facility, sport, contactName, contactEmail, contactPhone, submissionNotes, source = 'website_form' }) {
  const finalLocation = await finalizeListingLocation({
    address: facility.address,
    city: facility.city,
    state: facility.state,
    zip: facility.zip_code,
    addressRequired: true,
    allowZipFallback: false,
  })

  if (!finalLocation.ok) {
    throw new Error(finalLocation.error)
  }

  const resolved = finalLocation.resolved
  const payload = {
    name: String(facility.name || '').trim(),
    sport: sport || null,
    sport_served: sport || null,
    city: String(facility.city || '').trim() || resolved.city || null,
    state: normalizeStateValue(facility.state) || normalizeStateValue(resolved.state) || null,
    zip_code: normalizeZipCode(facility.zip_code) || normalizeZipCode(resolved.zip_code) || null,
    lat: resolved.lat,
    lng: resolved.lng,
    address: String(facility.address || '').trim() || null,
    website: String(facility.website || '').trim() || null,
    phone: String(facility.phone || '').trim() || null,
    contact_name: String(contactName || '').trim() || null,
    contact_email: String(contactEmail || '').trim() || null,
    contact_phone: String(contactPhone || '').trim() || null,
    approval_status: 'pending',
    source,
    active: true,
    submission_notes: String(submissionNotes || '').trim() || null,
  }

  const { data, error } = await supabase
    .from('facilities')
    .insert([payload])
    .select('id, name, address, city, state, zip_code, lat, lng')
    .single()

  if (error) throw error
  return data
}

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

  const hasFacilityName = Boolean(String(form.facility_name || '').trim())

  const { matches: facilityMatches, loading: facilityMatchLoading } = useFacilityDuplicateCheck({
    facilityName: form.facility_name,
    address: form.address,
    city: form.city,
    state: form.state,
    zipCode: form.zip_code,
    enabled: hasFacilityName,
  })

  const visibleFacilityMatches = useMemo(() => {
    if (!hasFacilityName || allowCreateNewFacility || selectedFacilityMatch) return []
    return facilityMatches
  }, [facilityMatches, allowCreateNewFacility, selectedFacilityMatch, hasFacilityName])

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
    if (!geo) return
    setForm((f) => applyZipLookupLocality(f, geo))
  }

  async function handleAddressBlur() {
    const cleanAddress = String(form.address || '').trim()
    if (!cleanAddress) {
      setAddrStatus('')
      return
    }

    if (!hasLocationContext(form.city, form.state, form.zip_code)) {
      setAddrStatus('needs_location')
      return
    }

    setAddrStatus('locating')
    const resolved = await geocodeAddress(cleanAddress, form.city, form.state, form.zip_code)
    if (!resolved) {
      setAddrStatus('not_found')
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

      setAddrStatus('found')
    }

  function validate() {
    if (!form.name.trim()) return 'Coach / trainer name is required.'
    if (!form.sport) return 'Sport is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
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
      if (hasFacilityName && !allowCreateNewFacility && !selectedFacilityMatch && blockingMatches.length > 0) {
        setError('Possible existing facility found. Please review the suggestion below before submitting.')
        setSubmitting(false)
        return
      }

      let resolvedForm = { ...form }

      if (selectedFacilityMatch) {
        resolvedForm = applyExistingFacilityToCoachForm(resolvedForm, selectedFacilityMatch)
      } else {
        const finalLocation = await finalizeListingLocation({
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip_code,
          allowZipFallback: true,
        })

        if (!finalLocation.ok) {
          if (isBlockedGeocodeFailure(finalLocation.error)) {
            await notifyBlockedGeocodeSubmit({
              listing_type: 'coach',
              submitted_name: form.name,
              address: form.address,
              city: form.city,
              state: form.state,
              zip: form.zip_code,
              contact_name: form.name,
              contact_email: form.email,
              contact_phone: form.phone,
              reason: finalLocation.error,
            })
          }

          setError(finalLocation.error)
          setSubmitting(false)
          return
        }

        resolvedForm = applyResolvedCoordsPreservingLocality(resolvedForm, finalLocation.resolved)
      }

      const facilityId = selectedFacilityMatch?.id || null

      const payload = {
        name: resolvedForm.name.trim(),
        sport: resolvedForm.sport,
        specialty: form.specialty.length ? form.specialty : null,
        city: resolvedForm.city.trim() || null,
        state: resolvedForm.state || null,
        zip: resolvedForm.zip_code || null,
        lat: resolvedForm.lat != null ? parseFloat(resolvedForm.lat) : null,
        lng: resolvedForm.lng != null ? parseFloat(resolvedForm.lng) : null,
        address: resolvedForm.address.trim() || null,
        facility_name: resolvedForm.facility_name.trim() || null,
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

      <CoachBasicsSection
        form={form}
        setField={set}
        g2={g2}
        g3={g3}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        selectStyle={selectStyle}
        addrStatus={addrStatus}
        handleAddressBlur={handleAddressBlur}
        handleZipGeocode={handleZipGeocode}
        stateOptions={US_STATE_ABBRS}
      />

      <CoachProfessionalSpecsSection
        form={form}
        setField={set}
        g2={g2}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        textareaStyle={textareaStyle}
        selectStyle={selectStyle}
        specialtyOptions={COACH_SPECIALTIES}
        toggleSpecialty={toggleSpecialty}
      />

      <CoachContactSocialSection
        form={form}
        setField={set}
        g2={g2}
        g3={g3}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        textareaStyle={textareaStyle}
      />

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
  const [linkToFacility, setLinkToFacility] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showCreateFacilityForm, setShowCreateFacilityForm] = useState(false)
  const [newFacilityAddrStatus, setNewFacilityAddrStatus] = useState('')
  const [newFacilityForm, setNewFacilityForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    phone: '',
    lat: null,
    lng: null,
  })

  function set(field, value) {
    setError('')
    setForm((f) => ({ ...f, [field]: value }))
  }

  function setNewFacility(field, value) {
    setError('')
    setNewFacilityForm((f) => ({ ...f, [field]: value }))
  }

  const classificationOptions =
    TEAM_CLASSIFICATION_OPTIONS[form.sport] || TEAM_CLASSIFICATION_OPTIONS.baseball

  function handleGeocode(geo) {
    if (!geo) return
    setForm((f) => applyZipLookupLocality(f, geo))
  }

  function handleNewFacilityZipGeocode(geo) {
    if (!geo) return
    setNewFacilityForm((f) => applyZipLookupLocality(f, geo))
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
    const resolved = await geocodeAddress(form.address, form.city, form.state, form.zip_code)
    if (!resolved) {
      setAddrStatus('not_found')
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

    setAddrStatus('found')
  }

  async function handleNewFacilityAddressBlur() {
    if (!String(newFacilityForm.address || '').trim()) {
      setNewFacilityAddrStatus('')
      return
    }

    if (!hasLocationContext(newFacilityForm.city, newFacilityForm.state, newFacilityForm.zip_code)) {
      setNewFacilityAddrStatus('needs_location')
      return
    }

    setNewFacilityAddrStatus('locating')
    const resolved = await geocodeAddress(
      newFacilityForm.address,
      newFacilityForm.city,
      newFacilityForm.state,
      newFacilityForm.zip_code,
    )

    if (!resolved) {
      setNewFacilityAddrStatus('not_found')
      return
    }

    setNewFacilityForm((f) => ({
      ...f,
      lat: resolved.lat,
      lng: resolved.lng,
      city: f.city || resolved.city || '',
      state: normalizeStateValue(f.state || resolved.state) || '',
      zip_code: f.zip_code || resolved.zip_code || '',
    }))
    setNewFacilityAddrStatus('found')
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
    if (linkToFacility && !selectedFacility && !showCreateFacilityForm) {
      return 'Choose an existing facility or add a new one from this page.'
    }
    if (linkToFacility && showCreateFacilityForm) {
      if (!newFacilityForm.name.trim()) return 'New facility name is required.'
      if (!newFacilityForm.address.trim()) return 'New facility street address is required.'
      if (!newFacilityForm.zip_code || newFacilityForm.zip_code.length !== 5) return 'New facility zip code is required.'
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
      const practiceLocation = await finalizeListingLocation({
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip_code,
        addressRequired: true,
      })

    if (!practiceLocation.ok) {
      if (isBlockedGeocodeFailure(practiceLocation.error)) {
        await notifyBlockedGeocodeSubmit({
          listing_type: 'team',
          submitted_name: form.name,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip_code,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          reason: practiceLocation.error,
        })
      }

      setError(practiceLocation.error)
      setSubmitting(false)
      return
    }

      let resolvedForm = applyResolvedCoordsPreservingLocality({ ...form }, practiceLocation.resolved)

      let facilityRecord = selectedFacility
      if (linkToFacility && !selectedFacility && showCreateFacilityForm) {
        try {
          facilityRecord = await createPendingFacilityRecord({
            facility: newFacilityForm,
            sport: form.sport,
            contactName: form.contact_name,
            contactEmail: form.contact_email,
            contactPhone: form.contact_phone,
            submissionNotes: appendLabeledNote(
              appendLabeledNote('', 'Created from', 'Travel team submission'),
              'Team',
              form.name,
            ),
            source: 'team_submission_inline_facility',
          })
        } catch (facilityErr) {
          if (isBlockedGeocodeFailure(facilityErr?.message)) {
            await notifyBlockedGeocodeSubmit({
              listing_type: 'team',
              submitted_name: form.name,
              address: newFacilityForm.address,
              city: newFacilityForm.city,
              state: newFacilityForm.state,
              zip: newFacilityForm.zip_code,
              contact_name: form.contact_name,
              contact_email: form.contact_email,
              contact_phone: form.contact_phone,
              reason: `Inline facility address failed geocode: ${facilityErr.message}`,
            })
          }

          throw facilityErr
        }
      }

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
        facility_id: facilityRecord?.id || null,
        facility_name: facilityRecord?.name || null,
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
      <TeamBasicsSection
  g2={g2}
  g3={g3}
  form={form}
  set={set}
  addrStatus={addrStatus}
  handlePracticeAddressBlur={handlePracticeAddressBlur}
  handleGeocode={handleGeocode}
  classificationOptions={classificationOptions}
  labelStyle={labelStyle}
  inputStyle={inputStyle}
  selectStyle={selectStyle}
  RequiredMark={RequiredMark}
  US_STATE_ABBRS={US_STATE_ABBRS}
/>

      <TeamFacilitySection
  g2={g2}
  g3={g3}
  linkToFacility={linkToFacility}
  setLinkToFacility={setLinkToFacility}
  selectedFacility={selectedFacility}
  setSelectedFacility={setSelectedFacility}
  showCreateFacilityForm={showCreateFacilityForm}
  setShowCreateFacilityForm={setShowCreateFacilityForm}
  newFacilityAddrStatus={newFacilityAddrStatus}
  setNewFacilityAddrStatus={setNewFacilityAddrStatus}
  newFacilityForm={newFacilityForm}
  setNewFacilityForm={setNewFacilityForm}
  setNewFacility={setNewFacility}
  handleNewFacilityAddressBlur={handleNewFacilityAddressBlur}
  handleNewFacilityZipGeocode={handleNewFacilityZipGeocode}
  setError={setError}
  labelStyle={labelStyle}
  inputStyle={inputStyle}
  selectStyle={selectStyle}
  RequiredMark={RequiredMark}
  US_STATE_ABBRS={US_STATE_ABBRS}
/>

      <TeamTryoutInfoSection
        form={form}
        setField={set}
        g2={g2}
        labelStyle={labelStyle}
        selectStyle={selectStyle}
        inputStyle={inputStyle}
        textareaStyle={textareaStyle}
      />

      <TeamContactSection
        form={form}
        setField={set}
        g2={g2}
        g3={g3}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />

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
  const g3 = isMobile ? '1fr' : '1fr 1fr 1fr'
  const [postType, setPostType] = useState('player_needed')

  const [form, setForm] = useState({
    sport: 'baseball',
    age_group: '',
    team_name: '',
    position_needed: [],
    venue_name: '',
    location_address: '',
    field_number: '',
    city: '',
    state: '',
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
  const [addrStatus, setAddrStatus] = useState('')

  function set(field, value) {
    setError('')
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
    if (!geo) return
    setForm((f) => applyZipLookupLocality(f, geo))
  }

  async function handleNeededAddressBlur() {
    if (postType !== 'player_needed') return
    if (!String(form.location_address || '').trim()) {
      setAddrStatus('')
      return
    }

    if (!hasLocationContext(form.city, form.state, form.zip_code)) {
      setAddrStatus('needs_location')
      return
    }

    setAddrStatus('locating')
    const resolved = await geocodeAddress(form.location_address, form.city, form.state, form.zip_code)
    if (!resolved) {
      setAddrStatus('not_found')
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

    setAddrStatus('found')
  }

  function buildNeededLocationName() {
    return [form.venue_name, form.location_address, form.field_number]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' — ')
  }

  function validate() {
    if (!form.sport) return 'Sport is required.'
    if (postType === 'player_needed') {
      if (!form.age_group) return 'Age group is required.'
      if (form.position_needed.length === 0) return 'Select at least one position needed.'
      if (!form.venue_name.trim()) return 'Facility name is required.'
      if (!form.location_address.trim()) return 'Street address is required.'
      if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
      if (!form.city.trim()) return 'City is required.'
      if (!normalizeStateValue(form.state)) return 'State is required.'
      if (!form.event_date) return 'Event date is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    } else {
      if (!form.age_group) return 'Age group is required.'
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
      let resolvedForm = { ...form }

      if (postType === 'player_needed') {
        const resolvedLocation = await finalizeListingLocation({
          address: form.location_address,
          city: form.city,
          state: form.state,
          zip: form.zip_code,
          addressRequired: true,
        })

        if (!resolvedLocation.ok) {
          setError(resolvedLocation.error)
          setSubmitting(false)
          return
        }

        resolvedForm = applyResolvedCoordsPreservingLocality(resolvedForm, resolvedLocation.resolved)
        resolvedForm.location_name = [
          resolvedForm.venue_name,
          resolvedForm.location_address,
          resolvedForm.field_number,
        ]
          .map((value) => String(value || '').trim())
          .filter(Boolean)
          .join(' — ')
      } else {
        const areaLocation = await finalizeListingLocation({
          city: form.city,
          state: form.state,
          zip: form.zip_code,
          allowZipFallback: true,
        })

        if (!areaLocation.ok) {
          setError(areaLocation.error)
          setSubmitting(false)
          return
        }

        resolvedForm = applyResolvedCoordsPreservingLocality(resolvedForm, areaLocation.resolved)
      }

      const travelNote = 'Willing to travel: ' + (form.distance_travel === 999 ? 'Anywhere' : 'up to ' + form.distance_travel + ' miles')
      const notesWithTravel = postType === 'player_available'
        ? [travelNote, form.additional_notes.trim()].filter(Boolean).join('\n')
        : form.additional_notes.trim() || null

      const payload = {
        post_type: postType,
        sport: resolvedForm.sport,
        city: resolvedForm.city.trim() || null,
        state: normalizeStateValue(resolvedForm.state) || null,
        zip_code: resolvedForm.zip_code || null,
        lat: resolvedForm.lat != null ? parseFloat(resolvedForm.lat) : null,
        lng: resolvedForm.lng != null ? parseFloat(resolvedForm.lng) : null,
        contact_info: resolvedForm.contact_info.trim(),
        additional_notes: notesWithTravel,
        active: true,
        approval_status: 'pending',
        source: 'website_form',
        last_confirmed_at: new Date().toISOString(),
        ...(postType === 'player_needed'
          ? {
              age_group: resolvedForm.age_group,
              team_name: resolvedForm.team_name.trim() || null,
              position_needed: resolvedForm.position_needed,
              location_name: resolvedForm.location_name.trim(),
              event_date: resolvedForm.event_date,
            }
          : {
              age_group: resolvedForm.age_group || null,
              player_position: resolvedForm.player_position,
              player_description: resolvedForm.player_description.trim() || null,
              bats: resolvedForm.bats || null,
              throws: resolvedForm.throws || null,
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
              setAddrStatus('')
              setForm((f) => ({
                ...f,
                age_group: '',
                team_name: '',
                position_needed: [],
                venue_name: '',
                location_address: '',
                field_number: '',
                state: '',
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
            <label style={labelStyle}>Facility Name <RequiredMark /></label>
            <input
              value={form.venue_name}
              onChange={(e) => set('venue_name', e.target.value)}
              placeholder="e.g. Wills Park"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
              Use the park, school, or facility name players should head to.
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Street Address <RequiredMark />
              {addrStatus === 'locating' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Locating…</span>}
              {addrStatus === 'found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Pin placed at address</span>}
              {addrStatus === 'not_found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>We could not place that exact address yet</span>}
              {addrStatus === 'needs_location' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Enter zip or city/state first</span>}
            </label>
            <input
              value={form.location_address}
              onChange={(e) => set('location_address', e.target.value)}
              onBlur={handleNeededAddressBlur}
              placeholder="e.g. 11925 Wills Rd"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
            <div>
              <ZipField
                value={form.zip_code}
                onChange={(v) => set('zip_code', v)}
                onGeocode={handleGeocode}
                required
                hint="Used to auto-fill city and state"
              />
            </div>
            <div>
              <label style={labelStyle}>City <RequiredMark /></label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Auto-filled from zip" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State <RequiredMark /></label>
              <select value={form.state} onChange={(e) => set('state', e.target.value)} style={selectStyle}>
                <option value="">Select</option>
                {US_STATE_ABBRS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Event Date <RequiredMark /></label>
              <input type="date" value={form.event_date} onChange={(e) => set('event_date', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Field / Diamond</label>
              <input
                value={form.field_number}
                onChange={(e) => set('field_number', e.target.value)}
                placeholder="e.g. Field 3"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={(e) => set('additional_notes', e.target.value)} rows={3} placeholder="Start time, skill level expected, tournament notes..." style={textareaStyle} />
          </div>
        </>
      )}

      {postType === 'player_available' && (
        <>
          <div style={{ marginBottom: 14, maxWidth: isMobile ? '100%' : 180 }}>
          <label style={labelStyle}>Age Group <RequiredMark /></label>
          <select value={form.age_group} onChange={(e) => set('age_group', e.target.value)} style={selectStyle}>
            <option value="">Select</option>
            {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
          </select>
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
        <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>
          Visible publicly. Posts expire after 4 days.
          {postType === 'player_needed' && buildNeededLocationName() ? ' Families will see the full facility and address details on your post.' : ''}
        </div>
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
  const resolvedAddressRef = useRef(null)

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
        setAddrStatus('')
        resolvedAddressRef.current = null
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
    if (!geo) return
    setForm((f) => applyZipLookupLocality(f, geo))
  }

  async function handleAddressBlur() {
    const cleanAddress = String(form.address || '').trim()

    if (!cleanAddress) {
      setAddrStatus('')
      resolvedAddressRef.current = null
      return
    }

    if (!hasLocationContext(form.city, form.state, form.zip_code)) {
      setAddrStatus('needs_location')
      resolvedAddressRef.current = null
      return
    }

    setAddrStatus('locating')
    const resolved = await geocodeAddress(cleanAddress, form.city, form.state, form.zip_code)

    if (!resolved) {
      setAddrStatus('not_found')
      resolvedAddressRef.current = null
      return
    }

    resolvedAddressRef.current = {
      ...resolved,
      source: 'address',
    }

    setForm((f) => ({
      ...f,
      lat: resolved.lat,
      lng: resolved.lng,
      city: f.city || resolved.city || '',
      state: normalizeStateValue(f.state || resolved.state) || '',
      zip_code: f.zip_code || resolved.zip_code || '',
    }))

    setAddrStatus('found')
}

  function validate() {
    if (!form.name.trim()) return 'Facility name is required.'
    if (!form.address.trim()) return 'Facility street address is required.'
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
    const finalLocation = await finalizeListingLocation({
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip_code,
      addressRequired: true,
      preResolved: resolvedAddressRef.current,
      listingName: form.name,
    })

      if (!finalLocation.ok) {
        if (isBlockedGeocodeFailure(finalLocation.error)) {
          await notifyBlockedGeocodeSubmit({
            listing_type: 'facility',
            submitted_name: form.name,
            address: form.address,
            city: form.city,
            state: form.state,
            zip: form.zip_code,
            contact_name: form.contact_name,
            contact_email: form.contact_email,
            contact_phone: form.contact_phone,
            reason: finalLocation.error,
          })
        }

        setError(finalLocation.error)
        setSubmitting(false)
        return
      }

      const resolvedForm = applyResolvedCoordsPreservingLocality({ ...form }, finalLocation.resolved)

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
        submission_notes: resolvedForm.submission_notes.trim() || null,
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

      <FacilityBasicsSection
        form={form}
        setField={set}
        g2={g2}
        g3={g3}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        selectStyle={selectStyle}
        addrStatus={addrStatus}
        handleAddressBlur={handleAddressBlur}
        handleZipGeocode={handleZipGeocode}
        facilityTypeOptions={FACILITY_TYPE_OPTIONS}
        stateOptions={US_STATE_ABBRS}
      />

      <FacilityAmenitiesDetailsSection
        form={form}
        setField={set}
        amenityOptions={AMENITY_OPTIONS}
        toggleAmenity={toggleAmenity}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
        textareaStyle={textareaStyle}
      />

      <FacilityContactSection
        form={form}
        setField={set}
        g2={g2}
        g3={g3}
        labelStyle={labelStyle}
        inputStyle={inputStyle}
      />

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