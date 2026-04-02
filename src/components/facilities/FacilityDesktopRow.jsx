import React from 'react'

const DESKTOP_ROW_TEMPLATE = '140px minmax(0,1.1fr) 150px minmax(0,1fr) 84px'

export default function FacilityDesktopRow({
  facility,
  isSelected,
  onActivate,
  onToggle,
  sportMeta,
  typeLabel,
  locationFull,
  subtitle,
  featuredBadgeStyle,
  typeColor,
}) {
  return (
    <div
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate()
        }
      }}
      style={{
        display: 'grid',
        gridTemplateColumns: DESKTOP_ROW_TEMPLATE,
        gap: 10,
        alignItems: 'center',
        padding: '10px 14px',
        cursor: 'pointer',
      }}
    >
      <div style={{ minWidth: 0 }}>
        {sportMeta ? (
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
              background: sportMeta.bg,
              color: sportMeta.color,
              border: `1px solid ${sportMeta.border}`,
            }}
          >
            {sportMeta.label}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--gray)' }}>—</span>
        )}
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
          title={facility.name}
        >
          {facility.name}
        </div>

        {facility.featured_status && (
          <div style={{ marginTop: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px 7px',
                borderRadius: 999,
                fontSize: 9.5,
                fontWeight: 800,
                fontFamily: 'var(--font-head)',
                letterSpacing: '0.03em',
                background: featuredBadgeStyle.background,
                color: featuredBadgeStyle.color,
                border: featuredBadgeStyle.border,
              }}
            >
              ⭐ Featured
            </span>
          </div>
        )}

        <div
          style={{
            marginTop: 3,
            fontSize: 11,
            color: 'var(--gray)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={Array.isArray(facility.amenities) ? facility.amenities.join(', ') : ''}
        >
          {Array.isArray(facility.amenities) && facility.amenities.length
            ? facility.amenities.slice(0, 3).join(' · ')
            : 'No amenities listed'}
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
            background: '#F3F4F6',
            color: typeColor,
            border: '1px solid #E5E7EB',
          }}
        >
          {typeLabel || 'Other'}
        </span>
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
          title={subtitle}
        >
          {subtitle}
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
          title={locationFull}
        >
          {locationFull || 'Location not listed'}
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
  )
}