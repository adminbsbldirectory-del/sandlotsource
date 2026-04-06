import AdSlot from '../AdSlot'

const LIGHT = '#f5f4f0'
const BORDER = '#e2e0db'
const MUTED = '#888'

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
        background: LIGHT,
        borderTop: '1px solid ' + BORDER,
        borderBottom: '1px solid ' + BORDER,
        padding: isMobile ? '16px 0' : '18px 0',
        marginTop,
      }}
    >
      <div style={{ padding: isMobile ? '0 12px' : '0 20px' }}>
        <div style={{ width: '100%', maxWidth, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
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
              background: '#fff',
              border: '1px solid ' + BORDER,
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