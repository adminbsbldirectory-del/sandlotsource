export default function PlayerBoardDesktopRow({
  post,
  user,
  selectedPostId,
  setSelectedPostId,
  getTypeChipStyle,
  getSportChipStyle,
  getPostTitle,
  getDesktopLocationPreview,
  getNeededLocationParts,
  getPostPositionDetails,
  getPostDateLabel,
}) {
  const isPlayer = post.post_type === "player_available";
  const isOwner = user && post.user_id && post.user_id === user.id;
  const isSelected = selectedPostId === post.id;
  const postTypeLabel = isPlayer ? "Player Available" : "Player Needed";

  const desktopRowTemplate =
    "minmax(120px, 0.78fr) minmax(95px, 0.6fr) minmax(220px, 1.3fr) minmax(150px, 0.9fr) minmax(220px, 1.15fr) minmax(190px, 1fr) 82px";

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(15,23,42,0.06)",
        background: isSelected ? "#FCFCFD" : "var(--white)",
      }}
    >
      <div
        onClick={() => setSelectedPostId(post.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
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
          }}
          title={getDesktopLocationPreview(post)}
        >
          {post.post_type === "player_needed" ? (
            (() => {
              const locationParts = getNeededLocationParts(post);
              return (
                <div
                  style={{
                    display: "grid",
                    gap: 2,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      color: "var(--navy)",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={locationParts.facility || "Facility pending"}
                  >
                    {locationParts.facility || "Facility pending"}
                  </div>
                  {locationParts.address && (
                    <div
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={locationParts.address}
                    >
                      {locationParts.address}
                    </div>
                  )}
                  {locationParts.cityLine && (
                    <div
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={locationParts.cityLine}
                    >
                      {locationParts.cityLine}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {getDesktopLocationPreview(post)}
            </div>
          )}
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
              setSelectedPostId(isSelected ? null : post.id);
            }}
            style={{
              minWidth: 64,
              padding: "7px 8px",
              borderRadius: 9,
              border: "1.5px solid var(--navy)",
              background: isSelected ? "var(--navy)" : "var(--white)",
              color: isSelected ? "var(--white)" : "var(--navy)",
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
}