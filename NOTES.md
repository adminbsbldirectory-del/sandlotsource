# Sandlot Source Refactor Notes

## Current phase
Phase 1 - Shared utilities

## Active branch
refactor/shared-utilities-phase-1

## Completed
- Confirmed main was current
- Created branch refactor/shared-utilities-phase-1
- Created src/constants/usStates.js
- Updated TravelTeams.jsx to use shared US_STATES
- Updated PlayerBoard.jsx to use shared STATE_NAMES
- Tested shared state constant extraction locally
- Committed and pushed shared state constant extraction
- Created src/utils/sportUtils.js
- Updated CoachBasicsSection.jsx to use shared sport options
- Updated FacilityBasicsSection.jsx to use shared sport options
- Updated TeamBasicsSection.jsx to use shared sport options
- Tested shared sport options extraction locally
- Committed and pushed shared sport options extraction
- Created src/lib/leafletInit.js
- Updated CoachDirectory.jsx to use shared Leaflet default marker init
- Updated Facilities.jsx to use shared Leaflet default marker init
- Updated FacilityProfile.jsx to use shared Leaflet default marker init
- Updated PlayerBoard.jsx to use shared Leaflet default marker init
- Updated RosterSpots.jsx to use shared Leaflet default marker init
- Updated TravelTeams.jsx to use shared Leaflet default marker init
- Tested CoachDirectory, Facilities, FacilityProfile, PlayerBoard, RosterSpots, and TravelTeams locally after Leaflet init extraction
- Committed and pushed shared Leaflet default marker init extraction
- Created src/constants/radiusOptions.js
- Updated HomePage.jsx and SearchResults.jsx to use shared SEARCH_RADIUS_OPTIONS
- Tested Home page and Search Results locally successfully
- Committed and pushed shared search radius options extraction
- Created src/constants/directoryRadiusOptions.js
- Updated CoachDirectory.jsx and Facilities.jsx to use shared DIRECTORY_RADIUS_OPTIONS
- Tested Coaches and Facilities locally successfully
- Committed and pushed shared directory radius options extraction
- Created src/constants/featuredBadgeStyle.js
- Updated CoachDirectory.jsx and Facilities.jsx to use shared FEATURED_BADGE_STYLE
- Tested Coaches and Facilities locally successfully
- Committed and pushed shared featured badge style extraction
- Created src/constants/coachSpecialties.js
- Updated CoachDirectory.jsx and CoachSubmitForm.jsx to use shared COACH_SPECIALTIES
- Tested CoachDirectory and CoachSubmitForm locally successfully
- Committed and pushed shared coach specialties extraction
- Created src/constants/coachAgeGroups.js
- Updated CoachProfile.jsx and CoachSubmitForm.jsx to use shared coach age group constants while preserving High School in CoachSubmitForm
- Tested CoachProfile and CoachSubmitForm locally successfully
- Committed and pushed shared coach age groups extraction
- Created src/constants/positionOptions.js
- Updated CoachSubmitForm.jsx and RosterSpots.jsx to use shared POSITIONS_BB and POSITIONS_SB
- Tested CoachSubmitForm and RosterSpots locally successfully
- Committed and pushed shared position options extraction
- Updated src/constants/usStates.js to export shared US_STATE_ABBRS
- Updated CoachSubmitForm.jsx to use shared US_STATE_ABBRS
- Tested CoachSubmitForm state dropdowns locally successfully
- Committed and pushed shared state abbreviations extraction
- Created src/constants/teamAgeGroups.js
- Updated TeamBasicsSection.jsx and TravelTeams.jsx to use shared TEAM_AGE_GROUPS while preserving All Ages in TravelTeams
- Tested Team submit form and TravelTeams locally successfully
- Committed and pushed shared team age groups extraction
- Updated src/utils/sportUtils.js to export shared normalizeSportValue
- Updated CoachDirectory.jsx and FacilityProfile.jsx to use shared normalizeSportValue
- Tested CoachDirectory and FacilityProfile locally successfully
- Committed and pushed shared sport normalization extraction

## Branch: refactor/coach-directory-row-extraction
- Inspected CoachDirectory.jsx for CoachRow extraction
- Found local CoachRow as a low-risk presentational component
- Created src/components/coaches/CoachRow.jsx
- Updated CoachDirectory.jsx to import extracted CoachRow
- Kept helper/derived display logic in CoachDirectory and passed props down
- Fixed one mobile radius options reference to use DIRECTORY_RADIUS_OPTIONS
- Localhost regression check passed for Coach Directory
- No intended UI or behavior change

TravelTeams card component extraction
- Created branch: refactor/travelteams-card-components
- Extracted TeamCard from TravelTeams.jsx to src/components/teams/TeamCard.jsx
- Kept desktop inline list path unchanged
- Mobile view tested successfully in localhost
- Desktop view tested successfully in localhost
- Ready for next Phase 2 step: inspect/extract TeamPreviewCard

## In progress
- Phase 1 shared utilities appear complete pending full branch regression review and PR readiness check

## Next steps
- Run git log and diff summary against main
- Run a broader localhost regression pass across all touched pages
- Confirm NOTES.md is current
- If regression pass is clean, prepare PR for Phase 1 shared utilities branch
- Do not start Phase 2 until Phase 1 branch review is complete