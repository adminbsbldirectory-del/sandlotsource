import { Link } from 'react-router-dom'

const RED = '#e63329'
const DARK = '#1a1a1a'
const BORDER = '#eaeae6'
const MUTED = '#888'
const LIGHT = '#f5f5f2'

const BADGE_STYLES = {
  team: { background: '#eaf3de', color: '#285010' },
  roster: { background: '#fff3e0', color: '#7a4200' },
  tryout: { background: '#f0eefe', color: '#3d2fa0' },
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

export default function TeamResult({ team, distanceMi, to }) {
  const isOpen = team.roster_status === 'open' || team.open_spots > 0
  const isTryout = team.tryout_status === 'open' || team.tryout_date
  const locationLine = getLocationLine(team)

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
              {team.name}
            </div>
            {team.org_affiliation && (
              <div style={{ fontSize: 12, color: MUTED }}>{team.org_affiliation}</div>
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
            {isOpen && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 5,
                  ...BADGE_STYLES.roster,
                }}
              >
                Open Roster
              </span>
            )}
            {isTryout && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 5,
                  ...BADGE_STYLES.tryout,
                }}
              >
                Tryouts Open
              </span>
            )}
            {!isOpen && !isTryout && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 5,
                  ...BADGE_STYLES.team,
                }}
              >
                Team
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
          📍 {locationLine || 'Location TBD'}
          {distanceMi != null && (
            <span style={{ marginLeft: 8, color: RED, fontWeight: 500 }}>
              {Math.round(distanceMi)} mi away
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {team.sport && (
            <span
              style={{
                background: LIGHT,
                color: MUTED,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
              }}
            >
              {team.sport === 'softball' ? '🥎' : '⚾'} {team.sport}
            </span>
          )}
          {team.age_group && (
            <span
              style={{
                background: LIGHT,
                color: MUTED,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
              }}
            >
              {team.age_group}
            </span>
          )}
        </div>

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
            View team →
          </span>
        </div>
      </div>
    </Link>
  )
}