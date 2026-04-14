import { Link } from 'react-router-dom'

const NAVY = '#0d1b2e'

export default function HomePageSectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: NAVY,
        }}
      >
        {title}
      </span>

      {linkTo && (
        <Link
          to={linkTo}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: NAVY,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {linkLabel || 'View all'}
        </Link>
      )}
    </div>
  )
}