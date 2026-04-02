# Sandlot Source Refactor Notes

## Current phase
Phase 2 - Presentational component extractions only

## Working repo / workflow
- Working repo: C:\GitHub\sandlotsource
- Do not use: C:\Users\sshap\Documents\GitHub\sandlotsource
- Use local workflow only: VS Code + terminal + GitHub Desktop
- Do NOT use GitHub browser for code edits except tiny text-only changes
- Production deploys from main
- Always test locally before merge
- Always verify Vercel production after merge

## Current confirmed state
- Phase 1 shared utilities is complete and merged
- CoachRow extraction is complete and merged
- TravelTeams TeamCard extraction is complete and merged
- TravelTeams TeamPreviewCard extraction is complete and merged
- Vercel production has been verified after the latest merge
- Local repo is on main
- Local main is up to date with origin/main
- GitHub Desktop on main shows no local changes
- No active refactor branch is in progress yet

## Local branches to keep
- main
- refactor/shared-utilities-phase-1
- refactor/submit-form-modular

## Locked refactor rules
- Move slowly and cleanly
- One type of change at a time
- No giant rewrite
- Do not start over
- Inspect before editing
- Test affected pages before moving on
- Keep NOTES.md updated
- Do not expand scope unnecessarily
- Production deploys from main only
- New refactor work should start from clean updated main on a fresh branch

## Audit path we are following
We are staying aligned to the codebase audit / refactor plan.

Completed from the audit path:
1. Phase 1 shared utilities
2. Phase 2 CoachRow extraction from CoachDirectory
3. Phase 2 TeamCard extraction from TravelTeams
4. Phase 2 TeamPreviewCard extraction from TravelTeams

Not completed yet from the current audit path:
- Facilities desktop row extraction from Facilities (pending safe branch start)
- Remaining later Phase 2 targets only if explicitly chosen from the audit after inspection
- Do NOT jump ahead to hooks, filters, map abstraction, or submit-form splits

## Important lesson carried forward from prior thread
We previously attempted to start a Facilities refactor and stopped because the obvious local component was not confirmed as the actual live rendered path.

Because of that, the stricter rule is now mandatory:

Before creating any new file, import, or branch implementation:
1. Find the candidate component/function
2. Confirm it is actually rendered in the live UI
3. Find the exact live render block
4. List helpers, handlers, refs, and parent state it depends on
5. Only then create files/imports and start extraction

## Completed refactor checkpoints

### Phase 1 - Shared utilities
- Created src/constants/usStates.js
- Updated TravelTeams.jsx to use shared US_STATES
- Updated PlayerBoard.jsx to use shared STATE_NAMES
- Created src/utils/sportUtils.js
- Updated CoachBasicsSection.jsx to use shared sport options
- Updated FacilityBasicsSection.jsx to use shared sport options
- Updated TeamBasicsSection.jsx to use shared sport options
- Created src/lib/leafletInit.js
- Updated CoachDirectory.jsx to use shared Leaflet default marker init
- Updated Facilities.jsx to use shared Leaflet default marker init
- Updated FacilityProfile.jsx to use shared Leaflet default marker init
- Updated PlayerBoard.jsx to use shared Leaflet default marker init
- Updated RosterSpots.jsx to use shared Leaflet default marker init
- Updated TravelTeams.jsx to use shared Leaflet default marker init
- Created src/constants/radiusOptions.js
- Updated HomePage.jsx and SearchResults.jsx to use shared SEARCH_RADIUS_OPTIONS
- Created src/constants/directoryRadiusOptions.js
- Updated CoachDirectory.jsx and Facilities.jsx to use shared DIRECTORY_RADIUS_OPTIONS
- Created src/constants/featuredBadgeStyle.js
- Updated CoachDirectory.jsx and Facilities.jsx to use shared FEATURED_BADGE_STYLE
- Created src/constants/coachSpecialties.js
- Updated CoachDirectory.jsx and CoachSubmitForm.jsx to use shared COACH_SPECIALTIES
- Created src/constants/coachAgeGroups.js
- Updated CoachProfile.jsx and CoachSubmitForm.jsx to use shared coach age group constants while preserving High School in CoachSubmitForm
- Created src/constants/positionOptions.js
- Updated CoachSubmitForm.jsx and RosterSpots.jsx to use shared POSITIONS_BB and POSITIONS_SB
- Updated src/constants/usStates.js to export shared US_STATE_ABBRS
- Updated CoachSubmitForm.jsx to use shared US_STATE_ABBRS
- Created src/constants/teamAgeGroups.js
- Updated TeamBasicsSection.jsx and TravelTeams.jsx to use shared TEAM_AGE_GROUPS while preserving All Ages in TravelTeams
- Updated src/utils/sportUtils.js to export shared normalizeSportValue
- Updated CoachDirectory.jsx and FacilityProfile.jsx to use shared normalizeSportValue
- Phase 1 shared utilities was merged and production verified

### Phase 2 - CoachDirectory
- Created branch: refactor/coach-directory-row-extraction
- Inspected CoachDirectory.jsx before extraction
- Found CoachRow to be a low-risk presentational component
- Created src/components/coaches/CoachRow.jsx
- Updated CoachDirectory.jsx to import extracted CoachRow
- Kept helper/derived display logic in CoachDirectory and passed props down
- Localhost regression check passed for Coach Directory
- Merged and production verified

### Phase 2 - TravelTeams
- Created branch: refactor/travelteams-card-components
- Extracted TeamCard from TravelTeams.jsx to src/components/teams/TeamCard.jsx
- Kept desktop inline list path unchanged
- Mobile view tested successfully in localhost
- Desktop view tested successfully in localhost
- Preview deployment passed
- Merged and production verified

- Created branch: refactor/travelteams-preview-card
- Extracted TeamPreviewCard from TravelTeams.jsx to src/components/teams/TeamPreviewCard.jsx
- Kept desktop rows inline and unchanged
- Desktop preview passed
- Mobile sanity passed
- No new TravelTeams console errors
- Preview deployment passed
- Merged and production verified

## Facilities inspection checkpoint
- Inspected src/components/Facilities.jsx before creating a new branch
- Confirmed existing local FacilityCard is not the true live desktop repeated render path
- Confirmed desktop uses an inline filtered.map row block for the live repeated desktop list
- Confirmed mobile uses separate MobileFacilityRow path
- Confirmed FacilityPreviewCard is separate selected-preview UI
- Confirmed desktop and mobile do not share one repeated render path
- Safer next extraction target is the desktop inline facility row component, not the existing local FacilityCard
- No Facilities refactor branch has been created yet
- No edits have been made yet from this inspection checkpoint
- Created branch: refactor/facilities-desktop-row
- Created src/components/facilities/FacilityDesktopRow.jsx
- Updated Facilities.jsx to import extracted FacilityDesktopRow
- Extracted only the live desktop inline facility row render block
- Kept MobileFacilityRow and FacilityPreviewCard unchanged
- Kept helper/derived display logic in Facilities.jsx and passed props down
- Localhost regression check passed for Facilities desktop row extraction
- No intended UI or behavior change

## Next target from the audit
Next intended target:
- Facilities.jsx desktop inline row extraction only

Planned branch name:
- refactor/facilities-desktop-row

## What the next thread should do first
Do NOT jump into edits from memory.

Start from the confirmed inspection result:
1. Open src/components/Facilities.jsx
2. Reconfirm the desktop inline filtered.map row block as the live repeated desktop render path
3. Do not repath desktop to the existing local FacilityCard
4. Create branch refactor/facilities-desktop-row only if that inline desktop row is still the confirmed safe extraction target
5. Extract only the presentational desktop row component
6. Keep helper/derived display logic in Facilities.jsx if that lowers risk
7. Do not touch MobileFacilityRow or FacilityPreviewCard in the same pass
8. Test localhost before commit
9. Update NOTES.md before commit
10. Test preview before merge
11. Verify production after merge

## Explicit scope guardrails for the next thread
Do:
- inspect first
- keep extraction presentational
- keep helper/derived logic in Facilities.jsx if that lowers risk
- test localhost before commit
- test Vercel preview before merge
- verify production after merge
- update NOTES.md as part of the work

Do not:
- invent a new target outside the audit
- do hooks
- do filter panel extraction
- do map abstraction
- do Facilities logic cleanup
- do unrelated renames / formatting-only changes
- do more than one extraction type in the same branch
- do not route desktop through the existing local FacilityCard as a “no behavior change” shortcut