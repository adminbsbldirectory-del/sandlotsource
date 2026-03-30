import { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

const AGE_GROUPS = ['6U','7U','8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','College','Adult']

function parseFirstPhone(raw) {
  if (!raw) return null
  return raw.split(/[\/,]/)[0].trim() || null
}

function RatingDisplay({ coach }) {
  const avg   = parseFloat(coach.rating_average) || 0
  const count = parseInt(coach.review_count) || 0
  const icon  = coach.sport === 'softball' ? '🥎' : '⚾'
  if (count === 0) return null
  const full  = Math.floor(avg)
  const half  = (avg - full) >= 0.3
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <span style={{ fontSize:22, letterSpacing:2 }}>
        {icon.repeat(Math.max(0,full))}{half ? '◐' : ''}{empty > 0 ? '○'.repeat(Math.max(0,empty)) : ''}
      </span>
      <span style={{ fontSize:22, fontWeight:800, color:'var(--navy)' }}>{avg.toFixed(1)}</span>
      <span style={{ fontSize:14, color:'#666' }}>({count} review{count !== 1 ? 's' : ''})</span>
    </div>
  )
}

function StarPicker({ value, onChange, sport }) {
  const icon = sport === 'softball' ? '🥎' : '⚾'
  return (
    <div style={{ display:'flex', gap:6, fontSize:28, cursor:'pointer' }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          onClick={() => onChange(n)}
          title={n + ' star' + (n !== 1 ? 's' : '')}
          style={{ opacity: n <= value ? 1 : 0.25, transition:'opacity 0.1s', userSelect:'none' }}
        >
          {icon}
        </span>
      ))}
    </div>
  )
}

export default function CoachProfile({ coach, onClose, onClaim }) {
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    rating: 0,
    review_text: '',
    reviewer_name: '',
    player_age_group: '',
    email: '',
  })
  const [errors, setErrors] = useState({})

  const firstPhone = parseFirstPhone(coach.phone)
  const specs = Array.isArray(coach.specialty)
    ? coach.specialty
    : (coach.specialty || '').split('|').filter(Boolean)

  const locationLine = coach.address
    ? null
    : [coach.city, coach.state].filter(Boolean).join(', ') + (coach.zip ? ' ' + coach.zip : '')

  const facilityHref = coach.facility_id ? `/facilities/${coach.facility_id}` : null
  const facilityWebsite = coach.facility_website || coach.facility_url || null

  const mapsQuery = coach.address
    ? encodeURIComponent(coach.address)
    : encodeURIComponent([coach.city, coach.state, coach.zip].filter(Boolean).join(', '))

  useEffect(() => {
    async function loadReviews() {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('coach_id', coach.id)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })

      if (!error && data) setReviews(data)
      setLoadingReviews(false)
    }

    loadReviews()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [coach.id])

  function validate() {
    const e = {}
    if (!form.rating) e.rating = 'Please select a rating.'
    if (!form.review_text.trim()) e.review_text = 'Please write a short review.'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setSubmitting(true)

    const payload = {
      coach_id: coach.id,
      rating: form.rating,
      review_text: form.review_text.trim(),
      reviewer_name: form.reviewer_name.trim() || null,
      player_age_group: form.player_age_group || null,
      email: form.email.trim() || null,
      moderation_status: 'pending',
    }

    const reviewId = crypto.randomUUID()

    const reviewRecord = {
      id: reviewId,
      ...payload,
    }

    const { error } = await supabase
      .from('reviews')
      .insert(reviewRecord)

    if (!error) {
      try {
        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'reviews',
            record: {
              ...reviewRecord,
              coach_name: coach.name,
              coach_sport: coach.sport,
            },
          }),
        })
      } catch (notifyError) {
        console.error('review notify error:', notifyError)
      }
    }

    setSubmitting(false)

    if (!error) {
      setSubmitted(true)
      setShowForm(false)
      setErrors({})
    } else {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    }
  }

  const inputStyle = {
    width:'100%',
    padding:'9px 12px',
    borderRadius:8,
    border:'2px solid var(--lgray)',
    fontSize:14,
    fontFamily:'var(--font-body)',
    outline:'none',
    boxSizing:'border-box',
  }

  const labelStyle = {
    fontSize:12,
    fontWeight:700,
    textTransform:'uppercase',
    letterSpacing:'0.06em',
    color:'var(--navy)',
    display:'block',
    marginBottom:5,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed',
        inset:0,
        zIndex:2000,
        background:'rgba(0,0,0,0.55)',
        display:'flex',
        alignItems:'flex-start',
        justifyContent:'center',
        overflowY:'auto',
        padding:'16px 10px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--white)',
          borderRadius:14,
          width:'100%',
          boxShadow:'0 8px 40px rgba(0,0,0,0.25)',
          overflow:'hidden',
          maxWidth:'640px',
        }}
      >
        <div style={{ background:'var(--navy)', padding:'18px 18px 16px', position:'relative' }}>
          <button
            onClick={onClose}
            style={{
              position:'absolute',
              top:14,
              right:16,
              background:'rgba(255,255,255,0.15)',
              border:'none',
              color:'white',
              borderRadius:20,
              width:30,
              height:30,
              cursor:'pointer',
              fontSize:16,
              fontWeight:700,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
            }}
          >
            ✕
          </button>

          <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color:'white' }}>
            {coach.name}
          </div>

          {coach.facility_name && (
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:14, marginTop:2 }}>
              {coach.facility_name}
            </div>
          )}

          <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap', rowGap:6 }}>
            <span style={{ background:'rgba(255,255,255,0.15)', color:'white', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, textTransform:'capitalize' }}>
              {coach.sport === 'both' ? 'Baseball & Softball' : coach.sport}
            </span>

            {specs.map(s => (
              <span
                key={s}
                style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.85)', fontSize:10, padding:'3px 8px', borderRadius:20, textTransform:'capitalize' }}
              >
                {s}
              </span>
            ))}

            {coach.verified_status && (
              <span style={{ background:'#DBEAFE', color:'#1D4ED8', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, fontFamily:'var(--font-head)' }}>
                ✓ Verified
              </span>
            )}

            {coach.featured_status && (
              <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:20, fontFamily:'var(--font-head)' }}>
                ⭐ Featured
              </span>
            )}
          </div>
        </div>

        <div style={{ padding:'18px', overflowX:'hidden' }}>
          {(parseInt(coach.review_count) || 0) > 0 && (
            <div style={{ marginBottom:20, paddingBottom:20, borderBottom:'2px solid var(--lgray)' }}>
              <RatingDisplay coach={coach} />
            </div>
          )}

          <div style={{ marginBottom:20 }}>
            {coach.address ? (
              <a
                href={'https://maps.google.com/?q=' + mapsQuery}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color:'var(--navy)', textDecoration:'none', fontSize:14, display:'block', marginBottom:6 }}
              >
                📍 {coach.address} <span style={{ fontSize:12, color:'var(--red)', fontWeight:600 }}>→ Map</span>
              </a>
            ) : locationLine ? (
              <div style={{ fontSize:14, color:'var(--navy)', marginBottom:6 }}>
                📍 {locationLine}
              </div>
            ) : null}

            {coach.credentials && (
              <div style={{ fontSize:14, color:'#555', lineHeight:1.5, marginBottom:8 }}>
                🏅 {coach.credentials}
              </div>
            )}

            {(coach.price_per_session || coach.price_notes) && (
              <div style={{ fontSize:14, fontWeight:600, color:'var(--green)', marginBottom:8 }}>
                {'💰 ' + (coach.price_per_session ? '$' + coach.price_per_session + '/session' : coach.price_notes)}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:8 }}>
              {coach.email && (
                <a
                  href={'mailto:' + coach.email}
                  style={{ color:'#1D4ED8', textDecoration:'none', fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6, padding:'8px 10px', background:'#F8FAFC', borderRadius:999, width:'fit-content' }}
                >
                  📧 {coach.email}
                </a>
              )}

              {firstPhone && (
                <a
                  href={'tel:' + firstPhone.replace(/\D/g,'')}
                  style={{ color:'var(--navy)', textDecoration:'none', fontSize:14, fontWeight:600 }}
                >
                  📞 {firstPhone}
                </a>
              )}

              {coach.website && (
                <a
                  href={coach.website.startsWith('http') ? coach.website : 'https://' + coach.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color:'#1D4ED8', textDecoration:'none', fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6, padding:'8px 10px', background:'#F8FAFC', borderRadius:999, width:'fit-content' }}
                >
                  🌐 {coach.website}
                </a>
              )}
            </div>

            {(coach.facility_name || facilityHref || facilityWebsite) && (
              <div
                style={{
                  marginTop:16,
                  paddingTop:16,
                  borderTop:'2px solid var(--lgray)',
                  display:'flex',
                  flexDirection:'column',
                  gap:6,
                }}
              >
                <div
                  style={{
                    fontSize:11,
                    fontWeight:700,
                    textTransform:'uppercase',
                    letterSpacing:'0.08em',
                    color:'#6b7280',
                  }}
                >
                  Facility
                </div>

                {coach.facility_name && (
                  facilityHref ? (
                    <a
                      href={facilityHref}
                      style={{ color:'#1D4ED8', textDecoration:'none', fontSize:14, fontWeight:700, display:'inline-flex', alignItems:'center', gap:6, padding:'8px 10px', background:'#EFF6FF', borderRadius:999, width:'fit-content' }}
                    >
                      📍 {coach.facility_name}
                    </a>
                  ) : (
                    <div style={{ color:'var(--navy)', fontSize:14, fontWeight:700 }}>
                      📍 {coach.facility_name}
                    </div>
                  )
                )}

                {facilityHref && (
                  <a
                    href={facilityHref}
                    style={{ color:'#1D4ED8', textDecoration:'none', fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6, padding:'8px 10px', background:'#F8FAFC', borderRadius:999, width:'fit-content' }}
                  >
                    View facility page
                  </a>
                )}

                {facilityWebsite && (
                  <a
                    href={facilityWebsite.startsWith('http') ? facilityWebsite : 'https://' + facilityWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color:'#1D4ED8', textDecoration:'none', fontSize:14, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6, padding:'8px 10px', background:'#F8FAFC', borderRadius:999, width:'fit-content' }}
                  >
                    Facility website
                  </a>
                )}
              </div>
            )}
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--navy)', marginBottom:14 }}>
              Reviews
            </div>

            {loadingReviews && (
              <div style={{ color:'var(--gray)', fontSize:14 }}>Loading reviews…</div>
            )}

            {!loadingReviews && reviews.length === 0 && !submitted && (
              <div style={{ background:'var(--cream)', borderRadius:10, padding:'20px', textAlign:'center', color:'#888', fontSize:14, marginBottom:14 }}>
                No reviews yet. Know this coach? Leave the first one!
              </div>
            )}

            {reviews.map(r => {
              const icon = coach.sport === 'softball' ? '🥎' : '⚾'
              return (
                <div key={r.id} style={{ background:'var(--cream)', borderRadius:10, padding:'14px 16px', marginBottom:10, borderLeft:'4px solid var(--navy)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <span style={{ fontSize:16, letterSpacing:2 }}>
                        {icon.repeat(r.rating)}{'○'.repeat(5 - r.rating)}
                      </span>
                      {r.reviewer_name && (
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--navy)', marginLeft:8 }}>{r.reviewer_name}</span>
                      )}
                      {r.player_age_group && (
                        <span style={{ fontSize:11, color:'#888', marginLeft:6 }}>· {r.player_age_group}</span>
                      )}
                    </div>
                    <span style={{ fontSize:11, color:'#aaa' }}>
                      {new Date(r.created_at).toLocaleDateString('en-US', { month:'short', year:'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontSize:14, color:'#444', lineHeight:1.5 }}>{r.review_text}</div>
                </div>
              )
            })}
          </div>

          {submitted ? (
            <div style={{ background:'#ecfdf5', border:'2px solid #16A34A', borderRadius:10, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:20, marginBottom:6 }}>✅</div>
              <div style={{ fontWeight:700, color:'#15803d', fontSize:15 }}>Thanks for your review!</div>
              <div style={{ color:'#555', fontSize:13, marginTop:4 }}>It will appear here after a quick review by our team.</div>
            </div>
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width:'100%',
                padding:'12px',
                background:'var(--red)',
                color:'white',
                border:'none',
                borderRadius:8,
                fontSize:15,
                fontWeight:700,
                cursor:'pointer',
                fontFamily:'var(--font-head)',
              }}
            >
              ⭐ Leave a Review
            </button>
          ) : (
            <div style={{ background:'var(--cream)', borderRadius:12, padding:'20px' }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, color:'var(--navy)', marginBottom:16 }}>
                Leave a Review
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Your Rating <span style={{ color:'var(--red)' }}>*</span></label>
                <StarPicker value={form.rating} onChange={v => setForm(f => ({...f, rating:v}))} sport={coach.sport} />
                {errors.rating && <div style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>{errors.rating}</div>}
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={labelStyle}>Your Review <span style={{ color:'var(--red)' }}>*</span></label>
                <textarea
                  value={form.review_text}
                  onChange={e => setForm(f => ({...f, review_text:e.target.value}))}
                  rows={4}
                  placeholder="Share your experience — what did your player work on, what improved, would you recommend this coach?"
                  style={{ ...inputStyle, resize:'vertical' }}
                />
                {errors.review_text && <div style={{ color:'var(--red)', fontSize:12, marginTop:4 }}>{errors.review_text}</div>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginBottom:14 }}>
                <div>
                  <label style={labelStyle}>Your Name <span style={{ opacity:0.5 }}>(optional)</span></label>
                  <input
                    value={form.reviewer_name}
                    onChange={e => setForm(f => ({...f, reviewer_name:e.target.value}))}
                    placeholder="e.g. Baseball Dad"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Player Age Group <span style={{ opacity:0.5 }}>(optional)</span></label>
                  <select
                    value={form.player_age_group}
                    onChange={e => setForm(f => ({...f, player_age_group:e.target.value}))}
                    style={inputStyle}
                  >
                    <option value="">Select</option>
                    {AGE_GROUPS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom:18 }}>
                <label style={labelStyle}>Email <span style={{ opacity:0.5 }}>(optional, not published)</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({...f, email:e.target.value}))}
                  placeholder="For verification if needed"
                  style={inputStyle}
                />
              </div>

              {errors.submit && (
                <div style={{ color:'var(--red)', fontSize:13, marginBottom:12 }}>{errors.submit}</div>
              )}

              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex:1,
                    padding:'11px',
                    background: submitting ? '#aaa' : 'var(--navy)',
                    color:'white',
                    border:'none',
                    borderRadius:8,
                    fontSize:14,
                    fontWeight:700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily:'var(--font-head)',
                  }}
                >
                  {submitting ? 'Submitting…' : 'Submit Review'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setErrors({}) }}
                  style={{
                    padding:'11px 16px',
                    background:'white',
                    color:'var(--navy)',
                    border:'2px solid var(--lgray)',
                    borderRadius:8,
                    fontSize:14,
                    fontWeight:700,
                    cursor:'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>

              <div style={{ fontSize:11, color:'#999', marginTop:10, textAlign:'center' }}>
                Reviews are moderated before publishing. Thank you for keeping this community helpful.
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '2px solid var(--lgray)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
              Is this your coaching listing? Claim it to request contact, bio, facility, and profile updates.
            </div>

            <button
              type="button"
              onClick={() => {
                onClose()
                if (onClaim) onClaim(coach)
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
              }}
            >
              ✏️ Claim or Update This Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}