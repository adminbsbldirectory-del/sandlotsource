# Sandlot Source — Session Handoff Notes

## What this is
Running context for Sandlot Source development. Paste at the start of a new Cowork or Claude thread.

---

## Current repo state
- Working repo: `C:\GitHub\sandlotsource`
- Do not use: `C:\Users\sshap\Documents\GitHub\sandlotsource`
- Current working baseline should now be `main`
- Local `main` should be synced to `origin/main`
- Latest merged work is live only after Vercel production deploy is confirmed
- Keep `refactor/submit-form-modular` for now as a backup branch

---

## Working repo / workflow
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

## What has been completed and merged to main

### Geocoding hardening
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

### Search / browse / map behavior
- `/search` mixed-type results remain list-only by default
- Added conditional `List / Map` toggle only when results are narrowed to a single type: `coach`, `team`, or `facility`
- For single-type searches, `Map` view now hands off into the corresponding directory page
- If a user selects `Map` without valid ZIP/geocode context, `/search` now shows a clear ZIP-needed message
- Search-to-directory handoff now preserves:
  - keyword query `q`
  - ZIP
  - radius
  - sport
  - age
- Facility search handoff bug is fixed:
  - narrowed `/search` results now stay aligned with `/facilities`
  - keyword filter is preserved during handoff
- When a user searches from homepage and clicks a result card, closing the card now returns to `/search?...` via `navigate(-1)` instead of dropping to a bare directory page
- Fixed in `CoachDirectory.jsx`, `TravelTeams.jsx`, and `FacilityProfile.jsx`

### Directory / map / UI fixes
- Homepage age group dropdown: added `7U`, `9U`, and `11U` — full order now `7U` through `18U`
- Search Results age group dropdown: also updated to full `7U` through `18U` order
- `/submit` facility-type dropdown: added `Sports Complex` between `Training Facility` and `Travel Team Facility`
- Facilities page map: `Sports Complex` added to legend on desktop and mobile
- Facilities page map: `Sports Complex` pin color adjusted from `#EA580C` to `#B45309` for better separation from red `Indoor Training Facility`
- CoachDirectory: Facility column removed from coach result rows and header. Column order is now `Sport`, `Team`, `Age`, `Tryouts`, `View`
- CoachDirectory age falls back to `All ages` if no `age_groups` are set
- TravelTeams directory: column header renamed from `AGE / LEVEL` to `AGE`
- TravelTeams column order is now `Sport`, `Team`, `Age`, `Facility`, `Tryouts`, `View`
- `TeamDesktopRow.jsx` updated to render `age_group` before `facility_name`
- CoachDirectory default map updated to continental US default
- Facilities default map updated to continental US default
- TravelTeams default map was already correct
- Players Needed & Available default map was already correct

### Submit form / wording cleanup
- Travel Team submit form: `Age Group` now renders before `Classification`
- Travel Team submit wording and placeholder cleanup is merged
- Cross-form wording / helper / placeholder consistency pass is merged across submit-related surfaces
- Shared submit ZIP placeholder example text was replaced with neutral instructional wording
- Roster Spots ZIP placeholder example text was also replaced with neutral instructional wording
- Travel Teams wording-only clarification pass is merged across submit and profile surfaces
- `Organization / Affiliation` vs `Primary / Home Facility` distinction is now clearer for submitters and site visitors
- This was wording-only and did not change schema or linking behavior

### Geocoding speed, admin edits, email dedup
- Form submission speed: replaced the multi-variant Nominatim loop in `geocode.js` with a single Google query — `{address}, {city}, {state} {zip}`
- `buildStreetVariants` removed
- Submission time dropped from ~30–35 seconds to under 3 seconds
- `Lat` and `Lng` are editable in `AdminPage.jsx` for Coaches, Facilities, and Travel Teams
- Coord row duplication fixed in admin approval emails
- Admin email coord rows removed from `lib/emailTemplates.js` so `injectCoordRows` in `notify-admin.js` is the sole injector

### Ad slot fixes
- House ads with no `target_url` now wrap to `/advertise` instead of rendering as unclickable images
- Non-homepage house ad records in Supabase were updated to point to `https://www.sandlotsource.com/advertise`
- Multiple AdSlot fetch waves were investigated and determined to be DevTools/mobile-breakpoint behavior plus normal SPA remounting, not a production bug
- `AdSlot.jsx` now uses module-level cache by `slotKey`
- Added in-flight promise caching to reduce duplicate concurrent requests for the same slot
- Current expected behavior:
  - different homepage and directory slot keys still fetch separately
  - same-slot SPA remounts should reuse cached results during the session
- No ad targeting, schema, or UI behavior was changed as part of this cache pass

### Visual system lock
- Full visual consistency pass across directory and content pages is merged
- Search Results, Roster Spots, Homepage, and browse shells were normalized to the current design token system
- No logic, data, or routing changes were introduced as part of the visual lock pass

---

## Important completed behavior to preserve
- Mixed-type `/search` results remain list-only by default
- Single-type `/search` results (`coach`, `team`, `facility`) can show List / Map toggle
- Search results map handoff preserves `q`, `zip`, `radius`, `sport`, and `age`
- `/search` map view shows a ZIP-needed message when valid map context does not exist
- Facility search handoff must continue to preserve narrowed result counts and keyword filtering
- Travel Team submit `Age Group` must remain before `Classification`
- `organization / affiliation` remains display-only text
- `facility_id` remains the only structured linked relationship for teams
- Ad slot module cache should remain in place unless a later ad system redesign replaces it
- Do not reopen or regress current stable browse/map behavior unless directly required by the chosen task

---

## Ongoing backlog / items still to work out

This is a living list and should be updated after each item is completed, merged, deferred, clarified, or replaced.

### Travel teams data model / relationships
- Reviewed current `organization / affiliation` behavior across submit, browse, and profile surfaces
- Current decision: keep `organization / affiliation` as display-only text for now
- Current decision: keep `facility_id` / linked facility as the only structured relationship
- `organization / affiliation` is still useful for team identity, branding, and duplicate detection
- Do not auto-link organization / affiliation to a facility
- Do not infer organization → facility relationships automatically from team text fields
- Do not introduce schema changes for organization entities at this stage
- If needed later, revisit only when there is a clear product need for:
  - multi-team organization pages
  - structured organization records
  - organization-to-facility relationships beyond plain display text

### Claimed listing edit flow
- Confirm whether claimed coaches, teams, and facilities already have a magic-link flow for making future profile updates
- If not, scope a secure self-serve update flow for claimed listings
- Keep this as an audit / diagnosis thread first before any implementation

### Anti-spam / quality controls
- Restore hidden spam-blocking work that was previously removed or deferred
- Restore profile accuracy scoring work that was previously removed or deferred

### Advertising work
- Revisit unfinished advertising work that was previously identified
- Review prior advertising to-do items and decide what is still relevant versus obsolete
- If future ad performance work is needed, evaluate whether cache duration/invalidation needs tightening
- Do not reopen recent AdSlot cache work unless there is a reproducible production issue

### Technical / deferred backlog
- Add SEO location landing pages for Teams:
  - route pattern `/teams/:state/:city`
  - reuse current `TravelTeams` UI / query logic
  - do not weaken ZIP-first browse / search
- Evaluate cleanup in `SearchResults.jsx`:
  - import canonical `distanceMiles` / `geocodeZip`
  - reassess whether `zippopotam.us` fallback is still needed
- Add server-side re-geocode endpoint for admin use on legacy and seeded records with bad coordinates
- Delete `src/components/rosterspots/RosterBrowseSidebar.jsx` if confirmed unused

### Minor future polish
- If needed later, do a tiny final wording pass for any leftover one-off copy inconsistencies that were missed in the recent cleanup
- If that happens, keep it tightly scoped and wording-only

---

## Recommended next task
- Claimed listing edit flow audit
- Keep it as an audit / decision thread first
- Confirm whether claimed coaches, teams, and facilities already have any secure self-serve update path
- If not, define the lightest safe path forward before touching implementation
- Do not combine it with anti-spam restoration, ad work, or schema changes
- Goal: determine whether the current claim flow ends at request intake only, or whether any real post-claim update workflow already exists

---

## Key files reference

| File | Role |
|---|---|
| `src/components/submit/TeamBasicsSection.jsx` | Travel Team basics section inside submit flow |
| `src/components/submit/TeamFacilitySection.jsx` | Team-to-facility submit section |
| `src/components/submit/ZipField.jsx` | Shared submit ZIP input |
| `src/components/CoachSubmitForm.jsx` | Shared submit form wrapper for Coach, Team, Facility, and Player Board surfaces |
| `src/components/ClaimListing.jsx` | Claim / update request intake form |
| `src/components/RosterSpots.jsx` | Roster spots page and inline ZIP placeholder cleanup |
| `api/geocode-address.js` | Google Geocoding API proxy |
| `src/lib/submit/geocode.js` | Core geocoding logic |
| `api/notify-admin.js` | Admin email notification and coord row injection |
| `lib/emailTemplates.js` | Email HTML templates |
| `api/approve.js` | Email approval handler |
| `src/components/AdminPage.jsx` | Admin panel |
| `src/components/HomePage.jsx` | Homepage search and featured sections |
| `src/components/CoachDirectory.jsx` | Coach directory |
| `src/components/Facilities.jsx` | Facilities directory |
| `src/components/TravelTeams.jsx` | Teams directory |
| `src/components/teams/TeamDesktopRow.jsx` | Team result row layout |
| `src/components/teams/TeamPreviewCard.jsx` | Team preview modal card |
| `src/components/TeamProfile.jsx` | Full team profile modal |
| `src/components/AdSlot.jsx` | Ad slot fetch and render with module-level cache |
| `src/components/SearchResults.jsx` | Search results page |
| `src/components/search/SearchResultsContent.jsx` | Search results content grid and map handoff UI |
| `src/index.css` | Global styles and design tokens |

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
- No rate limiting required

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
  - delete the local feature branch
- If GitHub merge history or force-push/amend history prevents normal local delete, use `git branch -D {branch-name}` after confirming `main` is up to date

---

## Important reminders
- Production is not updated until merged to `main` and deployed by Vercel
- Localhost working does not mean production is live
- Always confirm branch before editing
- Always prefer local testing before merge
- If `HEAD.lock` error appears on checkout: `del .git\HEAD.lock` then retry