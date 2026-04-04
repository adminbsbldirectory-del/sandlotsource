import { normalizeSportValue } from "../../utils/sportUtils";

export default function RatingRow({
  coach,
  selected,
  mobile = false,
  compact = false,
}) {
  const avg = parseFloat(coach.rating_average) || 0;
  const count = parseInt(coach.review_count, 10) || 0;
  const sportValue = normalizeSportValue(coach.sport);
  const icon =
    sportValue === "softball" ? "🥎" : sportValue === "both" ? "🥎⚾" : "⚾";
  const accentColor = selected
    ? mobile
      ? "var(--green)"
      : "var(--gold)"
    : "var(--navy)";

  if (compact) {
    return (
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
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span
          style={{
            fontWeight: count ? 700 : 500,
            color: count ? accentColor : "var(--gray)",
          }}
        >
          {count
            ? `${count} review${count !== 1 ? "s" : ""}`
            : "No reviews yet"}
        </span>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          fontSize: mobile ? 13 : 12.5,
          color: "var(--gray)",
        }}
      >
        <span style={{ fontSize: mobile ? 16 : 14 }}>{icon}</span>
        <span style={{ opacity: 0.72 }}>No reviews yet</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
        fontSize: mobile ? 13 : 12.5,
        color: "var(--gray)",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: mobile ? 16 : 14 }}>{icon}</span>
      <span style={{ fontWeight: 800, color: accentColor }}>
        {avg.toFixed(1)}
      </span>
      <span>
        {count} review{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}