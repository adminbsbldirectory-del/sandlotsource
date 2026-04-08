import { Link } from 'react-router-dom'

const SPORT_LABEL = {
  baseball: 'Baseball',
  softball: 'Softball',
}

const RED = '#D42B2B'
const DARK = '#1a1a1a'
const BORDER = '#e2e0db'
const MUTED = '#6B7280'

export default function FeaturedCard({ listing, isMobile }) {
  return (
    <Link
      to={listing.link}
      style={{
        border: '1px solid ' + BORDER,
        borderRadius: 12,
        padding: isMobile ? '12px 14px' : '14px 15px',
        background: '#fff',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 4,
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 16 : 15,
            fontWeight: 600,
            color: DARK,
            lineHeight: 1.28,
          }}
        >
          {listing.name}
        </span>

        <span
          style={{
            fontSize: isMobile ? 11 : 11,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            ...listing.badgeStyle,
          }}
        >
          {listing.badge}
        </span>
      </div>

      <div style={{ fontSize: isMobile ? 14 : 13, color: MUTED, marginBottom: 3 }}>
        {listing.meta}
      </div>

      <div
        style={{
          fontSize: isMobile ? 12 : 12,
          color: MUTED,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#ddd',
            flexShrink: 0,
          }}
        />
        <span>{listing.location}</span>

        {listing.distance === 'Featured' ? (
          <span
            style={{
              fontSize: isMobile ? 11 : 11,
              fontWeight: 600,
              color: MUTED,
              background: '#f5f5f2',
              border: '1px solid #eceae4',
              borderRadius: 999,
              padding: '2px 7px',
              lineHeight: 1.2,
            }}
          >
            Featured
          </span>
        ) : listing.distance ? (
          <span>&middot; {listing.distance}</span>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #f2f2ee',
          paddingTop: 8,
        }}
      >
        <span style={{ fontSize: isMobile ? 13 : 13, fontWeight: 600, color: RED }}>
          {listing.type === 'coach' ? 'View profile' : 'View team'} &rarr;
        </span>
        <span style={{ fontSize: isMobile ? 12 : 12, color: MUTED }}>
          {SPORT_LABEL[listing.sport]}
        </span>
      </div>
    </Link>
  )
}