import AdSlot from '../AdSlot.jsx'

export default function RailAdSlot({ slotKey, reservedHeight = 250 }) {
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#bbb',
          margin: '0 0 8px 2px',
        }}
      >
        Sponsored
      </div>

      <div
        style={{
          minHeight: reservedHeight,
          overflow: 'hidden',
        }}
      >
        <AdSlot slotKey={slotKey} />
      </div>
    </div>
  )
}