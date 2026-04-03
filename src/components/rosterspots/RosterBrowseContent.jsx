import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import RosterRow from './RosterRow.jsx'

export default function RosterBrowseContent({
  isMobile,
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
  hasNoResults,
  showSearchPrompt,
  mappable,
  zipGeo,
  DEFAULT_CENTER,
  RADIUS_OPTIONS,
  AGE_GROUPS,
  fieldShell,
  filterInput,
  filterLabel,
  InlineMobileAdSlot,
  FitBounds,
  makeIcon,
  PIN_COLOR,
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          background: 'var(--cream)',
          borderBottom: '2px solid var(--lgray)',
          padding: isMobile ? '18px 14px 16px' : '22px 24px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'grid',
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: isMobile ? 22 : 26,
                fontWeight: 800,
                color: 'var(--navy)',
                marginBottom: 4,
                lineHeight: 1.1,
              }}
            >
              Open Roster Spots
            </div>
            <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
              Local-first search for travel teams looking for full-season players. Posts expire after 15 days.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'minmax(190px, 220px) minmax(150px, 170px) minmax(120px, 150px) minmax(150px, 180px) minmax(150px, 180px) auto auto',
              gap: 10,
              alignItems: 'end',
            }}
          >
            <div style={fieldShell}>
              <label style={filterLabel}>Near Zip Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="Zip code"
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
              <input value={zipState} readOnly placeholder="Auto" style={{ ...filterInput, background: '#F8FAFC' }} />
            </div>

            <div style={fieldShell}>
              <label style={filterLabel}>Sport</label>
              <select value={sport} onChange={(e) => setSport(e.target.value)} style={filterInput}>
                <option value="Both">Baseball &amp; Softball</option>
                <option value="baseball">Baseball</option>
                <option value="softball">Softball</option>
              </select>
            </div>

            <div style={fieldShell}>
              <label style={filterLabel}>Age Group</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={filterInput}>
                <option value="All Ages">All Ages</option>
                {AGE_GROUPS.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowMap((m) => !m)}
              style={{
                height: 42,
                padding: '0 14px',
                borderRadius: 'var(--btn-radius)',
                border: '1.5px solid var(--navy)',
                background: showMap ? 'var(--navy)' : 'white',
                color: showMap ? 'white' : 'var(--navy)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
                whiteSpace: 'nowrap',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>

            <button
              type="button"
              onClick={() => setView('post')}
              style={{
                height: 42,
                padding: '0 16px',
                borderRadius: 'var(--btn-radius)',
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-head)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              + Post a Roster Spot
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 8,
              alignItems: 'center',
              fontSize: 12,
            }}
          >
            <div style={{ color: '#64748B' }}>
              {zipStatus === 'loading' && 'Looking up ZIP…'}
              {zipStatus === 'error' && 'ZIP not found. Please check the code and try again.'}
              {zipStatus === 'partial' && 'Enter a full 5-digit ZIP to search nearby roster spots.'}
              {zipStatus === 'idle' && 'Start with a ZIP, then refine by distance, sport, or age group.'}
              {hasLocalSearch && !loading && `${filtered.length} roster spot${filtered.length !== 1 ? 's' : ''} within ${radiusMiles} miles of ${zipCode}.`}
              {hasLocalSearch && loading && 'Loading roster spots…'}
            </div>
            {(sport !== 'Both' || ageGroup !== 'All Ages' || zipCode || radiusMiles !== 25 || showMap) && (
              <button
                type="button"
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
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {showMap && hasLocalSearch && (
        <div style={{ padding: isMobile ? '14px 14px 0' : '18px 24px 0' }}>
          <div style={{ height: isMobile ? 220 : 320, width: '100%', border: '1px solid var(--lgray)', borderRadius: 16, overflow: 'hidden' }}>
            <MapContainer center={zipGeo ? [zipGeo.lat, zipGeo.lng] : DEFAULT_CENTER} zoom={9} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds spots={mappable} zipGeo={zipGeo} />
              {mappable.map((spot) => (
                <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={makeIcon(PIN_COLOR)}>
                  <Popup>
                    <div style={{ fontFamily: 'var(--font-body)', minWidth: 180 }}>
                      <strong style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>
                        {spot.team_name || 'Open Roster'}
                      </strong>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>
                        {[spot.city, spot.state].filter(Boolean).join(', ')}
                        {spot.zip_code ? ` ${spot.zip_code}` : ''}
                      </div>
                      {spot.age_group && (
                        <div style={{ fontSize: 12, marginTop: 2 }}>
                          {spot.age_group} · {spot.sport}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {isMobile && (
        <InlineMobileAdSlot slotKey="roster_spots_inline_1_mobile" marginTop={14} />
      )}

      <div style={{ padding: isMobile ? '14px' : '18px 24px 28px' }}>
        {showSearchPrompt && !loading && (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--lgray)',
              borderRadius: 16,
              padding: isMobile ? '20px 16px' : '24px 22px',
              textAlign: 'center',
              color: '#475569',
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
              Enter a ZIP to browse nearby roster spots
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              This page now starts local-first. Add a ZIP and distance to see active roster needs near you.
            </div>
          </div>
        )}

        {hasNoResults && (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--lgray)',
              borderRadius: 16,
              padding: isMobile ? '20px 16px' : '24px 22px',
              textAlign: 'center',
              color: '#475569',
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
              No open roster spots matched this area
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
              Try a larger radius or post a roster spot for your team.
            </div>
            <button
              type="button"
              onClick={() => setView('post')}
              style={{
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontFamily: 'var(--font-head)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Post a Roster Spot
            </button>
          </div>
        )}

        {hasLocalSearch && filtered.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((spot) => (
              <RosterRow key={spot.id} spot={spot} isMobile={isMobile} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}