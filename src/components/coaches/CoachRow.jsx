export default function CoachRow({
  coach,
  selected,
  onOpen,
  sportBadge,
  specialization,
  location,
  reviewText,
  credentialText,
  featuredBadgeStyle,
}) {
  return (
    <div
      onClick={onOpen}
      style={{
        display: "grid",
        gridTemplateColumns:
          "120px minmax(220px, 1.1fr) minmax(250px, 1.15fr) minmax(240px, 1.1fr) 96px",
        gap: 12,
        alignItems: "center",
        padding: "10px 14px",
        borderTop: "1px solid #E7E5E1",
        background: selected ? "#F9FBFF" : "#fff",
        cursor: "pointer",
      }}
    >
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: sportBadge.bg,
            color: sportBadge.color,
            border: `1px solid ${sportBadge.border}`,
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 800,
            fontFamily: "var(--font-head)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          {sportBadge.label}
        </span>
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 800,
            color: "var(--navy)",
            fontFamily: "var(--font-head)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {coach.name}
        </div>
        <div
          style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}
        >
          {coach.verified_status && (
            <span
              className="badge"
              style={{ background: "#E8F1FF", color: "#1D4ED8" }}
            >
              Verified
            </span>
          )}
          {coach.featured_status && (
            <span
              className="badge"
              style={{
                background: featuredBadgeStyle.background,
                color: featuredBadgeStyle.color,
                border: featuredBadgeStyle.border,
              }}
            >
              ⭐ Featured
            </span>
          )}
          <span style={{ fontSize: 11.5, color: "var(--gray)" }}>
            {reviewText}
          </span>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--navy)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {coach.facility_name || "Independent / Private Lessons"}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--gray)",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {location || "Location not listed"}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--navy)",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {specialization}
        </div>
        {credentialText && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--gray)",
              marginTop: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {credentialText}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          style={{
            minWidth: 76,
            background: selected ? "var(--navy)" : "#fff",
            color: selected ? "#fff" : "var(--navy)",
            border: `1.5px solid ${selected ? "var(--navy)" : "#93A0B3"}`,
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 800,
            fontFamily: "var(--font-head)",
            cursor: "pointer",
          }}
        >
          {selected ? "Close" : "Open"}
        </button>
      </div>
    </div>
  );
}