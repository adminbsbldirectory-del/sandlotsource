import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "../supabase.js";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const makeIcon = (color) =>
  L.divIcon({
    className: "",
    html:
      '<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:' +
      color +
      ';border:3px solid white;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -28],
  });

const PIN_COLORS = {
  player_needed: "#ea580c",
  player_available: "#0891b2",
};

function getPinColor(post) {
  const sport = String(post?.sport || "").toLowerCase();
  const type = String(post?.post_type || "").toLowerCase();

  if (type === "player_needed") {
    return sport === "softball" ? "#CCE500" : "#ea580c";
  }

  if (type === "player_available") {
    return sport === "softball" ? "#CCE500" : "#0891b2";
  }

  return sport === "softball" ? "#CCE500" : "#0B2341";
}

function AdBox() {
  return (
    <div
      style={{
        background: "#FAF7F1",
        border: "1px solid rgba(15,23,42,0.05)",
        borderRadius: 14,
        padding: "20px 16px",
        textAlign: "center",
        minHeight: 146,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-head)",
          fontWeight: 800,
          fontSize: 18,
          color: "var(--navy)",
          marginBottom: 10,
          lineHeight: 1.05,
        }}
      >
        ADVERTISE
        <br />
        HERE
      </div>
      <div
        style={{
          color: "var(--gray)",
          fontSize: 13,
          lineHeight: 1.5,
          marginBottom: 12,
        }}
      >
        Reach baseball & softball families
      </div>
      <a
        href="/contact"
        style={{
          color: "#c62828",
          fontWeight: 800,
          textDecoration: "none",
          fontSize: 13,
        }}
      >
        Contact Us
      </a>
    </div>
  );
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
      city: place["place name"],
      state: place["state abbreviation"],
    };
  } catch {
    return null;
  }
}

async function geocodeAddress(address, city, zip) {
  if (!address) return null;
  try {
    const q = encodeURIComponent(
      address + (city ? ", " + city : "") + (zip ? ", " + zip : "") + ", USA",
    );
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?q=" +
        q +
        "&format=json&limit=1&countrycodes=us",
      { headers: { "Accept-Language": "en-US" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

function buildLocationName(venue, address, fieldNum) {
  return [venue.trim(), address.trim(), fieldNum.trim()]
    .filter(Boolean)
    .join(" — ");
}

function parseLocationName(locationName) {
  const parts = String(locationName || "").split(" — ");
  return {
    venue_name: parts[0] || "",
    location_address: parts[1] || "",
    field_number: parts[2] || "",
  };
}

const POSITIONS_BB = [
  "pitcher",
  "catcher",
  "1B",
  "2B",
  "3B",
  "shortstop",
  "outfield",
  "utility",
];
const POSITIONS_SB = [
  "pitcher",
  "catcher",
  "1B",
  "2B",
  "3B",
  "shortstop",
  "outfield",
  "utility",
];
const AGE_GROUPS = [
  "6U",
  "7U",
  "8U",
  "9U",
  "10U",
  "11U",
  "12U",
  "13U",
  "14U",
  "15U",
  "16U",
  "18U",
  "Adult",
];
const HAND_OPTIONS = ["R", "L", "Switch"];

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  display: "block",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "2px solid var(--lgray)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = { ...inputStyle };

function RequiredMark() {
  return <span style={{ color: "var(--red)" }}> *</span>;
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function milesBetween(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractTravelMiles(notes) {
  const txt = String(notes || "");
  if (!txt) return null;
  if (/Willing to travel:\s*Anywhere/i.test(txt)) return 999;
  const m = txt.match(/Willing to travel:\s*up to\s*(\d+)\s*miles/i);
  return m ? parseInt(m[1], 10) : null;
}

const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const US_STATES = [
  "",
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
  "DC",
];

function stateFromPost(post, zipStateMap) {
  return String(
    post?.state || zipStateMap[String(post?.zip_code || "")] || "",
  ).toUpperCase();
}

function MapViewport({ posts, showFullUS }) {
  const map = useMap();

  useEffect(() => {
    const pts = posts.filter((p) => p.lat != null && p.lng != null);

    if (showFullUS || pts.length === 0) {
      map.setView([38.5, -96.5], 5);
      return;
    }

    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
  }, [posts, map, showFullUS]);

  return null;
}

function ZipFieldInline({ value, onChange, onGeocode, required }) {
  const [status, setStatus] = useState("");

  async function handleBlur() {
    if (!value || value.length !== 5) return;
    setStatus("loading");
    const geo = await geocodeZip(value);
    if (geo) {
      setStatus("ok");
      onGeocode(geo);
    } else {
      setStatus("error");
      onGeocode(null);
    }
  }

  return (
    <div>
      <label style={labelStyle}>
        Zip Code
        {required && <span style={{ color: "var(--red)" }}> *</span>}
        {status === "loading" && (
          <span
            style={{
              fontWeight: 400,
              textTransform: "none",
              marginLeft: 6,
              color: "#888",
            }}
          >
            Checking…
          </span>
        )}
        {status === "ok" && (
          <span
            style={{
              fontWeight: 400,
              textTransform: "none",
              marginLeft: 6,
              color: "#16a34a",
            }}
          >
            ✓ Located
          </span>
        )}
        {status === "error" && (
          <span
            style={{
              fontWeight: 400,
              textTransform: "none",
              marginLeft: 6,
              color: "var(--red)",
            }}
          >
            Zip not found
          </span>
        )}
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g. 30009"
        style={inputStyle}
      />
      <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
        Used for distance search matching
      </div>
    </div>
  );
}

function AddressGeoField({ value, onChange, onGeocode, city, zip }) {
  const [status, setStatus] = useState("");

  async function handleBlur() {
    if (!value.trim()) return;
    setStatus("loading");
    const geo = await geocodeAddress(value, city, zip);
    if (geo) {
      setStatus("found");
      onGeocode(geo);
    } else {
      setStatus("fallback");
      onGeocode(null);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>
        Street Address <RequiredMark />
        {status === "loading" && (
          <span
            style={{
              fontWeight: 400,
              textTransform: "none",
              marginLeft: 6,
              color: "#888",
            }}
          >
            Locating…
          </span>
        )}
        {status === "found" && (
          <span
            style={{
              fontWeight: 400,
              textTransform: "none",
              marginLeft: 6,
              color: "#16a34a",
            }}
          >
            ✓ Pin placed at address
          </span>
        )}
        {status === "fallback" && (
          <span
            style={{
              fontWeight: 400,
              textTransform: "none",
              marginLeft: 6,
              color: "#ea580c",
            }}
          >
            Address not found — pin will use zip area
          </span>
        )}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g. 11925 Wills Rd, Alpharetta, GA 30009"
        style={inputStyle}
      />
      <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
        Tab out after typing to place map pin at exact location
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  post_type: "player_needed",
  sport: "baseball",
  player_age: "",
  player_position: [],
  player_description: "",
  team_name: "",
  age_group: "",
  position_needed: [],
  city: "",
  state: "",
  venue_name: "",
  location_address: "",
  field_number: "",
  event_date: "",
  additional_notes: "",
  distance_travel: 25,
  bats: "",
  throws: "",
  contact_type: "email",
  contact_email: "",
  contact_phone: "",
  zip_code: "",
  lat: null,
  lng: null,
};

const TRAVEL_OPTIONS = [
  { value: 10, label: "Up to 10 miles" },
  { value: 25, label: "Up to 25 miles" },
  { value: 50, label: "Up to 50 miles" },
  { value: 75, label: "Up to 75 miles" },
  { value: 100, label: "Up to 100 miles" },
  { value: 150, label: "Up to 150 miles" },
  { value: 999, label: "Anywhere" },
];

function DistanceSlider({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>Willing to Travel</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={selectStyle}
      >
        {TRAVEL_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function buildContactInfo(form) {
  if (form.contact_type === "email") return form.contact_email.trim();
  if (form.contact_type === "phone") return form.contact_phone.trim();
  const parts = [];
  if (form.contact_email.trim()) parts.push(form.contact_email.trim());
  if (form.contact_phone.trim()) parts.push(form.contact_phone.trim());
  return parts.join(" / ");
}

function parseContactInfo(contact_info) {
  if (!contact_info) {
    return { contact_type: "email", contact_email: "", contact_phone: "" };
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (contact_info.includes(" / ")) {
    const [a, b] = contact_info.split(" / ");
    const email = emailRe.test(a) ? a : b;
    const phone = emailRe.test(a) ? b : a;
    return { contact_type: "both", contact_email: email, contact_phone: phone };
  }
  if (emailRe.test(contact_info)) {
    return {
      contact_type: "email",
      contact_email: contact_info,
      contact_phone: "",
    };
  }
  return {
    contact_type: "phone",
    contact_email: "",
    contact_phone: contact_info,
  };
}

function ContactDisplay({ contact_info }) {
  if (!contact_info) return null;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRe = /^[\d\s\-\(\)\+\.]+$/;

  if (contact_info.includes(" / ")) {
    const parts = contact_info.split(" / ");
    return (
      <span>
        {parts.map((c, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: "var(--lgray)" }}> · </span>}
            {emailRe.test(c) ? (
              <a
                href={"mailto:" + c}
                style={{
                  color: "#1D4ED8",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {c}
              </a>
            ) : (
              <a
                href={"tel:" + c.replace(/\D/g, "")}
                style={{
                  color: "var(--navy)",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {c}
              </a>
            )}
          </span>
        ))}
      </span>
    );
  }

  if (emailRe.test(contact_info)) {
    return (
      <a
        href={"mailto:" + contact_info}
        style={{ color: "#1D4ED8", textDecoration: "none", fontWeight: 600 }}
      >
        {contact_info}
      </a>
    );
  }

  if (
    phoneRe.test(
      (contact_info || "").replace(/^(dad:|mom:|coach:)/i, "").trim(),
    )
  ) {
    return (
      <a
        href={"tel:" + contact_info.replace(/\D/g, "")}
        style={{
          color: "var(--navy)",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        {contact_info}
      </a>
    );
  }

  return (
    <span style={{ fontWeight: 600, color: "var(--navy)" }}>
      {contact_info}
    </span>
  );
}

function ContactFields({ form, setForm }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        Contact Info <RequiredMark />
      </label>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        {[
          ["email", "📧 Email"],
          ["phone", "📞 Phone"],
          ["both", "📧 + 📞 Both"],
        ].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setForm((f) => ({ ...f, contact_type: val }))}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "2px solid",
              cursor: "pointer",
              borderColor:
                form.contact_type === val ? "var(--navy)" : "var(--lgray)",
              background: form.contact_type === val ? "var(--navy)" : "white",
              color: form.contact_type === val ? "white" : "var(--navy)",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "var(--font-body)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {(form.contact_type === "email" || form.contact_type === "both") && (
        <input
          type="email"
          value={form.contact_email}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_email: e.target.value }))
          }
          placeholder="your@email.com"
          style={{
            ...inputStyle,
            marginBottom: form.contact_type === "both" ? 8 : 0,
          }}
        />
      )}

      {(form.contact_type === "phone" || form.contact_type === "both") && (
        <input
          type="tel"
          value={form.contact_phone}
          onChange={(e) =>
            setForm((f) => ({ ...f, contact_phone: e.target.value }))
          }
          placeholder="678-555-0100"
          style={inputStyle}
        />
      )}

      <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 6 }}>
        Visible publicly. Listings expire after 4 days.
      </div>
    </div>
  );
}

function AuthModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setSending(true);
    const redirectUrl =
      typeof window !== "undefined" ? window.location.href : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectUrl },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 14,
          padding: "32px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <div
              style={{
                fontFamily: "var(--font-head)",
                fontSize: 20,
                fontWeight: 800,
                color: "var(--navy)",
                marginBottom: 8,
              }}
            >
              Check your email
            </div>
            <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
              We sent a sign-in link to <strong>{email}</strong>.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: "var(--font-head)",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--navy)",
                marginBottom: 6,
              }}
            >
              Sign in to post or edit
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#666",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Enter your email and we&apos;ll send you a magic link — no
              password needed.
            </div>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{ ...inputStyle, marginBottom: 12, fontSize: 15 }}
              autoFocus
            />
            {error && (
              <div
                style={{ color: "var(--red)", fontSize: 13, marginBottom: 10 }}
              >
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--navy)",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: sending ? "not-allowed" : "pointer",
                fontFamily: "var(--font-head)",
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? "Sending…" : "Send Sign-in Link"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 14,
          padding: "28px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <div
          style={{
            fontFamily: "var(--font-head)",
            fontSize: 18,
            fontWeight: 800,
            color: "var(--navy)",
            marginBottom: 8,
          }}
        >
          Delete this listing?
        </div>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
          This can&apos;t be undone.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px",
              background: "white",
              color: "var(--navy)",
              border: "2px solid var(--lgray)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px",
              background: "#DC2626",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlayerBoard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("Both");
  const [stateFilter, setStateFilter] = useState("");
  const [nearbyZip, setNearbyZip] = useState("");
  const [nearbyMiles, setNearbyMiles] = useState("25");
  const [searchGeo, setSearchGeo] = useState(null);
  const [zipStateMap, setZipStateMap] = useState({});
  const [hasSearched, setHasSearched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMap, setShowMap] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : false,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMode, setSubmitMode] = useState("create");
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("player_board")
        .select("*")
        .eq("active", true)
        .gt("expires_at", new Date().toISOString())
        .in("approval_status", ["pending", "approved"])
        .order("created_at", { ascending: false });
      if (!error && data) setPosts(data);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let ignore = false;
    async function locate() {
      if (!nearbyZip || nearbyZip.length !== 5) {
        setSearchGeo(null);
        return;
      }
      const geo = await geocodeZip(nearbyZip);
      if (ignore) return;
      setSearchGeo(geo || null);
      if (geo?.state) {
        setStateFilter(String(geo.state).toUpperCase());
        setHasSearched(false);
      }
    }
    locate();
    return () => {
      ignore = true;
    };
  }, [nearbyZip]);

  useEffect(() => {
    let ignore = false;
    async function hydrateZipStates() {
      const zips = [
        ...new Set(
          posts
            .filter((p) => !p.state && String(p.zip_code || "").length === 5)
            .map((p) => String(p.zip_code)),
        ),
      ];
      if (!zips.length) return;
      const next = {};
      for (const zip of zips) {
        try {
          const geo = await geocodeZip(zip);
          if (geo?.state) next[zip] = String(geo.state).toUpperCase();
        } catch {}
      }
      if (!ignore && Object.keys(next).length)
        setZipStateMap((prev) => ({ ...prev, ...next }));
    }
    hydrateZipStates();
    return () => {
      ignore = true;
    };
  }, [posts]);

  const shouldApplyDistance = Boolean(
    stateFilter &&
    hasSearched &&
    nearbyZip &&
    nearbyZip.length === 5 &&
    searchGeo,
  );

  const filtered = posts.filter((p) => {
    if (!stateFilter) return false;
    if (filter !== "all" && p.post_type !== filter) return false;
    if (sportFilter !== "Both" && p.sport !== sportFilter) return false;
    const derivedState = stateFromPost(p, zipStateMap);
    if (derivedState !== stateFilter) return false;
    if (shouldApplyDistance && p.lat != null && p.lng != null) {
      const distance = milesBetween(searchGeo.lat, searchGeo.lng, p.lat, p.lng);
      const cap = parseInt(nearbyMiles, 10) || 25;
      if (distance > cap) {
        if (p.post_type === "player_available") {
          const travelCap = extractTravelMiles(p.additional_notes);
          if (travelCap == null || distance > travelCap) return false;
        } else {
          return false;
        }
      }
    }
    return true;
  });

  const mappable = filtered.filter((p) => p.lat != null && p.lng != null);
  const selectedStateName = STATE_NAMES[stateFilter] || stateFilter;
  const showBrowseMap = !isMobile || showMap;

  useEffect(() => {
    if (!filtered.length) {
      setSelectedPostId(null);
      return;
    }

    if (
      selectedPostId &&
      !filtered.some((post) => post.id === selectedPostId)
    ) {
      setSelectedPostId(null);
    }
  }, [filtered, selectedPostId]);

  function getPostTitle(post) {
    if (post.post_type === "player_available") {
      if (post.player_age) return `Age ${post.player_age} Player`;
      return post.age_group || "Player Available";
    }

    return `${post.team_name || "Team"}${post.age_group ? " · " + post.age_group : ""}`;
  }

  function getPostLocation(post) {
    return (
      post.location_name ||
      [post.city, stateFromPost(post, zipStateMap), post.zip_code]
        .filter(Boolean)
        .join(", ") ||
      "Location pending"
    );
  }

  function getPostPositionDetails(post) {
    const positions =
      post.post_type === "player_available"
        ? Array.isArray(post.player_position)
          ? post.player_position
          : []
        : Array.isArray(post.position_needed)
          ? post.position_needed
          : [];

    const parts = [];

    if (positions.length) parts.push(positions.join(", "));

    if (post.post_type === "player_available" && (post.bats || post.throws)) {
      parts.push(
        [
          post.bats ? `Bats ${post.bats}` : "",
          post.throws ? `Throws ${post.throws}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      );
    }

    return parts.filter(Boolean).join(" • ") || "Details pending";
  }

  function getPostDateLabel(post) {
    if (!post?.event_date) return "";
    return `${post.post_type === "player_available" ? "Available" : "Needed"} ${formatDate(post.event_date)}`;
  }

  function getPostDetailLines(post) {
    if (!post.additional_notes) return [];

    return String(post.additional_notes)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function togglePosition(pos, field) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(pos)
        ? f[field].filter((p) => p !== pos)
        : [...f[field], pos],
    }));
  }

  function handleZipGeocode(geo) {
    if (geo)
      setForm((f) => ({
        ...f,
        lat: f.lat || geo.lat,
        lng: f.lng || geo.lng,
        city: f.city || geo.city,
        state: f.state || geo.state,
      }));
  }

  function handleAddressGeocode(geo) {
    if (geo) setForm((f) => ({ ...f, lat: geo.lat, lng: geo.lng }));
  }

  function validate() {
    const contactInfo = buildContactInfo(form);
    if (!contactInfo) return "Contact info is required.";
    if (form.post_type === "player_needed") {
      if (!form.sport) return "Sport is required.";
      if (!form.age_group) return "Age group is required.";
      if (!form.position_needed.length)
        return "Select at least one position needed.";
      if (!form.venue_name.trim())
        return "Game / tournament location is required.";
      if (!form.location_address.trim()) return "Address is required.";
      if (!form.zip_code || form.zip_code.length !== 5)
        return "Zip code is required.";
      if (!form.event_date) return "Event date is required.";
    } else {
      if (!form.sport) return "Sport is required.";
      if (!form.player_age.toString().trim()) return "Player age is required.";
      if (!form.player_position.length) return "Select at least one position.";
      if (!form.zip_code || form.zip_code.length !== 5)
        return "Zip code is required.";
    }
    return "";
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError("");
    setSubmitting(true);
    const contactInfo = buildContactInfo(form);
    const travelNote =
      "Willing to travel: " +
      (form.distance_travel === 999
        ? "Anywhere"
        : "up to " + form.distance_travel + " miles");
    const notesWithTravel =
      form.post_type === "player_available"
        ? [travelNote, form.additional_notes].filter(Boolean).join("\n")
        : form.additional_notes || null;
    const combinedLocation = buildLocationName(
      form.venue_name,
      form.location_address,
      form.field_number,
    );
    const payload = {
      post_type: form.post_type,
      sport: form.sport,
      city: form.city,
      state: form.state || null,
      zip_code: form.zip_code || null,
      lat: form.lat || null,
      lng: form.lng || null,
      contact_info: contactInfo,
      additional_notes: notesWithTravel || null,
      active: true,
      approval_status: "pending",
      source: "website_form",
      last_confirmed_at: new Date().toISOString(),
      user_id: user?.id ?? null,
      ...(form.post_type === "player_available"
        ? {
            player_age: form.player_age ? parseInt(form.player_age, 10) : null,
            age_group: form.age_group || null,
            player_position: form.player_position,
            player_description: form.player_description || null,
            bats: form.bats || null,
            throws: form.throws || null,
          }
        : {
            team_name: form.team_name || null,
            age_group: form.age_group,
            position_needed: form.position_needed,
            location_name: combinedLocation,
            event_date: form.event_date,
          }),
    };
    const { error } = await supabase.from("player_board").insert([payload]);
    setSubmitting(false);
    if (!error) {
      setSubmitMode("create");
      setSubmitted(true);
      setShowForm(false);
      setPosts((prev) => [
        { ...payload, id: Date.now(), created_at: new Date().toISOString() },
        ...prev,
      ]);
      setForm(EMPTY_FORM);
    } else {
      setValidationError(
        "Submission error: " + (error.message || "Please try again."),
      );
    }
  }

  function startEdit(post) {
    const contactParsed = parseContactInfo(post.contact_info);
    const parsedLocation = parseLocationName(post.location_name);
    setForm({
      post_type: post.post_type,
      sport: post.sport,
      player_age: post.player_age || "",
      player_position: Array.isArray(post.player_position)
        ? post.player_position
        : [],
      player_description: post.player_description || "",
      team_name: post.team_name || "",
      age_group: post.age_group || "",
      position_needed: Array.isArray(post.position_needed)
        ? post.position_needed
        : [],
      city: post.city || "",
      state: post.state || "",
      venue_name: parsedLocation.venue_name,
      location_address: parsedLocation.location_address,
      field_number: parsedLocation.field_number,
      event_date: post.event_date ? post.event_date.split("T")[0] : "",
      additional_notes: post.additional_notes || "",
      distance_travel: 25,
      zip_code: post.zip_code || "",
      lat: post.lat || null,
      lng: post.lng || null,
      bats: post.bats || "",
      throws: post.throws || "",
      ...contactParsed,
    });
    setEditingId(post.id);
    setShowForm(true);
    setSubmitted(false);
    setSubmitMode("edit");
    setValidationError("");
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveEdit() {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError("");
    setSubmitting(true);
    const contactInfo = buildContactInfo(form);
    const travelNote =
      "Willing to travel: " +
      (form.distance_travel === 999
        ? "Anywhere"
        : "up to " + form.distance_travel + " miles");
    const notesWithTravel =
      form.post_type === "player_available"
        ? [travelNote, form.additional_notes].filter(Boolean).join("\n")
        : form.additional_notes || null;
    const combinedLocation = buildLocationName(
      form.venue_name,
      form.location_address,
      form.field_number,
    );
    const updates = {
      post_type: form.post_type,
      sport: form.sport,
      city: form.city,
      state: form.state || null,
      zip_code: form.zip_code || null,
      lat: form.lat || null,
      lng: form.lng || null,
      contact_info: contactInfo,
      additional_notes: notesWithTravel || null,
      ...(form.post_type === "player_available"
        ? {
            player_age: form.player_age ? parseInt(form.player_age, 10) : null,
            age_group: form.age_group || null,
            player_position: form.player_position,
            player_description: form.player_description || null,
            bats: form.bats || null,
            throws: form.throws || null,
            team_name: null,
            position_needed: null,
            location_name: null,
            event_date: null,
          }
        : {
            team_name: form.team_name || null,
            age_group: form.age_group,
            position_needed: form.position_needed,
            location_name: combinedLocation,
            event_date: form.event_date,
            player_age: null,
            player_position: null,
            player_description: null,
          }),
    };
    const { error } = await supabase
      .from("player_board")
      .update(updates)
      .eq("id", editingId);
    setSubmitting(false);
    if (!error) {
      setPosts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...updates } : p)),
      );
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      setSubmitMode("edit");
      setSubmitted(true);
    } else
      setValidationError(
        "Save error: " + (error.message || "Please try again."),
      );
  }

  async function handleDelete(post) {
    const { error } = await supabase
      .from("player_board")
      .update({ active: false })
      .eq("id", post.id);
    if (!error) setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setDeleteTarget(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setValidationError("");
  }

  const filterSelectStyle = {
    padding: "8px 12px",
    borderRadius: "var(--input-radius)",
    border: "1.5px solid var(--lgray)",
    background: "var(--white)",
    fontSize: 13,
    color: "var(--navy)",
    fontFamily: "var(--font-body)",
    outline: "none",
    cursor: "pointer",
  };
  const positions = form.sport === "softball" ? POSITIONS_SB : POSITIONS_BB;
  const isEditing = editingId !== null;
  const g2 = isMobile ? "1fr" : "1fr 1fr";
  const desktopRowTemplate =
    "minmax(120px, 0.78fr) minmax(95px, 0.6fr) minmax(220px, 1.3fr) minmax(150px, 0.9fr) minmax(220px, 1.15fr) minmax(190px, 1fr) 82px";
  const desktopHeaderCellStyle = {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--gray)",
    fontFamily: "var(--font-head)",
  };
  const selectedPost =
    filtered.find((post) => post.id === selectedPostId) || null;
  const selectedPostDetailLines = selectedPost
    ? getPostDetailLines(selectedPost)
    : [];
  const selectedTravelMiles = selectedPost
    ? extractTravelMiles(selectedPost.additional_notes)
    : null;
  const selectedTravelLabel =
    selectedPost && selectedPost.post_type === "player_available"
      ? selectedTravelMiles === 999
        ? "Willing to travel anywhere"
        : selectedTravelMiles != null
          ? `Willing to travel up to ${selectedTravelMiles} miles`
          : ""
      : "";

  function getSportChipStyle(sport) {
    const normalized = String(sport || "").toLowerCase();
    if (normalized === "softball") {
      return {
        background: "#F3F0D7",
        color: "#5F5A17",
        border: "1px solid #DDD59A",
      };
    }
    return {
      background: "#E8EEF8",
      color: "#173B73",
      border: "1px solid #C7D3E8",
    };
  }

  function getTypeChipStyle(isPlayer) {
    return {
      background: isPlayer ? "#1593B5" : "#E66A1F",
      color: "white",
      border: "1px solid transparent",
    };
  }

  return (
    <div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {deleteTarget && (
        <DeleteConfirm
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
          padding: isMobile ? "10px 12px 24px" : "6px 0 24px 0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "265px minmax(0, 1fr)",
            gap: isMobile ? 0 : 18,
            alignItems: "start",
            width: "100%",
          }}
        >
          <aside
            style={{
              position: isMobile ? "static" : "sticky",
              top: isMobile ? "auto" : 76,
              alignSelf: "start",
              background: "var(--white)",
              borderRight: isMobile ? "none" : "1px solid rgba(15,23,42,0.06)",
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
                {stateFilter
                  ? `${filtered.length} post${filtered.length !== 1 ? "s" : ""} in ${selectedStateName}`
                  : "National pickup board"}
              </div>

              <div
                style={{ fontSize: 12, color: "var(--gray)", lineHeight: 1.35 }}
              >
                {stateFilter
                  ? "Pickup-needed and player-available posts for this state."
                  : "Enter a ZIP or choose a state to load pins and listings, then narrow by distance if needed."}
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
              <div>
                <div style={labelStyle}>Post Type</div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {[
                    ["all", "All Posts"],
                    ["player_available", "Players Available"],
                    ["player_needed", "Player Needed"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      style={{
                        width: "100%",
                        minHeight: 38,
                        borderRadius: "var(--btn-radius)",
                        border:
                          "1.5px solid " +
                          (filter === value ? "var(--navy)" : "var(--lgray)"),
                        background:
                          filter === value ? "var(--navy)" : "var(--white)",
                        color:
                          filter === value ? "var(--white)" : "var(--navy)",
                        fontWeight: 700,
                        fontFamily: "var(--font-head)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Sport</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={
                      "pill-toggle " +
                      (sportFilter === "baseball" ? "active-baseball" : "")
                    }
                    onClick={() =>
                      setSportFilter((s) =>
                        s === "baseball" ? "Both" : "baseball",
                      )
                    }
                    style={{ flex: 1, minHeight: 38 }}
                  >
                    ⚾ Baseball
                  </button>
                  <button
                    type="button"
                    className={
                      "pill-toggle " +
                      (sportFilter === "softball" ? "active-softball" : "")
                    }
                    onClick={() =>
                      setSportFilter((s) =>
                        s === "softball" ? "Both" : "softball",
                      )
                    }
                    style={{ flex: 1, minHeight: 38 }}
                  >
                    🥎 Softball
                  </button>
                </div>
              </div>

              <div>
                <div style={labelStyle}>Near Zip Code</div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Zip code"
                  value={nearbyZip}
                  onChange={(e) => {
                    setNearbyZip(e.target.value.replace(/\D/g, "").slice(0, 5));
                    setHasSearched(false);
                  }}
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                  Used for distance search matching
                </div>
              </div>

              <div>
                <div style={labelStyle}>State</div>
                <select
                  value={stateFilter}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setHasSearched(false);
                  }}
                  style={selectStyle}
                >
                  <option value="">Select state</option>
                  {US_STATES.filter(Boolean).map((abbr) => (
                    <option key={abbr} value={abbr}>
                      {STATE_NAMES[abbr]}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                  Auto-fills from ZIP when matched, or choose manually.
                </div>
              </div>

              <div>
                <div style={labelStyle}>Distance</div>
                <select
                  value={nearbyMiles}
                  onChange={(e) => setNearbyMiles(e.target.value)}
                  style={selectStyle}
                >
                  <option value="10">Up to 10 miles</option>
                  <option value="25">Up to 25 miles</option>
                  <option value="50">Up to 50 miles</option>
                  <option value="75">Up to 75 miles</option>
                  <option value="100">Up to 100 miles</option>
                  <option value="150">Up to 150 miles</option>
                </select>
                <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>
                  Add a ZIP to narrow results by distance.
                </div>
              </div>

              {isMobile && (
                <button
                  type="button"
                  onClick={() => setShowMap((m) => !m)}
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: "var(--btn-radius)",
                    border: "1.5px solid var(--navy)",
                    background: showMap ? "var(--navy)" : "var(--white)",
                    color: showMap ? "var(--white)" : "var(--navy)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-head)",
                    minHeight: 40,
                  }}
                >
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setHasSearched(true)}
                  disabled={!stateFilter || nearbyZip.length !== 5}
                  style={{
                    width: "100%",
                    minHeight: 40,
                    borderRadius: "var(--btn-radius)",
                    border:
                      "1.5px solid " +
                      (!stateFilter || nearbyZip.length !== 5
                        ? "var(--lgray)"
                        : "var(--navy)"),
                    background:
                      !stateFilter || nearbyZip.length !== 5
                        ? "#E5E7EB"
                        : "var(--navy)",
                    color:
                      !stateFilter || nearbyZip.length !== 5
                        ? "#6B7280"
                        : "var(--white)",
                    fontWeight: 700,
                    fontFamily: "var(--font-head)",
                    fontSize: 12,
                    cursor:
                      !stateFilter || nearbyZip.length !== 5
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Search This Area
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setSportFilter("Both");
                    setStateFilter("");
                    setNearbyZip("");
                    setNearbyMiles("25");
                    setHasSearched(false);
                  }}
                  style={{
                    width: "100%",
                    minHeight: 40,
                    borderRadius: "var(--btn-radius)",
                    border: "1.5px solid var(--lgray)",
                    background: "var(--white)",
                    color: "var(--navy)",
                    fontWeight: 700,
                    fontFamily: "var(--font-head)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined")
                      window.location.href = "/submit";
                  }}
                  style={{
                    width: "100%",
                    minHeight: 40,
                    borderRadius: "var(--btn-radius)",
                    border: "none",
                    background: "var(--red)",
                    color: "white",
                    fontWeight: 700,
                    fontFamily: "var(--font-head)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  + Add Listing
                </button>
              </div>
            </div>

            {!isMobile && (
              <div
                style={{
                  padding: 12,
                  borderTop: "1px solid var(--lgray)",
                  background: "var(--white)",
                }}
              >
                <AdBox />
              </div>
            )}
          </aside>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: !isMobile ? "minmax(0, 1fr) 230px" : "1fr",
                gap: isMobile ? 0 : 22,
                alignItems: "start",
              }}
            >
              <main style={{ minWidth: 0 }}>
                {showBrowseMap && (
                  <div style={{ background: "var(--white)", width: "100%" }}>
                    <div
                      style={{
                        height: isMobile ? 260 : 390,
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: isMobile ? 0 : 14,
                        border: isMobile
                          ? "none"
                          : "1px solid rgba(15,23,42,0.06)",
                      }}
                    >
                      <MapContainer
                        center={[39.5, -98.35]}
                        zoom={4}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapViewport
                          posts={mappable}
                          showFullUS={!stateFilter}
                        />
                        {mappable.map((p) => (
                          <Marker
                            key={p.id}
                            position={[p.lat, p.lng]}
                            icon={makeIcon(getPinColor(p))}
                            eventHandlers={{
                              click: () => setSelectedPostId(p.id),
                            }}
                          >
                            <Popup>
                              <div style={{ minWidth: 180 }}>
                                <strong
                                  style={{
                                    fontFamily: "var(--font-head)",
                                    fontSize: 14,
                                  }}
                                >
                                  {getPostTitle(p)}
                                </strong>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#666",
                                    marginTop: 3,
                                  }}
                                >
                                  📍 {getPostLocation(p)}
                                </div>
                                {!!p.contact_info && (
                                  <div style={{ fontSize: 12, marginTop: 6 }}>
                                    <ContactDisplay
                                      contact_info={p.contact_info}
                                    />
                                  </div>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        padding: "6px 10px",
                        background: "var(--white)",
                        borderTop: "1px solid var(--lgray)",
                        alignItems: "center",
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50% 50% 50% 0",
                            transform: "rotate(-45deg)",
                            background: "#ea580c",
                            border: "2px solid rgba(255,255,255,0.85)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "var(--gray)" }}>
                          Player Needed
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50% 50% 50% 0",
                            transform: "rotate(-45deg)",
                            background: "#0891b2",
                            border: "2px solid rgba(255,255,255,0.85)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                          }}
                        />
                        <span style={{ fontSize: 11, color: "var(--gray)" }}>
                          Player Available
                        </span>
                      </div>
                      <div
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "var(--gray)",
                        }}
                      >
                        Pickup pins stay type-first: needed vs available.
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    marginTop: showBrowseMap ? 12 : 8,
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
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    {stateFilter
                      ? `${filtered.length} Post${filtered.length !== 1 ? "s" : ""} in ${selectedStateName}`
                      : "Choose a state to browse posts"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gray)" }}>
                    {stateFilter
                      ? "Compact list below. Click a row or pin to open the detail card."
                      : "Start with a ZIP or choose a state, then narrow by distance as needed."}
                  </div>
                </div>

                {!isMobile ? (
                  <div
                    style={{
                      marginTop: 8,
                      background: "var(--white)",
                      border: "1px solid rgba(15,23,42,0.06)",
                      borderRadius: 14,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        maxHeight: "min(560px, calc(100vh - 215px))",
                        overflowY: "auto",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: desktopRowTemplate,
                          gap: 10,
                          alignItems: "center",
                          padding: "9px 14px",
                          background: "#F8FAFC",
                          borderBottom: "1px solid rgba(15,23,42,0.08)",
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                        }}
                      >
                        <div style={desktopHeaderCellStyle}>Type</div>
                        <div style={desktopHeaderCellStyle}>Sport</div>
                        <div style={desktopHeaderCellStyle}>
                          Position / Details
                        </div>
                        <div style={desktopHeaderCellStyle}>Date</div>
                        <div style={desktopHeaderCellStyle}>Location</div>
                        <div style={desktopHeaderCellStyle}>Listing</div>
                        <div
                          style={{
                            ...desktopHeaderCellStyle,
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
                            padding: "26px 0",
                            color: "var(--gray)",
                            fontSize: 14,
                          }}
                        >
                          Loading posts...
                        </div>
                      )}

                      {!loading && !stateFilter && (
                        <div
                          style={{
                            padding: "16px 14px",
                            color: "var(--gray)",
                            fontSize: 13,
                          }}
                        >
                          Enter a ZIP or select a state in the left panel to
                          load posts and pins.
                        </div>
                      )}

                      {!loading && stateFilter && filtered.length === 0 && (
                        <div
                          style={{
                            padding: "16px 14px",
                            color: "var(--gray)",
                            fontSize: 13,
                          }}
                        >
                          No posts match the current filters.
                        </div>
                      )}

                      {!loading &&
                        stateFilter &&
                        filtered.map((post) => {
                          const isPlayer =
                            post.post_type === "player_available";
                          const isOwner =
                            user && post.user_id && post.user_id === user.id;
                          const isSelected = selectedPostId === post.id;
                          const postTypeLabel = isPlayer
                            ? "Player Available"
                            : "Player Needed";

                          return (
                            <div
                              key={post.id}
                              style={{
                                borderBottom: "1px solid rgba(15,23,42,0.06)",
                                background: isSelected
                                  ? "#FCFCFD"
                                  : "var(--white)",
                              }}
                            >
                              <div
                                onClick={() => setSelectedPostId(post.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    setSelectedPostId(post.id);
                                  }
                                }}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: desktopRowTemplate,
                                  gap: 10,
                                  alignItems: "center",
                                  padding: "9px 14px",
                                  cursor: "pointer",
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      maxWidth: "100%",
                                      ...getTypeChipStyle(isPlayer),
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "4px 8px",
                                      borderRadius: 999,
                                      fontFamily: "var(--font-head)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {postTypeLabel}
                                  </span>
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      ...getSportChipStyle(post.sport),
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "4px 8px",
                                      borderRadius: 999,
                                      fontFamily: "var(--font-head)",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.05em",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {post.sport}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    minWidth: 0,
                                    fontSize: 12,
                                    color: "var(--gray)",
                                    lineHeight: 1.35,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={getPostPositionDetails(post)}
                                >
                                  {getPostPositionDetails(post)}
                                </div>

                                <div
                                  style={{
                                    minWidth: 0,
                                    fontSize: 12,
                                    color: "var(--gray)",
                                    lineHeight: 1.35,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={getPostDateLabel(post)}
                                >
                                  {getPostDateLabel(post) || "—"}
                                </div>

                                <div
                                  style={{
                                    minWidth: 0,
                                    fontSize: 12,
                                    color: "var(--gray)",
                                    lineHeight: 1.35,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={getPostLocation(post)}
                                >
                                  {getPostLocation(post)}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontFamily: "var(--font-head)",
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: "var(--navy)",
                                      lineHeight: 1.2,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={getPostTitle(post)}
                                  >
                                    {getPostTitle(post)}
                                  </div>
                                  <div
                                    style={{
                                      marginTop: 3,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      minHeight: 16,
                                    }}
                                  >
                                    {isOwner && (
                                      <span
                                        style={{
                                          background: "var(--gold)",
                                          color: "var(--navy)",
                                          fontSize: 9,
                                          fontWeight: 800,
                                          padding: "3px 6px",
                                          borderRadius: 999,
                                          fontFamily: "var(--font-head)",
                                          letterSpacing: "0.05em",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Your Post
                                      </span>
                                    )}
                                    {post.city && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          color: "var(--gray)",
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                        title={post.city}
                                      >
                                        {post.city}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setSelectedPostId(
                                        isSelected ? null : post.id,
                                      );
                                    }}
                                    style={{
                                      minWidth: 64,
                                      padding: "7px 8px",
                                      borderRadius: 9,
                                      border: "1.5px solid var(--navy)",
                                      background: isSelected
                                        ? "var(--navy)"
                                        : "var(--white)",
                                      color: isSelected
                                        ? "var(--white)"
                                        : "var(--navy)",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "var(--font-head)",
                                    }}
                                  >
                                    {isSelected ? "Close" : "Open"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {!isMobile && selectedPost && (
                      <div
                        style={{
                          position: "fixed",
                          top: 128,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "min(440px, calc(100vw - 48px))",
                          maxHeight: "calc(100vh - 156px)",
                          overflowY: "auto",
                          background: "rgba(255,255,255,0.985)",
                          border: "1px solid rgba(15,23,42,0.10)",
                          borderRadius: 18,
                          boxShadow: "0 22px 56px rgba(15,23,42,0.24)",
                          padding: 18,
                          zIndex: 60,
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 10,
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "5px 9px",
                                  borderRadius: 999,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  fontFamily: "var(--font-head)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  ...getTypeChipStyle(
                                    selectedPost.post_type ===
                                      "player_available",
                                  ),
                                }}
                              >
                                {selectedPost.post_type ===
                                "player_available"
                                  ? "Player Available"
                                  : "Player Needed"}
                              </span>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "5px 9px",
                                  borderRadius: 999,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  fontFamily: "var(--font-head)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  ...getSportChipStyle(selectedPost.sport),
                                }}
                              >
                                {selectedPost.sport}
                              </span>
                              {selectedPost.age_group && (
                                <span
                                  style={{
                                    background: "#F3F4F6",
                                    color: "var(--navy)",
                                    border: "1px solid #E5E7EB",
                                    padding: "5px 9px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {selectedPost.age_group}
                                </span>
                              )}
                              {selectedPost.player_age && (
                                <span
                                  style={{
                                    background: "#ECFDF5",
                                    color: "#166534",
                                    border: "1px solid #BBF7D0",
                                    padding: "5px 9px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  Age {selectedPost.player_age}
                                </span>
                              )}
                              {selectedPost.event_date && (
                                <span
                                  style={{
                                    background: "#FEF3C7",
                                    color: "#92400E",
                                    border: "1px solid #FDE68A",
                                    padding: "5px 9px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {getPostDateLabel(selectedPost)}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-head)",
                                fontSize: 22,
                                fontWeight: 800,
                                color: "var(--navy)",
                                lineHeight: 1.15,
                              }}
                            >
                              {getPostTitle(selectedPost)}
                            </div>
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 13,
                                color: "var(--gray)",
                                lineHeight: 1.45,
                              }}
                            >
                              {getPostLocation(selectedPost)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedPostId(null)}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 999,
                              border: "1px solid rgba(15,23,42,0.12)",
                              background: "var(--white)",
                              color: "var(--navy)",
                              fontSize: 18,
                              lineHeight: 1,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                            aria-label="Close details"
                          >
                            ×
                          </button>
                        </div>

                        <div
                          style={{
                            marginTop: 14,
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              background: "#F8FAFC",
                              border: "1px solid rgba(15,23,42,0.06)",
                              borderRadius: 12,
                              padding: 12,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "var(--gray)",
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                                marginBottom: 8,
                              }}
                            >
                              Position / details
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--navy)",
                                lineHeight: 1.55,
                                fontWeight: 600,
                              }}
                            >
                              {getPostPositionDetails(selectedPost)}
                            </div>
                            {selectedPost.event_date && (
                              <div
                                style={{
                                  marginTop: 10,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#FEF3C7",
                                  color: "#92400E",
                                  border: "1px solid #FDE68A",
                                  borderRadius: 999,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                <span>{getPostDateLabel(selectedPost)}</span>
                              </div>
                            )}
                            {selectedTravelLabel && (
                              <div
                                style={{
                                  marginTop: 10,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#EFF6FF",
                                  color: "#1D4ED8",
                                  border: "1px solid #BFDBFE",
                                  borderRadius: 999,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                <span>🚗</span>
                                <span>{selectedTravelLabel}</span>
                              </div>
                            )}
                          </div>

                          {selectedPost.player_description && (
                            <div
                              style={{
                                background: "var(--white)",
                                border: "1px solid rgba(15,23,42,0.06)",
                                borderRadius: 12,
                                padding: 12,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: "var(--gray)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em",
                                  marginBottom: 8,
                                }}
                              >
                                Description
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "var(--gray)",
                                  lineHeight: 1.6,
                                }}
                              >
                                {selectedPost.player_description}
                              </div>
                            </div>
                          )}

                          {selectedPostDetailLines.filter(
                            (line) =>
                              !line.startsWith("Willing to travel"),
                          ).length > 0 && (
                            <div
                              style={{
                                background: "var(--white)",
                                border: "1px solid rgba(15,23,42,0.06)",
                                borderRadius: 12,
                                padding: 12,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color: "var(--gray)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.07em",
                                  marginBottom: 8,
                                }}
                              >
                                Notes
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                {selectedPostDetailLines
                                  .filter(
                                    (line) =>
                                      !line.startsWith(
                                        "Willing to travel",
                                      ),
                                  )
                                  .map((line, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        fontSize: 12,
                                        lineHeight: 1.5,
                                        color: "var(--gray)",
                                      }}
                                    >
                                      {line}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              background: "var(--white)",
                              border: "1px solid rgba(15,23,42,0.06)",
                              borderRadius: 12,
                              padding: 12,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "var(--gray)",
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                                marginBottom: 8,
                              }}
                            >
                              Contact / details
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                lineHeight: 1.55,
                                color: "var(--navy)",
                              }}
                            >
                              <ContactDisplay
                                contact_info={selectedPost.contact_info}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--gray)",
                                marginTop: 10,
                              }}
                            >
                              Posted {formatDate(selectedPost.created_at)}
                            </div>
                            {selectedPost.city && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "var(--gray)",
                                  marginTop: 4,
                                }}
                              >
                                {selectedPost.city}
                                {stateFromPost(selectedPost, zipStateMap)
                                  ? `, ${stateFromPost(selectedPost, zipStateMap)}`
                                  : ""}
                              </div>
                            )}
                            {user &&
                              selectedPost.user_id &&
                              selectedPost.user_id === user.id && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTop: "1px solid var(--lgray)",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => startEdit(selectedPost)}
                                    style={{
                                      flex: 1,
                                      padding: "8px",
                                      background: "var(--navy)",
                                      color: "white",
                                      border: "none",
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "var(--font-head)",
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget(selectedPost)
                                    }
                                    style={{
                                      flex: 1,
                                      padding: "8px",
                                      background: "white",
                                      color: "#DC2626",
                                      border: "2px solid #FCA5A5",
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "var(--font-head)",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 6,
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 14,
                      alignItems: "stretch",
                    }}
                  >
                    {loading && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "30px 0",
                          color: "var(--gray)",
                          fontSize: 14,
                        }}
                      >
                        Loading posts...
                      </div>
                    )}

                    {!loading && !stateFilter && (
                      <div
                        style={{
                          background: "var(--white)",
                          border: "1px solid rgba(15,23,42,0.06)",
                          borderRadius: 14,
                          padding: "16px",
                          color: "var(--gray)",
                          fontSize: 13,
                        }}
                      >
                        Enter a ZIP or select a state in the left panel to load posts and pins.
                      </div>
                    )}

                    {!loading && stateFilter && filtered.length === 0 && (
                      <div
                        style={{
                          background: "var(--white)",
                          border: "1px solid rgba(15,23,42,0.06)",
                          borderRadius: 14,
                          padding: "16px",
                          color: "var(--gray)",
                          fontSize: 13,
                        }}
                      >
                        No posts match the current filters.
                      </div>
                    )}

                    {!loading &&
                      stateFilter &&
                      filtered.map((post) => {
                        const isPlayer = post.post_type === "player_available";
                        const postPositions = isPlayer
                          ? Array.isArray(post.player_position)
                            ? post.player_position
                            : []
                          : Array.isArray(post.position_needed)
                            ? post.position_needed
                            : [];
                        const isOwner =
                          user && post.user_id && post.user_id === user.id;
                        return (
                          <div
                            key={post.id}
                            style={{
                              background: "white",
                              borderRadius: 12,
                              border: isOwner
                                ? "2px solid var(--gold)"
                                : "2px solid " +
                                  (isPlayer ? "#DBEAFE" : "#FEF3C7"),
                              padding: "18px",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                              position: "relative",
                            }}
                          >
                            {isOwner && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: -1,
                                  right: 12,
                                  background: "var(--gold)",
                                  color: "var(--navy)",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "0 0 6px 6px",
                                  fontFamily: "var(--font-head)",
                                  letterSpacing: "0.04em",
                                }}
                              >
                                YOUR POST
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <span
                                style={{
                                  ...getTypeChipStyle(isPlayer),
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 9px",
                                  borderRadius: 20,
                                  fontFamily: "var(--font-head)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {isPlayer
                                  ? "🧢 Player Available"
                                  : "⚾ Player Needed"}
                              </span>
                              <span
                                style={{
                                  ...getSportChipStyle(post.sport),
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "3px 9px",
                                  borderRadius: 20,
                                  fontFamily: "var(--font-head)",
                                  textTransform: "uppercase",
                                }}
                              >
                                {post.sport}
                              </span>
                            </div>
                            <div>
                              <div
                                style={{
                                  fontFamily: "var(--font-head)",
                                  fontSize: 17,
                                  fontWeight: 700,
                                }}
                              >
                                {getPostTitle(post)}
                                {post.post_type === "player_available" &&
                                post.city
                                  ? ` — ${post.city}`
                                  : ""}
                              </div>
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "var(--gray)",
                                  marginTop: 4,
                                }}
                              >
                                📍 {getPostLocation(post)}
                              </div>
                              {post.post_type === "player_available" &&
                                (post.bats || post.throws) && (
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "var(--gray)",
                                      marginTop: 4,
                                    }}
                                  >
                                    {[
                                      post.bats ? "Bats " + post.bats : "",
                                      post.throws
                                        ? "Throws " + post.throws
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </div>
                                )}
                              {post.player_description && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "var(--gray)",
                                    marginTop: 6,
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {post.player_description}
                                </div>
                              )}
                              {post.additional_notes && (
                                <div style={{ marginTop: 4 }}>
                                  {post.additional_notes
                                    .split("\n")
                                    .map((line, i) => (
                                      <div
                                        key={i}
                                        style={{
                                          fontSize: 13,
                                          lineHeight: 1.5,
                                          color: line.startsWith(
                                            "Willing to travel",
                                          )
                                            ? "#2563EB"
                                            : "var(--gray)",
                                          fontWeight: line.startsWith(
                                            "Willing to travel",
                                          )
                                            ? 600
                                            : 400,
                                        }}
                                      >
                                        {line.startsWith("Willing to travel")
                                          ? "🚗 "
                                          : ""}
                                        {line}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                            {postPositions.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 5,
                                  marginTop: 10,
                                }}
                              >
                                {postPositions.map((pos) => (
                                  <span
                                    key={pos}
                                    style={{
                                      background: "var(--lgray)",
                                      color: "var(--navy)",
                                      fontSize: 11,
                                      padding: "2px 8px",
                                      borderRadius: 20,
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {pos}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div
                              style={{
                                marginTop: 12,
                                paddingTop: 12,
                                borderTop: "1px solid var(--lgray)",
                                fontSize: 13,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "var(--navy)",
                                }}
                              >
                                📬{" "}
                              </span>
                              <ContactDisplay
                                contact_info={post.contact_info}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--gray)",
                                marginTop: 6,
                              }}
                            >
                              Posted {formatDate(post.created_at)}
                            </div>
                            {isOwner && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  marginTop: 12,
                                  paddingTop: 12,
                                  borderTop: "1px solid var(--lgray)",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => startEdit(post)}
                                  style={{
                                    flex: 1,
                                    padding: "7px",
                                    background: "var(--navy)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: 7,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "var(--font-head)",
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(post)}
                                  style={{
                                    flex: 1,
                                    padding: "7px",
                                    background: "white",
                                    color: "#DC2626",
                                    border: "2px solid #FCA5A5",
                                    borderRadius: 7,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontFamily: "var(--font-head)",
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </main>

              {!isMobile && (
                <aside
                  style={{
                    position: "sticky",
                    top: 76,
                    alignSelf: "start",
                    padding: "8px 0 0 0",
                    width: "230px",
                    justifySelf: "end",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <AdBox />
                    <AdBox />
                    <AdBox />
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
