# 週末賞楓地圖

Mobile-friendly static MVP for Kanazawa, Toyama, Tokyo and nearby day-trip autumn foliage destinations.

## Run locally

From this directory, run `python3 -m http.server 4173 --directory dist` and open http://localhost:4173.

Run behavioral checks with `node check-mvp.cjs`.

Firebase integration target: existing project `maple-sakura-ginkgo`, Google Sign-in and Cloud Firestore. Official Firebase agent skills are installed in the workspace `.agents/skills/`; consult the matching skills before Firebase work (see workspace AGENTS.md). MCP is connected and set to the correct project. The existing `MSG map` Web App and `(default)` Standard database in `asia-east1` are reused. Local code now includes authenticated shared plans, invitation acceptance, realtime updates, conflict detection and explicit non-overwriting import of local saves. **Following explicit user approval, shared-plan Security Rules were deployed on 2026-11-02 to maple-sakura-ginkgo/(default) and the remote source was read back and matched exactly.** Legacy /users and /users/{uid}/saves permissions, existing documents, Auth settings and local weekend storage remain unchanged. No website deployment was performed. See [FIREBASE-COLLABORATION.md](FIREBASE-COLLABORATION.md) for scope, prototype rule audit, limitations and approval status. Run `node check-collaboration.cjs` for mock SDK/UI tests; real two-account sign-in and Emulator authorization checks remain outstanding (no Java runtime). HTTP browser QA now loads the map, Firebase SDK and plan manager successfully. Google Sign-in returns auth/unauthorized-domain on 127.0.0.1; authorized-domain configuration must be updated before real two-account testing. No Auth settings were changed. Unsaved markers use `var(--card)` (`#fffdf8`), matching zoom controls, rather than pure white.

Open the HTTP preview URL, not `dist/index.html` via `file://`. File previews deliberately make no OSM tile requests because they cannot provide a valid web Referer. The tile layer uses the documented `https://tile.openstreetmap.org/{z}/{x}/{y}.png` endpoint, linked attribution, normal browser caching and `strict-origin-when-cross-origin` referrer policy. Tile errors show a notice while the spot list remains available. A 200-response block image cannot be identified by the image error event; HTTP preview does not guarantee that an existing provider/IP/WebView block is lifted. Do not bypass a provider block with spoofed headers, cache busting, proxying or host rotation. See [OSMF tile policy](https://operations.osmfoundation.org/policies/tiles/).

## Included

- Compact map controls: no visible logo/title header, no promotional map hint, and value-only area/season triggers with descriptive screen-reader labels. The help button sits beside the foliage legend with a 44px touch target. Marker colors show only personal weekend-save status: saved = red with white lettering, unsaved = white with coffee-brown lettering. Species retain 楓／杏／✉ symbols without different colors. Selection enlarges/outlines a pin without changing saved-status colors. These colors do not indicate live leaf condition.
- Map-first interface inspired by the user's reference video: full-screen map, floating filters, and a non-modal destination sheet that slides and fades in on marker selection.
- Three sheet positions (collapsed / half / expanded), header drag gestures, a keyboard-accessible handle, selected-marker emphasis, and map positioning that accounts for the visible sheet.
- Mobile bottom sheet and desktop lower-left destination card. A separate list drawer opens the same detail sheet. Map background clicks collapse it; close and Escape dismiss it.
- The active destination closes if a new filter excludes it. Switching destinations retains the sheet height. Reduced-motion preferences disable transitions and map animation.
- 96 destination cards: the original 60 mapped destinations plus 36 confirmed-ginkgo destinations in the list and detail view. 25 reviewed new locations now appear on the map (85 mapped total); 11 remain list-only. Nine existing destinations gain ginkgo data without changing their IDs. Only audited coordinates are plotted; venue-area precision remains explicit and unresolved candidates are not plotted; the UI clearly distinguishes map coverage from list-only results.
- One grouped area picker replaces the old region shortcut buttons and dropdown. Global/Hokuriku/Tokyo-area scopes stay pinned above the scrolling prefecture list; Ishikawa, Toyama, Tokyo, Kanagawa, Saitama, Tochigi, Chiba and Ibaraki are directly selectable, with visible subareas.
- Historical peak-season filter: September–December in chronological early/mid/late-month windows, with inclusive interval overlap. Combines with area and personal weekend filters. Default is unrestricted; reset never deletes saved plans.
- The historical season picker supports multiple checked periods (OR/union, never a filled-in interval between disjoint selections). It stays open while toggling, applies changes immediately, and closes with Done, close, Escape or outside click. No checked periods means unrestricted; the pinned unrestricted action clears selections. Results still intersect with region and personal weekend. Species marker states are evaluated across all selected periods; the trigger uses chronological labels or a selection count.
- Filter pickers use a native modal dialog for background blocking, focus containment and Escape dismissal. Mobile uses a bottom sheet; desktop uses a floating panel. Current selections have checkmarks and clear labels.
- Tokyo data is maintained in `dist/tokyo-spots.js`. Ginkgo-dominant destinations are identified separately from maple destinations.
- X searches use quoted Japanese place names, `filter:images` and `f=live`, without adding 紅葉.
- Google Maps links resolve Japanese place names and addresses.
- Destination sharing uses stable `?spot=<id>` links on the current project URL. Opening a link selects the marker and opens its detail sheet; browser Back/Forward restores destination selection. Conflicting filters are cleared without altering saved plans. Unknown IDs fall back to the map with a friendly message.
- The share action uses the system share sheet when available, with a copy-link dialog fallback. Cancelling native sharing is silent. Shared URLs exclude personal weekend plans and filter parameters. Localhost links are for local preview only; sharing with friends requires a reachable deployment and appropriate access permissions.
- Independent 44px copy buttons copy the exact Japanese name, Traditional Chinese name, or address. Identical names are displayed once with a Traditional Chinese same-name indicator. Successful copies show a brief status toast; clipboard denial/unavailability presents selectable text and manual-copy guidance.
- The icon-only share action sits in the title toolbar between Japanese-name copy and close, with an accessible label and desktop tooltip. The two external destination actions remain below the title.
- Destination details use a consistent system-font hierarchy: 24px title, 16–17px primary values, 14px field labels, 15px source links, and 13px metadata. Historical season, personal weekend and address have aligned leading icons and separators; source links and verification notes form a separate footer. Rem-based type supports browser text-size preferences.
- Shared UI tokens in `dist/design-system.css` extend the detail panel's typography, secondary-text contrast, 44px controls, rounded corners and spacing across the exploration controls, area/season pickers, destination list, help panel and share/copy dialog. The map's existing colors, interactions and sheet behavior are preserved.
- Every visible list card has independent, icon-only X and Google Maps links with 44px targets, destination-specific accessible labels and tooltips. They open new tabs without triggering the summary button or changing the current selection. X uses the same Japanese search-name overrides, image filter and latest ordering as the detail panel.
- Every list card also has a labeled personal-weekend selector, sharing the exact options, empty default and browser storage with the detail panel. Changes synchronize both views and immediately respect the active weekend filter; keyboard focus returns to the replacement select, or the drawer close control when the edited spot leaves the results.
- The list's weekend selector and the X/Google Maps shortcuts share one aligned action row. The selector flexes into available width; both icon buttons retain 44px targets on phone and desktop layouts.
- Historical season labels and species date rows are omitted from list cards for a simpler browsing view; they remain in destination details. The list retains destination names, external links, location status and personal-weekend selection.
- Three real Saturday/Sunday ranges: this weekend, next weekend and the following weekend. Sundays retain the weekend currently in progress.
- Every destination starts with an empty selection. Each user saves one personal expected weekend per destination in their own browser.
- Weekend and area filters update cards and map markers together.
- Saved dates remain available after the three-week window changes.
- Storage failure and corrupt saved data do not prevent viewing the destinations.

## Sources and coverage

Coordinate audit (2026-11-02): [GINKGO-COORDINATES.md](GINKGO-COORDINATES.md) documents all 36 previously unmapped destinations. `research/ginkgo-coordinate-audit.source.json` retains evidence, candidates and review decisions; `research/ginkgo-coordinate-updates.json` prepares 25 reviewed schematic area-marker updates and withholds 11 unresolved or unsuitable candidates. Only two of the 25 represent documented ginkgo viewing areas; the other 23 are venue/corridor references, not exact trees or entrances. These updates are **applied locally**: the active site has 85 mapped destinations and 11 list-only destinations. The prepared data does not change seasonal dates, addresses, IDs, sharing or saved weekends. Validate with `node research/prepare-ginkgo-coordinate-updates.cjs --check`; the generator accepts only coordinates matching the approved audit records. Deployment remains pending.

Ginkgo expansion (2026-11-02): see [GINKGO-RESEARCH.md](GINKGO-RESEARCH.md) and `research/ginkgo-spots.json`. The 47-entry research inventory generates `dist/foliage-data.js`; the app integrates 45 individually confirmed ginkgo records (9 existing + 36 new). Two group-level observations are withheld. Sources and unknown dates remain explicit. Only documented species-specific ranges match the date filter; candidate and conflicting ranges never do. Existing unresearched red-foliage records retain legacy filtering; researched records do not copy generic legacy dates to either species. 25 new records carry reviewed coordinates with precision metadata; 11 withheld records remain null. Original map references are retained separately as provenance, never used as fallback pins. The list, detail, share, copy, external links and saved-weekend features work for the new records even without map pins.

`dist/foliage.js` keeps one destination ID/share URL and one saved weekend, with separate `maple`/`ginkgo` presence and date ranges. Filtered markers use a real envelope SVG when both species match, 楓 for maple/red foliage, 杏 for ginkgo. Without a date filter the icon represents known species, not live color. Details and cards display separate species rows with readable dates or an explicit unknown state. Regenerate outputs using `node research/prepare-ginkgo-research.cjs --patch` through apply_patch; verify with `node research/prepare-ginkgo-research.cjs --check` and `node check-mvp.cjs`.

Research date: 2026-11-01.

- https://tenki.jp/kouyou/4/19/ — all 12 Toyama destinations represented.
- https://tenki.jp/kouyou/4/20/ — all 6 Ishikawa destinations represented.
- https://travelhub.slt-inc.jp/koyo/toyama/
- https://travelhub.slt-inc.jp/koyo/ishikawa/
- https://www.kanazawa-kankoukyoukai.or.jp/article/detail_152.html
- https://www.info-toyama.com/stories/koyou
- Destination-specific links are included in the cards.
- Tokyo: https://www.gotokyo.org/en/story/guide/autumn-leaves-forecast/index.html and individual Tokyo Metropolitan Park Association pages.
- Regional day trips: Hakone, Kamakura, Nikko and Nagatoro official tourism websites, linked from each card.
- See `TOKYO-RESEARCH.md` for the added destination inventory and research decisions.

The full TRAVEL HUB lists contain 26 Toyama entries and 34 Ishikawa entries, including overlapping names and wider regions. This MVP covers a researched subset; it does not yet claim full coverage of both lists. Remaining entries need address and map-position verification before import.

Pins represent destination areas, not a verified parking lot or trail entrance. Historical seasons vary by source and year. X posting dates may differ from photo capture dates.

## Verification

`node --check dist/app.js`, `node --check dist/foliage.js`, `node research/prepare-ginkgo-research.cjs --check` and `node check-mvp.cjs` pass. Checks cover 96 unique destinations, independent species seasons, marker variants, unknown/candidate season exclusion, list-only coverage, new deep links, no fabricated coordinates, prefecture groups, original and new saved-plan preservation, weekday/weekend/year rollover, empty defaults, save/reload/clear, combined filters, old saved dates, X URL rules, corrupt data and blocked storage.

The local site was verified in the browser at phone and desktop viewport sizes. Checks included marker selection, upward drag to expand, height buttons, switching destinations while retaining height, background-click collapse, close, list-to-detail navigation, and saving/filtering a weekend from the sheet. Temporary test selections were restored. Data and interaction regression checks pass. Hosted deployment remains pending.

The active interface uses `dist/map-ui.css`, `dist/sheet-ui.js`, `dist/filters-ui.js` and `dist/spot-tools.js`; `dist/styles.css` is retained from the previous interface and is no longer loaded.

Sharing/copy checks additionally cover exact copied values, clipboard denial, share payload and cancellation, unsupported native sharing, clean URLs, direct-link filter conflicts, missing destinations, and selection restoration. Native iOS share-sheet presentation still requires verification on a physical iPhone; automated checks exercise the native API branches and the local browser confirms copying and link navigation.

## Hosting

Site identity is persisted in `.openai/hosting.json`. No source-repository credential is stored in this project. The existing private Site must be reused rather than recreated.

Source upload and deployment are pending explicit user approval after automatic approval review rejected export to the Sites source repository. Do not bypass that decision.


Weekend assignment update (2026-11-02): detail and list selectors support `skip` (「這次不去」) alongside a Saturday date and empty selection. The dedicated skip filter intersects with region/season; 「所有已存週末」 includes dates only, and 「尚未選擇」 excludes explicit skips. Local choices use the existing browser key and are never automatically uploaded. Firestore keeps the same revisioned assignment document: `weekend` is a Saturday Timestamp, exact `skip`, or null for clearing. Membership, conflicts, owner controls and deletion restrictions are unchanged. A committed transaction returns its value/revision so the UI refreshes immediately; older snapshots and pending writes cannot replace a confirmed choice. Regression coverage includes local persistence, detail/list rendering, delayed snapshots, failures and 209 emulator authorization checks.
