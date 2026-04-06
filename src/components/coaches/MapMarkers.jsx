import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { normalizeSportValue } from "../../utils/sportUtils";

function sportPinBackground(value) {
  const sport = normalizeSportValue(value);
  if (sport === "softball") return "#FACC15";
  if (sport === "both") {
    return "conic-gradient(#2563EB 0deg 180deg, #FACC15 180deg 360deg)";
  }
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

export default function MapMarkers({
  groups,
  selected,
  setSelected,
  onViewCoach,
}) {
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
                const specs = Array.isArray(coach.specialty)
                  ? coach.specialty.filter(Boolean)
                  : [];
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