# Sandlot Source Refactor Notes

## Current phase
Phase 2 - Presentational component extractions only

## Working repo / workflow
- Working repo: `C:\GitHub\sandlotsource`
- Do not use: `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Use local workflow only: VS Code + terminal + GitHub Desktop
- Do NOT use GitHub browser for code edits except tiny text-only changes
- Production deploys from `main`
- Always test locally before merge
- Always verify Vercel production after merge

## Current confirmed state
- Phase 1 shared utilities is complete and merged
- CoachRow extraction is complete and merged
- TravelTeams `TeamCard` extraction is complete and merged
- TravelTeams `TeamPreviewCard` extraction is complete and merged
- TravelTeams desktop row extraction is complete and merged
- Facilities desktop row extraction is complete and merged
- Facilities mobile row extraction is complete and merged
- Facilities preview card extraction is complete and merged
- Vercel production has been verified after the latest merged refactor
- Current active branch is `refactor/coach-detail-panel`
- Localhost passed for the `CoachDetailPanel` extraction
- Preview / merge / production verification are still pending for the `CoachDetailPanel` extraction

## Local branches to keep
- `main`
- `refactor/shared-utilities-phase-1`
- `refactor/submit-form-modular`

## Locked refactor rules
- Move slowly and cleanly
- One type of change at a time
- No giant rewrite
- Do not start over
- Inspect before editing
- Test affected pages before moving on
- Keep `NOTES.md` updated
- Do not expand scope unnecessarily
- Production deploys from `main` only
- New refactor work should start from clean updated `main` on a fresh branch
- Keep each refactor branch limited to one safe extraction target at a time
- No file should exceed 1000 lines after the audit path is complete

## Inspection rule carried forward
Before each new extraction:
1. Find the candidate component/function
2. Confirm it is actually rendered in the live UI
3. Find the exact live render block
4. List helpers, handlers, refs, and parent state it depends on
5. Only then create files/imports and start extraction

## Audit path status

### Completed from the audit path
1. Phase 1 shared utilities
2. Phase 2 CoachRow extraction from `CoachDirectory`
3. Phase 2 TeamCard extraction from `TravelTeams`
4. Phase 2 TeamPreviewCard extraction from `TravelTeams`
5. Phase 2 TravelTeams desktop row extraction from `TravelTeams`
6. Phase 2 Facilities desktop row extraction from `Facilities`
7. Phase 2 Facilities mobile row extraction from `Facilities`
8. Phase 2 Facilities preview card extraction from `Facilities`

### In progress from the audit path
9. Phase 2 CoachDetailPanel extraction from `CoachDirectory`

### Not completed yet
- Remaining later Phase 2 targets only if explicitly chosen after inspection
- Do NOT jump ahead to hooks, filters, map abstraction, submit-form splits, or unrelated cleanup

## Completed checkpoints

### Phase 1 - Shared utilities
Completed and merged:
- Shared state constants
- Shared sport utilities
- Shared Leaflet marker init
- Shared radius option constants
- Shared featured badge style constant
- Shared coach specialty constants
- Shared coach age group constants
- Shared position option constants
- Shared team age group constants
- Shared sport normalization usage where appropriate

Result:
- Phase 1 shared utilities was merged and production verified

### Phase 2 - CoachDirectory
Completed:
- Branch: `refactor/coach-directory-row-extraction`
- Extracted `CoachRow` to `src/components/coaches/CoachRow.jsx`
- Kept helper / derived display logic in `CoachDirectory.jsx`
- Localhost passed
- Merged and production verified

In progress:
- Branch: `refactor/coach-detail-panel`

Inspection outcome:
- Confirmed the live selected desktop preview/detail UI is rendered from `CoachDirectory.jsx` as `CoachDetailPanel`
- Confirmed render gate is desktop only, no profile modal open, and selected coach present
- Confirmed this is the current live selected-preview path, not an unused local component
- Confirmed `MobileCoachRow` is also live in the mobile list path, but is a secondary target
- Confirmed `CoachDetailPanel` is the better next extraction candidate because it matches the preview/detail extraction pattern already used in TravelTeams and Facilities
- Confirmed this is safe to extract if page-level state and handlers remain in `CoachDirectory.jsx`

Extraction outcome so far:
- Created `src/components/coaches/CoachDetailPanel.jsx`
- Updated `CoachDirectory.jsx` to import `CoachDetailPanel`
- Removed the in-file `CoachDetailPanel` block from `CoachDirectory.jsx`
- Kept selection state, profile modal state, distance calculation, filter/search/map behavior, and preview open/close logic in `CoachDirectory.jsx`
- Localhost passed
- Preview pending
- Merge pending
- Production verification pending

### Phase 2 - TravelTeams
Completed:
- Branch: `refactor/travelteams-card-components`
- Extracted `TeamCard` to `src/components/teams/TeamCard.jsx`
- Kept desktop inline list path unchanged
- Localhost passed
- Preview passed
- Merged and production verified

Completed:
- Branch: `refactor/travelteams-preview-card`
- Extracted `TeamPreviewCard` to `src/components/teams/TeamPreviewCard.jsx`
- Kept desktop rows inline and unchanged
- Desktop preview passed
- Mobile sanity passed
- Preview passed
- Merged and production verified

Completed:
- Branch: `refactor/travelteams-desktop-row`

Inspection outcome:
- Confirmed the live desktop repeated row was still rendered inline in `TravelTeams.jsx`
- Confirmed `TeamCard` remains the mobile repeated card path
- Confirmed `TeamPreviewCard` remains the selected desktop preview path
- Confirmed the desktop repeated row depended on parent selection state, row refs, and derived display helpers
- Confirmed this was a safe presentational extraction target if logic remained in `TravelTeams.jsx`

Extraction outcome:
- Created `src/components/teams/TeamDesktopRow.jsx`
- Updated `TravelTeams.jsx` to import `TeamDesktopRow`
- Extracted only the live desktop repeated row render block
- Kept selection state, row refs, derived display logic, loading state, empty state, preview rendering, map behavior, and filter behavior in `TravelTeams.jsx`
- Left mobile `TeamCard` path unchanged
- Left desktop `TeamPreviewCard` path unchanged
- Localhost regression check passed
- Preview deployment passed
- Merged and production verified
- No intended UI or behavior change

### Phase 2 - Facilities
Inspection outcome:
- Existing local `FacilityCard` was not the true live desktop repeated render path
- Desktop uses an inline repeated row block
- Mobile uses separate `MobileFacilityRow`
- `FacilityPreviewCard` is separate selected-preview UI

Completed:
- Branch: `refactor/facilities-desktop-row`
- Extracted `FacilityDesktopRow` to `src/components/facilities/FacilityDesktopRow.jsx`
- Kept helper / derived display logic in `Facilities.jsx`
- Localhost passed
- Merged and production verified

Completed:
- Branch: `refactor/facilities-mobile-row`
- Extracted `MobileFacilityRow` to `src/components/facilities/MobileFacilityRow.jsx`
- Kept helper / derived display logic in `Facilities.jsx`
- Localhost passed
- Preview passed
- Merged and production verified

Completed:
- Branch: `refactor/facilities-preview-card`
- Extracted `FacilityPreviewCard` to `src/components/facilities/FacilityPreviewCard.jsx`
- Kept page-level selection, filtering, map behavior, and detail href building in `Facilities.jsx`
- Localhost passed
- Preview passed
- Merged and production verified

## Next inspection target
- Not yet selected after `CoachDetailPanel`
- Return to inspection-first workflow after preview / merge / production verification for the current branch
- Possible future candidates should be chosen only after confirming the exact live render path and dependency scope

## Guardrails for the current branch
### Do
- keep extraction presentational
- keep helper / derived logic in the parent file if that lowers risk
- test localhost before commit
- test Vercel preview before merge
- verify production after merge
- update `NOTES.md` as part of the work

### Do not
- do hooks
- do filter panel extraction
- do map abstraction
- do logic cleanup outside the exact extraction target
- do unrelated renames or formatting-only changes
- do more than one extraction type in the same branch
- do follow-on CoachDirectory extractions on this same branch

## Execution reminder
- If a new file is being created from code already identified in an existing file, provide the full paste-ready file contents in the chat, not just a summary of what should go into it
- Also provide the exact import line(s) and clearly state what old in-file block should be removed
- Before moving a new component into an existing folder, quickly inspect nearby sibling components in that folder for naming, styling, and prop-pattern conflicts
- Keep moving toward the audit rule that no file should exceed 1000 lines, but still keep each branch limited to one safe extraction target at a time