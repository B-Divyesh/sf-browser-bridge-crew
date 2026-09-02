# Independent verification 2 — PASS

**Candidate:** `88265b72eac37f0bb0563f56e47ae34664477e9f`  
**Live URL:** https://browser-bridge-crew.sociobot.in  
**Verified:** 2026-09-02 UTC  
**Result:** **PASS — release candidate accepted**

## First-read and demo gate

Cold live `/` answered the required questions in plain words: it is a
“browser-tab spaceship repair game,” for “teachers and group hosts sharing one
display,” and the first primary action is **Try it with sample data**, explained
as “Opens a repair already in progress.” The first viewport also contains a
working **Scan sample fault** control; its scanned clue is visible before
scrolling. The one-click action opens `/demo` with the persistent “Demo —
sample data, nothing is saved” banner and a populated repair. This passes the
plain-words, demo-sandbox, and browser-game first-capture requirements.

## Required claims tests

`.factory/claims.json` exists and has 16 claims. After `npm ci`, every listed
command was run from this clean candidate via the documented demo entry point.
All passed. The final clean `npm test` independently repeated the full suite:
8 Vitest unit/integration tests plus 30 Playwright checks (desktop Chromium and
390 px touch Chromium) passed in 1.2 minutes.

| Claims exercised | Result |
| --- | --- |
| sample demo, playable first screen, complete run, 12-minute clock, replay, settings persistence | PASS in both browser profiles |
| deterministic seed, room expiry, HTTP rate limit | PASS in Vitest |
| cross-device room, reconnect | PASS in separate browser contexts |
| keyboard/touch, frame rate, privacy/local demo, free play, offline reload | PASS in both browser profiles |

The scripted end-to-end test reaches the real loss dialog using seven visible
incorrect Engineering repairs with Assist disabled; it uses no private finish
hook. Replay resets repairs to `0` and integrity to `100%`. The frame test
requires at least 90 animation frames in two seconds and passed in both
profiles.

## Local build and deployment identity

- `npm ci`: PASS; `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run build`: PASS. `dist/` was produced. JavaScript is 32,207 bytes raw /
  10.90 KB gzip; CSS is 21,369 bytes raw / 5.49 KB gzip.
- The rebuilt candidate exactly matches live static assets:
  - `app.js`: `422608792fc76657794a7b193cd0cd6dfbb273d4deff90dc9e782123ee93640a`
  - `app.css`: `ebcf78d99c3cf118e4213be6f47d39d1d4b40c3954166d8d6f63a678d808a0fb`
- Live realtime `/health` returns version `1.1.0` and source commit
  `1d51d3cd33501a024e10aa07aa4f89a0e3f6ada4`. The candidate differs from that
  commit only in `.factory/handoff.md`, so this is the expected deployed code
  identity for candidate `88265b7`.

## Live product QA

- A live host created room `PKU98`; an isolated 390 px browser joined Signals,
  scanned the fault, and changed the host state to **Life Support**. Reloading
  the station restored **Control the Signals station**. No console or page
  errors occurred.
- Live `/demo` was played from active repair to the real end dialog **The ship
  needs another crew** at `0%` integrity. The visible dialog reported score,
  repairs, accuracy, seed, and offered **Play this seed again**.
- Service worker `/sw.js` controlled the demo after first load. A fresh context
  reloaded `/demo` offline and displayed “This tab is offline.” The worker
  precaches/version-controls the shell (`bridge-crew-v3`) and claims clients on
  activation.
- Desktop and 390 px mobile visual checks found the game controls usable with
  no horizontal overflow. Keyboard station controls, touch controls, visible
  focus styling, invalid room-code error/recovery, and reduced-motion CSS were
  covered by the browser suite and live smoke checks.
- Axe found **zero serious or critical violations** on `/`, `/demo`, `/privacy`,
  `/terms`, and the 404 route in desktop and mobile. `verify-url.sh` reported
  HTTPS 200, title, `lang=en`, one `h1`, `main`, no missing image alt text, no
  unnamed buttons, and no browser console errors.

## Privacy, headers, and request allowance

- During a fresh live demo plus a Helm action, requests went only to
  `https://browser-bridge-crew.sociobot.in` (document, self-hosted JS/CSS,
  image, and font). No email/name inputs, analytics, third-party scripts, or
  foreign requests were observed. The demo does not open the realtime service.
- Static responses send CSP with only the product realtime HTTPS/WSS origins in
  `connect-src`, `frame-ancestors 'none'`, `nosniff`, strict referrer policy,
  HSTS, and camera/microphone/geolocation disabled. `app.js` is cached
  immutable for one year; HTML and `sw.js` are short revalidated.
- The product realtime service returned `no-store`, `default-src 'none'`, and
  `frame-ancestors 'none'`. With one test client identity, requests 1–90 to
  `/health` returned 200 and request 91 returned **429** with
  `Retry-After: 60`; observed allowance: **90 requests per minute per client**.

## Defects

None found. No release-blocking, critical, major, or minor defects remain from
this verification.
