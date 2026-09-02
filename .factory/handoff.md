# Bridge Crew v1 handoff

## What was built

- A deterministic, 12-minute spaceship repair run with a win state, loss state,
  scoring, integrity, replay, fault timeouts, and seeded fault sequences.
- Four dependent stations: Signals reveals a clue, Helm sets its bearing, Power
  routes its module, and Engineering enters its three-symbol repair code.
- Host and crew routes with five-character room codes. `BroadcastChannel`
  carries actions between tabs, and local room state expires after 20 minutes.
- A complete `/demo` sandbox with a populated sample, isolated `demo:` storage,
  reset, exit, offline reload, and deterministic browser-test hooks.
- Keyboard and touch controls, assist mode, pause-on-hidden behavior, optional
  sound feedback, persistent settings, and a one-action replay.
- Landing, privacy, terms, expired-room, station-picker, and designed 404 views.
- Responsive 390 px layouts, focus styles, reduced-motion handling, semantic
  landmarks, route announcements, and one h1 per route.
- A product-specific cinematic scene generated for this project and optimized
  to 23 KB mobile WebP, 58 KB desktop WebP, and 46 KB Open Graph WebP.
- A versioned service worker, security headers, sitemap, robots file, social
  metadata, favicon, and apple-touch icon.

## How to run and verify

```sh
npm ci
npm test
npm run build
```

The production output is `dist/`, with `dist/index.html` at its root. The demo
entry point is `/demo`.

Verification on 2026-09-02:

- `npm test`: 4 deterministic unit tests and 28 Playwright checks passed.
- Playwright ran desktop Chromium and a 390 px touch-enabled Chromium profile.
- Claim-specific tests cover all 13 records in `.factory/claims.json`.
- Axe found no serious or critical findings on `/`, `/demo`, `/privacy`,
  `/terms`, or the in-app missing-page route in both profiles.
- Browser console inspection found no errors on the home and demo routes.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run build`: passed; app JavaScript is 27.7 KB raw / 9.7 KB gzip and app
  CSS is 20.6 KB raw / 5.4 KB gzip.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.2 s, CLS 0, total blocking time 0 ms.
- A one-second animation-frame sample measured 62 desktop frames and 61 mobile
  emulation frames. The automated floor is 50 frames per second.
- Visual checks at 1440×1000 and 390×844 found no horizontal overflow.

## Known gap and reason

The researched brief asks players to join from separate school devices. This
work order requires a static deployment, while cross-device room discovery
needs a server-owned WebSocket or WebRTC signalling service. Adding an external
relay would violate the privacy and product-ownership rules. This v1 therefore
connects tabs only inside one browser profile and says so on the landing page,
README, and room errors. It is a complete local cooperative run, but it does not
yet satisfy cross-device play.

## Next step

Provision `sf-browser-bridge-crew-realtime` as a product-owned WebSocket service,
then replace the `BroadcastChannel` transport without changing the deterministic
game core. Add room membership, reconnection tokens, and server-enforced expiry.
The service should retain no names, chat, or history and should store transient
rooms only in memory or in SQLite under `/data`.

## Asset provenance

The orbital repair scene was generated with the factory image deployment on
2026-09-02. The full prompt, review, and source are in `assets/src/`. The image
contains no text, people, logos, weapons, or recognizable franchise elements.
The interface icons and bridge schematic are original inline SVG.
