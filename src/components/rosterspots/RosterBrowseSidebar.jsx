import RailAdSlot from '../ads/RailAdSlot.jsx'

export default function RosterBrowseSidebar({
  zipCode,
  radiusMiles,
  zipStatus,
  zipState,
  sport,
  ageGroup,
  showMap,
  setZipCode,
  setRadiusMiles,
  setSport,
  setAgeGroup,
  setShowMap,
  setView,
  handleResetFilters,
  hasLocalSearch,
  loading,
  filtered,
  RADIUS_OPTIONS,
  AGE_GROUPS,
  fieldShell,
  filterInput,
  filterLabel,
}) {
  return (
    <aside
      style={{
        position: 'sticky',
        top: 75,
        alignSelf: 'start',
        background: '#f9fafb',
        borderRight: '1px solid #eef0f2',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          background: '#f9fafb',
          borderBottom: '1px solid #eef0f2',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--navy)',
            lineHeight: 1.1,
            marginBottom: 3,
          }}
        >
          Open Roster Spots
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.4 }}>
          Local-first search. Posts expire after 15 days.
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #eef0f2',
          background: '#f9fafb',
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={fieldShell}>
          <label style={filterLabel}>Near Zip Code</label>
          <input
            type='text'
            inputMode='numeric'
            maxLength={5}
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder='Zip code'
            style={filterInput}
          />
        </div>

        <div style={fieldShell}>
          <label style={filterLabel}>Distance</label>
          <select value={radiusMiles} onChange={(e) => setRadiusMiles(Number(e.target.value))} style={filterInput}>
            {RADIUS_OPTIONS.map((miles) => (
              <option key={miles} value={miles}>
                Up to {miles} miles
              </option>
            ))}
          </select>
        </div>

        <div style={fieldShell}>
          <label style={filterLabel}>State</label>
          <input value={zipState} readOnly placeholder='Auto' style={{ ...filterInput, background: '#F8FAFC' }} />
        </div>

        <div style={fieldShell}>
          <label style={filterLabel}>Sport</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)} style={filterInput}>
            <option value='Both'>Baseball &amp; Softball</option>
            <option value='baseball'>Baseball</option>
            <option value='softball'>Softball</option>
          </select>
        </div>

        <div style={fieldShell}>
          <label style={filterLabel}>Age Group</label>
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={filterInput}>
            <option value='All Ages'>All Ages</option>
            {AGE_GROUPS.map((age) => (
              <option key={age} value={age}>
                {age}
              </option>
            ))}
          </select>
        </div>

        <button
          type='button'
          onClick={() => setShowMap((m) => !m)}
          style={{
            height: 38,
            padding: '0 14px',
            borderRadius: 'var(--btn-radius)',
            border: '1.5px solid var(--navy)',
            background: showMap ? 'var(--navy)' : 'white',
            color: showMap ? 'white' : 'var(--navy)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-head)',
            width: '100%',
          }}
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>

        <button
          type='button'
          onClick={() => setView('post')}
          style={{
            height: 38,
            padding: '0 14px',
            borderRadius: 'var(--btn-radius)',
            background: 'var(--red)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-head)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            width: '100%',
          }}
        >
          + Post a Roster Spot
        </button>
      </div>

      {/* Status line */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #eef0f2',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ color: '#64748B', fontSize: 12, lineHeight: 1.4 }}>
          {zipStatus === 'loading' && 'Looking up ZIP\u2026'}
          {zipStatus === 'error' && 'ZIP not found. Please check and try again.'}
          {zipStatus === 'partial' && 'Enter a full 5-digit ZIP to search nearby spots.'}
          {zipStatus === 'idle' && 'Start with a ZIP, then refine by distance, sport, or age.'}
          {hasLocalSearch && !loading && `${filtered.length} spot${filtered.length !== 1 ? 's' : ''} within ${radiusMiles} miles.`}
          {hasLocalSearch && loading && 'Loading roster spots\u2026'}
        </div>
        {(sport !== 'Both' || ageGroup !== 'All Ages' || zipCode || radiusMiles !== 25 || showMap) && (
          <button
            type='button'
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--navy)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-head)',
              padding: 0,
              textAlign: 'left',
            }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Rail ad */}
      <div
        style={{
          padding: '16px 16px 0',
          borderTop: 'none',
          background: '#f9fafb',
          flex: 1,
        }}
      >
        <RailAdSlot slotKey='roster_spots_left_rail_1_desktop' />
      </div>
    </aside>
  )
}
