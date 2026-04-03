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
- Phase 1 shared utilities is complete and merged
- `CoachSubmitForm` modular refactor is complete and merged
- `PasswordGate` extraction from `AdminPage.jsx` is complete and merged
- `ClaimRequestRow` extraction from `AdminPage.jsx` is complete and merged
- `AdminTabs` extraction from `AdminPage.jsx` is complete and merged
- `ClaimRequestsToolbar` extraction from `AdminPage.jsx` is complete and merged
- `RosterSubmittedState` extraction from `RosterSpots.jsx` is complete and merged
- `RosterRow` extraction from `RosterSpots.jsx` is complete and merged
- `CoachResult` extraction from `SearchResults.jsx` is complete and merged
- `TeamResult` extraction from `SearchResults.jsx` is complete on the active branch and has passed localhost testing
- `TeamResult` has not yet been pushed, merged, or production-verified
- Active working branch is `refactor/search-results-team-result`
- Local repo is not yet back on `main`
- `NOTES.md` has been reconciled to reflect current branch state and tested status without overstating merge/production state

## Completed extractions / major completed refactors
1. Phase 1 shared utilities
2. `CoachSubmitForm` modular refactor
3. CoachRow - `CoachDirectory`
4. CoachDetailPanel - `CoachDirectory`
5. MobileCoachRow - `CoachDirectory`
6. TeamCard - `TravelTeams`
7. TeamPreviewCard - `TravelTeams`
8. TeamDesktopRow - `TravelTeams`
9. FacilityDesktopRow - `Facilities`
10. MobileFacilityRow - `Facilities`
11. FacilityPreviewCard - `Facilities`
12. PlayerBoardDetailPanel - `PlayerBoard`
13. PlayerBoardDesktopRow - `PlayerBoard`
14. PlayerBoardMobileCard - `PlayerBoard`
15. PlayerBoardBrowseSidebar - `PlayerBoard`
16. RosterRow - `RosterSpots`
17. RosterSubmittedState - `RosterSpots`
18. ClaimRequestRow - `AdminPage`
19. ClaimRequestsToolbar - `AdminPage`
20. AdminTabs - `AdminPage`
21. PasswordGate - `AdminPage`
22. CoachResult - `SearchResults`
23. TeamResult - `SearchResults` *(complete on active branch; not yet merged)*

## Current conclusions
- `PlayerBoard.jsx` was reduced substantially through safe presentational extraction work, but no additional clearly safe Phase 2 presentational leaf was confirmed after `PlayerBoardBrowseSidebar`
- Further meaningful reduction of `PlayerBoard.jsx` now appears to require later structural refactor work rather than additional simple presentational extraction
- `RosterSpots.jsx` had one more clearly safe live presentational leaf after `RosterRow`, and `RosterSubmittedState` was the correct final worthwhile Phase 2 extraction there
- `RosterSubmittedState` was the last clearly worthwhile safe presentational leaf in `RosterSpots.jsx`
- Further meaningful reduction of `RosterSpots.jsx` now appears to require later structural refactor work rather than additional simple presentational extraction
- `AdminPage.jsx` contained multiple clearly live Phase 2 presentational leaves, and `ClaimRequestRow`, `ClaimRequestsToolbar`, `AdminTabs`, and `PasswordGate` have now been extracted successfully
- `AdminPage.jsx` should be re-inspected before any further extraction work, because the remaining sections are more logic-heavy and may no longer qualify as worthwhile safe Phase 2 presentational leaves
- `SearchResults.jsx` has begun Phase 2 extraction work with `CoachResult` and now `TeamResult`
- `TeamResult` has passed localhost testing on the active branch
- `SearchResults.jsx` should be re-inspected again only after `TeamResult` is pushed, merged to `main`, production-verified, and local repo is returned to synced `main`
- The remaining oversized files are increasingly moving from safe presentational extraction territory into later structural refactor territory

## Next target
- Immediate next task is to finish the current branch cleanly:
  - push `refactor/search-results-team-result`
  - open PR
  - merge to `main`
  - verify Vercel production
  - return local repo to clean synced `main`
- After that, `SearchResults.jsx` remains the current inspection target
- Re-inspect `SearchResults.jsx` from the new merged state for the next safe presentational extraction target
- Do not begin the next extraction on the current branch

## Remaining queue
1. Finish and merge `TeamResult` extraction from `SearchResults.jsx`
2. Re-inspect `SearchResults.jsx` from merged `main` for the next safe Phase 2 presentational extraction target after `TeamResult`
3. If `SearchResults.jsx` still has a worthwhile safe leaf, extract only one target on the next branch
4. Re-inspect `AdminPage.jsx` before any further extraction work; remaining reductions may now be structural rather than presentational
5. Later-phase structural reduction for oversized files like `PlayerBoard`, `RosterSpots`, `AdminPage`, and likely `SearchResults`
6. `AdminPage` tab splitting
7. Bug audit (deferred until files are smaller)

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
- Do not assume repo state if uncertain
- If a thread gets long, prepare a clean handoff prompt before continuing
- Do not jump to hooks, filters, map abstraction, submit-form splits, or unrelated cleanup
- Do not create a branch before inspection is complete and confirmed

## Execution reminders
- Provide full paste-ready file contents for any new component, not just a summary
- Provide the exact import line(s) and clearly state what in-file block to remove
- Check sibling files in the target folder for naming and prop-pattern consistency before creating a new file
- Before proposing any new extraction, first confirm whether the current target still has a clearly live presentational leaf or whether it has crossed into structural-refactor territory

## Thread closeout checklist
- `NOTES.md` updated before ending thread
- Last completed item recorded
- Next inspection target recorded
- Repo state recorded (`main` / clean / synced or not)
- Active branch status recorded
- Any unresolved ambiguity explicitly called out
- Ready-to-paste kickoff prompt prepared for next thread if needed

## State integrity rules
- Do not leave branch-specific wording in notes unless verified
- Do not say “complete locally” if repo is already back on `main` and clean
- Do not mark items merged unless explicitly confirmed
- Do not let the next thread begin without pasting the latest `NOTES.md`
- Every new thread must review the pasted latest `NOTES.md` before proposing the next step
- Final task of every thread is reconciling and updating `NOTES.md`
- If any state statement conflicts with another, stop and reconcile the notes before proposing the next step
- If there is uncertainty about whether something was merged, tested, or production-verified, mark it as uncertain instead of guessing

## Bug audit
Deferred until Phase 2 extractions are complete. Some prior known bugs may already be resolved. Do not chase bugs during refactor sessions.