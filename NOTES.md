# Sandlot Source Refactor Notes

## Current phase
Phase 2 presentational extraction work is effectively complete.  
Current phase is guarded later-phase structural refactor planning and execution.

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
- `RosterBrowseContent` structural extraction from `RosterSpots.jsx` is complete and merged
- `CoachResult` extraction from `SearchResults.jsx` is complete and merged
- `TeamResult` extraction from `SearchResults.jsx` is complete and merged
- `FacilityResult` extraction from `SearchResults.jsx` is complete and merged
- `SearchResultsContent` structural extraction from `SearchResults.jsx` is complete and merged
- `PlayerBoardBrowseContent` structural extraction from `PlayerBoard.jsx` is complete and merged
- `PlayerBoard.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `PlayerBoard.jsx`
- `RosterSpots.jsx` was re-inspected from merged `main` after `RosterBrowseContent` extraction
- No additional clearly worthwhile narrow render-structure split remains in `RosterSpots.jsx`
- Vercel production was verified after the `RosterBrowseContent` merge
- Vercel preview looked good and production deployed correctly after the `SearchResultsContent` merge
- Local repo is back on `main`
- Local `main` is up to date with `origin/main`
- Working tree is clean after final `NOTES.md` save/commit
- No active refactor branch is currently in progress
- `SearchResults.jsx` was re-inspected from merged `main` after `SearchResultsContent` extraction
- No additional clearly worthwhile narrow render-structure split remains in `SearchResults.jsx`
- `GenericAdminTableContent` extraction from `AdminPage.jsx` is complete and merged
- Vercel preview looked good and production deployed correctly after the `SearchResultsContent` merge
- Vercel preview looked good and production deployed correctly after the `GenericAdminTableContent` merge
- `AdminPage.jsx` should be re-inspected from merged `main`

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
19. RosterBrowseContent - `RosterSpots`
20. ClaimRequestRow - `AdminPage`
21. ClaimRequestsToolbar - `AdminPage`
22. AdminTabs - `AdminPage`
23. PasswordGate - `AdminPage`
24. CoachResult - `SearchResults`
25. TeamResult - `SearchResults`
26. FacilityResult - `SearchResults`
27. SearchResultsContent - `SearchResults`
28. `GenericAdminTableContent` - `AdminPage`

## Audit comparison summary
- The original audit path was directionally correct about the largest pain points: oversized page files, duplicated shared utilities, repeated presentational leaf UI, and later structural refactor needs
- Actual project execution has followed the audit direction in a more conservative, safer, leaf-by-leaf way
- The project completed most worthwhile low-risk Phase 2 presentational extraction work across the largest files
- The project intentionally avoided heavy structural extraction work until Phase 2 presentational work was effectively exhausted
- This was the correct strategy under the locked rules
- `AdSlot.jsx` consolidation is confirmed in `CoachDirectory.jsx`, `TravelTeams.jsx`, `Facilities.jsx`, and `PlayerBoard.jsx`
- `SearchResults.jsx` still contains inline sponsored placeholder UI and was intentionally left outside ad-slot cleanup
- The project has now moved into guarded later-phase structural work, beginning with browse-shell style splits where the render surface is still large enough to justify extraction

## Original audit items effectively completed
- Shared utilities phase completed
- Major `CoachSubmitForm` modular reduction completed
- Safe presentational extraction work completed across `CoachDirectory`, `TravelTeams`, `Facilities`, `PlayerBoard`, `RosterSpots`, `AdminPage`, and `SearchResults`

## Original audit items not completed exactly as first proposed
- `AdminCell` was not extracted as its own file
- `AdminTable` was not extracted exactly as first proposed; later guarded structural work instead extracted `GenericAdminTableContent` from `AdminPage.jsx`
- `RosterResult` was not extracted from `SearchResults.jsx`
- Broad data-hook extraction phase was not pursued project-wide
- Shared map abstraction phase was not pursued
- Broad filter-panel extraction phase was not pursued
- These remaining items are increasingly structural and were intentionally deferred

## Current conclusions
- `PlayerBoard.jsx` was reduced substantially through safe presentational extraction work
- `PlayerBoardBrowseContent` was the first later-phase structural split completed in `PlayerBoard.jsx`
- `PlayerBoard.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `PlayerBoard.jsx`
- Remaining `PlayerBoard.jsx` bulk is now mostly helper, state, modal, auth, geocode, and form/edit logic territory rather than another clean render-shell extraction target
- `PlayerBoard.jsx` should move out of immediate extraction focus and remain deferred for later guarded structural cleanup if needed
- `RosterSpots.jsx` had one more clearly worthwhile narrow later-phase structural split after `RosterRow` and `RosterSubmittedState`
- The browse-mode shell was the best remaining structural target because it contained the live browse header/filter band, map section, prompt/no-results states, mobile inline ad, and result list
- `RosterBrowseContent` was the correct narrow structural extraction target
- `RosterBrowseContent` has now been merged and production-verified
- `RosterSpots.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `RosterSpots.jsx`
- Remaining `RosterSpots.jsx` bulk is now mostly page state, ZIP/radius filtering, view switching, desktop wrapper layout, and `RosterForm` submit/match/geocode logic
- `RosterSpots.jsx` should move out of immediate extraction focus and remain deferred for later guarded structural/form cleanup if needed
- `Facilities.jsx` was reviewed as a possible alternate target, but no better immediate narrow structural split was identified than `SearchResults.jsx`
- Remaining `Facilities.jsx` bulk is now mostly browse/map/filter orchestration rather than another clean narrow extraction target
- `CoachSubmitForm.jsx` was reviewed as a possible alternate target, but it remains outside immediate focus because remaining bulk is primarily form/validation/geocode/duplicate-check logic territory
- `SearchResults.jsx` still had one clearly worthwhile narrow later-phase structural split after `CoachResult`, `TeamResult`, and `FacilityResult`
- The remaining live results-page shell was the best target because it contained the loading/empty/results branches, section wrappers, mobile sponsored placeholders, and desktop sidebar sponsored placeholder layout
- `SearchResultsContent` was the correct narrow structural extraction target
- `SearchResultsContent` has now been merged and production-verified
- - `SearchResults.jsx` was re-inspected from merged `main` after `SearchResultsContent` extraction
- No additional clearly worthwhile narrow render-structure split remains in `SearchResults.jsx`
- Remaining `SearchResults.jsx` bulk is now mostly state, geocode/fetch, filtering, query construction, navigation, and small search/filter header orchestration rather than another clean narrow render-shell extraction target
- `SearchResults.jsx` should move out of immediate extraction focus and remain deferred for later guarded structural cleanup if needed
- `AdminPage.jsx` still had one clearly worthwhile narrow later-phase structural split after `PasswordGate`, `ClaimRequestRow`, `ClaimRequestsToolbar`, and `AdminTabs`
- The generic admin data-table render shell was the best remaining target because it contained the card wrapper, toolbar/filter row, shown count, loading/empty states, and generic table/head/body rendering
- `GenericAdminTableContent` was the correct narrow structural extraction target
- `GenericAdminTableContent` has now been merged and production-verified
- `AdminPage.jsx` should be re-inspected from merged `main` before deciding whether any additional narrow worthwhile structural split remains
- The remaining oversized files are now primarily in later structural refactor territory

## Next target
- Re-inspect merged `AdminPage.jsx`
- Determine whether any additional narrow worthwhile render-structure split remains in `AdminPage.jsx`
- If not, move `AdminPage.jsx` out of immediate focus

## Remaining queue
1. Re-inspect merged `AdminPage.jsx`
2. Determine whether any additional narrow worthwhile render-structure split remains in `AdminPage.jsx`
3. If not, move `AdminPage.jsx` out of immediate focus
4. Reassess remaining oversized files in later structural territory
5. Bug audit remains deferred until file-reduction work is complete

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

## Later-phase structural guardrails
- Later-phase structural work must still stay narrow and guarded
- Keep scope narrow and render-structure focused first
- Do not jump to hooks, form/auth extraction, shared utility reshuffling, or broad logic refactors unless explicitly chosen as the next phase
- Do not create a branch until inspection is complete and the exact target is confirmed
- If no clearly worthwhile narrow split remains, say so and move the file out of immediate focus

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
- Repo state recorded (`main` / clean / synced or active branch / local only / pending merge)
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