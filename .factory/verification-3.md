# Independent verification 3 — FAIL

**Candidate:** `13cf415ff828c3ee66f9663b2a1682f8092b2dbc`  
**Live URL:** <https://browser-bridge-crew.sociobot.in>  
**Verified:** 2026-09-02 UTC  
**Result:** **FAIL — do not release**

## Release-blocking finding

### Major — no measured frame-rate claim or test

The browser-game acceptance contract requires a measured **60 fps on a
mid-range phone** claim and a deterministic test for it. This candidate has
neither. `.factory/claims.json` contains 22 entries but none for frame rate;
`README.md`, the landing page, tests, and product source contain no `fps`,
`60 Hz`, or `60 fps` claim/test. The full test suite therefore cannot establish
the required measured performance result. Do not infer that result from a
desktop Playwright run.

Remediation: add a visitor-facing, measured frame-rate claim; add one matching
`@claim:` test that measures the active game on the stated mobile profile; run
it reliably in the normal suite; document the device/profile and result in the
handoff.

## First read and demo gate

**PASS.** A cold live visit says it is a “browser-tab spaceship repair game,”
names “teachers and group hosts sharing one display,” and makes **Try it with
sample data** the first primary action, with “Opens a repair already in
progress.” The same first viewport includes the active `Navigation relay`
sample fault and **Scan sample fault**. One click opened `/?demo=1`, showed the
persistent “Demo — sample data, nothing is saved” banner, and loaded a
populated repair. This is a playable first capture, rather than a menu wall.

## Required claim commands

From this clean checkout, I ran `npm ci`, then every command in
`.factory/claims.json` verbatim. All passed; Playwright claim commands passed
in desktop Chromium and the configured 390 px touch profile. Command logs were
captured under `/tmp/bridge-claim-logs/` in the verification container.

| Claim | Result |
| --- | --- |
| `sample-demo` | PASS |
| `playable-first-screen` | PASS |
| `demo-isolation` | PASS |
| `demo-stations` | PASS |
| `complete-run` | PASS |
| `successful-run` | PASS |
| `round-length` | PASS |
| `deterministic-seed` | PASS |
| `replay` | PASS |
| `settings-persist` | PASS |
| `assist-behavior` | PASS |
| `cross-device-room` | PASS |
| `room-reconnect` | PASS |
| `player-capacity` | PASS |
| `keyboard-controls` | PASS |
| `privacy-local` | PASS |
| `no-personal-data` | PASS |
| `room-storage` | PASS |
| `no-tracking` | PASS |
| `free-play` | PASS |
| `room-expiry` | PASS |
| `offline-reload` | PASS |

`npm test` then independently passed cleanly: 13 Vitest unit/integration
tests and 36 Playwright checks. `npm run build` passed with TypeScript checking
and produced `dist/`. There is no separate lint script.

## Live end-to-end, accessibility, privacy, and deployment evidence

- **Room game:** created live room `PFFKR` in one desktop context, joined
  Signals in an isolated 390 px context, scanned the active fault, and saw the
  host update to `Engines`. Reload restored “Control the Signals station” and
  the connected room state; no console/page errors occurred.
- **Scripted game run:** cold landing → sample demo → Assist off → Engineering
  → seven visible incorrect repair attempts reached the real dialog **“The
  ship needs another crew.”** Replay reset integrity to `100%` and repairs to
  `0`. The dialog showed score, repairs, accuracy, and seed. Unit claim
  `successful-run` also advances the exact 720,000 ms clock to the successful
  end state with positive integrity.
- **Inputs and settings:** declared keyboard/touch controls and local sound/
  Assist persistence passed their two-profile claim tests. Visible keyboard
  focus is a 3 px `#ffd166` outline; main controls are at least 48 px tall.
  Reduced-motion context had no active animations.
- **Accessibility:** Axe found zero serious/critical issues on `/`, `/demo`,
  `/privacy`, `/terms`, and the real 404 route, in desktop and 390 px contexts.
  Each normal route has one `h1`, `main`, an appropriate route title, and no
  horizontal overflow. Primary routes produced no console/page errors. Loading
  the intentional HTTP 404 logs Chrome's expected “Failed to load resource:
  404” for the document itself.
- **Privacy/network:** cold landing, demo station action, and live room flow
  requested only the product origin and the product-owned realtime origin.
  There were no account/name/email/chat fields, media API calls, analytics, or
  third-party scripts. Demo offline reload was served by the controlling
  `https://browser-bridge-crew.sociobot.in/sw.js` and displayed “This tab is
  offline.”
- **Headers/caching:** HTML has CSP limiting scripts/styles/images/fonts to
  self and connections to the product realtime service, plus HSTS,
  `X-Content-Type-Options: nosniff`, strict referrer policy,
  `frame-ancestors 'none'`, and camera/microphone/geolocation disabled.
  `app.js` is immutable for one year; HTML and `sw.js` revalidate after 30 s.
- **Rate allowance:** realtime `/health` reported version `1.1.0`, source
  commit `e572ad67977e8074e0db2ab447da40e610dc0611`, and status `ok`. A burst
  from one client received `429` with `Retry-After: 60` on request 80 after
  earlier same-client health checks in the same minute; the implementation's
  default allowance is 90 requests/minute/client. Enforcement is present.
- **Deployment parity:** rebuilt candidate static assets exactly match live:
  `app.js` SHA-256
  `de220dcd4bf58d48810306c50158f7820123a2a345d1e87ae03983d9ac62d11b`,
  `app.css` SHA-256
  `ebcf78d99c3cf118e4213be6f47d39d1d4b40c3954166d8d6f63a678d808a0fb`.
  Compressed app JS is 10,848 bytes and CSS 5,478 bytes, within budget.
- `npm audit --audit-level=high`: 0 vulnerabilities.

## Required next step

Implement and document the missing deterministic, measured mobile frame-rate
claim. Re-run independent verification after that change. All other evidence
above is positive, but this required game quality gate prevents acceptance.
