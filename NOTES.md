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
Bug audit / geocoding hardening complete. Google Geocoding API is now the sole geocoding provider. Form submission speed cleanup and duplicate email row fix remain as next targets.

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
(unchanged — see previous NOTES.md)

## Completed cleanup items
(all previous items retained, plus the following added)

- **Geocoding hardening — Sessions 1-15** — Full geocoding and mapping audit completed. Fixed: null lat/lng proximity filter pass-through in CoachDirectory, Facilities, TravelTeams, SearchResults; approval email now shows lat/lng and geocode_source; null coordinate guard added to email approval path; Nominatim rate limit delay added then later removed; preResolved wired into CoachForm and TeamForm; missing street suffix variants added to buildStreetVariants; geocode_review soft fallback added to CoachForm, TeamForm, and FacilityForm so unresolvable addresses enter Supabase for manual review instead of hard blocking; isCompatibleCandidate zip mismatch threshold loosened from 5 to 10 miles; admin email 📍 prefix and coordinate rows working for geocode_review submissions; zip centroid precision improved via Nominatim zip query; approval_status check constraint updated in Supabase to include geocode_review for coaches, facilities, and travel_teams; geocode_source column added to all three tables; AdminPage zip field key corrected from zip_code to zip for coaches table; truncation and null byte corruption fixed in CoachDirectory, CoachSubmitForm, TravelTeams, Facilities, AdminPage, and geocode.js.
- **Session 16 — Google Geocoding API swap** — Replaced Nominatim with Google Geocoding API in api/geocode-address.js. Response shape mapped to match existing geocode.js field expectations exactly. GOOGLE_GEOCODING_API_KEY environment variable added to Vercel. Geocoding API enabled in Google Cloud Console. Addresses not in OSM data (Ballard Park, Mallery St Ext) now resolve correctly with address-level precision.
- **Session 17 — Remove sleep delays and skipDelay logic** — Removed sleep helper, all await sleep(1100) calls, skipDelay parameter, firstQuery flag, and associated rate-limiting comments from geocode.js. consecutiveEmpty early exit threshold reverted to clean constant 2. No other logic changed.

---

## Per-file status

### `api/geocode-address.js` — UPDATED
Nominatim proxy replaced with Google Geocoding API. Accepts same ?q= parameter. Returns same flat array shape that geocode.js expects. All Nominatim-specific headers and rate limiting removed. GOOGLE_GEOCODING_API_KEY read from process.env.

### `src/lib/submit/geocode.js` — BUG-AUDIT ACTIVE
Geocoding hardening complete through Sessions 1-17. sleep helper and all delay logic removed. skipDelay and firstQuery removed. buildStreetVariants extended with 14 suffix pairs. isCompatibleCandidate zip mismatch threshold at 10 miles. consecutiveEmpty early exit at threshold 2 preserved. geocode_review fallback path preserved in finalizeListingLocation. geocodeZip now uses Nominatim zip query as primary with zippopotam.us fallback — this secondary path should be evaluated for removal or replacement with a Google zip centroid query in a future session. Remaining known issue: submit-time loop still runs multiple variants before early exit, causing 30-35 second form submissions. Root cause is that Google returns results for all variants so consecutiveEmpty never reaches 2. A future session should simplify the query approach for Google — single well-constructed query rather than the multi-variant Nominatim pattern.

### `src/components/CoachSubmitForm.jsx` — BUG-AUDIT ACTIVE
geocode_review soft fallback added to CoachForm, TeamForm, and FacilityForm. preResolved wired into CoachForm and TeamForm. All three forms now share identical soft-fallback behavior. Remaining work: form submission speed depends on geocode.js loop simplification.

### `api/notify-admin.js` — BUG-AUDIT ACTIVE
📍 GEOCODE REVIEW NEEDED subject prefix working. needsGeocodeReview uses two synchronous conditions: approval_status === 'geocode_review' OR geocode_source === 'zip', both gated on address != null. injectCoordRows runs unconditionally using lastIndexOf to target correct table. Known cosmetic issue: coordinate rows appear twice in email because template already includes them from Session 3 and injectCoordRows adds a second set. Fix deferred.

### `lib/emailTemplates.js` — BUG-AUDIT ACTIVE
Latitude, Longitude, and Geocode Source rows added to coachEmail, teamEmail, and facilityEmail. Duplicate rows appearing due to interaction with injectCoordRows in notify-admin.js. Fix deferred.

### `api/approve.js` — BUG-AUDIT ACTIVE
Null coordinate guard added. Records with null lat and lng are blocked from one-click email approval and redirected to warning page. Reject path and non-geo tables unaffected.

### `src/components/CoachDirectory.jsx` — BUG-AUDIT ACTIVE
Null lat/lng proximity filter fixed. Records without coordinates now return false in distance filter when geo search is active.

### `src/components/Facilities.jsx` — BUG-AUDIT ACTIVE
Null lat/lng proximity filter fixed. Same pattern as CoachDirectory.

### `src/components/TravelTeams.jsx` — BUG-AUDIT ACTIVE
Null lat/lng proximity filter fixed. Same pattern as CoachDirectory.

### `src/components/SearchResults.jsx` — BUG-AUDIT ACTIVE
Null lat/lng proximity filter fixed in matchesRadius. Local distanceMiles and geocodeZip copies still present — deferred cleanup.

### `src/components/AdminPage.jsx` — BUG-AUDIT ACTIVE
zip field key corrected from zip_code to zip in COACH_FIELDS. Truncation fixed — file was missing closing tags and entire body block. Editable address and zip_code columns added for Coaches, Travel Teams, and Facilities. lat and lng not yet editable through admin UI — manual Supabase edits required for geocode_review coordinate corrections.

### All other per-file statuses — unchanged from previous NOTES.md

---

## Supabase schema changes made this session
- `coaches`, `facilities`, `travel_teams` — added `geocode_source text` column to all three
- `coaches`, `facilities`, `travel_teams` — updated `approval_status` check constraint to include `'geocode_review'`
- Supabase webhooks for notify-admin-coaches, notify-admin-teams, notify-admin-facilities — edited and re-saved to force schema cache refresh and include new columns in webhook payload

---

## Next branch queue
1. Fix duplicate coordinate rows in admin approval email — remove Session 3 rows from emailTemplates.js or make injectCoordRows truly idempotent
2. Simplify geocode.js query loop for Google — single well-constructed query instead of multi-variant Nominatim pattern to reduce form submission time from 35 seconds to under 5
3. Add lat and lng as editable fields in AdminPage for Coaches, Facilities, and Travel Teams so geocode_review records can be corrected without going into Supabase directly
4. Build server-side re-geocode endpoint for admin use on legacy and seeded records
5. Remove duplicate distanceMiles and geocodeZip definitions from SearchResults.jsx — import from canonical geocode.js
6. Evaluate removing or replacing zippopotam.us fallback in geocodeZip with Google zip centroid query
7. Confirm whether standalone PlayerBoard.jsx still needs a separate anti-spam patch
8. Resume broader bug audit backlog

---

## Bug audit backlog
- Form submission speed: 30-35 seconds due to multi-variant query loop designed for Nominatim — needs redesign for Google single-query pattern
- Duplicate coordinate rows in admin email — cosmetic but confusing
- lat/lng not editable in admin UI — requires Supabase direct edit for geocode_review corrections
- Legacy and seeded records may have null, stale, or zip-centroid coordinates — no backfill tool exists yet
- geocode_review records: TeamForm and FacilityForm now use soft fallback but notify-admin subject prefix detection relies on geocode_source field being present in webhook payload — verify this works for team and facility submissions
- SearchResults.jsx has local copies of distanceMiles and geocodeZip — deferred cleanup
- Homepage featured cards — consider replacing location + Featured line treatment
- Evaluate geo-aware homepage featured listings and urgent-needs localization
- Work on hidden spam blocking and profile accuracy scoring
- Add tournament pages with state-sorted links to known organizers
- Determine whether teams should auto-expire after about 14 months
- Broader page-by-page font/color consistency remains deferred
- Advertiser inquiry creative upload wiring remains deferred
- Advertiser inquiry AdminPage surfacing remains deferred

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
Active phase. Start from current merged `main`. Google Geocoding API is now live. Prioritize form speed fix, duplicate email rows, and lat/lng admin editability before resuming broader bug audit backlog.