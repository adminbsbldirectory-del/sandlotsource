# Sandlot Source Refactor Notes

---

## ⚠️ MANDATORY CLOSEOUT STEP — DO THIS BEFORE ENDING EVERY THREAD
Once a branch is merged, Vercel is verified, and the repo is back on `main` with a clean working tree:

1. **Delete this entire file and rewrite it from scratch** using this template.
2. Update only what changed: add one line to the completed items list, update the affected per-file status block, and update the next branch queue.
3. **Do not append. Do not preserve old narrative.** Keep the document at this general length and structure.
4. The thread is not complete until `NOTES.md` is rewritten and committed to `main`.

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
- One branch per change
- No edits on `main`
- Test locally before merge
- Verify Vercel after every merge

---

## Completed extractions (41 total)
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
41. `AdvertisePage` — public advertising page

## Completed cleanup items
- `CoachDirectory.jsx` — removed unused `CoachCard` dead code
- `TravelTeams.jsx` — adopted shared ad wrapper imports
- `Facilities.jsx` — adopted shared ad wrapper imports
- `Facilities.jsx` — removed unused `FacilityCard` dead code
- `Facilities.jsx` — removed orphaned `normalizeUrl` and `normalizeInstagramHandle`
- `CoachDirectory.jsx` — fixed coach click-through from `/search` so URL-based coach selection is preserved on `/coaches`
- `FacilityProfile.jsx` — fixed mobile hero/header spacing collapse so facility names no longer stack into a narrow column
- `SearchResults.jsx` / mobile browser behavior — fixed mobile search-results issue (`Daily`, `MJCCA`, `BSBL` repros)
- `TravelTeams.jsx` — fixed ZIP radius control mismatch so `/teams` matches the always-visible shared dropdown pattern used on `/coaches` and `/facilities`
- `CoachDirectory.jsx` — fixed `/coaches` desktop search-bar / header consistency by restoring ZIP-first sidebar order to match `/facilities` and `/teams`
- `RosterSpots.jsx` / `RosterBrowseContent.jsx` / `RosterRow.jsx` — verified live that linked roster spots already surface `Linked Team`, `View Team`, and `View Facility` when linked team/facility data exists; no code change needed
- `HomePage.jsx` — replaced hard-coded featured coaches and teams with Supabase-driven featured listings using existing `featured_status` / `featured_rank` fields
- `TeamPreviewCard.jsx` / `FacilityPreviewCard.jsx` — aligned desktop preview cards with `CoachDetailPanel` centered modal behavior
- `HomePage.jsx` — replaced urgent pickup placeholder cards with live `player_board` + `roster_spots` data and added empty-state fallback
- `HomePage.jsx` — moved stats band above `How it works`, replaced placeholder counts with live Supabase-backed values, and changed `Counties covered` to `States covered`
- `CoachSubmitForm.jsx` / `DuplicateWarning.jsx` — added coach and travel-team duplicate warning flow and generalized duplicate warning display across facility/coach/team modes while keeping the behavior as soft warning, not DB hard block
- `HomePage.jsx` / `FeaturedCard.jsx` / `index.html` — improved homepage desktop readability by raising small desktop text, darkening faint secondary text, and adding Barlow 700 to the Google Fonts import
- `App.jsx` / `AdvertisePage.jsx` — added public `/advertise` page, linked from the footer Support section only, and kept the intake form as a page-shell v1 with storage/upload/admin routing deferred
- `AdvertisePage.jsx` / `api/notify-admin.js` / `lib/emailTemplates.js` / Supabase `advertiser_inquiries` — wired advertiser inquiry workflow end to end: submissions save to Supabase, trigger admin email notification, and show success confirmation below the submit button
- `src/utils/formSpamProtection.js` / `AdvertisePage.jsx` / `ClaimListing.jsx` / `CoachProfile.jsx` / `RosterSpots.jsx` / `CoachSubmitForm.jsx` — completed shared low-friction public-form anti-spam hardening across all targeted forms
- `src/lib/submit/geocode.js` / `src/components/CoachSubmitForm.jsx` — geocode precision hardening branch remains active and synced. Query coverage was expanded, candidate filtering/scoring was tightened, and facility ZIP fallback remains intentionally disabled for facility creation paths so wrong fallback pins do not save as production behavior. North Glynn testing still indicates a provider/data limitation where a road-address point may be returned instead of the true sports-complex point. A narrow follow-up helper fix was also committed on this branch so pending facility creation consistently uses the passed `facility` payload fields rather than stale form references. Current conclusion remains provider/data limitation for rare edge-case facilities, not a broken submit path.
- `CoachSubmitForm.jsx` — fixed coach submit `skill_level` payload mismatch by sending selected skill level as a single-item array to match existing `public.coaches.skill_level text[]` schema; issue was reproduced via live `Beginner` submission and confirmed to be submit-path/schema related, not a dropdown UI bug

---

## Per-file status

### `CoachDirectory.jsx` — BUG-AUDIT ACTIVE
`MapLegend` and `MapMarkers` extractions are complete and merged. Search-results coach click-through is fixed. Desktop search-bar / header consistency is fixed. `CoachDetailPanel` is now the alignment source of truth for desktop preview positioning. Remaining work is mostly map-state coupling, grouped marker logic, filter/search/ZIP orchestration, mobile/desktop layout branching, and overall page state flow. Future work should stay narrow and behavior-focused.

### `Facilities.jsx` — BUG-AUDIT ACTIVE
Shared ad-wrapper adoption cleanup is complete and merged. Dead `FacilityCard` cleanup is complete, along with orphaned `normalizeUrl` and `normalizeInstagramHandle`. Desktop facility preview alignment polish is fixed via `FacilityPreviewCard` centering. Remaining work is mostly ZIP/filter/map/layout orchestration. Future work should stay narrow and behavior-focused.

### `FacilityProfile.jsx` — BUG-AUDIT ACTIVE
Mobile hero/header spacing collapse is fixed and merged. The file is no longer oversized, but future work should remain narrow and behavior-focused.

### `TravelTeams.jsx` — BUG-AUDIT ACTIVE
`EmptyState` extraction is complete and merged. Radius control presentation mismatch after ZIP search is fixed. Desktop team preview alignment polish is fixed via `TeamPreviewCard` centering to match `CoachDetailPanel`. Duplicate warning coverage now exists through `CoachSubmitForm.jsx` for likely team duplicates once enough identifying detail is present. `MapLegend` remains optional later work only. Remaining work is mostly map/filter/state orchestration, so future changes should stay narrow and behavior-focused.

### `HomePage.jsx` — BUG-AUDIT ACTIVE
All four homepage leaf extractions are complete. Featured coaches and teams now load from Supabase using existing featured fields and link to the correct selected records. Urgent pickup needs now pull live `player_board` and `roster_spots` data with real empty-state fallback. The stats band now sits above `How it works` and uses live Supabase-backed counts. Homepage desktop readability polish is complete, including proper Barlow 700 loading. Remaining work should stay narrow and behavior- or presentation-focused only. Header logo sizing and footer logo follow-on remain deferred.

### `SearchResults.jsx` — BUG-AUDIT ACTIVE
Leaf result extractions are complete and merged. Mobile browser search-results behavior issue is fixed. Future work should remain narrow and behavior-focused.

### `AdminPage.jsx` — DONE
Below target. Out of the oversized-file queue.

### `CoachSubmitForm.jsx` — BUG-AUDIT ACTIVE
Previous refactor phase is complete. Submit-flow hardening now includes duplicate-warning behavior for coach and travel-team submissions, while facility duplicate flow remains intact. Duplicate handling is intentionally soft-warning only, not DB hard blocking, because shared facility contacts, shared org emails, and shared park/address data can be legitimate. Public-form anti-spam hardening is complete across all four public submit subforms using the shared low-friction pattern. Local testing confirmed Coach submit success and verified that the prior button-wiring regression was resolved. A live submit-path bug affecting coach `skill_level` was reproduced and fixed by changing the payload shape to match the existing `public.coaches.skill_level text[]` schema. The issue was not a dropdown UI/state bug; it was a backend payload/schema mismatch triggered by single-value submit behavior. Geocode precision hardening on the separate branch also re-verified that facility ZIP fallback should remain disabled for facility creation/submit paths, because wrong fallback placement is worse than a blocked submit for facility records. A narrow helper follow-up now ensures pending facility creation uses the passed facility payload fields consistently. Future work should stay narrow and focused on submit UX, validation, geocode handling, spam controls, or other quality controls only.

### `PlayerBoard.jsx` — BLOCKED
Remaining bulk is state/auth/geocode/form/map-viewport logic. No additional clearly worthwhile narrow extraction remains in the current phase. `CoachSubmitForm.jsx` player-form anti-spam coverage is complete, so any future Player Board submit-path work should first confirm whether this file still hosts an active separate public submit surface and whether it needs its own direct hardening or geocode pass.

### `RosterSpots.jsx` — BUG-AUDIT ACTIVE
Linked roster spots to existing teams / facilities were inspected and verified live without new code changes. Current launch direction is immediate publishing with 15-day auto-expiration rather than manual pending/review moderation. Claim is not required before roster spot creation. Public-form anti-spam hardening is now added to the `RosterForm` post flow and was locally tested. Future work should focus only on narrow launch hardening, spam control, or UX polish.

### `AdvertisePage.jsx` — BUG-AUDIT ACTIVE
The new public advertising page is live as a footer-linked page and the advertiser inquiry workflow now runs through a real backend path. Public submissions save into Supabase `advertiser_inquiries`, send admin email notifications through the existing notify-admin flow, and show an inline success confirmation below the submit button. Narrow anti-spam protection is now added here using the shared low-friction pattern and was locally tested successfully. Header nav placement, creative upload, and AdminPage surfacing remain deferred. Future work should stay narrow: upload wiring, spam controls, inquiry management visibility, and follow-on ad operations only.

### `ClaimListing.jsx` — BUG-AUDIT ACTIVE
Claim/update flow remains intentionally listing-linked and review-driven. Public-form anti-spam hardening is now added here using the shared low-friction pattern and was locally tested successfully. Future work should stay narrow and focused on ownership verification flow, claim routing edge cases, and related launch hardening only.

### `CoachProfile.jsx` — BUG-AUDIT ACTIVE
Public review submission remains active and review-moderated. Public-form anti-spam hardening is now added here using the shared low-friction pattern. Localhost testing confirmed review insert success and expected local `/api/notify-admin` 404 behavior during local review-submit testing, while production notify verification remains deferred until post-merge production testing. Future work should stay narrow and focused on moderation, review quality, and profile presentation.

### `src/lib/submit/geocode.js` — BUG-AUDIT ACTIVE
This branch expanded address query construction, softened locality rejection where there is strong exact-address evidence, and adjusted candidate handling so venue-like results can win earlier without letting generic road-address points short-circuit by default. Local North Glynn testing confirmed that the provider can still return a road-address point while failing to return the true sports-complex point. Current conclusion remains provider/data limitation for certain edge-case facilities, not proof of a broken submit path. Future work should stay narrow and focused on address parsing, query shaping, candidate filtering, scoring, or an eventual manual correction strategy for rare facilities that need admin-adjusted map points.

---

## Next branch queue
1. Resume bug audit from current merged `main`
2. Decide whether geocode precision hardening should merge as-is or stay open pending a manual facility pin-correction strategy
3. Investigate better address parsing / recognition for CTFP-style addresses (`Pl`, `Blvd`, `Ct`, `Rd`, `Dr`, `Hwy`, `Rte`, etc.)
4. Confirm whether standalone `PlayerBoard.jsx` still needs a separate anti-spam patch or whether all live public submit traffic now routes only through `CoachSubmitForm.jsx`
5. Homepage featured cards — consider replacing the current location + `Featured` line treatment with a cleaner homepage-specific display
6. Work on hidden spam blocking and profile accuracy scoring
7. Broader sitewide font/color harmonization remains deferred follow-on work beyond the homepage readability pass and new Ads page baseline

---

## Bug audit backlog
- Homepage featured cards — consider replacing the current location + `Featured` line treatment with a cleaner homepage-specific display
- Evaluate future geo-aware / IP-aware homepage featured listings with safe fallback behavior
- Evaluate future geo-aware / IP-aware homepage urgent-needs localization with safe fallback behavior
- Header logo sizing and optional footer logo placement remain deferred follow-on polish after homepage desktop readability calibration
- Work on hidden spam blocking and profile accuracy scoring
- Add tournament pages with state-sorted links to known organizers; org-site links only for now, not calendars
- Determine whether teams should auto-expire after about 14 months if not updated, with reminder email about 30 days before expiration and a season-aging update prompt
- Investigate better address parsing / recognition for CTFP-style addresses (`Pl`, `Blvd`, `Ct`, `Rd`, `Dr`, `Hwy`, `Rte`, etc.)
- Separate known geocode/address-confidence issue: some edge-case facilities can still resolve to road-address points rather than the true complex/field point, even after query-shaping improvements
- On AdminPage, include facility / team / coach addresses and other form-driven fields that need update visibility
- Consider a future follow-on polish for earlier soft team duplicate warnings on exact normalized name before age/city/state are filled, only if it can be done without creating noisy false positives
- Broader sitewide font/color harmonization remains deferred follow-on work beyond the homepage readability pass and new Ads page baseline
- Advertiser inquiry creative upload wiring remains deferred until a narrow storage/policy path is chosen
- Advertiser inquiry AdminPage surfacing or conversion into managed `advertisers` records remains deferred

---

## Rules
- One branch, one file, one type of change
- Inspect before creating any branch and confirm the target is live-rendered
- List all dependencies before writing code
- No giant rewrites
- No scope creep mid-branch
- If a file is blocked, state exactly why
- If deferred, state exactly why
- Prefer the narrowest safe extraction only when it materially improves the edit surface
- Bug audit work should focus on actual behavior, regressions, edge cases, validation gaps, geocode/search failure handling, mobile layout issues, and Supabase/data-state problems — not forced line-count reduction

## Inspection checklist — required before every extraction
1. Find the candidate component/function
2. Confirm it is actually rendered in the live UI
3. Identify the exact line range
4. List all dependencies (state, handlers, refs, helpers, imports)
5. Only then open a branch and write code

## Execution reminders
- Provide full paste-ready file contents for any new component file
- Provide the exact import line and clearly state what block to remove
- Check sibling files in the target folder for naming and prop-pattern consistency
- Confirm repo path and device before creating any branch

## Thread closeout checklist
- [x] Last completed item recorded in completed items
- [x] Affected per-file status block updated
- [x] Next branch queue updated
- [x] Repo state confirmed: `main` / clean / synced
- [ ] `NOTES.md` rewritten (not appended) and committed

---

## Bug audit
Active phase. Start from current merged `main`. Prioritize real behavior issues, fragile UX flows, edge cases, validation gaps, geocode/search failure handling, mobile layout issues, and Supabase/data-state problems.