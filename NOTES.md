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
Current phase is bug audit.

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
- `CoachDirectory.jsx` — fixed coach click-through from `/search` so URL-driven coach selection is preserved on `/coaches`
- `FacilityProfile.jsx` — fixed mobile hero/header spacing collapse so facility names no longer compress into a narrow vertical column on mobile
- `SearchResults.jsx` / mobile browser behavior — fixed mobile browser search-results issue (`Daily`, `MJCCA`, `BSBL` repros) and merged
- `TravelTeams.jsx` — fixed ZIP radius control mismatch so `/teams` now uses the same always-visible shared dropdown pattern used on `/coaches` and `/facilities`
- `CoachDirectory.jsx` — fixed `/coaches` desktop search-bar / header consistency by restoring ZIP-first sidebar order to match `/facilities` and `/teams`
- `RosterSpots.jsx` / `RosterBrowseContent.jsx` / `RosterRow.jsx` — verified live that linked roster spots already surface `Linked Team`, `View Team`, and `View Facility` when `team_id` and related facility data exist; no additional code change needed for this item
- `HomePage.jsx` — replaced hard-coded homepage featured coaches and teams with Supabase-driven featured listings using existing `featured_status` / `featured_rank` fields; featured cards now link to selected coach/team records instead of generic directory pages
- `TeamPreviewCard.jsx` / `FacilityPreviewCard.jsx` — aligned desktop team and facility preview cards with `CoachDetailPanel` by matching true centered modal anchoring and max-height behavior

---

## Per-file status

### `CoachDirectory.jsx` — BUG-AUDIT ACTIVE
`MapLegend` and `MapMarkers` extractions are complete and merged. Search-results coach click-through bug is fixed. Desktop search-bar / header consistency issue is fixed and merged. `CoachDetailPanel` now serves as the alignment source of truth for desktop preview positioning. Remaining bulk is primarily map-state coupling, grouped marker logic, filter/search/ZIP orchestration, mobile/desktop layout branching, and main page state flow. Future work here should stay in bug-audit / behavior-fix mode only.

### `Facilities.jsx` — BUG-AUDIT ACTIVE
Shared ad-wrapper adoption cleanup is complete and merged. Dead `FacilityCard` cleanup is complete and merged, along with orphaned `normalizeUrl` and `normalizeInstagramHandle`. Desktop facility preview alignment polish is fixed via `FacilityPreviewCard` centering update. Remaining bulk is primarily ZIP/filter/map/layout orchestration. Future work should stay narrow and behavior-focused only.

### `FacilityProfile.jsx` — BUG-AUDIT ACTIVE
Mobile hero/header spacing collapse bug is fixed and merged. Current file is below the oversized-file concern level, but future work here should stay narrow and behavior-focused only.

### `TravelTeams.jsx` — BUG-AUDIT ACTIVE
`EmptyState` extraction is complete and merged. Radius control presentation mismatch after ZIP search is fixed and merged. Desktop team preview alignment polish is fixed via `TeamPreviewCard` centering update matched to `CoachDetailPanel`. `MapLegend` remains later optional work only. Remaining bulk is mostly map/filter/state orchestration, so future work should stay narrow and behavior-focused.

### `HomePage.jsx` — BUG-AUDIT ACTIVE
All four homepage leaf extractions are complete (`FeaturedCard`, `HomePageAdBand`, `HomePageSectionHeader`, `HomePageBand`). Homepage featured coaches and teams no longer use hard-coded filler data; they now load from Supabase using existing featured fields and link to the correct selected coach/team records. Remaining homepage work should stay narrow and behavior-focused only. Geo-aware / IP-aware featured localization remains a future feature, not a current bug-audit requirement.

### `SearchResults.jsx` — BUG-AUDIT ACTIVE
Leaf result extractions are complete and merged. Mobile browser search-results behavior issue is fixed and merged. Future work here should remain narrow and behavior-focused only.

### `AdminPage.jsx` — DONE
Below target. Out of oversized-file queue.

### `CoachSubmitForm.jsx` — DEFERRED
Remaining bulk is multi-form validation, geocode, and Supabase logic. No clean narrow split remains. Do not reopen without a dedicated form phase decision.

### `PlayerBoard.jsx` — BLOCKED
Remaining bulk is state/auth/geocode/form/map-viewport logic. No additional clearly worthwhile narrow extraction remains in the current phase.

### `RosterSpots.jsx` — BUG-AUDIT ACTIVE
Linked roster spots to existing teams / facilities were inspected and verified live without new code changes. Current launch direction is that roster spots may publish immediately and auto-expire after 15 days, rather than requiring manual pending/review moderation. Claim should not be required before roster spot creation. Future work should focus only on narrow launch-hardening, spam control, or UX polish if needed.

---

## Next branch queue
1. Continue bug audit from current merged `main`
2. Homepage featured cards minor polish — consider removing or reworking the `· Featured` location-line treatment
3. Relocate homepage stats/banner section and align displayed counts with database totals
4. Site font harmonization; consider larger header logo and optional footer logo placement
5. Add advertising page with submit form, image upload support, sizing requirements, and email-routing decision (`ads@` alias vs admin)

---

## Bug audit backlog
- Homepage featured cards: consider replacing the current location + `Featured` line treatment with a cleaner homepage-specific display
- Evaluate future geo-aware / IP-aware homepage featured listings with safe fallback behavior
- Relocate homepage stats/banner section and align displayed counts with database totals
- Site font harmonization; consider larger header logo and optional footer logo placement
- Add advertising page with submit form, image upload support, sizing requirements, and email-routing decision (`ads@` alias vs admin)
- Add more duplicate triggers for coaches / facilities / teams, including email-based checks
- Work on hidden spam blocking and profile accuracy scoring
- Add tournament pages with state-sorted links to known organizers; org-site links only for now, not calendars
- Determine whether teams should auto-expire after ~14 months if not updated, with reminder email ~30 days before expiration and season-aging update prompt
- Investigate better address parsing / recognition for CTFP-style addresses (`Pl`, `Blvd`, `Ct`, `Rd`, `Dr`, `Hwy`, `Rte`, etc.)
- On admin page, include facility / team / coach addresses and other form-driven fields that need update visibility

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
Active phase. Start from current merged `main`. Prioritize real behavior issues, fragile UX flows, edge cases, validation gaps, geocode/search failure handling, mobile layout issues, and Supabase/data-state problems.