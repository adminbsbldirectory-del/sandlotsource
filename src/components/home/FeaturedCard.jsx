import { Link } from 'react-router-dom'

const SPORT_LABEL = {
  baseball: 'Baseball',
  softball: 'Softball',
}

const RED = '#e63329'
const DARK = '#1a1a1a'
const BORDER = '#e2e0db'
const FAINT = '#bbb'

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
            fontSize: isMobile ? 16 : 14,
            fontWeight: 600,
            color: DARK,
            lineHeight: 1.28,
          }}
        >
          {listing.name}
        </span>

        <span
          style={{
            fontSize: isMobile ? 11 : 10,
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

      <div style={{ fontSize: isMobile ? 14 : 12, color: '#777', marginBottom: 3 }}>
        {listing.meta}
      </div>

      <div
        style={{
          fontSize: isMobile ? 12 : 11,
          color: FAINT,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginBottom: 8,
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
        {listing.location} &middot; {listing.distance}
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
        <span style={{ fontSize: isMobile ? 13 : 12, fontWeight: 600, color: RED }}>
          {listing.type === 'coach' ? 'View profile' : 'View team'} &rarr;
        </span>
        <span style={{ fontSize: isMobile ? 12 : 10, color: FAINT }}>
          {SPORT_LABEL[listing.sport]}
        </span>
      </div>
    </Link>
  )
}