# Sandlot Source Refactor Notes

## Current phase
Phase 2 presentational extraction work is effectively complete  
Next phase: later structural refactor planning

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
- `ClaimRequestsToolbar` extraction from `AdminPage.jsx` is complete and merged
- `AdminTabs` extraction from `AdminPage.jsx` is complete and merged
- `RosterSubmittedState` extraction from `RosterSpots.jsx` is complete and merged
- `RosterRow` extraction from `RosterSpots.jsx` is complete and merged
- `CoachResult` extraction from `SearchResults.jsx` is complete and merged
- `TeamResult` extraction from `SearchResults.jsx` is complete and merged
- `FacilityResult` extraction from `SearchResults.jsx` is complete and merged
- `PlayerBoardBrowseContent` structural extraction from `PlayerBoard.jsx` is complete and merged
- Vercel production was verified after the latest merged refactor on `main`
- Local repo is on `main`
- Local `main` is up to date with `origin/main`
- Working tree is clean
- No active refactor branch is in progress

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
16. PlayerBoardBrowseContent - `PlayerBoard`
17. RosterRow - `RosterSpots`
18. RosterSubmittedState - `RosterSpots`
19. ClaimRequestRow - `AdminPage`
20. ClaimRequestsToolbar - `AdminPage`
21. AdminTabs - `AdminPage`
22. PasswordGate - `AdminPage`
23. CoachResult - `SearchResults`
24. TeamResult - `SearchResults`
25. FacilityResult - `SearchResults`

## Audit comparison summary
- The original audit path was directionally correct about the largest pain points: oversized page files, duplicated shared utilities, repeated presentational leaf UI, and later structural refactor needs
- Actual project execution has followed the audit direction in a more conservative, safer, leaf-by-leaf way
- The project has completed most of the worthwhile low-risk Phase 2 presentational extraction work across the largest files
- The project has gone further than the original audit in some files by extracting multiple safe presentational leaves instead of only the first obvious card/row
- The project has intentionally *not* followed the original audit into heavier structural extraction work until now
- This was the correct strategy under the locked Phase 2 rules
- `AdSlot.jsx` consolidation is confirmed in `CoachDirectory.jsx`, `TravelTeams.jsx`, `Facilities.jsx`, and `PlayerBoard.jsx`
- `SearchResults.jsx` still contains inline sponsored placeholder UI and was not converted to `AdSlot.jsx`
- Therefore the original audit ad-consolidation item is effectively complete for the major directory-style pages, with `SearchResults.jsx` intentionally left outside that cleanup path
- The project has now begun later structural refactor work with the first narrow structural split in `PlayerBoard.jsx`

## Original audit items that were effectively completed
- Shared utilities phase completed
- Major `CoachSubmitForm` modular reduction completed
- Safe presentational extraction work completed across `CoachDirectory`, `TravelTeams`, `Facilities`, `PlayerBoard`, `RosterSpots`, `AdminPage`, and `SearchResults`

## Original audit items not completed exactly as first proposed
- `AdminCell` was not extracted as its own file
- `AdminTable` was not extracted as its own file
- `RosterResult` was not extracted from `SearchResults.jsx`
- Broad data-hook extraction phase was not pursued project-wide
- Shared map abstraction phase was not pursued
- Broad filter-panel extraction phase was not pursued
- These remaining items are increasingly structural and therefore intentionally deferred

## Current conclusions
- `PlayerBoard.jsx` was reduced substantially through safe presentational extraction work, and `PlayerBoardBrowseSidebar` was the last clearly worthwhile Phase 2 presentational extraction there
- Further meaningful reduction of `PlayerBoard.jsx` required later structural refactor work rather than additional simple presentational extraction
- `PlayerBoardBrowseContent` was the first later-phase structural split completed in `PlayerBoard.jsx`
- `PlayerBoard.jsx` now has an initial structural split, but any further reduction should still remain narrow and guarded
- `PlayerBoard.jsx` should be re-inspected from current merged `main` before choosing any second structural split
- `RosterSpots.jsx` had one more clearly safe live presentational leaf after `RosterRow`, and `RosterSubmittedState` was the correct final worthwhile Phase 2 extraction there
- `RosterSubmittedState` was the last clearly worthwhile safe presentational leaf in `RosterSpots.jsx`
- Further meaningful reduction of `RosterSpots.jsx` now appears to require later structural refactor work rather than additional simple presentational extraction
- `AdminPage.jsx` contained multiple clearly live Phase 2 presentational leaves, and `ClaimRequestRow`, `ClaimRequestsToolbar`, `AdminTabs`, and `PasswordGate` have now been extracted successfully
- `AdminPage.jsx` received a final Phase 2 inspection after those extractions
- The tiny top header shell was explicitly reviewed as a final go/no-go candidate and was not recommended for extraction
- No additional clearly worthwhile safe Phase 2 presentational leaf remains in `AdminPage.jsx`
- Further meaningful reduction of `AdminPage.jsx` now appears to require later structural refactor work rather than additional simple presentational extraction
- `SearchResults.jsx` has now completed Phase 2 extraction work for `CoachResult`, `TeamResult`, and `FacilityResult`
- `SearchResults.jsx` was re-inspected from the current merged `main` state after `FacilityResult`
- No further clearly worthwhile safe Phase 2 presentational leaf was confirmed in `SearchResults.jsx`
- Remaining local `SearchResults.jsx` pieces (`ResultCount`, `SectionHeader`, `EmptyState`, right-rail placeholder block, and small sponsored placeholder blocks) are too small or too placeholder-oriented to justify another extraction branch
- Further meaningful reduction of `SearchResults.jsx` now appears to require later structural refactor work rather than additional simple presentational extraction
- The remaining oversized files are increasingly moving from safe presentational extraction territory into later structural refactor territory
- Phase 2 presentational extraction work is effectively complete

## Next target
- There is no additional Phase 2 extraction target currently recommended
- `SearchResults.jsx` should remain in later structural refactor planning
- `AdminPage.jsx` should remain in later structural refactor planning
- `PlayerBoard.jsx` should be re-inspected from current merged `main` before any further structural split is chosen
- The next step is to determine whether one more narrow structural split remains worthwhile in `PlayerBoard.jsx`
- If not, move to the next later-phase structural target

## Remaining queue
1. Re-inspect `PlayerBoard.jsx` after `PlayerBoardBrowseContent` extraction
2. Determine whether one more narrow structural split remains worthwhile in `PlayerBoard.jsx`
3. If no additional narrow `PlayerBoard.jsx` split is worthwhile, move to the next structural target
4. Later-phase structural reduction for oversized files like `RosterSpots`, `AdminPage`, and `SearchResults`
5. `AdminPage` tab/table structural splitting if later-phase rules allow it
6. Bug audit (still deferred until file-reduction work is complete)

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
- For later structural work, define a narrow scope before creating any branch

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
Deferred until file-reduction work is complete. Some prior known bugs may already be resolved. Do not chase bugs during refactor sessions.