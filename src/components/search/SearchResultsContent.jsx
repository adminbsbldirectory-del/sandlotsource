import { Link } from 'react-router-dom'
import CoachResult from './CoachResult'
import TeamResult from './TeamResult'
import FacilityResult from './FacilityResult'

const RED = 'var(--navy)'
const DARK = '#1a1a1a'
const MUTED = '#888'

function ResultCount({ count }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: count > 0 ? RED : '#eef0f2',
        color: count > 0 ? '#fff' : MUTED,
        fontSize: 11,
        fontWeight: 600,
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        padding: '0 6px',
        marginLeft: 8,
      }}
    >
      {count}
    </span>
  )
}

function SectionHeader({ title, count, isCollapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0 12px',
        borderBottom: '1px solid #eef0f2',
        cursor: 'pointer',
        userSelect: 'none',
        marginBottom: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: DARK,
          }}
        >
          {title}
        </span>
        <ResultCount count={count} />
      </div>
      <span style={{ fontSize: 13, color: MUTED }}>
        {isCollapsed ? '▼ Show' : '▲ Hide'}
      </span>
    </div>
  )
}

function EmptyState({ query }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', color: MUTED }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: DARK, marginBottom: 6 }}>
        No results found{query ? ` for "${query}"` : ''}
      </div>
      <div style={{ fontSize: 13 }}>
        Try broadening your search — remove a filter or increase the radius.
      </div>
    </div>
  )
}

function ViewToggle({ resultView, setResultView, isMobile }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        padding: 4,
        border: '1px solid #eef0f2',
        borderRadius: 12,
        background: '#fff',
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        onClick={() => setResultView('list')}
        style={{
          border: 'none',
          borderRadius: 8,
          padding: isMobile ? '9px 14px' : '8px 12px',
          background: resultView === 'list' ? RED : 'transparent',
          color: resultView === 'list' ? '#fff' : DARK,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => setResultView('map')}
        style={{
          border: 'none',
          borderRadius: 8,
          padding: isMobile ? '9px 14px' : '8px 12px',
          background: resultView === 'map' ? RED : 'transparent',
          color: resultView === 'map' ? '#fff' : DARK,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Map
      </button>
    </div>
  )
}

function MapHandoffCard({ title, body, linkTo, linkLabel, isDisabled = false }) {
  return (
    <div
      style={{
        border: '1px solid #eef0f2',
        borderRadius: 12,
        background: '#fff',
        padding: '18px 16px',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: DARK,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          color: MUTED,
          lineHeight: 1.5,
          marginBottom: 14,
        }}
      >
        {body}
      </div>

      {isDisabled ? (
        <span
          style={{
            display: 'inline-block',
            fontSize: 13,
            fontWeight: 600,
            color: MUTED,
          }}
        >
          {linkLabel}
        </span>
      ) : (
        <Link
          to={linkTo}
          style={{
            display: 'inline-block',
            fontSize: 13,
            fontWeight: 600,
            color: RED,
            textDecoration: 'none',
          }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

function SingleTypeMapView({
  listingType,
  coachBrowseLink,
  teamBrowseLink,
  facilityBrowseLink,
  zip,
  geoResult,
}) {
  const hasMapContext = zip && zip.length === 5 && !!geoResult

  if (!hasMapContext) {
    return (
      <MapHandoffCard
        title="Map view needs a ZIP code"
        body="Add a valid ZIP code to open nearby results on the directory map. Search results can still be browsed in list view without a ZIP."
        linkTo="#"
        linkLabel="Add ZIP code above"
        isDisabled
      />
    )
  }

  if (listingType === 'coach') {
    return (
      <MapHandoffCard
        title="Coach map view"
        body="Open the coach directory map to browse nearby coach pins with the filters you already applied."
        linkTo={coachBrowseLink}
        linkLabel="Open coach map →"
      />
    )
  }

  if (listingType === 'team') {
    return (
      <MapHandoffCard
        title="Team map view"
        body="Open the team directory map to browse nearby teams with the filters you already applied."
        linkTo={teamBrowseLink}
        linkLabel="Open team map →"
      />
    )
  }

  if (listingType === 'facility') {
    return (
      <MapHandoffCard
        title="Facility map view"
        body="Open the facilities directory map to browse nearby facility pins with the filters you already applied."
        linkTo={facilityBrowseLink}
        linkLabel="Open facility map →"
      />
    )
  }

  return null
}

export default function SearchResultsContent({
  loading,
  totalResults,
  query,
  isMobile,
  filteredCoaches,
  filteredTeams,
  filteredFacilities,
  coachesCollapsed,
  teamsCollapsed,
  facilitiesCollapsed,
  onToggleCoaches,
  onToggleTeams,
  onToggleFacilities,
  getDistance,
  buildDirectoryQuery,
  coachBrowseLink,
  teamBrowseLink,
  facilityBrowseLink,
  resultView,
  setResultView,
  isSingleTypeMapEligible,
  listingType,
  zip,
  geoResult,
}) {
  const resultsGridColumns = isMobile ? '1fr' : '1fr 1fr'

  return (
    <>
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
          <div style={{ fontSize: 14 }}>Searching…</div>
        </div>
      )}

      {!loading && totalResults === 0 && <EmptyState query={query} />}

      {!loading && totalResults > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 22,
            alignItems: 'start',
            marginTop: 8,
          }}
        >
          {isSingleTypeMapEligible && (
            <div>
              <ViewToggle
                resultView={resultView}
                setResultView={setResultView}
                isMobile={isMobile}
              />
            </div>
          )}

          {isSingleTypeMapEligible && resultView === 'map' ? (
            <SingleTypeMapView
              listingType={listingType}
              coachBrowseLink={coachBrowseLink}
              teamBrowseLink={teamBrowseLink}
              facilityBrowseLink={facilityBrowseLink}
              zip={zip}
              geoResult={geoResult}
            />
          ) : (
            <div>
              {filteredCoaches.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    title="Coaches"
                    count={filteredCoaches.length}
                    isCollapsed={coachesCollapsed}
                    onToggle={onToggleCoaches}
                  />
                  {!coachesCollapsed && (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: resultsGridColumns,
                          gap: isMobile ? 12 : 10,
                        }}
                      >
                        {filteredCoaches.map((coach) => (
                          <CoachResult
                            key={coach.id}
                            coach={coach}
                            distanceMi={getDistance(coach)}
                            to={`/coaches${buildDirectoryQuery({ select: coach.id })}`}
                          />
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <Link
                          to={coachBrowseLink}
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: RED,
                            textDecoration: 'none',
                          }}
                        >
                          View all coaches →
                        </Link>
                      </div>
                      {isMobile && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              border: '1px solid #eef0f2',
                              borderRadius: 10,
                              padding: '16px 14px',
                              textAlign: 'center',
                              color: MUTED,
                              fontSize: 12,
                              background: '#f8fafb',
                            }}
                          >
                            Sponsored placement
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {filteredTeams.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    title="Teams"
                    count={filteredTeams.length}
                    isCollapsed={teamsCollapsed}
                    onToggle={onToggleTeams}
                  />
                  {!teamsCollapsed && (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: resultsGridColumns,
                          gap: isMobile ? 12 : 10,
                        }}
                      >
                        {filteredTeams.map((team) => (
                          <TeamResult
                            key={team.id}
                            team={team}
                            distanceMi={getDistance(team)}
                            to={`/teams${buildDirectoryQuery({ select: team.id })}`}
                          />
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <Link
                          to={teamBrowseLink}
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: RED,
                            textDecoration: 'none',
                          }}
                        >
                          View all teams →
                        </Link>
                      </div>
                      {isMobile && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              border: '1px solid #eef0f2',
                              borderRadius: 10,
                              padding: '16px 14px',
                              textAlign: 'center',
                              color: MUTED,
                              fontSize: 12,
                              background: '#f8fafb',
                            }}
                          >
                            Sponsored placement
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {filteredFacilities.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    title="Facilities"
                    count={filteredFacilities.length}
                    isCollapsed={facilitiesCollapsed}
                    onToggle={onToggleFacilities}
                  />
                  {!facilitiesCollapsed && (
                    <>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: resultsGridColumns,
                          gap: isMobile ? 12 : 10,
                        }}
                      >
                        {filteredFacilities.map((facility) => (
                          <FacilityResult
                            key={facility.id}
                            facility={facility}
                            distanceMi={getDistance(facility)}
                            to={`/facilities/${facility.id}${buildDirectoryQuery()}`}
                          />
                        ))}
                      </div>
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <Link
                          to={facilityBrowseLink}
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: RED,
                            textDecoration: 'none',
                          }}
                        >
                          View all facilities →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}