# Sandlot Source Refactor Notes

## Current phase
Phase 2 - Presentational component extractions only

## Working repo / workflow
- Working repo: `C:\GitHub\sandlotsource`
- Do not use: `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Local workflow only: VS Code + terminal + GitHub Desktop
- No GitHub browser edits except tiny text-only changes
- Production deploys from `main` only
- Always test locally before merge
- Always verify Vercel production after merge

## Current confirmed state
- `ClaimRequestRow` extraction from `AdminPage.jsx` is complete locally and awaiting commit/merge
- `ClaimRequestsToolbar` extraction from `AdminPage.jsx` is complete locally and awaiting commit/merge
- `RosterSubmittedState` extraction from `RosterSpots.jsx` is complete and merged
- `RosterRow` extraction from `RosterSpots.jsx` is complete and merged
- Vercel production was verified after the latest merged refactor on `main`
- Local repo is back on `main`
- Local `main` is up to date with `origin/main`
- Working tree is clean
- No active refactor branch is in progress

## Completed extractions
1. Phase 1 shared utilities
2. CoachRow - `CoachDirectory`
3. CoachDetailPanel - `CoachDirectory`
4. MobileCoachRow - `CoachDirectory`
5. TeamCard - `TravelTeams`
6. TeamPreviewCard - `TravelTeams`
7. TeamDesktopRow - `TravelTeams`
8. FacilityDesktopRow - `Facilities`
9. MobileFacilityRow - `Facilities`
10. FacilityPreviewCard - `Facilities`
11. PlayerBoardDetailPanel - `PlayerBoard`
12. PlayerBoardDesktopRow - `PlayerBoard`
13. PlayerBoardMobileCard - `PlayerBoard`
14. PlayerBoardBrowseSidebar - `PlayerBoard`
15. RosterRow - `RosterSpots`
16. RosterSubmittedState - `RosterSpots`
17. ClaimRequestRow - `AdminPage`
18. ClaimRequestsToolbar - `AdminPage`

## Current conclusions
- `PlayerBoard.jsx` was reduced substantially through safe presentational extraction work, but no additional clearly safe Phase 2 presentational leaf was confirmed after `PlayerBoardBrowseSidebar`
- `PlayerBoard.jsx` will likely need additional reduction in a later structural phase rather than through more simple presentational extraction
- `RosterSpots.jsx` had one more clearly safe live presentational leaf after `RosterRow`, and `RosterSubmittedState` was the correct final worthwhile Phase 2 extraction there
- `RosterSubmittedState` was the last clearly worthwhile safe presentational leaf in `RosterSpots.jsx`
- Further meaningful reduction of `RosterSpots.jsx` now appears to require later structural refactor work rather than additional Phase 2 presentational extraction
- `AdminPage.jsx` contains a clearly live claim request row render path, and `ClaimRequestRow` was a safe Phase 2 presentational extraction
- Further `AdminPage.jsx` reduction should continue only through clearly live presentational leaves that do not require moving logic or state out of the parent
- `AdminPage.jsx` contains clearly live claim request render paths, and both `ClaimRequestRow` and `ClaimRequestsToolbar` are safe Phase 2 presentational extractions

### Next target
- `RosterSpots.jsx` Phase 2 presentational extraction work is complete
- Defer further `RosterSpots` reduction to a later structural phase
- `ClaimRequestsToolbar` extraction from `AdminPage.jsx` is complete locally and awaiting merge
- After merge and production verification, re-inspect `AdminPage.jsx` for the next safe presentational extraction target
- `RosterSpots.jsx` Phase 2 presentational extraction work is complete
- Defer further `RosterSpots` reduction to a later structural phase
- Re-inspect a different oversized live page for the next safe presentational extraction target

## Remaining queue
1. Re-inspect the next oversized live page for a safe Phase 2 presentational extraction target
2. Later-phase structural reduction for oversized files like `PlayerBoard` and `RosterSpots`
3. `AdminPage` tab splitting
4. Bug audit (deferred until files are smaller)

## Local branches to keep
- `main`
- `refactor/shared-utilities-phase-1`
- `refactor/submit-form-modular`

## Locked rules
- Move slowly and cleanly
- One extraction per branch
- One type of change at a time
- No giant rewrites
- Inspect before editing
- Test each affected page before moving on
- Keep `NOTES.md` updated
- No file should exceed 1000 lines when the audit path is complete

## Inspection rule - required before every extraction
1. Find the candidate component/function
2. Confirm it is actually rendered in the live UI
3. Find the exact live render block
4. List all dependencies (state, handlers, refs, helpers)
5. Only then create files/imports and start extraction

## Prompt guardrails
- Do not suggest alternatives to the current stack
- Do not expand scope because you see a related opportunity
- Do not assume repo state - ask if uncertain
- If a thread gets long, prepare a clean handoff prompt before continuing
- Do not jump to hooks, filters, map abstraction, submit-form splits, or unrelated cleanup
- Do not create a branch before inspection is complete and confirmed

## Execution reminders
- Provide full paste-ready file contents for any new component, not just a summary
- Provide the exact import line(s) and clearly state what in-file block to remove
- Check sibling files in the target folder for naming and prop-pattern consistency before creating a new file

## Bug audit
Deferred until Phase 2 extractions are complete. Some prior known bugs may already be resolved. Do not chase bugs during refactor sessions.