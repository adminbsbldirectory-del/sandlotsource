const LIGHT = '#f5f4f0'
const BORDER = '#e2e0db'

export default function HomePageBand({ children, style }) {
  return (
    <div
      style={{
        background: LIGHT,
        borderTop: '1px solid ' + BORDER,
        borderBottom: '1px solid ' + BORDER,
        padding: '24px 0',
        marginTop: 24,
        ...style,
      }}
    >
      {children}
    </div>
  )
}