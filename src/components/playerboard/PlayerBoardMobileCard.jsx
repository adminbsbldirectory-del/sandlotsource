export default function PlayerBoardMobileCard({
  post,
  user,
  startEdit,
  setDeleteTarget,
  getTypeChipStyle,
  getSportChipStyle,
  getPostTitle,
  getPostLocation,
  getNeededLocationParts,
  ContactDisplay,
  formatDate,
}) {
  const isPlayer = post.post_type === "player_available";
  const postPositions = isPlayer
    ? Array.isArray(post.player_position)
      ? post.player_position
      : []
    : Array.isArray(post.position_needed)
      ? post.position_needed
      : [];
  const isOwner = user && post.user_id && post.user_id === user.id;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        border: isOwner
          ? "2px solid var(--gold)"
          : "2px solid " + (isPlayer ? "#DBEAFE" : "#FEF3C7"),
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
          {isPlayer ? "🧢 Player Available" : "⚾ Player Needed"}
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
          {post.post_type === "player_available" && post.city
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
          {post.post_type === "player_needed" ? (
            (() => {
              const locationParts = getNeededLocationParts(post);
              return (
                <div style={{ display: "grid", gap: 2 }}>
                  <div
                    style={{
                      color: "var(--navy)",
                      fontWeight: 700,
                    }}
                  >
                    📍 {locationParts.facility || "Facility pending"}
                  </div>
                  {locationParts.address && <div>{locationParts.address}</div>}
                  {locationParts.cityLine && <div>{locationParts.cityLine}</div>}
                  {locationParts.field && (
                    <div>Field / Diamond: {locationParts.field}</div>
                  )}
                </div>
              );
            })()
          ) : (
            <>📍 {getPostLocation(post)}</>
          )}
        </div>

        {post.post_type === "player_available" && (post.bats || post.throws) && (
          <div
            style={{
              fontSize: 13,
              color: "var(--gray)",
              marginTop: 4,
            }}
          >
            {[
              post.bats ? "Bats " + post.bats : "",
              post.throws ? "Throws " + post.throws : "",
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
            {post.additional_notes.split("\n").map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: line.startsWith("Willing to travel")
                    ? "#2563EB"
                    : "var(--gray)",
                  fontWeight: line.startsWith("Willing to travel") ? 600 : 400,
                }}
              >
                {line.startsWith("Willing to travel") ? "🚗 " : ""}
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
        <ContactDisplay contact_info={post.contact_info} />
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
}