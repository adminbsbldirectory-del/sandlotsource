# Sandlot Source Refactor Notes

## Current phase
Refactor continuation is active.

The project should **not** move to bug audit yet.

Reason:
- Several major JSX files still remain above the original under-1000-lines finish target
- Prior closeout language called the stopping point too early
- The earlier notes drifted into “refactor closeout is complete / begin bug audit” even though the notes also retained the under-1000-lines rule
- Current priority is to keep reducing oversized files into more manageable edit surfaces through safe, bounded extraction work
- Minor bugs should be addressed after the oversized-file work is pushed further and the remaining large files are easier to edit

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
- `Facilities.jsx` shared-utility import cleanup is complete and merged
- `Facilities.jsx` now imports `normalizeSportValue` from `src/utils/sportUtils.js`
- `Facilities.jsx` now imports `geocodeZip` and `distanceMiles` from `src/lib/submit/geocode.js`
- Unused local helpers `getSportLabel` and `handleZipBlur` were removed from `Facilities.jsx`
- `TravelTeams.jsx` shared-utility import cleanup is complete and merged
- `TravelTeams.jsx` now imports `normalizeSportValue` from `src/utils/sportUtils.js`
- `TravelTeams.jsx` now imports `geocodeZip` and `distanceMiles` from `src/lib/submit/geocode.js`
- Duplicate local helper definitions for `normalizeSportValue`, `geocodeZip`, and `distanceMiles` were removed from `TravelTeams.jsx`
- `CoachDirectory.jsx` shared-utility import cleanup is complete and merged
- `CoachDirectory.jsx` now imports `geocodeZip` and `distanceMiles` from `src/lib/submit/geocode.js`
- Duplicate local helper definitions for `geocodeZip` and `distanceMiles` were removed from `CoachDirectory.jsx`
- `CoachDirectory.jsx` ad-wrapper extraction is complete and merged
- Shared `DirectoryAdBand` and `RailAdSlot` components were added under `src/components/ads/`
- `CoachDirectory.jsx` now imports shared `DirectoryAdBand` and `RailAdSlot`
- Local inlined `DirectoryAdBand` and `RailAdSlot` definitions were removed from `CoachDirectory.jsx`
- Vercel production was verified after the `RosterBrowseContent` merge
- Vercel preview looked good and production deployed correctly after the `SearchResultsContent` merge
- Vercel preview looked good and production deployed correctly after the `GenericAdminTableContent` merge
- Vercel preview looked good and production deployed correctly after the `AdminPage.jsx` closeout cleanup merge
- Vercel production was verified after the `Facilities.jsx` shared-utility cleanup merge
- Vercel preview looked good and production deployed correctly after the `TravelTeams.jsx` shared-utility cleanup merge
- Vercel preview looked good and production deployed correctly after the `CoachDirectory.jsx` shared-utility cleanup merge
- Vercel preview looked good and production deployed correctly after the `CoachDirectory.jsx` ad-wrapper extraction merge
- Local repo is back on `main`
- Local `main` should be kept up to date with `origin/main`
- Refactor closeout audit was completed against current merged `main`
- Current-state inventory confirms 30 completed extractions / major modular reductions
- Earlier closeout language is no longer the active source-of-truth framing
- Refactor work is **not** considered complete yet because the remaining oversized JSX files still need additional bounded reduction work where safely possible
- Bug audit is deferred until the active refactor continuation work is pushed further or the remaining oversized files are explicitly dispositioned

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
30. DirectoryAdBand + RailAdSlot - `CoachDirectory`

## Audit reconciliation
- The original audit direction was useful and led to substantial safe extraction work across the codebase
- Later closeout language drifted into “natural stopping point” logic before the original finish-line intent was actually satisfied
- That drift is now being corrected
- The project is returning to the practical finish-line principle:
  - keep reducing oversized files into more manageable edit surfaces
  - keep using one bounded extraction or cleanup per branch
  - explicitly document what remains in each oversized file instead of letting files drift into “deferred” status without a clear disposition

## Current-state file inventory summary
Current remaining oversized JSX files from the latest repo comparison:
- `CoachDirectory.jsx` — 3,010
- `CoachSubmitForm.jsx` — 2,224
- `Facilities.jsx` — 1,784
- `PlayerBoard.jsx` — 1,614
- `TravelTeams.jsx` — 1,334
- `RosterSpots.jsx` — 1,268
- `HomePage.jsx` — 1,060

`AdminPage.jsx` is now below the target at 996 and is no longer part of the oversized-file queue.

Important context:
- `CoachDirectory.jsx`, `Facilities.jsx`, and `HomePage.jsx` grew during the refactor period because of new feature development, not because the extraction work failed
- That context does **not** by itself close the refactor
- The active goal is still to keep reducing the remaining oversized JSX files through safe, bounded, inspect-first work where worthwhile live extractions remain

## Oversized file status framework
Every JSX file still over 1,000 lines must carry one of these statuses in the notes:

1. **Active reduction path identified**
   - at least one confirmed live bounded extraction remains
   - next extraction order is explicitly recorded

2. **Blocked by structural territory**
   - no additional worthwhile bounded extraction remains from current inspection
   - remaining bulk is predominantly orchestration/state/form/auth/map/hook territory

3. **Explicit exception approved**
   - file remains oversized by deliberate decision
   - reason is stated explicitly
   - do not silently treat this as “closeout complete”

Do not mark refactor complete while an oversized file lacks one of the above explicit statuses.

## Per-file current status

### `CoachDirectory.jsx`
**Status:** Active reduction path identified

Fresh inspection confirms:
- the main `CoachDirectory` orchestration shell alone is ~1,838 lines
- `DirectoryAdBand` and `RailAdSlot` extraction is complete and merged
- shared ad-wrapper location under `src/components/ads/` was used because the same wrapper pattern is also present in `Facilities.jsx` and `TravelTeams.jsx`
- confirmed remaining inlined extractable pieces still include:
  - `CoachCard` (~522)
  - `RatingRow` (~80)
  - `MapMarkers` (~102)
  - `MapLegend` (~58)
  - `EmptyState` (~28)

Confirmed practical next sequence:
1. extract `RatingRow`
2. verify whether `CoachCard` is still actually rendered in the live browse flow before any extraction decision
3. only then decide whether `CoachCard` remains a real extraction target or should be treated as legacy / unused-code cleanup instead

Important dependency note:
- `CoachCard` uses `parseFirstPhone`, `getCoachZip`, `getSportBadgeMeta`, `parseSpecialties`, `priceLabel`, and `RatingRow`
- `parseSpecialties` and `getSportBadgeMeta` are also used by the main file, so any future `CoachCard` extraction still requires careful sequencing and either temporary duplication of small pure helpers or a later dedicated helper move
- keep that branch focused; do not combine helper centralization casually with the component extraction

Additional pieces (`MapMarkers`, `MapLegend`, `EmptyState`) remain possible later but are lower in the immediate order than `RatingRow`.

### `Facilities.jsx`
**Status:** Needs refreshed inspection after current reset

Current confirmed context:
- the same inlined `DirectoryAdBand` / `RailAdSlot` wrapper pattern is still present
- do not adopt those shared wrappers in the same branch as the `CoachDirectory.jsx` extraction
- re-inspect current merged `main` for the next narrow worthwhile step after the `CoachDirectory.jsx` ad-wrapper branch closeout

### `TravelTeams.jsx`
**Status:** Needs refreshed inspection after current reset

Current confirmed context:
- the same inlined `DirectoryAdBand` / `RailAdSlot` wrapper pattern is still present
- `MapLegend` and `EmptyState` may still remain as possible later candidates
- re-inspect current merged `main` for the next narrow worthwhile step after the `CoachDirectory.jsx` ad-wrapper branch closeout

### `PlayerBoard.jsx`
**Status:** Blocked by structural territory unless future inspection proves otherwise

Latest earlier inspection said no additional clearly worthwhile narrow render-structure split remained.
Remaining bulk is primarily state/auth/form/geocode/map viewport logic.
Keep out of immediate focus unless a new bounded live extraction is confirmed.

### `RosterSpots.jsx`
**Status:** Blocked by structural territory unless future inspection proves otherwise

Latest earlier inspection said no additional clearly worthwhile narrow render-structure split remained.
Remaining bulk is primarily `RosterForm`, geocode/filter state, and wrapper/orchestration logic.
Keep out of immediate focus unless a new bounded live extraction is confirmed.

### `CoachSubmitForm.jsx`
**Status:** Blocked by structural territory

Still primarily form/validation/geocode/Supabase logic across multiple submit flows.
Do not reopen casually.
Only revisit under a deliberate dedicated form phase.

### `HomePage.jsx`
**Status:** Needs explicit re-inspection before either reduction or exception

Older audit treated this as product-growth territory rather than a live refactor target.
Do not assume exception status without an explicit refreshed inspection.
Either identify a bounded extraction path later or formally mark as an approved exception.

## Current conclusions
- The project completed the bulk of the earlier safe leaf and narrow structural extraction work
- The project also completed the final previously identified shared-utility cleanup items in `Facilities.jsx`, `TravelTeams.jsx`, and `CoachDirectory.jsx`
- The project has now also completed the next bounded `CoachDirectory.jsx` ad-wrapper extraction
- However, the project has **not** yet reached the intended maintainability end state for the remaining oversized files
- Refactor continuation is therefore active again
- Bug audit is postponed until the remaining oversized-file queue is pushed further and every oversized file has an explicit status

## Active objective
Continue reducing oversized JSX files into more manageable edit surfaces using the narrowest safe live extraction path available per file.

## Next target
`CoachDirectory.jsx`

## Confirmed next extraction order
1. inspect and execute `RatingRow`
2. verify whether `CoachCard` is still actually rendered in the live browse flow before any extraction decision
3. re-rebaseline `Facilities.jsx`
4. re-baseline `TravelTeams.jsx`

## Remaining queue
1. `CoachDirectory.jsx` — `RatingRow`
2. `CoachDirectory.jsx` — verify whether `CoachCard` is still actively rendered before any extraction decision
3. Re-baseline `Facilities.jsx`
4. Re-baseline `TravelTeams.jsx`
5. Revisit whether `HomePage.jsx` gets a bounded extraction path or explicit exception
6. Begin bug audit only after the above queue has progressed and the oversized files all have explicit statuses

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
- If the under-1000 target remains difficult for a given file, continue tracking maintainability wins via bounded extractions rather than prematurely declaring closeout complete

## Refactor-continuation guardrails
- Do not jump to bug audit yet
- Do not casually reopen everything at once
- Do not jump blindly into hooks, shared map abstraction, or broad logic rewrites unless they become the only reasonable path for a specific file and are explicitly chosen
- Prefer the narrowest safe live extraction that materially reduces a target file
- Keep each step independently testable
- Use current merged `main` as the source of truth for what remains
- Do not let “natural stopping point” language replace explicit per-file status tracking

## Drift-prevention rules
- Do not mark refactor complete while any oversized JSX file lacks an explicit status
- Do not move phases based on broad “closeout complete” wording alone
- For every oversized file, record either:
  - next bounded extraction target
  - blocked-by-structural-territory status
  - or explicit approved exception
- If a file still contains confirmed live extractable UI blocks, it remains in active refactor scope
- If a file is blocked, say exactly why
- If a file is excepted, say exactly why
- Final task of every thread is reconciling `NOTES.md` so no stale next-phase wording remains

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
- Do not jump casually into hooks, filters, map abstraction, submit-form splits, or unrelated cleanup
- Do not create a branch before inspection is complete and confirmed
- Do not switch to bug-audit planning while refactor continuation is still active

## Execution reminders
- Provide full paste-ready file contents for any new component, not just a summary
- Provide the exact import line(s) and clearly state what in-file block to remove
- Check sibling files in the target folder for naming and prop-pattern consistency before creating a new file
- Before proposing any new extraction, first confirm whether the current target still has a clearly live presentational leaf or a bounded structural shell that materially improves maintainability
- For continued oversized-file work, define a narrow scope before creating any branch
- Keep the focus on the next live reduction step, not broad architectural ambition

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
Deferred for now.

Bug audit should begin only after:
- the oversized-file queue has been pushed further,
- each oversized file has an explicit status,
- and the project is no longer drifting between refactor continuation and premature closeout language.