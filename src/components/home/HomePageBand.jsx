export default function HomePageBand({ children, style }) {
  return (
    <div
      style={{
        padding: '24px 0',
        marginTop: 36,
        background: '#fafbfc',
        borderTop: '1px solid #f1f3f5',
        borderBottom: '1px solid #f1f3f5',
        ...style,
      }}
    >
      {children}
    </div>
  )
}