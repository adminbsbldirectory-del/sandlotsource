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

## In progress
- Phase 1 shared utilities complete through Leaflet default marker init extraction

## Next steps
- Start next Phase 1 shared utility candidate in a new thread
- Inspect next duplication carefully before editing
- Continue one utility at a time