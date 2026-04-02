import { Link } from 'react-router-dom'
import { FEATURED_BADGE_STYLE } from '../../constants/featuredBadgeStyle'

function normalizeSportValue(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'baseball' || raw === 'softball' || raw === 'both') return raw
  if (raw.includes('baseball') && raw.includes('softball')) return 'both'
  if (raw.includes('softball')) return 'softball'
  if (raw.includes('baseball')) return 'baseball'
  return ''
}

function getFacilitySport(facility) {
  const primary = normalizeSportValue(facility?.sport)
  const served = normalizeSportValue(facility?.sport_served)
  if (primary) return primary
  return served
}

function getFacilityTypeLabel(value) {
  const map = {
    park_field: 'Park / Rec Field',
    training_facility: 'Indoor Training Facility',
    private_facility: 'Private Facility',
    travel_team_facility: 'Team Facility',
    school_field: 'School Field',
    other: 'Other',
  }
  return map[value] || value || ''
}

function getFacilityTypeColor(value) {
  if (value === 'park_field') return '#16A34A'
  if (value === 'training_facility') return '#D42B2B'
  if (value === 'private_facility') return '#8B5CF6'
  if (value === 'travel_team_facility') return '#1D4ED8'
  if (value === 'school_field') return '#6B7280'
  if (value === 'other') return '#9A6B2F'
  return '#9A6B2F'
}

function getFacilityZip(facility) {
  return facility.zip_code || facility.zip || ''
}

function normalizeUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function normalizeInstagramHandle(value) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://instagram.com/' + trimmed.replace(/^@/, '')
}

function getSportLabel(sport) {
  if (sport === 'both') return 'Baseball & Softball'
  if (sport === 'softball') return 'Softball'
  if (sport === 'baseball') return 'Baseball'
  return sport || ''
}

function getSportBadgeMeta(sport) {
  if (sport === 'softball') return { bg: '#F3F0D7', color: '#5F5A17', label: 'Softball', border: '#DDD59A' }
  if (sport === 'both') {
    return {
      bg: 'linear-gradient(90deg, #E8EEF8 0%, #E8EEF8 48%, #F3F0D7 52%, #F3F0D7 100%)',
      color: '#173B73',
      label: 'Baseball & Softball',
      border: '#C9D4E5',
    }
  }
  if (sport === 'baseball') return { bg: '#E8EEF8', color: '#173B73', label: 'Baseball', border: '#C7D3E8' }
  return null
}

function formatFacilityLocation(facility) {
  const cityState = [facility.city, facility.state].filter(Boolean).join(', ')
  const zip = getFacilityZip(facility)
  return [cityState, zip].filter(Boolean).join(' ')
}

export default function FacilityPreviewCard({ facility, onClose, detailHref }) {
  const facilityTypeLabel = getFacilityTypeLabel(facility.facility_type)
  const sportLabel = getSportLabel(getFacilitySport(facility))
  const sportMeta = getSportBadgeMeta(getFacilitySport(facility))
  const typeColor = getFacilityTypeColor(facility.facility_type)
  const amenities = Array.isArray(facility.amenities) ? facility.amenities : []
  const locationLine = formatFacilityLocation(facility)
  const fullAddress = [facility.address, [facility.city, facility.state].filter(Boolean).join(', '), getFacilityZip(facility)]
    .filter(Boolean)
    .join(', ')
  const websiteUrl = normalizeUrl(facility.website)
  const instagramUrl = normalizeInstagramHandle(facility.instagram)
  const facebookUrl = normalizeUrl(facility.facebook)
  const email = facility.contact_email || facility.email
  const phone = facility.phone || facility.contact_phone
  const mapQuery = encodeURIComponent(fullAddress || facility.name)

  return (
    <div
      style={{
        position: 'fixed',
        top: 128,
        left: '56%',
        transform: 'translateX(-50%)',
        width: 'min(720px, calc(100vw - 48px))',
        maxHeight: 'calc(100vh - 156px)',
        overflowY: 'auto',
        background: 'rgba(255,255,255,0.985)',
        border: '1px solid rgba(15,23,42,0.10)',
        borderRadius: 18,
        boxShadow: '0 22px 56px rgba(15,23,42,0.24)',
        padding: 18,
        zIndex: 60,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {facility.featured_status && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                  letterSpacing: '0.03em',
                  background: FEATURED_BADGE_STYLE.background,
                  color: FEATURED_BADGE_STYLE.color,
                  border: FEATURED_BADGE_STYLE.border,
                }}
              >
                ⭐ Featured
              </span>
            )}
            {sportMeta && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: sportMeta.bg,
                  color: sportMeta.color,
                  border: `1px solid ${sportMeta.border}`,
                }}
              >
                {sportMeta.label}
              </span>
            )}
            {facilityTypeLabel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#F3F4F6',
                  color: typeColor,
                  border: '1px solid #E5E7EB',
                }}
              >
                {facilityTypeLabel}
              </span>
            )}
          </div>

          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.1 }}>
            {facility.name}
          </div>

          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray)', lineHeight: 1.45 }}>
            {fullAddress || locationLine || 'Location not listed'}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            border: '1px solid rgba(15,23,42,0.12)',
            background: '#fff',
            color: 'var(--gray)',
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, 260px)', gap: 14, marginTop: 14 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Facility Details
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              {sportLabel && <div><strong>Sport:</strong> {sportLabel}</div>}
              {facilityTypeLabel && <div><strong>Type:</strong> {facilityTypeLabel}</div>}
              {facility.hours && <div><strong>Hours:</strong> {facility.hours}</div>}
              {facility.contact_name && <div><strong>Contact:</strong> {facility.contact_name}</div>}
            </div>
          </div>

          {facility.description && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                About Facility
              </div>
              <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>{facility.description}</div>
            </div>
          )}

          {amenities.length > 0 && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                Amenities
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {amenities.map((item) => (
                  <span
                    key={item}
                    style={{
                      background: '#EEF2F7',
                      color: 'var(--navy)',
                      fontSize: 12,
                      padding: '5px 9px',
                      borderRadius: 999,
                      textTransform: 'capitalize',
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Contact / Details
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.75 }}>
              {phone && <div><a href={`tel:${String(phone).replace(/\D/g, '')}`} style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 700 }}>{phone}</a></div>}
              {email && <div><a href={`mailto:${email}`} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>{email}</a></div>}
              {!phone && !email && <div>Contact details not listed.</div>}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Location
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              <div>{fullAddress || locationLine || 'Location not listed.'}</div>
              {(fullAddress || locationLine) && (
                <a
                  href={`https://maps.google.com/?q=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 8, color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}
                >
                  Open in Maps
                </a>
              )}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Links
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <Link to={detailHref} onClick={onClose} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>
                View Facility Page
              </Link>
              {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>Facility Website</a>}
              {instagramUrl && <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>Instagram</a>}
              {facebookUrl && <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}>Facebook</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}