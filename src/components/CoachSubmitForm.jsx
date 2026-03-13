import { useState } from 'react'
import { supabase } from '../supabase.js'

// ─── Shared style constants ───────────────────────────────────────────────────
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

const COUNTIES = ['Barrow','Cherokee','Cobb','DeKalb','Forsyth','Fulton','Gwinnett','Hall','Oconee','Walton']
const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','18U','Adult']
const POSITIONS_BB = ['pitcher','catcher','1B','2B','3B','shortstop','outfield','utility']
const POSITIONS_SB = ['pitcher','catcher','1B','2B','3B','shortstop','outfield','utility']

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

// ─── COACH FORM ───────────────────────────────────────────────────────────────
function CoachForm() {
  const [form, setForm] = useState({
    name: '', sport: 'baseball', specialty: '', city: '', county: '',
    facility_name: '', phone: '', email: '', website: '', instagram: '', facebook: '',
    credentials: '', bio: '', age_groups: '', skill_level: '',
    price_per_session: '', price_notes: '',
    contact_name: '', contact_role: '', submission_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function validate() {
    if (!form.name.trim())          return 'Coach / trainer name is required.'
    if (!form.sport)                return 'Sport is required.'
    if (!form.city.trim())          return 'City is required.'
    if (!form.facility_name.trim()) return 'Facility name is required.'
    if (!form.contact_name.trim())  return 'Contact name is required.'
    if (!form.contact_role.trim())  return 'Contact role is required.'
    if (!form.email.trim() && !form.phone.trim()) return 'At least one of email or phone is required.'
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
      specialty:        form.specialty ? form.specialty.split(',').map(s => s.trim()).filter(Boolean) : [],
      city:             form.city.trim(),
      county:           form.county || null,
      facility_name:    form.facility_name.trim(),
      phone:            form.phone.trim() || null,
      email:            form.email.trim() || null,
      website:          form.website.trim() || null,
      instagram:        form.instagram.trim() || null,
      facebook:         form.facebook.trim() || null,
      credentials:      form.credentials.trim() || null,
      bio:              form.bio.trim() || null,
      age_groups:       form.age_groups ? form.age_groups.split(',').map(s => s.trim()).filter(Boolean) : [],
      skill_level:      form.skill_level || null,
      price_per_session: form.price_per_session ? parseFloat(form.price_per_session) : null,
      price_notes:      form.price_notes.trim() || null,
      contact_name:     form.contact_name.trim(),
      contact_role:     form.contact_role.trim(),
      submission_notes: form.submission_notes.trim() || null,
      approval_status:  'pending',
      source:           'website_form',
      active:           true,
      verified:         false,
    }

    const { error: sbError } = await supabase.from('coaches').insert(payload)
    setSubmitting(false)

    if (sbError) {
      console.error('Coach insert error:', sbError)
      setError('Something went wrong submitting your listing. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <SuccessBanner message="Your coach profile has been submitted for review. We'll have it live within a few days." />

  return (
    <div>
      {/* Sport */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['baseball','softball','both'].map(s => (
            <button key={s} onClick={() => set('sport', s)} style={{
              padding: '8px 18px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
              borderColor: form.sport === s ? 'var(--navy)' : 'var(--lgray)',
              background:  form.sport === s ? 'var(--navy)' : 'white',
              color:       form.sport === s ? 'white' : 'var(--navy)',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize', fontFamily: 'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Name + Facility */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Coach / Trainer Name <RequiredMark /></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Facility / Business Name <RequiredMark /></label>
          <input value={form.facility_name} onChange={e => set('facility_name', e.target.value)} placeholder="e.g. El Dojo, GrandSlam" style={inputStyle} />
        </div>
      </div>

      {/* City + County */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>City <RequiredMark /></label>
          <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Alpharetta" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>County</label>
          <select value={form.county} onChange={e => set('county', e.target.value)} style={selectStyle}>
            <option value="">Select county</option>
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Contact name + role */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Contact Name <RequiredMark /></label>
          <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Name of person submitting" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact Role <RequiredMark /></label>
          <input value={form.contact_role} onChange={e => set('contact_role', e.target.value)} placeholder="e.g. Coach, Owner, Parent" style={inputStyle} />
        </div>
      </div>

      {/* Email + Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="coach@example.com" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. 770-555-0100" style={inputStyle} />
        </div>
      </div>

      {/* Specialty + Credentials */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Specialty</label>
        <input value={form.specialty} onChange={e => set('specialty', e.target.value)} placeholder="e.g. pitching, catching, hitting (comma-separated)" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Credentials / Background</label>
        <input value={form.credentials} onChange={e => set('credentials', e.target.value)} placeholder="e.g. Former MiLB pitcher, Masters in Biomechanics" style={inputStyle} />
      </div>

      {/* Bio */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Bio / Description</label>
        <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Tell families about your coaching style, experience, and approach..." style={textareaStyle} />
      </div>

      {/* Age groups + Skill level */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Age Groups Served</label>
          <input value={form.age_groups} onChange={e => set('age_groups', e.target.value)} placeholder="e.g. 10U, 12U, 14U" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Skill Level</label>
          <select value={form.skill_level} onChange={e => set('skill_level', e.target.value)} style={selectStyle}>
            <option value="">All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Elite / Travel</option>
          </select>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Price Per Session ($)</label>
          <input type="number" min="0" value={form.price_per_session} onChange={e => set('price_per_session', e.target.value)} placeholder="e.g. 70" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Price Notes</label>
          <input value={form.price_notes} onChange={e => set('price_notes', e.target.value)} placeholder="e.g. Group rates available" style={inputStyle} />
        </div>
      </div>

      {/* Website + Social */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Website</label>
          <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Instagram</label>
          <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@handle" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Facebook</label>
          <input value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="Page name or URL" style={inputStyle} />
        </div>
      </div>

      {/* Submission notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Submission Notes</label>
        <textarea value={form.submission_notes} onChange={e => set('submission_notes', e.target.value)} rows={2} placeholder="Anything else we should know when reviewing this listing?" style={textareaStyle} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background: 'var(--red)', color: 'white', border: 'none',
        borderRadius: 8, padding: '12px 32px',
        fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Submitting…' : 'Submit Coach Profile'}
      </button>
    </div>
  )
}

// ─── TEAM FORM ────────────────────────────────────────────────────────────────
function TeamForm() {
  const [form, setForm] = useState({
    name: '', sport: 'baseball', org_affiliation: '', age_group: '',
    city: '', county: '', contact_name: '', contact_email: '', contact_phone: '',
    website: '', tryout_status: 'unknown', tryout_date: '', tryout_notes: '',
    description: '', submission_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function validate() {
    if (!form.name.trim())         return 'Team name is required.'
    if (!form.sport)               return 'Sport is required.'
    if (!form.age_group)           return 'Age group is required.'
    if (!form.city.trim())         return 'City is required.'
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
      county:           form.county || null,
      contact_name:     form.contact_name.trim(),
      contact_email:    form.contact_email.trim() || null,
      contact_phone:    form.contact_phone.trim() || null,
      website:          form.website.trim() || null,
      tryout_status:    form.tryout_status || 'unknown',
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
      console.error('Team insert error:', sbError)
      setError('Something went wrong submitting your team. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <SuccessBanner message="Your travel team has been submitted for review. We'll have it live within a few days." />

  return (
    <div>
      {/* Sport */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['baseball','softball'].map(s => (
            <button key={s} onClick={() => set('sport', s)} style={{
              padding: '8px 18px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
              borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'var(--lgray)',
              background:  form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'white',
              color:       form.sport === s ? 'white' : 'var(--navy)',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize', fontFamily: 'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Name + Org */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Team Name <RequiredMark /></label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Cherokee Nationals 12U" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Org Affiliation</label>
          <input value={form.org_affiliation} onChange={e => set('org_affiliation', e.target.value)} placeholder="e.g. USSSA, PGF, Perfect Game" style={inputStyle} />
        </div>
      </div>

      {/* Age group + City + County */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
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
        <div>
          <label style={labelStyle}>County</label>
          <select value={form.county} onChange={e => set('county', e.target.value)} style={selectStyle}>
            <option value="">Select county</option>
            {COUNTIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Contact Name <RequiredMark /></label>
          <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Full name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
          <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="coach@example.com" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact Phone</label>
          <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="770-555-0100" style={inputStyle} />
        </div>
      </div>

      {/* Tryout status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Tryout Status</label>
          <select value={form.tryout_status} onChange={e => set('tryout_status', e.target.value)} style={selectStyle}>
            <option value="unknown">Unknown</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tryout Date</label>
          <input type="date" value={form.tryout_date} onChange={e => set('tryout_date', e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Tryout Notes</label>
        <input value={form.tryout_notes} onChange={e => set('tryout_notes', e.target.value)} placeholder="e.g. Bring your own helmet. Arrive 15 min early." style={inputStyle} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Website</label>
        <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." style={inputStyle} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Team Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Tell players and families about your program..." style={textareaStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Submission Notes</label>
        <textarea value={form.submission_notes} onChange={e => set('submission_notes', e.target.value)} rows={2} placeholder="Anything else we should know?" style={textareaStyle} />
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        All listings are reviewed before going live. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background: 'var(--red)', color: 'white', border: 'none',
        borderRadius: 8, padding: '12px 32px',
        fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Submitting…' : 'Submit Travel Team'}
      </button>
    </div>
  )
}

// ─── PLAYER BOARD FORM ────────────────────────────────────────────────────────
function PlayerForm() {
  const [postType, setPostType] = useState('player_needed')
  const [form, setForm] = useState({
    sport: 'baseball', age_group: '', team_name: '',
    position_needed: [], city: '', county: '', location_name: '', event_date: '',
    player_age: '', player_position: [], player_description: '',
    contact_info: '', additional_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function togglePos(pos, field) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(pos) ? f[field].filter(p => p !== pos) : [...f[field], pos],
    }))
  }

  function validate() {
    if (!form.sport) return 'Sport is required.'
    if (postType === 'player_needed') {
      if (!form.age_group) return 'Age group is required.'
      if (form.position_needed.length === 0) return 'Select at least one position needed.'
      if (!form.city.trim()) return 'City is required.'
      if (!form.location_name.trim()) return 'Location / facility name is required.'
      if (!form.event_date) return 'Event date is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    } else {
      if (!form.player_age.toString().trim()) return 'Player age is required.'
      if (form.player_position.length === 0) return 'Select at least one position.'
      if (!form.city.trim()) return 'City is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    }
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const payload = {
      post_type:        postType,
      sport:            form.sport,
      city:             form.city.trim(),
      county:           form.county || null,
      contact_info:     form.contact_info.trim(),
      additional_notes: form.additional_notes.trim() || null,
      active:           true,
      approval_status:  'pending',
      source:           'website_form',
      last_confirmed_at: new Date().toISOString(),
      ...(postType === 'player_needed' ? {
        age_group:     form.age_group,
        team_name:     form.team_name.trim() || null,
        position_needed: form.position_needed,
        location_name: form.location_name.trim(),
        event_date:    form.event_date,
      } : {
        player_age:      form.player_age ? parseInt(form.player_age) : null,
        age_group:       form.age_group || null,
        player_position: form.player_position,
        player_description: form.player_description.trim() || null,
      }),
    }

    const { error: sbError } = await supabase.from('player_board').insert(payload)
    setSubmitting(false)

    if (sbError) {
      console.error('Player board insert error:', sbError)
      setError('Something went wrong. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <SuccessBanner message="Your post has been submitted and will appear on the Player Board once reviewed. Posts expire in 4 days." />

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB

  return (
    <div>
      {/* Post type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          ['player_needed',   '⚾ Player Needed'],
          ['player_available','🧢 Player Available'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => {
            setPostType(val)
            setForm(f => ({ ...f, age_group:'', team_name:'', position_needed:[], location_name:'', event_date:'', player_age:'', player_position:[], player_description:'' }))
          }} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
            borderColor: postType === val ? 'var(--navy)' : 'var(--lgray)',
            background:  postType === val ? 'var(--navy)' : 'white',
            color:       postType === val ? 'white' : 'var(--navy)',
            fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)',
          }}>{label}</button>
        ))}
      </div>

      {/* Sport */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['baseball','softball'].map(s => (
            <button key={s} onClick={() => set('sport', s)} style={{
              padding: '8px 18px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
              borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'var(--lgray)',
              background:  form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'white',
              color:       form.sport === s ? 'white' : 'var(--navy)',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize', fontFamily: 'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* player_needed fields */}
      {postType === 'player_needed' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
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

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Position(s) Needed <RequiredMark /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {positions.map(pos => (
                <button key={pos} onClick={() => togglePos(pos, 'position_needed')} style={{
                  padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer',
                  borderColor: form.position_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                  background:  form.position_needed.includes(pos) ? 'var(--navy)' : 'white',
                  color:       form.position_needed.includes(pos) ? 'white' : 'var(--navy)',
                  fontSize: 12, textTransform: 'capitalize', fontFamily: 'var(--font-body)',
                }}>{pos}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>City <RequiredMark /></label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Canton" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>County</label>
              <select value={form.county} onChange={e => set('county', e.target.value)} style={selectStyle}>
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Location / Facility Name <RequiredMark /></label>
            <input value={form.location_name} onChange={e => set('location_name', e.target.value)} placeholder="e.g. Seckinger High School, Fowler Park Field 3" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Event Date <RequiredMark /></label>
            <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} rows={3} placeholder="Practice schedule, skill level expected, tryout info..." style={textareaStyle} />
          </div>
        </>
      )}

      {/* player_available fields */}
      {postType === 'player_available' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
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

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Position(s) <RequiredMark /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {positions.map(pos => (
                <button key={pos} onClick={() => togglePos(pos, 'player_position')} style={{
                  padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer',
                  borderColor: form.player_position.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                  background:  form.player_position.includes(pos) ? 'var(--navy)' : 'white',
                  color:       form.player_position.includes(pos) ? 'white' : 'var(--navy)',
                  fontSize: 12, textTransform: 'capitalize', fontFamily: 'var(--font-body)',
                }}>{pos}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>City <RequiredMark /></label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Alpharetta" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>County</label>
              <select value={form.county} onChange={e => set('county', e.target.value)} style={selectStyle}>
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.player_description} onChange={e => set('player_description', e.target.value)} rows={3} placeholder="Age, skill level, what you're looking for in a team..." style={textareaStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} rows={2} placeholder="Any other details..." style={textareaStyle} />
          </div>
        </>
      )}

      {/* Contact — shared */}
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>Contact Info <RequiredMark /></label>
        <input value={form.contact_info} onChange={e => set('contact_info', e.target.value)} placeholder="Email, phone, or Instagram handle" style={inputStyle} />
        <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4 }}>
          Visible publicly. Posts expire after 4 days.
        </div>
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background: 'var(--red)', color: 'white', border: 'none',
        borderRadius: 8, padding: '12px 32px', marginTop: 8,
        fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Posting…' : 'Submit Post'}
      </button>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'coach',  label: '⚾ Coach Profile' },
  { id: 'team',   label: '🏆 Travel Team' },
  { id: 'player', label: '📋 Player Needed | Player Available' },
]

export default function CoachSubmitForm() {
  const [activeTab, setActiveTab] = useState('coach')

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
          Add a Listing
        </div>
        <div style={{ fontSize: 14, color: 'var(--gray)' }}>
          All submissions are reviewed before going live. Free to list.
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, borderBottom: '2px solid var(--lgray)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px',
            fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--red)' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === tab.id ? 'var(--red)' : 'var(--gray)',
            cursor: 'pointer', marginBottom: -2,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active form */}
      <div style={{ background: 'white', borderRadius: 12, border: '2px solid var(--lgray)', padding: '28px 24px' }}>
        {activeTab === 'coach'  && <CoachForm />}
        {activeTab === 'team'   && <TeamForm />}
        {activeTab === 'player' && <PlayerForm />}
      </div>
    </div>
  )
}
