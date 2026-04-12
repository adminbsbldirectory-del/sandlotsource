import AdSlot from '../AdSlot'

const MUTED = '#aaa'

export default function HomePageAdBand({
  slotKey,
  maxWidth,
  reservedHeight,
  isMobile,
  marginTop = 24,
}) {
  return (
    <div
      style={{
        padding: isMobile ? '16px 0' : '20px 0',
        marginTop,
        borderTop: '1px solid #f1f3f5',
        borderBottom: '1px solid #f1f3f5',
      }}
    >
      <div style={{ padding: isMobile ? '0 12px' : '0 20px' }}>
        <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: MUTED,
              margin: '0 0 8px 2px',
            }}
          >
            Sponsored
          </div>

          <div
            style={{
              minHeight: reservedHeight,
              overflow: 'hidden',
              borderRadius: 10,
            }}
          >
            <AdSlot slotKey={slotKey} />
          </div>
        </div>
      </div>
    </div>
  )
}