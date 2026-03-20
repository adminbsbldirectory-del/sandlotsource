import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
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
    html: '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:' + color + ';border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -28],
  })

const PIN_COLORS = { needs_player: '#ea580c', pickup: '#0891b2' }

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude), city: place['place name'], state: place['state abbreviation'] }
  } catch { return null }
}

async function geocodeAddress(address, city, zip) {
  if (!address) return null
  try {
    const q = encodeURIComponent(address + (city ? ', ' + city : '') + (zip ? ', ' + zip : '') + ', USA')
    const res = await fetch('https://nominatim.openstreetmap.org/search?q=' + q + '&format=json&limit=1&countrycodes=us', { headers: { 'Accept-Language': 'en-US' } })
    if (!res.ok) return null
    const data = await res.json()
    if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    return null
  } catch { return null }
}

function buildLocationName(venue, address, fieldNum) {
  return [venue.trim(), address.trim(), fieldNum.trim()].filter(Boolean).join(' — ')
}

function parseLocationName(locationName) {
  const parts = String(locationName || '').split(' — ')
  return {
    venue_name: parts[0] || '',
    location_address: parts[1] || '',
    field_number: parts[2] || '',
  }
}

const POSITIONS_BB = ['pitcher', 'catcher', '1B', '2B', '3B', 'shortstop', 'outfield', 'utility']
const POSITIONS_SB = ['pitcher', 'catcher', '1B', '2B', '3B', 'shortstop', 'outfield', 'utility']
const AGE_GROUPS = ['6U', '7U', '8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '18U', 'Adult']
const HAND_OPTIONS = ['R', 'L', 'Switch']

const labelStyle = { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '2px solid var(--lgray)', fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }
const selectStyle = { ...inputStyle }

function RequiredMark() { return <span style={{ color: 'var(--red)' }}> *</span> }

function formatDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

function milesBetween(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function extractTravelMiles(notes) {
  const txt = String(notes || '')
  if (!txt) return null
  if (/Willing to travel:\s*Anywhere/i.test(txt)) return 999
  const m = txt.match(/Willing to travel:\s*up to\s*(\d+)\s*miles/i)
  return m ? parseInt(m[1], 10) : null
}

const US_STATES = [
  '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY', 'DC'
]

function FitBounds({ posts }) {
  const map = useMap()
  useEffect(() => {
    const pts = posts.filter((p) => p.lat != null && p.lng != null)
    if (pts.length === 0) return
    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
  }, [posts, map])
  return null
}

function ZipFieldInline({ value, onChange, onGeocode, required }) {
  const [status, setStatus] = useState('')
  async function handleBlur() {
    if (!value || value.length !== 5) return
    setStatus('loading')
    const geo = await geocodeZip(value)
    if (geo) { setStatus('ok'); onGeocode(geo) }
    else { setStatus('error'); onGeocode(null) }
  }
  return (
    <div>
      <label style={labelStyle}>
        Zip Code{required && <span style={{ color: 'var(--red)' }}> *</span>}
        {status === 'loading' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Checking…</span>}
        {status === 'ok' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Located</span>}
        {status === 'error' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--red)' }}>Zip not found</span>}
      </label>
      <input type="text" inputMode="numeric" maxLength={5} value={value} onChange={(e) => onChange(e.target.value)} onBlur={handleBlur} placeholder="e.g. 30009" style={inputStyle} />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Used for distance search matching</div>
    </div>
  )
}

function AddressGeoField({ value, onChange, onGeocode, city, zip }) {
  const [status, setStatus] = useState('')
  async function handleBlur() {
    if (!value.trim()) return
    setStatus('loading')
    const geo = await geocodeAddress(value, city, zip)
    if (geo) { setStatus('found'); onGeocode(geo) }
    else { setStatus('fallback'); onGeocode(null) }
  }
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>
        Street Address <RequiredMark />
        {status === 'loading' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Locating…</span>}
        {status === 'found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Pin placed at address</span>}
        {status === 'fallback' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Address not found — pin will use zip area</span>}
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={handleBlur} placeholder="e.g. 11925 Wills Rd, Alpharetta, GA 30009" style={inputStyle} />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Tab out after typing to place map pin at exact location</div>
    </div>
  )
}

const EMPTY_FORM = {
  post_type: 'player_needed', sport: 'baseball', player_age: '', player_position: [],
  player_description: '', team_name: '', age_group: '', position_needed: [],
  city: '', state: '', venue_name: '', location_address: '', field_number: '',
  event_date: '', additional_notes: '', distance_travel: 25, bats: '', throws: '',
  contact_type: 'email', contact_email: '', contact_phone: '', zip_code: '', lat: null, lng: null,
}

const TRAVEL_OPTIONS = [
  { value: 10, label: 'Up to 10 miles' }, { value: 25, label: 'Up to 25 miles' },
  { value: 50, label: 'Up to 50 miles' }, { value: 75, label: 'Up to 75 miles' },
  { value: 100, label: 'Up to 100 miles' }, { value: 150, label: 'Up to 150 miles' },
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

function buildContactInfo(form) {
  if (form.contact_type === 'email') return form.contact_email.trim()
  if (form.contact_type === 'phone') return form.contact_phone.trim()
  const parts = []
  if (form.contact_email.trim()) parts.push(form.contact_email.trim())
  if (form.contact_phone.trim()) parts.push(form.contact_phone.trim())
  return parts.join(' / ')
}

function parseContactInfo(contact_info) {
  if (!contact_info) return { contact_type: 'email', contact_email: '', contact_phone: '' }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (contact_info.includes(' / ')) {
    const [a, b] = contact_info.split(' / ')
    const email = emailRe.test(a) ? a : b
    const phone = emailRe.test(a) ? b : a
    return { contact_type: 'both', contact_email: email, contact_phone: phone }
  }
  if (emailRe.test(contact_info)) return { contact_type: 'email', contact_email: contact_info, contact_phone: '' }
  return { contact_type: 'phone', contact_email: '', contact_phone: contact_info }
}

function ContactDisplay({ contact_info }) {
  if (!contact_info) return null
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRe = /^[\d\s\-\(\)\+\.]+$/
  if (contact_info.includes(' / ')) {
    const parts = contact_info.split(' / ')
    return (
      <span>
        {parts.map((c, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: 'var(--lgray)' }}> · </span>}
            {emailRe.test(c)
              ? <a href={'mailto:' + c} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>{c}</a>
              : <a href={'tel:' + c.replace(/\D/g, '')} style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>{c}</a>}
          </span>
        ))}
      </span>
    )
  }
  if (emailRe.test(contact_info)) return <a href={'mailto:' + contact_info} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>{contact_info}</a>
  if (phoneRe.test((contact_info || '').replace(/^(dad:|mom:|coach:)/i, '').trim())) return <a href={'tel:' + contact_info.replace(/\D/g, '')} style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 600 }}>{contact_info}</a>
  return <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{contact_info}</span>
}

function ContactFields({ form, setForm }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>Contact Info <RequiredMark /></label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['email', '📧 Email'], ['phone', '📞 Phone'], ['both', '📧 + 📞 Both']].map(([val, label]) => (
          <button key={val} type="button" onClick={() => setForm((f) => ({ ...f, contact_type: val }))} style={{
            padding: '7px 14px', borderRadius: 8, border: '2px solid', cursor: 'pointer',
            borderColor: form.contact_type === val ? 'var(--navy)' : 'var(--lgray)',
            background: form.contact_type === val ? 'var(--navy)' : 'white',
            color: form.contact_type === val ? 'white' : 'var(--navy)',
            fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-body)',
          }}>{label}</button>
        ))}
      </div>
      {(form.contact_type === 'email' || form.contact_type === 'both') && (
        <input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} placeholder="your@email.com" style={{ ...inputStyle, marginBottom: form.contact_type === 'both' ? 8 : 0 }} />
      )}
      {(form.contact_type === 'phone' || form.contact_type === 'both') && (
        <input type="tel" value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} placeholder="678-555-0100" style={inputStyle} />
      )}
      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6 }}>Visible publicly. Listings expire after 4 days.</div>
    </div>
  )
}

function AuthModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email.trim()) { setError('Please enter your email.'); return }
    setSending(true)
    const redirectUrl = typeof window !== 'undefined' ? window.location.href : undefined
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectUrl } })
    setSending(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, padding: '32px', width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>We sent a sign-in link to <strong>{email}</strong>.</div>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>Sign in to post or edit</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.5 }}>Enter your email and we&apos;ll send you a magic link — no password needed.</div>
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} style={{ ...inputStyle, marginBottom: 12, fontSize: 15 }} autoFocus />
            {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button type="button" onClick={handleSend} disabled={sending} style={{ width: '100%', padding: '12px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-head)', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending…' : 'Send Sign-in Link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 14, padding: '28px', width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.25)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>Delete this listing?</div>
        <div style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>This can&apos;t be undone.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '11px', background: 'white', color: 'var(--navy)', border: '2px solid var(--lgray)', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={onConfirm} style={{ flex: 1, padding: '11px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

export default function PlayerBoard() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sportFilter, setSportFilter] = useState('Both')
  const [stateFilter, setStateFilter] = useState('')
  const [nearbyZip, setNearbyZip] = useState('')
  const [nearbyMiles, setNearbyMiles] = useState('25')
  const [searchGeo, setSearchGeo] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showMap, setShowMap] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitMode, setSubmitMode] = useState('create')
  const [validationError, setValidationError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setUser(session?.user ?? null) })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('player_board').select('*').eq('active', true)
        .gt('expires_at', new Date().toISOString()).in('approval_status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
      if (!error && data) setPosts(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let ignore = false
    async function locate() {
      if (!nearbyZip || nearbyZip.length !== 5) {
        setSearchGeo(null)
        return
      }
      const geo = await geocodeZip(nearbyZip)
      if (!ignore) setSearchGeo(geo || null)
    }
    locate()
    return () => { ignore = true }
  }, [nearbyZip])

  const filtered = posts.filter((p) => {
    if (!stateFilter) return false
    if (filter !== 'all' && p.post_type !== filter) return false
    if (sportFilter !== 'Both' && p.sport !== sportFilter) return false
    if (String(p.state || '').toUpperCase() !== stateFilter) return false
    if (searchGeo && p.lat != null && p.lng != null) {
      const distance = milesBetween(searchGeo.lat, searchGeo.lng, p.lat, p.lng)
      const cap = parseInt(nearbyMiles, 10) || 25
      if (distance > cap) {
        if (p.post_type === 'player_available') {
          const travelCap = extractTravelMiles(p.additional_notes)
          if (travelCap == null || distance > travelCap) return false
        } else {
          return false
        }
      }
    }
    return true
  })

  const mappable = filtered.filter((p) => p.lat != null && p.lng != null)

  function togglePosition(pos, field) {
    setForm((f) => ({ ...f, [field]: f[field].includes(pos) ? f[field].filter((p) => p !== pos) : [...f[field], pos] }))
  }

  function handleZipGeocode(geo) {
    if (geo) setForm((f) => ({ ...f, lat: f.lat || geo.lat, lng: f.lng || geo.lng, city: f.city || geo.city, state: f.state || geo.state }))
  }

  function handleAddressGeocode(geo) {
    if (geo) setForm((f) => ({ ...f, lat: geo.lat, lng: geo.lng }))
  }

  function validate() {
    const contactInfo = buildContactInfo(form)
    if (!contactInfo) return 'Contact info is required.'
    if (form.post_type === 'player_needed') {
      if (!form.sport) return 'Sport is required.'
      if (!form.age_group) return 'Age group is required.'
      if (!form.position_needed.length) return 'Select at least one position needed.'
      if (!form.venue_name.trim()) return 'Game / tournament location is required.'
      if (!form.location_address.trim()) return 'Address is required.'
      if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
      if (!form.event_date) return 'Event date is required.'
    } else {
      if (!form.sport) return 'Sport is required.'
      if (!form.player_age.toString().trim()) return 'Player age is required.'
      if (!form.player_position.length) return 'Select at least one position.'
      if (!form.zip_code || form.zip_code.length !== 5) return 'Zip code is required.'
    }
    return ''
  }

  async function handleSubmit() {
    const err = validate(); if (err) { setValidationError(err); return }
    setValidationError(''); setSubmitting(true)
    const contactInfo = buildContactInfo(form)
    const travelNote = 'Willing to travel: ' + (form.distance_travel === 999 ? 'Anywhere' : 'up to ' + form.distance_travel + ' miles')
    const notesWithTravel = form.post_type === 'player_available' ? [travelNote, form.additional_notes].filter(Boolean).join('\n') : form.additional_notes || null
    const combinedLocation = buildLocationName(form.venue_name, form.location_address, form.field_number)
    const payload = {
      post_type: form.post_type, sport: form.sport, city: form.city, state: form.state || null,
      zip_code: form.zip_code || null, lat: form.lat || null, lng: form.lng || null,
      contact_info: contactInfo, additional_notes: notesWithTravel || null,
      active: true, approval_status: 'pending', source: 'website_form',
      last_confirmed_at: new Date().toISOString(), user_id: user?.id ?? null,
      ...(form.post_type === 'player_available'
        ? { player_age: form.player_age ? parseInt(form.player_age, 10) : null, age_group: form.age_group || null, player_position: form.player_position, player_description: form.player_description || null, bats: form.bats || null, throws: form.throws || null }
        : { team_name: form.team_name || null, age_group: form.age_group, position_needed: form.position_needed, location_name: combinedLocation, event_date: form.event_date }),
    }
    const { error } = await supabase.from('player_board').insert([payload])
    setSubmitting(false)
    if (!error) {
      setSubmitMode('create'); setSubmitted(true); setShowForm(false)
      setPosts((prev) => [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...prev])
      setForm(EMPTY_FORM)
    } else { setValidationError('Submission error: ' + (error.message || 'Please try again.')) }
  }

  function startEdit(post) {
    const contactParsed = parseContactInfo(post.contact_info)
    const parsedLocation = parseLocationName(post.location_name)
    setForm({ post_type: post.post_type, sport: post.sport, player_age: post.player_age || '', player_position: Array.isArray(post.player_position) ? post.player_position : [], player_description: post.player_description || '', team_name: post.team_name || '', age_group: post.age_group || '', position_needed: Array.isArray(post.position_needed) ? post.position_needed : [], city: post.city || '', state: post.state || '', venue_name: parsedLocation.venue_name, location_address: parsedLocation.location_address, field_number: parsedLocation.field_number, event_date: post.event_date ? post.event_date.split('T')[0] : '', additional_notes: post.additional_notes || '', distance_travel: 25, zip_code: post.zip_code || '', lat: post.lat || null, lng: post.lng || null, bats: post.bats || '', throws: post.throws || '', ...contactParsed })
    setEditingId(post.id); setShowForm(true); setSubmitted(false); setSubmitMode('edit'); setValidationError('')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSaveEdit() {
    const err = validate(); if (err) { setValidationError(err); return }
    setValidationError(''); setSubmitting(true)
    const contactInfo = buildContactInfo(form)
    const travelNote = 'Willing to travel: ' + (form.distance_travel === 999 ? 'Anywhere' : 'up to ' + form.distance_travel + ' miles')
    const notesWithTravel = form.post_type === 'player_available' ? [travelNote, form.additional_notes].filter(Boolean).join('\n') : form.additional_notes || null
    const combinedLocation = buildLocationName(form.venue_name, form.location_address, form.field_number)
    const updates = {
      post_type: form.post_type, sport: form.sport, city: form.city, state: form.state || null,
      zip_code: form.zip_code || null, lat: form.lat || null, lng: form.lng || null,
      contact_info: contactInfo, additional_notes: notesWithTravel || null,
      ...(form.post_type === 'player_available'
        ? { player_age: form.player_age ? parseInt(form.player_age, 10) : null, age_group: form.age_group || null, player_position: form.player_position, player_description: form.player_description || null, bats: form.bats || null, throws: form.throws || null, team_name: null, position_needed: null, location_name: null, event_date: null }
        : { team_name: form.team_name || null, age_group: form.age_group, position_needed: form.position_needed, location_name: combinedLocation, event_date: form.event_date, player_age: null, player_position: null, player_description: null }),
    }
    const { error } = await supabase.from('player_board').update(updates).eq('id', editingId)
    setSubmitting(false)
    if (!error) { setPosts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updates } : p))); setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setSubmitMode('edit'); setSubmitted(true) }
    else setValidationError('Save error: ' + (error.message || 'Please try again.'))
  }

  async function handleDelete(post) {
    const { error } = await supabase.from('player_board').update({ active: false }).eq('id', post.id)
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== post.id))
    setDeleteTarget(null)
  }

  function cancelForm() { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setValidationError('') }

  const filterSelectStyle = { padding: '8px 12px', borderRadius: 'var(--input-radius)', border: '1.5px solid var(--lgray)', background: 'var(--white)', fontSize: 13, color: 'var(--navy)', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer' }
  const positions = form.sport === 'softball' ? POSITIONS_SB : POSITIONS_BB
  const isEditing = editingId !== null
  const g2 = isMobile ? '1fr' : '1fr 1fr'

  return (
    <div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {deleteTarget && <DeleteConfirm onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: isMobile ? '12px 0 0' : '18px 0 0' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '290px minmax(0,1fr) 180px', gap: 18, alignItems: 'start' }}>
          <div style={{ padding: isMobile ? '0 12px' : 0 }}>
            <div style={{ background: 'white', borderRadius: 12, border: '2px solid var(--lgray)', padding: 14 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>{filtered.length} {filtered.length === 1 ? 'post' : 'posts'}{stateFilter ? ' in ' + stateFilter : ''}</div>
              <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>Pickup-needed and player-available posts, filtered by state first.</div>
            </div>

            <div style={{ marginTop: 12, background: 'white', borderRadius: 12, border: '2px solid var(--lgray)', padding: 14 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Post Type</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {[['all', 'All Posts'], ['player_available', 'Players Available'], ['player_needed', 'Player Needed']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setFilter(val)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: '2px solid ' + (filter === val ? 'var(--navy)' : 'var(--lgray)'), background: filter === val ? 'var(--navy)' : 'white', color: filter === val ? 'white' : 'var(--navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-head)' }}>{label}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Sport</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className={'pill-toggle ' + (sportFilter === 'baseball' ? 'active-baseball' : '')} onClick={() => setSportFilter((s) => (s === 'baseball' ? 'Both' : 'baseball'))}>⚾ Baseball</button>
                    <button type="button" className={'pill-toggle ' + (sportFilter === 'softball' ? 'active-softball' : '')} onClick={() => setSportFilter((s) => (s === 'softball' ? 'Both' : 'softball'))}>🥎 Softball</button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>State <RequiredMark /></label>
                  <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={selectStyle}>
                    <option value="">Select state first</option>
                    {US_STATES.filter(Boolean).map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <ZipFieldInline value={nearbyZip} onChange={setNearbyZip} onGeocode={() => {}} required={false} />
                </div>

                <div>
                  <label style={labelStyle}>Nearby</label>
                  <select value={nearbyMiles} onChange={(e) => setNearbyMiles(e.target.value)} style={selectStyle}>
                    <option value="25">Up to 25 miles</option>
                    <option value="50">Up to 50 miles</option>
                    <option value="75">Up to 75 miles</option>
                    <option value="100">Up to 100 miles</option>
                    <option value="250">Up to 250 miles</option>
                    <option value="999">Anywhere</option>
                  </select>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Use a ZIP to narrow results by distance.</div>
                </div>

                {isMobile && (
                  <button type="button" onClick={() => setShowMap((m) => !m)} style={{ padding: '10px 14px', borderRadius: 'var(--btn-radius)', border: '2px solid var(--navy)', background: showMap ? 'var(--navy)' : 'white', color: showMap ? 'white' : 'var(--navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-head)' }}>
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                )}

                <button type="button" onClick={() => { setFilter('all'); setSportFilter('Both'); setStateFilter(''); setNearbyZip(''); setNearbyMiles('25') }} style={{ padding: '10px 12px', borderRadius: 10, border: '2px solid var(--lgray)', background: 'white', color: 'var(--navy)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-head)' }}>Reset Filters</button>
              </div>
            </div>

            <button type="button" onClick={() => {
              if (!user) { setShowAuth(true); return }
              if (showForm && !isEditing) { cancelForm() }
              else { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setSubmitted(false); setSubmitMode('create') }
            }} style={{ marginTop: 12, width: '100%', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--btn-radius)', padding: '12px 18px', fontWeight: 700, fontFamily: 'var(--font-head)', fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {showForm && !isEditing ? '✕ Cancel' : '+ Add Listing'}
            </button>
          </div>

          <div>
            {(!isMobile || showMap) && (
              <div>
                <div style={{ height: 360, width: '100%', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--lgray)' }}>
                  <MapContainer center={[39.5, -98.35]} zoom={4} style={{ height: '100%', width: '100%' }}>
                    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <FitBounds posts={mappable} />
                    {mappable.map((post) => {
                      const color = post.post_type === 'player_available' ? PIN_COLORS.pickup : PIN_COLORS.needs_player
                      const cityState = [post.city, post.state].filter(Boolean).join(', ')
                      return (
                        <Marker key={post.id} position={[post.lat, post.lng]} icon={makeIcon(color)}>
                          <Popup>
                            <div style={{ fontFamily: 'var(--font-body)', minWidth: 160 }}>
                              <strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>{post.post_type === 'player_available' ? 'Player Available' : 'Player Needed'}</strong>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{post.location_name ? '📍 ' + post.location_name : cityState ? '📍 ' + cityState : ''}</div>
                              {post.age_group && <div style={{ fontSize: 12, marginTop: 2 }}>🎯 {post.age_group} · {post.sport}</div>}
                              {post.post_type === 'player_needed' && post.event_date && <div style={{ fontSize: 12, marginTop: 2 }}>📅 {formatDate(post.event_date)}</div>}
                            </div>
                          </Popup>
                        </Marker>
                      )
                    })}
                  </MapContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '10px 6px 0', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray)' }}>Map key</span>
                    {[{ color: PIN_COLORS.needs_player, label: 'Player Needed' }, { color: PIN_COLORS.pickup, label: 'Player Available' }].map((item) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: item.color, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                        <span style={{ fontSize: 11, color: 'var(--gray)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray)' }}>Browse pickup-needed and player-available posts by state and distance.</div>
                </div>
              </div>
            )}
          </div>

          {!isMobile && (
            <div style={{ display: 'grid', gap: 12 }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{ border: '1px dashed #d7c8a0', borderRadius: 14, padding: '20px 14px', background: '#F8F4EA', textAlign: 'center', color: '#8A5A00' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 10 }}>ADVERTISE HERE</div>
                  <div style={{ fontSize: 14, color: '#8f8573', lineHeight: 1.5 }}>Reach baseball & softball families</div>
                  <div style={{ marginTop: 16, color: '#C62828', fontWeight: 700 }}>Contact Us</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {submitted && (
        <div style={{ background: '#DCFCE7', borderBottom: '2px solid #16A34A', padding: '12px 24px', color: '#15803D', fontWeight: 600, fontSize: 14 }}>
          {submitMode === 'edit' ? '✅ Your listing has been updated!' : '✅ Your listing has been submitted! It will appear once reviewed and expires in 4 days.'}
        </div>
      )}

      {showForm && (
        <div style={{ margin: isMobile ? '16px 14px' : '24px auto', background: 'white', borderRadius: 12, border: isEditing ? '2px solid var(--gold)' : '2px solid var(--lgray)', padding: isMobile ? '18px 14px' : '24px', maxWidth: 760 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>{isEditing ? '✏️ Edit Your Listing' : 'Post a New Listing'}</div>
            {isEditing && <button type="button" onClick={cancelForm} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕</button>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[['player_needed', '⚾ Player Needed'], ['player_available', '🧢 Player Available']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setForm((f) => ({ ...f, post_type: val, player_age: '', player_position: [], player_description: '', team_name: '', age_group: '', position_needed: [], venue_name: '', location_address: '', field_number: '', event_date: '', distance_travel: 25, lat: null, lng: null, bats: '', throws: '' }))} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '2px solid', cursor: 'pointer', borderColor: form.post_type === val ? 'var(--navy)' : 'var(--lgray)', background: form.post_type === val ? 'var(--navy)' : 'white', color: form.post_type === val ? 'white' : 'var(--navy)', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-body)' }}>{label}</button>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Sport <RequiredMark /></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['baseball', 'softball'].map((s) => (
                <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, sport: s }))} style={{ padding: '8px 18px', borderRadius: 8, border: '2px solid', cursor: 'pointer', borderColor: form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'var(--lgray)', background: form.sport === s ? (s === 'softball' ? '#7C3AED' : '#1D4ED8') : 'white', color: form.sport === s ? 'white' : 'var(--navy)', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{s}</button>
              ))}
            </div>
          </div>

          {form.post_type === 'player_needed' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Age Group <RequiredMark /></label>
                  <select value={form.age_group} onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))} style={selectStyle}>
                    <option value="">Select</option>
                    {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Team Name</label>
                  <input value={form.team_name} onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))} placeholder="e.g. Cherokee Nationals" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Position(s) Needed <RequiredMark /></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {positions.map((pos) => (
                    <button key={pos} type="button" onClick={() => togglePosition(pos, 'position_needed')} style={{ padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer', borderColor: form.position_needed.includes(pos) ? 'var(--navy)' : 'var(--lgray)', background: form.position_needed.includes(pos) ? 'var(--navy)' : 'white', color: form.position_needed.includes(pos) ? 'white' : 'var(--navy)', fontSize: 12, textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{pos}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: '1px solid var(--lgray)' }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Game / Tournament Location <RequiredMark /></label>
                  <input value={form.venue_name} onChange={(e) => setForm((f) => ({ ...f, venue_name: e.target.value }))} placeholder="e.g. North Park or Wills Park" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.7fr 0.9fr', gap: 12, marginBottom: 12 }}>
                  <AddressGeoField value={form.location_address} onChange={(v) => setForm((f) => ({ ...f, location_address: v }))} onGeocode={handleAddressGeocode} city={form.city} zip={form.zip_code} />
                  <div>
                    <label style={labelStyle}>Field <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: '#999' }}>(optional)</span></label>
                    <input value={form.field_number} onChange={(e) => setForm((f) => ({ ...f, field_number: e.target.value }))} placeholder="e.g. Field 1 or TBD" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr 0.65fr', gap: 12 }}>
                  <div>
                    <ZipFieldInline value={form.zip_code} onChange={(v) => setForm((f) => ({ ...f, zip_code: v }))} onGeocode={handleZipGeocode} required />
                  </div>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Auto-filled from zip" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))} placeholder="GA" maxLength={2} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Event Date <RequiredMark /></label>
                  <input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Additional Notes</label>
                  <textarea value={form.additional_notes} onChange={(e) => setForm((f) => ({ ...f, additional_notes: e.target.value }))} rows={3} placeholder="Anything else families should know..." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </>
          )}

          {form.post_type === 'player_available' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Player Age <RequiredMark /></label>
                  <input type="number" min="6" max="99" value={form.player_age} onChange={(e) => setForm((f) => ({ ...f, player_age: e.target.value }))} placeholder="e.g. 12" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Age Group</label>
                  <select value={form.age_group} onChange={(e) => setForm((f) => ({ ...f, age_group: e.target.value }))} style={selectStyle}>
                    <option value="">Select</option>
                    {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Position(s) <RequiredMark /></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {positions.map((pos) => (
                    <button key={pos} type="button" onClick={() => togglePosition(pos, 'player_position')} style={{ padding: '5px 12px', borderRadius: 20, border: '2px solid', cursor: 'pointer', borderColor: form.player_position.includes(pos) ? 'var(--navy)' : 'var(--lgray)', background: form.player_position.includes(pos) ? 'var(--navy)' : 'white', color: form.player_position.includes(pos) ? 'white' : 'var(--navy)', fontSize: 12, textTransform: 'capitalize', fontFamily: 'var(--font-body)' }}>{pos}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Bats</label>
                  <select value={form.bats} onChange={(e) => setForm((f) => ({ ...f, bats: e.target.value }))} style={selectStyle}>
                    <option value="">Select</option>
                    {HAND_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Throws</label>
                  <select value={form.throws} onChange={(e) => setForm((f) => ({ ...f, throws: e.target.value }))} style={selectStyle}>
                    <option value="">Select</option>
                    {HAND_OPTIONS.filter((opt) => opt !== 'Switch').map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <ZipFieldInline value={form.zip_code} onChange={(v) => setForm((f) => ({ ...f, zip_code: v }))} onGeocode={handleZipGeocode} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 0.7fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Auto-filled from zip" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))} placeholder="GA" maxLength={2} style={inputStyle} />
                </div>
              </div>
              <DistanceSlider value={form.distance_travel} onChange={(v) => setForm((f) => ({ ...f, distance_travel: v }))} />
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Description</label>
                <textarea value={form.player_description} onChange={(e) => setForm((f) => ({ ...f, player_description: e.target.value }))} rows={3} placeholder="Skill level, what you're looking for in a team..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Additional Notes</label>
                <textarea value={form.additional_notes} onChange={(e) => setForm((f) => ({ ...f, additional_notes: e.target.value }))} rows={2} placeholder="Any other details..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </>
          )}

          <ContactFields form={form} setForm={setForm} />

          {validationError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #F87171', borderRadius: 8, padding: '10px 14px', margin: '12px 0', color: '#B91C1C', fontSize: 13 }}>{validationError}</div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={isEditing ? handleSaveEdit : handleSubmit} disabled={submitting} style={{ background: isEditing ? 'var(--gold)' : 'var(--red)', color: isEditing ? 'var(--navy)' : 'white', border: 'none', borderRadius: 8, padding: '12px 28px', fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', flex: isMobile ? 1 : 'none' }}>
              {submitting ? 'Saving…' : isEditing ? '💾 Save Changes' : 'Submit Listing'}
            </button>
            {isEditing && <button type="button" onClick={cancelForm} style={{ background: 'white', color: 'var(--navy)', border: '2px solid var(--lgray)', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: isMobile ? '16px 12px 24px' : '12px 0 24px' }}>
        {!stateFilter && !showForm && (
          <div style={{ background: 'white', borderRadius: 12, border: '2px solid var(--lgray)', padding: '18px', marginBottom: 14, maxWidth: isMobile ? '100%' : 900, marginLeft: isMobile ? 0 : 308 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--navy)' }}>Select a state to view posts</div>
            <div style={{ fontSize: 14, color: 'var(--gray)', marginTop: 6 }}>Start with a state, then narrow by ZIP and distance. That keeps the national board useful instead of dumping every post at once.</div>
          </div>
        )}
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '290px minmax(0,1fr) 180px', gap: 18, alignItems: 'start' }}>
          {!isMobile && <div />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map((post) => {
          const isPlayer = post.post_type === 'player_available'
          const postPositions = isPlayer ? (Array.isArray(post.player_position) ? post.player_position : []) : (Array.isArray(post.position_needed) ? post.position_needed : [])
          const isOwner = user && post.user_id && post.user_id === user.id
          return (
            <div key={post.id} style={{ background: 'white', borderRadius: 12, border: isOwner ? '2px solid var(--gold)' : '2px solid ' + (isPlayer ? '#DBEAFE' : '#FEF3C7'), padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'relative' }}>
              {isOwner && <div style={{ position: 'absolute', top: -1, right: 12, background: 'var(--gold)', color: 'var(--navy)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '0 0 6px 6px', fontFamily: 'var(--font-head)', letterSpacing: '0.04em' }}>YOUR POST</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ background: isPlayer ? '#1D4ED8' : '#D97706', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isPlayer ? '🧢 Player Available' : '⚾ Player Needed'}</span>
                <span style={{ background: post.sport === 'softball' ? '#7C3AED' : '#0B1F3A', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, fontFamily: 'var(--font-head)', textTransform: 'uppercase' }}>{post.sport}</span>
              </div>
              {isPlayer ? (
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700 }}>{post.player_age ? 'Age ' + post.player_age : post.age_group || 'Player'} — {post.city}</div>
                  {(post.bats || post.throws) && <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4 }}>{[post.bats ? 'Bats ' + post.bats : '', post.throws ? 'Throws ' + post.throws : ''].filter(Boolean).join(' · ')}</div>}
                  {post.player_description && <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 6, lineHeight: 1.5 }}>{post.player_description}</div>}
                  {post.additional_notes && (
                    <div style={{ marginTop: 4 }}>
                      {post.additional_notes.split('\n').map((line, i) => (
                        <div key={i} style={{ fontSize: 13, lineHeight: 1.5, color: line.startsWith('Willing to travel') ? '#2563EB' : 'var(--gray)', fontWeight: line.startsWith('Willing to travel') ? 600 : 400 }}>
                          {line.startsWith('Willing to travel') ? '🚗 ' : ''}{line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700 }}>{(post.team_name || 'Team') + (post.age_group ? ' · ' + post.age_group : '')}</div>
                  {post.location_name && <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>📍 {post.location_name}</div>}
                  {post.city && !post.location_name && <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>📍 {post.city}</div>}
                  {post.event_date && <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>📅 {formatDate(post.event_date)}</div>}
                  {post.additional_notes && <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 6, lineHeight: 1.5 }}>{post.additional_notes}</div>}
                </div>
              )}
              {postPositions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                  {postPositions.map((pos) => <span key={pos} style={{ background: 'var(--lgray)', color: 'var(--navy)', fontSize: 11, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{pos}</span>)}
                </div>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--lgray)', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: 'var(--navy)' }}>📬 </span>
                <ContactDisplay contact_info={post.contact_info} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 6 }}>Posted {formatDate(post.created_at)}</div>
              {isOwner && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--lgray)' }}>
                  <button type="button" onClick={() => startEdit(post)} style={{ flex: 1, padding: '7px', background: 'var(--navy)', color: 'white', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-head)' }}>✏️ Edit</button>
                  <button type="button" onClick={() => setDeleteTarget(post)} style={{ flex: 1, padding: '7px', background: 'white', color: '#DC2626', border: '2px solid #FCA5A5', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-head)' }}>🗑️ Delete</button>
                </div>
              )}
            </div>
          )
        })}
          </div>
          {!isMobile && <div />}
        </div>
      </div>

      {filtered.length === 0 && !showForm && stateFilter && (
        <div className="empty-state">
          <h3>No listings yet</h3>
          <p>Be the first to post — teams looking for players, or players looking for teams.</p>
        </div>
      )}
    </div>
  )
}
