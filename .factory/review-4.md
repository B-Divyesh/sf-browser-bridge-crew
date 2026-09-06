# Run a browser-tab spaceship repair game — strict review 4

**Verdict: FAIL — 2 Minor findings, 0 untested claims.**

**Reviewed:** 2026-09-06 UTC  
**Live URL:** <https://browser-bridge-crew.sociobot.in>  
**Implementation reviewed:** `2457defb9f1e23c5062769b4680845c9a58a1702`  
**Documentation reviewed:** `61fdf3f315927c322426fb458bf1919051ef7eae`

The documentation commit changes only `.factory/handoff.md` and
`.factory/verification-7.md`. A clean rebuild and the live site have identical
application hashes:

- JavaScript: `0b5a9d81cf5b895ba6bff837de63e9cbaf6dbc09a76316db7265aa6756101872`
- CSS: `181046ae1aee0bf5904f9a4cc19b51d486093482ef3de15efb01015910d16115`

The live room service reports source commit
`e572ad67977e8074e0db2ab447da40e610dc0611`. The backend and container files
are unchanged between that source commit and the reviewed implementation.

## First screen

Fresh Chromium, Firefox, and WebKit contexts opened the live home page at
1440 by 1000 and 390 by 664 without scrolling.

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels.
- **First action:** **Try it with sample data**.

The job, audience, action, and playable sample fault were visible in each
context. There was no horizontal overflow. The short phone layout issue is
R4-2 below.

## Findings

### R4-1 — Minor — leaving active play throws an uncaught error

**Location:** `src/main.ts:481-491` and `src/main.ts:522-525`.

Opening `/demo`, selecting the header **Privacy** link, and waiting 1.2 seconds
produced an uncaught page error in every live engine:

- Chromium: `Cannot set properties of null (setting 'textContent')`
- Firefox: `can't access property "textContent", document.querySelector(...) is null`
- WebKit: `null is not an object (evaluating 'document.querySelector("#time-value").textContent=...')`

The Privacy URL, title, h1, and heading focus are correct. The error occurs
afterward because the old game frame calls `updateUi()` after the game DOM has
been replaced. The frame checks the mutable global `routeAbort`; `renderRoute`
aborts that controller and immediately replaces it, so the old frame sees the
new, un-aborted signal.

This is a common navigation path from active play and a real runtime exception,
even though the destination remains usable. It reproduced without screenshots
or injected styles, so it is not the known Playwright WebKit screenshot CSP
message.

**Repair:** Capture the route signal for each mounted game loop, or cancel its
animation frame during route cleanup. Add a browser regression that opens an
active demo, navigates to Privacy, waits beyond the 250 ms UI interval, goes
Back, and asserts no console or page error.

Evidence: `/work/.evidence/browser-bridge-crew-review-4/demo-route-errors.json`.

### R4-2 — Minor — the short phone first screen hides required supporting facts

**Location:** Live home hero at 390 by 664.

The main action is technically inside the viewport, ending at 663.19 px in a
664 px viewport. Its required explanation, **Opens a repair already in
progress**, starts at 679.19 px. The plain-facts list starts at 747.72 px.
Both require scrolling.

The plain-words first-screen contract requires the primary action with what
happens after selection and three short facts. The job, audience, and action
itself are present, so this is a layout completeness issue rather than a
blocked game path.

**Repair:** Reduce the phone hero height or spacing so the action explanation
and at least three plain facts fit in the initial 390 by 664 viewport. Keep the
scene, job, audience, and action visible.

Evidence:
`/work/.evidence/browser-bridge-crew-review-4/phone-first-screen-bounds.json`
and `chromium-phone-first-screen.png` in the same directory.

## Demo and complete game run

One click entered the isolated demo in Chromium, Firefox, and WebKit. The
persistent **Demo — sample data, nothing is saved** label accompanied 07:48,
76% integrity, three repairs, and 342 points. Reset removed the changed demo
setting, restored those values, and kept a seeded real-storage value unchanged.

Visible Signals, Helm, Power, and Engineering controls repaired the current
fault. Seven visible incorrect Engineering repairs with Assist disabled then
reached the actual **The ship needs another crew** end dialog in every engine.
The dialog showed score, four repairs, 50% accuracy, and numbered game 57231;
focus moved to **Play this seed again**. Replay restored 12:00, 100% integrity,
and zero repairs. No private finish hook was used.

The deterministic success claim separately advanced the exact 720,000 ms clock
with positive integrity. Pause held the visible clock, Resume advanced it, and
Assist and sound settings survived reload. Keyboard and touch paths passed.

## Live multiplayer and backend

Independent real clients used Chromium for the host and Firefox at 390 by 664
for Signals. They created room `TC2YA`, started the run, scanned its fault, and
changed the host from **Scanning Required** to **Life Support**. Reloading the
crew context restored **Control the Signals station** and its connection.
Neither client logged an error. Requests used only the product static and room
service origins, with no personal-data field or media call.

The room service returned health 200, invalid room creation 400, foreign Origin
403, and an expected unknown-route 404. A fresh request bucket allowed 90
requests; request 91 returned 429 with `Retry-After: 60`.

Local authority checks passed file-backed SQLite restart and reconnect,
cross-room token rejection, four roles shared through eight players, ninth
player rejection, exact 1,200,000 ms expiry, and stored-field inventory. No
live service was restarted during this review.

## Accessibility, routes, privacy, and recovery

- Fresh home, demo, Privacy, Terms, and missing routes began on `BODY` in all
  three engines. First Tab reached **Skip to main content**, and Enter focused
  `main`. This proves verification-6 finding V6-1 remains fixed.
- User-initiated navigation and browser Back focused the new h1 in all three
  engines. R4-1 is the separate game-loop cleanup failure on that path.
- Live Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the designed 404
  found zero serious or critical violations in all three engines. The factory
  URL verifier passed with no home-load console error.
- Each checked route had `lang=en`, one h1, one main, its own title, and no
  horizontal overflow. The unknown document returned the designed HTTP 404;
  that response is expected, not a defect.
- Reduced motion set animation and transition duration to `0.00001s` and
  smooth scrolling to `auto`. At 200% root text size, the phone demo kept its
  h1 and banner without document overflow.
- Every discovered internal home-page link returned 200. Empty and short room
  codes announced their correction and returned focus to the input. A valid
  missing room gave the documented recovery message; its API 404 is expected.
- A fresh service-worker context reloaded `/demo` offline with the game and
  offline notice visible. Cache `bridge-crew-v4` controlled the page.
- Demo traffic stayed on the static origin and opened no realtime connection.
  Public and live-room checks found no analytics, external runtime files,
  personal-data inputs, or camera/microphone calls.

## Claims and quality gates

`npm ci` completed in a clean clone. Every exact command in
`.factory/claims.json` passed: 23 of 23. The 23 manifest IDs have exactly 23
matching `@claim:` tags, with no missing, extra, or duplicate tag. No unlisted
public claim was found.

| Claims | Result |
| --- | --- |
| `sample-demo`, `playable-first-screen`, `demo-isolation`, `demo-stations`, `complete-run`, `successful-run`, `round-length`, `deterministic-seed`, `replay`, `settings-persist`, `assist-behavior` | Pass |
| `cross-device-room`, `room-reconnect`, `player-capacity`, `keyboard-controls`, `mobile-frame-rate` | Pass |
| `privacy-local`, `no-personal-data`, `room-storage`, `no-tracking`, `free-play`, `room-expiry`, `offline-reload` | Pass |

`npm test` passed 15 unit/integration tests and 44 browser tests, with two
intentional project-specific skips. `npm run build` passed and produced
`dist/`: 34,049-byte JavaScript (11,357 gzip), 21,531-byte CSS (5,491 gzip),
and a 23,132-byte phone scene. `npm audit --audit-level=high` reported zero
vulnerabilities.

The declared phone run measured 60.0 fps and 59.8 fixed updates per second at
360 by 640 CSS pixels, touch input, and 4x CPU slowdown. Lighthouse reported
100 Performance, 100 Accessibility, 100 Best Practices, and 100 SEO; FCP and
LCP were 1.1 s, TBT 20 ms, and CLS 0.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Review 1 F-1-1 through F-1-5 | Fixed: durable SQLite restart, accurate privacy heading, exact expiry, active-loop fps, and designed HTTP 404 passed. |
| Review 1 F-1-6 through F-1-16 | Fixed: claim cardinality, demo isolation/stations, capacity, personal data, storage, tracking, success, Assist, input, and terms checks passed. |
| Review 1 F-1-17 through F-1-23 | Fixed: the visitor copy remains plain and its privacy and retention statements match checked behavior. |
| Verification 1 | Fixed: independent clients, exact commands, complete visible run, active first screen, and stable full suite passed. |
| Verification 3 | Fixed: the required measured phone frame-rate claim passed. |
| Verification 4 V4-1 | Fixed: current application and static-404 navigation targets pass the 44 px audit. |
| Verification 6 V6-1 | Fixed: fresh routes preserve document focus; skip and user-navigation focus behavior passed in three engines. |
| Verification 2, review 2, review 3, verification 5, verification 7 | Their recorded checks remain positive, but verification 7 did not exercise the delayed active-game route cleanup or all required phone hero content measured in R4-1 and R4-2. |

The separately referenced path
`factory-evidence/browser-bridge-crew-verify-7/qa-report.md` was not present in
the supplied filesystem. The complete repository report
`.factory/verification-7.md` was read, and all material claims were rerun
independently.

Evidence is under `/work/.evidence/browser-bridge-crew-review-4/`.

**FAIL — 2 Minor findings and 0 untested claims.**
