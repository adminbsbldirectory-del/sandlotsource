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

### UI and data fixes
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

### Geocoding speed, admin edits, email dedup
- Form submission speed: replaced multi-variant Nominatim loop in geocode.js with a single Google query — `{address}, {city}, {state} {zip}`. buildStreetVariants removed. Submission time dropped from 30-35 seconds to under 3 seconds.
- lat/lng editable in admin panel: added Lat and Lng as editable numeric fields in AdminPage.jsx for Coaches, Facilities, and Travel Teams. Fields show inline, save on blur, and persist on reload.
- Admin email coord row duplication fixed: injectCoordRows detection logic in notify-admin.js corrected — Latitude, Longitude, and Geocode Source now appear exactly once in every admin approval email.

### Search close / back navigation
- When a user searches from homepage and clicks a result card, closing the card now returns to /search?... via navigate(-1) instead of dropping to a bare directory page.
- Fixed in CoachDirectory.jsx, TravelTeams.jsx, and FacilityProfile.jsx.

### Ad slot fixes
- House ads (no target_url set) now wrap in <a href="/advertise"> instead of rendering as unclickable images — fixed in AdSlot.jsx.
- All non-homepage house ad records in Supabase updated: target_url changed from page-self-referential URLs to https://www.sandlotsource.com/advertise (26 records updated via SQL).
- Ad slot multiple fetch waves investigated: root cause is DevTools narrowing viewport below 768px breakpoint (triggers isMobile toggle) and normal SPA navigation remounting components. Not a production bug.

---

## What still needs to be done

### Priority 1 — SEO location landing pages for Teams (next up)
**Objective:** Add indexable city/state entry point routes for search engines and shared links, without replacing the ZIP-first browse experience.
**Scope:** Teams only for v1. Route pattern: `/teams/:state/:city` (e.g. `/teams/fl/jacksonville`, `/teams/ga/atlanta`)
**Requirements:**
- Do NOT replace or weaken ZIP-first browse/search experience
- Read state and city from URL params, normalize as needed
- Initialize teams results with that location context (prefer direct city/state filtering over ZIP translation)
- Existing filters still work after landing
- Reuse current TravelTeams UI and query logic as much as possible — no logic duplication
- Dynamic page title: `Youth Baseball Teams in Jacksonville, FL | Sandlot Source`
- H1: `Youth Baseball Teams in Jacksonville, Florida`
- Short intro text block
- Helpful empty state if no results
- Clean enough pattern to reuse later for coaches and facilities
**Do not:** Add coaches/facilities routes yet, add age-group routes, add sitemap work, rework homepage search, introduce unrelated refactors
**Files likely involved:** src/App.jsx (new route), src/components/TravelTeams.jsx or new wrapper component

### Priority 2 — AdSlot module-level cache (low priority)
**Problem:** Every SPA navigation remounts AdSlot components, triggering redundant Supabase fetches. DevTools viewport changes can also cause isMobile toggling and double-fetching.
**Fix:** Add a module-level Map cache in AdSlot.jsx — check cache before fetching, store result after fetch. Remounts within a session resolve instantly from cache.
**File:** src/components/AdSlot.jsx

### Priority 3 — Deferred cleanup (low priority)
- SearchResults.jsx has local copies of distanceMiles and geocodeZip that should import from canonical geocode.js
- zippopotam.us fallback in geocodeZip may no longer be needed now that Google is primary — evaluate removing
- Server-side re-geocode endpoint for admin use on legacy and seeded records with bad coordinates

---

## Key files reference

| File | Role |
|---|---|
| api/geocode-address.js | Google Geocoding API proxy |
| src/lib/submit/geocode.js | Core geocoding logic — simplified to single Google query |
| src/components/CoachSubmitForm.jsx | Coach, Team, and Facility submit forms |
| api/notify-admin.js | Admin email notification and coord row injection |
| lib/emailTemplates.js | Email HTML templates |
| api/approve.js | Email approval handler — null coordinate guard |
| src/components/AdminPage.jsx | Admin panel — lat/lng now editable |
| src/components/HomePage.jsx | Homepage search bar and result state |
| src/components/CoachDirectory.jsx | Coach directory, result rows, map |
| src/components/coaches/CoachRow.jsx | Coach result row layout |
| src/components/Facilities.jsx | Facilities directory, map, legend |
| src/components/TravelTeams.jsx | Teams directory, map, column headers |
| src/components/teams/TeamDesktopRow.jsx | Team result row layout |
| src/components/PlayerBoardBrowseContent.jsx | Players Needed & Available map and listings |
| src/components/AdSlot.jsx | Ad slot fetch and render — house ads now link to /advertise |
| src/components/SearchResults.jsx | Homepage search results page |

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
7. Admin corrects lat/lng using the editable Lat and Lng fields in the admin panel, then changes approval_status to approved
8. The null coordinate guard in approve.js does NOT block geocode_review records — they have zip centroid coordinates, not null — so one-click email approval will go through. Admin should correct coordinates before clicking Approve.

---

## Branch strategy
- Always branch from main
- One session per branch
- Push to branch, create PR, test on Vercel preview URL before merging
- After merge: git checkout main && git pull origin main && git branch -d {branch-name}

## Workflow notes
- Working repo: C:\Users\sshap\Documents\GitHub\sandlotsource
- Local workflow only: VS Code + terminal + GitHub Desktop
- Do not use GitHub browser for code edits except tiny text-only changes
- Production deploys from main
- Always test locally before merge
- Always verify Vercel production after merge
- If HEAD.lock error on git checkout: del .git\HEAD.lock then retry
