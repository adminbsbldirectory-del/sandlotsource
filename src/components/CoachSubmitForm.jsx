import { useState } from 'react'
import { supabase } from '../supabase.js'
import { useNavigate } from 'react-router-dom'

// ── Geocode utility ───────────────────────────────────────
async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null
    return {
      lat:   parseFloat(place.latitude),
      lng:   parseFloat(place.longitude),
      city:  place['place name'],
      state: place['state abbreviation'],
    }
  } catch { return null }
}

// ── Shared styles ─────────────────────────────────────────
const labelStyle = {
  fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', display: 'block', marginBottom: 6, color: '#444',
}
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '2px solid var(--lgray)', fontSize: 14,
  fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box',
  background: '#fff',
}
const selectStyle = { ...inputStyle }
const textareaStyle = { ...inputStyle, resize: 'vertical' }

const DISTANCE_MARKS = [10, 25, 50, 75, 100, 150, 999]
const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','High School','College','Adult']
const POSITIONS_BB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']
const POSITIONS_SB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']

const DISTANCE_MARKS = [...]
const AGE_GROUPS = [...]
const POSITIONS_BB = [...]
const POSITIONS_SB = [...]
const US_STATE_ABBRS = [...]

const US_STATE_ABBRS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: '#FEE2E2', border: '1px solid #F87171', borderRadius: 8,
      padding: '10px 14px', margin: '12px 0', color: '#B91C1C', fontSize: 13,
    }}>{msg}</div>
  )
}

function SuccessBanner({ message }) {
  return (
    <div style={{
      background: '#DCFCE7', border: '2px solid #16A34A', borderRadius: 10,
      padding: '20px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#15803D', marginBottom: 6 }}>
        Submitted!
      </div>
      <div style={{ fontSize: 14, color: '#166534' }}>{message}</div>
    </div>
  )
}

// ── Zip field with geocode indicator ──────────────────────
function ZipField({ value, onChange, onGeocode, label, hint, required }) {
  const [status, setStatus] = useState('')
  const displayLabel = label || 'Zip Code'
  const displayHint  = hint  || 'Used to place a map pin'

  async function handleBlur() {
    if (!value || value.length !== 5) return
    setStatus('loading')
    const geo = await geocodeZip(value)
    if (geo) { setStatus('ok');    onGeocode(geo) }
    else      { setStatus('error'); onGeocode(null) }
  }

  return (
    <div>
      <label style={labelStyle}>
        {displayLabel}{required && <span style={{ color: 'var(--red)' }}> *</span>}
        {status === 'loading' && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#888' }}>Checking…</span>}
        {status === 'ok'      && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#16a34a' }}>✓ Located</span>}
        {status === 'error'   && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'var(--red)' }}>Zip not found</span>}
      </label>
      <input
        type="text" inputMode="numeric" maxLength={5}
        value={value} onChange={e => onChange(e.target.value)} onBlur={handleBlur}
        placeholder="e.g. 30076" style={inputStyle}
      />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{displayHint}</div>
    </div>
  )
}

// ── Distance slider ───────────────────────────────────────
const TRAVEL_OPTIONS = [
  { value: 10,  label: 'Up to 10 miles' },
  { value: 25,  label: 'Up to 25 miles' },
  { value: 50,  label: 'Up to 50 miles' },
  { value: 75,  label: 'Up to 75 miles' },
  { value: 100, label: 'Up to 100 miles' },
  { value: 150, label: 'Up to 150 miles' },
  { value: 999, label: 'Anywhere' },
]

function DistanceSlider({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>Willing to Travel</label>
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ ...selectStyle }}
      >
        {TRAVEL_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Social input with prefix ──────────────────────────────
function SocialInput({ prefix, value, onChange, placeholder }) {
  return (
    <div className="input-prefix-wrap">
      <span className="input-prefix">{prefix}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

// ── COACH FORM ────────────────────────────────────────────
function CoachForm() {
  const [form, setForm] = useState({
    name: '',
    sport: 'baseball',
    specialty: [],
    city: '',
    state: 'GA',
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

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleSpecialty(value) {
    setForm((f) => ({
      ...f,
      specialty: f.specialty.includes(value)
        ? f.specialty.filter((s) => s !== value)
        : [...f.specialty, value],
    }))
  }

  function handleZipGeocode(geo) {
    if (geo) {
      setForm((f) => ({
        ...f,
        lat: f.lat || geo.lat,
        lng: f.lng || geo.lng,
        city: f.city || geo.city,
        state: f.state || geo.state,
      }))
    }
  }

  async function handleAddressBlur() {
    const addr = form.address.trim()
    if (!addr) return

    setAddrStatus('locating')

    try {
      const q = encodeURIComponent(
        addr +
          (form.city ? ', ' + form.city : '') +
          (form.zip_code ? ', ' + form.zip_code : '') +
          ', USA'
      )

      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?q=' +
          q +
          '&format=json&limit=1&countrycodes=us',
        { headers: { 'Accept-Language': 'en-US' } }
      )

      const data = await res.json()

      if (data && data[0]) {
        setForm((f) => ({
          ...f,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        }))
        setAddrStatus('found')
      } else {
        setAddrStatus('fallback')
      }
    } catch {
      setAddrStatus('fallback')
    }
  }

  function validate() {
    if (!form.name.trim()) return 'Coach / trainer name is required.'
    if (!form.sport) return 'Sport is required.'
    if (!form.city.trim()) return 'City is required.'
    if (!form.state) return 'State is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.facility_name.trim()) return 'Facility name is required.'
    if (!form.contact_role.trim()) return 'Your role is required.'
    if (!form.email.trim() && !form.phone.trim()) {
      return 'At least one of email or phone is required.'
    }
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
      const payload = {
        name: form.name.trim(),
        sport: form.sport,
        specialty: form.specialty.length ? form.specialty.join('|') : null,
        city: form.city.trim() || null,
        state: form.state || null,
        zip: form.zip_code || null,
        lat: form.lat != null ? parseFloat(form.lat) : null,
        lng: form.lng != null ? parseFloat(form.lng) : null,
        address: form.address.trim() || null,
        facility_name: form.facility_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        credentials: form.credentials.trim() || null,
        bio: form.bio.trim() || null,
        age_groups: form.age_groups.trim() || null,
        skill_level: form.skill_level || null,
        price_per_session: form.price_per_session
          ? parseFloat(form.price_per_session)
          : null,
        price_notes: form.price_notes.trim() || null,
        contact_role: form.contact_role.trim(),
        submission_notes: form.submission_notes.trim() || null,
        approval_status: 'pending',
        source: 'website_form',
        active: true,
        verified: false,
      }

      const { error: sbError } = await supabase.from('coaches').insert([payload])

      if (sbError) {
        throw sbError
      }

      setSubmitted(true)

      setForm({
        name: '',
        sport: 'baseball',
        specialty: [],
        city: '',
        state: 'GA',
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

      setAddrStatus('')
    } catch (err) {
      console.error('Submission error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <SuccessBanner message="Your coach profile has been submitted for review. We'll have it live within a few days." />
    )
  }

  return (
    <div>
      <div className="form-section">
        <div className="form-section-title">1. The Basics</div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Sport <RequiredMark /></label>
          <div style={{ display: 'flex', gap: 8 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Coach / Trainer Name <RequiredMark /></label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Full name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Facility / Business Name <RequiredMark /></label>
            <input
              value={form.facility_name}
              onChange={(e) => set('facility_name', e.target.value)}
              placeholder="e.g. El Dojo, GrandSlam"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>
            Street Address
            {addrStatus === 'locating' && (
              <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>
                Locating…
              </span>
            )}
            {addrStatus === 'found' && (
              <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>
                ✓ Pin placed at address
              </span>
            )}
            {addrStatus === 'fallback' && (
              <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>
                Address not found — using zip pin
              </span>
            )}
          </label>
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            onBlur={handleAddressBlur}
            placeholder="Optional street address for more accurate map placement"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>City <RequiredMark /></label>
            <input
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Alpharetta"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>State <RequiredMark /></label>
            <select value={form.state} onChange={(e) => set('state', e.target.value)} style={selectStyle}>
              <option value="">Select</option>
              {US_STATE_ABBRS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <ZipField
            value={form.zip_code}
            onChange={(v) => set('zip_code', v)}
            onGeocode={handleZipGeocode}
            required
            hint="For map pin placement"
          />
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
          <input
            value={form.credentials}
            onChange={(e) => set('credentials', e.target.value)}
            placeholder="e.g. Former MiLB pitcher, Masters in Biomechanics"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Bio / Description</label>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            placeholder="Tell families about your coaching style, experience, and approach..."
            style={textareaStyle}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Age Groups Served</label>
            <input
              value={form.age_groups}
              onChange={(e) => set('age_groups', e.target.value)}
              placeholder="e.g. 10U, 12U, 14U"
              style={inputStyle}
            />
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 0 }}>
          <div>
            <label style={labelStyle}>Price Per Session ($)</label>
            <input
              type="number"
              min="0"
              value={form.price_per_session}
              onChange={(e) => set('price_per_session', e.target.value)}
              placeholder="e.g. 70"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Price Notes</label>
            <input
              value={form.price_notes}
              onChange={(e) => set('price_notes', e.target.value)}
              placeholder="e.g. Group rates available"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">3. Contact &amp; Social</div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Your Role <RequiredMark /></label>
          <input
            value={form.contact_role}
            onChange={(e) => set('contact_role', e.target.value)}
            placeholder="e.g. Coach (self), Facility Owner, Parent submitting for coach"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            Helps us understand your relationship to this listing
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="coach@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="e.g. 770-555-0100"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Website</label>
            <input
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
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
          <textarea
            value={form.submission_notes}
            onChange={(e) => set('submission_notes', e.target.value)}
            rows={2}
            placeholder="Anything else we should know when reviewing this listing?"
            style={textareaStyle}
          />
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
        }}
      >
        {submitting ? 'Submitting…' : 'Submit Coach Profile'}
      </button>
    </div>
  )
}

// ── TEAM FORM ─────────────────────────────────────────────
function TeamForm() {
  const [form, setForm] = useState({
    name: '', sport: 'baseball', org_affiliation: '', age_group: '',
    city: '', state: 'GA', zip_code: '', lat: null, lng: null, address: '',
    contact_name: '', contact_email: '', contact_phone: '',
    website: '', tryout_status: 'closed', tryout_date: '', tryout_notes: '',
    description: '', submission_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function handleGeocode(geo) {
    if (geo) setForm(f => ({
      ...f,
      lat:   geo.lat,
      lng:   geo.lng,
      city:  f.city  || geo.city,
      state: f.state || geo.state,
    }))
    else setForm(f => ({ ...f, lat: null, lng: null }))
  }

  function validate() {
    if (!form.name.trim())         return 'Team name is required.'
    if (!form.sport)               return 'Sport is required.'
    if (!form.age_group)           return 'Age group is required.'
    if (!form.city.trim())         return 'City is required.'
    if (!form.state)               return 'State is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.contact_name.trim()) return 'Contact name is required.'
    if (!form.contact_email.trim() && !form.contact_phone.trim()) return 'At least one of contact email or phone is required.'
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const payload = {
      name:             form.name.trim(),
      sport:            form.sport,
      org_affiliation:  form.org_affiliation.trim() || null,
      age_group:        form.age_group,
      city:             form.city.trim(),
      state:            form.state,
      zip_code:         form.zip_code || null,
      lat:              form.lat || null,
      lng:              form.lng || null,
      address:          form.address.trim() || null,
      contact_name:     form.contact_name.trim(),
      contact_email:    form.contact_email.trim() || null,
      contact_phone:    form.contact_phone.trim() || null,
      website:          form.website.trim() || null,
      tryout_status:    form.tryout_status || 'closed',
      tryout_date:      form.tryout_date || null,
      tryout_notes:     form.tryout_notes.trim() || null,
      description:      form.description.trim() || null,
      submission_notes: form.submission_notes.trim() || null,
      approval_status:  'pending',
      source:           'website_form',
      active:           true,
    }

    const { error: sbError } = await supabase.from('travel_teams').insert(payload)
    setSubmitting(false)
    if (sbError) {
      setError('Submission error: ' + (sbError.message || 'Please try again.'))
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <SuccessBanner message="Your travel team has been submitted for review. We'll have it live within a few days." />

  return (
    <div>

      {/* ── Section 1: The Basics ── */}
      <div className="form-section">
        <div className="form-section-title">1. The Basics</div>

        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Sport <RequiredMark /></label>
          <div style={{ display:'flex', gap:8 }}>
            {['baseball','softball'].map(s => (
              <button key={s} onClick={() => set('sport', s)} style={{
                padding:'8px 18px', borderRadius:8, border:'2px solid', cursor:'pointer',
                borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'var(--lgray)',
                background:  form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'white',
                color:       form.sport === s ? 'white' : 'var(--navy)',
                fontWeight:600, fontSize:13, textTransform:'capitalize', fontFamily:'var(--font-body)',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Team Name <RequiredMark /></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cherokee Nationals 12U" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Org Affiliation</label>
            <input value={form.org_affiliation} onChange={e => set('org_affiliation', e.target.value)} placeholder="e.g. USSSA, PGF, Perfect Game" style={inputStyle} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Age Group <RequiredMark /></label>
            <select value={form.age_group} onChange={e => set('age_group', e.target.value)} style={selectStyle}>
              <option value="">Select</option>
              {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>City <RequiredMark /></label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Canton" style={inputStyle} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>State <RequiredMark /></label>
            <select value={form.state} onChange={e => set('state', e.target.value)} style={selectStyle}>
              <option value="">Select</option>
              {US_STATE_ABBRS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <ZipField
            value={form.zip_code}
            onChange={v => set('zip_code', v)}
            onGeocode={handleGeocode}
            required
            hint="For map pin placement"
          />
        </div>

        <div style={{ marginBottom:0 }}>
          <label style={labelStyle}>Street Address <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:'#999' }}>(optional — improves map accuracy)</span></label>
          <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 123 Main St" style={inputStyle} />
        </div>
      </div>

      {/* ── Section 2: Tryout Info ── */}
      <div className="form-section">
        <div className="form-section-title">2. Tryout Info</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Tryout Status</label>
            <select value={form.tryout_status} onChange={e => set('tryout_status', e.target.value)} style={selectStyle}>
              <option value="closed">Closed / Unknown</option>
              <option value="open">Open</option>
              <option value="year_round">Year Round</option>
              <option value="by_invite">By Invite Only</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tryout Date</label>
            <input type="date" value={form.tryout_date} onChange={e => set('tryout_date', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Tryout Notes</label>
          <input value={form.tryout_notes} onChange={e => set('tryout_notes', e.target.value)} placeholder="e.g. Bring your own helmet. Arrive 15 min early." style={inputStyle} />
        </div>

        <div style={{ marginBottom:0 }}>
          <label style={labelStyle}>Team Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Tell players and families about your program..." style={textareaStyle} />
        </div>
      </div>

      {/* ── Section 3: Contact ── */}
      <div className="form-section">
        <div className="form-section-title">3. Contact</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Contact Name <RequiredMark /></label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Email <RequiredMark /> <span style={{ fontWeight:400, textTransform:'none' }}>(or phone)</span></label>
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="coach@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Phone</label>
            <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:0 }}>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Submission Notes</label>
            <input value={form.submission_notes} onChange={e => set('submission_notes', e.target.value)} placeholder="Anything else we should know?" style={inputStyle} />
          </div>
        </div>
      </div>

      <div style={{ fontSize:11, color:'var(--gray)', marginBottom:12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color:'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background:'var(--red)', color:'white', border:'none',
        borderRadius:8, padding:'12px 32px',
        fontFamily:'var(--font-head)', fontSize:16, fontWeight:700,
        letterSpacing:'0.04em', textTransform:'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Submitting…' : 'Submit Travel Team'}
      </button>
    </div>
  )
}

// ── PLAYER FORM ───────────────────────────────────────────
function PlayerForm() {
  const [postType, setPostType] = useState('player_needed')
  const [form, setForm] = useState({
    sport: 'baseball', age_group: '', team_name: '',
    position_needed: [], city: '',
    zip_code: '', lat: null, lng: null,
    location_name: '', event_date: '',
    player_age: '', player_position: [], player_description: '',
    contact_info: '', additional_notes: '',
    distance_travel: 25,
    bats: '',
    throws: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function togglePos(pos, field) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(pos) ? f[field].filter(p => p !== pos) : [...f[field], pos],
    }))
  }

  function handleGeocode(geo) {
    if (geo) setForm(f => ({ ...f, lat: geo.lat, lng: geo.lng, city: f.city || geo.city }))
    else setForm(f => ({ ...f, lat: null, lng: null }))
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
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const travelNote = 'Willing to travel: ' + (form.distance_travel === 999 ? 'Anywhere' : 'up to ' + form.distance_travel + ' miles')
    const notesWithTravel = postType === 'player_available'
      ? [travelNote, form.additional_notes.trim()].filter(Boolean).join('\n')
      : form.additional_notes.trim() || null

    const payload = {
      post_type:        postType,
      sport:            form.sport,
      city:             form.city.trim() || null,
      zip_code:         form.zip_code || null,
      lat:              form.lat || null,
      lng:              form.lng || null,
      contact_info:     form.contact_info.trim(),
      additional_notes: notesWithTravel,
      active:           true,
      approval_status:  'pending',
      source:           'website_form',
      last_confirmed_at: new Date().toISOString(),
      ...(postType === 'player_needed' ? {
        age_group:       form.age_group,
        team_name:       form.team_name.trim() || null,
        position_needed: form.position_needed,
        location_name:   form.location_name.trim(),
        event_date:      form.event_date,
     } : {
        player_age:         form.player_age ? parseInt(form.player_age) : null,
        age_group:          form.age_group || null,
        player_position:    form.player_position,
        player_description: form.player_description.trim() || null,
        bats:               form.bats || null,
        throws:             form.throws || null,
      }), 
    }

    const { error: sbError } = await supabase.from('player_board').insert(payload)
    setSubmitting(false)
    if (sbError) {
      setError('Submission error: ' + (sbError.message || 'Please try again.'))
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <SuccessBanner message="Your post has been submitted and will appear on the Player Board once reviewed. Posts expire in 4 days." />

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[
          ['player_needed',    '⚾ Player Needed'],
          ['player_available', '🧢 Player Available'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => {
            setPostType(val)
            setForm(f => ({ ...f, age_group:'', team_name:'', position_needed:[], location_name:'', event_date:'', player_age:'', player_position:[], player_description:'', distance_travel:25, bats:'', throws:'' }))
          }} style={{
            flex:1, padding:'10px', borderRadius:8, border:'2px solid', cursor:'pointer',
            borderColor: postType === val ? 'var(--navy)' : 'var(--lgray)',
            background:  postType === val ? 'var(--navy)' : 'white',
            color:       postType === val ? 'white' : 'var(--navy)',
            fontWeight:600, fontSize:14, fontFamily:'var(--font-body)',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display:'flex', gap:8 }}>
          {['baseball','softball'].map(s => (
            <button key={s} onClick={() => set('sport', s)} style={{
              padding:'8px 18px', borderRadius:8, border:'2px solid', cursor:'pointer',
              borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'var(--lgray)',
              background:  form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'white',
              color:       form.sport === s ? 'white' : 'var(--navy)',
              fontWeight:600, fontSize:13, textTransform:'capitalize', fontFamily:'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {postType === 'player_needed' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Age Group <RequiredMark /></label>
              <select value={form.age_group} onChange={e => set('age_group', e.target.value)} style={selectStyle}>
                <option value="">Select</option>
                {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Team Name</label>
              <input value={form.team_name} onChange={e => set('team_name', e.target.value)} placeholder="e.g. Cherokee Nationals" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Position(s) Needed <RequiredMark /></label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {positions.map(pos => (
                <button key={pos} onClick={() => togglePos(pos, 'position_needed')} style={{
                  padding:'5px 12px', borderRadius:20, border:'2px solid', cursor:'pointer',
                  borderColor: form.position_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                  background:  form.position_needed.includes(pos) ? 'var(--navy)' : 'white',
                  color:       form.position_needed.includes(pos) ? 'white' : 'var(--navy)',
                  fontSize:12, fontFamily:'var(--font-body)',
                }}>{pos}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Game / Tournament Location <RequiredMark /></label>
            <input value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="e.g. Wills Park Field 3, Seckinger High School" style={inputStyle} />
            <div style={{ fontSize:11, color:'#888', marginTop:3 }}>This location name is used to place the map pin precisely</div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Canton" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Event Date <RequiredMark /></label>
              <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <ZipField value={form.zip_code} onChange={v => set('zip_code', v)} onGeocode={handleGeocode} required hint="Area zip for search radius matching" />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} rows={3} placeholder="Practice schedule, skill level expected, tryout info..." style={textareaStyle} />
          </div>
        </>
      )}

      {postType === 'player_available' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Player Age <RequiredMark /></label>
              <input type="number" min="6" max="99" value={form.player_age} onChange={e => set('player_age', e.target.value)} placeholder="e.g. 12" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Age Group</label>
              <select value={form.age_group} onChange={e => set('age_group', e.target.value)} style={selectStyle}>
                <option value="">Select</option>
                {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Position(s) <RequiredMark /></label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {positions.map(pos => (
                <button key={pos} onClick={() => togglePos(pos, 'player_position')} style={{
                  padding:'5px 12px', borderRadius:20, border:'2px solid', cursor:'pointer',
                  borderColor: form.player_position.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                  background:  form.player_position.includes(pos) ? 'var(--navy)' : 'white',
                  color:       form.player_position.includes(pos) ? 'white' : 'var(--navy)',
                  fontSize:12, fontFamily:'var(--font-body)',
                }}>{pos}</button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <label style={labelStyle}>Bats</label>
              <div style={{ display:'flex', gap:6 }}>
                {['R','L','S'].map(v => (
                  <button key={v} onClick={() => set('bats', form.bats === v ? '' : v)} style={{
                    padding:'7px 16px', borderRadius:8, border:'2px solid', cursor:'pointer',
                    borderColor: form.bats === v ? 'var(--navy)' : 'var(--lgray)',
                    background:  form.bats === v ? 'var(--navy)' : 'white',
                    color:       form.bats === v ? 'white' : 'var(--navy)',
                    fontWeight:600, fontSize:13, fontFamily:'var(--font-body)',
                  }}>{v === 'S' ? 'Switch' : v === 'R' ? 'Right' : 'Left'}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Throws</label>
              <div style={{ display:'flex', gap:6 }}>
                {['R','L'].map(v => (
                  <button key={v} onClick={() => set('throws', form.throws === v ? '' : v)} style={{
                    padding:'7px 16px', borderRadius:8, border:'2px solid', cursor:'pointer',
                    borderColor: form.throws === v ? 'var(--navy)' : 'var(--lgray)',
                    background:  form.throws === v ? 'var(--navy)' : 'white',
                    color:       form.throws === v ? 'white' : 'var(--navy)',
                    fontWeight:600, fontSize:13, fontFamily:'var(--font-body)',
                  }}>{v === 'R' ? 'Right' : 'Left'}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <ZipField value={form.zip_code} onChange={v => set('zip_code', v)} onGeocode={handleGeocode} required />
          </div>

          <DistanceSlider value={form.distance_travel} onChange={v => set('distance_travel', v)} />

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Alpharetta" style={inputStyle} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.player_description} onChange={e => set('player_description', e.target.value)} rows={3} placeholder="Age, skill level, what you're looking for in a team..." style={textareaStyle} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} rows={2} placeholder="Any other details..." style={textareaStyle} />
          </div>
        </>
      )}

      <div style={{ marginBottom:8 }}>
        <label style={labelStyle}>Contact Info <RequiredMark /></label>
        <input value={form.contact_info} onChange={e => set('contact_info', e.target.value)} placeholder="Email, phone, or Instagram handle" style={inputStyle} />
        <div style={{ fontSize:11, color:'var(--gray)', marginTop:4 }}>Visible publicly. Posts expire after 4 days.</div>
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background:'var(--red)', color:'white', border:'none',
        borderRadius:8, padding:'12px 32px', marginTop:8,
        fontFamily:'var(--font-head)', fontSize:16, fontWeight:700,
        letterSpacing:'0.04em', textTransform:'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Posting…' : 'Submit Post'}
      </button>
    </div>
  )
}

// ── FACILITY FORM ─────────────────────────────────────────
function FacilityForm() {
  const [form, setForm] = useState({
    name: '', facility_type: '', sport: 'both',
    city: '', state: 'GA', zip_code: '', lat: null, lng: null,
    address: '', phone: '', email: '', website: '', instagram: '', facebook: '',
    amenities: [], description: '', hours: '',
    contact_name: '', contact_email: '', contact_phone: '',
    submission_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [error,      setError]      = useState('')
  const [addrStatus, setAddrStatus] = useState('')

  const AMENITY_OPTIONS = ['Batting Cages','Pitching Mounds','Turf Infield','HitTrax','Rapsodo','Video Analysis','Weight Room','Bullpen','Indoor Facility','Outdoor Fields','Lights','Restrooms','Parking','Concessions']
  const FACILITY_TYPES  = ['Training Academy','Batting Cage Complex','Indoor Complex','Recreation Park','High School','College Facility','Tournament Venue','Other']

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function toggleAmenity(a) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
    }))
  }

  function handleZipGeocode(geo) {
    if (geo) setForm(f => ({
      ...f,
      lat:   f.lat   || geo.lat,
      lng:   f.lng   || geo.lng,
      city:  f.city  || geo.city,
      state: f.state || geo.state,
    }))
  }

  async function handleAddressBlur() {
    const addr = form.address.trim()
    if (!addr) return
    setAddrStatus('locating')
    try {
      const q = encodeURIComponent(
        addr +
        (form.city     ? ', ' + form.city     : '') +
        (form.zip_code ? ', ' + form.zip_code : '') +
        ', USA'
      )
      const res = await fetch(
        'https://nominatim.openstreetmap.org/search?q=' + q + '&format=json&limit=1&countrycodes=us',
        { headers: { 'Accept-Language': 'en-US' } }
      )
      const data = await res.json()
      if (data && data[0]) {
        setForm(f => ({ ...f, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }))
        setAddrStatus('found')
      } else {
        setAddrStatus('fallback')
      }
    } catch { setAddrStatus('fallback') }
  }

  function validate() {
    if (!form.name.trim())  return 'Facility name is required.'
    if (!form.city.trim())  return 'City is required.'
    if (!form.state)        return 'State is required.'
    if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    if (!form.contact_name.trim()) return 'Contact name is required.'
    if (!form.contact_email.trim() && !form.contact_phone.trim()) return 'At least one of contact email or phone is required.'
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const payload = {
      name:             form.name.trim(),
      facility_type:    form.facility_type || null,
      sport:            form.sport,
      city:             form.city.trim() || null,
      state:            form.state || null,
      zip_code:         form.zip_code || null,
      lat:              form.lat || null,
      lng:              form.lng || null,
      address:          form.address.trim() || null,
      phone:            form.phone.trim() || null,
      email:            form.email.trim() || null,
      website:          form.website.trim() || null,
      instagram:        form.instagram.trim() || null,
      facebook:         form.facebook.trim() || null,
      amenities:        form.amenities.length > 0 ? form.amenities : null,
      description:      form.description.trim() || null,
      hours:            form.hours.trim() || null,
      contact_name:     form.contact_name.trim(),
      contact_email:    form.contact_email.trim() || null,
      contact_phone:    form.contact_phone.trim() || null,
      submission_notes: form.submission_notes.trim() || null,
      approval_status:  'pending',
      source:           'website_form',
      active:           true,
    }

    const { error: sbError } = await supabase.from('facilities').insert(payload)
    setSubmitting(false)
    if (sbError) {
      setError('Submission error: ' + (sbError.message || 'Please try again.'))
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <SuccessBanner message="Your facility has been submitted for review. We'll have it live within a few days." />

  return (
    <div>

      {/* ── Section 1: The Basics ── */}
      <div className="form-section">
        <div className="form-section-title">1. The Basics</div>

        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Sport <RequiredMark /></label>
          <div style={{ display:'flex', gap:8 }}>
            {['baseball','softball','both'].map(s => (
              <button key={s} onClick={() => set('sport', s)} style={{
                padding:'8px 18px', borderRadius:8, border:'2px solid', cursor:'pointer',
                borderColor: form.sport === s ? 'var(--navy)' : 'var(--lgray)',
                background:  form.sport === s ? 'var(--navy)' : 'white',
                color:       form.sport === s ? 'white' : 'var(--navy)',
                fontWeight:600, fontSize:13, textTransform:'capitalize', fontFamily:'var(--font-body)',
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Facility Name <RequiredMark /></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Grit Academy Athletics" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Facility Type</label>
            <select value={form.facility_type} onChange={e => set('facility_type', e.target.value)} style={selectStyle}>
              <option value="">Select type</option>
              {FACILITY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>
            Street Address
            {addrStatus === 'locating' && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#888' }}>Locating…</span>}
            {addrStatus === 'found'    && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#16a34a' }}>✓ Pin placed at address</span>}
            {addrStatus === 'fallback' && <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, color:'#ea580c' }}>Address not found — using zip pin</span>}
          </label>
          <input value={form.address} onChange={e => set('address', e.target.value)}
            onBlur={handleAddressBlur}
            placeholder="e.g. 5735 North Commerce Court" style={inputStyle} />
          <div style={{ fontSize:11, color:'#888', marginTop:3 }}>Enter address then tab out to place an accurate map pin</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:0 }}>
          <div>
            <label style={labelStyle}>City <RequiredMark /></label>
            <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Kennesaw" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>State <RequiredMark /></label>
            <select value={form.state} onChange={e => set('state', e.target.value)} style={selectStyle}>
              <option value="">Select</option>
              {US_STATE_ABBRS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <ZipField
            value={form.zip_code}
            onChange={v => set('zip_code', v)}
            onGeocode={handleZipGeocode}
            required
            hint="For map pin placement"
          />
        </div>
      </div>

      {/* ── Section 2: Amenities & Details ── */}
      <div className="form-section">
        <div className="form-section-title">2. Amenities &amp; Details</div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Amenities / Features</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {AMENITY_OPTIONS.map(a => (
              <button key={a} onClick={() => toggleAmenity(a)} style={{
                padding:'5px 12px', borderRadius:20, border:'2px solid', cursor:'pointer',
                borderColor: form.amenities.includes(a) ? 'var(--navy)' : 'var(--lgray)',
                background:  form.amenities.includes(a) ? 'var(--navy)' : 'white',
                color:       form.amenities.includes(a) ? 'white' : 'var(--navy)',
                fontSize:12, fontFamily:'var(--font-body)',
              }}>{a}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Tell families what makes your facility special..." style={textareaStyle} />
        </div>

        <div style={{ marginBottom:0 }}>
          <label style={labelStyle}>Hours of Operation</label>
          <input value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="e.g. Mon-Fri 4-9pm, Sat 8am-5pm" style={inputStyle} />
        </div>
      </div>

      {/* ── Section 3: Contact ── */}
      <div className="form-section">
        <div className="form-section-title">3. Contact</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Facility Phone</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Facility Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@facility.com" style={inputStyle} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Instagram</label>
            <SocialInput prefix="@" value={form.instagram} onChange={v => set('instagram', v)} placeholder="handle" />
          </div>
          <div>
            <label style={labelStyle}>Facebook</label>
            <SocialInput prefix="facebook.com/" value={form.facebook} onChange={v => set('facebook', v)} placeholder="page name" />
          </div>
        </div>

        <div style={{ background:'#f8f9fa', borderRadius:8, padding:'14px', border:'1px solid var(--lgray)' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--navy)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Your Contact Info (not public)
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={labelStyle}>Your Name <RequiredMark /></label>
              <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Email <RequiredMark /> <span style={{ fontWeight:400, textTransform:'none' }}>(or phone)</span></label>
              <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Phone</label>
              <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Submission Notes</label>
        <textarea value={form.submission_notes} onChange={e => set('submission_notes', e.target.value)} rows={2} placeholder="Anything else we should know?" style={textareaStyle} />
      </div>

      <div style={{ fontSize:11, color:'var(--gray)', marginBottom:12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color:'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background:'var(--red)', color:'white', border:'none',
        borderRadius:8, padding:'12px 32px',
        fontFamily:'var(--font-head)', fontSize:16, fontWeight:700,
        letterSpacing:'0.04em', textTransform:'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Submitting…' : 'Submit Facility'}
      </button>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────
const TABS = [
  { id: 'coach',    label: '⚾ Coach Profile' },
  { id: 'team',     label: '🏆 Travel Team' },
  { id: 'player',   label: '📋 Player Board' },
  { id: 'roster',   label: '🔖 Roster Spot' },
  { id: 'facility', label: '🏟️ Facility' },
]

export default function CoachSubmitForm() {
  const [activeTab, setActiveTab] = useState('coach')

  return (
    <div style={{ maxWidth:820, margin:'0 auto', padding:'32px 20px' }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--navy)', marginBottom:6 }}>
          Add a Listing
        </div>
        <div style={{ fontSize:14, color:'var(--gray)' }}>
          All submissions are reviewed before going live. Free to list.
        </div>
      </div>

      <div style={{ display:'flex', gap:4, marginBottom:28, borderBottom:'2px solid var(--lgray)', paddingBottom:0, flexWrap:'wrap' }}>
        {TABS.map(tab => {
          const tabStyle = {
            padding:'10px 16px',
            fontFamily:'var(--font-head)', fontSize:13, fontWeight:700,
            letterSpacing:'0.04em', textTransform:'uppercase',
            border:'none',
            borderBottom: activeTab === tab.id ? '3px solid var(--red)' : '3px solid transparent',
            background:'transparent',
            color: activeTab === tab.id ? 'var(--red)' : 'var(--gray)',
            cursor:'pointer', marginBottom:-2,
          }
          if (tab.id === 'roster') {
            return (
              <button key="roster"
                onClick={() => { window.location.href = '/roster' }}
                style={{ ...tabStyle, color:'var(--gray)' }}>
                {tab.label}
              </button>
            )
          }
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle}>
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ background:'white', borderRadius:12, border:'2px solid var(--lgray)', padding:'28px 24px' }}>
        {activeTab === 'coach'    && <CoachForm />}
        {activeTab === 'team'     && <TeamForm />}
        {activeTab === 'player'   && <PlayerForm />}
        {activeTab === 'facility' && <FacilityForm />}
      </div>
    </div>
  )
}
