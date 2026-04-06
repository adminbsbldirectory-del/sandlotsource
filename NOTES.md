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
Safe extraction / file-size reduction work is effectively complete.
Next phase is bug audit.

---

## Repo / workflow
- **Desktop:** `C:\GitHub\sandlotsource` — pull before any new branch when returning from laptop work
- **Laptop:** `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Confirm active device and repo path at the start of every execution thread
- Local workflow only: VS Code + terminal + GitHub Desktop
- One branch per change. No edits on `main`. Test locally before merge. Verify Vercel after every merge.

---

## Completed extractions (40 total)
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
39. `MapMarkers` — CoachDirectory
40. `EmptyState` — TravelTeams

## Completed cleanup items
- `CoachDirectory.jsx` — unused `CoachCard` dead-code block removed
- `TravelTeams.jsx` — shared ad-wrapper adoption (replaced inlined DirectoryAdBand/RailAdSlot with shared imports)
- `Facilities.jsx` — shared ad-wrapper adoption (replaced inlined DirectoryAdBand/RailAdSlot with shared imports)
- `Facilities.jsx` — unused `FacilityCard` dead-code block removed
- `Facilities.jsx` — orphaned `normalizeUrl` and `normalizeInstagramHandle` removed

---

## Per-file status

### `CoachDirectory.jsx` — BLOCKED
`MapLegend` and `MapMarkers` extractions are complete and merged. Remaining bulk is primarily map-state coupling, grouped marker logic, filter/search/ZIP orchestration, mobile/desktop layout branching, and main page state flow. No additional clearly worthwhile narrow live extraction remains in the current phase.

### `Facilities.jsx` — BLOCKED
Shared ad-wrapper adoption cleanup is complete and merged. Dead `FacilityCard` cleanup is complete and merged, along with orphaned `normalizeUrl` and `normalizeInstagramHandle`. Remaining bulk is primarily ZIP/filter/map/layout orchestration. No additional clearly worthwhile narrow live extraction remains in the current phase.

### `TravelTeams.jsx` — OPTIONAL-ONLY
`EmptyState` extraction is complete and merged. `MapLegend` remains later optional work only. Remaining bulk is mostly map/filter/state orchestration, so do not force another extraction unless a very small, clearly bounded candidate is needed for a specific future reason.

### `HomePage.jsx` — BLOCKED
All four homepage leaf extractions are complete (`FeaturedCard`, `HomePageAdBand`, `HomePageSectionHeader`, `HomePageBand`). Re-inspection of current merged `main` did not identify another clearly worthwhile narrow live extraction. Remaining bulk is primarily hero search/filter orchestration, page-local state/navigation coupling, and single-use homepage sections.

### `AdminPage.jsx` — DONE
Below target. Out of oversized-file queue.

### `CoachSubmitForm.jsx` — DEFERRED
Remaining bulk is multi-form validation, geocode, and Supabase logic. No clean narrow split remains. Do not reopen without a dedicated form phase decision.

### `PlayerBoard.jsx` — BLOCKED
Remaining bulk is state/auth/geocode/form/map-viewport logic. No additional clearly worthwhile narrow extraction remains in the current phase.

### `RosterSpots.jsx` — BLOCKED
Remaining bulk is RosterForm, geocode/filter state, and orchestration. No additional clearly worthwhile narrow extraction remains in the current phase.

---

## Next branch queue
1. Begin bug audit from current merged `main`
2. Inspect live behavior and fragile flows file-by-file or feature-by-feature
3. Only reopen extraction work if a new clearly bounded live candidate appears during future maintenance

---

## Rules
- One branch, one file, one type of change
- Inspect before creating any branch — confirm the target is live-rendered
- List all dependencies before writing code
- No giant rewrites. No scope creep mid-branch.
- If a file is blocked, state exactly why. If deferred, state exactly why.
- Prefer the narrowest safe extraction only when it materially improves the edit surface
- Bug audit work should focus on actual behavior, regressions, edge cases, and fragile flows — not forced line-count reduction

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
- [x] Last completed item recorded in extractions list
- [x] Affected per-file status block updated
- [x] Next branch queue updated
- [x] Repo state confirmed: `main` / clean / synced
- [ ] NOTES.md rewritten (not appended) and committed

---

## Bug audit
Active next phase. Start from current merged `main`. Prioritize real behavior issues, fragile UX flows, edge cases, validation gaps, geocode/search failure handling, mobile layout issues, and Supabase/data-state problems.