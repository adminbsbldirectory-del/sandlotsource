# Sandlot Source — Session Handoff Notes

## What this is
Running context for Sandlot Source development. Paste at the start of a new Cowork or Claude thread.

---

## Current repo state
- Branch: main
- All recent UI polish changes are merged to main
- Live site is updated on sandlotsource.com
- Vercel production deploy confirmed
- Local repo should be synced to main

---

## Working repo / workflow
- Working repo: `C:\GitHub\sandlotsource`
- Do not use: `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Local workflow only: VS Code + terminal + GitHub Desktop
- Do not use GitHub browser as the primary way to edit site code
- GitHub browser is only for tiny low-risk text edits, README/content-only changes, or very small one-line changes that do not need local testing
- Use local workflow for React/JSX changes, multi-file changes, imports/exports, form logic, ZIP/geocoding/map behavior, and anything that should be tested before going live
- Production deploys from main
- Feature branches create preview deployments
- Always confirm branch before editing
- Always test locally before merge
- Always verify Vercel production after merge

### Standard workflow
1. Open `C:\GitHub\sandlotsource` in VS Code
2. Create or use a feature branch for meaningful changes
3. Make changes locally in VS Code
4. Test on localhost with `npm run dev`
5. Check `git status`
6. Commit changes
7. Push branch
8. Open Pull Request into main
9. Merge PR
10. Wait for Vercel production deploy
11. Test sandlotsource.com live

### Tool roles
- VS Code = code editing
- Terminal = source of truth for git status / branch / local testing
- GitHub Desktop = visual check for changes, history, branch switching, pushing
- Vercel = preview vs production deployment check

### Safe branch setup
- `main` = production-aligned branch
- `refactor/submit-form-modular` = keep for now, do not delete yet

---

## What has been completed (all merged to main)

### Geocoding hardening (Sessions 1–17)
- Null lat/lng records no longer pass proximity filters in CoachDirectory, Facilities, TravelTeams, SearchResults
- Approval email shows Latitude, Longitude, and Geocode Source before admin clicks Approve
- Null coordinate guard in `api/approve.js` blocks one-click email approval of null-coordinate records
- `preResolved` wired into CoachForm and TeamForm to avoid double geocoding
- `geocode_review` soft fallback added to CoachForm, TeamForm, and FacilityForm — unresolvable addresses enter Supabase with `approval_status: geocode_review` and `geocode_source: zip`
- Admin email gets 📍 GEOCODE REVIEW NEEDED subject prefix for geocode_review submissions
- `approval_status` check constraint updated in Supabase to include `geocode_review` for coaches, facilities, `travel_teams`
- `geocode_source` column added to coaches, facilities, and `travel_teams` tables in Supabase
- `isCompatibleCandidate` zip mismatch threshold loosened from 5 to 10 miles
- Nominatim replaced with Google Geocoding API in `api/geocode-address.js`
- `GOOGLE_GEOCODING_API_KEY` added to Vercel environment variables
- All sleep delays and `skipDelay` logic removed from `geocode.js` — Google has no rate limit requirement
- `consecutiveEmpty` early exit preserved at threshold 2

### UI and data fixes
- Homepage age group dropdown: added 7U, 9U, 11U — full order now 7U through 18U
- `/submit` facility-type dropdown: added Sports Complex (between Training Facility and Travel Team Facility)
- Facilities page map: Sports Complex added to legend (desktop and mobile), orange pin (`#EA580C`), distinct from all existing colors
- CoachDirectory: Facility column removed from coach result rows and header. Column order is now Sport, Team, Age, Tryouts, View. Age falls back to “All ages” if no `age_groups` set. `gridTemplateColumns` updated from 5 to 4 columns
- TravelTeams directory: column header renamed from `AGE / LEVEL` to `AGE`. Column order is now Sport, Team, Age, Facility, Tryouts, View. `TeamDesktopRow.jsx` updated to render `age_group` before `facility_name`
- CoachDirectory default map: both `MapContainer` instances updated from Atlanta default to continental US (`[39.5, -98.35]`, zoom 4)
- Facilities default map: both `MapContainer` instances updated to continental US (`[39.5, -98.35]`, zoom 4)
- TravelTeams default map: already correct, no change needed
- Players Needed & Available default map: already correct in `PlayerBoardBrowseContent.jsx`, no change needed
- Admin email coord rows removed from `lib/emailTemplates.js` — `injectCoordRows` in `notify-admin.js` is now the sole injector

### Geocoding speed, admin edits, email dedup
- Form submission speed: replaced the multi-variant Nominatim loop in `geocode.js` with a single Google query — `{address}, {city}, {state} {zip}`. `buildStreetVariants` removed. Submission time dropped from ~30–35 seconds to under 3 seconds
- Lat/lng editable in admin panel: added `Lat` and `Lng` as editable numeric fields in `AdminPage.jsx` for Coaches, Facilities, and Travel Teams. Fields show inline, save on blur, and persist on reload
- Admin email coord row duplication fixed: `injectCoordRows` detection logic in `notify-admin.js` corrected so Latitude, Longitude, and Geocode Source now appear exactly once in every admin approval email

### Search close / back navigation
- When a user searches from homepage and clicks a result card, closing the card now returns to `/search?...` via `navigate(-1)` instead of dropping to a bare directory page
- Fixed in `CoachDirectory.jsx`, `TravelTeams.jsx`, and `FacilityProfile.jsx`

### Ad slot fixes
- House ads with no `target_url` now wrap in `<a href="/advertise">` instead of rendering as unclickable images — fixed in `AdSlot.jsx`
- All non-homepage house ad records in Supabase updated so `target_url` points to `https://www.sandlotsource.com/advertise`
- Multiple AdSlot fetch waves investigated: root cause was DevTools narrowing viewport below the mobile breakpoint plus normal SPA remounting. Not a production bug

### UI system lock — visual polish (PR #105, merged)
Full visual consistency pass across directory and content pages. No logic, data, or routing changes.

#### Design system tokens established
- Sidebar background: `#f9fafb`
- Border: `#eef0f2`
- Map border: `1px solid #eef0f2`
- Map radius: `10px`
- Row borders: `1px solid #eef0f2`
- Table/list headers: `background: #f9fafb`, `border-bottom: 1px solid #eef0f2`
- Row hover: `#f9fafb`
- Row selected: `#f5f8ff`
- Page background: `#fff`
- Ad band dividers: `1px solid #f1f3f5`
- `HomePageBand` background: `#fafbfc`

#### Passes completed
- Pass 1: removed boxes/cards, flattened homepage, cleaned directory page structure
- Pass 2: white body background, HomePageBand dividers, directory sidebar `#f9fafb`, ad bands cleaned, row hover states via CSS classes
- Pass 3: full directory consistency across Coaches, Teams, Facilities, and Players — sidebar styling, map radius, list headers, row borders, selected rows, ad rails stripped
- Alignment pass: Roster Spots brought into system; CoachDirectory mobile cream wrapper fixed
- Final lock pass:
  - Search Results: removed red accent card/top bar, search header now `#f9fafb` band with `#eef0f2` hairlines, prior red accent UI converted to navy, result cards normalized to `#eef0f2` borders / 10px radius / `#f8fafc` chips, section header border lightened, right rail and mobile inline ad placeholders changed from dashed to solid
  - Roster Spots: restored symmetric left + right skyscraper ad layout (`160px | content | 160px`), explicitly rendering both desktop rail ad slots
  - Homepage: `HomePageBand` background updated to `#fafbfc`, padding tightened to `24px`; “What are you looking for?” and “Featured teams” wrapped in `HomePageBand`; action card borders normalized to `#eef0f2` / radius 10; stats bar dividers lightened; urgent posts empty-state border normalized

---

## What still needs to be done

### Priority 1 — SEO location landing pages for Teams (next up)
**Objective:** Add indexable city/state entry-point routes for search engines and shared links, without replacing the ZIP-first browse experience.

**Scope:** Teams only for v1  
**Route pattern:** `/teams/:state/:city`  
Examples:
- `/teams/fl/jacksonville`
- `/teams/ga/atlanta`

**Requirements:**
- Do NOT replace or weaken ZIP-first browse/search experience
- Read state and city from URL params and normalize as needed
- Initialize team results with that location context
- Existing filters must still work after landing
- Reuse current TravelTeams UI and query logic as much as possible — no logic duplication
- Dynamic page title: `Youth Baseball Teams in Jacksonville, FL | Sandlot Source`
- H1: `Youth Baseball Teams in Jacksonville, Florida`
- Add a short intro text block
- Add a helpful empty state if no results
- Keep the pattern reusable later for coaches and facilities

**Do not:**
- Add coaches/facilities routes yet
- Add age-group routes
- Add sitemap work
- Rework homepage search
- Introduce unrelated refactors

**Files likely involved:**
- `src/App.jsx`
- `src/components/TravelTeams.jsx` or a new wrapper component

### Priority 2 — AdSlot module-level cache (low priority)
**Problem:** Every SPA navigation remounts AdSlot components, triggering redundant Supabase fetches. DevTools viewport changes can also cause `isMobile` toggling and double-fetching.

**Fix:** Add a module-level `Map` cache in `AdSlot.jsx`:
- check cache before fetching
- store result after fetch
- remounts within a session should resolve instantly from cache

**File:** `src/components/AdSlot.jsx`

### Priority 3 — Deferred cleanup (low priority)
- `SearchResults.jsx` still has local copies of `distanceMiles` and `geocodeZip` that should import from canonical `geocode.js`
- `zippopotam.us` fallback in `geocodeZip` may no longer be needed now that Google is primary — evaluate removing
- Add a server-side re-geocode endpoint for admin use on legacy and seeded records with bad coordinates
- `src/components/rosterspots/RosterBrowseSidebar.jsx` was created during UI work and is currently unused — safe to delete if desired

---

## Key files reference

| File | Role |
|---|---|
| `api/geocode-address.js` | Google Geocoding API proxy |
| `src/lib/submit/geocode.js` | Core geocoding logic — simplified to single Google query |
| `src/components/CoachSubmitForm.jsx` | Coach, Team, and Facility submit forms |
| `api/notify-admin.js` | Admin email notification and coord row injection |
| `lib/emailTemplates.js` | Email HTML templates |
| `api/approve.js` | Email approval handler — null coordinate guard |
| `src/components/AdminPage.jsx` | Admin panel — lat/lng editable |
| `src/components/HomePage.jsx` | Homepage search bar, featured sections, HomePageBand usage |
| `src/components/home/HomePageBand.jsx` | Section band wrapper |
| `src/components/CoachDirectory.jsx` | Coach directory, result rows, map |
| `src/components/coaches/CoachRow.jsx` | Coach result row layout |
| `src/components/Facilities.jsx` | Facilities directory, map, legend |
| `src/components/TravelTeams.jsx` | Teams directory, map, column headers |
| `src/components/teams/TeamDesktopRow.jsx` | Team result row layout |
| `src/components/PlayerBoard.jsx` | Players Needed & Available page |
| `src/components/playerboard/PlayerBoardBrowseSidebar.jsx` | Player board sidebar reference implementation |
| `src/components/playerboard/PlayerBoardBrowseContent.jsx` | Player board map and results |
| `src/components/playerboard/PlayerBoardDesktopRow.jsx` | Player board result row |
| `src/components/RosterSpots.jsx` | Roster Spots page — symmetric rail ad layout |
| `src/components/rosterspots/RosterBrowseContent.jsx` | Roster Spots browse view |
| `src/components/AdSlot.jsx` | Ad slot fetch and render |
| `src/components/ads/RailAdSlot.jsx` | Shared sidebar rail ad slot |
| `src/components/ads/DirectoryAdBand.jsx` | Directory inline ad band |
| `src/components/home/HomePageAdBand.jsx` | Homepage ad band |
| `src/components/SearchResults.jsx` | Search results page |
| `src/components/search/SearchResultsContent.jsx` | Search results content grid and section headers |
| `src/components/search/CoachResult.jsx` | Coach search result card |
| `src/components/search/TeamResult.jsx` | Team search result card |
| `src/components/search/FacilityResult.jsx` | Facility search result card |
| `src/index.css` | Global styles, CSS tokens, row hover classes |

---

## Google Geocoding API details
- Provider: Google Geocoding API
- Endpoint: `https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={key}`
- Environment variable: `GOOGLE_GEOCODING_API_KEY`
- Set in Vercel for Production, Preview, and Development
- Google Cloud project: Sandlot Source
- Restriction: Geocoding API only
- Free tier: $200/month credit (~40,000 calls)
- Current volume is well under limit
- No rate limiting required — all delays removed

---

## geocode_review workflow
1. User submits with an address Google cannot resolve
2. `geocodeZip` fires as fallback using submitted zip
3. Record saves to Supabase with `approval_status: geocode_review` and `geocode_source: zip`
4. Submitter sees: “Your listing was received but we could not verify your exact location automatically. Our team will review and confirm it before it goes live.”
5. Admin receives email with 📍 GEOCODE REVIEW NEEDED in subject line
6. Admin finds record in `/admin` filtered by Geocode Review status
7. Admin corrects lat/lng using editable `Lat` and `Lng` fields in the admin panel, then changes `approval_status` to approved
8. The null coordinate guard in `approve.js` does NOT block `geocode_review` records because they have zip centroid coordinates, not null. Admin should still correct coordinates before clicking Approve

---

## Branch strategy
- Always branch from main
- One session per branch
- Push to branch
- Create PR
- Test on Vercel preview URL before merging
- After merge:
  - `git checkout main`
  - `git pull origin main`
  - `git branch -d {branch-name}`

---

## Important reminders
- Production is not updated until merged to `main` and deployed by Vercel
- Localhost working does not mean production is live
- Always confirm branch before editing
- Always prefer local testing before merge
- If `HEAD.lock` error appears on checkout: `del .git\HEAD.lock` then retry