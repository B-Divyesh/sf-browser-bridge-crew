# Bridge Crew repair-2 handoff — PASS

## Result

The release blocker from `.factory/verification-3.md` is repaired. The active
game now has a visitor-facing, measured mobile 60 fps claim and one matching
outcome-based browser regression.

Implementation commit:
`9f8662c9a1da95bad31908fcddecb683e011779a`.
This handoff is a later documentation commit; the implementation SHA above is
the static release deployed to <https://browser-bridge-crew.sociobot.in>.

## What changed

- Added a reusable fixed-step loop that targets 60 updates per second, clamps
  long frames, resets inactive time, and records real active-loop frame/update
  samples.
- Added `mobile-frame-rate` to `.factory/claims.json` and the landing/README
  copy. The claim explicitly names an emulated mid-range phone and a five-frame
  test margin.
- Added a deterministic active-demo browser run on a 360 × 640 Moto G4 touch
  profile with 4× CPU slowdown. It measures two three-second windows, operates
  controls, and verifies visible clock progress.
- Added deterministic unit coverage for the 60 Hz schedule and inactive-tab
  recovery.
- Advanced the offline cache to `bridge-crew-v4` so existing users receive the
  repaired JavaScript.
- Updated the design record and copy audit. No art, realtime code, SQLite
  settings, mounted storage, replicas, secrets, or other products changed.

## Verification

From committed implementation `9f8662c`:

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
```

All 23 exact commands in `.factory/claims.json` also passed. `npm test` passed
15 unit/integration tests and 37 browser checks; one duplicate desktop project
run was intentionally skipped because the frame claim runs only in its declared
phone profile.

The claim and three repeat runs measured 60.0 fps. The deployed app measured
60.002 fps and 60.002 fixed updates per second with a 4× CPU slowdown. Local
Lighthouse scored 100 for Performance, Accessibility, Best Practices, and SEO.
The build is 11.33 KB gzip JavaScript and 5.49 KB gzip CSS.

Cold live desktop and phone checks passed: first-read content, one-click demo,
demo isolation/reset, normal loss and replay, real independent-client room sync
and reconnect, offline reload, route titles, designed HTTP 404, reduced motion,
Axe, security headers, and 429/`Retry-After` behavior. Local/live app JavaScript
and CSS hashes match. Detailed evidence and all earlier finding dispositions are
in `.factory/verification-4.md`.

## Run locally

```sh
npm ci
PORT=8787 DB_PATH=/tmp/bridge-crew.sqlite npm run realtime
npm run dev
npm test
npm run build
```

Use `/?demo=1` for the isolated sample. `/demo` is the stable offline route.

## Deployment and state

`dist/` was deployed to the existing product static app. The product-owned
realtime authority remains version 1.1.0 at backend implementation
`e572ad67977e8074e0db2ab447da40e610dc0611`. It remains a single replica with
SQLite on its existing `/data` mount; this repair did not redeploy or inspect
its configuration.

## Remaining gaps

None found. The performance wording deliberately says **emulated mid-range
phone**; no physical handset measurement is claimed.
