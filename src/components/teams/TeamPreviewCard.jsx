import React from 'react'
import { Link } from 'react-router-dom'

export default function TeamPreviewCard({
  team,
  onClose,
  onOpenFull,
  statusInfo,
  sportChip,
  locationLine,
  practiceLocation,
  facilityLocation,
  facilityWebsite,
  teamWebsite,
  tryoutDate,
  practiceMapQuery,
  sportLabel,
}) {
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
                ...sportChip,
              }}
            >
              {sportLabel}
            </span>

            {team.age_group && (
              <span
                style={{
                  background: '#F3F4F6',
                  color: 'var(--navy)',
                  border: '1px solid #E5E7EB',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                }}
              >
                {team.age_group}
              </span>
            )}

            {team.classification && (
              <span
                style={{
                  background: '#EEF2FF',
                  color: '#1D4ED8',
                  border: '1px solid #C7D2FE',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: 'var(--font-head)',
                }}
              >
                {team.classification}
              </span>
            )}

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
                background: statusInfo.bg,
                color: statusInfo.color,
              }}
            >
              {statusInfo.label}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.1 }}>
            {team.name}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray)', lineHeight: 1.45 }}>
            {locationLine || 'Location not listed'}
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
              Team Details
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              {team.org_affiliation && <div><strong>Organization:</strong> {team.org_affiliation}</div>}
              {team.classification && <div><strong>Classification:</strong> {team.classification}</div>}
              {team.sanctioning_body && <div><strong>Sanctioning:</strong> {team.sanctioning_body}</div>}
              {!team.org_affiliation && !team.classification && !team.sanctioning_body && <div>Team details not listed.</div>}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Practice Location
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              <div>{practiceLocation || 'Practice location not listed.'}</div>
              {practiceLocation && (
                <a
                  href={`https://maps.google.com/?q=${practiceMapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 8, color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}
                >
                  Open in Maps
                </a>
              )}
            </div>
          </div>

          {team.description && (
            <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                About Team
              </div>
              <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
                {team.description}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Tryouts
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              <div><strong>Status:</strong> {statusInfo.label}</div>
              {tryoutDate && <div><strong>Date:</strong> {tryoutDate}</div>}
              {team.tryout_notes && <div style={{ marginTop: 8 }}>{team.tryout_notes}</div>}
              {!tryoutDate && !team.tryout_notes && <div>No tryout notes listed.</div>}
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Primary Facility
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.6 }}>
              <div>{team.facility_name || 'No linked facility yet.'}</div>
              {facilityLocation && <div style={{ color: 'var(--gray)', marginTop: 4 }}>{facilityLocation}</div>}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                {team.facility_id && (
                  <Link
                    to={`/facilities/${team.facility_id}`}
                    onClick={onClose}
                    style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}
                  >
                    View Facility Page
                  </Link>
                )}
                {facilityWebsite && (
                  <a
                    href={facilityWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Facility Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Contact / Details
            </div>
            <div style={{ fontSize: 14, color: 'var(--navy)', lineHeight: 1.75 }}>
              {team.contact_name && <div>{team.contact_name}</div>}
              {team.contact_phone && (
                <a
                  href={`tel:${String(team.contact_phone).replace(/\D/g, '')}`}
                  style={{ color: 'var(--navy)', textDecoration: 'none', fontWeight: 700 }}
                >
                  {team.contact_phone}
                </a>
              )}
              {team.contact_email && (
                <div>
                  <a
                    href={`mailto:${team.contact_email}`}
                    style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}
                  >
                    {team.contact_email}
                  </a>
                </div>
              )}
              {teamWebsite && (
                <div>
                  <a
                    href={teamWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 700 }}
                  >
                    Team Website
                  </a>
                </div>
              )}
              {!team.contact_name && !team.contact_phone && !team.contact_email && !teamWebsite && <div>Contact details not listed.</div>}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFull}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--navy)',
              color: 'white',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'var(--font-head)',
            }}
          >
            View Team Details
          </button>
        </div>
      </div>
    </div>
  )
}
