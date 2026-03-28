import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../supabase.js";
import CoachProfile from "./CoachProfile.jsx";
import AdSlot from "./AdSlot.jsx";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HEADER_H = 75;

function normalizeSportValue(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  if (raw === "baseball" || raw === "softball" || raw === "both") return raw;
  if (raw.includes("baseball") && raw.includes("softball")) return "both";
  if (raw.includes("softball")) return "softball";
  if (raw.includes("baseball")) return "baseball";
  return raw;
}

function sportPinBackground(value) {
  const sport = normalizeSportValue(value);
  if (sport === "softball") return "#FACC15";
  if (sport === "both")
    return "conic-gradient(#2563EB 0deg 180deg, #FACC15 180deg 360deg)";
  return "#2563EB";
}

function makePinIcon(background, selected = false) {
  const size = selected ? 38 : 30;
  const inner = selected ? 30 : 22;
  const border = selected ? "#F0A500" : "#FFFFFF";
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${background};border:4px solid ${border};transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.32);display:flex;align-items:center;justify-content:center;"><div style="width:${inner}px;height:${inner}px;border-radius:50%;background:rgba(255,255,255,0.18);"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 8],
  });
}

const SPECIALTIES = [
  "All Specialties",
  "Pitching",
  "Hitting",
  "Catching",
  "Fielding",
  "Strength / Conditioning",
];

const US_STATES = [
  "All States",
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

const RADIUS_OPTIONS = [
  { value: 10, label: "Within 10 mi" },
  { value: 25, label: "Within 25 mi" },
  { value: 50, label: "Within 50 mi" },
];

const FEATURED_BADGE_STYLE = {
  background: "#FEF3C7",
  color: "#92400E",
  border: "1px solid #FDE68A",
};

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

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null;
  try {
    const res = await fetch("https://api.zippopotam.us/us/" + zip);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data.places && data.places[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      state: place["state abbreviation"] || "",
      city: place["place name"] || "",
    };
  } catch {
    return null;
  }
}

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCoach(coach) {
  return {
    ...coach,
    id: coach.id == null ? "" : String(coach.id).trim(),
    facility_id:
      coach.facility_id == null ? null : String(coach.facility_id).trim(),
    lat: toNumber(coach.lat ?? coach.latitude),
    lng: toNumber(coach.lng ?? coach.longitude),
    zip: coach.zip || coach.zip_code || "",
    specialty: parseSpecialties(coach.specialty),
  };
}

function normalizeFacility(facility) {
  return {
    ...facility,
    id: facility.id == null ? "" : String(facility.id).trim(),
    lat: toNumber(facility.lat),
    lng: toNumber(facility.lng),
    zip: facility.zip_code || "",
    website: facility.website || "",
  };
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

function credentialSnippet(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.length > 150 ? `${raw.slice(0, 150)}…` : raw;
}

function FlyTo({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 13, { duration: 0.8 });
    }
  }, [lat, lng, map]);

  return null;
}

function FitBounds({ points, selectedId }) {
  const map = useMap();

  useEffect(() => {
    if (selectedId) return;

    const pts = (points || []).filter((c) => c.lat != null && c.lng != null);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 12);
      return;
    }

    const bounds = L.latLngBounds(pts.map((c) => [c.lat, c.lng]));
    const t = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }, 50);

    return () => clearTimeout(t);
  }, [points, selectedId, map]);

  return null;
}

function aggregateSportValue(items) {
  const sports = new Set(
    (items || [])
      .map((item) => normalizeSportValue(item.sport))
      .filter(Boolean),
  );
  if (sports.has("both") || (sports.has("baseball") && sports.has("softball")))
    return "both";
  if (sports.has("softball")) return "softball";
  return "baseball";
}

function buildMarkerGroups(coaches) {
  const map = new Map();

  for (const coach of coaches || []) {
    if (coach.lat == null || coach.lng == null) continue;

    const key = coach.facility_id
      ? `facility:${coach.facility_id}`
      : `coord:${coach.lat}:${coach.lng}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        id: coach.facility_id || coach.id,
        lat: coach.lat,
        lng: coach.lng,
        facility_id: coach.facility_id || null,
        facility_name: coach.facility_name || "",
        city: coach.city || "",
        state: coach.state || "",
        zip: getCoachZip(coach),
        coaches: [],
      });
    }

    map.get(key).coaches.push(coach);
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    sport: aggregateSportValue(group.coaches),
  }));
}

function MapMarkers({ groups, selected, setSelected, onViewCoach }) {
  return groups.map((group) => {
    const selectedCoach =
      group.coaches.find((coach) => coach.id === selected) || null;
    const primaryCoach = selectedCoach || group.coaches[0];
    const isSelected = !!selectedCoach;
    const locationLine = [group.city, group.state].filter(Boolean).join(", ");

    return (
      <Marker
        key={group.key}
        position={[group.lat, group.lng]}
        icon={makePinIcon(sportPinBackground(group.sport), isSelected)}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{ click: () => setSelected(primaryCoach.id) }}
      >
        <Popup>
          <div style={{ fontFamily: "var(--font-body)", minWidth: 220 }}>
            <strong style={{ fontFamily: "var(--font-head)", fontSize: 15 }}>
              {group.facility_name || primaryCoach.name}
            </strong>
            {locationLine && (
              <div style={{ fontSize: 12, marginTop: 4 }}>
                📍 {locationLine}
                {group.zip ? ` ${group.zip}` : ""}
              </div>
            )}
            <div
              style={{
                fontSize: 12,
                color: "#666",
                marginTop: 6,
                fontWeight: 700,
              }}
            >
              {group.coaches.length} coach
              {group.coaches.length !== 1 ? "es" : ""} at this location
            </div>
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {group.coaches.map((coach) => {
                const specs = parseSpecialties(coach.specialty);
                const active = coach.id === selected;
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => setSelected(coach.id)}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: active
                        ? "2px solid var(--gold)"
                        : "1px solid #E5E7EB",
                      background: active ? "var(--navy)" : "#fff",
                      color: active ? "#fff" : "var(--navy)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {coach.name}
                    </div>
                    {specs.length > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 2,
                          opacity: active ? 0.92 : 0.72,
                        }}
                      >
                        {specs.join(", ")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onViewCoach(primaryCoach)}
              style={{
                marginTop: 8,
                width: "100%",
                background: "var(--navy)",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View Coach Profile
            </button>
          </div>
        </Popup>
      </Marker>
    );
  });
}

function RatingRow({ coach, selected, mobile = false, compact = false }) {
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

function CoachCard({
  coach,
  selected,
  onClick,
  onViewProfile,
  mobile = false,
}) {
  const specs = parseSpecialties(coach.specialty);
  const firstPhone = parseFirstPhone(coach.phone);
  const zip = getCoachZip(coach);
  const sportBadge = getSportBadgeMeta(coach.sport);
  const locationLine = [coach.city, coach.state].filter(Boolean).join(", ");
  const primarySpecialty = specs[0] || "General coaching";
  const secondarySpecialties = specs.slice(1, 3);

  if (mobile && !selected) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 14,
          boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
          padding: "12px 12px 10px",
          cursor: "pointer",
        }}
        onClick={onClick}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-head)",
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: "0.01em",
                lineHeight: 1.08,
                color: "var(--navy)",
              }}
            >
              {coach.name}
            </div>
            <div
              style={{
                fontSize: 13.5,
                color: "var(--gray)",
                marginTop: 5,
                lineHeight: 1.25,
              }}
            >
              📍 {locationLine || "Location not listed"}
              {zip ? ` ${zip}` : ""}
            </div>
          </div>

          <span
            style={{
              background: sportBadge.bg,
              color: sportBadge.color,
              fontSize: 10.5,
              fontWeight: 800,
              padding: "5px 9px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-head)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: `1px solid ${sportBadge.border}`,
            }}
          >
            {sportBadge.label}
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  background: "#EEF2F7",
                  color: "var(--navy)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: "4px 9px",
                  borderRadius: 999,
                }}
              >
                {primarySpecialty}
              </span>
              {secondarySpecialties.slice(0, 1).map((item) => (
                <span
                  key={item}
                  style={{
                    background: "#F6F7F9",
                    color: "var(--gray)",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 999,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
            <RatingRow coach={coach} selected={false} mobile compact />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(coach);
            }}
            style={{
              background: "var(--navy)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              minHeight: 34,
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

  const mobileBase = mobile
    ? {
        borderRadius: 18,
        overflow: "hidden",
        border: selected
          ? "2px solid var(--gold)"
          : "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
        background: selected ? "var(--navy)" : "var(--white)",
      }
    : {};

  const cardStyle = selected
    ? mobile
      ? {
          ...mobileBase,
          color: "var(--navy)",
          cursor: "pointer",
          transition: "all 0.15s",
          marginBottom: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--white)",
          border: "2px solid var(--gold)",
          boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
        }
      : {
          ...mobileBase,
          color: "var(--white)",
          cursor: "pointer",
          transition: "all 0.15s",
          marginBottom: 10,
          display: "flex",
          flexDirection: "column",
        }
    : mobile
      ? {
          ...mobileBase,
          marginBottom: 0,
          cursor: "pointer",
        }
      : {
          marginBottom: 10,
          cursor: "pointer",
        };

  const bodyStyle = selected
    ? mobile
      ? { flex: 1, padding: "18px 18px 16px" }
      : { flex: 1, padding: "14px 16px" }
    : mobile
      ? { padding: "18px 18px 16px" }
      : undefined;

  const footerStyle = selected
    ? mobile
      ? {
          padding: "0 18px 18px",
          borderTop: "none",
          background: "transparent",
          borderRadius: "0 0 18px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }
      : {
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.05)",
          borderRadius: "0 0 var(--card-radius) var(--card-radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }
    : mobile
      ? { padding: "0 18px 18px" }
      : undefined;

  const titleSize = mobile ? 19 : 17;
  const metaSize = mobile ? 14 : 13;

  return (
    <div
      className={!mobile && !selected ? "card" : ""}
      style={cardStyle}
      onClick={onClick}
    >
      <div
        className={!mobile && !selected ? "card-body" : ""}
        style={bodyStyle}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-head)",
                fontSize: titleSize,
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1.15,
              }}
            >
              {coach.name}
            </div>

            {(coach.verified_status || coach.featured_status) && (
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                {coach.verified_status && (
                  <span
                    className="badge"
                    style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                  >
                    ✓ Verified
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
              </div>
            )}

            {coach.facility_name && (
              <div style={{ fontSize: metaSize, opacity: 0.76, marginTop: 6 }}>
                {coach.facility_name}
              </div>
            )}

            <div
              style={{
                fontSize: metaSize,
                marginTop: 5,
                opacity: 0.84,
                lineHeight: 1.35,
              }}
            >
              📍 {[coach.city, coach.state].filter(Boolean).join(", ")}
              {zip ? ` ${zip}` : ""}
            </div>
          </div>

          <span
            style={{
              background: sportBadge.bg,
              color: sportBadge.color,
              fontSize: mobile ? 11.5 : 11,
              fontWeight: 700,
              padding: mobile ? "5px 10px" : "4px 10px",
              borderRadius: 20,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontFamily: "var(--font-head)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              border: mobile ? `1px solid ${sportBadge.border}` : undefined,
            }}
          >
            {sportBadge.label}
          </span>
        </div>

        <RatingRow coach={coach} selected={selected} mobile={mobile} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: mobile ? 10 : 8,
          }}
        >
          {specs.map((s) => (
            <span
              key={s}
              style={{
                background: selected
                  ? mobile
                    ? "#EEF2F7"
                    : "rgba(255,255,255,0.15)"
                  : "var(--lgray)",
                color: selected
                  ? mobile
                    ? "var(--navy)"
                    : "white"
                  : "var(--gray)",
                fontSize: mobile ? 11.5 : 11,
                padding: mobile ? "4px 9px" : "2px 8px",
                borderRadius: 20,
                textTransform: "capitalize",
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {coach.credentials && (
          <div
            style={{
              fontSize: mobile ? 13 : 12,
              marginTop: 10,
              opacity: 0.78,
              lineHeight: 1.45,
            }}
          >
            {coach.credentials.length > (mobile ? 130 : 80)
              ? coach.credentials.slice(0, mobile ? 130 : 80) + "…"
              : coach.credentials}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            marginTop: 10,
            fontSize: mobile ? 13 : 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: selected ? "var(--gold)" : "var(--green)",
              fontWeight: 700,
            }}
          >
            {priceLabel(coach)}
          </span>
          {coach.recommendation_count > 0 && (
            <span style={{ opacity: 0.68 }}>
              👍 {coach.recommendation_count} rec
              {coach.recommendation_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!mobile && (coach.email || firstPhone || coach.website) && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop:
                "1px solid " +
                (selected ? "rgba(255,255,255,0.15)" : "var(--lgray)"),
              display: "flex",
              flexDirection: "column",
              gap: mobile ? 6 : 3,
            }}
          >
            {coach.email && (
              <a
                href={"mailto:" + coach.email}
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: selected ? "var(--gold)" : "#1D4ED8",
                  fontSize: mobile ? 13.5 : undefined,
                }}
              >
                📧 {coach.email}
              </a>
            )}
            {firstPhone && (
              <a
                href={"tel:" + firstPhone.replace(/\D/g, "")}
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: selected ? "var(--gold)" : "var(--navy)",
                  fontSize: mobile ? 13.5 : undefined,
                }}
              >
                📞 {firstPhone}
              </a>
            )}
            {coach.website && (
              <a
                href={
                  coach.website.startsWith("http")
                    ? coach.website
                    : "https://" + coach.website
                }
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: selected ? "var(--gold)" : "#1D4ED8",
                  fontSize: mobile ? 13.5 : undefined,
                }}
              >
                🌐 Website
              </a>
            )}
          </div>
        )}
      </div>

      <div
        className={!mobile && !selected ? "card-footer" : ""}
        style={footerStyle}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(coach);
          }}
          style={{
            width: mobile ? "auto" : "100%",
            minWidth: mobile ? 168 : undefined,
            background: selected
              ? mobile
                ? "var(--navy)"
                : "var(--gold)"
              : "var(--navy)",
            color: "white",
            border: "none",
            borderRadius: mobile ? 12 : "var(--btn-radius)",
            padding: mobile ? "11px 14px" : "8px 0",
            minHeight: mobile ? 42 : undefined,
            fontSize: mobile ? 13 : 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-head)",
            letterSpacing: "0.04em",
          }}
        >
          {mobile ? "View Profile" : "View Profile & Reviews"}
        </button>
      </div>
    </div>
  );
}

function MobileCoachRow({
  coach,
  onOpenProfile,
  onSelect,
  isSelected = false,
}) {
  const sportBadge = getSportBadgeMeta(coach.sport);
  const specialties = parseSpecialties(coach.specialty);
  const primary = specialties[0] || "General coaching";
  const secondary = specialties[1] || null;
  const location = formatCoachLocation(coach);

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
              {primary}
            </span>
            {secondary && (
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
                {secondary}
              </span>
            )}
          </div>
          <RatingRow coach={coach} selected={false} mobile compact />
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

function MapLegend() {
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
  );
}

function DirectoryAdBand({
  slotKey,
  maxWidth,
  reservedHeight,
  isMobile,
  marginTop = 24,
}) {
  return (
    <div
      style={{
        background: "#F5F4F0",
        borderTop: "1px solid #E2E0DB",
        borderBottom: "1px solid #E2E0DB",
        padding: isMobile ? "16px 0" : "18px 0",
        marginTop,
      }}
    >
      <div style={{ padding: isMobile ? "0 12px" : "0 14px" }}>
        <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--gray)",
              margin: "0 0 8px 2px",
            }}
          >
            Sponsored
          </div>

          <div
            style={{
              minHeight: reservedHeight,
              background: "#fff",
              border: "1px solid #E2E0DB",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <AdSlot slotKey={slotKey} />
          </div>
        </div>
      </div>
    </div>
  );
}

function RailAdSlot({ slotKey, reservedHeight = 250 }) {
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--gray)",
          margin: "0 0 8px 2px",
        }}
      >
        Sponsored
      </div>

      <div
        style={{
          minHeight: reservedHeight,
          background: "#fff",
          border: "1px solid #E2E0DB",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
        }}
      >
        <AdSlot slotKey={slotKey} />
      </div>
    </div>
  );
}

function EmptyState({ facilityContextName, hasLocationSearch }) {
  if (!facilityContextName && !hasLocationSearch) {
    return (
      <div className="empty-state">
        <h3>Start with your ZIP code</h3>
        <p>
          Enter a ZIP code and choose a radius to see coaches near you first.
        </p>
      </div>
    );
  }

  return (
    <div className="empty-state">
      <h3>
        {facilityContextName
          ? "No linked coaches found"
          : "No coaches match your filters"}
      </h3>
      <p>
        {facilityContextName
          ? `We couldn’t find approved active coaches linked to ${facilityContextName}.`
          : "Try changing your search, widening the radius, or clearing one of the filters."}
      </p>
    </div>
  );
}

function CoachRow({ coach, selected, onOpen }) {
  const sportBadge = getSportBadgeMeta(coach.sport);
  const specialties = parseSpecialties(coach.specialty);
  const specialization = specialties.length
    ? specialties.join(" · ")
    : "General coaching";
  const location = formatCoachLocation(coach);

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
                background: FEATURED_BADGE_STYLE.background,
                color: FEATURED_BADGE_STYLE.color,
                border: FEATURED_BADGE_STYLE.border,
              }}
            >
              ⭐ Featured
            </span>
          )}
          <span style={{ fontSize: 11.5, color: "var(--gray)" }}>
            {reviewLabel(coach)}
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
        {coach.credentials && (
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
            {credentialSnippet(coach.credentials)}
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

function CoachDetailPanel({ coach, onClose, onViewProfile, distanceMi }) {
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

export default function CoachDirectory() {
  const [searchParams] = useSearchParams();

  const [coaches, setCoaches] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(
    () => searchParams.get("select") || null,
  );
  const [sport, setSport] = useState("Both");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [state, setState] = useState("All States");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [profileCoach, setProfileCoach] = useState(null);
  const [showMap, setShowMap] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [zip, setZip] = useState("");
  const [geoCenter, setGeoCenter] = useState(null);
  const [zipStatus, setZipStatus] = useState("");
  const [radius, setRadius] = useState(25);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileView, setMobileView] = useState("list");

  const selectedFromUrl = searchParams.get("select") || null;
  const facilityFromUrl = searchParams.get("facility") || null;

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    if (selectedFromUrl) {
      setMobileView("list");
      setShowMobileFilters(false);
    }
  }, [isMobile, selectedFromUrl]);

  const applySearch = () => {
    setSearch(searchInput.trim());
    if (isMobile) {
      setMobileView("list");
      setShowMobileFilters(false);
    }
  };

  const onSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applySearch();
    }
  };

  async function applyZipSearch() {
    if (zip.length !== 5) {
      setGeoCenter(null);
      setZipStatus(zip ? "error" : "");
      return false;
    }

    const geo = await geocodeZip(zip);
    if (geo) {
      setGeoCenter(geo);
      setZipStatus("ok");
      if (state === "All States" && geo.state) {
        setState(geo.state);
      }
      setSelected(null);
      if (isMobile) {
        setMobileView("list");
      }
      return true;
    }

    setGeoCenter(null);
    setZipStatus("error");
    return false;
  }

  function clearZipFilter() {
    setZip("");
    setGeoCenter(null);
    setZipStatus("");
    setRadius(25);
  }

  function clearAllMobileFilters() {
    setSport("Both");
    setSpecialty("All Specialties");
    setState("All States");
    setSearchInput("");
    setSearch("");
    clearZipFilter();
  }

  useEffect(() => {
    setSelected(selectedFromUrl);
  }, [selectedFromUrl]);

  useEffect(() => {
    async function load() {
      const [
        { data: coachData, error: coachError },
        { data: facilityData, error: facilityError },
      ] = await Promise.all([
        supabase
          .from("coaches")
          .select("*")
          .eq("active", true)
          .in("approval_status", ["approved", "seeded"]),
        supabase
          .from("facilities")
          .select("id, name, lat, lng, address, city, state, zip_code, website")
          .eq("active", true)
          .in("approval_status", ["approved", "seeded"]),
      ]);

      const normalizedCoachesLoaded =
        !coachError && coachData ? coachData.map(normalizeCoach) : [];
      const normalizedFacilitiesLoaded =
        !facilityError && facilityData
          ? facilityData.map(normalizeFacility)
          : [];

      setCoaches(normalizedCoachesLoaded);
      setFacilities(normalizedFacilitiesLoaded);

      if (selectedFromUrl) {
        const match = normalizedCoachesLoaded.find(
          (c) => c.id === selectedFromUrl,
        );
        if (match) setSelected(match.id);
      }

      setLoading(false);
    }

    load();
  }, [selectedFromUrl]);

  const facilityMap = useMemo(() => {
    const map = new Map();
    for (const facility of facilities) {
      map.set(facility.id, facility);
    }
    return map;
  }, [facilities]);

  const facilityContext = useMemo(() => {
    if (!facilityFromUrl) return null;
    return facilityMap.get(String(facilityFromUrl).trim()) || null;
  }, [facilityFromUrl, facilityMap]);

  const resolvedCoaches = useMemo(() => {
    return coaches.map((coach) => {
      if (!coach.facility_id) return coach;

      const linkedFacility = facilityMap.get(coach.facility_id);
      if (!linkedFacility) return coach;

      return {
        ...coach,
        lat: linkedFacility.lat != null ? linkedFacility.lat : coach.lat,
        lng: linkedFacility.lng != null ? linkedFacility.lng : coach.lng,
        coord_source:
          linkedFacility.lat != null && linkedFacility.lng != null
            ? "facility"
            : coach.coord_source,
        facility_name: coach.facility_name || linkedFacility.name || "",
        address: linkedFacility.address || coach.address || "",
        city: linkedFacility.city || coach.city || "",
        state: linkedFacility.state || coach.state || "",
        zip: linkedFacility.zip || coach.zip || coach.zip_code || "",
        facility_website:
          linkedFacility.website || coach.facility_website || "",
      };
    });
  }, [coaches, facilityMap]);

  const baseFiltered = useMemo(() => {
    if (!geoCenter && !facilityFromUrl) return [];

    return resolvedCoaches
      .filter((c) => {
        const specs = c.specialty || [];
        const normalizedSport = normalizeSportValue(c.sport);

        if (
          sport !== "Both" &&
          normalizedSport !== sport &&
          normalizedSport !== "both"
        )
          return false;
        if (specialty !== "All Specialties" && !specs.includes(specialty))
          return false;
        if (state !== "All States" && (c.state || "").toUpperCase() !== state)
          return false;

        if (search) {
          const q = search.toLowerCase();
          if (
            !(c.name || "").toLowerCase().includes(q) &&
            !(c.city || "").toLowerCase().includes(q) &&
            !(c.facility_name || "").toLowerCase().includes(q) &&
            !String(c.zip || c.zip_code || "").includes(q)
          ) {
            return false;
          }
        }

        if (geoCenter && c.lat != null && c.lng != null) {
          if (
            distanceMiles(geoCenter.lat, geoCenter.lng, c.lat, c.lng) > radius
          )
            return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aFeatured = !!a.featured_status;
        const bFeatured = !!b.featured_status;
        if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;

        const aVerified = !!a.verified_status;
        const bVerified = !!b.verified_status;
        if (aVerified !== bVerified) return aVerified ? -1 : 1;

        if (
          geoCenter &&
          a.lat != null &&
          a.lng != null &&
          b.lat != null &&
          b.lng != null
        ) {
          const distA = distanceMiles(
            geoCenter.lat,
            geoCenter.lng,
            a.lat,
            a.lng,
          );
          const distB = distanceMiles(
            geoCenter.lat,
            geoCenter.lng,
            b.lat,
            b.lng,
          );
          if (distA !== distB) return distA - distB;
        }

        const aReviews = parseInt(a.review_count, 10) || 0;
        const bReviews = parseInt(b.review_count, 10) || 0;
        if (aReviews !== bReviews) return bReviews - aReviews;

        const aRating = parseFloat(a.rating_average) || 0;
        const bRating = parseFloat(b.rating_average) || 0;
        if (aRating !== bRating) return bRating - aRating;

        return (a.name || "").localeCompare(b.name || "");
      });
  }, [
    resolvedCoaches,
    sport,
    specialty,
    state,
    search,
    geoCenter,
    radius,
    facilityFromUrl,
  ]);

  const filtered = useMemo(() => {
    if (!facilityFromUrl) return baseFiltered;
    const normalizedFacilityId = String(facilityFromUrl).trim();
    return baseFiltered.filter((c) => c.facility_id === normalizedFacilityId);
  }, [baseFiltered, facilityFromUrl]);

  const displayedCoaches = filtered;

  const mappable = useMemo(
    () => filtered.filter((c) => c.lat != null && c.lng != null),
    [filtered],
  );
  const markerGroups = useMemo(() => buildMarkerGroups(mappable), [mappable]);

  const sel = useMemo(() => {
    if (!selected) return null;
    return (
      filtered.find((c) => c.id === selected) ||
      resolvedCoaches.find((c) => c.id === selected) ||
      null
    );
  }, [selected, filtered, resolvedCoaches]);

  useEffect(() => {
    if (selected && !filtered.some((c) => c.id === selected)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  function getDistance(coach) {
    if (!geoCenter || coach.lat == null || coach.lng == null) return null;
    return distanceMiles(geoCenter.lat, geoCenter.lng, coach.lat, coach.lng);
  }

  const mobileActiveFilterCount = useMemo(() => {
    let count = 0;
    if (sport !== "Both") count += 1;
    if (specialty !== "All Specialties") count += 1;
    if (state !== "All States") count += 1;
    if (geoCenter) count += 1;
    return count;
  }, [sport, specialty, state, geoCenter]);

  const hasLocationSearch = !!geoCenter || !!facilityContext;
  const mobileShowMap = isMobile ? mobileView === "map" : showMap;

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "var(--input-radius)",
    border: "1.5px solid var(--lgray)",
    background: "var(--white)",
    fontSize: 13,
    color: "var(--navy)",
    fontFamily: "var(--font-body)",
    outline: "none",
    boxSizing: "border-box",
  };

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "var(--gray)",
    marginBottom: 6,
    display: "block",
  };

  const handleSelectCoach = (coachId) => {
    const nextId = selected === coachId ? null : coachId;
    setSelected(nextId);
    if (typeof window !== "undefined" && nextId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMobileRowSelect = (coach) => {
    setSelected(coach.id);
  };

  return (
    <>
      {profileCoach && (
        <CoachProfile
          coach={profileCoach}
          onClose={() => setProfileCoach(null)}
        />
      )}
      {!isMobile && !profileCoach && sel && (
        <CoachDetailPanel
          coach={sel}
          onClose={() => setSelected(null)}
          onViewProfile={(coach) => {
            setSelected(null);
            setProfileCoach(coach);
          }}
          distanceMi={getDistance(sel)}
        />
      )}

      {isMobile ? (
        <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
          <div style={{ padding: "10px 12px 8px" }}>
            <div
              style={{
                background: "var(--white)",
                border: "1px solid rgba(15,23,42,0.07)",
                borderRadius: 18,
                padding: "14px 14px 12px",
                boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-head)",
                      fontSize: 22,
                      lineHeight: 1.05,
                      fontWeight: 800,
                      color: "var(--navy)",
                    }}
                  >
                    Coach Directory
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--gray)",
                      marginTop: 4,
                      lineHeight: 1.35,
                    }}
                  >
                    {hasLocationSearch
                      ? `${displayedCoaches.length} coach${displayedCoaches.length !== 1 ? "es" : ""} near you`
                      : `${resolvedCoaches.length} coaches ready to browse`}
                  </div>
                </div>
                <a
                  href="/submit"
                  style={{
                    borderRadius: 999,
                    background: "var(--red)",
                    color: "#fff",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "9px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: "var(--font-head)",
                    whiteSpace: "nowrap",
                  }}
                >
                  + Add Coach
                </a>
              </div>

              {facilityContext && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "11px 12px",
                    borderRadius: 14,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--gray)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Facility context
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--navy)",
                      fontWeight: 800,
                      marginTop: 4,
                    }}
                  >
                    {facilityContext.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--gray)",
                      marginTop: 3,
                    }}
                  >
                    Showing only coaches linked to this facility.
                  </div>
                  <Link
                    to={`/facilities/${facilityContext.id}`}
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      color: "#1D4ED8",
                      fontWeight: 700,
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    ← Back to Facility
                  </Link>
                </div>
              )}

              {!facilityContext && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={sectionLabel}>ZIP code</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 30350"
                      maxLength={5}
                      value={zip}
                      onChange={(e) => {
                        const next = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 5);
                        setZip(next);
                        if (next.length < 5) {
                          setGeoCenter(null);
                          setZipStatus("");
                          if (state !== "All States") setState("All States");
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          await applyZipSearch();
                        }
                      }}
                      style={{
                        ...inputStyle,
                        minHeight: 46,
                        fontSize: 15,
                        minWidth: 0,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 8,
                      alignItems: "end",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={sectionLabel}>Radius</div>
                      <select
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        style={{
                          ...inputStyle,
                          minHeight: 46,
                          fontSize: 15,
                          minWidth: 0,
                        }}
                      >
                        {RADIUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={applyZipSearch}
                      style={{
                        minHeight: 46,
                        borderRadius: 12,
                        border: "none",
                        background: "var(--navy)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: "var(--font-head)",
                        padding: "0 14px",
                        whiteSpace: "nowrap",
                        minWidth: 72,
                      }}
                    >
                      Go
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        zipStatus === "error" ? "var(--red)" : "var(--gray)",
                    }}
                  >
                    {zipStatus === "error"
                      ? "Enter a valid 5-digit ZIP code."
                      : hasLocationSearch
                        ? `Showing coaches within ${radius} miles of ${zip}.`
                        : "Start with your ZIP code so local coaches show first."}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMobileView("list");
                    setShowMobileFilters(false);
                  }}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border:
                      mobileView === "list"
                        ? "none"
                        : "1.5px solid var(--navy)",
                    background: mobileView === "list" ? "var(--navy)" : "#fff",
                    color: mobileView === "list" ? "#fff" : "var(--navy)",
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "var(--font-head)",
                  }}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileView("map");
                    setShowMobileFilters(false);
                    setShowMap(true);
                  }}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border:
                      mobileView === "map" ? "none" : "1.5px solid var(--navy)",
                    background: mobileView === "map" ? "var(--navy)" : "#fff",
                    color: mobileView === "map" ? "#fff" : "var(--navy)",
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "var(--font-head)",
                  }}
                >
                  Map
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters((prev) => !prev)}
                  style={{
                    minHeight: 42,
                    borderRadius: 12,
                    border: "1.5px solid var(--navy)",
                    background: showMobileFilters ? "#EEF2FF" : "#fff",
                    color: "var(--navy)",
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "var(--font-head)",
                    padding: "0 12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Filters
                  {mobileActiveFilterCount
                    ? ` (${mobileActiveFilterCount})`
                    : ""}
                </button>
              </div>

              {showMobileFilters && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #E5E7EB",
                    display: "grid",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={sectionLabel}>Search</div>
                    <input
                      placeholder="Name, city, facility, zip..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      style={{ ...inputStyle, minHeight: 46, fontSize: 15 }}
                    />
                  </div>
                  <div>
                    <div style={sectionLabel}>Sport</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        className={
                          "pill-toggle " +
                          (sport === "baseball" ? "active-baseball" : "")
                        }
                        onClick={() =>
                          setSport((s) =>
                            s === "baseball" ? "Both" : "baseball",
                          )
                        }
                        style={{ minHeight: 42 }}
                      >
                        ⚾ Baseball
                      </button>
                      <button
                        type="button"
                        className={
                          "pill-toggle " +
                          (sport === "softball" ? "active-softball" : "")
                        }
                        onClick={() =>
                          setSport((s) =>
                            s === "softball" ? "Both" : "softball",
                          )
                        }
                        style={{ minHeight: 42 }}
                      >
                        🥎 Softball
                      </button>
                      <button
                        type="button"
                        className={
                          "pill-toggle " +
                          (sport === "both" ? "active-both" : "")
                        }
                        onClick={() =>
                          setSport((s) => (s === "both" ? "Both" : "both"))
                        }
                        style={{
                          gridColumn: "1 / -1",
                          minHeight: 42,
                          borderColor: sport === "both" ? "#C9D4E5" : undefined,
                          background:
                            sport === "both"
                              ? "linear-gradient(90deg, #E8EEF8 0%, #E8EEF8 48%, #F3F0D7 52%, #F3F0D7 100%)"
                              : undefined,
                          color: sport === "both" ? "#173B73" : undefined,
                        }}
                      >
                        ⚾🥎 Baseball &amp; Softball
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={sectionLabel}>Specialty</div>
                    <select
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      style={{ ...inputStyle, minHeight: 46, fontSize: 15 }}
                    >
                      {SPECIALTIES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={sectionLabel}>State</div>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ ...inputStyle, minHeight: 46, fontSize: 15 }}
                    >
                      {US_STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={sectionLabel}>Near zip code</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 30004"
                      maxLength={5}
                      value={zip}
                      onChange={(e) => {
                        const next = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 5);
                        setZip(next);
                        if (next.length < 5) {
                          setGeoCenter(null);
                          setZipStatus("");
                          if (state !== "All States") setState("All States");
                        }
                      }}
                      style={{ ...inputStyle, minHeight: 46, fontSize: 15 }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <div style={sectionLabel}>Radius</div>
                      <select
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        style={{ ...inputStyle, minHeight: 46, fontSize: 15 }}
                      >
                        {RADIUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12.5,
                        color:
                          zipStatus === "error" ? "#B91C1C" : "var(--gray)",
                      }}
                    >
                      {zipStatus === "error"
                        ? "ZIP not recognized. Please check and try again."
                        : "Use ZIP + radius so local coaches show first."}
                    </div>
                    {(zipStatus === "ok" || zip) && (
                      <button
                        type="button"
                        onClick={clearZipFilter}
                        style={{
                          marginTop: 8,
                          minHeight: 42,
                          width: "100%",
                          borderRadius: 12,
                          background: "#fff",
                          color: "var(--navy)",
                          border: "1.5px solid #CBD5E1",
                          fontWeight: 700,
                          fontFamily: "var(--font-head)",
                        }}
                      >
                        Clear ZIP filter
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        mobileActiveFilterCount > 0 ? "1fr 1fr" : "1fr",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        applySearch();
                        if (zip.length === 5) {
                          await applyZipSearch();
                        } else if (!zip) {
                          setGeoCenter(null);
                          setZipStatus("");
                        } else {
                          setGeoCenter(null);
                          setZipStatus("error");
                        }
                        setShowMobileFilters(false);
                      }}
                      style={{
                        minHeight: 44,
                        borderRadius: 12,
                        border: "none",
                        background: "var(--navy)",
                        color: "#fff",
                        fontWeight: 800,
                        fontFamily: "var(--font-head)",
                      }}
                    >
                      Apply
                    </button>
                    {mobileActiveFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearAllMobileFilters}
                        style={{
                          minHeight: 44,
                          borderRadius: 12,
                          border: "1.5px solid #CBD5E1",
                          background: "#fff",
                          color: "var(--navy)",
                          fontWeight: 700,
                          fontFamily: "var(--font-head)",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DirectoryAdBand
            slotKey="coaches_inline_1_mobile"
            maxWidth={320}
            reservedHeight={100}
            isMobile={true}
            marginTop={16}
          />

          <div style={{ padding: "2px 12px 112px" }}>
            {sel && mobileView === "list" && (
              <div
                style={{
                  marginBottom: 10,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: "var(--gray)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Selected coach
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--navy)",
                      fontWeight: 800,
                      marginTop: 3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {sel.name}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setProfileCoach(sel)}
                    style={{
                      border: "none",
                      background: "var(--navy)",
                      color: "#fff",
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "var(--font-head)",
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    style={{
                      border: "1.5px solid #CBD5E1",
                      background: "#fff",
                      color: "var(--navy)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-head)",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {mobileView === "map" ? (
              <div style={{ display: "grid", gap: 10 }}>
                {!hasLocationSearch ? (
                  <div className="empty-state">
                    <h3>Start with your ZIP code</h3>
                    <p>
                      Enter a ZIP code and choose a radius to see coaches near
                      you on the map.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--white)",
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(15,23,42,0.07)",
                      boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
                    }}
                  >
                    <div style={{ height: 360, overflow: "hidden" }}>
                      <MapContainer
                        center={[33.5, -84.2]}
                        zoom={8}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution="&copy; OpenStreetMap"
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FitBounds
                          points={markerGroups}
                          selectedId={selected}
                        />
                        {sel && sel.lat != null && sel.lng != null && (
                          <FlyTo lat={sel.lat} lng={sel.lng} />
                        )}
                        <MapMarkers
                          groups={markerGroups}
                          selected={selected}
                          setSelected={setSelected}
                          onViewCoach={(coach) => setProfileCoach(coach)}
                        />
                      </MapContainer>
                    </div>
                    <MapLegend />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  style={{
                    minHeight: 44,
                    borderRadius: 12,
                    border: "1.5px solid var(--navy)",
                    background: "#fff",
                    color: "var(--navy)",
                    fontWeight: 800,
                    fontFamily: "var(--font-head)",
                  }}
                >
                  Show matching coaches
                </button>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-head)",
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--navy)",
                      }}
                    >
                      Browse coaches
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--gray)",
                        marginTop: 2,
                      }}
                    >
                      {hasLocationSearch
                        ? "List-first mobile view for faster scanning."
                        : "Enter your ZIP code above to load nearby coaches."}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileView("map")}
                    style={{
                      border: "1.5px solid #CBD5E1",
                      background: "#fff",
                      color: "var(--navy)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-head)",
                    }}
                  >
                    Open Map
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {loading && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "40px 0",
                        color: "var(--gray)",
                        fontSize: 14,
                      }}
                    >
                      Loading coaches…
                    </div>
                  )}
                  {!loading && displayedCoaches.length === 0 && (
                    <EmptyState
                      facilityContextName={facilityContext?.name}
                      hasLocationSearch={hasLocationSearch}
                    />
                  )}
                  {!loading &&
                    displayedCoaches.map((coach) => (
                      <MobileCoachRow
                        key={coach.id}
                        coach={coach}
                        isSelected={selected === coach.id}
                        onSelect={handleMobileRowSelect}
                        onOpenProfile={setProfileCoach}
                      />
                    ))}
                </div>
              </>
            )}
          </div>

          <DirectoryAdBand
            slotKey="coaches_footer_1_mobile"
            maxWidth={320}
            reservedHeight={100}
            isMobile={true}
            marginTop={20}
          />
        </div>
      ) : (
        <div style={{ background: "var(--cream)" }}>
          <DirectoryAdBand
            slotKey="coaches_top_1_desktop"
            maxWidth={970}
            reservedHeight={90}
            isMobile={false}
            marginTop={16}
          />

          <div style={{ padding: "16px 14px 20px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "300px minmax(0, 1fr)",
                gap: 18,
                alignItems: "start",
                width: "100%",
              }}
            >
              <aside
                style={{
                  position: "sticky",
                  top: HEADER_H + 12,
                  alignSelf: "start",
                  background: "var(--white)",
                  borderRight: "1px solid rgba(15,23,42,0.06)",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    padding: "10px 12px 8px",
                    borderBottom: "1px solid var(--lgray)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-head)",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--navy)",
                      marginBottom: 2,
                      lineHeight: 1.1,
                    }}
                  >
                    {hasLocationSearch
                      ? `${displayedCoaches.length} coach${displayedCoaches.length !== 1 ? "es" : ""} near you`
                      : "Start with ZIP + radius"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--gray)",
                      lineHeight: 1.3,
                    }}
                  >
                    {hasLocationSearch
                      ? "Private instructors, team coaches, and trainers"
                      : "Enter a ZIP code to load nearby coaches first."}
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    borderBottom: "1px solid var(--lgray)",
                    background: "var(--white)",
                  }}
                >
                  {facilityContext && (
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid var(--lgray)",
                        background: "#f8fafc",
                        color: "var(--navy)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          color: "var(--gray)",
                        }}
                      >
                        Facility context
                      </div>
                      <div
                        style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}
                      >
                        {facilityContext.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          marginTop: 2,
                          color: "var(--gray)",
                        }}
                      >
                        Showing only coaches linked to this facility
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Link
                          to={`/facilities/${facilityContext.id}`}
                          style={{
                            color: "#1D4ED8",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          ← Back to Facility
                        </Link>
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={sectionLabel}>Search</div>
                    <input
                      placeholder="Name, city, facility, zip..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      style={{ ...inputStyle, minHeight: 40 }}
                    />
                  </div>
                  {!facilityContext && (
                    <>
                      <div>
                        <div style={sectionLabel}>ZIP code</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 30350"
                          maxLength={5}
                          value={zip}
                          onChange={(e) => {
                            const next = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 5);
                            setZip(next);
                            if (next.length < 5) {
                              setGeoCenter(null);
                              setZipStatus("");
                              if (state !== "All States")
                                setState("All States");
                            }
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              await applyZipSearch();
                            }
                          }}
                          style={{ ...inputStyle, minHeight: 40 }}
                        />
                      </div>
                      <div>
                        <div style={sectionLabel}>Radius</div>
                        <select
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          style={{ ...inputStyle, minHeight: 40 }}
                        >
                          {RADIUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={sectionLabel}>Specialty</div>
                        <select
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          style={{ ...inputStyle, minHeight: 40 }}
                        >
                          {SPECIALTIES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={applyZipSearch}
                        style={{
                          width: "100%",
                          background: "var(--navy)",
                          color: "white",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "var(--font-head)",
                        }}
                      >
                        Show nearby coaches
                      </button>
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            zipStatus === "error"
                              ? "var(--red)"
                              : "var(--gray)",
                          lineHeight: 1.35,
                        }}
                      >
                        {zipStatus === "error"
                          ? "Enter a valid 5-digit ZIP code."
                          : hasLocationSearch
                            ? `Showing coaches within ${radius} miles of ${zip}${state !== "All States" ? `, ${state}` : ""}.`
                            : "Enter your ZIP code first so local coaches show before the full directory."}
                      </div>
                    </>
                  )}
                  <div>
                    <div style={sectionLabel}>Sport</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        className={
                          "pill-toggle " +
                          (sport === "baseball" ? "active-baseball" : "")
                        }
                        onClick={() =>
                          setSport((s) =>
                            s === "baseball" ? "Both" : "baseball",
                          )
                        }
                        style={{ minHeight: 38 }}
                      >
                        ⚾ Baseball
                      </button>
                      <button
                        type="button"
                        className={
                          "pill-toggle " +
                          (sport === "softball" ? "active-softball" : "")
                        }
                        onClick={() =>
                          setSport((s) =>
                            s === "softball" ? "Both" : "softball",
                          )
                        }
                        style={{ minHeight: 38 }}
                      >
                        🥎 Softball
                      </button>
                      <button
                        type="button"
                        className={
                          "pill-toggle " +
                          (sport === "both" ? "active-both" : "")
                        }
                        onClick={() =>
                          setSport((s) => (s === "both" ? "Both" : "both"))
                        }
                        style={{
                          gridColumn: "1 / -1",
                          minHeight: 38,
                          borderColor: sport === "both" ? "#C9D4E5" : undefined,
                          background:
                            sport === "both"
                              ? "linear-gradient(90deg, #E8EEF8 0%, #E8EEF8 48%, #F3F0D7 52%, #F3F0D7 100%)"
                              : undefined,
                          color: sport === "both" ? "#173B73" : undefined,
                        }}
                      >
                        ⚾🥎 Baseball &amp; Softball
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={sectionLabel}>State</div>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      style={{ ...inputStyle, minHeight: 40 }}
                    >
                      {US_STATES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={applySearch}
                    style={{
                      width: "100%",
                      background: "var(--navy)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-head)",
                    }}
                  >
                    Search
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowMap((m) => !m)}
                      style={{
                        flex: 1,
                        padding: "9px 10px",
                        borderRadius: "var(--btn-radius)",
                        border: "1.5px solid var(--navy)",
                        background: showMap ? "var(--navy)" : "var(--white)",
                        color: showMap ? "var(--white)" : "var(--navy)",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "var(--font-head)",
                        minHeight: 40,
                      }}
                    >
                      {showMap ? "Hide Map" : "Show Map"}
                    </button>
                    <a
                      href="/submit"
                      style={{
                        flex: 1,
                        textAlign: "center",
                        textDecoration: "none",
                        padding: "9px 10px",
                        borderRadius: "var(--btn-radius)",
                        background: "var(--red)",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "var(--font-head)",
                        minHeight: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      + Add a Coach
                    </a>
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderTop: "1px solid var(--lgray)",
                    background: "var(--white)",
                  }}
                >
                  <RailAdSlot
                    slotKey="coaches_left_rail_1_desktop"
                    reservedHeight={250}
                  />
                </div>
              </aside>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) 300px",
                    gap: 22,
                    alignItems: "start",
                  }}
                >
                  <main style={{ minWidth: 0 }}>
                    {showMap && (
                      <div style={{ background: "var(--white)", width: "100%" }}>
                        <div
                          style={{
                            height: 355,
                            width: "100%",
                            overflow: "hidden",
                            borderRadius: 14,
                            border: "1px solid rgba(15,23,42,0.06)",
                          }}
                        >
                          <MapContainer
                            center={[33.5, -84.2]}
                            zoom={8}
                            style={{ height: "100%", width: "100%" }}
                          >
                            <TileLayer
                              attribution="&copy; OpenStreetMap"
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <FitBounds
                              points={markerGroups}
                              selectedId={selected}
                            />
                            {sel && sel.lat != null && sel.lng != null && (
                              <FlyTo lat={sel.lat} lng={sel.lng} />
                            )}
                            <MapMarkers
                              groups={markerGroups}
                              selected={selected}
                              setSelected={setSelected}
                              onViewCoach={(coach) => {
                                setSelected(null);
                                setProfileCoach(coach);
                              }}
                            />
                          </MapContainer>
                        </div>
                        <MapLegend />
                      </div>
                    )}
                    {!showMap ? (
                      <div
                        style={{
                          background: "var(--white)",
                          border: "1px solid rgba(15,23,42,0.06)",
                          borderRadius: 14,
                          padding: "16px",
                          color: "var(--gray)",
                          fontSize: 13,
                          width: "100%",
                        }}
                      >
                        Map is hidden. Use “Show Map” in the left panel to view
                        coach locations.
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-head)",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "var(--navy)",
                        }}
                      >
                        {hasLocationSearch
                          ? `${displayedCoaches.length} Coach${displayedCoaches.length !== 1 ? "es" : ""}`
                          : "Nearby coaches will appear here"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--gray)" }}>
                        {hasLocationSearch
                          ? "Compact list below. Click a row or pin to preview, then use View Profile & Reviews for the full coach card."
                          : "Enter a ZIP code and radius first so the list starts with local results."}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        border: "1px solid #DCE5F0",
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "#fff",
                        boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
                      }}
                    >
                      <div
                        style={{
                          maxHeight: "min(62vh, 760px)",
                          overflowY: "auto",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "118px minmax(190px, 1fr) minmax(220px, 1.1fr) minmax(240px, 1.2fr) 96px",
                            gap: 14,
                            alignItems: "center",
                            padding: "13px 14px",
                            background:
                              "linear-gradient(180deg, #EEF4FB 0%, #E7EEF8 100%)",
                            borderBottom: "1px solid #DCE5F0",
                            position: "sticky",
                            top: 0,
                            zIndex: 4,
                            boxShadow: "0 1px 0 #DCE5F0",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              color: "#516172",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            Sport
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              color: "#516172",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            Coach
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              color: "#516172",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            Facility
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              color: "#516172",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            Specialization
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              fontWeight: 900,
                              color: "#516172",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              textAlign: "right",
                            }}
                          >
                            View
                          </div>
                        </div>

                        {loading && (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "30px 0",
                              color: "var(--gray)",
                              fontSize: 14,
                            }}
                          >
                            Loading coaches...
                          </div>
                        )}
                        {!loading && displayedCoaches.length === 0 && (
                          <div style={{ padding: 18 }}>
                            <EmptyState
                              facilityContextName={facilityContext?.name}
                              hasLocationSearch={hasLocationSearch}
                            />
                          </div>
                        )}
                        {!loading &&
                          displayedCoaches.map((coach) => (
                            <CoachRow
                              key={coach.id}
                              coach={coach}
                              selected={selected === coach.id}
                              onOpen={() => handleSelectCoach(coach.id)}
                            />
                          ))}
                      </div>
                    </div>
                  </main>
                  <aside
                    style={{
                      position: "sticky",
                      top: HEADER_H + 12,
                      alignSelf: "start",
                      padding: "8px 0 0 0",
                      width: "300px",
                      justifySelf: "end",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                      }}
                    >
                      <RailAdSlot
                        slotKey="coaches_right_rail_1_desktop"
                        reservedHeight={250}
                      />
                      <RailAdSlot
                        slotKey="coaches_right_rail_2_desktop"
                        reservedHeight={250}
                      />
                      <RailAdSlot
                        slotKey="coaches_right_rail_3_desktop"
                        reservedHeight={250}
                      />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
