# Sandlot Source — Session Handoff Notes

## What this is
Running context for Sandlot Source development. Paste at the start of a new Cowork or Claude thread.

---

## Current repo state
- Branch: `main`
- All recent search UX and facilities map color updates are merged to `main`
- Live site is updated on `sandlotsource.com`
- Vercel production deploy confirmed
- Local repo should be synced to `main`

---

## Working repo / workflow
- Working repo: `C:\GitHub\sandlotsource`
- Do not use: `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Local workflow only: VS Code + terminal + GitHub Desktop
- Do not use GitHub browser as the primary way to edit site code
- GitHub browser is only for tiny low-risk text edits, README/content-only changes, or very small one-line changes that do not need local testing
- Use local workflow for React/JSX changes, multi-file changes, imports/exports, form logic, ZIP/geocoding/map behavior, and anything that should be tested before going live
- Production deploys from `main`
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
8. Open Pull Request into `main`
9. Merge PR
10. Wait for Vercel production deploy
11. Test `sandlotsource.com` live

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
- Null lat/lng records no longer pass proximity filters in `CoachDirectory`, `Facilities`, `TravelTeams`, and `SearchResults`
- Approval email shows Latitude, Longitude, and Geocode Source before admin clicks Approve
- Null coordinate guard in `api/approve.js` blocks one-click email approval of null-coordinate records
- `preResolved` wired into CoachForm and TeamForm to avoid double geocoding
- `geocode_review` soft fallback added to CoachForm, TeamForm, and FacilityForm — unresolvable addresses enter Supabase with `approval_status: geocode_review` and `geocode_source: zip`
- Admin email gets `📍 GEOCODE REVIEW NEEDED` subject prefix for `geocode_review` submissions
- `approval_status` check constraint updated in Supabase to include `geocode_review` for coaches, facilities, and `travel_teams`
- `geocode_source` column added to coaches, facilities, and `travel_teams` tables in Supabase
- `isCompatibleCandidate` zip mismatch threshold loosened from 5 to 10 miles
- Nominatim replaced with Google Geocoding API in `api/geocode-address.js`
- `GOOGLE_GEOCODING_API_KEY` added to Vercel environment variables
- All sleep delays and `skipDelay` logic removed from `geocode.js`
- `consecutiveEmpty` early exit preserved at threshold 2

### UI and data fixes
- Homepage age group dropdown: added `7U`, `9U`, and `11U` — full order now `7U` through `18U`
- Search Results age group dropdown: also updated to full `7U` through `18U` order
- `/submit` facility-type dropdown: added `Sports Complex` (between `Training Facility` and `Travel Team Facility`)
- Facilities page map: `Sports Complex` added to legend on desktop and mobile
- Facilities page map: `Sports Complex` pin color adjusted from bright orange (`#EA580C`) to darker amber-brown (`#B45309`) for clearer separation from red `Indoor Training Facility`
- CoachDirectory: Facility column removed from coach result rows and header. Column order is now `Sport`, `Team`, `Age`, `Tryouts`, `View`
- CoachDirectory age falls back to `All ages` if no `age_groups` are set
- TravelTeams directory: column header renamed from `AGE / LEVEL` to `AGE`
- TravelTeams column order is now `Sport`, `Team`, `Age`, `Facility`, `Tryouts`, `View`
- `TeamDesktopRow.jsx` updated to render `age_group` before `facility_name`
- CoachDirectory default map: both `MapContainer` instances updated from Atlanta default to continental US (`[39.5, -98.35]`, zoom 4)
- Facilities default map: both `MapContainer` instances updated to continental US (`[39.5, -98.35]`, zoom 4)
- TravelTeams default map: already correct, no change needed
- Players Needed & Available default map: already correct in `PlayerBoardBrowseContent.jsx`, no change needed
- Admin email coord rows removed from `lib/emailTemplates.js` — `injectCoordRows` in `notify-admin.js` is now the sole injector

### Geocoding speed, admin edits, email dedup
- Form submission speed: replaced the multi-variant Nominatim loop in `geocode.js` with a single Google query — `{address}, {city}, {state} {zip}`
- `buildStreetVariants` removed
- Submission time dropped from ~30–35 seconds to under 3 seconds
- Lat/lng editable in admin panel: added `Lat` and `Lng` as editable numeric fields in `AdminPage.jsx` for Coaches, Facilities, and Travel Teams
- Fields show inline, save on blur, and persist on reload
- Admin email coord row duplication fixed: `injectCoordRows` detection logic in `notify-admin.js` corrected so Latitude, Longitude, and Geocode Source now appear exactly once in every admin approval email

### Search close / back navigation
- When a user searches from homepage and clicks a result card, closing the card now returns to `/search?...` via `navigate(-1)` instead of dropping to a bare directory page
- Fixed in `CoachDirectory.jsx`, `TravelTeams.jsx`, and `FacilityProfile.jsx`

### Search results map / browse UX
- `/search` mixed-type results remain list-only by default
- Added conditional `List / Map` toggle only when results are narrowed to a single type: `coach`, `team`, or `facility`
- For single-type searches, `Map` view now acts as a controlled handoff into the corresponding directory page instead of trying to render a new embedded mixed search map
- If a user selects `Map` without a valid ZIP/geocode context, `/search` now shows a clear message that ZIP is required to open nearby map results
- If a user selects `Map` with a valid ZIP/geocode context, the handoff link opens the matching directory map page
- Search-to-directory handoff now preserves:
  - keyword query `q`
  - ZIP
  - radius
  - sport
  - age
- This fixes the prior bug where `/search` could show a narrowed keyword result count, but clicking through to the directory map would expand to all nearby records because `q` was not being passed through
- Confirmed working for Facilities:
  - `/search` result count stays aligned with `/facilities`
  - example case: narrowed results remained `14` on both pages after handoff instead of expanding to `94`

### Ad slot fixes
- House ads with no `target_url` now wrap in `<a href="/advertise">` instead of rendering as unclickable images — fixed in `AdSlot.jsx`
- All non-homepage house ad records in Supabase updated so `target_url` points to `https://www.sandlotsource.com/advertise`
- Multiple AdSlot fetch waves investigated: root cause was DevTools narrowing viewport below the mobile breakpoint plus normal SPA remounting, not a production bug

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
- Pass 2: white body background, `HomePageBand` dividers, directory sidebar `#f9fafb`, ad bands cleaned, row hover states via CSS classes
- Pass 3: full directory consistency across Coaches, Teams, Facilities, and Players — sidebar styling, map radius, list headers, row borders, selected rows, ad rails stripped
- Alignment pass: Roster Spots brought into system; CoachDirectory mobile cream wrapper fixed

#### Final lock pass
- Search Results:
  - removed red accent card/top bar
  - search header now `#f9fafb` band with `#eef0f2` hairlines
  - prior red accent UI converted to navy
  - result cards normalized to `#eef0f2` borders / `10px` radius / `#f8fafc` chips
  - section header border lightened
  - right rail and mobile inline ad placeholders changed from dashed to solid
- Roster Spots:
  - restored symmetric left + right skyscraper ad layout (`160px | content | 160px`)
  - explicitly rendering both desktop rail ad slots
- Homepage:
  - `HomePageBand` background updated to `#fafbfc`
  - padding tightened to `24px`
  - “What are you looking for?” and “Featured teams” wrapped in `HomePageBand`
  - action card borders normalized to `#eef0f2` / radius `10`
  - stats bar dividers lightened
  - urgent posts empty-state border normalized

---

## Ongoing backlog / items still to work out

This is a living list and should be updated after each item is completed, deferred, clarified, or replaced.

### Travel teams data model / relationships
- Determine how the `organization` / `affiliation` field should work on the Travel Teams page
- Confirm whether it already drives any useful behavior or should be connected to a facility / home field relationship
- Example cases to evaluate:
  - Sandy Springs Storm (multiple baseball and softball teams) is affiliated with Sandy Springs Youth Sports, with home facility Morgan Falls Athletics Complex
  - Georgia Bombers (multiple baseball teams) are affiliated with Georgia Bombers, with home facility Grand Slam Johns Creek
- Decide whether this should remain display-only, link to a facility profile, or support a stronger organization → facility relationship later

### Claimed listing edit flow
- Confirm whether claimed coaches, teams, and facilities already have a magic-link flow for making future profile updates
- If not, scope a secure self-serve update flow for claimed listings

### Travel team submit form
- On the Travel Team submit form, move **Age Group** before **Classification**

### Anti-spam / quality controls
- Restore the hidden spam-blocking work that was previously removed or deferred
- Restore the profile accuracy scoring work that was previously removed or deferred

### Advertising work
- Revisit the unfinished advertising work that was previously identified
- Review prior advertising to-do items and decide what is still relevant versus obsolete

### Copy / placeholder / field wording cleanup
Standardize inconsistent helper text, placeholder text, and field wording across forms and profile pages.

Items already identified:
- ZIP code helper / placeholder wording varies across pages and should be standardized
- Coach profile: clean up **Facility / Business Name** wording
- Travel Teams page: clean up **Team Name** and **Organization / Affiliation** wording
- Player Board / Player Needed: clean up **Team Name** wording
- Facility form: replace placeholder examples such as `e.g. Grit Academy` with cleaner, more consistent wording
- Street address helper / placeholder wording should also be reviewed and standardized across forms

### Technical / deferred backlog
- Add SEO location landing pages for Teams:
  - route pattern `/teams/:state/:city`
  - reuse current TravelTeams UI / query logic
  - do not weaken ZIP-first browse / search
- Add module-level cache in `AdSlot.jsx` to reduce redundant fetches on SPA remounts
- Evaluate cleanup in `SearchResults.jsx`:
  - import canonical `distanceMiles` / `geocodeZip`
  - reassess whether `zippopotam.us` fallback is still needed
- Add server-side re-geocode endpoint for admin use on legacy and seeded records with bad coordinates
- Delete `src/components/rosterspots/RosterBrowseSidebar.jsx` if confirmed unused

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
| `src/components/HomePage.jsx` | Homepage search bar, featured sections, `HomePageBand` usage |
| `src/components/home/HomePageBand.jsx` | Section band wrapper |
| `src/components/CoachDirectory.jsx` | Coach directory, result rows, map |
| `src/components/coaches/CoachRow.jsx` | Coach result row layout |
| `src/components/Facilities.jsx` | Facilities directory, map, legend, facility type colors |
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
| `src/components/SearchResults.jsx` | Search results page, single-type map handoff logic |
| `src/components/search/SearchResultsContent.jsx` | Search results content grid, toggle, ZIP-needed map messaging |
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
- Free tier: `$200/month` credit (`~40,000` calls)
- Current volume is well under limit
- No rate limiting required — all delays removed

---

## geocode_review workflow
1. User submits with an address Google cannot resolve
2. `geocodeZip` fires as fallback using submitted zip
3. Record saves to Supabase with `approval_status: geocode_review` and `geocode_source: zip`
4. Submitter sees: “Your listing was received but we could not verify your exact location automatically. Our team will review and confirm it before it goes live.”
5. Admin receives email with `📍 GEOCODE REVIEW NEEDED` in subject line
6. Admin finds record in `/admin` filtered by Geocode Review status
7. Admin corrects lat/lng using editable `Lat` and `Lng` fields in the admin panel, then changes `approval_status` to `approved`
8. The null coordinate guard in `approve.js` does **not** block `geocode_review` records because they have zip centroid coordinates, not null. Admin should still correct coordinates before clicking Approve

---

## Branch strategy
- Always branch from `main`
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