export default function DuplicateWarning({ matches, onDismiss, onCancel }) {
  if (!matches || matches.length === 0) return null

  return (
    <div style={{
      background: '#FEF3C7',
      border: '2px solid #F0A500',
      borderRadius: 10,
      padding: '16px',
      marginBottom: 16,
    }}>
      <div style={{
        fontFamily: 'var(--font-head)',
        fontSize: 16, fontWeight: 700,
        color: '#92400E',
        marginBottom: 8,
      }}>
        ⚠️ Possible Duplicate Detected
      </div>

      <div style={{ fontSize: 13, color: '#92400E', marginBottom: 12 }}>
        We found {matches.length === 1 ? 'an existing entry' : 'existing entries'} that look similar to what you're adding:
      </div>

      {matches.map(match => (
        <div key={match.id} style={{
          background: 'white',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 8,
          border: '1px solid #FDE68A',
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{match.name}</div>
          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
            {[match.city, match.county ? match.county + ' Co.' : null, match.sport].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>
            {Math.round(match.score * 100)}% match
          </div>
        </div>
      ))}

      <div style={{ fontSize: 13, color: '#92400E', marginBottom: 12 }}>
        Is this the same person or team you're trying to add?
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '9px',
            background: '#D42B2B', color: 'white',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-head)', fontWeight: 700,
            fontSize: 13, textTransform: 'uppercase',
            letterSpacing: '0.04em', cursor: 'pointer',
          }}
        >
          Yes — Don't Add Duplicate
        </button>
        <button
          onClick={onDismiss}
          style={{
            flex: 1, padding: '9px',
            background: 'var(--navy)', color: 'white',
            border: 'none', borderRadius: 8,
            fontFamily: 'var(--font-head)', fontWeight: 700,
            fontSize: 13, textTransform: 'uppercase',
            letterSpacing: '0.04em', cursor: 'pointer',
          }}
        >
          No — It's Different, Continue
        </button>
      </div>
    </div>
  )
}
