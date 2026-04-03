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
- `CoachResult` extraction from `SearchResults.jsx` is complete and merged
- `TeamResult` extraction from `SearchResults.jsx` is complete and merged
- `FacilityResult` extraction from `SearchResults.jsx` is complete and merged
- `PlayerBoardBrowseContent` structural extraction from `PlayerBoard.jsx` is complete and merged
- `PlayerBoard.jsx` was re-inspected from merged `main`
- No additional clearly worthwhile narrow render-structure split remains in `PlayerBoard.jsx`
- `RosterBrowseContent` structural extraction from `RosterSpots.jsx` is complete locally on branch `refactor/roster-spots-browse-content`
- Local localhost testing passed for the `RosterBrowseContent` extraction
- PR / merge / Vercel production verification for `RosterBrowseContent` are still pending
- Local repo is on a working refactor branch for the `RosterBrowseContent` extraction unless changed after this note
- `main` remains the production-aligned source of truth
- Do not mark the latest `RosterSpots.jsx` structural extraction as merged until PR merge and production verification are confirmed

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
26. RosterBrowseContent - `RosterSpots` (**local branch only until merged**)

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
- `AdminTable` was not extracted as its own file
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
- `RosterBrowseContent` is complete locally and localhost-tested
- Remaining `RosterSpots.jsx` weight is now increasingly concentrated in form logic, team-match lookup, zip/search state, and page orchestration rather than another clearly worthwhile render-structure split
- `AdminPage.jsx` has already completed all clearly worthwhile Phase 2 presentational work and remains in later structural planning
- `SearchResults.jsx` has already completed all clearly worthwhile Phase 2 presentational work and remains in later structural planning
- The remaining oversized files are now primarily in later structural refactor territory

## Next target
- Finish the branch lifecycle for `RosterBrowseContent`:
  - update `NOTES.md`
  - commit
  - push
  - open PR
  - merge
  - verify Vercel production
- Then re-inspect merged `RosterSpots.jsx`
- If no further narrow worthwhile split remains in merged `RosterSpots.jsx`, move to the next later-phase structural target
- Current likely next later-phase targets after `RosterSpots.jsx` are:
  1. `AdminPage.jsx`
  2. `SearchResults.jsx`

## Remaining queue
1. Merge and production-verify `RosterBrowseContent` extraction from `RosterSpots.jsx`
2. Re-inspect merged `RosterSpots.jsx`
3. Determine whether any additional narrow worthwhile render-structure split remains in `RosterSpots.jsx`
4. If not, move to the next later-phase structural target
5. Continue later-phase structural reduction planning for `AdminPage.jsx` and `SearchResults.jsx`
6. Bug audit remains deferred until file-reduction work is complete

## Local branches to keep
- `main`
- `refactor/shared-utilities-phase-1`
- `refactor/submit-form-modular`
- `refactor/roster-spots-browse-content` (**until merged and production-verified**)

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