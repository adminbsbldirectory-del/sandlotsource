export default function MapLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        padding: "6px 14px",
        background: "var(--white)",
        borderBottom: "1px solid var(--lgray)",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--gray)",
        }}
      >
        Map key
      </span>
      {[
        { color: "#2563EB", label: "Baseball Coach" },
        { color: "#FACC15", label: "Softball Coach" },
        {
          color: "conic-gradient(#2563EB 0deg 180deg, #FACC15 180deg 360deg)",
          label: "Baseball & Softball",
        },
      ].map((item) => (
        <div
          key={item.label}
          style={{ display: "flex", alignItems: "center", gap: 5 }}
        >
          <div
            style={{
              width: 11,
              height: 11,
              borderRadius: "50% 50% 50% 0",
              transform: "rotate(-45deg)",
              background: item.color,
              border: "2px solid rgba(255,255,255,0.8)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: "var(--gray)" }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}