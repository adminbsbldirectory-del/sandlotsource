// src/components/coaches/CoachDetailPanel.jsx
// Purpose: Desktop selected-coach preview/detail panel for CoachDirectory.
// Used by: CoachDirectory.jsx
// Refactor phase: Phase 2 presentational extraction

import { Link } from "react-router-dom";
import { FEATURED_BADGE_STYLE } from "../../constants/featuredBadgeStyle";
import { normalizeSportValue } from "../../utils/sportUtils";

function getSportBadgeMeta(value) {
  const sport = normalizeSportValue(value);
  if (sport === "both")
    return {
      key: "both",
      label: "Baseball & Softball",
      bg: "#E7EEF9",
      color: "#1D3E73",
      border: "#C8D5E8",
    };
  if (sport === "softball")
    return {
      key: "softball",
      label: "Softball",
      bg: "#F3F0D7",
      color: "#5F5A17",
      border: "#DDD59A",
    };
  return {
    key: "baseball",
    label: "Baseball",
    bg: "#E8EEF8",
    color: "#173B73",
    border: "#C7D3E8",
  };
}

function parseFirstPhone(raw) {
  if (!raw) return null;
  return raw.split(/[\/,]/)[0].trim() || null;
}

function parseSpecialties(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCoachZip(coach) {
  return coach.zip || coach.zip_code || "";
}

function normalizeUrl(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (/^(javascript|data|file|intent):/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function formatCoachLocation(coach) {
  const zip = getCoachZip(coach);
  const line = [coach.city, coach.state].filter(Boolean).join(", ");
  return [line, zip].filter(Boolean).join(" ");
}

function formatCoachFullAddress(coach) {
  const cityState = [coach.city, coach.state].filter(Boolean).join(", ");
  return [coach.address, cityState, getCoachZip(coach)]
    .filter(Boolean)
    .join(" ");
}

function priceLabel(coach) {
  if (coach.price_per_session) return `$${coach.price_per_session}/session`;
  if (coach.price_notes) return coach.price_notes;
  return "Contact for rates";
}

function reviewLabel(coach) {
  const avg = parseFloat(coach.rating_average) || 0;
  const count = parseInt(coach.review_count, 10) || 0;
  if (!count) return "No reviews yet";
  return `${avg.toFixed(1)} · ${count} review${count !== 1 ? "s" : ""}`;
}

export default function CoachDetailPanel({
  coach,
  onClose,
  onViewProfile,
  distanceMi,
}) {
  if (!coach) return null;

  const sportBadge = getSportBadgeMeta(coach.sport);
  const specialties = parseSpecialties(coach.specialty);
  const firstPhone = parseFirstPhone(coach.phone);
  const website = normalizeUrl(coach.website);
  const facilityWebsite = normalizeUrl(coach.facility_website);
  const location = formatCoachLocation(coach);
  const fullAddress = formatCoachFullAddress(coach);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.18)",
          zIndex: 2100,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(720px, calc(100vw - 48px))",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 30px 60px rgba(15,23,42,0.22)",
          border: "1px solid rgba(15,23,42,0.08)",
          padding: "22px 22px 20px",
          zIndex: 2200,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  background: sportBadge.bg,
                  color: sportBadge.color,
                  border: `1px solid ${sportBadge.border}`,
                  borderRadius: 999,
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: "var(--font-head)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {sportBadge.label}
              </span>
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
                    background: FEATURED_BADGE_STYLE.background,
                    color: FEATURED_BADGE_STYLE.color,
                    border: FEATURED_BADGE_STYLE.border,
                  }}
                >
                  ⭐ Featured
                </span>
              )}
              {coach.recommendation_count > 0 && (
                <span
                  className="badge"
                  style={{ background: "#ECFDF3", color: "#166534" }}
                >
                  {coach.recommendation_count} rec
                  {coach.recommendation_count !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-head)",
                fontSize: 32,
                lineHeight: 1.05,
                color: "var(--navy)",
                fontWeight: 800,
              }}
            >
              {coach.name}
            </div>
            {coach.facility_id ? (
              <Link
                to={`/facilities/${coach.facility_id}`}
                onClick={onClose}
                style={{
                  marginTop: 6,
                  display: "inline-block",
                  fontSize: 15,
                  color: "#1D4ED8",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                {coach.facility_name || "Independent / Private Lessons"}
              </Link>
            ) : (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 15,
                  color: "var(--navy)",
                  fontWeight: 700,
                }}
              >
                {coach.facility_name || "Independent / Private Lessons"}
              </div>
            )}
            {(fullAddress || location) && (
              <div style={{ marginTop: 4, fontSize: 14, color: "var(--gray)" }}>
                {fullAddress || location}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              border: "1px solid #D6D3D1",
              background: "#fff",
              color: "#334155",
              fontSize: 18,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(260px, 0.9fr)",
            gap: 16,
            marginTop: 18,
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gray)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                }}
              >
                Specialization
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {specialties.length > 0 ? (
                  specialties.map((item) => (
                    <span
                      key={item}
                      style={{
                        background: "#EEF2F7",
                        color: "#334155",
                        borderRadius: 999,
                        padding: "5px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--navy)",
                      fontWeight: 700,
                    }}
                  >
                    General coaching
                  </span>
                )}
              </div>
              {coach.credentials && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: "var(--gray)",
                  }}
                >
                  {coach.credentials}
                </div>
              )}
            </div>

            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gray)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                }}
              >
                Pricing & reputation
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--navy)",
                    fontWeight: 800,
                  }}
                >
                  {priceLabel(coach)}
                </div>
                <div style={{ fontSize: 13, color: "var(--gray)" }}>
                  {reviewLabel(coach)}
                </div>
                {distanceMi != null && (
                  <div style={{ fontSize: 13, color: "var(--gray)" }}>
                    {distanceMi.toFixed(1)} miles from your ZIP search
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gray)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                }}
              >
                Contact / details
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {coach.email && (
                  <a
                    href={`mailto:${coach.email}`}
                    style={{
                      color: "#1D4ED8",
                      fontWeight: 700,
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    {coach.email}
                  </a>
                )}
                {firstPhone && (
                  <a
                    href={`tel:${firstPhone.replace(/\D/g, "")}`}
                    style={{
                      color: "var(--navy)",
                      fontWeight: 800,
                      textDecoration: "none",
                      fontSize: 15,
                    }}
                  >
                    {firstPhone}
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1D4ED8",
                      fontWeight: 700,
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    Coach website
                  </a>
                )}
                {!coach.email && !firstPhone && !website && (
                  <div style={{ fontSize: 14, color: "var(--gray)" }}>
                    Use the profile page for more information.
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 16,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--gray)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 800,
                }}
              >
                Location
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                {coach.facility_id ? (
                  <Link
                    to={`/facilities/${coach.facility_id}`}
                    onClick={onClose}
                    style={{
                      fontSize: 14,
                      color: "#1D4ED8",
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    {coach.facility_name || "Independent / Private Lessons"}
                  </Link>
                ) : (
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--navy)",
                      fontWeight: 800,
                    }}
                  >
                    {coach.facility_name || "Independent / Private Lessons"}
                  </div>
                )}
                {(fullAddress || location) && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--gray)",
                      lineHeight: 1.45,
                    }}
                  >
                    {fullAddress || location}
                  </div>
                )}
                {coach.facility_id && (
                  <Link
                    to={`/facilities/${coach.facility_id}`}
                    onClick={onClose}
                    style={{
                      color: "#1D4ED8",
                      fontWeight: 700,
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    View facility page
                  </Link>
                )}
                {facilityWebsite && (
                  <a
                    href={facilityWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#1D4ED8",
                      fontWeight: 700,
                      textDecoration: "none",
                      fontSize: 14,
                    }}
                  >
                    Facility website
                  </a>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onViewProfile(coach)}
              style={{
                width: "100%",
                background: "var(--navy)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "12px 14px",
                fontSize: 13,
                fontWeight: 800,
                fontFamily: "var(--font-head)",
                cursor: "pointer",
              }}
            >
              View Profile &amp; Reviews
            </button>
          </div>
        </div>
      </div>
    </>
  );
}