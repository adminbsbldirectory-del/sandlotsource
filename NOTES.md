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
2. Confirm you are on `main`: `git branch`
3. Create a feature branch: `git checkout -b feature/your-branch-name`
4. Make changes locally in VS Code
5. Test on localhost with `npm run dev`
6. Check `git status`
7. Stage only the files you intentionally changed: `git add <file1> <file2>`
8. Commit: `git commit -m "description"`
9. Push branch: `git push origin feature/your-branch-name`
10. Open Pull Request into `main` on GitHub
11. Merge PR on GitHub
12. **Immediately after merge — post-merge checklist (see below)**
13. Wait for Vercel production deploy
14. Test `sandlotsource.com` live

### Post-merge checklist (run these every time after merging a PR)
```
git checkout main
git pull origin main
git branch -d feature/your-branch-name
```
- You are still on the feature branch after a GitHub merge — always switch to main explicitly
- Never commit or push while still on the feature branch after the PR is closed
- Verify Vercel production deploy before calling the work done

### Avoiding git pollution
- Never run `npm install` or `npm run build` from the Cowork / Claude sandbox — only run these from your local Windows terminal
- The sandbox runs Linux npm, which writes Linux-specific `libc` fields into `package-lock.json` and creates `dist/` artifacts — these should not be committed
- `dist/` and `vite.config.js.timestamp*` are now in `.gitignore` — if other build artifacts appear, add them there too
- If `package-lock.json` shows changes you didn't make, discard them: right-click in GitHub Desktop → Discard changes
- Only stage files you explicitly changed — use `git add <specific file>` not `git add .`

### Fixing common git errors
- **`index.lock` error during `git add` or `git commit`**: `del .git\index.lock` then retry
- **`HEAD.lock` error during `git checkout`**: `del .git\HEAD.lock` then retry
- **Push rejected (non-fast-forward)**: you are behind origin — run `git fetch origin` then `git rebase origin/main`, then push
- **Cannot rebase: unstaged changes**: run `git stash`, then rebase, then `git stash pop`
- **Accidentally committed on feature branch instead of main**: commit the file on the feature branch, switch to main, pull, then `git cherry-pick <commit-hash>` to apply it to main

### Tool roles
- VS Code = code editing
- Terminal = source of truth for git status / branch / local testing
- GitHub Desktop = visual check for staged changes before committing; use it to confirm only the right files are checked
- Vercel = preview vs production deployment check

### Safe branch setup
- `main` = production-aligned branch
- `refactor/submit-form-modular` = keep for now, do not delete yet

---

## What has been completed and merged to main

### Homepage visual polish pass (ui/track-a-polish)
- Ad band repositioned: desktop sponsored band now renders below the search/filter row and above the stats bar (was above the hero)
- Stats bar: numbers larger (28px desktop / 24px mobile), bold weight (700), dark navy `#0d1b2e`, warm taupe dividers between each stat
- Search section: left bar removed, replaced with gold `#c9a84c` top border accent
- Nav CTAs unified to one brand family: "Add a Listing" = solid `#0d1b2e` primary with gold active underline; "Roster Spots" = ghost/outline in same navy via inset box-shadow
- Category tiles: replaced per-card emoji icons with Lucide icons (Target, Building2, Shield, Handshake), consistent icon container, 60px min tap target on mobile, subtle resting shadow, gold border on hover
- "View profile / View team" links in `FeaturedCard.jsx`: changed from red to dark navy `#0d1b2e`
- "View all →" links in `HomePageSectionHeader.jsx`: changed from red to dark navy `#0d1b2e`
- Category card arrow indicators: changed from red to dark navy `#0d1b2e`
- Urgent pickup needs card border: softened from pink `#f5cfc9` to neutral `#eef0f2`; "Need player" badge still carries urgency signal
- "Are you a coach or team?" CTA section: background updated to `#0d1b2e`, "Add a listing" button changed from red to gold `#c9a84c` with dark navy text
- `HomePageBand` background warmed from cold `#fafbfc` to `#F7F5F1`; borders warmed from `#f1f3f5` to `#ede9e3`
- Stats bar outer borders: `#f1f3f5` → `#ede9e3`; inner dividers: `#e2e8f0` → `#e8e4dd`
- `.home-category-card:hover` CSS rule added to `src/index.css` (scoped, no broad global changes)
- No logic, routing, schema, geocoding, or data-fetch changes introduced
- Files changed: `src/components/HomePage.jsx`, `src/components/Header.jsx`, `src/index.css`, `src/components/home/FeaturedCard.jsx`, `src/components/home/HomePageBand.jsx`, `src/components/home/HomePageSectionHeader.jsx`

### Directory pages visual harmonization (ui/directory-harmonize)
- All six directory / browse pages harmonized to match the homepage visual token system
- Filter sidebar and filter header backgrounds warmed from cold `#f9fafb` to `#F7F5F1` across:
  - `src/components/CoachDirectory.jsx`
  - `src/components/Facilities.jsx`
  - `src/components/TravelTeams.jsx`
  - `src/components/SearchResults.jsx`
  - `src/components/rosterspots/RosterBrowseContent.jsx`
  - `src/components/playerboard/PlayerBoardBrowseContent.jsx`
  - `src/components/playerboard/PlayerBoardBrowseSidebar.jsx`
- `MobileFacilityRow.jsx` distance indicator color changed from `var(--red)` to `var(--gray)` — distance is informational, not urgent
- All directory "add / contribute" CTA buttons (sidebar and filter bar) converted to white + gold border pattern:
  - `background: #FFFBF0` (warm gold tint at rest)
  - `border: 2px solid #c9a84c`
  - `color: #0d1b2e`
  - `fontWeight: 800`
  - `borderRadius: var(--btn-radius)`
  - `fontSize: 13`
  - Hover: `background: #FEF3C7`, `border-color: #b8941f` via `.add-cta` CSS class in `index.css`
- Submit and profile page primary action buttons (CoachSubmitForm, RosterSpots, CoachProfile, FacilityProfile, TeamProfile) converted from red to solid gold `#c9a84c` with navy text
- All sidebar button font sizes normalized to 13px
- All gold CTA buttons bumped to `fontWeight: 800` to match visual weight against navy buttons
- No logic, routing, data-fetch, or map behavior changes introduced
- Files changed:
  - `src/index.css` (added `.add-cta` hover rule)
  - `src/components/CoachDirectory.jsx`
  - `src/components/Facilities.jsx`
  - `src/components/TravelTeams.jsx`
  - `src/components/SearchResults.jsx`
  - `src/components/rosterspots/RosterBrowseContent.jsx`
  - `src/components/playerboard/PlayerBoardBrowseContent.jsx`
  - `src/components/playerboard/PlayerBoardBrowseSidebar.jsx`
  - `src/components/facilities/MobileFacilityRow.jsx`
  - `src/components/CoachSubmitForm.jsx`
  - `src/components/RosterSpots.jsx`
  - `src/components/CoachProfile.jsx`
  - `src/components/FacilityProfile.jsx`
  - `src/components/TeamProfile.jsx`

### Homepage Enter search + preview close behavior (bugfix/home-search-enter-and-search-preview-close)
- Homepage search now submits correctly on Enter across the full homepage search area, not just the keyword field
- `HomePage.jsx` search controls were unified into one shared form submit flow so ZIP/filter usage no longer bypasses submit behavior
- Coach preview close behavior now clears only the `select` query param instead of using history back navigation
- Team preview close behavior now clears only the `select` query param instead of using history back navigation
- Team preview close behavior also now clears reliably on the first click
- `TravelTeams.jsx` now syncs local selected-team state with URL selection state so URL-driven close behavior does not require a second click
- Existing search context is preserved when closing previews, including current ZIP / radius / sport / age / query params already in the URL
- This bugfix was intentionally narrow and did not change broader search/map handoff behavior outside these specific fixes
- Files changed:
  - `src/components/HomePage.jsx`
  - `src/components/CoachDirectory.jsx`
  - `src/components/TravelTeams.jsx`

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

### Admin re-geocode tooling
- Added admin-only facility re-geocode action in `AdminPage.jsx`
- Facilities admin table now includes `Geo Source` and row-level `Re-geocode` action
- Added server-side `api/admin-regeocode.js` endpoint for one-record-at-a-time coordinate refresh
- Re-geocode now supports Facilities, Coaches, and Travel Teams
- Coaches admin table now includes `Geo Source` and row-level `Re-geocode`
- Travel Teams admin table now includes `Geo Source` and row-level `Re-geocode`
- Re-geocode updates `lat`, `lng`, and `geocode_source`
- Existing manual `Lat` / `Lng` editing remains intact
- Admin re-geocode remains admin-only and one-record-at-a-time
- Preview and production testing confirmed admin re-geocode works end-to-end
- Public map pins reflect saved re-geocoded coordinates after admin refresh
- No schema changes were introduced
- No public UI changes were introduced beyond the existing admin surface

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
- Search Results now aligns with the shared geocoding utility path used elsewhere, including the Google-first ZIP lookup behavior with fallback retained in shared code
- `SearchResults.jsx` now imports shared `geocodeZip` and `distanceMiles` from `src/lib/submit/geocode.js` instead of maintaining duplicated local helper logic

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

### Claimed listing audit findings
- Claim/update intake already exists in `src/components/ClaimListing.jsx`
- Claim requests are stored in `claim_requests`
- Admin claim queue backend exists for loading and resolving claim requests
- Admin claim queue UI exists, including filtering, notes, and actions for `Approve`, `Reject`, `Set Pending`, and `Set New`
- Approved true claims create active records in `listing_ownerships`
- Approved true claims update listing verification status
- Travel team approvals also retain backward-compat support for `claimed` and `claimed_at`
- Update requests can be approved/resolved administratively, but no self-serve owner edit path was confirmed from this audit
- `listing_ownerships` appears to be used in claim review backend only, not in a reusable owner-facing access flow
- No completed magic-link, owner session, manage-listing page, or secure claimed-owner self-serve edit workflow was found
- Current claim system should be understood as:
  - real claim intake
  - real admin review / ownership recording
  - real verified / claimed status handling
  - but no confirmed owner-edit experience after approval yet

### Anti-spam / quality controls
- Shared submit anti-spam helper exists in `src/utils/formSpamProtection`
- Hidden honeypot field `companyFax` and minimum submit-time guard are currently wired into active public forms
- Confirmed active on:
  - `src/components/CoachSubmitForm.jsx` for Coach, Team, Player Board, and Facility submit surfaces
  - `src/components/ClaimListing.jsx`
  - `src/components/AdvertisePage.jsx`
  - `src/components/RosterSpots.jsx`
- `HelpPage.jsx` is informational only and does not contain a public form
- Current conclusion:
  - hidden spam-blocking work is already restored on the main public-input surfaces
  - this backlog item should no longer be treated as the best next implementation candidate
- Separate profile-accuracy scoring work, if it existed previously, was not confirmed in this audit and remains unresolved

### Duplicate matching / submission quality control
- Shared duplicate matcher logic is now extracted into `src/lib/duplicateMatchers.js`
- `src/components/CoachSubmitForm.jsx` now uses shared duplicate search helpers for coaches, teams, and facilities instead of maintaining separate in-file duplicate scoring logic
- `lib/duplicateCheck.js` now reuses the stronger shared duplicate matching logic for server-side/admin-email duplicate checks
- Team duplicate candidate retrieval was broadened so likely duplicate warnings surface earlier during submit-flow entry
- Team duplicate testing confirmed useful warnings for:
  - exact and close team-name matches
  - shortened naming variants
  - lowercase input
  - broader entries such as `Georgia Bombers` paired with age group
- Coach duplicate warning and facility duplicate warning behavior were also revalidated after the shared matcher extraction
- Current conclusion:
  - duplicate detection is meaningfully improved and consistent enough to keep
  - this work should be treated as completed for now
  - admin-only duplicate review helper remains deferred as a separate possible follow-up, not part of the merged work

### Technical cleanup
- Confirmed `src/components/rosterspots/RosterBrowseSidebar.jsx` was orphaned / unused and removed safely from `main`
- No runtime behavior or roster spots UI behavior was intentionally changed as part of this cleanup

### Small production-safe maintenance passes
- Remaining user-facing ZIP placeholders were standardized from example ZIP text to neutral instructional wording
- This ZIP placeholder cleanup was completed in:
  - `src/components/CoachDirectory.jsx`
  - `src/components/Facilities.jsx`
- Final public copy consistency pass is merged across:
  - `src/components/HelpPage.jsx`
  - `src/components/ClaimListing.jsx`
- Profile claim / verified wording consistency pass is also merged across:
  - `src/components/TeamProfile.jsx`
  - `src/components/CoachProfile.jsx`
  - `src/components/FacilityProfile.jsx`
- These were wording-only maintenance passes with:
  - no logic changes
  - no schema changes
  - no routing changes
  - no browse/map behavior changes

### Content page visual harmonization (ui/content-page-harmonize)
- `AdvertisePage.jsx`: updated constants to brand tokens — `DARK` → `#0d1b2e`, `LIGHT` → `#F7F5F1`, `BORDER` → `#eef0f2`, `MUTED` → `#6B7280`, `NAVY` → `#0d1b2e`; removed `RED` constant entirely; hero card top border changed from red to gold `#c9a84c`; eyebrow "Sandlot Source" label changed from red to gold; SpecCard category label changed from red to navy; submit button changed from red to gold fill with dark navy text
- `HelpPage.jsx`: hero section changed from blue gradient (`#1e3a8a`) to solid navy `#0d1b2e`; `sectionStyle` border warmed from `#e5e7eb` to `#eef0f2`; `faqItemStyle` background warmed from cold `#f8fafc` to `#F7F5F1`, border from `#e2e8f0` to `#ede9e3`; "Email Support" button changed from red to gold fill with dark navy text
- `CoachSubmitForm.jsx` tab shell: active tab underline changed from `var(--red)` to gold `#c9a84c`; active tab text changed from `var(--red)` to `var(--navy)`; required field asterisks intentionally kept red (standard form UX)
- Visual-only pass — no logic, routing, schema, or data-fetch changes
- Files changed: `src/components/AdvertisePage.jsx`, `src/components/HelpPage.jsx`, `src/components/CoachSubmitForm.jsx`

### Mobile conversion pass — Phase 1 (mobile/phase1-conversion-pass)
- iOS Safari auto-zoom fix: `inputStyle.fontSize` bumped from `14` to `16` in `CoachSubmitForm.jsx`
  - `selectStyle` and `textareaStyle` both spread from `inputStyle`, so all form controls in all four tabs (Coach, Team, Facility, Player Board) receive the fix from one change
  - A comment was added above the fontSize value: do not reduce below 16 — any smaller value triggers viewport zoom on iPhone
- Form expectation blurb added before the first section in Coach, Team, and Facility submit flows
  - Warm `#F7F5F1` background, gold `#c9a84c` left border, 13px muted text
  - Text: "Takes about 3-5 minutes to complete. We review and publish new listings within a few days."
  - Inserted immediately above `<CoachBasicsSection`, `<TeamBasicsSection`, and `<FacilityBasicsSection` in `CoachSubmitForm.jsx`
- Supply-side CTA ("Are you a coach or team?") moved higher on the homepage
  - Section was cut from near the bottom of the page and reinserted immediately after the stats bar, before the category tile bands
  - Uses `marginTop: 16` at new position (was `24` in original location)
  - Files changed: `src/components/HomePage.jsx`
- Removed broken "Sponsored placement" placeholder boxes from mobile search results
  - Both `{isMobile && <div>Sponsored placement</div>}` blocks were deleted from the coach and team result sections in `SearchResultsContent.jsx`
  - No ad logic, ad slot, or real ad behavior was changed
- Mobile "Get Listed" CTAs on `/coaches` and `/teams` were already implemented (no change needed)
  - `CoachDirectory.jsx`: `+ Add Coach` button in `{isMobile ? (...)}` branch with `.add-cta` class
  - `TravelTeams.jsx`: `+ Add a Team` button in always-visible filter sidebar with `.add-cta` class
- Files changed: `src/components/CoachSubmitForm.jsx`, `src/components/HomePage.jsx`, `src/components/search/SearchResultsContent.jsx`

### Favicon, icons, and header logo overhaul (direct to main)
- Replaced all old favicon files (`favicon-s.svg`, `favicon-s-16.png`, `favicon-s-32.png`, `favicon-s-48.png`, `apple-touch-icon-180x180.png`) with proper exports
- New favicon source: circular S logo (`circular S.png` in Sandlot Source Images folder) — navy S script inside a gold circle with baseball stitching
- Yellow in source file shifted to brand gold `#c9a84c` via PIL pixel-level channel scaling
- `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico` (multi-size 16/32/48) all regenerated from circular S source
- `apple-touch-icon.png` regenerated at 512×512, white background, circular S with gold-shifted yellow and 10% padding — used for Safari "Add to Home Screen" icon
- `android-chrome-192x192.png` regenerated at 192×192 (15KB, was 2.3MB)
- `android-chrome-512x512.png` optimized (62KB, was 4MB)
- `site.webmanifest` created — was entirely missing and causing a 404 on every page load; now includes proper name, icons, `display: standalone`, `background_color: #0d1b2e`, `theme_color: #0d1b2e`
- `index.html` updated with PWA meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`
- Browser tab favicon: circular S ✅
- iPhone "Add to Home Screen" icon: circular S, white background, brand gold ✅
- Safari Favorites tile: still renders as page thumbnail for unknown/new sites — this is a Safari limitation, not a file issue; "Add to Home Screen" is the correct equivalent experience
- **Header logo replaced**: new horizontal lockup — shield + split baseball/softball + "Sandlot Source" script text
- New logo files saved to `public/`: `logo2.png` (cropped 1009×357, 220KB) and `logo2.svg`
- SVG had Canva artboard export issue (full 1500×1500 canvas, logo buried in a small portion) — `logo2.svg` is not usable; switched to `logo2.png`
- `logo2.png` was also 2000×2000 full canvas; cropped via PIL to tight content bounds (1009×357) before committing
- **Canva export note**: always resize artboard to fit logo content before exporting, or crop exported PNG before use
- `Header.jsx` updated: `src` changed from `/logo.png` to `/logo2.png`
- Mobile logo height bumped: `42 → 52px`
- Mobile header container `minHeight` bumped: `58 → 68px`
- All changes committed directly to `main` (no feature branch — acceptable for this session)
- Files changed: `index.html`, `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/apple-touch-icon.png`, `public/android-chrome-192x192.png`, `public/android-chrome-512x512.png`, `public/site.webmanifest`, `public/logo2.png`, `public/logo2.svg`, `src/components/Header.jsx`

### SEO location landing pages (feature/seo-location-pages)
- Added three new route patterns: `/coaches/:state/:city`, `/teams/:state/:city`, `/facilities/:state/:city`
- Routes reuse existing `CoachDirectory`, `TravelTeams`, and `Facilities` components — no new UI components
- URL slug convention: lowercase, hyphen-separated (`new-jersey`, `los-angeles`)
- `STATE_SLUG_TO_ABBR` lookup map added at module level in all three directory components (slug → 2-letter abbreviation)
- Location params derived via `useParams()` at the top of each component: `locationState`, `locationCity`, `locationStateAbbr`
- State filter and search/city filter pre-seeded from URL params so results populate without a ZIP entry
- Each directory's empty guard extended: `locationStateAbbr` is now a third bypass condition alongside `geoCenter` and `facilityFromUrl` — prevents blank render when user arrives without a ZIP
- `CoachDirectory.jsx`: URL hydration effect fixed — was hardcoded to reset state to `"All States"` on any search param change; now preserves `locationStateAbbr` on location page visits
- `TravelTeams.jsx`: `searchTerm` initialized directly from `locationCity.toLowerCase()` to bypass the 250ms debounce and prevent a blank flash on page load
- `Facilities.jsx`: has no state dropdown — inline state filter injected directly into `filtered` useMemo, active only when `locationStateAbbr` is set; no UI change
- `locationStateAbbr` added to `useMemo` dependency arrays in all three components
- `document.title` useEffect added to each component for dynamic SEO page title; resets to site name on unmount
- `<h1>` block added in each component showing "Baseball & Softball [Type] in {City}, {State}" with muted subtext — renders only when both location params are set
- `api/sitemap.js` created: Vercel serverless function (ES module) that queries Supabase for all approved city/state pairs across `coaches`, `travel_teams`, and `facilities` tables; deduplicates URLs; returns valid XML sitemap; 24-hour cache header
- `STATE_ABBR_TO_SLUG` reverse map added in sitemap (abbreviation → slug) — handles both "GA"-stored and "Georgia"-stored state values in DB
- `public/robots.txt` created: `Allow: /` with Sitemap pointer to `https://www.sandlotsource.com/api/sitemap`
- Verified live in production: sitemap returning correct location URLs; all three directory pages rendering at `/georgia/atlanta` with results and correct headings
- Base `/coaches`, `/teams`, and `/facilities` routes are unchanged — ZIP-first browse / map behavior fully preserved
- No new packages introduced
- Files changed:
  - `src/App.jsx`
  - `src/components/CoachDirectory.jsx`
  - `src/components/TravelTeams.jsx`
  - `src/components/Facilities.jsx`
  - `api/sitemap.js` (new)
  - `public/robots.txt` (new)

### Coach map pin persistence + approximate/featured pin styling (feature/coach-map-pin-context)
- Coach close-state fix: closing a coach detail card no longer drops the page into the empty "Start with ZIP code" state
  - `clearSelectedFromUrl` now sets `geoCenter` directly from the selected coach's lat/lng before navigating
  - A `skipGeoResetRef` (useRef) prevents the URL hydration effect from clearing that geoCenter on the subsequent re-render
  - If the coach has a valid 5-digit ZIP, it is also injected into the outgoing URL so the sidebar shows correct context and the geocoding effect re-syncs cleanly in the background
  - Only returns to the true empty state if there is no valid coach location and no existing search context
- Approximate pin styling: coaches with `geocode_source: "zip"`, `"approximate"`, or `"city"` now show a gray border ring (`#9CA3AF`) on their map pin instead of the default white border
  - Sport fill color (blue / yellow / split) is unchanged — approximate status is communicated only through the border
  - Selected state still overrides to gold border regardless of approximate status
  - Facility-linked coach groups are always treated as non-approximate (coordinates come from the facility)
  - Popup adds an italic "General area — exact address not shown" note for approximate groups
- Featured pin styling: coaches and facilities with `featured_status` set now display a small gold star badge (`★`) at the top-right of their map pin
  - Badge is rendered outside the rotated diamond shape so it appears upright
  - Sport color and approximate/exact border are both preserved alongside the star — all three signals can coexist on one pin
- `buildMarkerGroups` in `CoachDirectory.jsx` now computes `isApproximate` and `hasFeatured` per marker group and passes them through to `MapMarkers`
- `makeIcon` in `Facilities.jsx` updated with the same featured star badge and approximate gray-ring logic
- Coach map legend updated to include "Approximate / General Area" (blue pin with gray border) and "Featured" (gold star circle) entries
- Facility map legend updated on both mobile and desktop views to include "Approximate Location" and "Featured" entries
- No changes to search behavior, card-open behavior, profile behavior, or nearby results logic beyond the close-state fix
- Files changed:
  - `src/components/CoachDirectory.jsx`
  - `src/components/Facilities.jsx`
  - `src/components/coaches/MapMarkers.jsx`
  - `src/components/coaches/MapLegend.jsx`

---

## Established brand tokens (do not drift from these)
These were locked in during the `ui/track-a-polish` homepage pass and must carry forward to all directory and content page harmonization work.

| Token | Value | Usage |
|---|---|---|
| Primary navy | `#0d1b2e` | Action links, icon color, solid CTA buttons, stat numbers |
| Gold accent | `#c9a84c` | Section accents, hover borders, active underlines, CTA button fills |
| Warm band background | `#F7F5F1` | Alternating section band backgrounds (`HomePageBand`) |
| Warm border / divider | `#ede9e3` | Section outer borders, stats bar top/bottom |
| Warm inner divider | `#e8e4dd` | Stats bar column dividers, inner card separators |
| Card border | `#eef0f2` | Default card and tile borders |
| Muted text | `#6B7280` | Secondary / label text |

### Add CTA button pattern (directory sidebar and filter bar)
- Rest: `background: #FFFBF0`, `border: 2px solid #c9a84c`, `color: #0d1b2e`, `fontWeight: 800`, `fontSize: 13`, `borderRadius: var(--btn-radius)`
- Hover: `background: #FEF3C7`, `border-color: #b8941f` — applied via `.add-cta` CSS class in `src/index.css`
- Submit / profile primary action buttons remain solid gold fill `#c9a84c` with navy text (different surface, heavier treatment appropriate)
- Do not revert add-CTA buttons to solid gold fill or plain white

### Nav CTA pattern (locked)
- "Add a Listing" = always solid `#0d1b2e` fill, white text, gold active underline
- "Roster Spots" = ghost/outline via `inset 0 0 0 1.5px #0d1b2e` box-shadow, navy text, solid fill when active
- Do not revert to red/green CTA treatment

### Action link color (locked)
- All "View profile", "View team", "View all →", and card arrow indicators must use `#0d1b2e`
- Do not reintroduce red on non-CTA action links

---

## Important completed behavior to preserve
- Mixed-type `/search` results remain list-only by default
- Single-type `/search` results (`coach`, `team`, `facility`) can show List / Map toggle
- Search results map handoff preserves `q`, `zip`, `radius`, `sport`, and `age`
- `/search` map view shows a ZIP-needed message when valid map context does not exist
- Facility search handoff must continue to preserve narrowed result counts and keyword filtering
- Search Results should continue to use shared `geocodeZip` / `distanceMiles` utilities instead of reintroducing local duplicates
- Homepage search Enter behavior should continue to submit from the full homepage search area
- Closing coach/team preview cards from search-driven handoff should clear only `select` and preserve the rest of the directory query context
- Team preview close should continue to close on first click
- Travel Team submit `Age Group` must remain before `Classification`
- `organization / affiliation` remains display-only text
- `facility_id` remains the only structured linked relationship for teams
- Ad slot module cache should remain in place unless a later ad system redesign replaces it
- Current shared spam-protection behavior should remain in place across public submit surfaces unless intentionally redesigned
- Shared duplicate matcher logic in `src/lib/duplicateMatchers.js` should remain the source of truth for coach/team/facility duplicate detection unless intentionally redesigned
- Admin facility re-geocode should remain admin-only and one-record-at-a-time unless intentionally expanded later
- Existing manual facility `Lat` / `Lng` editing should remain intact alongside re-geocode tooling
- Do not reopen or regress current stable browse/map behavior unless directly required by the chosen task
- Do not replace the current claim ownership model unless a future implementation clearly requires it
- If claimed-owner self-serve edits are added later, build on top of existing `listing_ownerships` rather than inventing a new ownership structure
- Homepage visual token decisions from `ui/track-a-polish` must not be reverted — see established brand tokens table above
- Coach close-card must preserve location context (geoCenter) from the coach's own coordinates — do not revert to the empty ZIP state behavior
- Approximate pin border (gray `#9CA3AF`) and featured star badge must be preserved across any future pin icon refactors
- `buildMarkerGroups` must continue to compute `isApproximate` and `hasFeatured` per group
- Coach and facility map legends must continue to include "Approximate / General Area" and "Featured" entries
- `makeIcon` in Facilities.jsx must continue to support `isFeatured` and `isApproximate` — do not simplify back to the one-liner arrow function

---

## Ongoing backlog / items still to work out

This is a living list and should be updated after each item is completed, merged, deferred, clarified, or replaced.

### Directory pages visual harmonization — COMPLETED
- Merged via `ui/directory-harmonize`
- All six directory and browse pages now match the homepage visual token system
- See completed section above for full file list and change details
- Homepage category card layout is noted as “good enough for now” — a later visual pass could make cards feel more like feature / discovery cards. Defer to a future homepage refresh session.

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
- Claim flow audit completed
- Current main includes:
  - listing-linked claim/update intake
  - admin claim queue UI
  - approve/reject/pending/new workflow
  - approved true claims create active `listing_ownerships`
  - approved true claims mark listings verified / claimed
- No completed magic-link or secure self-serve owner edit flow was confirmed
- Current ownership appears to function as a review / verification record, not a reusable owner-access system
- Product direction decision after audit:
  - current admin-reviewed claim structure is sufficient for the site at this stage
  - a robust claimed-owner self-serve edit flow would likely pull the product toward account-based listing management
  - that broader direction likely belongs in a future v2 / v3 evolution after stronger traction, not in the current main roadmap
- For now:
  - defer self-serve claimed-owner editing
  - keep the current claim/admin review model in place
  - preserve `listing_ownerships` as the future ownership backbone if owner accounts or profile management are added later
- If revisited later:
  - build on top of existing `listing_ownerships`
  - avoid ownership-model redesign unless clearly required
  - treat it as part of a broader profile / account / media-management product decision, not as an isolated quick feature

### Quality controls
- Hidden spam-blocking is already present on the main public forms
- Shared duplicate matcher extraction and submission duplicate detection improvements are now merged
- Do not open a speculative spam-restoration or duplicate-restoration branch unless a specific regression is found
- Separate profile-accuracy scoring work may still be worth revisiting later only if prior behavior is clearly identifiable in the existing codebase or recent history
- Admin-only duplicate review helper can be revisited later as a separate small maintenance task if needed, but it is not the current default recommendation

### Advertising work
- Revisit unfinished advertising work that was previously identified
- Review prior advertising to-do items and decide what is still relevant versus obsolete
- If future ad performance work is needed, evaluate whether cache duration/invalidation needs tightening
- Do not reopen recent AdSlot cache work unless there is a reproducible production issue

### Technical / deferred backlog
- SEO location landing pages are complete and live — `/coaches/:state/:city`, `/teams/:state/:city`, `/facilities/:state/:city` all deployed; sitemap at `/api/sitemap`; robots.txt in place; do not reopen unless a regression is found
- Admin re-geocode phase 2 is now complete for Facilities, Coaches, and Travel Teams
- If desired later, expand admin re-geocode only if there is a clear need beyond the current one-record-at-a-time admin workflow
- Keep admin-only access
- Do not treat re-geocode as a replacement for manual precision edits on large multi-field complexes
- If desired later, do a deeper `SearchResults.jsx` separation pass:
  - keep current behavior intact
  - avoid reopening stable map/list handoff logic
  - consider separating fetch/filter logic from page-shell UI only if there is a clear maintenance need

### Minor future polish
- Recent small wording and placeholder passes are now complete across the most obvious public-facing surfaces
- If any future wording cleanup happens, keep it very tightly scoped and wording-only
- Do not reopen copy-only cleanup unless a clearly visible straggler is found
- Homepage category card section noted as needing a future layout pass for more "feature card" presence — defer to larger homepage refresh session

---

## Recommended next task
- Favicon / icon overhaul is complete — do not reopen unless a regression is found
- Header logo is replaced with new horizontal lockup — do not reopen unless a visual issue is found
- Safari Favorites tile behavior is a known Safari limitation for new sites — not a code bug; revisit only if Safari changes its behavior
- Phase 1 mobile conversion pass is complete and deployed — do not reopen unless a regression is found
- Next clearest mobile task: Phase 2 conversion pass — review analytics after 1-2 weeks of live traffic data to identify next friction points
- Content page harmonization (AdvertisePage, HelpPage, submit tab shell) is complete — do not reopen unless a regression is found
- Next clearest visual task: homepage category card layout pass — make cards feel more like “sports discovery feature cards” vs clean admin UI tiles (currently deferred)
- SEO location landing pages are complete — submit sitemap to Google Search Console (`https://www.sandlotsource.com/api/sitemap`) to accelerate indexing
- Claimed-owner self-serve editing remains intentionally deferred
- Anti-spam restoration should no longer be the default next-task recommendation
- Duplicate matching behavior should not be reopened unless a real regression is found
- Admin re-geocode tooling is complete and should not be expanded unless a specific need is chosen
- Continue deferring larger claimed-owner account work unless a thread explicitly selects that workstream

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
| `src/components/AdvertisePage.jsx` | Advertiser inquiry page and form |
| `src/components/HelpPage.jsx` | Support / FAQ informational page |
| `src/components/TeamProfile.jsx` | Full team profile modal |
| `src/components/CoachProfile.jsx` | Full coach profile modal |
| `src/components/FacilityProfile.jsx` | Full facility profile page |
| `src/utils/formSpamProtection.js` | Shared honeypot + submit-timing spam protection helper |
| `src/lib/duplicateMatchers.js` | Shared coach / team / facility duplicate matching logic |
| `lib/duplicateCheck.js` | Server-side duplicate check wrapper used by admin email flow |
| `api/geocode-address.js` | Google Geocoding API proxy |
| `api/admin-regeocode.js` | Admin-only facility re-geocode endpoint |
| `src/lib/submit/geocode.js` | Core geocoding logic |
| `api/notify-admin.js` | Admin email notification and coord row injection |
| `lib/emailTemplates.js` | Email HTML templates |
| `api/approve.js` | Email approval handler |
| `src/components/AdminPage.jsx` | Admin panel |
| `src/components/admin/GenericAdminTableContent.jsx` | Generic admin table layout with optional row actions |
| `src/components/admin/AdminCell.jsx` | Generic admin inline cell editor |
| `src/components/HomePage.jsx` | Homepage search and featured sections |
| `src/components/home/FeaturedCard.jsx` | Featured coach and team cards on homepage |
| `src/components/home/HomePageBand.jsx` | Alternating warm-background section wrapper |
| `src/components/home/HomePageSectionHeader.jsx` | Section title and View all link |
| `src/components/home/HomePageAdBand.jsx` | Homepage sponsored ad band wrapper |
| `src/components/CoachDirectory.jsx` | Coach directory (also serves `/coaches/:state/:city` location pages) |
| `src/components/Facilities.jsx` | Facilities directory (also serves `/facilities/:state/:city` location pages) |
| `src/components/TravelTeams.jsx` | Teams directory (also serves `/teams/:state/:city` location pages) |
| `api/sitemap.js` | Vercel serverless sitemap generator — queries Supabase for approved city/state pairs, returns XML |
| `public/robots.txt` | Search crawler rules — points to sitemap |
| `src/components/teams/TeamDesktopRow.jsx` | Team result row layout |
| `src/components/teams/TeamPreviewCard.jsx` | Team preview modal card |
| `src/components/AdSlot.jsx` | Ad slot fetch and render with module-level cache |
| `src/components/SearchResults.jsx` | Search results page |
| `src/components/search/SearchResultsContent.jsx` | Search results content grid and map handoff UI |
| `src/index.css` | Global styles and design tokens |
| `api/admin-claim-requests.js` | Admin claim queue load endpoint |
| `api/review-claim.js` | Admin claim resolution endpoint, ownership creation, verified / claimed updates |
| `src/components/...ClaimRequests...` | Admin claim queue UI pieces for filtering and row actions |

---

## Google Geocoding API details
- Provider: Google Geocoding API
- Endpoint: `https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={key}`
- Environment variable: `GOOGLE_GEOCODING_API_KEY`
- Set in Vercel for Production, Preview, and Development
- Google Cloud project: Sandlot Source
- Free tier: `$200/month` credit (`~40,000` calls)
- Current volume is well under limit
- No rate limiting required

### Related Vercel env notes
- Admin re-geocode tooling relies on server-side Supabase access in Vercel
- `SUPABASE_URL` must be available for Preview and Production
- `SUPABASE_SERVICE_KEY` must be available for Preview and Production
- Do not expose the Supabase service key through browser-side `VITE_*` variables

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
- If `index.lock` error appears during `git add` or `git commit`: `del .git\index.lock` then retry