import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import PlayerBoardDetailPanel from "./PlayerBoardDetailPanel.jsx";
import PlayerBoardDesktopRow from "./PlayerBoardDesktopRow.jsx";
import PlayerBoardMobileCard from "./PlayerBoardMobileCard.jsx";

export default function PlayerBoardBrowseContent({
  isMobile,
  showBrowseMap,
  mappable,
  stateFilter,
  filtered,
  loading,
  selectedStateName,
  selectedPost,
  selectedPostDetailLines,
  selectedTravelLabel,
  selectedPostId,
  user,
  zipStateMap,
  setSelectedPostId,
  startEdit,
  setDeleteTarget,
  makeIcon,
  getPinColor,
  getTypeChipStyle,
  getSportChipStyle,
  getPostTitle,
  getPostLocation,
  getNeededLocationParts,
  getDesktopLocationPreview,
  getPostPositionDetails,
  getPostDateLabel,
  ContactDisplay,
  formatDate,
  stateFromPost,
  DirectoryAdBand,
  RailAdSlot,
  MapViewport,
}) {
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

  return (
    <div style={{ minWidth: 0 }}>
      {isMobile && (
        <DirectoryAdBand
          slotKey="player_board_inline_1_mobile"
          maxWidth={320}
          reservedHeight={100}
          isMobile={true}
          marginTop={12}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: !isMobile ? "minmax(0, 1fr) 300px" : "1fr",
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
                  <MapViewport posts={mappable} showFullUS={!stateFilter} />
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
                              <ContactDisplay contact_info={p.contact_info} />
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
                  <div style={desktopHeaderCellStyle}>Position / Details</div>
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
                    Enter a ZIP or select a state in the left panel to load posts
                    and pins.
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
                  filtered.map((post) => (
                    <PlayerBoardDesktopRow
                      key={post.id}
                      post={post}
                      user={user}
                      selectedPostId={selectedPostId}
                      setSelectedPostId={setSelectedPostId}
                      getTypeChipStyle={getTypeChipStyle}
                      getSportChipStyle={getSportChipStyle}
                      getPostTitle={getPostTitle}
                      getDesktopLocationPreview={getDesktopLocationPreview}
                      getNeededLocationParts={getNeededLocationParts}
                      getPostPositionDetails={getPostPositionDetails}
                      getPostDateLabel={getPostDateLabel}
                    />
                  ))}
              </div>

              {selectedPost && (
                <PlayerBoardDetailPanel
                  selectedPost={selectedPost}
                  selectedPostDetailLines={selectedPostDetailLines}
                  selectedTravelLabel={selectedTravelLabel}
                  user={user}
                  zipStateMap={zipStateMap}
                  setSelectedPostId={setSelectedPostId}
                  startEdit={startEdit}
                  setDeleteTarget={setDeleteTarget}
                  getTypeChipStyle={getTypeChipStyle}
                  getSportChipStyle={getSportChipStyle}
                  getPostTitle={getPostTitle}
                  getPostLocation={getPostLocation}
                  getNeededLocationParts={getNeededLocationParts}
                  getPostPositionDetails={getPostPositionDetails}
                  getPostDateLabel={getPostDateLabel}
                  ContactDisplay={ContactDisplay}
                  formatDate={formatDate}
                  stateFromPost={stateFromPost}
                />
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
                  Enter a ZIP or select a state in the left panel to load posts
                  and pins.
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
                filtered.map((post) => (
                  <PlayerBoardMobileCard
                    key={post.id}
                    post={post}
                    user={user}
                    startEdit={startEdit}
                    setDeleteTarget={setDeleteTarget}
                    getTypeChipStyle={getTypeChipStyle}
                    getSportChipStyle={getSportChipStyle}
                    getPostTitle={getPostTitle}
                    getPostLocation={getPostLocation}
                    getNeededLocationParts={getNeededLocationParts}
                    ContactDisplay={ContactDisplay}
                    formatDate={formatDate}
                  />
                ))}
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
                slotKey="player_board_right_rail_1_desktop"
                reservedHeight={250}
              />
              <RailAdSlot
                slotKey="player_board_right_rail_2_desktop"
                reservedHeight={250}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}