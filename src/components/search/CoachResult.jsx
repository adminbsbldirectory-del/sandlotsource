import { Link } from 'react-router-dom'

const RED = '#e63329'
const DARK = '#1a1a1a'
const BORDER = '#eaeae6'
const MUTED = '#888'
const LIGHT = '#f5f5f2'

const BADGE_STYLES = {
  coach: { background: '#e8f2fc', color: '#0c4a8a' },
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

function normalizeSpecialty(item) {
  if (Array.isArray(item.specialty)) return item.specialty
  return (item.specialty || '').split('|').filter(Boolean)
}

export default function CoachResult({ coach, distanceMi, to }) {
  const specs = normalizeSpecialty(coach)
  const locationLine = getLocationLine(coach)

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
              {coach.name}
            </div>
            {coach.facility_name && (
              <div style={{ fontSize: 12, color: MUTED }}>{coach.facility_name}</div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 5,
                ...BADGE_STYLES.coach,
              }}
            >
              Coach
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 5,
                background: coach.sport === 'softball' ? '#f0eefe' : '#e8f4ff',
                color: coach.sport === 'softball' ? '#5b21b6' : '#1d4ed8',
                textTransform: 'uppercase',
              }}
            >
              {coach.sport === 'softball' ? '🥎' : '⚾'} {coach.sport}
            </span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
          📍 {locationLine || 'Location not listed'}
          {distanceMi != null && (
            <span style={{ marginLeft: 8, color: RED, fontWeight: 500 }}>
              {Math.round(distanceMi)} mi away
            </span>
          )}
        </div>

        {specs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {specs.map((s) => (
              <span
                key={s}
                style={{
                  background: LIGHT,
                  color: MUTED,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 20,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {coach.credentials && (
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4, marginBottom: 6 }}>
            {coach.credentials.length > 100
              ? coach.credentials.slice(0, 100) + '…'
              : coach.credentials}
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
            View profile →
          </span>
          {(coach.price_per_session || coach.price_notes) && (
            <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
              {coach.price_per_session
                ? `$${coach.price_per_session}/session`
                : coach.price_notes}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}