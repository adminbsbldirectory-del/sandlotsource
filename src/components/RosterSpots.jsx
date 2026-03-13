import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const COUNTIES = [
  'Barrow','Banks','Cherokee','Clarke','Cobb','Dawson','DeKalb','Fannin','Forsyth',
  'Franklin','Gilmer','Gordon','Gwinnett','Habersham','Hall','Hart','Jackson',
  'Lumpkin','Madison','Murray','Oconee','Pickens','Rabun','Stephens','Towns',
  'Union','Walker','Walton','White','Whitfield',
]
const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','High School','College','Adult']
const POSITIONS_BB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']
const POSITIONS_SB = ['Pitcher','Catcher','1B','2B','3B','Shortstop','Outfield','Utility']

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

function SportBadge({ sport }) {
  return (
    <span style={{
      background: sport === 'softball' ? '#7C3AED' : '#1D4ED8',
      color: 'white', fontSize: 10, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      textTransform: 'uppercase', fontFamily: 'var(--font-head)',
      letterSpacing: '0.06em',
    }}>{sport}</span>
  )
}

function RosterCard({ spot }) {
  const positions = Array.isArray(spot.positions_needed) ? spot.positions_needed : []
  const daysLeft = spot.expires_at
    ? Math.max(0, Math.ceil((new Date(spot.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 12,
      border: '2px solid var(--lgray)', padding: '18px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
            {spot.team_name || 'Team Name TBD'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray)' }}>
            📍 {[spot.city, spot.county ? spot.county + ' Co.' : null].filter(Boolean).join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <SportBadge sport={spot.sport} />
          {spot.age_group && (
            <span style={{
              background: 'var(--navy)', color: 'white',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              fontFamily: 'var(--font-head)',
            }}>{spot.age_group}</span>
          )}
        </div>
      </div>

      {spot.org_affiliation && (
        <div style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 8 }}>
          🏆 {spot.org_affiliation}
        </div>
      )}

      {positions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', marginRight: 2 }}>Needs:</span>
          {positions.map(p => (
            <span key={p} style={{
              background: '#FEF3C7', color: '#92400E',
              fontSize: 11, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20,
              textTransform: 'capitalize',
            }}>{p}</span>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 10 }}>
        <span style={{
          background: '#DCFCE7', color: '#15803D',
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        }}>📅 Full Season</span>
      </div>

      {spot.description && (
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>
          {spot.description}
        </div>
      )}

      <div style={{ paddingTop: 12, borderTop: '1px solid var(--lgray)', fontSize: 13 }}>
        {spot.contact_name && (
          <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 3 }}>
            👤 {spot.contact_name}
          </div>
        )}
        <div style={{ color: '#1D4ED8', fontWeight: 600 }}>
          📬 {spot.contact_info}
        </div>
      </div>

      {daysLeft !== null && (
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 8, textAlign: 'right' }}>
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

function RosterForm({ onSubmitted }) {
  const [form, setForm] = useState({
    sport: 'baseball', team_name: '', org_affiliation: '',
    age_group: '', positions_needed: [],
    city: '', county: '', description: '',
    contact_name: '', contact_info: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function togglePos(pos) {
    setForm(f => ({
      ...f,
      positions_needed: f.positions_needed.includes(pos)
        ? f.positions_needed.filter(p => p !== pos)
        : [...f.positions_needed, pos],
    }))
  }

  function validate() {
    if (!form.sport)                  return 'Sport is required.'
    if (!form.age_group)              return 'Age group is required.'
    if (!form.city.trim())            return 'City is required.'
    if (!form.contact_info.trim())    return 'Contact info is required.'
    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setSubmitting(true)

    const payload = {
      sport:            form.sport,
      team_name:        form.team_name.trim() || null,
      org_affiliation:  form.org_affiliation.trim() || null,
      age_group:        form.age_group,
      positions_needed: form.positions_needed,
      city:             form.city.trim(),
      county:           form.county || null,
      commitment:       'full_season',
      description:      form.description.trim() || null,
      contact_name:     form.contact_name.trim() || null,
      contact_info:     form.contact_info.trim(),
      active:           true,
      approval_status:  'pending',
      source:           'website_form',
      last_confirmed_at: new Date().toISOString(),
    }

    const { error: sbError } = await supabase.from('roster_spots').insert(payload)
    setSubmitting(false)

    if (sbError) {
      console.error('Roster spot insert error:', sbError)
      setError('Something went wrong. Please try again.')
    } else {
      onSubmitted()
    }
  }

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '2px solid var(--lgray)', padding: '28px 24px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 20 }}>
        Post a Roster Spot
      </div>

      {/* Sport */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['baseball', 'softball'].map(s => (
            <button key={s} onClick={() => { set('sport', s); set('positions_needed', []) }} style={{
              padding: '8px 18px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
              borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'var(--lgray)',
              background:  form.sport === s ? (s === 'softball' ? '#7C3AED' : 'var(--navy)') : 'white',
              color:       form.sport === s ? 'white' : 'var(--navy)',
              fontWeight: 600, fontSize: 13, textTransform: 'capitalize', fontFamily: 'var(--font-body)',
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Team + Org */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Team Name</label>
          <input value={form.team_name} onChange={e => set('team_name', e.target.value)} placeholder="e.g. Cherokee Nationals" style={inputStyle} />
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

      {/* Positions */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Position(s) Needed</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {positions.map(pos => (
            <button key={pos} onClick={() => togglePos(pos)} style={{
              padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer',
              borderColor: form.positions_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
              background:  form.positions_needed.includes(pos) ? 'var(--navy)' : 'white',
              color:       form.positions_needed.includes(pos) ? 'white' : 'var(--navy)',
              fontSize: 12, fontFamily: 'var(--font-body)',
            }}>{pos}</button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          rows={3} placeholder="Skill level expected, practice schedule, tournament schedule, what kind of player you're looking for..."
          style={textareaStyle} />
      </div>

      {/* Contact */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Contact Name</label>
          <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Coach or team manager name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Contact Info <RequiredMark /></label>
          <input value={form.contact_info} onChange={e => set('contact_info', e.target.value)} placeholder="Email, phone, or Instagram" style={inputStyle} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12 }}>
        Roster spots are reviewed before going live and expire after <strong>15 days</strong>. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
      </div>

      <FieldError msg={error} />

      <button onClick={handleSubmit} disabled={submitting} style={{
        background: 'var(--red)', color: 'white', border: 'none',
        borderRadius: 8, padding: '12px 32px',
        fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
      }}>
        {submitting ? 'Posting…' : 'Post Roster Spot'}
      </button>
    </div>
  )
}

export default function RosterSpots() {
  const [spots, setSpots] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('browse') // 'browse' | 'post' | 'submitted'
  const [sport, setSport] = useState('Both')
  const [ageGroup, setAgeGroup] = useState('All Ages')

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

  const filtered = spots.filter(s => {
    if (sport !== 'Both' && s.sport !== sport) return false
    if (ageGroup !== 'All Ages' && s.age_group !== ageGroup) return false
    return true
  })

  const filterStyle = {
    padding: '8px 12px', borderRadius: 8,
    border: '2px solid var(--lgray)', background: 'white',
    fontSize: 13, color: 'var(--navy)', fontFamily: 'var(--font-body)',
    outline: 'none', cursor: 'pointer',
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
          <button onClick={() => { setView('browse') }} style={{
            background: 'var(--navy)', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 24px',
            fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Back to Roster Spots
          </button>
        </div>
      </div>
    )
  }

  if (view === 'post') {
    return (
      <div style={{ padding: '32px 20px' }}>
        <button onClick={() => setView('browse')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--navy)', fontWeight: 700, fontSize: 13,
          fontFamily: 'var(--font-head)', marginBottom: 20, display: 'block',
        }}>
          ← Back to Roster Spots
        </button>
        <RosterForm onSubmitted={() => setView('submitted')} />
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div style={{
        background: 'var(--white)', borderBottom: '2px solid var(--lgray)',
        padding: '12px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <select value={sport} onChange={e => setSport(e.target.value)} style={filterStyle}>
          <option>Both</option>
          <option>baseball</option>
          <option>softball</option>
        </select>
        <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={filterStyle}>
          {['All Ages', ...AGE_GROUPS].map(a => <option key={a}>{a}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--gray)', flex: 1 }}>
          {loading ? 'Loading…' : `${filtered.length} roster spot${filtered.length !== 1 ? 's' : ''} open`}
        </span>
        <button onClick={() => setView('post')} style={{
          padding: '9px 18px', borderRadius: 8,
          background: 'var(--red)', color: 'white',
          border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          + Post a Roster Spot
        </button>
      </div>

      {/* Page header */}
      <div style={{ background: 'var(--cream)', borderBottom: '2px solid var(--lgray)', padding: '20px 24px' }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
          Roster Spots Open
        </div>
        <div style={{ fontSize: 13, color: 'var(--gray)' }}>
          Travel teams looking for full-season players. Posts expire after 15 days.
        </div>
      </div>

      {/* Cards grid */}
      <div style={{
        padding: '24px', display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16, maxWidth: 1200, margin: '0 auto',
      }}>
        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 16, marginBottom: 12 }}>No roster spots open right now.</div>
            <button onClick={() => setView('post')} style={{
              background: 'var(--navy)', color: 'white', border: 'none',
              borderRadius: 8, padding: '10px 24px',
              fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Post a Roster Spot
            </button>
          </div>
        )}
        {filtered.map(spot => <RosterCard key={spot.id} spot={spot} />)}
      </div>
    </div>
  )
}
