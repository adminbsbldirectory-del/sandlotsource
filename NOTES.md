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
- `HomePage.jsx` — replaced homepage urgent pickup placeholder cards with live `player_board` + `roster_spots` data and added empty-state fallback when no active urgent items exist
- `HomePage.jsx` — relocated homepage stats band above `How it works`, replaced placeholder counts with live Supabase-backed values, and changed `Counties covered` to `States covered`
- `CoachSubmitForm.jsx` / `DuplicateWarning.jsx` — added coach and travel-team duplicate warning flow to submit UI, generalized duplicate warning display across facility/coach/team modes, and kept the behavior as review-and-continue soft warnings rather than DB hard blocking
- `HomePage.jsx` / `FeaturedCard.jsx` / `index.html` — improved homepage desktop readability by raising undersized desktop text, darkening faint secondary text, and adding Barlow 700 to the Google Fonts import; kept scope limited to readability polish only, with broader font/color harmonization and logo/footer follow-on deferred
- `App.jsx` / `AdvertisePage.jsx` — added new public `/advertise` page, linked it from the footer Support section only, used forward-looking readable typography for the new page, and kept the intake form as a page-shell v1 with user-facing confirmation only; storage, upload wiring, and admin/email routing remain deferred
- `AdvertisePage.jsx` / `api/notify-admin.js` / `lib/emailTemplates.js` / Supabase `advertiser_inquiries` — advertiser inquiry workflow is now live end-to-end: public form submissions save to Supabase, trigger admin email notifications through the existing webhook/notify path, creative upload remains deferred, and the success confirmation was moved below the submit button so users do not need to scroll back up to see it
- `src/utils/formSpamProtection.js` / `AdvertisePage.jsx` / `ClaimListing.jsx` / `CoachProfile.jsx` / `RosterSpots.jsx` / `CoachSubmitForm.jsx` — public-form anti-spam hardening is complete for this branch using a shared low-friction pattern (hidden honeypot + minimum submit-time check + silent success for flagged spam). `AdvertisePage`, `ClaimListing`, `CoachProfile`, `RosterSpots`, and all four `CoachSubmitForm.jsx` public subforms (`CoachForm`, `TeamForm`, `PlayerForm`, `FacilityForm`) are patched and merged. Follow-up testing confirmed the anti-spam/button wiring is working; remaining Team / Player address-submission failures are part of the separate known geocode/address-confidence issue, not this branch.

---

## Per-file status

### `CoachDirectory.jsx` — BUG-AUDIT ACTIVE
`MapLegend` and `MapMarkers` extractions are complete and merged. Search-results coach click-through bug is fixed. Desktop search-bar / header consistency issue is fixed and merged. `CoachDetailPanel` now serves as the alignment source of truth for desktop preview positioning. Remaining bulk is primarily map-state coupling, grouped marker logic, filter/search/ZIP orchestration, mobile/desktop layout branching, and main page state flow. Future work here should stay in bug-audit / behavior-fix mode only.

### `Facilities.jsx` — BUG-AUDIT ACTIVE
Shared ad-wrapper adoption cleanup is complete and merged. Dead `FacilityCard` cleanup is complete and merged, along with orphaned `normalizeUrl` and `normalizeInstagramHandle`. Desktop facility preview alignment polish is fixed via `FacilityPreviewCard` centering update. Remaining bulk is primarily ZIP/filter/map/layout orchestration. Future work should stay narrow and behavior-focused only.

### `FacilityProfile.jsx` — BUG-AUDIT ACTIVE
Mobile hero/header spacing collapse bug is fixed and merged. Current file is below the oversized-file concern level, but future work here should stay narrow and behavior-focused only.

### `TravelTeams.jsx` — BUG-AUDIT ACTIVE
`EmptyState` extraction is complete and merged. Radius control presentation mismatch after ZIP search is fixed and merged. Desktop team preview alignment polish is fixed via `TeamPreviewCard` centering update matched to `CoachDetailPanel`. Duplicate warning coverage now exists in the submit flow through `CoachSubmitForm.jsx` for likely team duplicates once enough identifying context is present. `MapLegend` remains later optional work only. Remaining bulk is mostly map/filter/state orchestration, so future work should stay narrow and behavior-focused.

### `HomePage.jsx` — BUG-AUDIT ACTIVE
All four homepage leaf extractions are complete (`FeaturedCard`, `HomePageAdBand`, `HomePageSectionHeader`, `HomePageBand`). Homepage featured coaches and teams no longer use hard-coded filler data; they now load from Supabase using existing featured fields and link to the correct selected coach/team records. Homepage urgent pickup needs no longer use placeholder cards; they now pull live `player_board` and `roster_spots` records with a real empty-state fallback when no active urgent items exist. Homepage stats band now sits above `How it works` and uses live Supabase-backed values for coaches, travel teams, and states covered. Homepage desktop readability polish is now complete for key homepage sections and featured cards, including a real loaded Barlow 700 weight. Remaining homepage work should stay narrow and behavior- or presentation-focused only. Header logo sizing and any footer-logo follow-on remain deferred.

### `SearchResults.jsx` — BUG-AUDIT ACTIVE
Leaf result extractions are complete and merged. Mobile browser search-results behavior issue is fixed and merged. Future work here should remain narrow and behavior-focused only.

### `AdminPage.jsx` — DONE
Below target. Out of oversized-file queue.

### `CoachSubmitForm.jsx` — BUG-AUDIT ACTIVE
Previous refactor phase is complete. Current submit-flow hardening includes duplicate-warning behavior for coach and travel-team submissions, while facility duplicate flow remains intact. Duplicate handling is intentionally soft-warning only, not DB hard blocking, because shared facility contacts, shared org emails, and shared park/address data can be legitimate. Public-form anti-spam hardening is now complete across all four public submit subforms (`CoachForm`, `TeamForm`, `PlayerForm`, `FacilityForm`) using the shared low-friction pattern (hidden honeypot + minimum submit-time check + silent success for flagged spam). Local testing confirmed Coach submit success and verified that the prior button-wiring regression was resolved. Remaining Team / Player address submission blocking is currently treated as part of the separate known geocode/address-confidence issue and should be handled in its own thread. Future work here should stay narrow and focused on submit UX, validation, geocode handling, spam controls, or other quality controls only.

### `PlayerBoard.jsx` — BLOCKED
Remaining bulk is state/auth/geocode/form/map-viewport logic. No additional clearly worthwhile narrow extraction remains in the current phase. `CoachSubmitForm.jsx` player-form anti-spam coverage is now complete, so any further Player Board submit-path work should focus only on confirming whether this file still hosts an active separate public submit surface and, if so, whether it needs its own independent hardening or geocode handling pass.

### `RosterSpots.jsx` — BUG-AUDIT ACTIVE
Linked roster spots to existing teams / facilities were inspected and verified live without new code changes. Current launch direction is that roster spots may publish immediately and auto-expire after 15 days, rather than requiring manual pending/review moderation. Claim should not be required before roster spot creation. Public-form anti-spam hardening is now added to the `RosterForm` post flow and was locally tested. Future work should focus only on narrow launch-hardening, spam control, or UX polish if needed.

### `AdvertisePage.jsx` — BUG-AUDIT ACTIVE
New public advertising page is live as a footer-linked page and the advertiser inquiry workflow is now wired to a real backend path. Public submissions save into Supabase `advertiser_inquiries`, send admin email notifications through the existing notify-admin webhook flow, and show an inline success confirmation below the submit button after submission. Narrow public-form anti-spam protection is now added here using the shared low-friction pattern (hidden honeypot + minimum submit-time check) and was locally tested successfully. Header nav placement remains intentionally deferred, creative upload remains deferred, and AdminPage surfacing is still out of scope for now. Future work here should stay narrow: upload wiring, spam controls, inquiry management visibility, and follow-on ad operations only.

### `ClaimListing.jsx` — BUG-AUDIT ACTIVE
Claim/update flow remains intentionally listing-linked and review-driven. Public-form anti-spam hardening is now added here using the shared low-friction pattern (hidden honeypot + minimum submit-time check) and was locally tested successfully. Future work should stay narrow and focused on ownership verification flow, claim routing edge cases, and related launch-hardening only.

### `CoachProfile.jsx` — BUG-AUDIT ACTIVE
Public review submission remains active and review-moderated. Public-form anti-spam hardening is now added here using the shared low-friction pattern (hidden honeypot + minimum submit-time check). Localhost testing confirmed review insert success and expected local `/api/notify-admin` 404 behavior during local review-submit testing, while production notify behavior remains deferred to production verification after merge. Future work should stay narrow and focused on moderation, review quality, and profile presentation only.

---

## Next branch queue
1. Resume bug audit from current merged `main`
2. Investigate better address parsing / recognition for CTFP-style addresses (`Pl`, `Blvd`, `Ct`, `Rd`, `Dr`, `Hwy`, `Rte`, etc.)
3. Confirm whether standalone `PlayerBoard.jsx` still needs a separate anti-spam patch or whether all live public submit traffic now routes only through `CoachSubmitForm.jsx`
4. Homepage featured cards: consider replacing the current location + `Featured` line treatment with a cleaner homepage-specific display
5. Work on hidden spam blocking and profile accuracy scoring
6. Broader sitewide font/color harmonization remains deferred follow-on work beyond the homepage readability pass and new Ads page baseline

---

## Bug audit backlog
- Homepage featured cards: consider replacing the current location + `Featured` line treatment with a cleaner homepage-specific display
- Evaluate future geo-aware / IP-aware homepage featured listings with safe fallback behavior
- Evaluate future geo-aware / IP-aware homepage urgent-needs localization with safe fallback behavior
- Header logo sizing and optional footer logo placement remain deferred follow-on polish items after homepage desktop readability calibration
- Work on hidden spam blocking and profile accuracy scoring
- Add tournament pages with state-sorted links to known organizers; org-site links only for now, not calendars
- Determine whether teams should auto-expire after ~14 months if not updated, with reminder email ~30 days before expiration and season-aging update prompt
- Investigate better address parsing / recognition for CTFP-style addresses (`Pl`, `Blvd`, `Ct`, `Rd`, `Dr`, `Hwy`, `Rte`, etc.)
- Separate known geocode/address-confidence issue: Team submit and Player Needed submit can currently block on confident street-address placement; anti-spam branch confirmed this is not caused by the honeypot/timing work
- On admin page, include facility / team / coach addresses and other form-driven fields that need update visibility
- Consider a future follow-on polish for earlier soft team duplicate warnings on exact normalized name before age/city/state are filled, only if it can be done without creating noisy false positives
- Broader sitewide font/color harmonization remains deferred follow-on work beyond the homepage readability pass and new Ads page baseline
- Advertiser inquiry creative upload wiring remains deferred until a narrow storage/policy path is chosen
- Advertiser inquiry AdminPage surfacing or conversion into managed `advertisers` records remains deferred
- Coach submit flow: malformed behavior when selecting `Beginner` in the coach level section

---

## Rules
- One branch, one file, one type of change
- Inspect before creating any branch — confirm the target is live-rendered
- List all dependencies before writing code
- No giant rewrites. No scope creep mid-branch.
- If a file is blocked, state exactly why. If deferred, state exactly why.
- Prefer the narrowest safe extraction only when it materially improves the edit surface
- Bug audit work should focus on actual behavior, regressions, edge cases, validation gaps, geocode/search failure handling, mobile layout issues, and Supabase/data-state problems — not forced line-count reduction

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
- [ ] Repo state confirmed: `main` / clean / synced
- [ ] NOTES.md rewritten (not appended) and committed

---

## Bug audit
Active phase. Start from current merged `main`. Prioritize real behavior issues, fragile UX flows, edge cases, validation gaps, geocode/search failure handling, mobile layout issues, and Supabase/data-state problems.