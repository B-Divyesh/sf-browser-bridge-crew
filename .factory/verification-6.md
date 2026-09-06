# Verify cross-browser cooperative spaceship repair game — FAIL

**Verdict:** **FAIL — 1 Minor finding, 0 untested claims**

**Job:** Verify that teachers and youth-group hosts can run a browser-tab
spaceship repair game from a shared display while players use school browsers.

**Implementation reviewed:** `496681bdfef9154b30e6c7210d74492c372b9874`

**Documentation reviewed:** `10acc2efe2f80f69520e9e8271c2f90f6d9963cd`

**Live URL:** <https://browser-bridge-crew.sociobot.in>

**Verified:** 2026-09-06 UTC

The documentation commit changes only `.factory` reports. Rebuilt static
assets match the live JavaScript and CSS byte for byte. The live room service
reports source commit `e572ad67977e8074e0db2ab447da40e610dc0611`; its backend
file is unchanged between that commit and the reviewed implementation.

## First screen

Fresh desktop and 390 by 664 phone-sized contexts opened the live page without
scrolling.

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels.
- **First action:** **Try it with sample data**. It says it opens a repair
  already in progress.

These elements were visible before scroll in Chromium 145.0.7632.6, Firefox
146.0.1, and WebKit 26.0. The phone layouts had no horizontal overflow.

## Finding

### V6-1 — Initial route focus skips the skip link

**Severity:** Minor

**Location:** Live application routes; `src/main.ts:523` in the reviewed
implementation.

**Observed behavior:** A fresh live `/` route programmatically focuses its
`<h1>`. The first Tab then focuses **Try it with sample data** rather than
**Skip to main content**. The skip link exists, but reaching it requires six
reverse-Tab presses from that first control.

**Why it matters:** The application moves focus before the user chooses to
navigate. This prevents the skip link from being the first keyboard bypass
control and skips the header navigation in the normal forward Tab order.

**Reproduce:**

1. Open <https://browser-bridge-crew.sociobot.in> in a fresh desktop browser.
2. Without clicking, inspect `document.activeElement`: it is the page `h1`.
3. Press Tab once. Focus is **Try it with sample data**, whose href is
   `/?demo=1`, rather than the skip link whose href is `#main`.

**Evidence:** `live-recovery-a11y.json` records the initial `H1` focus and
the first Tab result. The source queues `h1.focus()` on every `renderRoute()`,
including the initial load.

**Repair:** Do not move focus on the initial render. Move focus to the new
heading only after an in-app route change or history navigation. Add a browser
test that starts with no user interaction, Tabs once to the skip link, then
uses Enter to reach `#main`.

## Cross-browser game runs

The public copy promises browser play and does not limit supported engines, so
this verification added Firefox and WebKit rather than repeating Chromium-only
coverage. Playwright 1.58.2 browsers and Linux dependencies were installed
before the runs.

| Engine | Desktop | Phone-sized 390 × 664 | Real room client | Result |
| --- | --- | --- | --- | --- |
| Chromium 145.0.7632.6 | Complete demo loss, replay, reload | Touch station control | Separate host and crew contexts; crew reload recovered Signals | Pass |
| Firefox 146.0.1 | Complete demo loss, replay, reload | Touch-enabled viewport and tap controls | Separate host and crew contexts; crew reload recovered Signals | Pass |
| WebKit 26.0 | Complete demo loss, replay, reload | Touch station control | Separate host and crew contexts; crew reload recovered Signals | Pass |

Firefox Playwright does not implement its `isMobile` emulation flag. It did run
the same 390 by 664 `hasTouch` viewport and tap flow. This is a worker-browser
limitation, not a product defect.

For each engine, a fresh context entered the one-click sample, saw the
persistent **Demo — sample data, nothing is saved** label, sample time 07:48,
and 76% integrity. Keyboard `S` scanned the fault; touch selected Helm +15°.
Reset returned the sample state. Seven visible incorrect repairs reached the
actual **The ship needs another crew** end screen. **Play this seed again**
restored zero repairs and 100% integrity. Muting sound survived reload.

Chromium and Firefox instrumented Web Audio: no context started before a user
gesture, and a successful visible repair started sound afterward. A WebKit
successful repair had no browser console or page error. Playwright WebKit
injects a stylesheet when taking a screenshot, which conflicts with the
site's strict `style-src 'self'` policy and produces a synthetic CSP console
message. A no-screenshot WebKit load and repair had no such message; this is
worker screenshot infrastructure, not a product defect.

## Multiplayer and service checks

Each engine created a real live room, started the run, and joined a separate
phone-sized context as Signals. A tap on **Scan active fault** changed the host
from **Scanning Required**. Reloading that crew context restored Signals and
the room connection. The contexts had independent storage.

The live product-owned room service returned health 200 and `status: ok`.
`POST /rooms` with `{}` returned 400. A request with a foreign Origin returned
403. A dedicated, harmless unknown-route request bucket returned 404 for
requests 1–90 and 429 on request 91 with `Retry-After: 60`.

The clean-checkout unit authority checks also passed the file-backed SQLite
restart/reconnect path, cross-room token isolation, exact 20-minute expiry,
four roles and shared stations through eight players, ninth-player rejection,
and stored-field inventory.

## Demo, recovery, accessibility, privacy, and routes

- The demo used the separate `demo:` storage namespace. Reset restored sample
  values and **Start for real** removed demo data without changing a seeded
  real-data sentinel.
- Invalid short and missing room codes gave the documented error and returned
  focus to `#room-code`.
- Reduced-motion mode matched and set transition and animation duration to
  `0.00001s`. At 200% root text size, the phone layout had no overflow and
  kept the h1 and demo label present.
- Live Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and a deliberate 404
  reported zero serious or critical violations. The factory URL verifier
  reported title, `lang=en`, one h1, main landmark, image alt text, and zero
  load console errors.
- Public routes returned 200 with their own titles. An unknown document
  returned the designed HTTP 404, not a soft 404. All discovered internal
  links returned 200.
- The demo has no realtime connection. Public pages and real rooms used only
  the static product origin and the product-owned room-service origin. No
  names, accounts, chat fields, media APIs, analytics, or third-party runtime
  files were observed.

## Claims and quality checks

From this clean checkout, `npm ci` completed successfully. I ran every exact
command in `.factory/claims.json`; all 23 commands passed. Every manifest ID
has exactly one matching `@claim:` test and there are no extra claim tags.

| Claims | Result |
| --- | --- |
| `sample-demo`, `playable-first-screen`, `demo-isolation`, `demo-stations`, `complete-run`, `successful-run`, `round-length`, `deterministic-seed`, `replay`, `settings-persist`, `assist-behavior` | Pass |
| `cross-device-room`, `room-reconnect`, `player-capacity`, `keyboard-controls`, `mobile-frame-rate` | Pass |
| `privacy-local`, `no-personal-data`, `room-storage`, `no-tracking`, `free-play`, `room-expiry`, `offline-reload` | Pass |

`npm test` passed 15 unit/integration tests and 40 browser tests, with two
intentional project-specific skips. The mobile measured claim reported 60.0
fps and 60.0 fixed updates per second at 360 by 640 with touch and a 4× CPU
slowdown. `npm run build` passed and wrote `dist/`; it produced 33.76 KB Java-
Script (11.33 KB gzip) and 21.53 KB CSS (5.50 KB gzip). `npm audit
--audit-level=high` found zero vulnerabilities.

## Earlier finding disposition

All earlier report findings remain fixed or covered, except the new V6-1
finding above.

| Earlier item | Current disposition and proof |
| --- | --- |
| Review 1 F-1-1 durable SQLite | Fixed: file-backed restart/reconnect unit check passed; live authority is healthy. |
| F-1-2 privacy heading | Fixed: live Privacy h1 names browser and room-service storage. |
| F-1-3 exact expiry | Fixed: 1,200,000 ms default and deletion behavior claim passed. |
| F-1-4 measured 60 fps | Fixed: 60.0 fps and 60.0 fixed updates/s measured. |
| F-1-5 soft 404 | Fixed: live unknown document returned designed HTTP 404. |
| F-1-6 through F-1-15 claim, demo, capacity, data, success, Assist, and input gaps | Fixed: 23 manifest IDs occur once; all exact commands passed. |
| F-1-16 through F-1-23 plain wording, privacy, and rate-limit gaps | Fixed: live routes and service checks matched the corrected copy and behavior. |
| Verification 1 cross-device, command, frame, end-screen, and first-screen issues | Fixed: independent live engine room runs, exact commands, 60 fps claim, real end screens, and first-screen sample passed. |
| Verification 3 phone frame measurement | Fixed: measured claim passed. |
| Verification 4 navigation target size | Fixed: the full suite's 44 px navigation audit passed. |
| Verification 2, verification 5, review 2, and review 3 | No unresolved finding was recorded; their claimed behavior was rechecked above. |

## Evidence and result

Evidence is in `/work/.evidence/browser-bridge-crew-verify-6/`, including
per-claim logs, engine run JSON, end-screen screenshots, live route headers,
backend allowance evidence, URL-verifier output, Axe output, and build logs.

**FAIL — 1 Minor finding and 0 untested claims.**
