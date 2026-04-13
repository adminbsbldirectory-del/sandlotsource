import { Link } from 'react-router-dom'
import CoachResult from './CoachResult'
import TeamResult from './TeamResult'
import FacilityResult from './FacilityResult'

const RED = 'var(--navy)'
const DARK = '#1a1a1a'
const BORDER = '#eaeae6'
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

        </div>
      )}
    </>
  )
}