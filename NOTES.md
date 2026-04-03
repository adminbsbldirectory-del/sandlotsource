# Sandlot Source Refactor Notes

## Current phase
Phase 2 presentational extraction work is effectively complete.  
Current phase is **refactor closeout**: finish the remaining incomplete Phase 1 shared-utility import cleanup, then transition to bug audit.

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
- `AdminCell` extraction from `AdminPage.jsx` is complete and merged
- `RosterSubmittedState` extraction from `RosterSpots.jsx` is complete and merged
- `RosterRow` extraction from `RosterSpots.jsx` is complete and merged
- `RosterBrowseContent` structural extraction from `RosterSpots.jsx` is complete and merged
- `CoachResult` extraction from `SearchResults.jsx` is complete and merged
- `TeamResult` extraction from `SearchResults.jsx` is complete and merged
- `FacilityResult` extraction from `SearchResults.jsx` is complete and merged
- `SearchResultsContent` structural extraction from `SearchResults.jsx` is complete and merged
- `PlayerBoardBrowseContent` structural extraction from `PlayerBoard.jsx` is complete and merged
- `GenericAdminTableContent` extraction from `AdminPage.jsx` is complete and merged
- `AdminPage.jsx` post-extraction closeout cleanup is complete and merged
- `GenericAdminTableContent.jsx` now passes required props to `AdminCell`
- `ClaimRequestsTable` now fails gracefully in local mode when the API is unavailable or returns non-JSON
- `PlayerBoard.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `PlayerBoard.jsx`
- `RosterSpots.jsx` was re-inspected from merged `main` after `RosterBrowseContent` extraction
- No additional clearly worthwhile narrow render-structure split remains in `RosterSpots.jsx`
- `SearchResults.jsx` was re-inspected from merged `main` after `SearchResultsContent` extraction
- No additional clearly worthwhile narrow render-structure split remains in `SearchResults.jsx`
- `AdminPage.jsx` closeout is complete and should move out of immediate refactor focus
- Vercel production was verified after the `RosterBrowseContent` merge
- Vercel preview looked good and production deployed correctly after the `SearchResultsContent` merge
- Vercel preview looked good and production deployed correctly after the `GenericAdminTableContent` merge
- Vercel preview looked good and production deployed correctly after the `AdminPage.jsx` closeout cleanup merge
- Local repo is back on `main`
- Local `main` is up to date with `origin/main`
- Working tree is clean after final `NOTES.md` save/commit
- No active refactor branch is currently in progress
- Closeout audit was completed against current merged `main`
- Current-state inventory confirms 29 completed extractions / major modular reductions
- Several files remain large due to new feature growth during the refactor period; this is not refactor regression
- Incomplete Phase 1 shared-utility import cleanup remains in `CoachDirectory.jsx`, `Facilities.jsx`, and `TravelTeams.jsx`

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
28. GenericAdminTableContent - `AdminPage`
29. AdminCell - `AdminPage`

## Audit comparison summary
- The original audit path was directionally correct about the largest pain points: oversized page files, duplicated shared utilities, repeated presentational leaf UI, and later structural refactor needs
- Actual project execution followed the audit direction in a more conservative, safer, leaf-by-leaf way
- The project completed most worthwhile low-risk Phase 2 presentational extraction work across the largest files
- The project intentionally avoided heavy structural extraction work until low-risk presentational work was effectively exhausted
- This was the correct strategy under the locked rules
- The project completed the bulk of the original audit’s practical value without prematurely jumping into higher-risk hook, map, or filter-panel abstraction work
- `AdSlot.jsx` consolidation is confirmed in `CoachDirectory.jsx`, `TravelTeams.jsx`, `Facilities.jsx`, and `PlayerBoard.jsx`
- `SearchResults.jsx` still contains inline sponsored placeholder UI and was intentionally left outside ad-slot cleanup
- Remaining unexecuted original-audit items are mostly the intentionally deferred higher-risk categories: broad data hooks, shared map abstraction, and broad filter-panel extraction
- The project is now in closeout mode rather than open-ended later-phase structural planning

## Original audit items effectively completed
- Shared utilities phase completed
- Major `CoachSubmitForm` modular reduction completed
- Safe presentational extraction work completed across `CoachDirectory`, `TravelTeams`, `Facilities`, `PlayerBoard`, `RosterSpots`, `AdminPage`, and `SearchResults`
- Targeted later structural shell splits completed where they were clearly justified (`PlayerBoardBrowseContent`, `RosterBrowseContent`, `SearchResultsContent`, `GenericAdminTableContent`)
- `AdminCell` extraction completed as the final clearly justified narrow AdminPage closeout extraction
- `AdminPage.jsx` post-extraction cleanup completed and merged

## Original audit items not completed exactly as first proposed
- `AdminTable` was not extracted exactly as first proposed; later guarded structural work instead extracted `GenericAdminTableContent` from `AdminPage.jsx`
- `RosterResult` was not extracted from `SearchResults.jsx`
- Broad data-hook extraction phase was not pursued project-wide
- Shared map abstraction phase was not pursued
- Broad filter-panel extraction phase was not pursued
- These remaining items are increasingly structural and were intentionally deferred

## Current-state file inventory summary
- Files still over 1,000 lines in merged `main` include:
  - `CoachDirectory.jsx`
  - `CoachSubmitForm.jsx`
  - `Facilities.jsx`
  - `PlayerBoard.jsx`
  - `TravelTeams.jsx`
  - `RosterSpots.jsx`
  - `AdminPage.jsx`
  - `HomePage.jsx`
- Important context: `CoachDirectory.jsx`, `Facilities.jsx`, `AdminPage.jsx`, and `HomePage.jsx` grew during the refactor period because of new feature development, not because the extraction work failed
- `SearchResults.jsx` was reduced substantially and is no longer in the same critical category as in the original audit
- The remaining large files are now mostly either:
  - product-growth files
  - logic-dense files
  - or both

## Current conclusions
- `PlayerBoard.jsx` was reduced substantially through safe presentational extraction work
- `PlayerBoardBrowseContent` was the first later-phase structural split completed in `PlayerBoard.jsx`
- `PlayerBoard.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `PlayerBoard.jsx`
- Remaining `PlayerBoard.jsx` bulk is now mostly state, modal/auth flow, geocode/filter logic, submit/edit logic, and map viewport management rather than another clean render-shell extraction target
- `PlayerBoard.jsx` should remain out of immediate extraction focus unless a future dedicated state/form phase is explicitly chosen

- `RosterSpots.jsx` had one more clearly worthwhile narrow later-phase structural split after `RosterRow` and `RosterSubmittedState`
- The browse-mode shell was the best remaining structural target because it contained the live browse header/filter band, map section, prompt/no-results states, mobile inline ad, and result list
- `RosterBrowseContent` was the correct narrow structural extraction target
- `RosterBrowseContent` has now been merged and production-verified
- `RosterSpots.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `RosterSpots.jsx`
- Remaining `RosterSpots.jsx` bulk is now mostly page state, ZIP/radius filtering, desktop wrapper layout, and `RosterForm` submit/match/geocode/auth logic
- `RosterSpots.jsx` should remain out of immediate extraction focus unless a future dedicated state/form phase is explicitly chosen

- `SearchResults.jsx` still had one clearly worthwhile narrow later-phase structural split after `CoachResult`, `TeamResult`, and `FacilityResult`
- The remaining live results-page shell was the best target because it contained the loading/empty/results branches, section wrappers, mobile sponsored placeholders, and desktop sidebar sponsored placeholder layout
- `SearchResultsContent` was the correct narrow structural extraction target
- `SearchResultsContent` has now been merged and production-verified
- `SearchResults.jsx` was re-inspected from merged `main` after `SearchResultsContent` extraction
- No additional clearly worthwhile narrow render-structure split remains in `SearchResults.jsx`
- Remaining `SearchResults.jsx` bulk is now mostly state, geocode/fetch, filtering, query construction, navigation, and small search/filter header orchestration rather than another clean narrow render-shell extraction target
- `SearchResults.jsx` should remain out of immediate extraction focus

- `CoachSubmitForm.jsx` was reviewed as a possible target, but it remains outside immediate focus because the remaining bulk is almost entirely form/validation/geocode/duplicate-check/state logic territory
- `CoachSubmitForm.jsx` should remain deferred unless a future dedicated form-extraction phase is explicitly chosen

- `CoachDirectory.jsx`, `Facilities.jsx`, and `TravelTeams.jsx` still contain some incomplete Phase 1 shared-utility import cleanup
- The remaining bulk in those files is otherwise primarily map/filter/state orchestration territory
- That remaining orchestration work is not currently a clean narrow render-structure target and should remain deferred

- `HomePage.jsx` grew substantially because of organic feature development and is not currently a refactor target
- No structural split is currently justified there under the locked rules

- `AdminPage.jsx` had one clearly worthwhile narrow later-phase structural split after `PasswordGate`, `ClaimRequestRow`, `ClaimRequestsToolbar`, and `AdminTabs`
- The generic admin data-table render shell was the best remaining target because it contained the card wrapper, toolbar/filter row, shown count, loading/empty states, and generic table/head/body rendering
- `GenericAdminTableContent` was the correct narrow structural extraction target
- `GenericAdminTableContent` has now been merged and production-verified
- `AdminCell` was the final clearly worthwhile bounded extraction candidate in `AdminPage.jsx`
- `AdminCell` has now been merged and production-verified
- Follow-up cleanup corrected `AdminPage.jsx` helper integrity, `GenericAdminTableContent.jsx` prop pass-through, and local-mode `ClaimRequestsTable` handling
- No additional clearly worthwhile narrow render-structure split remains in `AdminPage.jsx`
- Everything else remaining in `AdminPage.jsx` is now mostly field config data, sort/filter helpers, generic table wiring, and claim-request/admin logic rather than another broad render-shell candidate
- `AdminPage.jsx` should remain out of immediate extraction focus unless a future dedicated admin-logic phase is explicitly chosen

- The refactor is substantially complete
- The project has reached a natural closeout stage for safe, narrow, render-structure extraction work
- After the remaining closeout items, the next phase should be bug audit rather than broader structural abstraction unless explicitly chosen

## Next target
- Execute the remaining incomplete Phase 1 shared-utility import cleanup one file per branch:
  - `Facilities.jsx`
  - `TravelTeams.jsx`
  - `CoachDirectory.jsx`
- After those merges, declare refactor closeout complete and begin bug audit

## Remaining queue
1. Cleanup shared-utility imports in `Facilities.jsx`
2. Cleanup shared-utility imports in `TravelTeams.jsx`
3. Cleanup shared-utility imports in `CoachDirectory.jsx`
4. Reconcile `NOTES.md` after each merge
5. Declare refactor closeout complete
6. Begin bug audit

## Local branches to keep
- `main`
- `refactor/shared-utilities-phase-1`
- `refactor/submit-form-modular`

## Locked rules
- Move slowly and cleanly
- One extraction or one cleanup per branch
- One type of change at a time
- No giant rewrites
- Inspect before editing
- Test each affected page before moving on
- Keep `NOTES.md` updated
- No file should exceed 1000 lines when the audit path is complete
- Do not expand scope just because a file is still large if the remaining bulk is logic-dense or product-growth territory

## Closeout-phase guardrails
- Closeout work must stay narrow and guarded
- Prioritize only clearly justified low-risk extraction or import-cleanup work
- Do not jump to hooks, form/auth extraction, shared map abstraction, filter-panel extraction, or broad logic refactors unless explicitly chosen as a new phase
- Do not create a branch until inspection is complete and the exact target is confirmed
- If no clearly worthwhile narrow split remains, say so clearly and move the file out of immediate focus
- Treat new feature growth separately from refactor regression

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
- For closeout work, define a narrow scope before creating any branch
- For shared-utility cleanup, treat each consuming file as its own branch unless explicitly combined

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
Deferred until refactor closeout items are complete:
- Remaining Phase 1 shared-utility import cleanup in `Facilities.jsx`, `TravelTeams.jsx`, and `CoachDirectory.jsx`

After those closeout items, transition to bug audit.