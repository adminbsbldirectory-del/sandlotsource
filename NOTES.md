# Sandlot Source — Session Handoff Notes

## What this is
Running context for Sandlot Source development. Paste at the start of a new Cowork or Claude thread.

---

## Current repo state
- Branch: main
- All changes committed and live on sandlotsource.com
- Vercel confirmed deployed

---

## What has been completed (all merged to main)

### Geocoding hardening (Sessions 1-17)
- Null lat/lng records no longer pass proximity filters in CoachDirectory, Facilities, TravelTeams, SearchResults
- Approval email shows Latitude, Longitude, and Geocode Source before admin clicks Approve
- Null coordinate guard in api/approve.js blocks one-click email approval of null-coordinate records
- preResolved wired into CoachForm and TeamForm to avoid double geocoding
- geocode_review soft fallback added to CoachForm, TeamForm, and FacilityForm — unresolvable addresses enter Supabase with approval_status: geocode_review and geocode_source: zip
- Admin email gets 📍 GEOCODE REVIEW NEEDED subject prefix for geocode_review submissions
- approval_status check constraint updated in Supabase to include geocode_review for coaches, facilities, travel_teams
- geocode_source column added to coaches, facilities, travel_teams tables in Supabase
- isCompatibleCandidate zip mismatch threshold loosened from 5 to 10 miles
- Nominatim replaced with Google Geocoding API in api/geocode-address.js
- GOOGLE_GEOCODING_API_KEY added to Vercel environment variables
- All sleep delays and skipDelay logic removed from geocode.js — Google has no rate limit requirement
- consecutiveEmpty early exit preserved at threshold 2

### UI and data fixes (current session)
- Homepage age group dropdown: added 7U, 9U, 11U — full order now 7U through 18U
- /submit facility-type dropdown: added Sports Complex (between Training Facility and Travel Team Facility)
- Facilities page map: Sports Complex added to legend (desktop and mobile), orange pin (#EA580C), distinct from all existing colors
- CoachDirectory: Facility column removed from coach result rows and header. Column order is now Sport, Team, Age, Tryouts, View. Age falls back to "All ages" if no age_groups set. gridTemplateColumns updated from 5 to 4 columns.
- TravelTeams directory: column header renamed from AGE / LEVEL to AGE. Column order is now Sport, Team, Age, Facility, Tryouts, View. TeamDesktopRow.jsx updated to render age_group before facility_name.
- CoachDirectory default map: both MapContainer instances updated from [33.5, -84.2] zoom 8 (Atlanta) to [39.5, -98.35] zoom 4 (continental US)
- Facilities default map: both MapContainer instances updated from [33.5, -84.4] zoom 7 to [39.5, -98.35] zoom 4
- TravelTeams default map: was already correct, no change needed
- Players Needed & Available default map: was already correct in PlayerBoardBrowseContent.jsx, no change needed
- Admin email coord rows: removed Latitude, Longitude, Geocode Source from coachEmail, teamEmail, and facilityEmail in lib/emailTemplates.js — injectCoordRows in notify-admin.js is now the sole injector

---

## What still needs to be done

### Priority 1 — Form submission speed (30-35 seconds, must fix)
**Problem:** geocode.js still uses a multi-variant query loop designed for Nominatim. Google handles abbreviations natively. The loop runs all variants before completing because consecutiveEmpty never fires — Google returns a result for every variant.
**Fix needed:** Replace the entire variant loop with a single query: `{address}, {city}, {state} {zip}`. buildStreetVariants is no longer needed and can be removed.
**File:** src/lib/submit/geocode.js

### Priority 2 — lat/lng not editable in admin UI
**Problem:** When a record comes in with geocode_review status, admin must correct coordinates in Supabase directly. lat and lng are not editable in the admin panel.
**Fix needed:** Add lat and lng as editable fields in AdminPage for Coaches, Facilities, and Travel Teams, following the same pattern as address and zip_code.
**File:** src/components/AdminPage.jsx

### Priority 3 — Admin email coord rows still duplicating (deferred, cosmetic)
**Problem:** Lat/Lng/Geocode Source still appears twice in admin approval emails. The emailTemplates.js rows are confirmed removed. The bug is in injectCoordRows — its detection check (`html.includes('>Latitude<')`) is not matching correctly, so it injects a second set regardless.
**Fix needed:** Improve the detection logic in injectCoordRows so it reliably identifies existing coord rows before injecting. Admin-only, nothing breaks, low urgency.
**File:** api/notify-admin.js

### Priority 4 — Homepage search result close behavior drops ZIP context
**Problem:** When a user performs a ZIP-based search on the homepage and selects a result card, closing that card resets to a fresh/empty state instead of returning to the prior result set.
**Fix needed:** Preserve the ZIP result set in state when a card is opened. Closing should only clear the selected card, not the results array.
**File:** src/components/Homepage.jsx

### Priority 5 — Ad slots loading slowly (performance regression)
**Problem:** Ad slots appear to be loading slowly across pages.
**Fix needed:** Inspect ad fetch and render behavior. Look for blocking fetches, missing lazy/deferred loading, waterfalling ad calls that should be parallel, or a recently added synchronous dependency in the ad render path.
**Files:** Ad slot component(s) and shared fetch/render utilities.

### Priority 6 — Deferred cleanup (low priority)
- SearchResults.jsx has local copies of distanceMiles and geocodeZip that should import from canonical geocode.js
- zippopotam.us fallback in geocodeZip may no longer be needed now that Google is primary — evaluate removing
- buildStreetVariants removable once geocode.js query loop is simplified (see Priority 1)
- Server-side re-geocode endpoint for admin use on legacy and seeded records with bad coordinates

---

## Key files reference

| File | Role |
|---|---|
| api/geocode-address.js | Google Geocoding API proxy |
| src/lib/submit/geocode.js | Core geocoding logic — needs query loop simplification |
| src/components/CoachSubmitForm.jsx | Coach, Team, and Facility submit forms |
| api/notify-admin.js | Admin email notification and coord row injection |
| lib/emailTemplates.js | Email HTML templates |
| api/approve.js | Email approval handler — null coordinate guard |
| src/components/AdminPage.jsx | Admin panel — needs lat/lng editable fields |
| src/components/Homepage.jsx | Homepage search bar and result state |
| src/components/CoachDirectory.jsx | Coach directory, result rows, map |
| src/components/coaches/CoachRow.jsx | Coach result row layout |
| src/components/Facilities.jsx | Facilities directory, map, legend |
| src/components/TravelTeams.jsx | Teams directory, map, column headers |
| src/components/teams/TeamDesktopRow.jsx | Team result row layout |
| src/components/PlayerBoardBrowseContent.jsx | Players Needed & Available map and listings |

---

## Google Geocoding API details
- Provider: Google Geocoding API
- Endpoint: https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={key}
- Environment variable: GOOGLE_GEOCODING_API_KEY (set in Vercel — Production, Preview, Development)
- Google Cloud project: Sandlot Source
- Restriction: Geocoding API only
- Free tier: $200/month credit (~40,000 calls) — current volume well under limit
- No rate limiting required — all delays removed

---

## geocode_review workflow
1. User submits with an address Google cannot resolve
2. geocodeZip fires as fallback using submitted zip
3. Record saves to Supabase with approval_status: geocode_review and geocode_source: zip
4. Submitter sees: "Your listing was received but we could not verify your exact location automatically. Our team will review and confirm it before it goes live."
5. Admin receives email with 📍 GEOCODE REVIEW NEEDED in subject line
6. Admin finds record in /admin filtered by Geocode Review status
7. Admin looks up correct coordinates in Google Maps, edits lat/lng directly in Supabase (or admin panel once Priority 2 is complete), then changes approval_status to approved
8. The null coordinate guard in approve.js does NOT block geocode_review records — they have zip centroid coordinates, not null — so one-click email approval will go through. Admin should correct coordinates before clicking Approve.

---

## Branch strategy
- Always branch from main
- One session per branch
- Push to branch, create PR, test on Vercel preview URL before merging
- After merge: git checkout main && git pull origin main && git branch -d {branch-name}
