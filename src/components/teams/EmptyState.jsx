export default function EmptyState({ hasFilters, stateName, zipActive, radius }) {
  if (!zipActive) {
    return (
      <div className="empty-state" style={{ margin: 0 }}>
        <h3>Start with your ZIP code</h3>
        <p>Enter a ZIP code and choose a radius to see nearby teams first.</p>
      </div>
    )
  }

  return (
    <div className="empty-state" style={{ margin: 0 }}>
      <h3>{hasFilters ? 'No teams match your filters' : `No teams listed yet${stateName ? ' in ' + stateName : ''}`}</h3>
      <p>
        {zipActive
          ? `No teams found within ${radius} miles. Try increasing the radius or removing a filter.`
          : hasFilters
            ? 'Try widening your search — remove a filter or select a different state.'
            : 'Know a travel team in this area? Help grow the directory.'}
      </p>
      {!hasFilters && <a href="/submit">Add a Team Listing</a>}
    </div>
  )
}