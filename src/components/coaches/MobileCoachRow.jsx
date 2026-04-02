// src/components/coaches/MobileCoachRow.jsx
// Purpose: Mobile coach list row for CoachDirectory.
// Used by: CoachDirectory.jsx
// Refactor phase: Phase 2 presentational extraction

export default function MobileCoachRow({
  coach,
  isSelected = false,
  onSelect,
  onOpenProfile,
  sportBadge,
  primarySpecialty,
  secondarySpecialty,
  location,
  reviewMeta,
}) {
  return (
    <div
      onClick={() => onSelect?.(coach)}
      style={{
        background: "#fff",
        border: isSelected
          ? "1.5px solid var(--gold)"
          : "1px solid rgba(15,23,42,0.08)",
        borderRadius: 16,
        padding: "12px 14px",
        boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
        display: "grid",
        gap: 10,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontSize: 17,
              fontWeight: 800,
              color: "var(--navy)",
              lineHeight: 1.05,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {coach.name}
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--gray)",
              marginTop: 5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            📍 {location || "Location not listed"}
          </div>
        </div>
        <span
          style={{
            background: sportBadge.bg,
            color: sportBadge.color,
            border: `1px solid ${sportBadge.border}`,
            borderRadius: 999,
            padding: "5px 10px",
            fontSize: 10.5,
            fontWeight: 800,
            fontFamily: "var(--font-head)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {sportBadge.label}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <span
              style={{
                background: "#EEF2F7",
                color: "var(--navy)",
                borderRadius: 999,
                padding: "4px 9px",
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              {primarySpecialty}
            </span>
            {secondarySpecialty && (
              <span
                style={{
                  background: "#F6F7F9",
                  color: "var(--gray)",
                  borderRadius: 999,
                  padding: "4px 8px",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {secondarySpecialty}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              fontSize: 12.5,
              color: "var(--gray)",
            }}
          >
            <span style={{ fontSize: 14 }}>{reviewMeta.icon}</span>
            <span
              style={{
                fontWeight: reviewMeta.hasReviews ? 700 : 500,
                color: reviewMeta.hasReviews ? "var(--navy)" : "var(--gray)",
              }}
            >
              {reviewMeta.text}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenProfile(coach);
          }}
          style={{
            background: "var(--navy)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "9px 12px",
            minHeight: 36,
            fontSize: 11.5,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "var(--font-head)",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}