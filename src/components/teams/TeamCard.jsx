import React from 'react'

export default function TeamCard({
  team,
  selected,
  mobile = false,
  onOpen,
  onFocusMap,
  statusInfo,
  locationFull,
  practiceLabel,
  sportLabel,
}) {
  if (mobile) {
    return (
      <div
        className="card"
        onClick={onOpen}
        style={{
          cursor: 'pointer',
          border: selected ? '2px solid var(--red)' : '1px solid rgba(15,23,42,0.08)',
          boxShadow: selected ? '0 8px 24px rgba(0,0,0,0.10)' : '0 2px 10px rgba(0,0,0,0.05)',
        }}
      >
        <div className="card-body" style={{ padding: '12px 12px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 16,
                  fontWeight: 800,
                  lineHeight: 1.15,
                  color: 'var(--navy)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {team.name}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--gray)',
                  marginTop: 4,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                📍 {locationFull || 'Location not listed'}
              </div>
            </div>
            <span
              className="badge"
              style={{
                background: statusInfo.bg,
                color: statusInfo.color,
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {statusInfo.label}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
            {team.age_group && (
              <span
                style={{
                  background: 'var(--navy)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontFamily: 'var(--font-head)',
                }}
              >
                {team.age_group}
              </span>
            )}
            <span className={'badge badge-sport-' + (team.sport || 'baseball')}>
              {sportLabel}
            </span>
            {team.classification && (
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  fontSize: 10,
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontWeight: 700,
                }}
              >
                {team.classification}
              </span>
            )}
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 8, lineHeight: 1.35 }}>
            {practiceLabel ? `Practice: ${practiceLabel}` : 'Practice location not listed'}
          </div>

          <div
            style={{
              marginTop: 10,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--gray)' }}>Open team details</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {team.lat != null && team.lng != null && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFocusMap()
                  }}
                  style={{
                    background: 'var(--white)',
                    color: 'var(--navy)',
                    border: '1.5px solid var(--lgray)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-head)',
                  }}
                >
                  View Map
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen()
                }}
                style={{
                  background: 'var(--navy)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-head)',
                  letterSpacing: '0.04em',
                }}
              >
                View Team Details
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="card"
      onClick={onOpen}
      style={{
        cursor: 'pointer',
        border: selected ? '2px solid var(--red)' : '1px solid rgba(15,23,42,0.08)',
        boxShadow: selected ? '0 8px 24px rgba(0,0,0,0.10)' : '0 2px 10px rgba(0,0,0,0.05)',
      }}
    >
      <div className="card-body" style={{ padding: '12px 12px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              {team.name}
            </div>

            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
              {practiceLabel ? `📍 Practice: ${practiceLabel}` : '📍 Practice location not listed'}
            </div>

            {team.facility_name && (
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
                {`🏟️ Primary: ${team.facility_name}`}
              </div>
            )}

            {team.classification && (
              <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 3 }}>
                {`🏅 ${team.classification}`}
              </div>
            )}
          </div>

          <span
            className="badge"
            style={{
              background: statusInfo.bg,
              color: statusInfo.color,
              flexShrink: 0,
            }}
          >
            {statusInfo.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          {team.age_group && (
            <span
              style={{
                background: 'var(--navy)',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 20,
                fontFamily: 'var(--font-head)',
              }}
            >
              {team.age_group}
            </span>
          )}

          <span className={'badge badge-sport-' + (team.sport || 'baseball')}>
            {sportLabel}
          </span>

          {team.org_affiliation && (
            <span
              style={{
                background: 'var(--lgray)',
                color: 'var(--gray)',
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 20,
              }}
            >
              {team.org_affiliation}
            </span>
          )}

          {team.classification && (
            <span
              style={{
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 20,
                fontWeight: 700,
              }}
            >
              {team.classification}
            </span>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpen()
            }}
            style={{
              flex: 1,
              minWidth: 140,
              background: 'var(--navy)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--btn-radius)',
              padding: '9px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-head)',
              letterSpacing: '0.04em',
            }}
          >
            View Team Details
          </button>

          {team.lat != null && team.lng != null && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onFocusMap()
              }}
              style={{
                background: 'var(--white)',
                color: 'var(--navy)',
                border: '1.5px solid var(--lgray)',
                borderRadius: 'var(--btn-radius)',
                padding: '9px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
              }}
            >
              View on Map
            </button>
          )}
        </div>
      </div>
    </div>
  )
}