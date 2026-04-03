import { Link } from 'react-router-dom'

const RED = '#e63329'
const DARK = '#1a1a1a'
const BORDER = '#eaeae6'
const MUTED = '#888'
const LIGHT = '#f5f5f2'

const BADGE_STYLES = {
  facility: { background: '#e8f4ff', color: '#1d4ed8' },
}

function getZip(item) {
  return item.zip_code || item.zip || ''
}

function getLocationLine(item) {
  const zip = getZip(item)
  const parts = [item.city, item.state].filter(Boolean)
  if (parts.length === 0 && zip) return zip
  if (parts.length === 0) return item.county ? `${item.county} Co.` : ''
  return parts.join(', ') + (zip ? ` ${zip}` : '')
}

export default function FacilityResult({ facility, distanceMi, to }) {
  const amenities = Array.isArray(facility.amenities) ? facility.amenities : []
  const locationLine = getLocationLine(facility)

  return (
    <Link
      to={to}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: '14px 16px',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 6,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: DARK,
                marginBottom: 2,
              }}
            >
              {facility.name}
            </div>
            {facility.address && (
              <div style={{ fontSize: 12, color: MUTED }}>{facility.address}</div>
            )}
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 5,
              flexShrink: 0,
              marginLeft: 12,
              ...BADGE_STYLES.facility,
            }}
          >
            🏟️ Facility
          </span>
        </div>

        <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
          📍 {locationLine || 'Location not listed'}
          {distanceMi != null && (
            <span style={{ marginLeft: 8, color: RED, fontWeight: 500 }}>
              {Math.round(distanceMi)} mi away
            </span>
          )}
        </div>

        {amenities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                style={{
                  background: LIGHT,
                  color: MUTED,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                {a}
              </span>
            ))}
            {amenities.length > 4 && (
              <span
                style={{
                  background: LIGHT,
                  color: MUTED,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                }}
              >
                +{amenities.length - 4} more
              </span>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #f2f2ee',
            paddingTop: 9,
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: RED }}>
            View facility →
          </span>
          {facility.sport && (
            <span style={{ fontSize: 11, color: MUTED, textTransform: 'capitalize' }}>
              {facility.sport === 'both'
                ? '⚾🥎 Baseball & Softball'
                : facility.sport === 'softball'
                  ? '🥎 Softball'
                  : '⚾ Baseball'}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}