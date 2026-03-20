export default function DuplicateWarning({
  matches = [],
  loading = false,
  mode = 'facility',
  selectedId = null,
  onUseExisting,
  onCreateNewAnyway,
  onDismiss,
}) {
  if (loading) {
    return (
      <div style={{
        background: '#F8FAFC',
        border: '1px solid #CBD5E1',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
          Checking for existing {mode === 'facility' ? 'facilities' : 'matches'}…
        </div>
      </div>
    )
  }

  if (!matches || matches.length === 0) return null

  return (
    <div style={{
      background: '#FFF7ED',
      border: '1.5px solid #FDBA74',
      borderRadius: 12,
      padding: '16px',
      marginBottom: 16,
    }}>
      <div style={{
        fontFamily: 'var(--font-head)',
        fontSize: 16,
        fontWeight: 800,
        color: '#9A3412',
        marginBottom: 6,
      }}>
        Possible existing facility found
      </div>

      <div style={{ fontSize: 13, color: '#9A3412', marginBottom: 14, lineHeight: 1.45 }}>
        Review the closest match below. You can reuse the existing facility or continue and create a new one anyway.
      </div>

      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        {matches.map((match) => {
          const selected = selectedId === match.id
          return (
            <div
              key={match.id}
              style={{
                background: '#fff',
                border: selected ? '2px solid var(--navy)' : '1px solid #FED7AA',
                borderRadius: 10,
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy)' }}>
                    {match.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>
                    {[match.address, match.city, match.state, match.zip_code].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ fontSize: 11, color: '#C2410C', marginTop: 5 }}>
                    {match.matchType === 'strong' ? 'Strong match' : 'Possible match'}
                    {match.reasons?.length ? ` · ${match.reasons.join(' · ')}` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onUseExisting?.(match)}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--navy)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: 'var(--font-head)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selected ? 'Using Existing' : 'Use Existing Facility'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onCreateNewAnyway?.()}
          style={{
            padding: '10px 14px',
            background: '#D42B2B',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontFamily: 'var(--font-head)',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Create New Anyway
        </button>

        <button
          type="button"
          onClick={() => onDismiss?.()}
          style={{
            padding: '10px 14px',
            background: '#fff',
            color: '#9A3412',
            border: '1px solid #FDBA74',
            borderRadius: 8,
            fontFamily: 'var(--font-head)',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Clear Suggestion
        </button>
      </div>
    </div>
  )
}
