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
- Working branch is `refactor/rosterspots-row`
- Branch was created from `main`
- `RosterRow` extraction from `RosterSpots.jsx` is complete locally
- Localhost testing passed for the extracted row
- `NOTES.md` is being updated before commit
- Vercel production was verified after the last merged refactor on `main`

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

## Current conclusions
- `PlayerBoard.jsx` was reduced substantially through safe presentational extraction work, but no additional clearly safe Phase 2 presentational leaf was confirmed after `PlayerBoardBrowseSidebar`
- `PlayerBoard.jsx` will likely need additional reduction in a later structural phase rather than through more simple presentational extraction
- `RosterSpots.jsx` had a clean still-live presentational leaf, and `RosterRow` was the correct next extraction target

## Next target
- Re-inspect `RosterSpots.jsx` for one more still-live safe presentational extraction target after `RosterRow`
- If no worthwhile safe presentational target remains, say so explicitly and defer further `RosterSpots` reduction to a later structural phase

## Remaining queue
1. Remaining safe `RosterSpots` extraction only if inspection confirms one still exists
2. Later-phase structural reduction for oversized files like `PlayerBoard` and possibly `RosterSpots`
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