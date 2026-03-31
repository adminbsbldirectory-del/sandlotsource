import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase.js'

const LISTING_TYPE_OPTIONS = [
  { value: 'coach', label: 'Coach / Trainer' },
  { value: 'team', label: 'Travel Team' },
  { value: 'facility', label: 'Facility' },
]

const CLAIM_CHANGE = 'Claim this listing'

const UPDATE_CHANGE_OPTIONS = [
  'Correct listing info',
  'Update contact info',
  'Update tryout status',
  'Update availability',
  'Mark inactive',
  'Remove listing',
]

const ALL_CHANGE_OPTIONS = [CLAIM_CHANGE, ...UPDATE_CHANGE_OPTIONS]

const RELATIONSHIP_OPTIONS = [
  'I am the coach / trainer',
  'I am the team admin / manager',
  'I am the facility owner / manager',
  'I am a parent or representative',
  'Other',
]

const MAX = {
  listing_name: 80,
  city: 50,
  requester_name: 80,
  requester_phone: 25,
  corrected_contact_info: 250,
  website_social_updates: 200,
  tryout_updates: 250,
  availability_updates: 250,
  notes: 300,
}

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '2px solid var(--lgray)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
}

function normalizeListingType(value) {
  const raw = String(value || '').trim().toLowerCase()

  if (!raw) return ''
  if (raw === 'coach') return 'coach'
  if (raw === 'team') return 'team'
  if (raw === 'facility') return 'facility'
  if (raw === 'coach / trainer' || raw === 'coach/trainer') return 'coach'
  if (raw === 'travel team') return 'team'

  return ''
}

function getListingTypeLabel(value) {
  return LISTING_TYPE_OPTIONS.find((item) => item.value === value)?.label || ''
}

function normalizeRequestKind(value) {
  return String(value || '').trim().toLowerCase() === 'update' ? 'update' : 'claim'
}

function normalizeRequestedChange(value) {
  const raw = String(value || '').trim().toLowerCase()
  return ALL_CHANGE_OPTIONS.find((option) => option.toLowerCase() === raw) || ''
}

function getInitialRequestMode({ requestKind, requestedChange, hasPrefill }) {
  const normalizedKind = normalizeRequestKind(requestKind)
  const normalizedChange = normalizeRequestedChange(requestedChange)

  if (normalizedKind === 'update') return 'update'
  if (normalizedChange && normalizedChange !== CLAIM_CHANGE) return 'update'
  if (normalizedChange === CLAIM_CHANGE) return 'claim'
  if (normalizedKind === 'claim') return 'claim'
  if (hasPrefill) return 'claim'

  return 'claim'
}

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

function Count({ value, max }) {
  return (
    <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
      {(value || '').length} / {max}
    </div>
  )
}

export default function ClaimListing() {
  const [searchParams] = useSearchParams()
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [requestMode, setRequestMode] = useState('claim')
  const [form, setForm] = useState({
    listing_id: '',
    listing_type: '',
    listing_name: '',
    city: '',
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    relationship_to_listing: '',
    requested_change: CLAIM_CHANGE,
    corrected_contact_info: '',
    website_social_updates: '',
    tryout_updates: '',
    availability_updates: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [validationError, setValidationError] = useState('')

  const hasPrefill =
    !!searchParams.get('listingId') ||
    !!searchParams.get('listing_id') ||
    !!searchParams.get('listingType') ||
    !!searchParams.get('listing_type') ||
    !!searchParams.get('listingName') ||
    !!searchParams.get('listing_name') ||
    !!searchParams.get('city')

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const listingId = searchParams.get('listingId') || searchParams.get('listing_id') || ''
    const listingTypeRaw = searchParams.get('listingType') || searchParams.get('listing_type') || ''
    const listingType = normalizeListingType(listingTypeRaw)
    const listingName = searchParams.get('listingName') || searchParams.get('listing_name') || ''
    const city = searchParams.get('city') || ''

    const requestKindRaw = searchParams.get('requestKind') || searchParams.get('request_kind') || 'claim'
    const requestedChangeRaw =
      searchParams.get('requestedChange') ||
      searchParams.get('requested_change') ||
      (listingType || listingName || city ? CLAIM_CHANGE : '')

    const nextMode = getInitialRequestMode({
      requestKind: requestKindRaw,
      requestedChange: requestedChangeRaw,
      hasPrefill: !!(listingId || listingType || listingName || city),
    })

    const normalizedRequestedChange = normalizeRequestedChange(requestedChangeRaw)

    setRequestMode(nextMode)
    setForm((f) => ({
      ...f,
      listing_id: listingId || f.listing_id,
      listing_type: listingType || f.listing_type,
      listing_name: listingName || f.listing_name,
      city: city || f.city,
      requested_change:
        nextMode === 'claim'
          ? CLAIM_CHANGE
          : UPDATE_CHANGE_OPTIONS.includes(normalizedRequestedChange)
            ? normalizedRequestedChange
            : '',
      corrected_contact_info: nextMode === 'claim' ? '' : f.corrected_contact_info,
      website_social_updates: nextMode === 'claim' ? '' : f.website_social_updates,
      tryout_updates: nextMode === 'claim' ? '' : f.tryout_updates,
      availability_updates: nextMode === 'claim' ? '' : f.availability_updates,
    }))
  }, [searchParams])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleRequestModeChange(nextMode) {
    setRequestMode(nextMode)
    setValidationError('')

    setForm((f) => ({
      ...f,
      requested_change: nextMode === 'claim' ? CLAIM_CHANGE : '',
      corrected_contact_info: '',
      website_social_updates: '',
      tryout_updates: '',
      availability_updates: '',
    }))
  }

  function validate() {
    if (!form.listing_type) return 'Please select a listing type.'
    if (!form.listing_name.trim()) return 'Listing name is required.'
    if (!form.city.trim()) return 'City is required.'
    if (!form.requester_name.trim()) return 'Your name is required.'
    if (!form.requester_email.trim()) return 'Your email is required.'
    if (!form.relationship_to_listing) return 'Please select your relationship to this listing.'

    if (requestMode === 'update') {
      if (!form.requested_change) return 'Please select the type of update you are requesting.'
      if (!UPDATE_CHANGE_OPTIONS.includes(form.requested_change)) {
        return 'Please select a valid update request.'
      }
    }

    return ''
  }

  async function handleSubmit() {
    const err = validate()
    if (err) {
      setValidationError(err)
      return
    }

    setValidationError('')
    setSubmitting(true)

    const requestKind = requestMode === 'update' ? 'update' : 'claim'
    const requestedChange = requestMode === 'claim' ? CLAIM_CHANGE : form.requested_change

    const payload = {
      listing_id: form.listing_id || null,
      listing_type: form.listing_type,
      request_kind: requestKind,
      listing_name: form.listing_name.trim(),
      city: form.city.trim(),
      requester_name: form.requester_name.trim(),
      requester_email: form.requester_email.trim(),
      requester_phone: form.requester_phone.trim() || null,
      relationship_to_listing: form.relationship_to_listing,
      requested_change: requestedChange,
      corrected_contact_info: requestKind === 'update' ? form.corrected_contact_info.trim() || null : null,
      website_social_updates: requestKind === 'update' ? form.website_social_updates.trim() || null : null,
      tryout_updates:
        requestKind === 'update' && requestedChange === 'Update tryout status'
          ? form.tryout_updates.trim() || null
          : null,
      availability_updates:
        requestKind === 'update' && requestedChange === 'Update availability'
          ? form.availability_updates.trim() || null
          : null,
      notes: form.notes.trim() || null,
      status: 'new',
      submitted_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('claim_requests').insert(payload)
    setSubmitting(false)

    if (!error) {
      setSubmitted(true)
    } else {
      console.error('claim_requests insert error:', error)
      setValidationError('Something went wrong. Please email admin@sandlotsource.com directly.')
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: '48px auto',
          padding: '32px 24px',
          background: 'white',
          borderRadius: 12,
          border: '2px solid #86EFAC',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: isMobile ? 20 : 22,
            fontWeight: 700,
            color: 'var(--navy)',
            marginBottom: 10,
          }}
        >
          Request Received
        </div>
        <div style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.6 }}>
          We&apos;ll review your {requestMode === 'claim' ? 'claim' : 'update request'} and follow up at{' '}
          <strong>{form.requester_email}</strong> within a few business days.
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '32px auto', padding: isMobile ? '0 12px 96px' : '0 16px' }}>
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          border: '2px solid var(--lgray)',
          padding: isMobile ? '22px 16px' : '28px 24px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: isMobile ? 20 : 22,
            fontWeight: 700,
            color: 'var(--navy)',
            marginBottom: 6,
          }}
        >
          Claim or Update a Listing
        </div>

        <div style={{ fontSize: isMobile ? 14 : 13, color: 'var(--gray)', marginBottom: 24, lineHeight: 1.5 }}>
          Use this form to either claim ownership of a listing or request an update.
          We review all requests manually and will contact you to verify.
        </div>

        {hasPrefill && (
          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 10,
              padding: '10px 12px',
              marginBottom: 16,
              fontSize: 13,
              color: '#1D4ED8',
            }}
          >
            We prefilled this request from the listing you selected. Please review and complete the remaining fields.
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Request Type <RequiredMark /></label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={() => handleRequestModeChange('claim')}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: requestMode === 'claim' ? '2px solid var(--navy)' : '2px solid var(--lgray)',
                background: requestMode === 'claim' ? '#EFF6FF' : 'white',
                color: 'var(--navy)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Claim this listing
            </button>

            <button
              type="button"
              onClick={() => handleRequestModeChange('update')}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: requestMode === 'update' ? '2px solid var(--navy)' : '2px solid var(--lgray)',
                background: requestMode === 'update' ? '#EFF6FF' : 'white',
                color: 'var(--navy)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Request an update
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Listing Type <RequiredMark /></label>
          <select
            value={form.listing_type}
            onChange={(e) => set('listing_type', e.target.value)}
            style={inputStyle}
          >
            <option value="">Select…</option>
            {LISTING_TYPE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <label style={labelStyle}>Listing Name <RequiredMark /></label>
            <input
              value={form.listing_name}
              onChange={(e) => set('listing_name', e.target.value)}
              placeholder="Name as it appears on the site"
              style={inputStyle}
              maxLength={MAX.listing_name}
            />
            <Count value={form.listing_name} max={MAX.listing_name} />
          </div>

          <div>
            <label style={labelStyle}>City <RequiredMark /></label>
            <input
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Alpharetta"
              style={inputStyle}
              maxLength={MAX.city}
            />
            <Count value={form.city} max={MAX.city} />
          </div>
        </div>

        {form.listing_id && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 12px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 12,
              color: '#475569',
            }}
          >
            Linked listing: <strong>{getListingTypeLabel(form.listing_type) || 'Listing'}</strong> · ID {form.listing_id}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--lgray)', marginBottom: 14, paddingTop: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--navy)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 12,
            }}
          >
            Your Information
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Your Name <RequiredMark /></label>
              <input
                value={form.requester_name}
                onChange={(e) => set('requester_name', e.target.value)}
                placeholder="Full name"
                style={inputStyle}
                maxLength={MAX.requester_name}
              />
              <Count value={form.requester_name} max={MAX.requester_name} />
            </div>

            <div>
              <label style={labelStyle}>Your Email <RequiredMark /></label>
              <input
                type="email"
                value={form.requester_email}
                onChange={(e) => set('requester_email', e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Phone (optional)</label>
            <input
              type="tel"
              value={form.requester_phone}
              onChange={(e) => set('requester_phone', e.target.value)}
              placeholder="e.g. 770-555-0100"
              style={{ ...inputStyle, maxWidth: isMobile ? '100%' : 240 }}
              maxLength={MAX.requester_phone}
            />
            <div style={{ maxWidth: isMobile ? '100%' : 240 }}>
              <Count value={form.requester_phone} max={MAX.requester_phone} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Your Relationship to This Listing <RequiredMark /></label>
            <select
              value={form.relationship_to_listing}
              onChange={(e) => set('relationship_to_listing', e.target.value)}
              style={inputStyle}
            >
              <option value="">Select…</option>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--lgray)', marginBottom: 14, paddingTop: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--navy)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 12,
            }}
          >
            Request Details
          </div>

          {requestMode === 'claim' ? (
            <div
              style={{
                marginBottom: 14,
                padding: '12px 14px',
                borderRadius: 10,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                fontSize: 13,
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              This will be submitted as a true ownership claim only.
              If you need to correct info, contact details, tryout status, or availability, switch to{' '}
              <strong>Request an update</strong>.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Type of Update <RequiredMark /></label>
                <select
                  value={form.requested_change}
                  onChange={(e) => set('requested_change', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select…</option>
                  {UPDATE_CHANGE_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              {['Correct listing info', 'Update contact info'].includes(form.requested_change) && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Corrected Contact Info</label>
                  <textarea
                    value={form.corrected_contact_info}
                    onChange={(e) => set('corrected_contact_info', e.target.value)}
                    rows={2}
                    placeholder="Phone, email, address, or other contact details to correct…"
                    style={{ ...inputStyle, resize: 'vertical' }}
                    maxLength={MAX.corrected_contact_info}
                  />
                  <Count value={form.corrected_contact_info} max={MAX.corrected_contact_info} />
                </div>
              )}

              {['Correct listing info', 'Update contact info'].includes(form.requested_change) && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Website / Social Updates</label>
                  <input
                    value={form.website_social_updates}
                    onChange={(e) => set('website_social_updates', e.target.value)}
                    placeholder="e.g. New website: www.example.com · Instagram: @handle"
                    style={inputStyle}
                    maxLength={MAX.website_social_updates}
                  />
                  <Count value={form.website_social_updates} max={MAX.website_social_updates} />
                </div>
              )}

              {form.requested_change === 'Update tryout status' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Tryout Update</label>
                  <textarea
                    value={form.tryout_updates}
                    onChange={(e) => set('tryout_updates', e.target.value)}
                    rows={2}
                    placeholder="e.g. Tryouts are now open. Date: April 15 at Fowler Park."
                    style={{ ...inputStyle, resize: 'vertical' }}
                    maxLength={MAX.tryout_updates}
                  />
                  <Count value={form.tryout_updates} max={MAX.tryout_updates} />
                </div>
              )}

              {form.requested_change === 'Update availability' && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Availability Update</label>
                  <textarea
                    value={form.availability_updates}
                    onChange={(e) => set('availability_updates', e.target.value)}
                    rows={2}
                    placeholder="e.g. Now accepting new lesson students on weekends."
                    style={{ ...inputStyle, resize: 'vertical' }}
                    maxLength={MAX.availability_updates}
                  />
                  <Count value={form.availability_updates} max={MAX.availability_updates} />
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              placeholder="Anything else we should know…"
              style={{ ...inputStyle, resize: 'vertical' }}
              maxLength={MAX.notes}
            />
            <Count value={form.notes} max={MAX.notes} />
          </div>
        </div>

        {validationError && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#B91C1C',
              fontSize: 13,
            }}
          >
            {validationError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            background: 'var(--navy)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: isMobile ? '14px 20px' : '12px 28px',
            fontFamily: 'var(--font-head)',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </div>
    </div>
  )
}