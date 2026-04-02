export default function PlayerBoardBrowseSidebar({
  isMobile,
  filtered,
  stateFilter,
  selectedStateName,
  filter,
  setFilter,
  sportFilter,
  setSportFilter,
  nearbyZip,
  setNearbyZip,
  nearbyMiles,
  setNearbyMiles,
  hasSearched,
  setHasSearched,
  showMap,
  setShowMap,
  setStateFilter,
  labelStyle,
  inputStyle,
  selectStyle,
  US_STATES,
  STATE_NAMES,
  RailAdSlot,
}) {
  return (
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                  color: filter === value ? "var(--white)" : "var(--navy)",
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
                setSportFilter((s) => (s === "baseball" ? "Both" : "baseball"))
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
                setSportFilter((s) => (s === "softball" ? "Both" : "softball"))
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
              if (typeof window !== "undefined") {
                window.location.href = "/submit";
              }
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
          <RailAdSlot
            slotKey="player_board_left_rail_1_desktop"
            reservedHeight={250}
          />
        </div>
      )}
    </aside>
  );
}