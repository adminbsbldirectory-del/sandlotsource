export default function PlayerBoardDetailPanel({
  selectedPost,
  selectedPostDetailLines,
  selectedTravelLabel,
  user,
  zipStateMap,
  setSelectedPostId,
  startEdit,
  setDeleteTarget,
  getTypeChipStyle,
  getSportChipStyle,
  getPostTitle,
  getPostLocation,
  getNeededLocationParts,
  getPostPositionDetails,
  getPostDateLabel,
  ContactDisplay,
  formatDate,
  stateFromPost,
}) {
  if (!selectedPost) return null;

  const isOwner =
    user && selectedPost.user_id && selectedPost.user_id === user.id;

  const visibleDetailLines = selectedPostDetailLines.filter(
    (line) => !line.startsWith("Willing to travel"),
  );

  return (
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
                  selectedPost.post_type === "player_available",
                ),
              }}
            >
              {selectedPost.post_type === "player_available"
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
            {selectedPost.post_type === "player_needed" ? (
              (() => {
                const locationParts = getNeededLocationParts(selectedPost);
                return (
                  <div style={{ display: "grid", gap: 3 }}>
                    {locationParts.facility && (
                      <div
                        style={{
                          color: "var(--navy)",
                          fontWeight: 700,
                        }}
                      >
                        {locationParts.facility}
                      </div>
                    )}
                    {locationParts.address && <div>{locationParts.address}</div>}
                    {locationParts.cityLine && <div>{locationParts.cityLine}</div>}
                    {locationParts.field && (
                      <div style={{ fontSize: 12 }}>
                        Field / Diamond: {locationParts.field}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
            getPostLocation(selectedPost)
            )}
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

        {visibleDetailLines.length > 0 && (
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
              {visibleDetailLines.map((line, index) => (
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
            <ContactDisplay contact_info={selectedPost.contact_info} />
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
                onClick={() => setDeleteTarget(selectedPost)}
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
  );
}