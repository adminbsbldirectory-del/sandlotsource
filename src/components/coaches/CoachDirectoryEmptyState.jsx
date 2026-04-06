export default function CoachDirectoryEmptyState({
  facilityContextName,
  hasLocationSearch,
}) {
  if (!facilityContextName && !hasLocationSearch) {
    return (
      <div className="empty-state">
        <h3>Start with your ZIP code</h3>
        <p>
          Enter a ZIP code and choose a radius to see coaches near you first.
        </p>
      </div>
    )
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
  )
}