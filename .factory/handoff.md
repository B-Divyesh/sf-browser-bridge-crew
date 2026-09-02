# Bridge Crew repair handoff

## Result

The independent verifier’s blockers from report commit
`f54725631f7e3f3a53bb14110e6dbb45d2364b7e` are repaired and deployed.

- `https://browser-bridge-crew.sociobot.in` serves the static browser game.
- `https://browser-bridge-crew-realtime.sociobot.in` is the product-owned
  WebSocket authority on `sf-browser-bridge-crew-realtime`.
- The realtime service reports version `1.1.0` and source commit
  `1d51d3cd33501a024e10aa07aa4f89a0e3f6ada4`.

## Repairs

- Replaced `localStorage` and `BroadcastChannel` room transport with a
  same-product WebSocket service. Five-character codes now work across
  separate browser profiles and devices.
- Added synchronized station roles, random per-tab reconnect tokens, current
  state restoration, automatic reconnect, 20-minute expiry, an eight-player
  ceiling, origin checks, 4 KB message limits, and HTTP/WebSocket rate limits.
- Kept the demo local-only and offline. Demo keys remain under
  `demo:bridge:` and never open a realtime connection.
- Corrected the `deterministic-seed` claim command from unsupported `--grep`
  to Vitest’s `-t` filter.
- Removed `window.__bridge.finish()`. The browser regression now repairs one
  fault, disables Assist, and uses normal repair controls until integrity
  reaches zero and the real end dialog opens.
- Serialized the desktop/mobile browser projects and measured two-second
  animation-frame windows. This removes CPU contention from the FPS claim.
- Put a working sample fault control in the first viewport on desktop and
  390 px mobile so the initial capture shows playable game state.
- Updated privacy copy, CSP, README, design notes, demo instructions, claims,
  and the copy audit for cross-device rooms.

## Exact regression coverage

- `tests/unit/realtime.test.ts` starts an isolated authority and proves short
  codes, role presence, cross-client actions, token reconnect, server expiry,
  429 plus `Retry-After`, and file-backed SQLite rollback-journal behavior.
- `tests/e2e/bridge.spec.ts` opens host and crew in separate
  `browser.newContext()` instances, including the verifier’s shared host URL.
- The normal end test has no time/state/finish shortcut. A repository search
  contains no `__bridge` hook.
- `.factory/claims.json` contains 16 claims. Every listed command was run
  verbatim and passed.

## Local verification — 2026-09-02 UTC

From a clean dependency install:

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
```

- `npm ci`: passed; 0 audit vulnerabilities.
- Final `npm test`: 8 unit/integration tests and 30 Playwright checks passed.
  Playwright covered desktop Chromium and touch-enabled 390 px Chromium.
- Two additional consecutive full-suite runs passed while stabilizing the
  FPS gate. All 16 claim commands then passed exactly as listed.
- Axe Playwright scans found 0 serious or critical findings on `/`, `/demo`,
  `/privacy`, `/terms`, and the in-app 404 in both browser profiles.
- `/opt/fleet/lib/verify-url.sh`: no console errors; title, `lang`, one `h1`,
  `main`, image alt text, and button names all present.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 1.1 s, CLS 0, TBT 50 ms.
- Production output: JavaScript 32.21 KB raw / 10.90 KB gzip; CSS 21.37 KB
  raw / 5.49 KB gzip. The mobile hero is 23.13 KB.
- Desktop 1440×1000 and mobile 390×844 visual reviews found no horizontal
  overflow. Focus styling, keyboard controls, touch controls, reduced motion,
  dialogs, invalid codes, error states, and offline status were exercised.

## Live verification — 2026-09-02 UTC

- Static and realtime custom domains return HTTPS 200 with managed TLS.
- Local/live SHA-256 identity matches:
  - `app.js`: `422608792fc76657794a7b193cd0cd6dfbb273d4deff90dc9e782123ee93640a`
  - `app.css`: `ebcf78d99c3cf118e4213be6f47d39d1d4b40c3954166d8d6f63a678d808a0fb`
- A host created room `BD77Y`. Its exact `?host=1` URL opened “Choose your
  station” in an isolated 390 px browser context. Signals joined, scanned,
  changed the host fault to “Life Support,” reloaded, and restored the Signals
  role. No console errors occurred.
- A live demo ended through seven visible incorrect-repair actions with the
  heading “The ship needs another crew.” Offline reload restored the active
  demo and its offline status.
- Two-second live frame samples counted 122 desktop and 121 mobile frames.
- The live verifier script reports one `h1`, a `main`, `lang=en`, no missing
  alt text or unnamed buttons, and no browser console errors.
- Static headers include the exact realtime HTTPS/WSS origins in `connect-src`,
  `frame-ancestors 'none'`, `nosniff`, strict referrer policy, and disabled
  camera, microphone, and geolocation.
- Realtime responses are `no-store`, deny framing, allow only the production
  site and local test origins, and return 403 for an untrusted origin.
- The active container revision is healthy in single-revision mode with one
  replica. The unused empty Azure Files share created during deployment
  diagnosis was unmounted and deleted; it contained no user data.

## Storage decision and known gap

Production rooms are intentionally transient in the single realtime process.
They expire after 20 minutes and contain only game state, station roles, and
random tokens. Browser reloads and ordinary network interruptions reconnect.
A container revision restart expires active rooms early.

SQLite is supported and tested for a normal local filesystem, but Azure Files
rejected SQLite locking even on a clean zero-byte database. The game contract
allows transient in-memory rooms, and there is no leaderboard or durable user
record to preserve, so production uses the honest in-memory path. A future
need for restart-surviving rooms should use a container-native persistent store
rather than SQLite over SMB.

## Run and deploy

```sh
npm ci
PORT=8787 DB_PATH=:memory: npm run realtime
npm run dev
npm test
npm run build
```

Deploy `dist/` with the static work-order configuration. Deploy
`Dockerfile.realtime` as `sf-browser-bridge-crew-realtime` on port 8080 in
single-revision, one-replica mode.

## Asset provenance

The existing orbital repair scene remains unchanged. It was generated for this
product with the factory image deployment on 2026-09-02. Its prompt, review,
and source are under `assets/src/`; it contains no text, people, brands, or
recognizable franchise material.
