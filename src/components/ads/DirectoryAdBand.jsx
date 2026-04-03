import AdSlot from '../AdSlot.jsx'

export default function DirectoryAdBand({
  slotKey,
  maxWidth,
  reservedHeight,
  isMobile,
  marginTop = 24,
}) {
  return (
    <div
      style={{
        background: '#F5F4F0',
        borderTop: '1px solid #E2E0DB',
        borderBottom: '1px solid #E2E0DB',
        padding: isMobile ? '16px 0' : '18px 0',
        marginTop,
      }}
    >
      <div style={{ padding: isMobile ? '0 12px' : '0 14px' }}>
        <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--gray)',
              margin: '0 0 8px 2px',
            }}
          >
            Sponsored
          </div>

          <div
            style={{
              minHeight: reservedHeight,
              background: '#fff',
              border: '1px solid #E2E0DB',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <AdSlot slotKey={slotKey} />
          </div>
        </div>
      </div>
    </div>
  )
}