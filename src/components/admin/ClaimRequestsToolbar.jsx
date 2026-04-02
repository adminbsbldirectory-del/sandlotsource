export default function ClaimRequestsToolbar({
  search,
  onSearchChange,
  listingType,
  onListingTypeChange,
  requestKind,
  onRequestKindChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
  shownCount,
  styles,
}) {
  return (
    <div style={styles.toolbar}>
      <div style={styles.filterRow}>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search claim requests…"
          style={styles.searchInput}
        />

        <select
          value={listingType}
          onChange={(e) => onListingTypeChange(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Listing Types</option>
          <option value="coach">Coach</option>
          <option value="team">Team</option>
          <option value="facility">Facility</option>
        </select>

        <select
          value={requestKind}
          onChange={(e) => onRequestKindChange(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Request Kinds</option>
          <option value="claim">Claim</option>
          <option value="update">Update</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <span style={styles.countBadge}>{shownCount} shown</span>
      </div>
    </div>
  )
}