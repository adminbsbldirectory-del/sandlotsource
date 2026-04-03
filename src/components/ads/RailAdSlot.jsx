import AdSlot from '../AdSlot.jsx'

export default function RailAdSlot({ slotKey, reservedHeight = 250 }) {
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
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
          boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
        }}
      >
        <AdSlot slotKey={slotKey} />
      </div>
    </div>
  )
}