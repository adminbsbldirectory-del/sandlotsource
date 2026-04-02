import React from 'react'

function getLocationLine(city, state, zipCode) {
  const base = [city, state].filter(Boolean).join(', ')
  return base + (zipCode ? `${base ? ' ' : ''}${zipCode}` : '')
}

function SportBadge({ sport }) {
  const isSoftball = sport === 'softball'
  return (
    <span
      style={{
        background: isSoftball ? '#F5EDFF' : '#E8F0FF',
        color: isSoftball ? '#6D28D9' : '#1D4ED8',
        border: '1px solid ' + (isSoftball ? '#D8B4FE' : '#BFDBFE'),
        fontSize: 10,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 20,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-head)',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {sport}
    </span>
  )
}

function DaysRemaining({ expiresAt }) {
  if (!expiresAt) return null
  const days = Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))
  const tone = days <= 2 ? '#B91C1C' : days <= 5 ? '#92400E' : '#166534'
  const bg = days <= 2 ? '#FEE2E2' : days <= 5 ? '#FEF3C7' : '#DCFCE7'
  const label = days === 0 ? 'Expires today' : `${days} day${days !== 1 ? 's' : ''} left`
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 999,
        background: bg,
        color: tone,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}

export default function RosterRow({ spot, isMobile }) {
  const actionLinkStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '100%' : 'auto',
    minHeight: isMobile ? 38 : 'auto',
    padding: isMobile ? '9px 12px' : 0,
    borderRadius: isMobile ? 999 : 0,
    border: isMobile ? '1px solid #CBD5E1' : 'none',
    background: isMobile ? 'white' : 'transparent',
    color: '#1D4ED8',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 700,
    boxSizing: 'border-box',
  }

  const positions = Array.isArray(spot.positions_needed) ? spot.positions_needed : []
  const cityStateZip = getLocationLine(spot.city, spot.state, spot.zip_code)
  const linkedTeam = spot.travel_teams || null
  const linkedTeamUrl = spot.team_id ? '/teams?select=' + spot.team_id : ''
  const facilityUrl = linkedTeam?.facility_id ? '/facilities/' + linkedTeam.facility_id : ''
  const linkedPracticeLocation = linkedTeam?.practice_location_name || ''
  const linkedFacilityName = linkedTeam?.facility_name || ''

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--lgray)',
        borderRadius: 16,
        padding: isMobile ? '14px 14px 12px' : '16px 18px',
        boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.35fr) minmax(0, 0.95fr)',
          gap: isMobile ? 10 : 16,
          alignItems: 'start',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: isMobile ? 16 : 17,
                fontWeight: 800,
                color: 'var(--navy)',
                lineHeight: 1.2,
                minWidth: 0,
                wordBreak: 'break-word',
              }}
            >
              {spot.team_name || 'Open roster spot'}
            </div>
            {spot.team_id && (
              <span
                style={{
                  background: '#F0FDF4',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-head)',
                }}
              >
                Linked Team
              </span>
            )}
            <SportBadge sport={spot.sport} />
            {spot.age_group && (
              <span
                style={{
                  background: '#F8FAFC',
                  color: 'var(--navy)',
                  border: '1px solid #CBD5E1',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-head)',
                }}
              >
                {spot.age_group}
              </span>
            )}
          </div>

          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 8, wordBreak: 'break-word' }}>
            {cityStateZip || 'Location pending'}
            {typeof spot.distanceMiles === 'number' && (
              <span style={{ marginLeft: 8, color: '#0F766E', fontWeight: 700 }}>
                {spot.distanceMiles.toFixed(1)} mi away
              </span>
            )}
          </div>

          {spot.org_affiliation && (
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 8, wordBreak: 'break-word' }}>
              {spot.org_affiliation}
            </div>
          )}

          {(linkedPracticeLocation || linkedFacilityName) && (
            <div
              style={{
                display: 'grid',
                gap: 6,
                marginBottom: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              {linkedPracticeLocation && (
                <div style={{ fontSize: 12, color: '#334155', wordBreak: 'break-word' }}>
                  <strong>Practice:</strong> {linkedPracticeLocation}
                </div>
              )}
              {linkedFacilityName && (
                <div style={{ fontSize: 12, color: '#334155', wordBreak: 'break-word' }}>
                  <strong>Facility:</strong> {linkedFacilityName}
                </div>
              )}
            </div>
          )}

          {positions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {positions.map((pos) => (
                <span
                  key={pos}
                  style={{
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          {spot.description && (
            <div
              style={{
                fontSize: 13,
                color: '#475569',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {spot.description}
            </div>
          )}
        </div>

        <div
          style={{
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'flex-start' : 'flex-end',
            gap: 8,
            textAlign: isMobile ? 'left' : 'right',
            paddingTop: isMobile ? 10 : 0,
            borderTop: isMobile ? '1px solid #E2E8F0' : 'none',
          }}
        >
          <DaysRemaining expiresAt={spot.expires_at} />
          {spot.contact_name && (
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', wordBreak: 'break-word' }}>
              {spot.contact_name}
            </div>
          )}
          {spot.contact_info && (
            <div style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 700, wordBreak: 'break-word' }}>
              {spot.contact_info}
            </div>
          )}
          {linkedTeamUrl && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? (facilityUrl ? '1fr 1fr' : '1fr') : 'none',
                gap: 10,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'stretch' : 'flex-end',
              }}
            >
              <a href={linkedTeamUrl} style={actionLinkStyle}>
                View Team →
              </a>
              {facilityUrl && (
                <a href={facilityUrl} style={actionLinkStyle}>
                  View Facility →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}