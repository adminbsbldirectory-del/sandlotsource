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
- Add SEO location landing pages for Teams:
  - route pattern `/teams/:state/:city`
  - reuse current `TravelTeams` UI / query logic
  - do not weaken ZIP-first browse / search
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
- Homepage Enter search and preview close behavior is now complete and should not be reopened unless a regression is found
- Next clearest visual task: homepage category card layout pass — make cards feel more like “sports discovery feature cards” vs clean admin UI tiles (currently deferred)
- Alternatively: SEO location landing pages for Teams (`/teams/:state/:city`) — low logic risk, reuses existing directory UI
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
| `src/components/CoachDirectory.jsx` | Coach directory |
| `src/components/Facilities.jsx` | Facilities directory |
| `src/components/TravelTeams.jsx` | Teams directory |
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