import React from 'react'

export default function RosterSubmittedState({ submittedInfo, onBackToRosterSpots }) {
  return (
    <div style={{ maxWidth: 680, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ background: '#DCFCE7', border: '2px solid #16A34A', borderRadius: 12, padding: '32px 24px' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 20,
            fontWeight: 700,
            color: '#15803D',
            marginBottom: 8,
          }}
        >
          Roster Spot Posted!
        </div>
        <div style={{ fontSize: 14, color: '#166534', marginBottom: 10 }}>
          Your listing will appear here once reviewed. It will stay active for 15 days.
        </div>

        {submittedInfo?.matchedTeam && (
          <div style={{ fontSize: 13, color: '#166534', marginBottom: 16, lineHeight: 1.5 }}>
            Linked to existing team listing: <strong>{submittedInfo.matchedTeam.name}</strong>
            {(submittedInfo.matchedTeam.practice_location_name || submittedInfo.matchedTeam.facility_name) && (
              <span>
                {' '}· {submittedInfo.matchedTeam.practice_location_name || submittedInfo.matchedTeam.facility_name}
              </span>
            )}
          </div>
        )}

        {submittedInfo?.postedStandalone && !submittedInfo?.matchedTeam && (
          <div style={{ fontSize: 13, color: '#166534', marginBottom: 16 }}>
            Posted as a standalone roster spot with no team link selected.
          </div>
        )}

        <button
          type="button"
          onClick={onBackToRosterSpots}
          style={{
            background: 'var(--navy)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontFamily: 'var(--font-head)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Back to Roster Spots
        </button>
      </div>
    </div>
  )
}