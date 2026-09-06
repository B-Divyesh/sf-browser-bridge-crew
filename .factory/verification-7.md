# Run a browser-tab spaceship repair game — PASS

**Verdict: PASS — 0 findings, 0 untested claims.**

**Verified:** 2026-09-06 UTC  
**Live URL:** <https://browser-bridge-crew.sociobot.in>  
**Implementation reviewed:** `2457defb9f1e23c5062769b4680845c9a58a1702`  
**Documentation reviewed:** `71410a69e74276c7ce672c767ee3321ece3db6ce`

The documentation SHA is report-only. A clean local rebuild has the same
SHA-256 as the live `/assets/app.js`:
`0b5a9d81cf5b895ba6bff837de63e9cbaf6dbc09a76316db7265aa6756101872`.
The product-owned room service is healthy and reports source commit
`e572ad67977e8074e0db2ab447da40e610dc0611`; its backend is unchanged from
the reviewed implementation.

## First screen

Fresh Chromium, Firefox, and WebKit desktop contexts and 390 by 664
phone-sized contexts opened the live home page without scrolling.

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels in school browsers.
- **First action:** **Try it with sample data**. It opens a repair already in
  progress.

The first screen includes a playable sample fault and had no horizontal
overflow at every tested size. It began with normal `BODY` focus; first Tab
reached **Skip to main content**, and Enter focused `main`.

## Demo and game run

One click entered the isolated demo in every engine. It showed the persistent
**Demo — sample data, nothing is saved** label, 07:48 remaining, 76% integrity,
three repairs, and 342 points. Reset restored the sample and removed demo
settings while a seeded real-storage sentinel remained unchanged. The demo made
no realtime request.

In Chromium, Firefox, and WebKit, seven visible incorrect Engineering repairs
with Assist disabled reached the real **The ship needs another crew** dialog.
The end screen showed score 342, three repairs, 43% accuracy, and seed 57231.
**Play this seed again** restored 12:00, 100% integrity, and zero repairs.
The deterministic successful end condition is covered by the passing
`successful-run` claim, which advances the exact 720,000 ms clock with positive
integrity.

Keyboard and touch paths worked. The local active-loop claim measured 60 fps
and 60 fixed updates per second on the documented Moto G4 360 by 640 touch
profile with 4x CPU slowdown.

## Navigation, accessibility, and recovery

- Fresh home, demo, Privacy, Terms, and missing routes began on `BODY`; Tab
  reached the skip link and Enter focused `main`.
- In-app Privacy navigation and browser Back focused the destination h1 in all
  three engines. WebKit desktop does this after its next render frame, confirmed
  after 100 ms rather than treating immediate pre-frame focus as a failure.
- Live Axe scans on `/`, `/demo`, `/privacy`, `/terms`, and the designed HTTP
  404 found zero serious or critical violations. The factory URL verifier
  passed title, `lang=en`, one h1, main, image alternatives, labelled controls,
  and no home-page console errors.
- Reduced motion set transition and animation duration to `0.00001s`. At 200%
  root text size the phone demo retained h1 and demo label without overflow.
- A fresh demo service-worker visit reloaded successfully offline with the game
  and offline notice visible.
- All 25 discovered internal-link instances returned 200. An unknown document
  returned the styled HTTP 404 with its own title, h1, main, and return link.
  The browser's expected HTTP-404 resource notice is not an application error.

## Live rooms, privacy, and service boundaries

Two independent live contexts created room `HVRL9`, started a run, joined
Signals from a phone-sized context, and scanned the active fault. The host
changed from **Scanning required** to **Life Support**. Reloading the crew
context restored Signals and its room connection.

The demo requested only the product origin. The product asks for no names,
accounts, chat, cameras, microphones, or recordings. The live room service
returned health 200, invalid room creation 400, foreign-Origin health 403, and
429 with `Retry-After: 60` after its 90-request IP allowance. The two boundary
requests preceding the allowance loop consumed two slots, explaining why loop
request 90 was the expected 429.

Local authority tests passed durable file-backed SQLite restart/reconnect,
cross-room token isolation, stored-field inventory, exact 1,200,000 ms room
expiry, four roles, sharing through eight players, and ninth-player rejection.

## Claims and quality gates

`npm ci` completed from a clean checkout. `npm audit --audit-level=high`
reported zero vulnerabilities. Every exact command in `.factory/claims.json`
passed: 23 of 23. The 23 manifest IDs have exactly 23 matching `@claim:` tags,
with no missing IDs, extras, or duplicates.

| Claims | Result |
| --- | --- |
| `sample-demo`, `playable-first-screen`, `demo-isolation`, `demo-stations`, `complete-run`, `successful-run`, `round-length`, `deterministic-seed`, `replay`, `settings-persist`, `assist-behavior` | Pass |
| `cross-device-room`, `room-reconnect`, `player-capacity`, `keyboard-controls`, `mobile-frame-rate` | Pass |
| `privacy-local`, `no-personal-data`, `room-storage`, `no-tracking`, `free-play`, `room-expiry`, `offline-reload` | Pass |

`npm test` passed 15 unit/integration tests and 44 browser tests, with two
intentional project-specific skips. `npm run build` passed and produced `dist/`:
34,049-byte JavaScript (11,357 gzip), 21,531-byte CSS (5,491 gzip), and a
23,132-byte phone scene.

## Earlier finding disposition

| Earlier item | Current disposition |
| --- | --- |
| Review 1 F-1-1 through F-1-5 | Fixed: durable SQLite restart, accurate privacy heading, exact expiry, active-loop fps, and designed HTTP 404 passed. |
| Review 1 F-1-6 through F-1-16 | Fixed: claim cardinality, demo isolation/stations, capacity, personal-data, storage, tracking, success, Assist, and input checks passed. |
| Review 1 F-1-17 through F-1-23 | Fixed: live visitor copy remains plain and its privacy/rate-limit statements match checked behavior. |
| Verification 1 | Fixed: real separate clients, exact claim commands, deterministic complete run, active first screen, and stable full suite passed. |
| Verification 2, review 2, review 3, verification 5 | No unresolved finding was recorded; their required behavior was rechecked. |
| Verification 3 and fps concern | Fixed: the declared measurement remains 60 fps and 60 updates/s. |
| Verification 4 V4-1 | Fixed: passing suite covers 44 by 44 pixel app and static-route navigation targets. |
| Verification 6 V6-1 | Fixed: fresh routes preserve focus, first Tab reaches skip link, Enter reaches main, and user navigation/Back focus headings in three engines. |

## Evidence

Factory URL-verifier output, screenshots, and JSON are in
`/work/.evidence/browser-bridge-crew-verify-7/`. Clean claim, full-suite,
build, browser, room, and service output was observed during this verification.

**PASS — 0 findings of every severity and 0 untested claims.**
