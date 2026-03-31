import { useEffect } from 'react'

const STATUS_STYLE = {
  open: { bg: '#DCFCE7', color: '#16A34A', label: 'Open Tryouts' },
  closed: { bg: '#FEE2E2', color: '#DC2626', label: 'Closed' },
  by_invite: { bg: '#FEF3C7', color: '#D97706', label: 'By Invite' },
  year_round: { bg: '#DBEAFE', color: '#2563EB', label: 'Year Round' },
  unknown: { bg: 'var(--lgray)', color: 'var(--gray)', label: 'Status Unknown' },
}

function getTeamZip(team) {
  return team.zip_code || team.zip || ''
}

function formatTryoutDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TeamProfile({ team, onClose, onClaim }) {
  const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.unknown
  const zip = getTeamZip(team)
  const isVerified = team?.verified_status === true

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const facility = team.facility || team.facilities || null
  const facilityId = facility?.id || team.facility_id || null
  const facilityName = facility?.name || team.facility_name || ''
  const facilityCity = facility?.city || ''
  const facilityState = facility?.state || ''

  const displayCity = team.display_city || team.city || facilityCity || ''
  const displayState = team.display_state || team.state || facilityState || ''

  const locationParts = [displayCity, displayState].filter(Boolean)
  const locationLine = locationParts.length
    ? locationParts.join(', ') + (zip ? ' ' + zip : '')
    : team.county
      ? team.county + ' Co.'
      : null

  const practiceLocationLine = [displayCity, displayState].filter(Boolean).join(', ')
  const practiceMapQuery = encodeURIComponent(
    [
      team.address || '',
      practiceLocationLine || '',
      zip || '',
    ]
      .filter(Boolean)
      .join(', ')
  )

  const facilityLocationLine = [facilityCity, facilityState].filter(Boolean).join(', ')
  const primaryFacilityMapQuery = encodeURIComponent(
    [
      facilityName || '',
      facilityLocationLine || '',
      facility?.zip_code || '',
    ]
      .filter(Boolean)
      .join(', ')
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        overflowY: 'auto',
        padding: '16px 10px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: 14,
          width: 'min(640px, calc(100vw - 16px))',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <div style={{ background: 'var(--navy)', padding: '18px 18px 16px', position: 'relative' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              borderRadius: 20,
              width: 30,
              height: 30,
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: 22,
              fontWeight: 800,
              color: 'white',
            }}
          >
            {team.name}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', rowGap: 6, alignItems: 'center' }}>
            <span
              style={{
                background:
                  team.sport === 'softball'
                    ? '#7C3AED'
                    : team.sport === 'both'
                      ? 'var(--navy)'
                      : '#1D4ED8',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
                textTransform: 'uppercase',
                fontFamily: 'var(--font-head)',
              }}
            >
              {team.sport === 'both' ? 'Baseball & Softball' : team.sport}
            </span>

            {team.age_group && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  fontFamily: 'var(--font-head)',
                }}
              >
                {team.age_group}
              </span>
            )}

            {team.classification && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  fontFamily: 'var(--font-head)',
                }}
              >
                {team.classification}
              </span>
            )}

            {team.org_affiliation && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 10,
                  padding: '3px 8px',
                  borderRadius: 20,
                }}
              >
                {team.org_affiliation}
              </span>
            )}

            <span
              style={{
                background: statusInfo.bg,
                color: statusInfo.color,
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
                fontFamily: 'var(--font-head)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {statusInfo.label}
            </span>

            {isVerified && (
              <span
                style={{
                  background: '#DCFCE7',
                  color: '#166534',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  fontFamily: 'var(--font-head)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Verified
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14, overflowX: 'hidden' }}>
          {(locationLine || team.address) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
              {locationLine && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📍</span>
                  <span>{locationLine}</span>
                </div>
              )}

              {team.address && (
                <a
                  href={'https://maps.google.com/?q=' + practiceMapQuery}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#1D4ED8',
                    paddingLeft: 22,
                    textDecoration: 'none',
                    fontSize: 14,
                  }}
                >
                  {team.address}
                </a>
              )}
            </div>
          )}

          {(team.classification || team.sanctioning_body) && (
            <div
              style={{
                background: 'var(--cream)',
                borderRadius: 10,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--navy)',
                }}
              >
                Team Details
              </div>

              {team.classification && (
                <div style={{ fontSize: 14, color: 'var(--navy)' }}>
                  <strong>Classification:</strong> {team.classification}
                </div>
              )}

              {team.sanctioning_body && (
                <div style={{ fontSize: 14, color: 'var(--navy)' }}>
                  <strong>Sanctioning Body:</strong> {team.sanctioning_body}
                </div>
              )}
            </div>
          )}

          {((team.address || locationLine) || facilityName) && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 10,
                padding: '12px 14px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--navy)',
                }}
              >
                Team Locations
              </div>

              {(team.address || locationLine) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Practice Location
                  </div>
                  {team.address && (
                    <a
                      href={'https://maps.google.com/?q=' + practiceMapQuery}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}
                    >
                      📍 {team.address}
                    </a>
                  )}
                  {locationLine && (
                    <div style={{ fontSize: 14, color: 'var(--gray)' }}>
                      {team.address ? 'Area: ' : '📍 '}{locationLine}
                    </div>
                  )}
                </div>
              )}

              {facilityName && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Primary Facility
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
                    🏟️ {facilityName}
                  </div>
                  {facilityLocationLine && (
                    <div style={{ fontSize: 14, color: 'var(--gray)' }}>
                      📍 {facilityLocationLine}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {facilityId && (
                      <a
                        href={`/facilities/${facilityId}`}
                        style={{
                          color: '#1D4ED8',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 14,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 10px',
                          background: '#EFF6FF',
                          borderRadius: 999,
                          width: 'fit-content',
                        }}
                      >
                        View Facility Profile →
                      </a>
                    )}
                    {!facilityId && facilityLocationLine && (
                      <a
                        href={'https://maps.google.com/?q=' + primaryFacilityMapQuery}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1D4ED8',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 14,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 10px',
                          background: '#EFF6FF',
                          borderRadius: 999,
                          width: 'fit-content',
                        }}
                      >
                        Open in Maps →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {team.tryout_status === 'open' && (team.tryout_date || team.tryout_notes) && (
            <div
              style={{
                background: '#DCFCE7',
                borderRadius: 10,
                padding: '12px 14px',
                borderLeft: '4px solid #16A34A',
              }}
            >
              <div style={{ fontWeight: 700, color: '#15803D', fontSize: 14, marginBottom: 4 }}>
                🗓️ Tryout Information
              </div>

              {team.tryout_date && (
                <div style={{ color: '#15803D', fontSize: 13 }}>
                  {formatTryoutDate(team.tryout_date)}
                </div>
              )}

              {team.tryout_notes && (
                <div style={{ color: '#166534', fontSize: 13, marginTop: 4 }}>
                  {team.tryout_notes}
                </div>
              )}
            </div>
          )}

          {team.description && (
            <div
              style={{
                background: 'var(--cream)',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--navy)',
                lineHeight: 1.6,
              }}
            >
              {team.description}
            </div>
          )}

          {(team.contact_name || team.contact_phone || team.contact_email) && (
            <div
              style={{
                paddingTop: 16,
                borderTop: '2px solid var(--lgray)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-head)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--navy)',
                  marginBottom: 4,
                }}
              >
                Contact
              </div>

              {team.contact_name && (
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
                  👤 {team.contact_name}
                </div>
              )}

              {team.contact_phone && (
                <a
                  href={'tel:' + String(team.contact_phone).replace(/\D/g, '')}
                  style={{
                    color: 'var(--navy)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    background: '#F8FAFC',
                    borderRadius: 999,
                    width: 'fit-content',
                  }}
                >
                  📞 {team.contact_phone}
                </a>
              )}

              {team.contact_email && (
                <a
                  href={'mailto:' + team.contact_email}
                  style={{
                    color: '#1D4ED8',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    background: '#EFF6FF',
                    borderRadius: 999,
                    width: 'fit-content',
                  }}
                >
                  📧 {team.contact_email}
                </a>
              )}
            </div>
          )}

          <div
            style={{
              marginTop: 4,
              paddingTop: 16,
              borderTop: '2px solid var(--lgray)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {isVerified ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px 12px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: '#166534',
                    fontWeight: 700,
                  }}
                >
                  ✅ Verified Listing
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: '#166534',
                    lineHeight: 1.5,
                    maxWidth: 460,
                  }}
                >
                  Need a correction or ownership help? Visit Help / FAQ for next steps.
                </div>

                <a
                  href="/help"
                  style={{
                    color: '#166534',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    background: '#DCFCE7',
                    borderRadius: 999,
                    width: 'fit-content',
                  }}
                >
                  Open Help / FAQ →
                </a>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                  Is this your team? Claim this listing to update contact info, tryout dates, and more.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    if (onClaim) onClaim(team)
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}