# Repair verification 4 — PASS

**Implementation:** `9f8662c9a1da95bad31908fcddecb683e011779a`  
**Prior report:** `9b019264e3dc58bb022aca5aeb42b3aa8e82c1bb`  
**Live URL:** <https://browser-bridge-crew.sociobot.in>  
**Verified:** 2026-09-05 UTC  
**Result:** **PASS — ready for independent verification**

This is the repair worker's verification, not a replacement for an independent
review.

## Current blocker disposition

The missing mobile frame-rate requirement is repaired at its cause:

- The landing first screen and README state the measured result: **60 fps in an
  emulated mid-range phone test**.
- `.factory/claims.json` now lists `mobile-frame-rate`, bringing the manifest to
  23 unique claims with exactly one tagged test per claim.
- `FixedStepLoop` records frames and real fixed-step updates from the active game
  loop as `PerformanceMeasure` entries. The test does not count an unrelated
  page callback.
- The tagged browser test uses the deterministic sample run, a Moto G4
  360 × 640 touch profile, and Chrome's 4× CPU slowdown. It operates Helm and
  Power, measures two three-second windows, and confirms the displayed clock
  advances.
- The claim states a five-frame shared-runner margin. Its assertions require
  55–65 fps, 58–62 fixed updates per second, a 60 fps declared target, and at
  least five visible clock seconds of progress.
- A deterministic unit regression drives the loop with synthetic 60 Hz times
  and proves inactive time does not cause a catch-up burst.

The exact claim command measured **60.0 fps and 60.0 updates per second**. Three
additional consecutive runs measured 60.0 fps; update rates were 60.0, 59.8,
and 59.8 per second. The deployed app measured **60.002 fps and 60.002 updates
per second** while its visible clock moved from 07:48 to 07:42.

## Clean local verification

`npm ci` completed with zero vulnerabilities. Every exact command in
`.factory/claims.json` passed from committed implementation `9f8662c`:

`sample-demo`, `playable-first-screen`, `demo-isolation`, `demo-stations`,
`complete-run`, `successful-run`, `round-length`, `deterministic-seed`,
`replay`, `settings-persist`, `assist-behavior`, `cross-device-room`,
`room-reconnect`, `player-capacity`, `keyboard-controls`, `mobile-frame-rate`,
`privacy-local`, `no-personal-data`, `room-storage`, `no-tracking`, `free-play`,
`room-expiry`, and `offline-reload`.

- `npm test`: 15 unit/integration tests passed; Playwright reported 37 passed
  checks and one deliberate desktop skip for the phone-only frame profile.
- `npm run build`: passed and produced `dist/`.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Output: app JavaScript 33,755 bytes raw / 11.33 KB gzip; CSS 21,369 bytes raw /
  5.49 KB gzip; mobile hero 23,132 bytes.
- Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0, TBT 50 ms.
- The URL verifier found one h1, `lang=en`, `main`, complete image alt text,
  labelled buttons, and no console errors. Desktop 1440 × 1000 and phone
  390 × 844 had no horizontal overflow.
- Axe found zero serious or critical issues on `/`, `/demo`, `/privacy`,
  `/terms`, and the designed 404 in both profiles. Reduced-motion profiles had
  zero running animations.

Claim logs are under `/tmp/bridge-repair-2-claims/` in this worker. Lighthouse
JSON is `/tmp/bridge-repair-2-lighthouse.json`.

## Live verification

The static deployment completed successfully. The realtime authority was not
redeployed or reconfigured.

- Fresh desktop and phone contexts showed the job, audience, first action,
  action result, frame-rate fact, and playable sample fault before scrolling.
- One click opened the populated demo. Reset restored 76% integrity and three
  repairs while a real-storage sentinel remained unchanged.
- Seven visible incorrect Engineering repairs reached the real loss screen at
  0% integrity. The screen showed score 342, three repairs, 43% accuracy, seed
  57231, and **Play this seed again**. Replay reset integrity to 100% and repairs
  to zero.
- A desktop host created room `X4YTU`; an independent phone joined Signals,
  scanned the fault, updated the host to Life Support, reloaded, and restored
  the Signals station and connected state.
- A fresh live service worker controlled `/demo`, used cache
  `bridge-crew-v4`, and reloaded the populated demo offline with its offline
  status.
- `/`, `/demo`, `/privacy`, `/terms`, `robots.txt`, and `sitemap.xml` returned
  200. `/definitely-missing-repair-2` returned the expected HTTP 404 with the
  designed page, one h1, one main, and no serious/critical Axe issues.
- Static headers retain CSP, `frame-ancestors 'none'`, HSTS, `nosniff`, strict
  referrer policy, and disabled camera, microphone, and geolocation. App assets
  are immutable; HTML revalidates after 30 seconds.
- The realtime health endpoint reports version 1.1.0 and backend source
  `e572ad67977e8074e0db2ab447da40e610dc0611`. A live burst returned 429 with
  `Retry-After: 60`.
- Local and live SHA-256 match: app JavaScript
  `e39c731aef2257d75d7b03c5c7a6d7e76e8cbb19901b5bf0c06d7ebc44c5645c`;
  CSS `ebcf78d99c3cf118e4213be6f47d39d1d4b40c3954166d8d6f63a678d808a0fb`.

Live screenshots and the structured run record are under
`/work/.evidence/browser-bridge-crew-repair-2/`.

## Earlier finding reconciliation

| Finding | Current proof | Status |
| --- | --- | --- |
| F-1-1 durable SQLite | File-backed restart integration passed; backend remains source `e572ad6`; static-only deploy did not touch its one-replica `/data` setup. | Fixed |
| F-1-2 privacy headline | Live h1 is “What your browser and the room service store.” | Fixed |
| F-1-3 exact expiry | `room-expiry` asserts 1,200,000 ms and deletion. | Fixed |
| F-1-4 invalid FPS test | Replaced by the real-loop measurement described above. | Fixed |
| F-1-5 soft 404 | Unknown live document returns HTTP 404 with the standard skeleton. | Fixed |
| F-1-6 duplicate tags | 23 manifest IDs have exactly one source tag each. | Fixed |
| F-1-7 demo isolation | Exact claim and live sentinel/reset check passed. | Fixed |
| F-1-8 player capacity | Four roles, sharing through eight, ninth-player error, and actions passed. | Fixed |
| F-1-9 personal data | Full host flow requests no account, name, chat, media, or recording. | Fixed |
| F-1-10 stored fields | File-backed schema and row inventory claim passed. | Fixed |
| F-1-11 tracking | Public routes and a live-room flow load only product origins. | Fixed |
| F-1-12 all demo stations | All four stations opened and operated in the exact claim. | Fixed |
| F-1-13 success path | Exact 720,000 ms deterministic success test passed. | Fixed |
| F-1-14 Assist behavior | Extra response time and removed penalties passed. | Fixed |
| F-1-15 keyboard map | Arrow, S, number, R, and touch paths passed. | Fixed |
| F-1-16 terms safety claim | Live terms describe supervised play without a broad guarantee. | Fixed |
| F-1-17 privacy heading | Live section is “Privacy and room data.” | Fixed |
| F-1-18–F-1-23 copy | Current README/copy audit retains plain terms for room service, separate devices, numbered game, reconnect code, and deletion; vague request-limit copy remains removed. | Fixed |

## Remaining gaps

None found. The intentional 404 is expected behavior. The measured phone is an
emulated repeatable profile, and the copy says so; no physical handset result
is claimed.
