export default function FacilitiesEmptyState({ hasLocationSearch, hasFilters }) {
  if (!hasLocationSearch) {
    return (
      <div className="empty-state">
        <h3>Start with your ZIP code</h3>
        <p>Enter a ZIP code and choose a radius to see facilities near you first.</p>
      </div>
    )
  }

  return (
    <div className="empty-state">
      <h3>{hasFilters ? 'No facilities match your filters' : 'No facilities found in this area'}</h3>
      <p>
        {hasFilters
          ? 'Try widening your search — clear a filter or increase the radius.'
          : 'Try a different ZIP code or a larger radius.'}
      </p>
    </div>
  )
}
