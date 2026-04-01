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

## In progress
- Local testing for shared sport options extraction

## Next steps
- Run npm run dev
- Test coach submit form sport buttons
- Test facility submit form sport buttons
- Test team submit form sport buttons
- Confirm no console/import errors
- Commit sportUtils extraction if stable