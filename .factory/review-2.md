# Run a browser-tab spaceship repair game — PASS

**Verdict: PASS — 0 findings, 0 untested claims.**

Reviewed on 2026-09-05 UTC.

- **Implementation reviewed:** `496681bdfef9154b30e6c7210d74492c372b9874`
- **Documentation/report base:** `ab73e311034b96ae1c93a7a34677bcd561e81b7c`
- **Live URL:** <https://browser-bridge-crew.sociobot.in>

The implementation-to-documentation diff contains only `.factory/handoff.md`
and `.factory/verification-5.md`. A fresh build's JavaScript and CSS SHA-256
values exactly match the live files, so the live static product is the reviewed
implementation.

## First screen

Fresh, isolated Chromium contexts opened the live home page at scroll position
zero in a 1440 by 1000 desktop viewport and a 390 by 664 phone viewport.

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels.
- **First action:** **Try it with sample data**; it says it opens a repair
  already in progress.

All three were visible without scrolling. The phone action was fully visible
at 277.7 by 48 CSS pixels, ending at 663.2 px in the 664 px viewport. The
first screen also contains a working **Scan sample fault** control. Neither
viewport had horizontal overflow or a console/page error.

## Sample sandbox and game run

The first action opened `/?demo=1` into a populated repair: 07:48 remaining,
76% integrity, three repairs, 342 points, sample room Q7K4P, and a scanned
fault. **Demo — sample data, nothing is saved** remained visible throughout.

A separate `bridge:review2-sentinel` key was set before entering the demo.
Changing Assist created only `demo:bridge:settings`; **Reset demo** restored
the displayed sample and removed that demo setting while the real sentinel
remained `real`. The demo exposed Helm, Power, Signals, and Engineering.

Using the visible Signals clue, Helm bearing, Power route, and Engineering
glyph controls repaired the fault and raised repairs from three to four.
With Assist disabled, seven visible incorrect repair attempts reached the
actual loss dialog, **The ship needs another crew**. The dialog focused
**Play this seed again**. Replay reset the displayed run to 12:00, 100%
integrity, and zero repairs. End-screen evidence was captured at
`/tmp/bridge-live-end-review-2.png` during the review.

## Live rooms and backend

Separate live desktop and phone browser contexts created room `22DVQ`. The
phone joined Signals, scanned the active fault, and the desktop host changed
from `Scanning required` to `Life Support`. Reloading the phone restored
**Control the Signals station** and its room connection.

The product-owned room service returned health 200. An invalid room payload
returned 400, a foreign Origin returned 403, and an unknown API route returned
the expected 404. In a separate request bucket, request 91 returned 429 with
`Retry-After: 60`. Local deterministic tests passed room-token isolation,
file-backed SQLite restart persistence, the eight-player boundary, and exact
20-minute expiry.

## Accessibility, privacy, routes, and recovery

- Live `/`, `/demo`, `/privacy`, and `/terms` returned 200 with their own
  titles, `lang=en`, one h1, one main landmark, and no console/page errors.
- A deliberate unknown document returned the designed **Page not found** page
  with HTTP 404. Its browser console 404 was expected, not a defect.
- Axe found zero serious or critical violations on the four public routes and
  the 404 route. Keyboard Arrow and number controls changed their visible
  station state. Reduced-motion media changed transitions to `0.01ms` and
  smooth scrolling to `auto`.
- Live demo traffic used only `browser-bridge-crew.sociobot.in`; a real room
  used that origin and the product-owned realtime origin. No account/name/chat
  fields, media calls, analytics, or third-party runtime files were observed.
- The offline reload, invalid-code, absent-room, pause/resume, settings,
  reconnect, reset, replay, keyboard/touch, and mobile frame-rate paths are
  covered by passing declared claims and the complete browser suite.

## Claims and quality gates

After `npm ci`, every exact command in `.factory/claims.json` completed
successfully from this checkout. The manifest has 23 entries; all 23 tags
occur exactly once in test source, with no missing or extra tag. This includes
the complete run, exact 12-minute win, settings, assist behavior, cross-device
rooms, reconnect, capacity, privacy, storage, tracking, expiry, offline, and
phone frame-rate claims.

`npm test` passed 15 unit/integration tests and 40 browser tests; two desktop
duplicates of phone-only checks were intentionally skipped. `npm run build`
passed and produced `dist/`; `npm audit --audit-level=high` found zero
vulnerabilities. Build output is 33,755 bytes JavaScript (11,263 bytes gzip),
21,531 bytes CSS (5,491 bytes gzip), and a 23,132-byte mobile scene image.

A fresh live Moto G4 browser profile (360 by 640 CSS pixels, touch, 4× CPU
slowdown) measured 60.002 fps and 60.002 fixed updates per second across two
three-second active-play windows.

Fresh/local and live hashes matched:

- JavaScript: `e39c731aef2257d75d7b03c5c7a6d7e76e8cbb19901b5bf0c06d7ebc44c5645c`
- CSS: `181046ae1aee0bf5904f9a4cc19b51d486093482ef3de15efb01015910d16115`

## Earlier findings

All items in review 1 and verification 1–5 were inspected. Their disposition
remains **fixed**: durable `/data` SQLite and restart persistence; clear
room-service privacy wording; exact expiry and active-loop frame-rate tests;
designed HTTP 404; one tag per claim; isolated/resettable demo; 4–8-player
capacity; no personal-data/media/tracking paths; audited storage fields;
success and Assist behavior; full keyboard/touch map; plain visitor wording;
and 44 px navigation targets. Verification 2 had no findings. The only
verification-4 finding (navigation targets below 44 px) remains fixed; the
current suite measured all tested application and static-404 navigation
targets at least 44 by 44 CSS pixels.

The evidence in `.factory/verification-5.md` is consistent with this fresh
review. There are no unresolved earlier findings, no new finding, and no
untested public claim.
