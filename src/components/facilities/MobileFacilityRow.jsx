import { Link } from 'react-router-dom'

export default function MobileFacilityRow({
  facility,
  distanceMi,
  detailHref,
  sportMeta,
  typeLabel,
  locationLine,
  amenityLabel,
  featuredBadgeStyle,
  typeColor,
}) {
  return (
    <Link
      to={detailHref}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 14,
          boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
          padding: '10px 12px',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: 15.5,
                fontWeight: 800,
                letterSpacing: '0.01em',
                lineHeight: 1.12,
                color: 'var(--navy)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {facility.name}
            </div>
            <div
              style={{
                fontSize: 12.75,
                color: 'var(--gray)',
                marginTop: 4,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              📍 {locationLine || 'Location not listed'}
            </div>
          </div>

          {distanceMi != null ? (
            <div style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: 'var(--red)', whiteSpace: 'nowrap' }}>
              {Math.round(distanceMi)} mi
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
            {facility.featured_status && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 9.5,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                  letterSpacing: '0.03em',
                  background: featuredBadgeStyle.background,
                  color: featuredBadgeStyle.color,
                  border: featuredBadgeStyle.border,
                  maxWidth: '100%',
                }}
              >
                ⭐ Featured
              </span>
            )}

            {typeLabel && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 9.5,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#F3F4F6',
                  color: typeColor,
                  border: '1px solid #E5E7EB',
                  maxWidth: '100%',
                }}
              >
                {typeLabel}
              </span>
            )}

            {sportMeta && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 8px',
                  borderRadius: 999,
                  fontSize: 9.5,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: sportMeta.bg,
                  color: sportMeta.color,
                  border: `1px solid ${sportMeta.border}`,
                  maxWidth: '100%',
                }}
              >
                {sportMeta.label}
              </span>
            )}

            {amenityLabel && (
              <span
                style={{
                  background: '#F1F5F9',
                  color: 'var(--navy)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 999,
                  textTransform: 'capitalize',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {amenityLabel}
              </span>
            )}
          </div>

          <span
            style={{
              flexShrink: 0,
              textDecoration: 'none',
              background: 'var(--navy)',
              color: '#fff',
              borderRadius: 10,
              padding: '7px 10px',
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'var(--font-head)',
              whiteSpace: 'nowrap',
            }}
          >
            Open
          </span>
        </div>
      </div>
    </Link>
  )
}