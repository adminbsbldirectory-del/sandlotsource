import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const DEMO_POSTS = [
  { id:1, post_type:'player_available', sport:'baseball', player_age:12, player_position:['pitcher','outfield'], city:'Alpharetta', county:'Fulton', player_description:'12U RHP/OF looking for competitive 12U or 13U team for spring season. Strong arm, 67mph off mound.', contact_info:'Contact via email', created_at:'2025-03-01', approval_status:'approved' },
  { id:2, post_type:'player_needed', sport:'baseball', team_name:'Cherokee Nationals 10U', age_group:'10U', position_needed:['catcher','shortstop'], city:'Canton', county:'Cherokee', location_name:'Canton Recreation Complex', event_date:'2025-04-12', additional_notes:'Looking for 2 players to round out roster for spring USSSA season. Tryout required.', contact_info:'coach@cherokeenats.com', created_at:'2025-03-05', approval_status:'approved' },
  { id:3, post_type:'player_available', sport:'softball', player_age:14, player_position:['pitcher','1B'], city:'Woodstock', county:'Cherokee', player_description:'14U pitcher with 3 years travel ball experience. 52mph. Looking for 14U PGF-affiliated team.', contact_info:'DM on Instagram @softballmom14', created_at:'2025-03-07', approval_status:'approved' },
  { id:4, post_type:'player_needed', sport:'softball', team_name:'Forsyth Fire 12U', age_group:'12U', position_needed:['pitcher'], city:'Cumming', county:'Forsyth', location_name:'Fowler Park', event_date:'2025-04-20', additional_notes:'Need a pitcher for upcoming tournament season. Practice Tues/Thurs in Cumming.', contact_info:'770-555-0303', created_at:'2025-03-08', approval_status:'approved' },
  { id:5, post_type:'player_available', sport:'baseball', player_age:10, player_position:['catcher','3B'], city:'Buford', county:'Gwinnett', player_description:'10U catcher/3B. Has worked with David Sopilka at El Dojo. Looking for USSSA 10U team.', contact_info:'Dad: 678-555-0404', created_at:'2025-03-09', approval_status:'approved' },
]

const POSITIONS_BB = ['pitcher','catcher','1B','2B','3B','shortstop','outfield','utility']
const POSITIONS_SB = ['pitcher','catcher','1B','2B','3B','shortstop','outfield','utility']
const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','18U','Adult']
const COUNTIES = ['Barrow','Cherokee','Cobb','DeKalb','Forsyth','Fulton','Gwinnett','Hall','Oconee','Walton']

const labelStyle = {
  fontSize:12, fontWeight:600, textTransform:'uppercase',
  letterSpacing:'0.06em', display:'block', marginBottom:6,
}
const inputStyle = {
  width:'100%', padding:'8px 12px', borderRadius:8,
  border:'2px solid var(--lgray)', fontSize:14,
  fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box',
}
const selectStyle = { ...inputStyle }

function RequiredMark() {
  return <span style={{ color:'var(--red)' }}> *</span>
}

function formatDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) }
  catch { return d }
}

const EMPTY_FORM = {
  post_type: 'player_needed',
  sport: 'baseball',
  player_age: '',
  player_position: [],
  player_description: '',
  team_name: '',
  age_group: '',
  position_needed: [],
  city: '',
  county: '',
  location_name: '',
  event_date: '',
  contact_info: '',
  additional_notes: '',
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email.trim()) { setError('Please enter your email.'); return }
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href }
    })
    setSending(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:3000,
      background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:14, padding:'32px',
        width:'100%', maxWidth:420,
        boxShadow:'0 8px 40px rgba(0,0,0,0.25)',
      }}>
        {sent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📬</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:800, color:'var(--navy)', marginBottom:8 }}>
              Check your email
            </div>
            <div style={{ fontSize:14, color:'#555', lineHeight:1.6 }}>
              We sent a sign-in link to <strong>{email}</strong>. Click it to sign in — no password needed.
            </div>
            <div style={{ fontSize:12, color:'#888', marginTop:12 }}>
              Check your spam folder if you don't see it within a minute.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color:'var(--navy)', marginBottom:6 }}>
              Sign in to post or edit
            </div>
            <div style={{ fontSize:13, color:'#666', marginBottom:20, lineHeight:1.5 }}>
              Enter your email and we'll send you a magic link — no password needed. You'll be able to edit or delete your own listings.
            </div>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ ...inputStyle, marginBottom:12, fontSize:15 }}
              autoFocus
            />
            {error && <div style={{ color:'var(--red)', fontSize:13, marginBottom:10 }}>{error}</div>}
            <button onClick={handleSend} disabled={sending} style={{
              width:'100%', padding:'12px',
              background:'var(--navy)', color:'white',
              border:'none', borderRadius:8,
              fontSize:15, fontWeight:700, cursor: sending ? 'not-allowed' : 'pointer',
              fontFamily:'var(--font-head)', opacity: sending ? 0.7 : 1,
            }}>
              {sending ? 'Sending…' : 'Send Sign-in Link'}
            </button>
            <div style={{ fontSize:11, color:'#aaa', marginTop:10, textAlign:'center' }}>
              No account needed — signing in creates one automatically.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Delete Confirmation ───────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{
      position:'fixed', inset:0, zIndex:3000,
      background:'rgba(0,0,0,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:14, padding:'28px',
        width:'100%', maxWidth:380,
        boxShadow:'0 8px 40px rgba(0,0,0,0.25)',
        textAlign:'center',
      }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
        <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:800, color:'var(--navy)', marginBottom:8 }}>
          Delete this listing?
        </div>
        <div style={{ fontSize:14, color:'#555', marginBottom:20 }}>
          This can't be undone. The listing will be removed immediately.
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, padding:'11px', background:'white',
            color:'var(--navy)', border:'2px solid var(--lgray)',
            borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex:1, padding:'11px', background:'#DC2626',
            color:'white', border:'none',
            borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer',
          }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PlayerBoard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sportFilter, setSportFilter] = useState('Both')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)      // id of post being edited
  const [deleteTarget, setDeleteTarget] = useState(null) // post to confirm delete
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  // ── Auth state ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load posts ──
  useEffect(() => {
    async function load() {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('player_board')
        .select('*')
        .eq('active', true)
        .gt('expires_at', now)
        .in('approval_status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
      if (!error && data && data.length > 0) setPosts(data)
      else if (!error && (!data || data.length === 0)) setPosts(DEMO_POSTS)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = posts.filter(p => {
    if (filter !== 'all' && p.post_type !== filter) return false
    if (sportFilter !== 'Both' && p.sport !== sportFilter) return false
    return true
  })

  function togglePosition(pos, field) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(pos) ? f[field].filter(p => p !== pos) : [...f[field], pos]
    }))
  }

  function validate() {
    if (form.post_type === 'player_needed') {
      if (!form.sport) return 'Sport is required.'
      if (!form.age_group) return 'Age group is required.'
      if (!form.position_needed.length) return 'Select at least one position needed.'
      if (!form.city.trim()) return 'City is required.'
      if (!form.location_name.trim()) return 'Location / facility name is required.'
      if (!form.event_date) return 'Event date is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    } else {
      if (!form.sport) return 'Sport is required.'
      if (!form.player_age.toString().trim()) return 'Player age is required.'
      if (!form.player_position.length) return 'Select at least one position.'
      if (!form.city.trim()) return 'City is required.'
      if (!form.contact_info.trim()) return 'Contact info is required.'
    }
    return ''
  }

  // ── Submit new post ──
  async function handleSubmit() {
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError('')
    setSubmitting(true)

    const payload = {
      post_type: form.post_type,
      sport: form.sport,
      city: form.city,
      county: form.county || null,
      contact_info: form.contact_info,
      additional_notes: form.additional_notes || null,
      active: true,
      approval_status: 'pending',
      source: 'website_form',
      last_confirmed_at: new Date().toISOString(),
      user_id: user?.id ?? null,
      ...(form.post_type === 'player_available' ? {
        player_age: form.player_age ? parseInt(form.player_age) : null,
        age_group: form.age_group || null,
        player_position: form.player_position,
        player_description: form.player_description || null,
      } : {
        team_name: form.team_name || null,
        age_group: form.age_group,
        position_needed: form.position_needed,
        location_name: form.location_name,
        event_date: form.event_date,
      })
    }

    const { error } = await supabase.from('player_board').insert(payload)
    setSubmitting(false)
    if (!error) {
      setSubmitted(true)
      setShowForm(false)
      setPosts(prev => [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...prev])
      setForm(EMPTY_FORM)
    } else {
      setValidationError('Something went wrong. Please try again.')
    }
  }

  // ── Start editing a post ──
  function startEdit(post) {
    setForm({
      post_type: post.post_type,
      sport: post.sport,
      player_age: post.player_age || '',
      player_position: Array.isArray(post.player_position) ? post.player_position : [],
      player_description: post.player_description || '',
      team_name: post.team_name || '',
      age_group: post.age_group || '',
      position_needed: Array.isArray(post.position_needed) ? post.position_needed : [],
      city: post.city || '',
      county: post.county || '',
      location_name: post.location_name || '',
      event_date: post.event_date ? post.event_date.split('T')[0] : '',
      contact_info: post.contact_info || '',
      additional_notes: post.additional_notes || '',
    })
    setEditingId(post.id)
    setShowForm(true)
    setSubmitted(false)
    setValidationError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Save edit ──
  async function handleSaveEdit() {
    const err = validate()
    if (err) { setValidationError(err); return }
    setValidationError('')
    setSubmitting(true)

    const updates = {
      post_type: form.post_type,
      sport: form.sport,
      city: form.city,
      county: form.county || null,
      contact_info: form.contact_info,
      additional_notes: form.additional_notes || null,
      ...(form.post_type === 'player_available' ? {
        player_age: form.player_age ? parseInt(form.player_age) : null,
        age_group: form.age_group || null,
        player_position: form.player_position,
        player_description: form.player_description || null,
        team_name: null, position_needed: null, location_name: null, event_date: null,
      } : {
        team_name: form.team_name || null,
        age_group: form.age_group,
        position_needed: form.position_needed,
        location_name: form.location_name,
        event_date: form.event_date,
        player_age: null, player_position: null, player_description: null,
      })
    }

    const { error } = await supabase
      .from('player_board')
      .update(updates)
      .eq('id', editingId)

    setSubmitting(false)
    if (!error) {
      setPosts(prev => prev.map(p => p.id === editingId ? { ...p, ...updates } : p))
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      setSubmitted(true)
    } else {
      setValidationError('Something went wrong saving your changes.')
    }
  }

  // ── Delete a post ──
  async function handleDelete(post) {
    const { error } = await supabase
      .from('player_board')
      .update({ active: false })
      .eq('id', post.id)
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== post.id))
    }
    setDeleteTarget(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setValidationError('')
  }

  const filterStyle = {
    padding:'8px 12px', borderRadius:8,
    border:'2px solid var(--lgray)', background:'white',
    fontSize:13, color:'var(--navy)', fontFamily:'var(--font-body)',
    outline:'none', cursor:'pointer',
  }

  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB
  const isEditing = editingId !== null

  return (
    <div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {deleteTarget && (
        <DeleteConfirm
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Filter bar ── */}
      <div style={{
        background:'var(--white)', borderBottom:'2px solid var(--lgray)',
        padding:'12px 24px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
      }}>
        {[
          ['all',              'All Posts'],
          ['player_available', 'Players Available'],
          ['player_needed',    'Player Needed'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            ...filterStyle,
            background: filter === val ? 'var(--navy)' : 'white',
            color:       filter === val ? 'white' : 'var(--navy)',
            fontWeight:  filter === val ? 600 : 400,
            border: `2px solid ${filter === val ? 'var(--navy)' : 'var(--lgray)'}`,
          }}>{label}</button>
        ))}
        <select value={sportFilter} onChange={e => setSportFilter(e.target.value)} style={filterStyle}>
          <option>Both</option><option>baseball</option><option>softball</option>
        </select>
        <div style={{ flex:1 }} />

        {/* Auth widget */}
        {user ? (
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, color:'var(--gray)' }}>
              ✅ {user.email}
            </span>
            <button onClick={() => supabase.auth.signOut()} style={{
              ...filterStyle, fontSize:12, padding:'6px 12px', color:'#666',
            }}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} style={{
            ...filterStyle, fontSize:13, fontWeight:600, color:'var(--navy)',
          }}>🔑 Sign in to manage posts</button>
        )}

        <button
          onClick={() => {
            if (!user) { setShowAuth(true); return }
            if (showForm && !isEditing) { cancelForm() } else { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setSubmitted(false) }
          }}
          style={{
            background:'var(--red)', color:'white',
            border:'none', borderRadius:8,
            padding:'9px 18px', fontWeight:700,
            fontFamily:'var(--font-head)', fontSize:14,
            letterSpacing:'0.04em', textTransform:'uppercase', cursor:'pointer',
          }}
        >
          {showForm && !isEditing ? '✕ Cancel' : '+ Post Listing'}
        </button>
      </div>

      {/* ── Success banner ── */}
      {submitted && (
        <div style={{ background:'#DCFCE7', borderBottom:'2px solid #16A34A', padding:'12px 24px', color:'#15803D', fontWeight:600, fontSize:14 }}>
          ✅ {isEditing ? 'Your listing has been updated!' : 'Your listing has been submitted! It will appear once reviewed and expires in 4 days.'}
        </div>
      )}

      {/* ── Post / Edit Form ── */}
      {showForm && (
        <div style={{
          margin:'24px', background:'white', borderRadius:12,
          border: isEditing ? '2px solid var(--gold)' : '2px solid var(--lgray)',
          padding:'24px', maxWidth:680,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700 }}>
              {isEditing ? '✏️ Edit Your Listing' : 'Post a New Listing'}
            </div>
            {isEditing && (
              <button onClick={cancelForm} style={{
                background:'none', border:'none', color:'var(--gray)',
                fontSize:20, cursor:'pointer', padding:'4px 8px',
              }}>✕</button>
            )}
          </div>

          {/* Post type toggle */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[
              ['player_needed',   '⚾ Player Needed'],
              ['player_available','🧢 Player Available'],
            ].map(([val, label]) => (
              <button key={val} onClick={() => setForm(f => ({
                ...f, post_type: val,
                player_age:'', player_position:[], player_description:'',
                team_name:'', age_group:'', position_needed:[],
                location_name:'', event_date:'',
              }))} style={{
                flex:1, padding:'10px', borderRadius:8, border:'2px solid',
                borderColor: form.post_type === val ? 'var(--navy)' : 'var(--lgray)',
                background:  form.post_type === val ? 'var(--navy)' : 'white',
                color:       form.post_type === val ? 'white' : 'var(--navy)',
                fontWeight:600, fontSize:14, fontFamily:'var(--font-body)', cursor:'pointer',
              }}>{label}</button>
            ))}
          </div>

          {/* Sport */}
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Sport <RequiredMark /></label>
            <div style={{ display:'flex', gap:8 }}>
              {['baseball','softball'].map(s => (
                <button key={s} onClick={() => setForm(f => ({...f, sport:s}))} style={{
                  padding:'8px 18px', borderRadius:8, border:'2px solid',
                  borderColor: form.sport === s ? (s==='softball'?'#7C3AED':'#1D4ED8') : 'var(--lgray)',
                  background:  form.sport === s ? (s==='softball'?'#7C3AED':'#1D4ED8') : 'white',
                  color:       form.sport === s ? 'white' : 'var(--navy)',
                  fontWeight:600, fontSize:13, textTransform:'capitalize',
                  fontFamily:'var(--font-body)', cursor:'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* player_needed fields */}
          {form.post_type === 'player_needed' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>Age Group <RequiredMark /></label>
                  <select value={form.age_group} onChange={e => setForm(f => ({...f, age_group:e.target.value}))} style={selectStyle}>
                    <option value="">Select</option>
                    {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Team Name</label>
                  <input value={form.team_name} onChange={e => setForm(f => ({...f, team_name:e.target.value}))}
                    placeholder="e.g. Cherokee Nationals" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Position(s) Needed <RequiredMark /></label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {positions.map(pos => (
                    <button key={pos} onClick={() => togglePosition(pos, 'position_needed')} style={{
                      padding:'5px 12px', borderRadius:20, border:'2px solid', cursor:'pointer',
                      borderColor: form.position_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                      background:  form.position_needed.includes(pos) ? 'var(--navy)' : 'white',
                      color:       form.position_needed.includes(pos) ? 'white' : 'var(--navy)',
                      fontSize:12, textTransform:'capitalize', fontFamily:'var(--font-body)',
                    }}>{pos}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>City <RequiredMark /></label>
                  <input value={form.city} onChange={e => setForm(f => ({...f, city:e.target.value}))}
                    placeholder="e.g. Canton" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>County</label>
                  <select value={form.county} onChange={e => setForm(f => ({...f, county:e.target.value}))} style={selectStyle}>
                    <option value="">Select county</option>
                    {COUNTIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Location / Facility Name <RequiredMark /></label>
                <input value={form.location_name} onChange={e => setForm(f => ({...f, location_name:e.target.value}))}
                  placeholder="e.g. Seckinger High School, Fowler Park Field 3" style={inputStyle} />
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Event Date <RequiredMark /></label>
                <input type="date" value={form.event_date} onChange={e => setForm(f => ({...f, event_date:e.target.value}))} style={inputStyle} />
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Additional Notes</label>
                <textarea value={form.additional_notes} onChange={e => setForm(f => ({...f, additional_notes:e.target.value}))}
                  rows={3} placeholder="Practice schedule, skill level expected, tryout info..."
                  style={{ ...inputStyle, resize:'vertical' }} />
              </div>
            </>
          )}

          {/* player_available fields */}
          {form.post_type === 'player_available' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>Player Age <RequiredMark /></label>
                  <input type="number" min="6" max="99" value={form.player_age}
                    onChange={e => setForm(f => ({...f, player_age:e.target.value}))}
                    placeholder="e.g. 12" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Age Group</label>
                  <select value={form.age_group} onChange={e => setForm(f => ({...f, age_group:e.target.value}))} style={selectStyle}>
                    <option value="">Select</option>
                    {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Position(s) <RequiredMark /></label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {positions.map(pos => (
                    <button key={pos} onClick={() => togglePosition(pos, 'player_position')} style={{
                      padding:'5px 12px', borderRadius:20, border:'2px solid', cursor:'pointer',
                      borderColor: form.player_position.includes(pos) ? 'var(--navy)' : 'var(--lgray)',
                      background:  form.player_position.includes(pos) ? 'var(--navy)' : 'white',
                      color:       form.player_position.includes(pos) ? 'white' : 'var(--navy)',
                      fontSize:12, textTransform:'capitalize', fontFamily:'var(--font-body)',
                    }}>{pos}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>City <RequiredMark /></label>
                  <input value={form.city} onChange={e => setForm(f => ({...f, city:e.target.value}))}
                    placeholder="e.g. Alpharetta" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>County</label>
                  <select value={form.county} onChange={e => setForm(f => ({...f, county:e.target.value}))} style={selectStyle}>
                    <option value="">Select county</option>
                    {COUNTIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.player_description} onChange={e => setForm(f => ({...f, player_description:e.target.value}))}
                  rows={3} placeholder="Age, skill level, what you're looking for in a team..."
                  style={{ ...inputStyle, resize:'vertical' }} />
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Additional Notes</label>
                <textarea value={form.additional_notes} onChange={e => setForm(f => ({...f, additional_notes:e.target.value}))}
                  rows={2} placeholder="Any other details..."
                  style={{ ...inputStyle, resize:'vertical' }} />
              </div>
            </>
          )}

          {/* Contact — shared */}
          <div style={{ marginBottom:8 }}>
            <label style={labelStyle}>Contact Info <RequiredMark /></label>
            <input value={form.contact_info} onChange={e => setForm(f => ({...f, contact_info:e.target.value}))}
              placeholder="Email, phone, or Instagram handle" style={inputStyle} />
            <div style={{ fontSize:11, color:'var(--gray)', marginTop:4 }}>
              Visible publicly. Listings expire after 4 days.
            </div>
          </div>

          {validationError && (
            <div style={{ background:'#FEE2E2', border:'1px solid #F87171', borderRadius:8, padding:'10px 14px', margin:'12px 0', color:'#B91C1C', fontSize:13 }}>
              {validationError}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button
              onClick={isEditing ? handleSaveEdit : handleSubmit}
              disabled={submitting}
              style={{
                background: isEditing ? 'var(--gold)' : 'var(--red)',
                color: isEditing ? 'var(--navy)' : 'white',
                border:'none', borderRadius:8, padding:'12px 28px',
                fontFamily:'var(--font-head)', fontSize:16, fontWeight:700,
                letterSpacing:'0.04em', textTransform:'uppercase',
                opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Saving…' : isEditing ? '💾 Save Changes' : 'Submit Listing'}
            </button>
            {isEditing && (
              <button onClick={cancelForm} style={{
                background:'white', color:'var(--navy)',
                border:'2px solid var(--lgray)', borderRadius:8,
                padding:'12px 20px', fontSize:14, fontWeight:700, cursor:'pointer',
              }}>Cancel</button>
            )}
          </div>
        </div>
      )}

      {/* ── Posts grid ── */}
      <div style={{
        padding:'24px',
        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))',
        gap:16, maxWidth:1200, margin:'0 auto',
      }}>
        {filtered.map(post => {
          const isPlayer = post.post_type === 'player_available'
          const postPositions = isPlayer
            ? (Array.isArray(post.player_position) ? post.player_position : [])
            : (Array.isArray(post.position_needed) ? post.position_needed : [])
          const isOwner = user && post.user_id && post.user_id === user.id

          return (
            <div key={post.id} style={{
              background:'white', borderRadius:12,
              border: isOwner
                ? '2px solid var(--gold)'
                : `2px solid ${isPlayer ? '#DBEAFE' : '#FEF3C7'}`,
              padding:'18px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
              position:'relative',
            }}>
              {/* Owner indicator */}
              {isOwner && (
                <div style={{
                  position:'absolute', top:-1, right:12,
                  background:'var(--gold)', color:'var(--navy)',
                  fontSize:10, fontWeight:700, padding:'2px 8px',
                  borderRadius:'0 0 6px 6px', fontFamily:'var(--font-head)',
                  letterSpacing:'0.04em',
                }}>YOUR POST</div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{
                  background: isPlayer ? '#1D4ED8' : '#D97706',
                  color:'white', fontSize:11, fontWeight:700,
                  padding:'3px 9px', borderRadius:20,
                  fontFamily:'var(--font-head)', textTransform:'uppercase',
                  letterSpacing:'0.05em',
                }}>
                  {isPlayer ? '🧢 Player Available' : '⚾ Player Needed'}
                </span>
                <span style={{
                  background: post.sport === 'softball' ? '#7C3AED' : '#0B1F3A',
                  color:'white', fontSize:11, fontWeight:700,
                  padding:'3px 9px', borderRadius:20,
                  fontFamily:'var(--font-head)', textTransform:'uppercase',
                }}>{post.sport}</span>
              </div>

              {isPlayer ? (
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700 }}>
                    {post.player_age ? `Age ${post.player_age}` : post.age_group || 'Player'} — {post.city}
                  </div>
                  {post.player_description && (
                    <div style={{ fontSize:13, color:'var(--gray)', marginTop:6, lineHeight:1.5 }}>{post.player_description}</div>
                  )}
                  {post.additional_notes && (
                    <div style={{ fontSize:13, color:'var(--gray)', marginTop:4, lineHeight:1.5 }}>{post.additional_notes}</div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700 }}>
                    {post.team_name || 'Team'}{post.age_group ? ` · ${post.age_group}` : ''}
                  </div>
                  <div style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>
                    📍 {[post.location_name, post.city, post.county ? `${post.county} Co.` : null].filter(Boolean).join(', ')}
                  </div>
                  {post.event_date && (
                    <div style={{ fontSize:13, color:'var(--gray)', marginTop:2 }}>
                      📅 {formatDate(post.event_date)}
                    </div>
                  )}
                  {post.additional_notes && (
                    <div style={{ fontSize:13, color:'var(--gray)', marginTop:6, lineHeight:1.5 }}>{post.additional_notes}</div>
                  )}
                </div>
              )}

              {postPositions.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
                  {postPositions.map(pos => (
                    <span key={pos} style={{
                      background:'var(--lgray)', color:'var(--navy)',
                      fontSize:11, padding:'2px 8px', borderRadius:20, textTransform:'capitalize',
                    }}>{pos}</span>
                  ))}
                </div>
              )}

              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--lgray)', fontSize:13 }}>
                <span style={{ fontWeight:600, color:'var(--navy)' }}>📬 </span>
                {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(post.contact_info) ? (
                  <a href={`mailto:${post.contact_info}`} style={{ color:'#1D4ED8', textDecoration:'none', fontWeight:600 }}>{post.contact_info}</a>
                ) : /^[\d\s\-\(\)\+\.]+$/.test(post.contact_info?.replace(/^(dad:|mom:|coach:)/i,'').trim()) ? (
                  <a href={`tel:${post.contact_info.replace(/\D/g,'')}`} style={{ color:'var(--navy)', textDecoration:'none', fontWeight:600 }}>{post.contact_info}</a>
                ) : (
                  <span style={{ fontWeight:600, color:'var(--navy)' }}>{post.contact_info}</span>
                )}
              </div>

              <div style={{ fontSize:11, color:'var(--gray)', marginTop:6 }}>
                Posted {formatDate(post.created_at)}
              </div>

              {/* Edit / Delete — only for post owner */}
              {isOwner && (
                <div style={{ display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid var(--lgray)' }}>
                  <button onClick={() => startEdit(post)} style={{
                    flex:1, padding:'7px', background:'var(--navy)', color:'white',
                    border:'none', borderRadius:7, fontSize:12, fontWeight:700,
                    cursor:'pointer', fontFamily:'var(--font-head)',
                  }}>✏️ Edit</button>
                  <button onClick={() => setDeleteTarget(post)} style={{
                    flex:1, padding:'7px', background:'white', color:'#DC2626',
                    border:'2px solid #FCA5A5', borderRadius:7, fontSize:12, fontWeight:700,
                    cursor:'pointer', fontFamily:'var(--font-head)',
                  }}>🗑️ Delete</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && !showForm && (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--gray)' }}>
          No listings yet. Be the first to post!
        </div>
      )}
    </div>
  )
}
