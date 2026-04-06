# Sandlot Source Refactor Notes

---

## ⚠️ MANDATORY CLOSEOUT STEP — DO THIS BEFORE ENDING EVERY THREAD
Once a branch is merged, Vercel is verified, and the repo is back on `main` with a clean working tree:
1. **DELETE this entire file and rewrite it from scratch** using this document as the template
2. Update only what changed: add one line to the extractions list, update the affected per-file status block, update the next branch queue
3. **Do NOT append. Do NOT preserve old bullet points or narrative.** The doc must stay this length.
4. The thread is not done until NOTES.md is rewritten and committed to `main`

---

## Current phase
Refactor continuation is active. Do not move to bug audit.
Remaining oversized files need explicit per-file status before any phase change.

---

## Repo / workflow
- **Desktop:** `C:\GitHub\sandlotsource` — pull before any new branch when returning from laptop work
- **Laptop:** `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Confirm active device and repo path at the start of every execution thread
- Local workflow only: VS Code + terminal + GitHub Desktop
- One branch per change. No edits on `main`. Test locally before merge. Verify Vercel after every merge.

---

## Completed extractions (38 total)
1. Phase 1 shared utilities
2. `CoachSubmitForm` modular refactor
3. `CoachRow` — CoachDirectory
4. `CoachDetailPanel` — CoachDirectory
5. `MobileCoachRow` — CoachDirectory
6. `RatingRow` — CoachDirectory
7. `CoachDirectoryEmptyState` — CoachDirectory
8. `TeamCard` — TravelTeams
9. `TeamPreviewCard` — TravelTeams
10. `TeamDesktopRow` — TravelTeams
11. `FacilityDesktopRow` — Facilities
12. `MobileFacilityRow` — Facilities
13. `FacilityPreviewCard` — Facilities
14. `FacilitiesEmptyState` — Facilities
15. `PlayerBoardDetailPanel` — PlayerBoard
16. `PlayerBoardDesktopRow` — PlayerBoard
17. `PlayerBoardMobileCard` — PlayerBoard
18. `PlayerBoardBrowseSidebar` — PlayerBoard
19. `PlayerBoardBrowseContent` — PlayerBoard
20. `RosterRow` — RosterSpots
21. `RosterSubmittedState` — RosterSpots
22. `RosterBrowseContent` — RosterSpots
23. `ClaimRequestRow` — AdminPage
24. `ClaimRequestsToolbar` — AdminPage
25. `AdminTabs` — AdminPage
26. `PasswordGate` — AdminPage
27. `AdminCell` — AdminPage
28. `GenericAdminTableContent` — AdminPage
29. `CoachResult` — SearchResults
30. `TeamResult` — SearchResults
31. `FacilityResult` — SearchResults
32. `SearchResultsContent` — SearchResults
33. `DirectoryAdBand + RailAdSlot` — shared to `src/components/ads/`
34. `FeaturedCard` — HomePage
35. `HomePageAdBand` — HomePage
36. `HomePageSectionHeader` — HomePage
37. `HomePageBand` — HomePage
38. `MapLegend` — CoachDirectory

## Completed cleanup items
- `CoachDirectory.jsx` — unused `CoachCard` dead-code block removed
- `TravelTeams.jsx` — shared ad-wrapper adoption (replaced inlined DirectoryAdBand/RailAdSlot with shared imports)
- `Facilities.jsx` — shared ad-wrapper adoption (replaced inlined DirectoryAdBand/RailAdSlot with shared imports)

---

## Per-file status

### `CoachDirectory.jsx` — ACTIVE
`MapLegend` extraction is complete and merged.
Next: inspect `MapMarkers` as a later optional live extraction candidate. Keep it inspect-first, branch-narrow, and do not combine with helper cleanup or map abstraction.

### `Facilities.jsx` — ACTIVE
Shared ad-wrapper adoption cleanup is complete and merged.
Next: re-baseline from current merged `main`, then decide whether another narrow live extraction remains or whether the file should move toward blocked/structural territory. Do not combine re-baseline with any other cleanup.

### `TravelTeams.jsx` — ACTIVE
Next: inspect `EmptyState` as the next narrow live extraction. `MapLegend` is later optional work. Do not mix either step with map abstraction, helper cleanup, or ad-wrapper changes.

### `HomePage.jsx` — BLOCKED
All four homepage leaf extractions are complete (`FeaturedCard`, `HomePageAdBand`, `HomePageSectionHeader`, `HomePageBand`). Re-inspection of current merged `main` did not identify another clearly worthwhile narrow live extraction. Remaining bulk is primarily hero search/filter orchestration, page-local state/navigation coupling, and single-use homepage sections. Do not force another extraction without a fresh code-level candidate that is materially more leaf-like than the current hero block.

### `AdminPage.jsx` — DONE
Below target. Out of oversized-file queue.

### `CoachSubmitForm.jsx` — BLOCKED
Remaining bulk is multi-form validation, geocode, and Supabase logic. No clean narrow split remains. Do not reopen without a dedicated form phase decision.

### `PlayerBoard.jsx` — BLOCKED
Remaining bulk is state/auth/geocode/form/map-viewport logic. Do not reopen without a new confirmed extraction candidate from a fresh inspection.

### `RosterSpots.jsx` — BLOCKED
Remaining bulk is RosterForm, geocode/filter state, and orchestration. Do not reopen without a new confirmed extraction candidate from a fresh inspection.

---

## Next branch queue
1. Inspect `EmptyState` in `TravelTeams.jsx` — go/no-go for extraction
2. Inspect `MapMarkers` in `CoachDirectory.jsx` — go/no-go only, later optional
3. Re-baseline `Facilities.jsx` — decide next narrow extraction vs blocked status
4. Bug audit begins only after every oversized file above has an explicit blocked/excepted/done status

---

## Rules
- One branch, one file, one type of change
- Inspect before creating any branch — confirm the target is live-rendered
- List all dependencies before writing code
- No giant rewrites. No scope creep mid-branch.
- Do not move to bug audit while any oversized file lacks an explicit status
- Do not use "natural stopping point" language as a substitute for per-file status
- If a file is blocked, state exactly why. If excepted, state exactly why.
- Prefer the narrowest safe extraction that materially improves the edit surface

## Inspection checklist — required before every extraction
1. Find the candidate component/function
2. Confirm it is actually rendered in the live UI (grep for usage, not just definition)
3. Identify the exact line range
4. List all dependencies (state, handlers, refs, helpers, imports)
5. Only then open a branch and write code

## Execution reminders
- Provide full paste-ready file contents for any new component file
- Provide the exact import line and clearly state what block to remove
- Check sibling files in the target folder for naming/prop-pattern consistency
- Confirm repo path and device before creating any branch

## Thread closeout checklist
- [ ] Last completed item recorded in extractions list
- [ ] Affected per-file status block updated
- [ ] Next branch queue updated
- [ ] Repo state confirmed: `main` / clean / synced
- [ ] NOTES.md rewritten (not appended) and committed

---

## Bug audit
Deferred. Begin only after every oversized file has a status of blocked, excepted, or below target.