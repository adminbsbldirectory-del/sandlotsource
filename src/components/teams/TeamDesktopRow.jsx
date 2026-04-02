import React from 'react'

export default function TeamDesktopRow({
  team,
  isSelected,
  statusMeta,
  sportChip,
  practiceLine,
  teamLine,
  tryoutDate,
  setRowRef,
  onSelect,
  onToggle,
}) {
  return (
    <div
      ref={setRowRef}
      style={{
        borderBottom: '1px solid rgba(15,23,42,0.06)',
        background: isSelected ? '#FCFCFD' : 'var(--white)',
      }}
    >
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect()
          }
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: '110px minmax(0,1.15fr) minmax(0,1fr) 150px 150px 84px',
          gap: 10,
          alignItems: 'center',
          padding: '10px 14px',
          cursor: 'pointer',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'var(--font-head)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              ...sportChip,
            }}
          >
            {team.sportLabel}
          </span>
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--navy)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={team.name}
          >
            {team.name}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color: 'var(--gray)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={teamLine}
          >
            {teamLine || 'Location not listed'}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--navy)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={team.facility_name || practiceLine}
          >
            {team.facility_name || 'No linked facility'}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color: 'var(--gray)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={practiceLine}
          >
            {practiceLine || 'Practice area not listed'}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
            {team.age_group || '—'}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color: 'var(--gray)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {team.classification || team.org_affiliation || 'Level not listed'}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 800,
              fontFamily: 'var(--font-head)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              background: statusMeta.bg,
              color: statusMeta.color,
            }}
          >
            {statusMeta.label}
          </span>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: 'var(--gray)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={tryoutDate || team.tryout_notes || ''}
          >
            {tryoutDate || team.tryout_notes || 'No date listed'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggle()
            }}
            style={{
              minWidth: 64,
              padding: '7px 8px',
              borderRadius: 9,
              border: '1.5px solid var(--navy)',
              background: isSelected ? 'var(--navy)' : 'var(--white)',
              color: isSelected ? 'var(--white)' : 'var(--navy)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-head)',
            }}
          >
            {isSelected ? 'Close' : 'Open'}
          </button>
        </div>
      </div>
    </div>
  )
}