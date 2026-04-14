export default function HomePageBand({ children, style }) {
  return (
    <div
      style={{
        padding: '24px 0',
        marginTop: 36,
        background: '#F7F5F1',
        borderTop: '1px solid #ede9e3',
        borderBottom: '1px solid #ede9e3',
        ...style,
      }}
    >
      {children}
    </div>
  )
}