# Run a browser-tab spaceship repair game — PASS

**Verdict: PASS — 0 findings, 0 untested claims.**

Reviewed 2026-09-06 UTC.

- **Implementation reviewed:** `496681bdfef9154b30e6c7210d74492c372b9874`
- **Documentation/report SHA:** `76df6dbef81a08b3d218bb8fe649feaa39507944`
- **Live URL:** <https://browser-bridge-crew.sociobot.in>

The commits after the implementation change only `.factory` reports. A fresh
build's JavaScript and CSS SHA-256 values exactly match live production:
`e39c731aef2257d75d7b03c5c7a6d7e76e8cbb19901b5bf0c06d7ebc44c5645c` and
`181046ae1aee0bf5904f9a4cc19b51d486093482ef3de15efb01015910d16115`.

## First screen

Fresh live Chromium at 1440 by 1000 desktop and 390 by 664 phone showed,
without scrolling:

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels.
- **First action:** **Try it with sample data**; it opens a repair already in
  progress.

The phone action measured 277.7 by 48 px and ended at 663.2 px in the 664 px
viewport. The playable sample fault was visible. Neither view overflowed or
reported a console/page error.

## Sample and game loop

The action opened `/?demo=1` with its persistent **Demo — sample data, nothing
is saved** label, 07:48, 76% integrity, three repairs, 342 points, and Helm,
Power, Signals, and Engineering. A real-storage sentinel stayed unchanged
after changing Demo Assist. **Reset demo** removed the demo setting and
restored the sample.

Visible Signals, Helm, Power, and Engineering controls repaired the current
fault, increasing repairs from three to four. Seven visible incorrect repairs
with Assist off reached the actual loss dialog, **The ship needs another
crew**, and focused replay. Replay reset to 12:00, 100%, and zero repairs.
Evidence: `/work/.evidence/browser-bridge-crew-review-3/desktop-end-loss.png`.
Phone touch set Helm to +15 degrees. Pause held the clock; resume advanced it.

## Multiplayer and backend

Independent live desktop and phone clients created a room. The phone joined
Signals and scanned; the host changed from **Scanning Required** to
**Engines**. Reloading the phone restored **Control the Signals station** and
the connected state. No account or shared browser state was used.

Health returned 200; invalid state 400; a foreign Origin 403; and an unknown
API route the expected 404. In the request allowance check, requests 1--90
returned 200 and request 91 returned 429 with `Retry-After: 60`. Local tests
also passed tenant-token isolation, file-backed SQLite restart persistence,
four-to-eight capacity and ninth-player rejection, stored-field inventory, and
exact expiry.

## Accessibility, routes, privacy, and recovery

- `/`, `/demo`, `/privacy`, and `/terms` each returned 200 with a distinct
  title, `lang=en`, one h1, and one main landmark.
- A missing document returned the designed **Page not found** response with
  HTTP 404, navigation, main/h1, and a return-home path. Its expected 404
  console entry is not a defect.
- Live Axe scans found no serious or critical issue on every public route and
  the 404. Focus outline is 3 px, visible navigation targets passed 44 px, and
  phone 200% text had no overflow. Reduced motion reduced duration to `0.01ms`.
- Internal links returned 200. CSP, HSTS, `nosniff`, strict referrer policy,
  `frame-ancestors 'none'`, and disabled camera/microphone/geolocation were
  present.
- Demo used only the static origin. Public and live-room traffic used only the
  static origin and the product-owned realtime service. No analytics,
  third-party runtime file, personal-data form, media call, chat, or recording
  request was observed.

## Claims and quality checks

After `npm ci`, I ran every exact command in `.factory/claims.json`, then
`npm test`, `npm run build`, and `npm audit --audit-level=high`.

All 23 claims passed: `sample-demo`, `playable-first-screen`,
`demo-isolation`, `demo-stations`, `complete-run`, `successful-run`,
`round-length`, `deterministic-seed`, `replay`, `settings-persist`,
`assist-behavior`, `cross-device-room`, `room-reconnect`, `player-capacity`,
`keyboard-controls`, `mobile-frame-rate`, `privacy-local`, `no-personal-data`,
`room-storage`, `no-tracking`, `free-play`, `room-expiry`, and
`offline-reload`. Every ID occurs exactly once in test source; no public claim
is unlisted or untested.

`npm test` passed 15 unit/integration tests and 40 browser tests, with two
intentional project-specific skips. Build wrote `dist/`; audit found zero
vulnerabilities. JavaScript is 33,755 bytes (11,330 gzip), CSS is 21,531 bytes
(5,500 gzip), and the mobile hero is 23,132 bytes.

Three fresh idle live Moto G4 360 by 640 touch, 4x CPU-throttled runs measured
60.002, 60.003, and 60.002 fps; fixed updates were 60.002, 59.838, and 59.837
per second. A 51.052-fps measurement taken while the complete claim batch was
concurrently consuming the worker was discarded as contaminated; all isolated
measurements and the exact mobile claim command passed the 55--65 fps margin.

## Earlier finding disposition

All earlier review and verification findings, including minor findings, were
checked. F-1-1 through F-1-5 (durable storage, privacy wording, expiry, FPS,
and 404), F-1-6 through F-1-16 (claims, isolation, capacity, personal data,
storage, tracking, demo stations, win, Assist, keyboard, and terms), and
F-1-17 through F-1-23 (plain wording) remain fixed. Earlier verification
findings for cross-device play, claim commands, frame-check reliability,
visible end path, first-screen game, measured phone FPS, and target size also
remain fixed. Verification 2 had no findings.

Evidence is under `/work/.evidence/browser-bridge-crew-review-3/`.

**PASS — 0 findings of every severity and 0 untested claims.**
